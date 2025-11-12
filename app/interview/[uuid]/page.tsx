import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { getCurrentUser } from '@/actions/auth';
import { getApplicationById } from '@/actions/applications';
import { PreInterviewCheck } from '@/components/interview/pre-interview-check';

interface InterviewPageProps {
	params: Promise<{ uuid: string }>;
}

export default async function InterviewPage({ params }: InterviewPageProps) {
	const user = await getCurrentUser();

	if (!user) {
		redirect('/login');
	}

	const { uuid } = await params;
	
	// Get application by uuid
	const result = await getApplicationById(uuid);

	if (!result.success || !result.application) {
		notFound();
	}

	const application = result.application;

	// Check ownership
	if (application.userId !== user.id) {
		redirect('/dashboard/applications');
	}

	// Check eligibility
	if (application.interviewEligible !== 1 || application.status !== 'reviewed') {
		redirect(`/dashboard/applications/${uuid}`);
	}

	return (
		<div className="container px-4 py-8 mx-auto relative">
			<div className="max-w-3xl mx-auto relative z-10">
				<Card className="mb-6 border-border shadow-lg">
					<CardHeader>
						<h1 className="text-3xl font-bold font-['outfit']">
							{application.job?.title || 'Position'} - AI Interview
						</h1>
						<p className="text-muted-foreground font-['outfit']">
							Virtual interview for{' '}
							{application.job?.recruiter?.recruiterProfile?.companyName || 'Company'}
						</p>
					</CardHeader>
					<CardContent>
						<PreInterviewCheck
							onStart={() => {
								// Navigate to session on start
								window.location.href = `/interview/${uuid}/session`;
							}}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
