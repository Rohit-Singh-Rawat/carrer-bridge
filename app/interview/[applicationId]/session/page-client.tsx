'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { VideoPanel } from '@/components/interview/video-panel';
import { ChatPanel } from '@/components/interview/chat-panel';
import { MCQQuestion } from '@/components/interview/mcq-question';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useMediaStream } from '@/hooks/use-media-stream';
import { useFullscreenLock } from '@/hooks/use-fullscreen-lock';
// import { useCameraMonitoring } from '@/hooks/use-camera-monitoring'; // Temporarily disabled
import { useInterviewState } from '@/hooks/use-interview-state';
import { useSpeechRecognitionHook } from '@/hooks/use-speech-recognition-hook';
import { useInterviewOrchestrator } from '@/hooks/use-interview-orchestrator';
import { trpc } from '@/lib/trpc/client';

interface InterviewSessionClientProps {
	applicationId: string;
	interviewId: string;
}

export function InterviewSessionClient({
	applicationId,
	interviewId,
}: InterviewSessionClientProps) {
	const router = useRouter();
	const videoRef = useRef<HTMLVideoElement>(null);
	const [isMuted, setIsMuted] = useState(false);
	const [isCameraOff, setIsCameraOff] = useState(false);
	const [showExitWarning, setShowExitWarning] = useState(false);
	const [showEndDialog, setShowEndDialog] = useState(false);

	const { stream, requestStream } = useMediaStream();
	const { remainingTime, startInterview } = useInterviewState({
		maxDuration: 300,
		onTimeExpired: () => handleEndInterview(),
	});

	// Snapshot feature temporarily disabled
	// const { isMonitoring, snapshotCount } = useCameraMonitoring({
	// 	videoRef,
	// 	interviewId,
	// 	enabled: true,
	// 	interval: 20000, // 20 seconds
	// });
	const isMonitoring = false;
	const snapshotCount = 0;

	const {
		messages,
		isAITyping,
		currentMCQ,
		isSpeechEnabled,
		sendMessage,
		answerMCQ,
		endInterview: orchestratorEnd,
	} = useInterviewOrchestrator({
		interviewId,
		applicationId,
		onInterviewEnd: () => handleInterviewComplete(),
	});

	const { transcript, interimTranscript, clearTranscript } = useSpeechRecognitionHook({
		enabled: isSpeechEnabled && !isMuted,
		onTranscript: (text) => {
			sendMessage(text);
			clearTranscript();
		},
		language: 'en-US',
		minWordThreshold: 3,
	});

	const { showWarning, cancelWarning } = useFullscreenLock({
		enabled: true,
		onWarning: () => setShowExitWarning(true),
		onExit: () => {
			toast.error('Interview terminated due to exiting fullscreen');
			handleEndInterview();
		},
	});

	const endMutation = trpc.interview.end.useMutation();

	useEffect(() => {
		requestStream();
		startInterview();
	}, [requestStream, startInterview]);

	useEffect(() => {
		if (videoRef.current && stream) {
			videoRef.current.srcObject = stream;
		}
	}, [stream]);

	const handleEndInterview = () => {
		setShowEndDialog(true);
	};

	const confirmEndInterview = async () => {
		try {
			await endMutation.mutateAsync({ interviewId });
			orchestratorEnd();
			router.push(`/interview/${applicationId}/complete`);
		} catch (error) {
			console.error('Error ending interview:', error);
			toast.error('Failed to end interview');
		}
	};

	const handleInterviewComplete = () => {
		router.push(`/interview/${applicationId}/complete`);
	};

	return (
		<div className='h-screen bg-background'>
			<div className='grid grid-cols-1 lg:grid-cols-5 h-full gap-4 p-4'>
				<div className='lg:col-span-2'>
					<VideoPanel
						ref={videoRef}
						stream={stream}
						isMonitoring={isMonitoring}
						remainingTime={remainingTime}
						snapshotCount={snapshotCount}
						isMuted={isMuted}
						isCameraOff={isCameraOff}
						onToggleMute={() => setIsMuted(!isMuted)}
						onToggleCamera={() => setIsCameraOff(!isCameraOff)}
						onEndInterview={handleEndInterview}
					/>
				</div>

				<div className='lg:col-span-3 flex flex-col h-full'>
					<div className='flex-1 rounded-xl border bg-card overflow-hidden'>
						<ChatPanel
							messages={messages}
							isAITyping={isAITyping}
							onSendMessage={sendMessage}
							showTextInput={!isSpeechEnabled}
							interimTranscript={isSpeechEnabled ? interimTranscript : undefined}
						/>
					</div>

					{currentMCQ && (
						<div className='mt-4'>
							<MCQQuestion
								question={currentMCQ.question}
								options={currentMCQ.options}
								onSelect={answerMCQ}
								disabled={isAITyping}
							/>
						</div>
					)}
				</div>
			</div>

			<Dialog
				open={showExitWarning}
				onOpenChange={setShowExitWarning}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="font-['outfit']">Fullscreen Required</DialogTitle>
						<DialogDescription className="font-['outfit']">
							You must stay in fullscreen mode during the interview. Please return to fullscreen
							within 3 seconds or the interview will be terminated.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							onClick={cancelWarning}
							className="font-['outfit']"
						>
							Return to Fullscreen
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={showEndDialog}
				onOpenChange={setShowEndDialog}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="font-['outfit']">End Interview?</DialogTitle>
						<DialogDescription className="font-['outfit']">
							Are you sure you want to end the interview? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant='outline'
							onClick={() => setShowEndDialog(false)}
							className="font-['outfit']"
						>
							Cancel
						</Button>
						<Button
							variant='destructive'
							onClick={confirmEndInterview}
							className="font-['outfit']"
						>
							End Interview
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
