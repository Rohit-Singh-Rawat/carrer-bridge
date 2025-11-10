import type {
	Interview,
	InterviewMessage,
	MonitoringImage,
	Job,
	Resume,
	Application,
} from '@/db/schema';

export type { Interview, InterviewMessage, MonitoringImage };

export type InterviewStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type MessageRole = 'user' | 'assistant';
export type MessageType = 'text' | 'mcq';
export type InterviewPhase = 'introduction' | 'questions' | 'closing';

export interface MCQQuestion {
	question: string;
	options: MCQOption[];
}

export interface MCQOption {
	id: string;
	text: string;
}

export interface InterviewSettings {
	difficulty: 'easy' | 'medium' | 'hard';
	totalQuestions: number;
	mcqMinCount: number;
	maxDuration: number;
}

export interface InterviewMetrics {
	duration: number;
	questionsAnswered: number;
	mcqCount: number;
	mcqCorrect?: number;
}

export interface SpeechRecognitionResult {
	transcript: string;
	confidence: number;
	isFinal: boolean;
}

export interface InterviewContext {
	interview: Interview;
	application: Application & {
		job: Job;
		resume: Resume;
	};
	messages: InterviewMessage[];
}

export interface InterviewState {
	status: 'idle' | 'starting' | 'in_progress' | 'ending' | 'completed';
	phase: InterviewPhase;
	currentQuestion: number;
	totalQuestions: number;
	mcqCount: number;
	remainingTime: number;
	startTime: Date | null;
}

export interface CameraDevice {
	deviceId: string;
	label: string;
	kind: 'videoinput' | 'audioinput';
}

export interface MediaStreamError {
	name: string;
	message: string;
	constraint?: string;
}

