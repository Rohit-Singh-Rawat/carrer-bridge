'use client';

import {
	Building01Icon,
	Clock01Icon,
	LocationIcon,
	Money01Icon,
	TimeSettingIcon,
	ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { updateJobStatus } from '@/actions/jobs';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { Job } from '@/db/schema';

interface JobCardProps {
	job: Job & {
		recruiter?: {
			recruiterProfile?: {
				companyName?: string | null;
			} | null;
		} | null;
	};
	isRecruiter?: boolean;
}

export function JobCard({ job, isRecruiter = false }: JobCardProps) {
	const [isActive, setIsActive] = useState(job.status === 'active');
	const [isUpdating, setIsUpdating] = useState(false);

	const handleStatusToggle = async (checked: boolean) => {
		setIsUpdating(true);
		const newStatus = checked ? 'active' : 'draft';

		try {
			const result = await updateJobStatus(job.id, newStatus);

			if (result.success) {
				setIsActive(checked);
				toast.success(checked ? 'Job is now active!' : 'Job set to draft', {
					description: checked
						? 'Candidates can now see and apply to this job.'
						: 'This job is now hidden from candidates.',
				});
			} else {
				toast.error('Failed to update job status', {
					description: result.error || 'Please try again.',
				});
			}
		} catch (_error) {
			toast.error('An error occurred', {
				description: 'Please try again later.',
			});
		} finally {
			setIsUpdating(false);
		}
	};

	const formatSalary = (min?: number | null, max?: number | null) => {
		if (!min && !max) return 'Competitive';
		if (min && max) return `$${(min / 1000).toFixed(0)}K - $${(max / 1000).toFixed(0)}K`;
		if (min) return `From $${(min / 1000).toFixed(0)}K`;
		if (max) return `Up to $${(max / 1000).toFixed(0)}K`;
		return 'Competitive';
	};

	const getJobTypeBadgeColor = (type: string) => {
		switch (type) {
			case 'full-time':
				return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800';
			case 'part-time':
				return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800';
			case 'contract':
				return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-800';
			case 'internship':
				return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800';
			default:
				return '';
		}
	};

	const getExperienceBadgeColor = (level: string) => {
		switch (level) {
			case 'entry':
				return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800';
			case 'mid':
				return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-400 dark:border-cyan-800';
			case 'senior':
				return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-400 dark:border-indigo-800';
			case 'lead':
				return 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950/50 dark:text-pink-400 dark:border-pink-800';
			default:
				return '';
		}
	};

	const formatJobType = (type: string) => {
		return type
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	const formatExperienceLevel = (level: string) => {
		return level.charAt(0).toUpperCase() + level.slice(1);
	};

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
	};

	return (
		<div
			className={cn(
				'group relative rounded-xl border border-border/60 bg-background p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-md hover:shadow-primary/5',
				isRecruiter && !isActive && 'opacity-60'
			)}
		>
			<Link
				href={`/dashboard/jobs/${job.id}`}
				className='block space-y-5'
			>
				<div className='flex items-start justify-between gap-4'>
					<div className='flex-1 min-w-0 space-y-2'>
						<div className='flex items-start gap-3'>
							<div className='rounded-lg bg-primary/10 p-2.5 shrink-0 group-hover:bg-primary/20 transition-colors'>
								<HugeiconsIcon
									icon={Building01Icon}
									className='size-5 text-primary'
								/>
							</div>
							<div className='flex-1 min-w-0'>
								<h3 className="text-lg font-['outfit'] font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
									{job.title}
								</h3>
								<p className="text-sm text-muted-foreground font-['outfit'] mt-1">
									{job.recruiter?.recruiterProfile?.companyName || 'Company'}
								</p>
							</div>
						</div>
					</div>
					<div className='flex flex-col items-end gap-2 shrink-0'>
						{isRecruiter && (
							<Badge
								variant={isActive ? 'default' : 'secondary'}
								className="font-['outfit'] text-xs"
							>
								{isActive ? 'Active' : 'Draft'}
							</Badge>
						)}
						<HugeiconsIcon
							icon={ArrowRight01Icon}
							className='size-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all'
						/>
					</div>
				</div>

				{/* Badges Section */}
				<div className='flex flex-wrap gap-2'>
					<Badge
						variant='outline'
						className={cn(
							getJobTypeBadgeColor(job.jobType),
							'font-["outfit"] text-xs font-medium border'
						)}
					>
						{formatJobType(job.jobType)}
					</Badge>
					<Badge
						variant='outline'
						className={cn(
							getExperienceBadgeColor(job.experienceLevel),
							'font-["outfit"] text-xs font-medium border'
						)}
					>
						{formatExperienceLevel(job.experienceLevel)}
					</Badge>
				</div>

				{/* Details Grid */}
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm font-['outfit']">
					<div className='flex items-center gap-2.5 text-muted-foreground'>
						<HugeiconsIcon
							icon={LocationIcon}
							className='size-4 shrink-0'
						/>
						<span className='truncate'>{job.location}</span>
					</div>
					<div className='flex items-center gap-2.5 text-muted-foreground'>
						<HugeiconsIcon
							icon={Money01Icon}
							className='size-4 shrink-0'
						/>
						<span className='font-medium text-foreground'>
							{formatSalary(job.salaryMin, job.salaryMax)}
						</span>
					</div>
					<div className='flex items-center gap-2.5 text-muted-foreground'>
						<HugeiconsIcon
							icon={Clock01Icon}
							className='size-4 shrink-0'
						/>
						<span>Posted {formatDate(job.createdAt)}</span>
					</div>
					{job.deadline && (
						<div className='flex items-center gap-2.5 text-muted-foreground'>
							<HugeiconsIcon
								icon={TimeSettingIcon}
								className='size-4 shrink-0'
							/>
							<span>Apply by {formatDate(job.deadline)}</span>
						</div>
					)}
				</div>

				{/* Skills Section */}
				{job.skills && (
					<div className='flex flex-wrap gap-2 pt-2 border-t border-border/50'>
						{job.skills
							.split(',')
							.slice(0, 6)
							.map((skill: string) => (
								<Badge
									key={skill.trim()}
									variant='secondary'
									className="text-xs font-['outfit'] font-normal bg-muted/50 hover:bg-muted transition-colors"
								>
									{skill.trim()}
								</Badge>
							))}
						{job.skills.split(',').length > 6 && (
							<Badge
								variant='secondary'
								className="text-xs font-['outfit'] font-medium bg-muted/50"
							>
								+{job.skills.split(',').length - 6} more
							</Badge>
						)}
					</div>
				)}
			</Link>

			{/* Recruiter Controls */}
			{isRecruiter && (
				<div className='mt-5 pt-5 border-t border-border/50 flex items-center justify-between'>
					<Label
						htmlFor={`status-${job.id}`}
						className="text-sm font-medium cursor-pointer font-['outfit'] text-muted-foreground"
					>
						{isActive ? 'Job is Live' : 'Activate Job'}
					</Label>
					<Switch
						id={`status-${job.id}`}
						checked={isActive}
						onCheckedChange={handleStatusToggle}
						disabled={isUpdating}
						onClick={(e) => e.stopPropagation()}
					/>
				</div>
			)}
		</div>
	);
}
