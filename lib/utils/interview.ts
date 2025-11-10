import type { Job, Resume } from '@/db/schema';
import type { MCQQuestion, AIMessage } from '@/lib/ai/types';

export function formatDuration(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = seconds % 60;
	return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function calculateRemainingTime(startTime: Date, maxDuration: number): number {
	const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
	return Math.max(0, maxDuration - elapsed);
}

export function generateMCQPrompt(
	context: { job: Job; resume: Resume },
	questionIndex: number,
	conversationHistory: AIMessage[]
): string {
	return `Based on the conversation so far and the job requirements for ${context.job.title}, generate a multiple-choice question to assess the candidate's knowledge or experience. Make it relevant to: ${context.job.skills}.

Respond in this JSON format:
{
  "type": "mcq",
  "question": "Your question here?",
  "options": [
    {"id": "a", "text": "First option"},
    {"id": "b", "text": "Second option"},
    {"id": "c", "text": "Third option"},
    {"id": "d", "text": "Fourth option"}
  ]
}`;
}

export function parseAIResponse(response: string): {
	messageType: 'text' | 'mcq';
	content: string;
	mcqData?: MCQQuestion;
} {
	try {
		const jsonMatch = response.match(/\{[\s\S]*\}/);
		if (jsonMatch) {
			const parsed = JSON.parse(jsonMatch[0]);
			if (parsed.type === 'mcq' && parsed.question && parsed.options) {
				return {
					messageType: 'mcq',
					content: parsed.question,
					mcqData: {
						question: parsed.question,
						options: parsed.options,
					},
				};
			}
		}
	} catch (e) {
		// Fall through to text response
	}

	return {
		messageType: 'text',
		content: response,
	};
}

export function buildInterviewContext(job: Job, resume: Resume): string {
	return `Job: ${job.title}
Location: ${job.location}
Type: ${job.jobType}
Experience Level: ${job.experienceLevel}
Skills: ${job.skills || 'Not specified'}
Requirements: ${job.requirements ? job.requirements.substring(0, 200) : 'Not specified'}

Resume: ${resume.title}
Description: ${resume.description || 'Not provided'}`;
}

export function shouldGenerateMCQ(
	questionIndex: number,
	totalQuestions: number,
	mcqGeneratedCount: number
): boolean {
	if (questionIndex >= totalQuestions - 1) return false;

	if (mcqGeneratedCount > 0) return false;

	if (questionIndex >= 3) return true;

	return questionIndex === 2 && mcqGeneratedCount === 0;
}

export function getTimerColor(remainingSeconds: number): string {
	if (remainingSeconds > 120) return 'text-green-600';
	if (remainingSeconds > 60) return 'text-yellow-600';
	return 'text-red-600';
}

export function getTimerBgColor(remainingSeconds: number): string {
	if (remainingSeconds > 120) return 'bg-green-50 border-green-200';
	if (remainingSeconds > 60) return 'bg-yellow-50 border-yellow-200';
	return 'bg-red-50 border-red-200';
}

export function captureVideoFrame(videoElement: HTMLVideoElement): Promise<Blob> {
	return new Promise((resolve, reject) => {
		try {
			const canvas = document.createElement('canvas');
			canvas.width = videoElement.videoWidth;
			canvas.height = videoElement.videoHeight;

			const ctx = canvas.getContext('2d');
			if (!ctx) {
				reject(new Error('Could not get canvas context'));
				return;
			}

			ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

			canvas.toBlob(
				(blob) => {
					if (blob) {
						resolve(blob);
					} else {
						reject(new Error('Failed to create blob from canvas'));
					}
				},
				'image/jpeg',
				0.8
			);
		} catch (error) {
			reject(error);
		}
	});
}

export function blobToBase64(blob: Blob): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onloadend = () => {
			if (typeof reader.result === 'string') {
				resolve(reader.result);
			} else {
				reject(new Error('Failed to convert blob to base64'));
			}
		};
		reader.onerror = reject;
		reader.readAsDataURL(blob);
	});
}

export function generateImageKey(interviewId: string, timestamp: number): string {
	return `interviews/${interviewId}/snapshots/${timestamp}.jpg`;
}

export function validateInterviewEligibility(
	status: string,
	interviewEligible: number
): { eligible: boolean; reason?: string } {
	if (interviewEligible !== 1) {
		return {
			eligible: false,
			reason: 'Interview not scheduled by recruiter',
		};
	}

	if (status !== 'reviewed') {
		return {
			eligible: false,
			reason: 'Application must be reviewed before interview',
		};
	}

	return { eligible: true };
}

export function isBrowserCompatible(): { compatible: boolean; reason?: string } {
	if (typeof window === 'undefined') {
		return { compatible: false, reason: 'Not running in browser' };
	}

	if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
		return {
			compatible: false,
			reason: 'getUserMedia not supported',
		};
	}

	const hasSpeechRecognition = Boolean(
		window.SpeechRecognition || (window as any).webkitSpeechRecognition
	);
	if (!hasSpeechRecognition) {
		return {
			compatible: false,
			reason: 'Speech Recognition not supported (Use Chrome or Edge)',
		};
	}

	if (!('speechSynthesis' in window)) {
		return {
			compatible: false,
			reason: 'Text-to-Speech not supported',
		};
	}

	return { compatible: true };
}

