import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/actions/auth';
import { getApplicationById } from '@/actions/applications';
import { db } from '@/db';
import { interviews } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatDuration } from '@/lib/utils/interview';
import { Tick02Icon, ClockIcon, MessageIcon, Quiz01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

interface InterviewCompletePageProps {
	params: Promise<{ applicationId: string }>;
}

export default async function InterviewCompletePage({ params }: InterviewCompletePageProps) {
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
		with: {
			messages: true,
		},
	});

	if (!interview || interview.status !== 'completed') {
		redirect(`/interview/${applicationId}`);
	}

	const userMessages = interview.messages.filter((m) => m.role === 'user');
	const mcqMessages = interview.messages.filter((m) => m.messageType === 'mcq');

	return (
		<div className='min-h-screen bg-gradient-to-br from-ocean-wave/10 to-background flex items-center justify-center p-8'>
			<div className='max-w-2xl w-full space-y-8'>
				<div className='text-center space-y-4'>
					<div className='inline-flex items-center justify-center size-20 rounded-full bg-green-100'>
						<HugeiconsIcon
							icon={Tick02Icon}
							className='size-10 text-green-600'
						/>
					</div>
					<h1 className="text-4xl font-['outfit'] font-bold">Interview Completed!</h1>
					<p className="text-lg text-muted-foreground font-['outfit']">
						Thank you for completing your interview. Your responses have been recorded and will be
						reviewed by the recruiter.
					</p>
				</div>

				<Card className='p-8 space-y-6'>
					<h2 className="text-xl font-['outfit'] font-medium">Interview Summary</h2>

					<div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
						<div className='p-4 rounded-lg bg-muted space-y-2'>
							<div className='flex items-center gap-2 text-muted-foreground'>
								<HugeiconsIcon
									icon={ClockIcon}
									className='size-5'
								/>
								<span className="text-sm font-['outfit']">Duration</span>
							</div>
							<p className="text-2xl font-bold font-['outfit']">
								{formatDuration(interview.duration || 0)}
							</p>
						</div>

						<div className='p-4 rounded-lg bg-muted space-y-2'>
							<div className='flex items-center gap-2 text-muted-foreground'>
								<HugeiconsIcon
									icon={MessageIcon}
									className='size-5'
								/>
								<span className="text-sm font-['outfit']">Answered</span>
							</div>
							<p className="text-2xl font-bold font-['outfit']">{userMessages.length}</p>
						</div>

						<div className='p-4 rounded-lg bg-muted space-y-2'>
							<div className='flex items-center gap-2 text-muted-foreground'>
								<HugeiconsIcon
									icon={Quiz01Icon}
									className='size-5'
								/>
								<span className="text-sm font-['outfit']">MCQ Questions</span>
							</div>
							<p className="text-2xl font-bold font-['outfit']">{mcqMessages.length}</p>
						</div>
					</div>

					<div className='pt-4 border-t space-y-4'>
						<h3 className="font-['outfit'] font-medium">Next Steps</h3>
						<ul className="space-y-2 text-sm text-muted-foreground font-['outfit']">
							<li className='flex items-start gap-2'>
								<Tick02Icon className='size-5 text-ocean-wave shrink-0 mt-0.5' />
								<span>Your interview recording and transcript have been saved</span>
							</li>
							<li className='flex items-start gap-2'>
								<Tick02Icon className='size-5 text-ocean-wave shrink-0 mt-0.5' />
								<span>The recruiter will review your interview within 3-5 business days</span>
							</li>
							<li className='flex items-start gap-2'>
								<Tick02Icon className='size-5 text-ocean-wave shrink-0 mt-0.5' />
								<span>You'll receive an email notification once your application is reviewed</span>
							</li>
						</ul>
					</div>
				</Card>

				<div className='flex gap-4'>
					<Button
						asChild
						variant='outline'
						size='lg'
						className="flex-1 font-['outfit']"
					>
						<Link href={`/dashboard/applications/${applicationId}`}>View Application</Link>
					</Button>
					<Button
						asChild
						size='lg'
						className="flex-1 font-['outfit']"
					>
						<Link href='/dashboard'>Return to Dashboard</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}

