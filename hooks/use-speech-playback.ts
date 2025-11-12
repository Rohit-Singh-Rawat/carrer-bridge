import { useState, useCallback, useRef, useEffect } from 'react';

export interface SpeechPlaybackState {
	isPlaying: boolean;
	isPaused: boolean;
	isLoading: boolean;
	error: string | null;
	currentText: string | null;
}

/**
 * Hook to manage AI speech playback
 */
export const useSpeechPlayback = () => {
	const [state, setState] = useState<SpeechPlaybackState>({
		isPlaying: false,
		isPaused: false,
		isLoading: false,
		error: null,
		currentText: null,
	});

	const audioRef = useRef<HTMLAudioElement | null>(null);
	const audioUrlRef = useRef<string | null>(null);

	// Cleanup audio URL on unmount
	useEffect(() => {
		return () => {
			if (audioUrlRef.current) {
				URL.revokeObjectURL(audioUrlRef.current);
			}
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current = null;
			}
		};
	}, []);

	/**
	 * Play AI response as speech
	 */
	const playSpeech = useCallback(async (text: string, options?: { useBrowserTTS?: boolean }) => {
		const { useBrowserTTS = false } = options || {};

		setState((prev) => ({
			...prev,
			isLoading: true,
			error: null,
			currentText: text,
		}));

		try {
			// Option 1: Use server TTS (recommended)
			if (!useBrowserTTS) {
				try {
					const response = await fetch('/api/v1/ai-speech', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							text,
							audioFormat: 'base64',
						}),
					});

					const data = await response.json();

					// Check if server wants us to fallback to browser TTS
					if (!response.ok && data.fallbackToBrowser) {
						console.log('Server requested browser TTS fallback');
						throw new Error('Fallback to browser TTS');
					}

					// Create audio from base64
					const audioData = atob(data.audio);
					const audioArray = new Uint8Array(audioData.length);
					for (let i = 0; i < audioData.length; i++) {
						audioArray[i] = audioData.charCodeAt(i);
					}

					const blob = new Blob([audioArray], { type: 'audio/mpeg' });
					const audioUrl = URL.createObjectURL(blob);

					// Cleanup previous URL
					if (audioUrlRef.current) {
						URL.revokeObjectURL(audioUrlRef.current);
					}
					audioUrlRef.current = audioUrl;

					// Create and play audio
					const audio = new Audio(audioUrl);
					audioRef.current = audio;

					// Set up event listeners
					audio.onplay = () => {
						setState((prev) => ({
							...prev,
							isPlaying: true,
							isPaused: false,
							isLoading: false,
						}));
					};

					audio.onpause = () => {
						setState((prev) => ({
							...prev,
							isPlaying: false,
							isPaused: true,
						}));
					};

					audio.onended = () => {
						setState((prev) => ({
							...prev,
							isPlaying: false,
							isPaused: false,
						}));
						if (audioUrlRef.current) {
							URL.revokeObjectURL(audioUrlRef.current);
							audioUrlRef.current = null;
						}
					};

					audio.onerror = (error) => {
						setState((prev) => ({
							...prev,
							error: 'Failed to play audio',
							isLoading: false,
							isPlaying: false,
						}));
						console.error('Audio playback error:', error);
					};

					await audio.play();
					return; // Success, return early
				} catch (serverError) {
					// Fallback to browser TTS
					console.log('Falling back to browser TTS:', serverError);
				}
			}

			// Option 2: Use browser TTS (fallback or explicitly requested)
			if ('speechSynthesis' in window) {
				window.speechSynthesis.cancel(); // Cancel any ongoing speech

				const utterance = new SpeechSynthesisUtterance(text);
				utterance.lang = 'en-US';
				utterance.rate = 1.0;
				utterance.pitch = 1.0;
				utterance.volume = 1.0;

				utterance.onstart = () => {
					setState((prev) => ({
						...prev,
						isPlaying: true,
						isLoading: false,
					}));
				};

				utterance.onend = () => {
					setState((prev) => ({
						...prev,
						isPlaying: false,
					}));
				};

				utterance.onerror = (error) => {
					setState((prev) => ({
						...prev,
						error: 'Speech synthesis failed',
						isLoading: false,
						isPlaying: false,
					}));
				};

				window.speechSynthesis.speak(utterance);
			} else {
				throw new Error('Speech synthesis not supported');
			}
		} catch (error) {
			console.error('Speech playback error:', error);
			setState((prev) => ({
				...prev,
				error: error instanceof Error ? error.message : 'Unknown error',
				isLoading: false,
			}));
		}
	}, []);

	/**
	 * Pause current playback
	 */
	const pauseSpeech = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.pause();
		} else if ('speechSynthesis' in window) {
			window.speechSynthesis.pause();
		}
	}, []);

	/**
	 * Resume paused playback
	 */
	const resumeSpeech = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.play();
		} else if ('speechSynthesis' in window) {
			window.speechSynthesis.resume();
		}
	}, []);

	/**
	 * Stop current playback
	 */
	const stopSpeech = useCallback(() => {
		if (audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
		}
		if ('speechSynthesis' in window) {
			window.speechSynthesis.cancel();
		}
		setState((prev) => ({
			...prev,
			isPlaying: false,
			isPaused: false,
		}));
	}, []);

	return {
		...state,
		playSpeech,
		pauseSpeech,
		resumeSpeech,
		stopSpeech,
	};
};
