import { env } from '@/env';

/**
 * Interview configuration constants
 * These can be overridden via environment variables
 */
export const INTERVIEW_CONFIG = {
	/**
	 * Total number of questions in an interview (including intro)
	 * Can be overridden via NEXT_PUBLIC_INTERVIEW_TOTAL_QUESTIONS env var
	 */
	TOTAL_QUESTIONS:
		parseInt(process.env.NEXT_PUBLIC_INTERVIEW_TOTAL_QUESTIONS || '8', 10) || 8,

	/**
	 * Maximum interview duration in seconds
	 * Defaults to 1800 seconds (30 minutes)
	 * Can be overridden via NEXT_PUBLIC_INTERVIEW_MAX_DURATION env var
	 */
	MAX_DURATION_SECONDS: parseInt(env.NEXT_PUBLIC_INTERVIEW_MAX_DURATION, 10) || 1800,

	/**
	 * Minimum number of MCQ questions to ask
	 */
	MIN_MCQ_QUESTIONS: 1,

	/**
	 * Snapshot interval in seconds for monitoring
	 */
	SNAPSHOT_INTERVAL_SECONDS: parseInt(env.NEXT_PUBLIC_SNAPSHOT_INTERVAL, 10) || 10,
} as const;


