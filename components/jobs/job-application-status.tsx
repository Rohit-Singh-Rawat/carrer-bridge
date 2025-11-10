'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Application } from '@/db/schema';

interface JobApplicationStatusProps {
	application: Application | null;
	jobId: string;
	onApply?: () => void;
	isApplying?: boolean;
	showInterviewButton?: boolean;
	className?: string;
}

export function JobApplicationStatus({
	application,
	jobId,
	onApply,
	isApplying = false,
	showInterviewButton = true,
	className,
}: JobApplicationStatusProps) {
	const getStatusColor = (status: string) => {
		switch (status) {
			case 'pending':
				return 'bg-amber-50 text-amber-700 border-amber-200';
			case 'reviewed':
				return 'bg-blue-50 text-blue-700 border-blue-200';
			case 'in_progress':
				return 'bg-cyan-50 text-cyan-700 border-cyan-200';
			case 'accepted':
				return 'bg-emerald-50 text-emerald-700 border-emerald-200';
			case 'rejected':
				return 'bg-red-50 text-red-700 border-red-200';
			default:
				return 'bg-muted text-muted-foreground';
		}
	};

	const formatStatus = (status: string) => {
		return status
			.split('_')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	// If no application, show Apply button
	if (!application) {
		return (
			<div className={cn('space-y-2', className)}>
				<Button
					onClick={onApply}
					disabled={isApplying}
					size='lg'
					className="w-full font-['outfit']"
				>
					{isApplying ? 'Applying...' : 'Apply Now'}
				</Button>
			</div>
		);
	}

	// If application exists, show status and appropriate actions
	return (
		<div className={cn('space-y-3', className)}>
			<div className='flex items-center justify-between gap-4'>
				<span className="text-sm font-['outfit'] text-muted-foreground">Application Status</span>
				<Badge
					variant='outline'
					className={cn(getStatusColor(application.status), "font-['outfit'] text-sm border")}
				>
					{formatStatus(application.status)}
				</Badge>
			</div>

			{/* Show Interview Button if eligible */}
			{showInterviewButton && application.interviewEligible === 1 && application.status === 'reviewed' && (
				<Button
					asChild
					size='lg'
					className="w-full font-['outfit']"
				>
					<Link href={`/interview/${application.id}`}>Start Interview</Link>
				</Button>
			)}

			{/* View Application Details */}
			<Button
				asChild
				variant='outline'
				size='lg'
				className="w-full font-['outfit']"
			>
				<Link href={`/dashboard/applications/${application.id}`}>View Application</Link>
			</Button>

			{/* Additional status messages */}
			{application.status === 'pending' && (
				<p className="text-xs text-muted-foreground text-center font-['outfit']">
					Your application is being reviewed
				</p>
			)}

			{application.status === 'reviewed' && application.interviewEligible === 1 && (
				<p className="text-xs text-emerald-600 text-center font-['outfit'] font-medium">
					🎉 You're eligible for an interview!
				</p>
			)}

			{application.status === 'accepted' && (
				<p className="text-xs text-emerald-600 text-center font-['outfit'] font-medium">
					🎊 Congratulations! Your application was accepted
				</p>
			)}

			{application.status === 'rejected' && (
				<p className="text-xs text-muted-foreground text-center font-['outfit']">
					Keep applying to other opportunities
				</p>
			)}
		</div>
	);
}

