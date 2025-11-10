'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { calculateRemainingTime } from '@/lib/utils/interview';
import type { InterviewPhase, InterviewState } from '@/types/interview';

interface UseInterviewStateOptions {
	maxDuration?: number;
	totalQuestions?: number;
	onTimeExpired?: () => void;
}

export function useInterviewState({
	maxDuration = 300,
	totalQuestions = 5,
	onTimeExpired,
}: UseInterviewStateOptions = {}) {
	const [state, setState] = useState<InterviewState['status']>('idle');
	const [phase, setPhase] = useState<InterviewPhase>('introduction');
	const [currentQuestion, setCurrentQuestion] = useState(0);
	const [mcqCount, setMcqCount] = useState(0);
	const [remainingTime, setRemainingTime] = useState(maxDuration);
	const [startTime, setStartTime] = useState<Date | null>(null);
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	const startInterview = useCallback(() => {
		const now = new Date();
		setState('in_progress');
		setPhase('introduction');
		setCurrentQuestion(0);
		setMcqCount(0);
		setStartTime(now);
		console.log('Interview started at:', now);
	}, []);

	const endInterview = useCallback(() => {
		setState('completed');
		if (timerRef.current) {
			clearInterval(timerRef.current);
		}
	}, []);

	const nextQuestion = useCallback(() => {
		setCurrentQuestion((prev) => {
			const next = prev + 1;

			if (next >= totalQuestions - 1) {
				setPhase('closing');
			} else if (next > 0) {
				setPhase('questions');
			}

			return next;
		});
	}, [totalQuestions]);

	const incrementMCQ = useCallback(() => {
		setMcqCount((prev) => prev + 1);
	}, []);

	const updatePhase = useCallback((newPhase: InterviewPhase) => {
		setPhase(newPhase);
	}, []);

	useEffect(() => {
		if (state === 'in_progress' && startTime) {
			console.log('Starting timer countdown...');
			
			timerRef.current = setInterval(() => {
				const remaining = calculateRemainingTime(startTime, maxDuration);
				setRemainingTime(remaining);

				if (remaining <= 0) {
					if (timerRef.current) {
						clearInterval(timerRef.current);
					}
					setState('ending');
					onTimeExpired?.();
				}
			}, 1000);

			return () => {
				if (timerRef.current) {
					clearInterval(timerRef.current);
				}
			};
		}
	}, [state, startTime, maxDuration, onTimeExpired]);

	return {
		state,
		phase,
		currentQuestion,
		mcqCount,
		remainingTime,
		startTime,
		totalQuestions,
		startInterview,
		endInterview,
		nextQuestion,
		incrementMCQ,
		updatePhase,
	};
}

