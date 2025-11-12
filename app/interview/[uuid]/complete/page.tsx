'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, Home, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InterviewCompletePageProps {
	params: Promise<{ uuid: string }>;
}

export default function InterviewCompletePage({ params }: InterviewCompletePageProps) {
	const { uuid } = use(params);
	const router = useRouter();
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		// Prevent accidental page reload
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = '';
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, []);

	const handleViewApplication = () => {
		router.push(`/dashboard/applications/${uuid}`);
	};

	const handleGoHome = () => {
		router.push('/dashboard');
	};

	return (
		<div className='h-screen flex items-center justify-center bg-background p-4'>
			<Card className='max-w-2xl w-full'>
				<CardHeader className='text-center pb-4'>
					<div className='flex justify-center mb-4'>
						<div className='rounded-full bg-primary/10 p-6'>
							<CheckCircle className='w-16 h-16 text-primary' />
						</div>
					</div>
					<CardTitle className='text-3xl font-bold'>Interview Complete!</CardTitle>
				</CardHeader>
				<CardContent className='space-y-6'>
					<div className='text-center space-y-3'>
						<p className='text-lg text-muted-foreground'>
							Thank you for completing your interview. Your responses have been recorded and will be
							reviewed by our team.
						</p>
						<p className='text-sm text-muted-foreground'>
							You will receive an email notification once your interview has been evaluated. This
							typically takes 24-48 hours.
						</p>
					</div>

					<div className='border-t border-border pt-6'>
						<h3 className='font-semibold mb-3'>What happens next?</h3>
						<ul className='space-y-2 text-sm text-muted-foreground'>
							<li className='flex items-start gap-2'>
								<div className='w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0' />
								<span>
									Your interview recording and transcript will be analyzed by our AI system
								</span>
							</li>
							<li className='flex items-start gap-2'>
								<div className='w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0' />
								<span>A detailed performance report will be generated</span>
							</li>
							<li className='flex items-start gap-2'>
								<div className='w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0' />
								<span>The hiring team will review your responses and the AI evaluation</span>
							</li>
							<li className='flex items-start gap-2'>
								<div className='w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0' />
								<span>You'll be notified of the decision via email</span>
							</li>
						</ul>
					</div>

					<div className='flex gap-3 pt-4'>
						<Button
							variant='outline'
							onClick={handleViewApplication}
							className='flex-1 gap-2'
						>
							<FileText className='w-4 h-4' />
							View Application
						</Button>
						<Button
							onClick={handleGoHome}
							className='flex-1 gap-2'
						>
							<Home className='w-4 h-4' />
							Go to Dashboard
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
