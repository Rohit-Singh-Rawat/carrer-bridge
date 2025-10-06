'use client';

import {
	ArrowLeft01Icon,
	UserIcon,
	File01Icon,
	Mail01Icon,
	ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface JobApplicationsClientProps {
	applications: any[];
	job: any;
}

export function JobApplicationsClient({ applications, job }: JobApplicationsClientProps) {
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

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	// Group applications by status
	const pendingCount = applications.filter((a) => a.status === 'pending').length;
	const reviewedCount = applications.filter((a) => a.status === 'reviewed').length;
	const inProgressCount = applications.filter((a) => a.status === 'in_progress').length;
	const acceptedCount = applications.filter((a) => a.status === 'accepted').length;
	const rejectedCount = applications.filter((a) => a.status === 'rejected').length;

	return (
		<div className='space-y-6'>
			{/* Back Button */}
			<Link href={`/dashboard/jobs/${job.id}`}>
				<Button
					variant='ghost'
					className="gap-2 font-['outfit'] -ml-2 hover:bg-transparent"
				>
					<HugeiconsIcon
						icon={ArrowLeft01Icon}
						className='size-4'
					/>
					Back to Job
				</Button>
			</Link>

			{/* Header */}
			<div className='space-y-4'>
				<div>
					<h1 className="text-3xl font-['outfit'] tracking-tight">{job.title}</h1>
					<p className="text-muted-foreground mt-2 font-['outfit']">
						Manage applications for this position
					</p>
				</div>

				{/* Stats */}
				<div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4'>
					<div className='rounded-lg border bg-card p-4'>
						<p className="text-2xl font-['outfit'] font-medium">{applications.length}</p>
						<p className="text-sm text-muted-foreground font-['outfit'] mt-1">Total</p>
					</div>
					<div className='rounded-lg border bg-amber-50 p-4'>
						<p className="text-2xl font-['outfit'] font-medium text-amber-700">{pendingCount}</p>
						<p className="text-sm text-amber-600 font-['outfit'] mt-1">Pending</p>
					</div>
					<div className='rounded-lg border bg-cyan-50 p-4'>
						<p className="text-2xl font-['outfit'] font-medium text-cyan-700">{inProgressCount}</p>
						<p className="text-sm text-cyan-600 font-['outfit'] mt-1">In Progress</p>
					</div>
					<div className='rounded-lg border bg-emerald-50 p-4'>
						<p className="text-2xl font-['outfit'] font-medium text-emerald-700">{acceptedCount}</p>
						<p className="text-sm text-emerald-600 font-['outfit'] mt-1">Accepted</p>
					</div>
					<div className='rounded-lg border bg-red-50 p-4'>
						<p className="text-2xl font-['outfit'] font-medium text-red-700">{rejectedCount}</p>
						<p className="text-sm text-red-600 font-['outfit'] mt-1">Rejected</p>
					</div>
				</div>
			</div>

			{/* Applications List */}
			{applications.length === 0 ? (
				<div className='flex flex-col items-center justify-center py-16 px-4 text-center'>
					<div className='rounded-full bg-muted p-6 mb-6'>
						<HugeiconsIcon
							icon={UserIcon}
							className='size-12 text-muted-foreground'
						/>
					</div>
					<h3 className="text-xl font-['outfit'] font-medium mb-2">No applications yet</h3>
					<p className="text-muted-foreground font-['outfit'] max-w-md">
						When candidates apply to this position, their applications will appear here
					</p>
				</div>
			) : (
				<div className='grid gap-4'>
					{applications.map((application) => (
						<Link
							key={application.id}
							href={`/dashboard/applications/${application.id}`}
							className='group'
						>
							<div className='rounded-xl border border-border/60 bg-background p-6 transition-all duration-300 hover:border-ocean-wave/40 hover:shadow-md hover:shadow-ocean-wave/5'>
								<div className='flex items-start justify-between gap-4'>
									<div className='flex-1 min-w-0 space-y-4'>
										{/* Applicant Info */}
										<div className='flex items-start gap-3'>
											<div className='rounded-lg bg-ocean-mist/30 p-2.5 shrink-0 group-hover:bg-ocean-breeze/30 transition-colors'>
												<HugeiconsIcon
													icon={UserIcon}
													className='size-5 text-ocean-wave'
												/>
											</div>
											<div className='flex-1 min-w-0'>
												<h3 className="text-lg font-['outfit'] font-medium text-foreground group-hover:text-ocean-wave transition-colors">
													{application.user.fullName}
												</h3>
												<div className='flex items-center gap-2 text-sm text-muted-foreground mt-1'>
													<HugeiconsIcon
														icon={Mail01Icon}
														className='size-4'
													/>
													<span className="font-['outfit']">{application.user.email}</span>
												</div>
											</div>
										</div>

										{/* Resume & Applied Date */}
										<div className='flex flex-wrap gap-x-6 gap-y-2 text-sm'>
											<div className='flex items-center gap-2 text-muted-foreground'>
												<HugeiconsIcon
													icon={File01Icon}
													className='size-4 shrink-0'
												/>
												<span className="font-['outfit']">{application.resume.title}</span>
											</div>
											<p className="text-muted-foreground font-['outfit']">
												Applied {formatDate(application.appliedAt)}
											</p>
										</div>
									</div>

									{/* Status & Arrow */}
									<div className='flex flex-col items-end gap-3 shrink-0'>
										<Badge
											variant='outline'
											className={cn(
												getStatusColor(application.status),
												"font-['outfit'] text-xs border"
											)}
										>
											{formatStatus(application.status)}
										</Badge>
										<HugeiconsIcon
											icon={ArrowRight01Icon}
											className='size-5 text-muted-foreground group-hover:text-ocean-wave group-hover:translate-x-1 transition-all'
										/>
									</div>
								</div>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
