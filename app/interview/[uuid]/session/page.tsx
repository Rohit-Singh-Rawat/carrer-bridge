'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, CameraOff, Mic, MicOff, Phone, Clock } from 'lucide-react';

// Hooks
import { useMediaStream, useSpeechRecognition, useSpeechPlayback } from '@/hooks';

// Actions
import { completeInterview } from '@/actions/ai-interview';

// Components
import { TranscriptViewer } from '@/components/interview/transcript-viewer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { INTERVIEW_CONFIG } from '@/lib/constants/interview-constants';

interface InterviewSessionPageProps {
	params: Promise<{ uuid: string }>;
}

export default function InterviewSessionPage({ params }: InterviewSessionPageProps) {
	const { uuid } = use(params);
	const router = useRouter();
	const videoRef = useRef<HTMLVideoElement>(null);

	// UI state
	const [isStarted, setIsStarted] = useState(false);
	const [remainingTime, setRemainingTime] = useState(INTERVIEW_CONFIG.MAX_DURATION_SECONDS);

	// Media stream hook - initialize immediately for preview
	const { mediaStream, isMuted, isCameraOff, toggleMute, toggleCamera, stopMediaStream } =
		useMediaStream(true);

	// Speech recognition hook with MCQ support
	const {
		transcriptMessages,
		isAITyping,
		stopRecognition,
		currentMCQ,
		handleMCQAnswer,
		interimTranscript,
		isUserSpeaking,
	} = useSpeechRecognition(isStarted, isMuted, uuid);

	// Speech playback hook
	const { playSpeech, isPlaying, isLoading: audioLoading, stopSpeech } = useSpeechPlayback();
	const [playingMessageId, setPlayingMessageId] = useState<number | null>(null);
	const lastPlayedMessageIdRef = useRef<number | null>(null);

	// Auto-play new AI messages
	useEffect(() => {
		if (!isStarted) return;

		const lastMessage = transcriptMessages[transcriptMessages.length - 1];
		if (
			lastMessage &&
			lastMessage.type === 'ai' &&
			!lastMessage.isInterim &&
			lastMessage.messageType === 'text' &&
			lastPlayedMessageIdRef.current !== lastMessage.id
		) {
			// Auto-play the new AI message
			lastPlayedMessageIdRef.current = lastMessage.id;
			setPlayingMessageId(lastMessage.id);
			
			playSpeech(lastMessage.text, { useBrowserTTS: false }).then(() => {
				setPlayingMessageId(null);
			}).catch((err) => {
				console.error('Auto-play speech error:', err);
				setPlayingMessageId(null);
			});
		}
	}, [transcriptMessages, isStarted, playSpeech]);

	// Attach stream to video element
	useEffect(() => {
		const videoElement = videoRef.current;
		if (videoElement && mediaStream) {
			const videoTracks = mediaStream.getVideoTracks();
			console.log('Attaching media stream to video element', {
				hasStream: !!mediaStream,
				videoTracksCount: videoTracks.length,
				videoTrackEnabled: videoTracks[0]?.enabled,
				videoTrackState: videoTracks[0]?.readyState,
				isStarted,
				isCameraOff,
			});
			videoElement.srcObject = mediaStream;
			// Ensure video plays
			videoElement.play().catch((err) => {
				console.log('Video play error:', err);
			});
		}

		return () => {
			if (videoElement && videoElement.srcObject) {
				videoElement.srcObject = null;
			}
		};
	}, [mediaStream, isStarted, isCameraOff]);

	// Timer countdown
	useEffect(() => {
		if (!isStarted) return;

		const interval = setInterval(() => {
			setRemainingTime((prev) => {
				if (prev <= 1) {
					handleEndInterview();
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [isStarted]);

	const handleStartInterview = () => {
		setIsStarted(true);
	};

	const handleEndInterview = useCallback(async () => {
		stopRecognition();
		stopMediaStream();
		stopSpeech();
		
		// Mark interview as completed in database
		await completeInterview(uuid);
		
		router.push(`/interview/${uuid}/complete`);
	}, [stopRecognition, stopMediaStream, stopSpeech, router, uuid]);

	// Handle manual audio playback
	const handlePlayAudio = useCallback(
		async (messageId: number, text: string) => {
			// Stop current playback if any
			if (isPlaying && playingMessageId) {
				stopSpeech();
				setPlayingMessageId(null);
				// If clicking the same message, just stop
				if (playingMessageId === messageId) {
					return;
				}
			}

			// Play the selected message
			setPlayingMessageId(messageId);
			try {
				await playSpeech(text, { useBrowserTTS: false });
				setPlayingMessageId(null);
			} catch (err) {
				console.error('Manual play speech error:', err);
				setPlayingMessageId(null);
			}
		},
		[isPlaying, playingMessageId, playSpeech, stopSpeech]
	);

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	};

	// Show start screen if not started
	if (!isStarted) {
		return (
			<div className='h-screen flex items-center justify-center bg-background'>
				<Card className='max-w-2xl w-full p-10 border-border'>
					<div className='text-center space-y-7'>
						<div className='space-y-3'>
							<h1 className='text-4xl font-bold text-foreground'>Ready to begin?</h1>
							<p className='text-muted-foreground text-base'>
								The interview will start once you click the button below. Make sure you're in a quiet
								environment with good lighting.
							</p>
						</div>

						<div className='relative aspect-video rounded-lg overflow-hidden bg-muted border border-border'>
							<video
								ref={videoRef}
								autoPlay
								playsInline
								muted
								className='w-full h-full object-cover'
							/>
							{!mediaStream && (
								<div className='absolute inset-0 flex items-center justify-center bg-muted/50'>
									<div className='text-center space-y-3'>
										<div className='w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto' />
										<p className='text-foreground font-semibold'>Initializing camera...</p>
									</div>
								</div>
							)}
						</div>

						<Button
							size='lg'
							onClick={handleStartInterview}
							disabled={!mediaStream}
							className='w-full py-6 text-lg font-semibold'
						>
							{mediaStream ? 'Start Interview' : 'Preparing...'}
						</Button>
					</div>
				</Card>
			</div>
		);
	}

	return (
		<div className='h-screen flex flex-col bg-background'>
			{/* Header */}
			<div className='border-b border-border bg-card/50 backdrop-blur-sm p-4'>
				<div className='flex items-center justify-between max-w-full'>
					<div className='flex items-center gap-3'>
						<div className='w-10 h-10 rounded-lg bg-primary flex items-center justify-center'>
							<span className='text-primary-foreground font-bold text-lg'>AI</span>
						</div>
						<div>
							<h1 className='text-lg font-bold text-foreground'>Interview Session</h1>
							<p className='text-xs text-muted-foreground'>Answer questions clearly and confidently</p>
						</div>
					</div>

					<div className='flex items-center gap-4'>
						{/* Timer */}
						<div
							className={cn(
								'flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300',
								remainingTime <= 300 
									? 'border-destructive bg-destructive/10' 
									: 'border-border bg-muted/50'
							)}
						>
							<Clock
								className={cn(
									'w-4 h-4',
									remainingTime <= 300 ? 'text-destructive' : 'text-muted-foreground'
								)}
							/>
							<span
								className={cn(
									'font-mono text-sm font-bold tabular-nums',
									remainingTime <= 300 ? 'text-destructive' : 'text-foreground'
								)}
							>
								{formatTime(remainingTime)}
							</span>
						</div>
					</div>
				</div>
			</div>

			{/* Main content */}
			<div className='flex-1 grid lg:grid-cols-[1fr_400px] gap-0 overflow-hidden'>
				{/* Video panel */}
				<div className='relative bg-muted overflow-hidden'>
					<div className='w-full h-full relative flex items-center justify-center'>
						{/* User Video Feed */}
						<div className='relative w-full h-full'>
							<video
								ref={videoRef}
								autoPlay
								muted
								playsInline
								className={cn('w-full h-full object-cover', isCameraOff && 'hidden')}
							/>
							{isCameraOff && (
								<div className='w-full h-full flex items-center justify-center bg-muted'>
									<div className='text-center'>
										<CameraOff
											size={48}
											className='text-muted-foreground mx-auto mb-2'
										/>
										<p className='text-muted-foreground'>Camera is off</p>
									</div>
								</div>
							)}

							{/* User label */}
							<div className='absolute bottom-4 left-4 bg-card border border-border px-3 py-1.5 rounded-lg'>
								<span className='text-foreground text-sm font-medium'>You</span>
							</div>

							{/* Status indicators */}
							<div className='absolute top-4 left-4 flex flex-col gap-2'>
								{isMuted && (
									<div className='bg-destructive text-destructive-foreground px-3 py-1.5 rounded-lg text-sm font-medium'>
										Muted
									</div>
								)}
								{isUserSpeaking && !isMuted && (
									<div className='bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2'>
										<div className='w-2 h-2 bg-primary-foreground rounded-full animate-pulse' />
										Speaking...
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Controls */}
					<div className='absolute bottom-6 left-1/2 -translate-x-1/2'>
						<div className='flex items-center gap-3 bg-card border border-border rounded-full px-4 py-3'>
							{/* Microphone */}
							<Button
								variant={isMuted ? 'destructive' : 'outline'}
								size='sm'
								onClick={toggleMute}
								className='h-11 w-11 rounded-full p-0'
								title={isMuted ? 'Unmute' : 'Mute'}
							>
								{isMuted ? <MicOff size={20} /> : <Mic size={20} />}
							</Button>

							{/* Camera */}
							<Button
								variant={isCameraOff ? 'destructive' : 'outline'}
								size='sm'
								onClick={toggleCamera}
								className='h-11 w-11 rounded-full p-0'
								title={isCameraOff ? 'Turn On Camera' : 'Turn Off Camera'}
							>
								{isCameraOff ? <CameraOff size={20} /> : <Camera size={20} />}
							</Button>

							{/* End Call */}
							<Button
								variant='destructive'
								size='sm'
								onClick={handleEndInterview}
								className='h-11 w-11 rounded-full p-0'
								title='End Interview'
							>
								<Phone
									size={20}
									className='rotate-135'
								/>
							</Button>
						</div>
					</div>
				</div>

				{/* Transcript panel */}
				<TranscriptViewer
					messages={transcriptMessages}
					isAITyping={isAITyping}
					currentMCQ={currentMCQ}
					onMCQAnswer={handleMCQAnswer}
					onPlayAudio={handlePlayAudio}
					playingMessageId={playingMessageId}
					audioLoading={audioLoading}
				/>
			</div>
		</div>
	);
}
