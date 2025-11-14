'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { applications, interviews, interviewMessages } from '@/db/schema';
import { generateAIResponse } from '@/lib/ai/gemini';
import { INTERVIEW_CONFIG } from '@/lib/constants/interview-constants';

/**
 * Types matching what the UI components expect
 */
export interface ConversationMessage {
	role: 'user' | 'assistant';
	content: string;
	timestamp: Date;
}

export interface InterviewPhase {
	current:
		| 'introduction'
		| 'candidate_intro'
		| 'questions'
		| 'technical'
		| 'behavioral'
		| 'closing';
	questionIndex: number;
	totalQuestions: number;
}

interface MCQData {
	question: string;
	options: Array<{ id: string; text: string }>;
	correctOption?: string;
}

interface AIInterviewResponse {
	success: boolean;
	nextQuestion?: string;
	messageType?: 'text' | 'mcq';
	mcqData?: MCQData;
	phase?: InterviewPhase;
	error?: string;
}

/**
 * Map application phases to valid database enum values
 * DB only accepts: 'introduction' | 'questions' | 'closing'
 */
function mapPhaseToDb(phase: string): 'introduction' | 'questions' | 'closing' {
	if (phase === 'introduction' || phase === 'candidate_intro') {
		return 'introduction';
	}
	if (phase === 'closing') {
		return 'closing';
	}
	// technical, behavioral, questions -> 'questions'
	return 'questions';
}

/**
 * Generate interview introduction for a candidate
 */
export async function generateInterviewIntroductionWithUuid(
	applicationUuid: string
): Promise<AIInterviewResponse> {
	try {
		console.log('[AI Interview] Generating introduction for application:', applicationUuid);

		// This function generates a static introduction
		// The actual application data isn't needed for the introduction
		const introText = `Hello! I'm CareerBridge AI and it's wonderful to meet you. I'll be conducting your interview today and I'm genuinely excited to learn about your background and experience. We have a structured conversation planned with thoughtful questions to assess your qualifications for this role. I'll provide feedback and encouragement throughout our discussion to help guide our conversation. To get us started, could you please share a brief introduction about yourself and what brings you to this opportunity? I'd love to hear your story.`;

		console.log('[AI Interview] Introduction generated successfully');

		return {
			success: true,
			nextQuestion: introText,
			phase: {
				current: 'introduction',
				questionIndex: 0,
				totalQuestions: INTERVIEW_CONFIG.TOTAL_QUESTIONS,
			},
		};
	} catch (error) {
		console.error('[AI Interview] Error generating interview introduction:', error);
		return {
			success: false,
			error: 'Failed to generate introduction',
		};
	}
}

/**
 * Generate AI interview response based on conversation history
 */
export async function generateAIInterviewResponseWithUuid(
	conversationHistory: ConversationMessage[],
	userMessage: string,
	applicationUuid: string,
	phase: InterviewPhase
): Promise<AIInterviewResponse> {
	try {
		// Fetch application with job and resume data
		const application = await db.query.applications.findFirst({
			where: eq(applications.id, applicationUuid),
			with: {
				job: true,
				resume: true,
			},
		});

		if (!application) {
			throw new Error('Application not found');
		}

		// Get or create interview record
		let interview = await db.query.interviews.findFirst({
			where: eq(interviews.applicationId, application.id),
			with: {
				messages: {
					orderBy: (messages, { asc }) => [asc(messages.timestamp)],
				},
			},
		});

		if (!interview) {
			// Create new interview if it doesn't exist
			const [newInterview] = await db
				.insert(interviews)
				.values({
					applicationId: application.id,
					status: 'in_progress',
					startedAt: new Date(),
				})
				.returning();
			interview = newInterview as any;
		}

		// Ensure interview.id exists before proceeding
		if (!interview?.id) {
			throw new Error('Failed to create or retrieve interview');
		}

		// Convert conversation history to AI format
		const aiConversationHistory = conversationHistory.map((msg) => ({
			role: msg.role,
			content: msg.content,
		}));

		// Calculate current question index and MCQ count
		const messageCount =
			interview?.messages?.filter((m: any) => m.role === 'assistant').length || 0;
		const mcqCount = interview?.messages?.filter((m: any) => m.messageType === 'mcq').length || 0;

		// Save user message first
		await db.insert(interviewMessages).values({
			interviewId: interview.id,
			role: 'user',
			content: userMessage,
			messageType: 'text',
			phase: mapPhaseToDb(phase.current),
			questionIndex: phase.questionIndex,
			timestamp: new Date(),
		});

		// Generate AI response
		console.log('[AI Interview] Generating AI response for:', {
			applicationId: application.id,
			messageCount,
			mcqCount,
			phase: phase.current,
		});

		const aiResponse = await generateAIResponse({
			job: application.job,
			resume: application.resume,
			conversationHistory: aiConversationHistory,
			userMessage,
			currentQuestionIndex: messageCount,
			mcqCount,
		});

		console.log('[AI Interview] AI response generated:', {
			content: aiResponse.content.substring(0, 100) + '...',
			messageType: aiResponse.messageType,
			phase: aiResponse.phase,
			questionIndex: aiResponse.questionIndex,
		});

		// Save AI response with MCQ data if available
		const mcqDataToStore = aiResponse.mcqData
			? {
					question: aiResponse.mcqData.question,
					options: aiResponse.mcqData.options,
					correctOption: aiResponse.mcqData.correctOption,
			  }
			: null;

		await db.insert(interviewMessages).values({
			interviewId: interview.id,
			role: 'assistant',
			content: aiResponse.content,
			messageType: aiResponse.messageType,
			mcqOptions: mcqDataToStore ? JSON.stringify(mcqDataToStore) : null,
			phase: mapPhaseToDb(aiResponse.phase),
			questionIndex: aiResponse.questionIndex,
			timestamp: new Date(),
		});

		// Determine next phase
		const nextPhase = determineNextPhase(aiResponse.questionIndex, phase.totalQuestions);

		return {
			success: true,
			nextQuestion: aiResponse.content,
			messageType: aiResponse.messageType,
			mcqData: aiResponse.mcqData,
			phase: nextPhase,
		};
	} catch (error) {
		console.error('Error generating AI interview response:', error);

		// Return fallback response
		return {
			success: false,
			error: 'Failed to generate response',
		};
	}
}

/**
 * Complete interview and update status
 */
export async function completeInterview(applicationUuid: string): Promise<{ success: boolean; error?: string }> {
	try {
		// Get interview by application ID
		const interview = await db.query.interviews.findFirst({
			where: eq(interviews.applicationId, applicationUuid),
		});

		if (!interview) {
			return { success: false, error: 'Interview not found' };
		}

		// Calculate duration
		const completedAt = new Date();
		const duration = interview.startedAt
			? Math.floor((completedAt.getTime() - interview.startedAt.getTime()) / 1000)
			: 0;

		// Update interview status to completed
		await db
			.update(interviews)
			.set({
				status: 'completed',
				completedAt,
				duration,
			})
			.where(eq(interviews.id, interview.id));

		// Update application status
		await db
			.update(applications)
			.set({
				status: 'in_progress',
			})
			.where(eq(applications.id, applicationUuid));

		return { success: true };
	} catch (error) {
		console.error('Error completing interview:', error);
		return { success: false, error: 'Failed to complete interview' };
	}
}

/**
 * Determine the next interview phase based on question index
 */
function determineNextPhase(questionIndex: number, totalQuestions: number): InterviewPhase {
	if (questionIndex === 0) {
		return {
			current: 'introduction',
			questionIndex: 0,
			totalQuestions,
		};
	}

	if (questionIndex === 1) {
		return {
			current: 'candidate_intro',
			questionIndex: 1,
			totalQuestions,
		};
	}

	// Only move to closing when we've reached the LAST question (not before)
	if (questionIndex >= totalQuestions) {
		return {
			current: 'closing',
			questionIndex,
			totalQuestions,
		};
	}

	// Alternate between technical and behavioral questions
	const midPoint = Math.floor(totalQuestions / 2);
	if (questionIndex <= midPoint) {
		return {
			current: 'technical',
			questionIndex,
			totalQuestions,
		};
	}

	return {
		current: 'behavioral',
		questionIndex,
		totalQuestions,
	};
}
