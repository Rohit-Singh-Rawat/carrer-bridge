import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth';
import { getApplicationById } from '@/actions/applications';
import { ApplicationDetailClient } from './page-client';
import { db } from '@/db';
import { interviews } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface ApplicationDetailPageProps {
	params: Promise<{ id: string }>;
}

export default async function ApplicationDetailPage({ params }: ApplicationDetailPageProps) {
	const user = await getCurrentUser();

	if (!user) {
		redirect('/login');
	}

	const { id } = await params;
	const result = await getApplicationById(id);

	if (!result.success || !result.application) {
		notFound();
	}

	// Check if interview exists and is completed
	const interview = await db.query.interviews.findFirst({
		where: eq(interviews.applicationId, id),
	});

	return (
		<ApplicationDetailClient
			application={result.application}
			isRecruiter={user.role === 'recruiter'}
			hasCompletedInterview={interview?.status === 'completed'}
		/>
	);
}
