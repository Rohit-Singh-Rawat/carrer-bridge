'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { File01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { createApplication } from '@/actions/applications';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import type { Resume } from '@/db/schema';
import { cn } from '@/lib/utils';

interface ApplyToJobDialogProps {
	jobId: string;
	jobTitle: string;
	resumes: Resume[];
}

export function ApplyToJobDialog({ jobId, jobTitle, resumes }: ApplyToJobDialogProps) {
	const [open, setOpen] = useState(false);
	const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
	const [isPending, startTransition] = useTransition();
	const router = useRouter();

	const handleApply = () => {
		if (!selectedResumeId) {
			toast.error('Please select a resume');
			return;
		}

		startTransition(async () => {
			const result = await createApplication(jobId, selectedResumeId);
			if (result.success) {
				toast.success(result.message || 'Application submitted successfully!');
				setOpen(false);
				setSelectedResumeId(null);
				router.refresh();
			} else {
				toast.error(result.message || 'Failed to submit application');
			}
		});
	};

	if (resumes.length === 0) {
		return (
			<Button
				onClick={() => {
					toast.error('Please upload a resume first', {
						description: 'You need to have at least one resume to apply for jobs.',
						action: {
							label: 'Upload Resume',
							onClick: () => router.push('/dashboard/resumes'),
						},
					});
				}}
				size='lg'
				className="font-['outfit'] bg-ocean-wave hover:bg-deep-sea text-white"
				disabled={isPending}
			>
				Apply Now
			</Button>
		);
	}

	return (
		<Dialog
			open={open}
			onOpenChange={setOpen}
		>
			<DialogTrigger asChild>
				<Button
					size='lg'
					className="font-['outfit'] bg-ocean-wave hover:bg-deep-sea text-white"
					disabled={isPending}
				>
					{isPending ? 'Applying...' : 'Apply Now'}
				</Button>
			</DialogTrigger>
			<DialogContent className='sm:max-w-[500px]'>
				<DialogHeader>
					<DialogTitle className="font-['outfit'] text-xl">Apply to {jobTitle}</DialogTitle>
					<DialogDescription className="font-['outfit']">
						Choose which resume you'd like to submit with your application
					</DialogDescription>
				</DialogHeader>

				<div className='space-y-3 py-4'>
					{resumes.map((resume) => (
						<button
							key={resume.id}
							type='button'
							onClick={() => setSelectedResumeId(resume.id)}
							className={cn(
								"w-full rounded-lg border-2 p-4 text-left transition-all hover:border-ocean-wave hover:bg-muted/50 font-['outfit']",
								selectedResumeId === resume.id
									? 'border-ocean-wave bg-ocean-mist/20'
									: 'border-border bg-background'
							)}
						>
							<div className='flex items-start gap-3'>
								<div className='rounded-md bg-muted p-2'>
									<HugeiconsIcon
										icon={File01Icon}
										className='size-5 text-muted-foreground'
									/>
								</div>
								<div className='flex-1 min-w-0'>
									<h4 className='font-medium text-foreground'>{resume.title}</h4>
									{resume.description && (
										<p className='text-sm text-muted-foreground mt-1 line-clamp-1'>
											{resume.description}
										</p>
									)}
									<p className='text-xs text-muted-foreground mt-1'>
										Updated {new Date(resume.updatedAt).toLocaleDateString()}
									</p>
								</div>
								{selectedResumeId === resume.id && (
									<div className='size-5 rounded-full bg-ocean-wave flex items-center justify-center shrink-0'>
										<svg
											className='size-3 text-white'
											fill='none'
											viewBox='0 0 24 24'
											stroke='currentColor'
										>
											<path
												strokeLinecap='round'
												strokeLinejoin='round'
												strokeWidth={3}
												d='M5 13l4 4L19 7'
											/>
										</svg>
									</div>
								)}
							</div>
						</button>
					))}
				</div>

				<DialogFooter>
					<Button
						variant='outline'
						onClick={() => setOpen(false)}
						disabled={isPending}
						className="font-['outfit']"
					>
						Cancel
					</Button>
					<Button
						onClick={handleApply}
						disabled={!selectedResumeId || isPending}
						className="font-['outfit'] bg-ocean-wave hover:bg-deep-sea text-white"
					>
						{isPending ? 'Submitting...' : 'Submit Application'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
