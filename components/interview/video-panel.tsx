'use client';

import { forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDuration, getTimerColor, getTimerBgColor } from '@/lib/utils/interview';
import {
	Mic01Icon,
	MicOff01Icon,
	VideoIcon,
	VideoOffIcon,
	StopIcon,
	CameraVideoIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

interface VideoPanelProps {
	stream: MediaStream | null;
	isMonitoring: boolean;
	remainingTime: number;
	snapshotCount: number;
	isMuted: boolean;
	isCameraOff: boolean;
	onToggleMute: () => void;
	onToggleCamera: () => void;
	onEndInterview: () => void;
	className?: string;
}

export const VideoPanel = forwardRef<HTMLVideoElement, VideoPanelProps>(
	(
		{
			stream,
			isMonitoring,
			remainingTime,
			snapshotCount,
			isMuted,
			isCameraOff,
			onToggleMute,
			onToggleCamera,
			onEndInterview,
			className,
		},
		ref
	) => {
		return (
			<div className={cn('flex flex-col h-full space-y-4', className)}>
				<div className='relative flex-1 rounded-xl overflow-hidden bg-muted border'>
					{stream && !isCameraOff ? (
						<video
							ref={ref}
							autoPlay
							playsInline
							muted
							className='w-full h-full object-cover'
						/>
					) : (
						<div className='w-full h-full flex items-center justify-center'>
							<div className='text-center space-y-4'>
								<HugeiconsIcon
									icon={VideoOffIcon}
									className='size-16 mx-auto text-muted-foreground'
								/>
								<p className="text-muted-foreground font-['outfit']">
									{isCameraOff ? 'Camera is off' : 'No video feed'}
								</p>
							</div>
						</div>
					)}

					{isMonitoring && (
						<div className='absolute top-3 left-3 flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-full text-sm'>
							<div className='size-2 rounded-full bg-white animate-pulse' />
							<span className="font-['outfit'] font-medium">Recording</span>
						</div>
					)}
				</div>

				<div
					className={cn(
						"rounded-xl border-2 p-6 text-center font-['outfit']",
						getTimerBgColor(remainingTime)
					)}
				>
					<div className='space-y-1'>
						<p className='text-sm text-muted-foreground'>Time Remaining</p>
						<p className={cn('text-4xl font-bold', getTimerColor(remainingTime))}>
							{formatDuration(remainingTime)}
						</p>
					</div>
				</div>

				<div className='grid grid-cols-3 gap-3'>
					<Button
						variant='outline'
						size='lg'
						onClick={onToggleMute}
						className="font-['outfit']"
					>
						<HugeiconsIcon
							icon={isMuted ? MicOff01Icon : Mic01Icon}
							className='size-5'
						/>
					</Button>

					<Button
						variant='outline'
						size='lg'
						onClick={onToggleCamera}
						className="font-['outfit']"
					>
						<HugeiconsIcon
							icon={isCameraOff ? VideoOffIcon : VideoIcon}
							className='size-5'
						/>
					</Button>

					<Button
						variant='destructive'
						size='lg'
						onClick={onEndInterview}
						className="font-['outfit']"
					>
						<HugeiconsIcon
							icon={StopIcon}
							className='size-5'
						/>
					</Button>
				</div>

				{isMonitoring && (
					<div className='text-center text-sm text-muted-foreground'>
						<p className="font-['outfit']">{snapshotCount} snapshots captured</p>
					</div>
				)}
			</div>
		);
	}
);

VideoPanel.displayName = 'VideoPanel';

