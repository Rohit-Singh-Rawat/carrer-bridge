import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth';
import { getApplicationById } from '@/actions/applications';
import { db } from '@/db';
import { interviews } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { InterviewReviewClient } from './page-client';

interface InterviewReviewPageProps {
	params: Promise<{ id: string }>;
}

export default async function InterviewReviewPage({ params }: InterviewReviewPageProps) {
	const user = await getCurrentUser();

	if (!user || user.role !== 'recruiter') {
		redirect('/dashboard');
	}

	const { id } = await params;
	const result = await getApplicationById(id);

	if (!result.success || !result.application) {
		notFound();
	}

	if (result.application.job.recruiterId !== user.userId) {
		redirect('/dashboard');
	}

	const interview = await db.query.interviews.findFirst({
		where: eq(interviews.applicationId, id),
		with: {
			messages: {
				orderBy: (messages, { asc }) => [asc(messages.timestamp)],
			},
			monitoringImages: {
				orderBy: (images, { asc }) => [asc(images.capturedAt)],
			},
		},
	});

	if (!interview || interview.status !== 'completed') {
		return (
			<div className='max-w-4xl mx-auto p-8'>
				<div className='text-center space-y-4'>
					<h1 className="text-2xl font-['outfit'] font-bold">No Interview Available</h1>
					<p className="text-muted-foreground font-['outfit']">
						This candidate has not completed their interview yet.
					</p>
				</div>
			</div>
		);
	}

	return (
		<InterviewReviewClient
			interview={interview}
			application={result.application}
		/>
	);
}

