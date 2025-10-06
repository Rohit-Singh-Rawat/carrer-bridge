'use client';

import {
	File01Icon,
	LocationIcon,
	Building01Icon,
	ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Application {
	id: string;
	status: string;
	appliedAt: Date;
	job: {
		id: string;
		title: string;
		location: string;
		jobType: string;
		recruiter: {
			recruiterProfile: {
				companyName: string;
			} | null;
		} | null;
	};
	resume: {
		id: string;
		title: string;
	};
}

interface ApplicationsPageClientProps {
	applications: Application[];
}

export function ApplicationsPageClient({ applications }: ApplicationsPageClientProps) {
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

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className="text-3xl font-['outfit'] tracking-tight">My Applications</h1>
					<p className="text-muted-foreground mt-2 font-['outfit']">
						Track your job applications and their status
					</p>
				</div>
			</div>

			{applications.length === 0 ? (
				<div className='flex flex-col items-center justify-center py-16 px-4 text-center'>
					<div className='rounded-full bg-muted p-6 mb-6'>
						<HugeiconsIcon
							icon={File01Icon}
							className='size-12 text-muted-foreground'
						/>
					</div>
					<h3 className="text-xl font-['outfit'] font-medium mb-2">No applications yet</h3>
					<p className="text-muted-foreground font-['outfit'] mb-6 max-w-md">
						Start applying to jobs to see your applications here
					</p>
					<Link
						href='/dashboard/jobs'
						className="inline-flex items-center gap-2 rounded-lg bg-ocean-wave hover:bg-deep-sea text-white px-4 py-2 font-['outfit'] transition-colors"
					>
						Browse Jobs
						<HugeiconsIcon
							icon={ArrowRight01Icon}
							className='size-4'
						/>
					</Link>
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
										{/* Job Info */}
										<div className='flex items-start gap-3'>
											<div className='rounded-lg bg-ocean-mist/30 p-2.5 shrink-0 group-hover:bg-ocean-breeze/30 transition-colors'>
												<HugeiconsIcon
													icon={Building01Icon}
													className='size-5 text-ocean-wave'
												/>
											</div>
											<div className='flex-1 min-w-0'>
												<h3 className="text-lg font-['outfit'] font-medium text-foreground group-hover:text-ocean-wave transition-colors line-clamp-1">
													{application.job.title}
												</h3>
												<p className="text-sm text-muted-foreground font-['outfit'] mt-1">
													{application.job.recruiter?.recruiterProfile?.companyName || 'Company'}
												</p>
											</div>
										</div>

										{/* Details */}
										<div className='flex flex-wrap gap-x-6 gap-y-2 text-sm'>
											<div className='flex items-center gap-2 text-muted-foreground'>
												<HugeiconsIcon
													icon={LocationIcon}
													className='size-4 shrink-0'
												/>
												<span className="font-['outfit']">{application.job.location}</span>
											</div>
											<div className='flex items-center gap-2 text-muted-foreground'>
												<HugeiconsIcon
													icon={File01Icon}
													className='size-4 shrink-0'
												/>
												<span className="font-['outfit']">{application.resume.title}</span>
											</div>
										</div>

										{/* Applied Date */}
										<p className="text-xs text-muted-foreground font-['outfit']">
											Applied {formatDate(application.appliedAt)}
										</p>
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
