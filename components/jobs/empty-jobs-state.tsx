import { BriefcaseIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { CreateJobDialog } from './create-job-dialog';

interface EmptyJobsStateProps {
	isRecruiter: boolean;
}

export function EmptyJobsState({ isRecruiter }: EmptyJobsStateProps) {
	if (isRecruiter) {
		return (
			<div className='flex flex-col items-center justify-center py-20 px-4'>
				<div className='rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-8 mb-6 border border-primary/10'>
					<HugeiconsIcon
						icon={BriefcaseIcon}
						className='size-20 text-primary'
					/>
				</div>
				<h3 className="text-3xl font-['outfit'] font-bold mb-3 text-center">No job postings yet</h3>
				<p className="text-muted-foreground font-['outfit'] text-center max-w-lg mb-8 leading-relaxed text-lg">
					Get started by creating your first job posting. Attract top talent by sharing your
					opportunities with qualified candidates.
				</p>
				<CreateJobDialog />
			</div>
		);
	}

	return (
		<div className='flex flex-col items-center justify-center py-20 px-4'>
			<div className='rounded-2xl bg-muted/50 p-8 mb-6 border border-border/50'>
				<HugeiconsIcon
					icon={BriefcaseIcon}
					className='size-20 text-muted-foreground'
				/>
			</div>
			<h3 className="text-3xl font-['outfit'] font-bold mb-3 text-center">No jobs available</h3>
			<p className="text-muted-foreground font-['outfit'] text-center max-w-lg leading-relaxed text-lg">
				There are currently no active job postings. Check back soon for new opportunities that match
				your skills and interests.
			</p>
		</div>
	);
}
