'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SpeechRecognitionManager } from '@/lib/speech/speech-to-text';

interface UseSpeechRecognitionOptions {
	enabled: boolean;
	onTranscript?: (text: string) => void;
	onEnd?: () => void;
	language?: string;
	minWordThreshold?: number;
}

export function useSpeechRecognitionHook({
	enabled,
	onTranscript,
	onEnd,
	language = 'en-US',
	minWordThreshold = 3,
}: UseSpeechRecognitionOptions) {
	const [isListening, setIsListening] = useState(false);
	const [transcript, setTranscript] = useState('');
	const [interimTranscript, setInterimTranscript] = useState('');
	const [error, setError] = useState<string | null>(null);
	const managerRef = useRef<SpeechRecognitionManager | null>(null);

	useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		managerRef.current = new SpeechRecognitionManager(
			{
				language,
				continuous: true,
				interimResults: true,
			},
			{
				onStart: () => {
					setIsListening(true);
					setError(null);
				},
				onTranscript: (text, isFinal) => {
					if (isFinal) {
						const wordCount = text.trim().split(/\s+/).length;
						if (wordCount >= minWordThreshold) {
							setTranscript(text);
							setInterimTranscript('');
							onTranscript?.(text);
						} else {
							setInterimTranscript('');
						}
					} else {
						setInterimTranscript(text);
					}
				},
				onEnd: () => {
					setIsListening(false);
					onEnd?.();
				},
				onError: (errorMsg) => {
					setError(errorMsg);
					setIsListening(false);
				},
			}
		);

		return () => {
			if (managerRef.current) {
				managerRef.current.stop();
			}
		};
	}, [language, onTranscript, onEnd]);

	const startListening = useCallback(() => {
		if (managerRef.current && !isListening) {
			managerRef.current.start();
		}
	}, [isListening]);

	const stopListening = useCallback(() => {
		if (managerRef.current && isListening) {
			managerRef.current.stop();
		}
	}, [isListening]);

	const clearTranscript = useCallback(() => {
		setTranscript('');
		setInterimTranscript('');
	}, []);

	useEffect(() => {
		if (enabled) {
			startListening();
		} else {
			stopListening();
		}
	}, [enabled, startListening, stopListening]);

	return {
		isListening,
		transcript,
		interimTranscript,
		error,
		startListening,
		stopListening,
		clearTranscript,
		isSupported: managerRef.current?.isSupported() ?? false,
	};
}
