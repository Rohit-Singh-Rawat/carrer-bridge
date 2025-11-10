'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc/client';
import { TextToSpeechManager } from '@/lib/speech/text-to-speech';
import type { InterviewMessage, MCQQuestion } from '@/types/interview';

interface UseInterviewOrchestratorOptions {
	interviewId: string | null;
	applicationId: string;
	onInterviewEnd?: () => void;
}

export function useInterviewOrchestrator({
	interviewId,
	applicationId,
	onInterviewEnd,
}: UseInterviewOrchestratorOptions) {
	const [messages, setMessages] = useState<InterviewMessage[]>([]);
	const [isAITyping, setIsAITyping] = useState(false);
	const [currentMCQ, setCurrentMCQ] = useState<MCQQuestion | null>(null);
	const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
	const ttsManagerRef = useRef<TextToSpeechManager | null>(null);

	const messagesQuery = trpc.interview.getMessages.useQuery(
		{ interviewId: interviewId! },
		{ enabled: Boolean(interviewId), refetchInterval: false }
	);

	const saveMessageMutation = trpc.interview.saveMessage.useMutation();
	const generateAIResponseMutation = trpc.interview.generateAIResponse.useMutation();

	useEffect(() => {
		if (typeof window !== 'undefined') {
			ttsManagerRef.current = new TextToSpeechManager({
				rate: 1.0,
				pitch: 1.0,
				volume: 1.0,
			});
		}

		return () => {
			if (ttsManagerRef.current) {
				ttsManagerRef.current.stop();
			}
		};
	}, []);

	useEffect(() => {
		if (messagesQuery.data) {
			setMessages(messagesQuery.data);

			const lastMessage = messagesQuery.data[messagesQuery.data.length - 1];
			if (lastMessage && lastMessage.role === 'assistant' && lastMessage.messageType === 'mcq') {
				try {
					const mcqOptions = lastMessage.mcqOptions
						? JSON.parse(lastMessage.mcqOptions as string)
						: null;
					if (mcqOptions) {
						setCurrentMCQ({
							question: lastMessage.content,
							options: mcqOptions,
						});
						setIsSpeechEnabled(false);
					}
				} catch (e) {
					console.error('Error parsing MCQ options:', e);
				}
			}
		}
	}, [messagesQuery.data]);

	const sendMessage = useCallback(
		async (content: string) => {
			if (!interviewId || !content.trim()) {
				return;
			}

			try {
				await saveMessageMutation.mutateAsync({
					interviewId,
					role: 'user',
					content,
					messageType: 'text',
					phase: 'questions',
				});

				setIsAITyping(true);

				const aiResponse = await generateAIResponseMutation.mutateAsync({
					interviewId,
					userMessage: content,
				});

				let mcqData = null;
				if (aiResponse.messageType === 'mcq' && aiResponse.mcqData) {
					mcqData = {
						options: aiResponse.mcqData.options,
					};
					setCurrentMCQ(aiResponse.mcqData);
					setIsSpeechEnabled(false);
				} else {
					setCurrentMCQ(null);
					setIsSpeechEnabled(true);
				}

				await saveMessageMutation.mutateAsync({
					interviewId,
					role: 'assistant',
					content: aiResponse.content,
					messageType: aiResponse.messageType,
					mcqOptions: mcqData?.options,
					phase: aiResponse.phase,
					questionIndex: aiResponse.questionIndex,
				});

				if (ttsManagerRef.current && aiResponse.content) {
					await ttsManagerRef.current.speak(aiResponse.content);
				}

				await messagesQuery.refetch();
			} catch (error) {
				console.error('Error sending message:', error);
			} finally {
				setIsAITyping(false);
			}
		},
		[interviewId, saveMessageMutation, generateAIResponseMutation, messagesQuery]
	);

	const answerMCQ = useCallback(
		async (optionId: string) => {
			if (!interviewId || !currentMCQ) {
				return;
			}

			try {
				const selectedOption = currentMCQ.options.find((opt) => opt.id === optionId);
				const answerText = selectedOption
					? `${optionId.toUpperCase()}: ${selectedOption.text}`
					: optionId;

				await saveMessageMutation.mutateAsync({
					interviewId,
					role: 'user',
					content: answerText,
					messageType: 'text',
					phase: 'questions',
				});

				setCurrentMCQ(null);
				setIsSpeechEnabled(true);

				setIsAITyping(true);

				const aiResponse = await generateAIResponseMutation.mutateAsync({
					interviewId,
					userMessage: answerText,
				});

				let mcqData = null;
				if (aiResponse.messageType === 'mcq' && aiResponse.mcqData) {
					mcqData = {
						options: aiResponse.mcqData.options,
					};
					setCurrentMCQ(aiResponse.mcqData);
					setIsSpeechEnabled(false);
				}

				await saveMessageMutation.mutateAsync({
					interviewId,
					role: 'assistant',
					content: aiResponse.content,
					messageType: aiResponse.messageType,
					mcqOptions: mcqData?.options,
					phase: aiResponse.phase,
					questionIndex: aiResponse.questionIndex,
				});

				if (ttsManagerRef.current && aiResponse.content) {
					await ttsManagerRef.current.speak(aiResponse.content);
				}

				await messagesQuery.refetch();
			} catch (error) {
				console.error('Error answering MCQ:', error);
			} finally {
				setIsAITyping(false);
			}
		},
		[interviewId, currentMCQ, saveMessageMutation, generateAIResponseMutation, messagesQuery]
	);

	const endInterview = useCallback(() => {
		if (ttsManagerRef.current) {
			ttsManagerRef.current.stop();
		}
		onInterviewEnd?.();
	}, [onInterviewEnd]);

	return {
		messages,
		isAITyping,
		currentMCQ,
		isSpeechEnabled,
		sendMessage,
		answerMCQ,
		endInterview,
	};
}

