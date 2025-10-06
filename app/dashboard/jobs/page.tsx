import { getCurrentUser } from '@/actions/auth';
import { getJobs } from '@/actions/jobs';
import { getJobApplicationCount } from '@/actions/applications';
import { CreateJobDialog } from '@/components/jobs/create-job-dialog';
import { EmptyJobsState } from '@/components/jobs/empty-jobs-state';
import { JobCard } from '@/components/jobs/job-card';

export default async function JobsPage() {
	const user = await getCurrentUser();

	if (!user) {
		return null;
	}

	const jobsResult = await getJobs();
	const jobs = jobsResult.success ? jobsResult.jobs : [];

	// Get application counts for recruiters
	let applicationCounts: Record<string, number> = {};
	if (user.role === 'recruiter' && jobs.length > 0) {
		const counts = await Promise.all(jobs.map((job) => getJobApplicationCount(job.id)));
		jobs.forEach((job, index) => {
			applicationCounts[job.id] = counts[index];
		});
	}

	return (
		<div className='space-y-8'>
			<div className='flex items-start justify-between gap-4 flex-wrap'>
				<div className='space-y-2'>
					<h1 className="text-4xl font-['outfit'] font-medium tracking-tight">
						{user.role === 'recruiter' ? 'Manage Jobs' : 'Browse Jobs'}
					</h1>
					<p className="text-muted-foreground font-['outfit'] text-lg">
						{user.role === 'recruiter'
							? 'Create and manage your job postings'
							: 'Discover opportunities that match your skills'}
					</p>
				</div>
				{user.role === 'recruiter' && <CreateJobDialog />}
			</div>

			{jobs.length === 0 ? (
				<EmptyJobsState isRecruiter={user.role === 'recruiter'} />
			) : (
				<div className='space-y-4'>
					<div className='flex items-center justify-between px-1'>
						<p className="text-sm text-muted-foreground font-['outfit']">
							{jobs.length} {jobs.length === 1 ? 'opportunity' : 'opportunities'} available
						</p>
					</div>
					<div className='space-y-4'>
						{jobs.map((job) => (
							<JobCard
								key={job.id}
								job={job}
								isRecruiter={user.role === 'recruiter'}
								applicationCount={applicationCounts[job.id] || 0}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
