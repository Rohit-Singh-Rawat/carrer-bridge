import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { env } from '@/env';
import { INTERVIEW_CONFIG } from '@/lib/constants/interview-constants';
import type { AIGenerateParams, AIResponse, MCQQuestion } from './types';

const google = createGoogleGenerativeAI({
	apiKey: env.GOOGLE_GEMINI_API_KEY,
});

function buildSystemPrompt(params: AIGenerateParams): string {
	const { job, resume, currentQuestionIndex, mcqCount } = params;

	const totalQuestions = INTERVIEW_CONFIG.TOTAL_QUESTIONS;
	const shouldForceMCQ = currentQuestionIndex >= 3 && mcqCount === 0;

	const phase =
		currentQuestionIndex === 0
			? 'introduction'
			: currentQuestionIndex >= totalQuestions
			? 'closing'
			: 'questions';

	const skills = job.skills || 'Not specified';
	const requirements = job.requirements || 'Not specified';

	let phaseInstructions = '';
	if (phase === 'introduction') {
		phaseInstructions =
			'This is the introduction phase. Welcome the candidate warmly and ask them to introduce themselves.';
	} else if (phase === 'questions') {
		phaseInstructions = `This is question ${
			currentQuestionIndex + 1
		} of ${totalQuestions}. Ask a relevant question about their experience, skills, or background.`;
		if (shouldForceMCQ || (currentQuestionIndex === 2 && mcqCount === 0)) {
			phaseInstructions += ' YOU MUST ask a multiple-choice question this time.';
		}
	} else if (phase === 'closing') {
		phaseInstructions =
			'This is the closing phase. Thank the candidate for their time and explain the next steps.';
	}

	return `You are an AI interviewer conducting a professional interview for the position of ${
		job.title
	}.

Job Context:
- Title: ${job.title}
- Location: ${job.location}
- Job Type: ${job.jobType}
- Experience Level: ${job.experienceLevel}
- Required Skills: ${skills}
- Requirements: ${requirements}
- Description: ${job.description.substring(0, 500)}...

Candidate Resume:
- Title: ${resume.title}
- Description: ${resume.description || 'Not provided'}

Interview Rules:
1. Ask a total of ${totalQuestions} questions including the introduction
2. Include AT LEAST 1 multiple-choice question across the interview
3. Keep the interview conversational and professional
4. Be warm but maintain professionalism
5. Adapt your questions based on candidate responses
6. Make questions relevant to the job requirements

Current State:
- Phase: ${phase}
- Question: ${currentQuestionIndex + 1} of ${totalQuestions}
- MCQ questions asked so far: ${mcqCount}

${phaseInstructions}

Response Format:
- For TEXT questions: Respond naturally as a conversational interviewer. Be concise and direct.
- For MCQ questions: Respond with ONLY valid JSON in this EXACT format (no additional text):
{
  "type": "mcq",
  "question": "Your question here?",
  "options": [
    {"id": "a", "text": "First option"},
    {"id": "b", "text": "Second option"},
    {"id": "c", "text": "Third option"},
    {"id": "d", "text": "Fourth option"}
  ],
  "correctOption": "a"
}

Remember: Keep responses under 100 words. Be engaging but concise.`;
}

// MCQ response schema for validation
const mcqResponseSchema = z.object({
	type: z.literal('mcq'),
	question: z.string(),
	options: z.array(
		z.object({
			id: z.enum(['a', 'b', 'c', 'd']),
			text: z.string(),
		})
	),
	correctOption: z.enum(['a', 'b', 'c', 'd']),
});

export async function generateAIResponse(params: AIGenerateParams): Promise<AIResponse> {
	console.log('[Gemini AI] Starting AI response generation', {
		currentQuestionIndex: params.currentQuestionIndex,
		mcqCount: params.mcqCount,
		jobTitle: params.job.title,
	});

	const systemPrompt = buildSystemPrompt(params);
	const shouldForceMCQ = params.currentQuestionIndex >= 3 && params.mcqCount === 0;

	const messages = [
		...params.conversationHistory.map((msg) => ({
			role: msg.role,
			content: msg.content,
		})),
		{
			role: 'user' as const,
			content: params.userMessage,
		},
	];

	// Add instruction for MCQ format if needed
	if (shouldForceMCQ || (params.currentQuestionIndex === 2 && params.mcqCount === 0)) {
		messages.push({
			role: 'user' as const,
			content: 'Please ask a multiple-choice question now in the JSON format specified.',
		});
	}

	try {
		console.log('[Gemini AI] Calling Gemini API with', {
			messageCount: messages.length,
			systemPromptLength: systemPrompt.length,
			shouldForceMCQ,
		});

		const result = await generateText({
			model: google('gemini-2.0-flash-lite'),
			system: systemPrompt,
			messages,
			temperature: 0.7,
			maxOutputTokens: 300,
		});

		console.log('[Gemini AI] Received response from Gemini:', {
			textLength: result.text.length,
			text: result.text.substring(0, 200),
		});

		const phase =
			params.currentQuestionIndex === 0
				? 'introduction'
				: params.currentQuestionIndex >= INTERVIEW_CONFIG.TOTAL_QUESTIONS
				? 'closing'
				: 'questions';

		// Try to parse as MCQ JSON
		try {
			const jsonMatch = result.text.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				const parsed = JSON.parse(jsonMatch[0]);
				const validated = mcqResponseSchema.safeParse(parsed);

				if (validated.success) {
					console.log('[Gemini AI] Valid MCQ response parsed');
					return {
						content: validated.data.question,
						messageType: 'mcq',
						mcqData: {
							question: validated.data.question,
							options: validated.data.options,
							correctOption: validated.data.correctOption,
						},
						phase,
						questionIndex: params.currentQuestionIndex + 1,
					};
				}
			}
		} catch (parseError) {
			console.log('[Gemini AI] Not a JSON MCQ response, treating as text');
		}

		// Regular text response
		console.log('[Gemini AI] Regular text response');
		return {
			content: result.text,
			messageType: 'text',
			phase,
			questionIndex: params.currentQuestionIndex + 1,
		};
	} catch (error) {
		console.error('[Gemini AI] AI generation error:', error);
		console.error('[Gemini AI] Error details:', {
			name: error instanceof Error ? error.name : 'Unknown',
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
		});

		const fallbackPhase =
			params.currentQuestionIndex === 0
				? 'introduction'
				: params.currentQuestionIndex >= INTERVIEW_CONFIG.TOTAL_QUESTIONS
				? 'closing'
				: 'questions';

		console.log('[Gemini AI] Using fallback response due to error');

		return {
			content:
				'Thank you for that response. Could you tell me more about your experience with the key requirements for this role?',
			messageType: 'text',
			phase: fallbackPhase,
			questionIndex: params.currentQuestionIndex + 1,
		};
	}
}

export function shouldGenerateMCQ(
	questionIndex: number,
	totalQuestions: number,
	mcqCount: number
): boolean {
	if (questionIndex >= totalQuestions - 1) return false;
	if (mcqCount > 0) return false;
	if (questionIndex >= 3) return true;

	return questionIndex === 2 && mcqCount === 0;
}
