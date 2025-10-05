import {
	ArrowLeft01Icon,
	Building01Icon,
	Clock01Icon,
	LocationIcon,
	Money01Icon,
	TimeSettingIcon,
	UserIcon,
	ArrowRight01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/actions/auth';
import { getJobById } from '@/actions/jobs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { JobActions } from '@/components/jobs/job-actions';

interface JobDetailPageProps {
	params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
	const user = await getCurrentUser();
	if (!user) {
		redirect('/login');
	}

	const { id } = await params;
	const jobResult = await getJobById(id);

	if (!jobResult.success || !jobResult.job) {
		notFound();
	}

	const job = jobResult.job;
	const _isRecruiter = user.role === 'recruiter';
	const isOwner = job.recruiterId === user.id;

	const formatSalary = (min?: number | null, max?: number | null) => {
		if (!min && !max) return 'Competitive Salary';
		if (min && max) return `$${(min / 1000).toFixed(0)}K - $${(max / 1000).toFixed(0)}K per year`;
		if (min) return `From $${(min / 1000).toFixed(0)}K per year`;
		if (max) return `Up to $${(max / 1000).toFixed(0)}K per year`;
		return 'Competitive Salary';
	};

	const formatJobType = (type: string) => {
		return type
			.split('-')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};

	const formatExperienceLevel = (level: string) => {
		const levels: Record<string, string> = {
			entry: 'Entry Level',
			mid: 'Mid Level',
			senior: 'Senior Level',
			lead: 'Lead/Principal',
		};
		return levels[level] || level;
	};

	const formatDate = (date: Date) => {
		return new Date(date).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'active':
				return <Badge className='bg-primary text-primary-foreground'>Active</Badge>;
			case 'draft':
				return <Badge variant='secondary'>Draft</Badge>;
			case 'closed':
				return <Badge variant='destructive'>Closed</Badge>;
			default:
				return null;
		}
	};

	return (
		<div className='space-y-8 max-w-4xl mx-auto pb-12'>
			{/* Back Button */}
			<Link href='/dashboard/jobs'>
				<Button
					variant='ghost'
					className="gap-2 font-['outfit'] -ml-2 hover:bg-transparent mb-2"
				>
					<HugeiconsIcon
						icon={ArrowLeft01Icon}
						className='size-4'
					/>
					Back to Jobs
				</Button>
			</Link>

			{/* Header Section */}
			<div className='space-y-6'>
				{/* Company Logo & Title */}
				<div className='flex items-start gap-4'>
					<div className='rounded-lg bg-muted p-3 shrink-0'>
						<HugeiconsIcon
							icon={Building01Icon}
							className='size-8 text-foreground'
						/>
					</div>
					<div className='flex-1 space-y-3'>
						<h1 className="text-3xl font-['outfit'] font-medium tracking-tight">{job.title}</h1>
						<div className='space-y-2'>
							<p className="text-base font-['outfit'] font-normal">
								{job.recruiter?.recruiterProfile?.companyName || 'Company'}
							</p>
							<p className="text-sm text-muted-foreground font-['outfit']">
								{job.recruiter?.recruiterProfile?.location || job.location}
							</p>
						</div>
					</div>
				</div>

				{/* Badges */}
				<div className='flex flex-wrap gap-2 items-center'>
					<Badge
						variant='secondary'
						className="font-['outfit'] font-light bg-muted/50 text-foreground hover:bg-muted/50"
					>
						{formatJobType(job.jobType)}
					</Badge>
					<Badge
						variant='secondary'
						className="font-['outfit'] font-light bg-muted/50 text-foreground hover:bg-muted/50"
					>
						{formatExperienceLevel(job.experienceLevel)}
					</Badge>
					<Badge
						variant='secondary'
						className="font-['outfit'] font-light bg-muted/50 text-foreground hover:bg-muted/50"
					>
						{job.recruiter?.recruiterProfile?.industry || 'Finance'}
					</Badge>
					{isOwner && <span className='ml-2'>{getStatusBadge(job.status)}</span>}
				</div>

				{/* Action Buttons */}
				{!isOwner && job.status === 'active' && <JobActions />}
			</div>

			<Separator />

			{/* Main Content */}
			<div className='space-y-8'>
				{/* Job Description */}
				<section className='space-y-4'>
					<h2 className="text-xl font-['outfit'] font-medium">About this role</h2>
					<div
						className="prose prose-sm max-w-none dark:prose-invert font-['outfit'] prose-p:text-muted-foreground prose-p:leading-relaxed"
						dangerouslySetInnerHTML={{ __html: job.description }}
					/>
				</section>

				{/* Requirements */}
				{job.requirements && (
					<section className='space-y-4'>
						<h2 className="text-xl font-['outfit'] font-medium">Qualifications</h2>
						<div
							className="prose prose-sm max-w-none dark:prose-invert font-['outfit'] prose-p:text-muted-foreground prose-p:leading-relaxed prose-ul:text-muted-foreground"
							dangerouslySetInnerHTML={{ __html: job.requirements }}
						/>
					</section>
				)}

				{/* Skills */}
				{job.skills && (
					<section className='space-y-4'>
						<h2 className="text-xl font-['outfit'] font-medium">Required Skills</h2>
						<div className='flex flex-wrap gap-2'>
							{job.skills.split(',').map((skill: string) => (
								<Badge
									key={skill.trim()}
									variant='secondary'
									className="text-sm font-['outfit'] py-1.5 px-3 font-light bg-muted/50 text-foreground hover:bg-muted/50"
								>
									{skill.trim()}
								</Badge>
							))}
						</div>
					</section>
				)}

				{/* Benefits */}
				{job.benefits && (
					<section className='space-y-4'>
						<h2 className="text-xl font-['outfit'] font-medium">Benefits & Perks</h2>
						<div
							className="prose prose-sm max-w-none dark:prose-invert font-['outfit'] prose-p:text-muted-foreground prose-p:leading-relaxed prose-ul:text-muted-foreground"
							dangerouslySetInnerHTML={{ __html: job.benefits }}
						/>
					</section>
				)}

				{/* Job Details */}
				<section className='space-y-4'>
					<h2 className="text-xl font-['outfit'] font-medium">Job Details</h2>
					<div className='space-y-3 text-sm'>
						<div className='flex items-start gap-3'>
							<HugeiconsIcon
								icon={LocationIcon}
								className='size-5 text-muted-foreground shrink-0 mt-0.5'
							/>
							<div>
								<p className="font-['outfit'] font-normal text-foreground">Location</p>
								<p className="text-muted-foreground font-['outfit']">{job.location}</p>
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
									{formatSalary(job.salaryMin, job.salaryMax)}
								</p>
							</div>
						</div>
						<div className='flex items-start gap-3'>
							<HugeiconsIcon
								icon={Clock01Icon}
								className='size-5 text-muted-foreground shrink-0 mt-0.5'
							/>
							<div>
								<p className="font-['outfit'] font-normal text-foreground">Posted</p>
								<p className="text-muted-foreground font-['outfit']">{formatDate(job.createdAt)}</p>
							</div>
						</div>
						{job.deadline && (
							<div className='flex items-start gap-3'>
								<HugeiconsIcon
									icon={TimeSettingIcon}
									className='size-5 text-muted-foreground shrink-0 mt-0.5'
								/>
								<div>
									<p className="font-['outfit'] font-normal text-foreground">
										Application Deadline
									</p>
									<p className="text-muted-foreground font-['outfit']">
										{formatDate(job.deadline)}
									</p>
								</div>
							</div>
						)}
					</div>
				</section>

				{/* Company Info */}
				{job.recruiter?.recruiterProfile && (
					<section className='space-y-4'>
						<h2 className="text-xl font-['outfit'] font-medium">About the Company</h2>
						<div className='space-y-4'>
							<div>
								<p className="font-['outfit'] font-normal text-base">
									{job.recruiter.recruiterProfile.companyName}
								</p>
								{job.recruiter.recruiterProfile.industry && (
									<p className="text-sm text-muted-foreground font-['outfit'] mt-1">
										{job.recruiter.recruiterProfile.industry}
									</p>
								)}
							</div>

							{job.recruiter.recruiterProfile.bio && (
								<p className="text-sm text-muted-foreground font-['outfit'] leading-relaxed">
									{job.recruiter.recruiterProfile.bio}
								</p>
							)}

							<div className='flex flex-wrap gap-4 text-sm'>
								{job.recruiter.recruiterProfile.companySize && (
									<div className='flex items-center gap-2'>
										<HugeiconsIcon
											icon={UserIcon}
											className='size-4 text-muted-foreground'
										/>
										<span className="font-['outfit'] text-muted-foreground">
											{job.recruiter.recruiterProfile.companySize} employees
										</span>
									</div>
								)}
								{job.recruiter.recruiterProfile.location && (
									<div className='flex items-center gap-2'>
										<HugeiconsIcon
											icon={LocationIcon}
											className='size-4 text-muted-foreground'
										/>
										<span className="font-['outfit'] text-muted-foreground">
											{job.recruiter.recruiterProfile.location}
										</span>
									</div>
								)}
							</div>

							{job.recruiter.recruiterProfile.companyWebsite && (
								<div className='pt-2'>
									<Link
										href={job.recruiter.recruiterProfile.companyWebsite}
										target='_blank'
										rel='noopener noreferrer'
									>
										<Button
											variant='outline'
											className="gap-2 font-['outfit']"
										>
											Visit Company Website
											<HugeiconsIcon
												icon={ArrowRight01Icon}
												className='size-4'
											/>
										</Button>
									</Link>
								</div>
							)}
						</div>
					</section>
				)}
			</div>
		</div>
	);
}
