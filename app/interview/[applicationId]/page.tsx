import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth';
import { getApplicationById } from '@/actions/applications';
import { InterviewStartClient } from './page-client';

interface InterviewStartPageProps {
	params: Promise<{ applicationId: string }>;
}

export default async function InterviewStartPage({ params }: InterviewStartPageProps) {
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

	if (result.application.interviewEligible !== 1 || result.application.status !== 'reviewed') {
		redirect(`/dashboard/applications/${applicationId}`);
	}

	return <InterviewStartClient applicationId={applicationId} />;
}
