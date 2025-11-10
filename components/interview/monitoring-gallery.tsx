'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Download01Icon, Play01Icon, Pause01Icon, Image01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { env } from '@/env';
import type { MonitoringImage } from '@/types/interview';

interface MonitoringGalleryProps {
	images: MonitoringImage[];
}

export function MonitoringGallery({ images }: MonitoringGalleryProps) {
	const [selectedImage, setSelectedImage] = useState<MonitoringImage | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentIndex, setCurrentIndex] = useState(0);

	const formatTime = (timestamp: Date | string) => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		});
	};

	const getImageUrl = (s3Key: string) => {
		return `${env.NEXT_PUBLIC_R2_URL}/${s3Key}`;
	};

	const handlePlayback = () => {
		if (isPlaying) {
			setIsPlaying(false);
			return;
		}

		setIsPlaying(true);
		let index = 0;

		const interval = setInterval(() => {
			if (index >= images.length - 1) {
				setIsPlaying(false);
				clearInterval(interval);
				return;
			}

			index++;
			setCurrentIndex(index);
			setSelectedImage(images[index]);
		}, 1000);
	};

	const handleDownloadAll = async () => {
		for (const image of images) {
			const url = getImageUrl(image.s3Key);
			const a = document.createElement('a');
			a.href = url;
			a.download = `snapshot-${formatTime(image.capturedAt)}.jpg`;
			a.click();
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
	};

	if (images.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center h-full py-12 text-center'>
				<HugeiconsIcon
					icon={Image01Icon}
					className='size-16 text-muted-foreground mb-4'
				/>
				<p className="text-muted-foreground font-['outfit']">No monitoring images available</p>
			</div>
		);
	}

	return (
		<div className='space-y-4 h-full flex flex-col'>
			<div className='flex items-center justify-between'>
				<div>
					<p className="text-sm font-['outfit'] font-medium">{images.length} Snapshots</p>
					<p className="text-xs text-muted-foreground font-['outfit']">
						Captured every 10 seconds
					</p>
				</div>

				<div className='flex gap-2'>
					<Button
						variant='outline'
						size='sm'
						onClick={handlePlayback}
						className="font-['outfit']"
					>
						<HugeiconsIcon
							icon={isPlaying ? Pause01Icon : Play01Icon}
							className='size-4 mr-2'
						/>
						{isPlaying ? 'Pause' : 'Play'}
					</Button>
					<Button
						variant='outline'
						size='sm'
						onClick={handleDownloadAll}
						className="font-['outfit']"
					>
						<HugeiconsIcon
							icon={Download01Icon}
							className='size-4 mr-2'
						/>
						Download All
					</Button>
				</div>
			</div>

			<div className='flex-1 overflow-y-auto'>
				<div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
					{images.map((image, index) => (
						<button
							key={image.id}
							type='button'
							onClick={() => {
								setSelectedImage(image);
								setCurrentIndex(index);
							}}
							className={cn(
								'relative aspect-video rounded-lg overflow-hidden border-2 transition-all',
								'hover:border-ocean-wave hover:shadow-lg',
								currentIndex === index && isPlaying
									? 'border-ocean-wave ring-2 ring-ocean-wave/20'
									: 'border-border'
							)}
						>
							<img
								src={getImageUrl(image.s3Key)}
								alt={`Snapshot ${index + 1}`}
								className='w-full h-full object-cover'
							/>
							<div className='absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs font-["outfit"]'>
								{formatTime(image.capturedAt)}
							</div>
						</button>
					))}
				</div>
			</div>

			<Dialog
				open={Boolean(selectedImage)}
				onOpenChange={(open) => !open && setSelectedImage(null)}
			>
				<DialogContent className='max-w-4xl'>
					{selectedImage && (
						<div className='space-y-4'>
							<img
								src={getImageUrl(selectedImage.s3Key)}
								alt='Full size snapshot'
								className='w-full rounded-lg'
							/>
							<div className='flex items-center justify-between'>
								<p className="text-sm text-muted-foreground font-['outfit']">
									Captured at {formatTime(selectedImage.capturedAt)}
								</p>
								<Button
									variant='outline'
									size='sm'
									asChild
								>
									<a
										href={getImageUrl(selectedImage.s3Key)}
										download={`snapshot-${formatTime(selectedImage.capturedAt)}.jpg`}
										className="font-['outfit']"
									>
										<HugeiconsIcon
											icon={Download01Icon}
											className='size-4 mr-2'
										/>
										Download
									</a>
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}

