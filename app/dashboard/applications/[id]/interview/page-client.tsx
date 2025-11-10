'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TranscriptViewer } from '@/components/interview/transcript-viewer';
import { MonitoringGallery } from '@/components/interview/monitoring-gallery';
import { formatDuration } from '@/lib/utils/interview';
import { ArrowLeft01Icon, ClockIcon, MessageIcon, Quiz01Icon, UserIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { Interview, InterviewMessage, MonitoringImage, Application } from '@/db/schema';

interface InterviewReviewClientProps {
	interview: Interview & {
		messages: InterviewMessage[];
		monitoringImages: MonitoringImage[];
	};
	application: Application & {
		user: any;
		job: any;
	};
}

export function InterviewReviewClient({ interview, application }: InterviewReviewClientProps) {
	const userMessages = interview.messages.filter((m) => m.role === 'user');
	const mcqMessages = interview.messages.filter((m) => m.messageType === 'mcq');

	return (
		<div className='space-y-6 pb-12'>
			<Link href={`/dashboard/applications/${application.id}`}>
				<Button
					variant='ghost'
					className="gap-2 font-['outfit'] -ml-2 hover:bg-transparent"
				>
					<HugeiconsIcon
						icon={ArrowLeft01Icon}
						className='size-4'
					/>
					Back to Application
				</Button>
			</Link>

			<div className='space-y-4'>
				<div className='flex items-start justify-between gap-4'>
					<div className='space-y-1'>
						<h1 className="text-3xl font-['outfit'] font-bold">Interview Review</h1>
						<p className="text-muted-foreground font-['outfit']">
							{application.user.fullName} - {application.job.title}
						</p>
					</div>
				</div>

				<Card className='p-6'>
					<div className='grid grid-cols-1 sm:grid-cols-4 gap-4'>
						<div className='space-y-1'>
							<div className='flex items-center gap-2 text-muted-foreground'>
								<HugeiconsIcon
									icon={ClockIcon}
									className='size-5'
								/>
								<span className="text-sm font-['outfit']">Duration</span>
							</div>
							<p className="text-2xl font-bold font-['outfit']">
								{formatDuration(interview.duration || 0)}
							</p>
						</div>

						<div className='space-y-1'>
							<div className='flex items-center gap-2 text-muted-foreground'>
								<HugeiconsIcon
									icon={MessageIcon}
									className='size-5'
								/>
								<span className="text-sm font-['outfit']">Responses</span>
							</div>
							<p className="text-2xl font-bold font-['outfit']">{userMessages.length}</p>
						</div>

						<div className='space-y-1'>
							<div className='flex items-center gap-2 text-muted-foreground'>
								<HugeiconsIcon
									icon={Quiz01Icon}
									className='size-5'
								/>
								<span className="text-sm font-['outfit']">MCQ Questions</span>
							</div>
							<p className="text-2xl font-bold font-['outfit']">{mcqMessages.length}</p>
						</div>

						<div className='space-y-1'>
							<div className='flex items-center gap-2 text-muted-foreground'>
								<HugeiconsIcon
									icon={UserIcon}
									className='size-5'
								/>
								<span className="text-sm font-['outfit']">Snapshots</span>
							</div>
							<p className="text-2xl font-bold font-['outfit']">{interview.monitoringImages.length}</p>
						</div>
					</div>
				</Card>
			</div>

			<Separator />

			<div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
				<Card className='p-6'>
					<h2 className="text-xl font-['outfit'] font-medium mb-4">Interview Transcript</h2>
					<div className='h-[600px]'>
						<TranscriptViewer messages={interview.messages} />
					</div>
				</Card>

				<Card className='p-6'>
					<h2 className="text-xl font-['outfit'] font-medium mb-4">Monitoring Snapshots</h2>
					<div className='h-[600px]'>
						<MonitoringGallery images={interview.monitoringImages} />
					</div>
				</Card>
			</div>
		</div>
	);
}

