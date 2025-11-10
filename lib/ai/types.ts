import type { Job, Resume } from '@/db/schema';

export interface MCQOption {
	id: string;
	text: string;
}

export interface MCQQuestion {
	question: string;
	options: MCQOption[];
}

export interface AIMessage {
	role: 'user' | 'assistant';
	content: string;
}

export interface AIResponse {
	content: string;
	messageType: 'text' | 'mcq';
	mcqData?: MCQQuestion;
	phase: 'introduction' | 'questions' | 'closing';
	questionIndex: number;
}

export interface AIGenerateParams {
	job: Job;
	resume: Resume;
	conversationHistory: AIMessage[];
	userMessage: string;
	currentQuestionIndex: number;
	mcqCount: number;
}

export interface AIProvider {
	generateResponse(params: AIGenerateParams): Promise<AIResponse>;
}

