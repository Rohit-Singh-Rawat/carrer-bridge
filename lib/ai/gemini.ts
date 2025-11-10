import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText } from 'ai';
import { env } from '@/env';
import type { AIGenerateParams, AIResponse, MCQQuestion } from './types';

const google = createGoogleGenerativeAI({
	apiKey: env.GOOGLE_GEMINI_API_KEY,
});

function buildSystemPrompt(params: AIGenerateParams): string {
	const { job, resume, currentQuestionIndex, mcqCount } = params;

	const totalQuestions = 5;
	const shouldForceMCQ = currentQuestionIndex >= 3 && mcqCount === 0;

	const phase =
		currentQuestionIndex === 0
			? 'introduction'
			: currentQuestionIndex >= totalQuestions - 1
				? 'closing'
				: 'questions';

	const skills = job.skills || 'Not specified';
	const requirements = job.requirements || 'Not specified';

	let phaseInstructions = '';
	if (phase === 'introduction') {
		phaseInstructions =
			'This is the introduction phase. Welcome the candidate warmly and ask them to introduce themselves.';
	} else if (phase === 'questions') {
		phaseInstructions = `This is question ${currentQuestionIndex + 1} of ${totalQuestions}. Ask a relevant question about their experience, skills, or background.`;
		if (shouldForceMCQ || (currentQuestionIndex === 2 && mcqCount === 0)) {
			phaseInstructions += ' YOU MUST ask a multiple-choice question this time.';
		}
	} else if (phase === 'closing') {
		phaseInstructions =
			'This is the closing phase. Thank the candidate for their time and explain the next steps.';
	}

	return `You are an AI interviewer conducting a professional interview for the position of ${job.title}.

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
- For MCQ questions: You MUST respond in this EXACT JSON format:
{
  "type": "mcq",
  "question": "Your question here?",
  "options": [
    {"id": "a", "text": "First option"},
    {"id": "b", "text": "Second option"},
    {"id": "c", "text": "Third option"},
    {"id": "d", "text": "Fourth option"}
  ]
}

Remember: Keep responses under 100 words. Be engaging but concise.`;
}

function parseAIResponse(
	response: string,
	currentQuestionIndex: number
): Omit<AIResponse, 'questionIndex'> {
	try {
		const jsonMatch = response.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			const parsed = JSON.parse(jsonMatch[0]);
			if (parsed.type === 'mcq' && parsed.question && parsed.options) {
				return {
					content: parsed.question,
					messageType: 'mcq',
					mcqData: {
						question: parsed.question,
						options: parsed.options,
					},
					phase:
						currentQuestionIndex === 0
							? 'introduction'
							: currentQuestionIndex >= 4
								? 'closing'
								: 'questions',
				};
			}
		}
	} catch (e) {
		// Fall through to text response
	}

	return {
		content: response,
		messageType: 'text',
		phase:
			currentQuestionIndex === 0
				? 'introduction'
				: currentQuestionIndex >= 4
					? 'closing'
					: 'questions',
	};
}

export async function generateAIResponse(params: AIGenerateParams): Promise<AIResponse> {
	const systemPrompt = buildSystemPrompt(params);

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

	try {
		const result = await generateText({
			model: google('gemini-2.0-flash-exp'),
			system: systemPrompt,
			messages,
			temperature: 0.7,
			maxTokens: 300,
		});

		const parsedResponse = parseAIResponse(result.text, params.currentQuestionIndex);

		return {
			...parsedResponse,
			questionIndex: params.currentQuestionIndex + 1,
		};
	} catch (error) {
		console.error('AI generation error:', error);

		const fallbackPhase =
			params.currentQuestionIndex === 0
				? 'introduction'
				: params.currentQuestionIndex >= 4
					? 'closing'
					: 'questions';

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

