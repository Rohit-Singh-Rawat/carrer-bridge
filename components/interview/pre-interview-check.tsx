'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { isBrowserCompatible } from '@/lib/utils/interview';
import {
	Tick01Icon,
	Alert01Icon,
	VideoIcon,
	Mic01Icon,
	ComputerIcon,
	ClockIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

interface PreInterviewCheckProps {
	uuid: string;
}

export function PreInterviewCheck({ uuid }: PreInterviewCheckProps) {
	const router = useRouter();
	const [checks, setChecks] = useState({
		browser: false,
		camera: false,
		microphone: false,
	});
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [error, setError] = useState<Error | null>(null);

	const handleStart = () => {
		router.push(`/interview/${uuid}/session`);
	};

	useEffect(() => {
		const browserCheck = isBrowserCompatible();
		setChecks((prev) => ({ ...prev, browser: browserCheck.compatible }));

		if (browserCheck.compatible) {
			// Request media stream
			navigator.mediaDevices
				.getUserMedia({ video: true, audio: true })
				.then((mediaStream) => {
					setStream(mediaStream);
				})
				.catch((err) => {
					setError(err);
					console.error('Error accessing media devices:', err);
				});
		}

		// Cleanup
		return () => {
			if (stream) {
				stream.getTracks().forEach((track) => track.stop());
			}
		};
	}, []);

	useEffect(() => {
		if (stream) {
			const videoTracks = stream.getVideoTracks();
			const audioTracks = stream.getAudioTracks();

			setChecks((prev) => ({
				...prev,
				camera: videoTracks.length > 0 && videoTracks[0].enabled,
				microphone: audioTracks.length > 0 && audioTracks[0].enabled,
			}));
		}
	}, [stream]);

	const allChecksPass = checks.browser && checks.camera && checks.microphone;

	const CheckItem = ({
		label,
		passed,
		icon,
	}: {
		label: string;
		passed: boolean;
		icon: typeof Tick01Icon;
	}) => (
		<div className='flex items-center gap-3 p-4 rounded-lg border bg-card'>
			<div
				className={cn(
					'size-10 rounded-full flex items-center justify-center',
					passed ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-600'
				)}
			>
				<HugeiconsIcon
					icon={passed ? Tick01Icon : Alert01Icon}
					className='size-5'
				/>
			</div>
			<div className='flex-1'>
				<p className="font-['outfit'] font-medium">{label}</p>
				<p className="text-sm text-muted-foreground font-['outfit']">
					{passed ? 'Ready' : 'Checking...'}
				</p>
			</div>
			<HugeiconsIcon
				icon={icon}
				className='size-5 text-muted-foreground'
			/>
		</div>
	);

	return (
		<div className='max-w-2xl mx-auto space-y-8 p-8'>
			<div className='text-center space-y-2'>
				<h1 className="text-3xl font-['outfit'] font-bold">Interview Setup</h1>
				<p className="text-muted-foreground font-['outfit']">
					Please ensure all checks pass before starting your interview
				</p>
			</div>

			{stream && (
				<Card className='overflow-hidden py-0'>
					<video
						autoPlay
						playsInline
						muted
						ref={(video) => {
							if (video && stream) {
								video.srcObject = stream;
							}
						}}
						className='w-full aspect-video object-cover bg-muted'
					/>
				</Card>
			)}

			<div className='space-y-3'>
				<CheckItem
					label='Browser Compatibility'
					passed={checks.browser}
					icon={ComputerIcon}
				/>
				<CheckItem
					label='Camera Access'
					passed={checks.camera}
					icon={VideoIcon}
				/>
				<CheckItem
					label='Microphone Access'
					passed={checks.microphone}
					icon={Mic01Icon}
				/>
			</div>

			{error && (
				<div className='p-4 rounded-lg bg-red-50 border border-red-200'>
					<p className="text-red-700 font-['outfit'] text-sm">
						<strong>Error:</strong> {error.message}
					</p>
				</div>
			)}

			<Card className='p-6 space-y-4 bg-muted/50'>
				<div className='flex items-start gap-3'>
					<HugeiconsIcon
						icon={ClockIcon}
						className='size-5 text-ocean-wave shrink-0 mt-0.5'
					/>
					<div>
						<h3 className="font-['outfit'] font-medium">Interview Guidelines</h3>
						<ul className="mt-2 space-y-1 text-sm text-muted-foreground font-['outfit']">
							<li>• Interview duration: 5 minutes</li>
							<li>• Total questions: 5 (including introduction)</li>
							<li>• Stay in fullscreen mode during the interview</li>
							<li>• Speak clearly when answering questions</li>
							<li>• You'll receive at least one multiple-choice question</li>
						</ul>
					</div>
				</div>
			</Card>

			<Button
				onClick={handleStart}
				disabled={!allChecksPass}
				size='lg'
				className="w-full font-['outfit'] text-lg h-14"
			>
				{allChecksPass ? 'Start Interview' : 'Waiting for setup...'}
			</Button>
		</div>
	);
}
