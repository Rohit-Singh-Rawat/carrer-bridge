'use client';

import { useRouter } from 'next/navigation';
import { PreInterviewCheck } from '@/components/interview/pre-interview-check';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';

interface InterviewStartClientProps {
	applicationId: string;
}

export function InterviewStartClient({ applicationId }: InterviewStartClientProps) {
	const router = useRouter();
	const startMutation = trpc.interview.start.useMutation();

	const handleStart = async () => {
		try {
			const result = await startMutation.mutateAsync({ applicationId });
			toast.success('Interview started!');
			router.push(`/interview/${applicationId}/session`);
		} catch (error) {
			console.error('Error starting interview:', error);
			toast.error('Failed to start interview. Please try again.');
		}
	};

	return <PreInterviewCheck onStart={handleStart} />;
}

