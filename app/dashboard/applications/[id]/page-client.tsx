'use client';

import {
	ArrowLeft01Icon,
	Building01Icon,
	Clock01Icon,
	LocationIcon,
	Money01Icon,
	File01Icon,
	UserIcon,
	Mail01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateApplicationStatus } from '@/actions/applications';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

interface ApplicationDetailClientProps {
	application: any;
	isRecruiter: boolean;
}

export function ApplicationDetailClient({
	application,
	isRecruiter,
}: ApplicationDetailClientProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [status, setStatus] = useState(application.status);

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
			month: 'long',
			day: 'numeric',
		});
	};

	const formatSalary = (min?: number | null, max?: number | null) => {
		if (!min && !max) return 'Competitive Salary';
		if (min && max) return `$${(min / 1000).toFixed(0)}K - $${(max / 1000).toFixed(0)}K per year`;
		if (min) return `From $${(min / 1000).toFixed(0)}K per year`;
		if (max) return `Up to $${(max / 1000).toFixed(0)}K per year`;
		return 'Competitive Salary';
	};

	const handleStatusChange = (newStatus: string) => {
		startTransition(async () => {
			const result = await updateApplicationStatus(application.id, newStatus as any);
			if (result.success) {
				setStatus(newStatus);
				toast.success('Application status updated');
				router.refresh();
			} else {
				toast.error(result.message || 'Failed to update status');
			}
		});
	};

	return (
		<div className='space-y-8 max-w-4xl mx-auto pb-12'>
			{/* Back Button */}
			<Link
				href={
					isRecruiter
						? `/dashboard/jobs/${application.job.id}/applications`
						: '/dashboard/applications'
				}
			>
				<Button
					variant='ghost'
					className="gap-2 font-['outfit'] -ml-2 hover:bg-transparent mb-2"
				>
					<HugeiconsIcon
						icon={ArrowLeft01Icon}
						className='size-4'
					/>
					Back to {isRecruiter ? 'Applications' : 'My Applications'}
				</Button>
			</Link>

			{/* Header */}
			<div className='rounded-xl border bg-card p-6 space-y-6'>
				<div className='flex items-start justify-between gap-4'>
					<div className='space-y-2'>
						<h1 className="text-2xl font-['outfit'] tracking-tight">Application Details</h1>
						<p className="text-sm text-muted-foreground font-['outfit']">
							Applied on {formatDate(application.appliedAt)}
						</p>
					</div>
					<Badge
						variant='outline'
						className={cn(getStatusColor(status), "font-['outfit'] text-sm border")}
					>
						{formatStatus(status)}
					</Badge>
				</div>

				{/* Recruiter Status Update */}
				{isRecruiter && (
					<div className='pt-4 border-t space-y-3'>
						<Label
							htmlFor='status'
							className="font-['outfit']"
						>
							Update Status
						</Label>
						<div className='flex gap-2'>
							<Select
								value={status}
								onValueChange={handleStatusChange}
								disabled={isPending}
							>
								<SelectTrigger
									id='status'
									className="w-[200px] font-['outfit']"
								>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='pending'>Pending</SelectItem>
									<SelectItem value='reviewed'>Reviewed</SelectItem>
									<SelectItem value='in_progress'>In Progress</SelectItem>
									<SelectItem value='accepted'>Accepted</SelectItem>
									<SelectItem value='rejected'>Rejected</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
				)}

				{/* Interview Section (User View) - Moved to top */}
				{!isRecruiter && application.interviewEligible === 1 && (
					<>
						<Separator />
						<div className='space-y-4'>
							<div className='flex items-center gap-2'>
								<div className='h-2 w-2 rounded-full bg-emerald-500 animate-pulse' />
								<h3 className="text-lg font-['outfit'] font-medium">Interview Available</h3>
							</div>
							<p className="text-sm text-muted-foreground font-['outfit']">
								Your application has been reviewed and you're now eligible for an AI-powered interview.
							</p>
							<Button
								asChild
								size='lg'
								className="w-full font-['outfit']"
							>
								<Link href={`/interview/${application.id}`}>Start Interview</Link>
							</Button>
						</div>
					</>
				)}

				{/* Interview Section (Recruiter View) - Moved to top */}
				{isRecruiter && application.interviewEligible === 1 && (
					<>
						<Separator />
						<div className='space-y-4'>
							<h3 className="text-lg font-['outfit'] font-medium">AI Interview</h3>
							<p className="text-sm text-muted-foreground font-['outfit']">
								The candidate has been invited to complete an AI-powered interview.
							</p>
							<Button
								asChild
								className="font-['outfit']"
							>
								<Link href={`/dashboard/applications/${application.id}/interview`}>
									View Interview
								</Link>
							</Button>
						</div>
					</>
				)}
			</div>

			<Separator />

			{/* Applicant Info (Recruiter View) */}
			{isRecruiter && application.user && (
				<section className='space-y-4'>
					<h2 className="text-xl font-['outfit'] font-medium">Applicant Information</h2>
					<div className='rounded-xl border bg-card p-6 space-y-4'>
						<div className='flex items-center gap-3'>
							<div className='rounded-lg bg-muted p-3'>
								<HugeiconsIcon
									icon={UserIcon}
									className='size-6 text-foreground'
								/>
							</div>
							<div>
								<p className="font-['outfit'] font-medium text-lg">{application.user.fullName}</p>
								<div className='flex items-center gap-2 text-sm text-muted-foreground mt-1'>
									<HugeiconsIcon
										icon={Mail01Icon}
										className='size-4'
									/>
									<span className="font-['outfit']">{application.user.email}</span>
								</div>
							</div>
						</div>
					</div>
				</section>
			)}

			{/* Resume Info */}
			<section className='space-y-4'>
				<h2 className="text-xl font-['outfit'] font-medium">Submitted Resume</h2>
				<div className='rounded-xl border bg-card p-6'>
					<div className='flex items-start gap-4'>
						<div className='rounded-lg bg-muted p-3'>
							<HugeiconsIcon
								icon={File01Icon}
								className='size-6 text-foreground'
							/>
						</div>
						<div className='flex-1'>
							<h3 className="font-['outfit'] font-medium text-lg">{application.resume.title}</h3>
							{application.resume.description && (
								<p className="text-sm text-muted-foreground mt-1 font-['outfit']">
									{application.resume.description}
								</p>
							)}
							<div className='mt-4'>
								<a
									href={application.resume.fileUrl}
									target='_blank'
									rel='noopener noreferrer'
									className="inline-flex items-center gap-2 text-sm text-ocean-wave hover:text-deep-sea font-['outfit'] transition-colors"
								>
									View Resume
									<HugeiconsIcon
										icon={ArrowLeft01Icon}
										className='size-4 rotate-180'
									/>
								</a>
							</div>
						</div>
					</div>
				</div>
			</section>

			<Separator />

			{/* Job Details */}
			<section className='space-y-4'>
				<h2 className="text-xl font-['outfit'] font-medium">Job Details</h2>
				<div className='rounded-xl border bg-card p-6 space-y-6'>
					{/* Job Header */}
					<div className='flex items-start gap-4'>
						<div className='rounded-lg bg-muted p-3'>
							<HugeiconsIcon
								icon={Building01Icon}
								className='size-6 text-foreground'
							/>
						</div>
						<div className='flex-1'>
							<h3 className="text-xl font-['outfit'] font-medium">{application.job.title}</h3>
							<p className="text-sm text-muted-foreground mt-1 font-['outfit']">
								{application.job.recruiter?.recruiterProfile?.companyName || 'Company'}
							</p>
						</div>
					</div>

					{/* Job Info Grid */}
					<div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-4 border-t'>
						<div className='flex items-start gap-3'>
							<HugeiconsIcon
								icon={LocationIcon}
								className='size-5 text-muted-foreground shrink-0 mt-0.5'
							/>
							<div>
								<p className="font-['outfit'] font-normal text-foreground">Location</p>
								<p className="text-muted-foreground font-['outfit']">{application.job.location}</p>
							</div>
						</div>
						<div className='flex items-start gap-3'>
							<HugeiconsIcon
								icon={Money01Icon}
								className='size-5 text-muted-foreground shrink-0 mt-0.5'
							/>
							<div>
								<p className="font-['outfit'] font-normal text-foreground">Salary Range</p>
								<p className="text-muted-foreground font-['outfit']">
									{formatSalary(application.job.salaryMin, application.job.salaryMax)}
								</p>
							</div>
						</div>
						<div className='flex items-start gap-3'>
							<HugeiconsIcon
								icon={Clock01Icon}
								className='size-5 text-muted-foreground shrink-0 mt-0.5'
							/>
							<div>
								<p className="font-['outfit'] font-normal text-foreground">Job Type</p>
								<p className="text-muted-foreground font-['outfit'] capitalize">
									{application.job.jobType.replace('-', ' ')}
								</p>
							</div>
						</div>
					</div>

					{/* View Full Job Button */}
					<div className='pt-4 border-t'>
						<Link href={`/dashboard/jobs/${application.job.id}`}>
							<Button
								variant='outline'
								className="gap-2 font-['outfit']"
							>
								View Full Job Description
								<HugeiconsIcon
									icon={ArrowLeft01Icon}
									className='size-4 rotate-180'
								/>
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Notes (Recruiter View) */}
			{isRecruiter && application.notes && (
				<section className='space-y-4'>
					<h2 className="text-xl font-['outfit'] font-medium">Notes</h2>
					<div className='rounded-xl border bg-card p-6'>
						<p className="text-sm text-muted-foreground font-['outfit']">{application.notes}</p>
					</div>
				</section>
			)}
		</div>
	);
}
