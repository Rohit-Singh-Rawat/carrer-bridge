import { useCallback, useEffect, useRef, useState } from 'react';

import {
	type ConversationMessage,
	generateAIInterviewResponseWithUuid,
	generateInterviewIntroductionWithUuid,
	type InterviewPhase,
} from '@/actions/ai-interview';

// Type declarations for Speech Recognition API
type SpeechRecognitionInstance = any;

export interface TranscriptMessage {
	id: number;
	type: 'user' | 'ai';
	messageType: 'text' | 'mcq';
	text: string;
	timestamp: Date;
	mcqData?: {
		question: string;
		options: Array<{ id: string; text: string }>;
	};
	isInterim?: boolean;
}

/**
 * Custom hook to manage speech recognition and transcript messages
 * Handles speech-to-text conversion and AI response integration
 * Supports both conversational and MCQ questions
 */
export const useSpeechRecognition = (
	isInterviewStarted: boolean,
	isMuted: boolean,
	applicationUuid: string
) => {
	const [recognition, setRecognition] = useState<SpeechRecognitionInstance | null>(null);
	const [isAITyping, setIsAITyping] = useState(false);
	const [isRecognitionActive, setIsRecognitionActive] = useState(false);
	const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
	const [transcriptMessages, setTranscriptMessages] = useState<TranscriptMessage[]>([]);
	const [currentPhase, setCurrentPhase] = useState<InterviewPhase>({
		current: 'introduction',
		questionIndex: 0,
		totalQuestions: 0,
	});
	const [currentMCQ, setCurrentMCQ] = useState<{
		question: string;
		options: Array<{ id: string; text: string }>;
	} | null>(null);
	const [interimTranscript, setInterimTranscript] = useState('');
	const [isUserSpeaking, setIsUserSpeaking] = useState(false);
	const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const accumulatedTranscriptRef = useRef<string>('');
	const aiGenerationAbortRef = useRef<AbortController | null>(null);

	// Helper function to safely start recognition
	const startRecognition = useCallback(
		(recognitionInstance: SpeechRecognitionInstance) => {
			console.log('[Speech Recognition] Attempting to start recognition', {
				isMuted,
				isInterviewStarted,
				isRecognitionActive,
			});
			if (!isMuted && isInterviewStarted && !isRecognitionActive) {
				try {
					recognitionInstance.start();
					console.log('[Speech Recognition] Recognition started successfully');
				} catch (error) {
					console.log('[Speech Recognition] Recognition start error (likely already running):', error);
				}
			} else {
				console.log('[Speech Recognition] Recognition not started due to conditions', {
					isMuted,
					isInterviewStarted,
					isRecognitionActive,
				});
			}
		},
		[isMuted, isInterviewStarted, isRecognitionActive]
	);

	// Generate initial AI introduction when interview starts
	useEffect(() => {
		console.log('[Interview Init] Checking interview initialization', {
			isInterviewStarted,
			transcriptMessagesLength: transcriptMessages.length,
		});
		if (!isInterviewStarted || transcriptMessages.length > 0) return;

		const initializeInterview = async () => {
			try {
				console.log('[Interview Init] Generating interview introduction for UUID:', applicationUuid);
				const response = await generateInterviewIntroductionWithUuid(applicationUuid);
				console.log('[Interview Init] Introduction response received:', {
					success: response.success,
					hasQuestion: !!response.nextQuestion,
					phase: response.phase,
				});

				if (response.success && response.nextQuestion) {
					const aiMessage: TranscriptMessage = {
						id: Date.now(),
						type: 'ai',
						messageType: 'text',
						text: response.nextQuestion,
						timestamp: new Date(),
					};

					console.log('[Interview Init] Setting initial AI message');
					setTranscriptMessages([aiMessage]);
					setConversationHistory([
						{
							role: 'assistant',
							content: response.nextQuestion,
							timestamp: new Date(),
						},
					]);

					if (response.phase) {
						console.log('[Interview Init] Setting initial phase:', response.phase);
						setCurrentPhase(response.phase);
					}
				}
			} catch (error) {
				console.error('[Interview Init] Failed to generate interview introduction:', error);
				// Generic fallback message when UUID fails
				const fallbackText = `Hello! I'm CareerBridge AI and it's wonderful to meet you. I'll be conducting your interview today and I'm genuinely excited to learn about your background and experience. We have a structured conversation planned with thoughtful questions to assess your qualifications for this role. I'll provide feedback and encouragement throughout our discussion to help guide our conversation. To get us started, could you please share a brief introduction about yourself and what brings you to this opportunity? I'd love to hear your story.`;

				console.log('[Interview Init] Using fallback introduction message');
				const fallbackMessage: TranscriptMessage = {
					id: Date.now(),
					type: 'ai',
					messageType: 'text',
					text: fallbackText,
					timestamp: new Date(),
				};
				setTranscriptMessages([fallbackMessage]);
				setConversationHistory([
					{
						role: 'assistant',
						content: fallbackText,
						timestamp: new Date(),
					},
				]);
			}
		};

		initializeInterview();
	}, [isInterviewStarted, applicationUuid, transcriptMessages.length]);

	// Initialize speech recognition when interview starts
	useEffect(() => {
		console.log('[Speech Recognition] Interview started effect triggered', { isInterviewStarted });
		if (!isInterviewStarted) return;

		if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
			const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
			if (!SpeechRecognition) {
				console.error('[Speech Recognition] SpeechRecognition is not available in this browser');
				return;
			}
			console.log('[Speech Recognition] Creating new recognition instance');
			const recognitionInstance = new SpeechRecognition();

			// Configure speech recognition settings
			recognitionInstance.continuous = true;
			recognitionInstance.interimResults = true;
			recognitionInstance.lang = 'en-IN';

			if ('maxAlternatives' in recognitionInstance) {
				recognitionInstance.maxAlternatives = 1;
			}

			console.log('[Speech Recognition] Recognition configured:', {
				continuous: true,
				interimResults: true,
				lang: 'en-IN',
			});

			// Handle speech recognition results
			recognitionInstance.onresult = async (event) => {
				const latest = event.results[event.results.length - 1];
				const transcript = latest[0].transcript;

				console.log('[Speech Recognition] Result received:', {
					isFinal: latest.isFinal,
					transcript,
					accumulatedLength: accumulatedTranscriptRef.current.length,
					isAITyping,
				});

				// Cancel any pending AI generation if user starts speaking while AI is generating
				if (isAITyping && aiGenerationAbortRef.current) {
					console.log('[Speech Recognition] User speaking during AI generation - cancelling');
					aiGenerationAbortRef.current.abort();
					aiGenerationAbortRef.current = null;
					setIsAITyping(false);
				}

				if (!latest.isFinal) {
					// Show interim transcript while user is speaking
					// Combine with accumulated text
					const fullInterimText = accumulatedTranscriptRef.current 
						? `${accumulatedTranscriptRef.current} ${transcript}`
						: transcript;
					
					console.log('[Speech Recognition] Interim transcript:', fullInterimText);
					setInterimTranscript(fullInterimText);
					setIsUserSpeaking(true);
					
					// Clear any pending timeout since user is still speaking
					if (speechTimeoutRef.current) {
						console.log('[Speech Recognition] User still speaking - clearing timeout to merge messages');
						clearTimeout(speechTimeoutRef.current);
						speechTimeoutRef.current = null;
					}
					
					// Update or add interim message in transcript
					setTranscriptMessages((prev) => {
						const filtered = prev.filter(msg => !msg.isInterim);
						return [
							...filtered,
							{
								id: Date.now(),
								type: 'user',
								messageType: 'text',
								text: fullInterimText,
								timestamp: new Date(),
								isInterim: true,
							}
						];
					});
				} else {
					// Add this final transcript to accumulated text
					if (accumulatedTranscriptRef.current) {
						accumulatedTranscriptRef.current = `${accumulatedTranscriptRef.current} ${transcript}`;
					} else {
						accumulatedTranscriptRef.current = transcript;
					}
					
					console.log('[Speech Recognition] Final transcript accumulated:', accumulatedTranscriptRef.current);
					
					// Clear interim state
					setInterimTranscript('');
					setIsUserSpeaking(false);
					
					// Update transcript with accumulated text
					setTranscriptMessages((prev) => {
						const filtered = prev.filter(msg => !msg.isInterim);
						return [
							...filtered,
							{
								id: Date.now(),
								type: 'user',
								messageType: 'text',
								text: accumulatedTranscriptRef.current,
								timestamp: new Date(),
								isInterim: false,
							}
						];
					});

					// Clear existing timeout
					if (speechTimeoutRef.current) {
						console.log('[Speech Recognition] Clearing existing speech timeout');
						clearTimeout(speechTimeoutRef.current);
					}

					// Wait 2 seconds before sending to AI (in case user continues speaking - messages will merge)
					console.log('[Speech Recognition] Setting 2-second timeout before AI processing');
					speechTimeoutRef.current = setTimeout(async () => {
						// Get the accumulated transcript
						const accumulatedTranscript = accumulatedTranscriptRef.current;
						
						console.log('[Speech Recognition] Timeout triggered, processing accumulated transcript:', accumulatedTranscript);
						
						// Don't send if AI is already generating
						if (isAITyping) {
							console.log('[Speech Recognition] AI is already generating, skipping message send');
							accumulatedTranscriptRef.current = '';
							return;
						}
						
						// Reset accumulated transcript for next message
						accumulatedTranscriptRef.current = '';

						const userConversationMessage: ConversationMessage = {
							role: 'user',
							content: accumulatedTranscript,
							timestamp: new Date(),
						};

						setConversationHistory((prev) => [...prev, userConversationMessage]);

						// Generate AI response using server action
						console.log('[AI Response] Starting AI response generation');
						
						// Create abort controller for this generation
						const abortController = new AbortController();
						aiGenerationAbortRef.current = abortController;
						setIsAITyping(true);

						// Move to candidate introduction phase after the AI introduction
						const nextPhase: InterviewPhase = {
							current: 'candidate_intro',
							questionIndex: 0,
							totalQuestions: currentPhase.totalQuestions,
						};

						console.log('[AI Response] Calling generateAIInterviewResponseWithUuid', {
							conversationHistoryLength: conversationHistory.length + 1,
							userMessage: accumulatedTranscript,
							applicationUuid,
							nextPhase,
						});

						// Check if aborted before making the call
						if (abortController.signal.aborted) {
							console.log('[AI Response] Request aborted before API call');
							setIsAITyping(false);
							aiGenerationAbortRef.current = null;
							return;
						}

						generateAIInterviewResponseWithUuid(
							[...conversationHistory, userConversationMessage],
							accumulatedTranscript,
							applicationUuid,
							nextPhase
						)
							.then(async (response) => {
								// Check if this request was aborted
								if (abortController.signal.aborted) {
									console.log('[AI Response] Request was aborted, ignoring response');
									return;
								}

								console.log('[AI Response] Response received:', {
									success: response.success,
									hasQuestion: !!response.nextQuestion,
									messageType: response.messageType,
									hasMCQData: !!response.mcqData,
									phase: response.phase,
								});

								if (response.success && response.nextQuestion) {
									// Check if it's an MCQ question from the response
									const isMCQ = response.messageType === 'mcq';
									console.log('[AI Response] Question type:', isMCQ ? 'MCQ' : 'Text');

									if (isMCQ && response.mcqData) {
										console.log('[AI Response] MCQ data received:', response.mcqData);
										setCurrentMCQ(response.mcqData);
									}

									const aiMessage: TranscriptMessage = {
										id: Date.now() + 1,
										type: 'ai',
										messageType: response.messageType || 'text',
										text: response.nextQuestion,
										timestamp: new Date(),
										mcqData: response.mcqData,
									};

									console.log('[AI Response] Adding AI message to transcript');
									setTranscriptMessages((prev) => [...prev, aiMessage]);

									const aiConversationMessage: ConversationMessage = {
										role: 'assistant',
										content: response.nextQuestion,
										timestamp: new Date(),
									};

									setConversationHistory((prev) => [...prev, aiConversationMessage]);

									// Update phase
									if (response.phase) {
										console.log('[AI Response] Updating phase:', response.phase);
										setCurrentPhase(response.phase);
									}
								} else {
									console.log('[AI Response] No question in response, using fallback');
									// Generic fallback response on error
									const fallbackResponse = `Thank you so much for sharing that with me - I really appreciate your openness. Could you tell me more about your experience and what aspects of this role excite you the most? I'd love to hear more about what draws you to this opportunity.`;

									const aiMessage: TranscriptMessage = {
										id: Date.now() + 1,
										type: 'ai',
										messageType: 'text',
										text: fallbackResponse,
										timestamp: new Date(),
									};

									setTranscriptMessages((prev) => [...prev, aiMessage]);

									const aiConversationMessage: ConversationMessage = {
										role: 'assistant',
										content: fallbackResponse,
										timestamp: new Date(),
									};

									setConversationHistory((prev) => [...prev, aiConversationMessage]);
								}
								console.log('[AI Response] AI typing complete');
								setIsAITyping(false);
								aiGenerationAbortRef.current = null;
							})
							.catch(async (error) => {
								// Check if this was an abort
								if (abortController.signal.aborted) {
									console.log('[AI Response] Request was aborted');
									return;
								}
								console.error('[AI Response] Error generating AI response:', error);
								// Generic fallback response on error
								const fallbackResponse = `That's really interesting, and I appreciate you taking the time to share that with me. I'd love to hear about a challenging situation you've encountered in your career and how you approached solving it. Could you walk me through a specific example that showcases your problem-solving skills?`;

								console.log('[AI Response] Using error fallback response');
								const aiMessage: TranscriptMessage = {
									id: Date.now() + 1,
									type: 'ai',
									messageType: 'text',
									text: fallbackResponse,
									timestamp: new Date(),
								};

								setTranscriptMessages((prev) => [...prev, aiMessage]);

								const aiConversationMessage: ConversationMessage = {
									role: 'assistant',
									content: fallbackResponse,
									timestamp: new Date(),
								};

								setConversationHistory((prev) => [...prev, aiConversationMessage]);

								setIsAITyping(false);
								aiGenerationAbortRef.current = null;
							});
					}, 2000); // 2 second delay - shorter to feel more responsive, messages will merge if user continues
				}
			};

			// Handle speech recognition events
			recognitionInstance.onstart = () => {
				console.log('[Speech Recognition] Speech recognition started');
				setIsRecognitionActive(true);
			};

			recognitionInstance.onerror = (event) => {
				console.error('[Speech Recognition] Error event:', event.error);
				if (event.error === 'no-speech') {
					console.log('[Speech Recognition] No speech detected, keeping recognition in standby mode');
				} else if (event.error === 'audio-capture') {
					console.error('[Speech Recognition] Audio capture error - please check microphone permissions');
					setIsRecognitionActive(false);
				} else if (event.error === 'network') {
					console.error('[Speech Recognition] Network error during speech recognition');
					setIsRecognitionActive(false);
				} else if (event.error === 'not-allowed') {
					console.error('[Speech Recognition] Speech recognition not allowed - please enable microphone permissions');
					setIsRecognitionActive(false);
				} else {
					console.error('[Speech Recognition] Speech recognition error:', event.error);
					setIsRecognitionActive(false);
				}
			};

			recognitionInstance.onend = () => {
				console.log('[Speech Recognition] Speech recognition ended');
				setIsRecognitionActive(false);

				// Auto-restart recognition when it ends (unless muted or interview stopped)
				if (!isMuted && isInterviewStarted) {
					console.log('[Speech Recognition] Auto-restarting recognition in 500ms');
					setTimeout(() => {
						startRecognition(recognitionInstance);
					}, 500);
				} else {
					console.log('[Speech Recognition] Not auto-restarting due to conditions', {
						isMuted,
						isInterviewStarted,
					});
				}
			};

			setRecognition(recognitionInstance);
		} else {
			console.warn('[Speech Recognition] Speech recognition not supported in this browser');
		}

		// Cleanup: stop recognition when component unmounts
		return () => {
			console.log('[Speech Recognition] Cleanup: stopping recognition');
			if (recognition) {
				recognition.stop();
				setIsRecognitionActive(false);
			}
			// Clear any pending timeouts
			if (speechTimeoutRef.current) {
				clearTimeout(speechTimeoutRef.current);
			}
			// Abort any pending AI generation
			if (aiGenerationAbortRef.current) {
				aiGenerationAbortRef.current.abort();
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isInterviewStarted]);

	// Control speech recognition based on mute state
	useEffect(() => {
		console.log('[Speech Recognition] Mute state effect triggered', {
			hasRecognition: !!recognition,
			isInterviewStarted,
			isMuted,
			isRecognitionActive,
		});
		if (recognition && isInterviewStarted) {
			if (isMuted) {
				if (isRecognitionActive) {
					console.log('[Speech Recognition] Stopping recognition due to mute');
					recognition.stop();
				}
			} else {
				console.log('[Speech Recognition] Starting recognition (unmuted)');
				startRecognition(recognition);
			}
		}
	}, [isMuted, recognition, isRecognitionActive, isInterviewStarted, startRecognition]);

	// Heartbeat mechanism to ensure recognition stays active
	useEffect(() => {
		console.log('[Speech Recognition] Heartbeat effect setup', {
			isInterviewStarted,
			isMuted,
			hasRecognition: !!recognition,
		});
		if (!isInterviewStarted || isMuted || !recognition) return;

		const heartbeatInterval = setInterval(() => {
			console.log('[Speech Recognition] Heartbeat check', {
				isRecognitionActive,
				isMuted,
				isInterviewStarted,
			});
			if (!isRecognitionActive && !isMuted && isInterviewStarted) {
				console.log('[Speech Recognition] Heartbeat: Restarting inactive recognition');
				startRecognition(recognition);
			}
		}, 10000);

		return () => {
			console.log('[Speech Recognition] Clearing heartbeat interval');
			clearInterval(heartbeatInterval);
		};
	}, [isInterviewStarted, isMuted, recognition, isRecognitionActive, startRecognition]);

	// Stop speech recognition (cleanup)
	const stopRecognition = useCallback(() => {
		console.log('[Speech Recognition] stopRecognition called');
		if (recognition) {
			recognition.stop();
			setIsRecognitionActive(false);
		}
	}, [recognition]);

	// Handle MCQ answer selection
	const handleMCQAnswer = useCallback(
		async (optionId: string) => {
			console.log('[MCQ] Answer selected:', optionId);
			if (!currentMCQ) {
				console.log('[MCQ] No current MCQ available');
				return;
			}

			const selectedOption = currentMCQ.options.find((opt) => opt.id === optionId);
			if (!selectedOption) {
				console.log('[MCQ] Selected option not found:', optionId);
				return;
			}

			console.log('[MCQ] Selected option:', selectedOption);

			// Add user's MCQ answer
			const userMessage: TranscriptMessage = {
				id: Date.now(),
				type: 'user',
				messageType: 'text',
				text: `Selected: ${selectedOption.text}`,
				timestamp: new Date(),
			};

			setTranscriptMessages((prev) => [...prev, userMessage]);

			const userConversationMessage: ConversationMessage = {
				role: 'user',
				content: `Selected option: ${selectedOption.text}`,
				timestamp: new Date(),
			};

			setConversationHistory((prev) => [...prev, userConversationMessage]);
			setCurrentMCQ(null);

			// Generate next AI response
			console.log('[MCQ] Generating AI response after MCQ answer');
			setIsAITyping(true);

			try {
				const response = await generateAIInterviewResponseWithUuid(
					[...conversationHistory, userConversationMessage],
					`Selected option: ${selectedOption.text}`,
					applicationUuid,
					currentPhase
				);

				console.log('[MCQ] AI response received:', {
					success: response.success,
					hasQuestion: !!response.nextQuestion,
					messageType: response.messageType,
					hasMCQData: !!response.mcqData,
					phase: response.phase,
				});

				if (response.success && response.nextQuestion) {
					const isMCQ = response.messageType === 'mcq';
					console.log('[MCQ] Next question type:', isMCQ ? 'MCQ' : 'Text');

					if (isMCQ && response.mcqData) {
						console.log('[MCQ] MCQ data received:', response.mcqData);
						setCurrentMCQ(response.mcqData);
					}

					const aiMessage: TranscriptMessage = {
						id: Date.now() + 1,
						type: 'ai',
						messageType: response.messageType || 'text',
						text: response.nextQuestion,
						timestamp: new Date(),
						mcqData: response.mcqData,
					};

					setTranscriptMessages((prev) => [...prev, aiMessage]);

					const aiConversationMessage: ConversationMessage = {
						role: 'assistant',
						content: response.nextQuestion,
						timestamp: new Date(),
					};

					setConversationHistory((prev) => [...prev, aiConversationMessage]);

					if (response.phase) {
						console.log('[MCQ] Updating phase:', response.phase);
						setCurrentPhase(response.phase);
					}
				}
			} catch (error) {
				console.error('[MCQ] Error generating AI response after MCQ:', error);
			} finally {
				console.log('[MCQ] AI typing complete');
				setIsAITyping(false);
			}
		},
		[currentMCQ, conversationHistory, applicationUuid, currentPhase]
	);

	return {
		transcriptMessages,
		conversationHistory,
		currentPhase,
		recognition,
		stopRecognition,
		isAITyping,
		currentMCQ,
		handleMCQAnswer,
		interimTranscript,
		isUserSpeaking,
	};
};

