import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth';
import { getUserApplications } from '@/actions/applications';
import { ApplicationsPageClient } from './page-client';

export default async function ApplicationsPage() {
	const user = await getCurrentUser();

	if (!user) {
		redirect('/login');
	}

	if (user.role !== 'user') {
		redirect('/dashboard/jobs');
	}

	const result = await getUserApplications();

	return <ApplicationsPageClient applications={result.applications || []} />;
}
