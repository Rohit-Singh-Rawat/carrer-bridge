'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDuration, getTimerColor } from '@/lib/utils/interview';
import {
	Mic01Icon,
	MicOff01Icon,
	VideoIcon,
	VideoOffIcon,
	CameraVideoIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';

interface InterviewControlsProps {
	isMuted: boolean;
	isCameraOff: boolean;
	onToggleMute: () => void;
	onToggleCamera: () => void;
	remainingTime: number;
	snapshotCount: number;
}

export function InterviewControls({
	isMuted,
	isCameraOff,
	onToggleMute,
	onToggleCamera,
	remainingTime,
	snapshotCount,
}: InterviewControlsProps) {
	return (
		<div className='fixed bottom-6 left-1/2 -translate-x-1/2 z-50'>
			<div className='bg-background/95 backdrop-blur-sm border rounded-xl shadow-lg p-4'>
				<div className='flex items-center gap-6'>
					<div className={cn("text-3xl font-bold font-['outfit']", getTimerColor(remainingTime))}>
						{formatDuration(remainingTime)}
					</div>

					<div className='h-8 w-px bg-border' />

					<TooltipProvider>
						<div className='flex items-center gap-2'>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant={isMuted ? 'destructive' : 'outline'}
										size='icon'
										onClick={onToggleMute}
										className='size-12 rounded-full'
									>
										<HugeiconsIcon
											icon={isMuted ? MicOff01Icon : Mic01Icon}
											className='size-5'
										/>
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p className="font-['outfit']">{isMuted ? 'Unmute' : 'Mute'} (Space)</p>
								</TooltipContent>
							</Tooltip>

							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant={isCameraOff ? 'destructive' : 'outline'}
										size='icon'
										onClick={onToggleCamera}
										className='size-12 rounded-full'
									>
										<HugeiconsIcon
											icon={isCameraOff ? VideoOffIcon : VideoIcon}
											className='size-5'
										/>
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p className="font-['outfit']">{isCameraOff ? 'Enable' : 'Disable'} Camera</p>
								</TooltipContent>
							</Tooltip>
						</div>
					</TooltipProvider>

					<div className='h-8 w-px bg-border' />

					<div className='flex items-center gap-2'>
						<HugeiconsIcon
							icon={CameraVideoIcon}
							className='size-4 text-muted-foreground'
						/>
						<span className="text-sm text-muted-foreground font-['outfit']">
							{snapshotCount} snapshots
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}

