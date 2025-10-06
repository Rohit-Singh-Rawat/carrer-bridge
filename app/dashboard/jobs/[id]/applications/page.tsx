import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth';
import { getJobApplications } from '@/actions/applications';
import { getJobById } from '@/actions/jobs';
import { JobApplicationsClient } from './page-client';

interface JobApplicationsPageProps {
	params: Promise<{ id: string }>;
}

export default async function JobApplicationsPage({ params }: JobApplicationsPageProps) {
	const user = await getCurrentUser();

	if (!user) {
		redirect('/login');
	}

	if (user.role !== 'recruiter') {
		redirect('/dashboard/jobs');
	}

	const { id } = await params;
	const [applicationsResult, jobResult] = await Promise.all([
		getJobApplications(id),
		getJobById(id),
	]);

	if (!applicationsResult.success || !jobResult.success) {
		notFound();
	}

	return (
		<JobApplicationsClient
			applications={applicationsResult.applications || []}
			job={jobResult.job}
		/>
	);
}
