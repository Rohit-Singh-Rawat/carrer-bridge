import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth';
import { getApplicationById } from '@/actions/applications';
import { db } from '@/db';
import { interviews } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { InterviewSessionClient } from './page-client';

interface InterviewSessionPageProps {
	params: Promise<{ applicationId: string }>;
}

export default async function InterviewSessionPage({ params }: InterviewSessionPageProps) {
	const user = await getCurrentUser();

	if (!user) {
		redirect('/login');
	}

	const { applicationId } = await params;
	const result = await getApplicationById(applicationId);

	if (!result.success || !result.application) {
		notFound();
	}

	if (result.application.userId !== user.id) {
		redirect('/dashboard/applications');
	}

	const interview = await db.query.interviews.findFirst({
		where: eq(interviews.applicationId, applicationId),
	});

	if (!interview) {
		redirect(`/interview/${applicationId}`);
	}

	if (interview.status === 'completed') {
		redirect(`/interview/${applicationId}/complete`);
	}

	if (interview.status !== 'in_progress') {
		redirect(`/interview/${applicationId}`);
	}

	return (
		<InterviewSessionClient
			applicationId={applicationId}
			interviewId={interview.id}
		/>
	);
}

