'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { PlusSignIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { createJob } from '@/actions/jobs';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader } from '@/components/ui/loader';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';

const jobSchema = z.object({
	title: z.string().min(3, 'Title must be at least 3 characters').max(255),
	description: z.string().min(50, 'Description must be at least 50 characters'),
	location: z.string().min(2, 'Location is required').max(255),
	jobType: z.enum(['full-time', 'part-time', 'contract', 'internship']),
	experienceLevel: z.enum(['entry', 'mid', 'senior', 'lead']),
	salaryMin: z.string().optional(),
	salaryMax: z.string().optional(),
	skills: z.string().optional(),
	requirements: z.string().optional(),
	benefits: z.string().optional(),
	deadline: z.string().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

export function CreateJobDialog() {
	const [open, setOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors },
	} = useForm<JobFormData>({
		resolver: zodResolver(jobSchema),
		defaultValues: {
			jobType: 'full-time',
			experienceLevel: 'mid',
			description: '',
			requirements: '',
			benefits: '',
		},
	});

	const jobType = watch('jobType');
	const experienceLevel = watch('experienceLevel');
	const description = watch('description');
	const requirements = watch('requirements');
	const benefits = watch('benefits');

	// Update form values when textareas change
	const handleDescriptionChange = (value: string) => {
		setValue('description', value, { shouldValidate: true });
	};

	const handleRequirementsChange = (value: string) => {
		setValue('requirements', value, { shouldValidate: true });
	};

	const handleBenefitsChange = (value: string) => {
		setValue('benefits', value, { shouldValidate: true });
	};

	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			// Reset form when dialog closes
			reset();
		}
	};

	const onSubmit = async (data: JobFormData) => {
		setIsLoading(true);

		try {
			const result = await createJob({
				title: data.title,
				description: data.description,
				location: data.location,
				jobType: data.jobType,
				experienceLevel: data.experienceLevel,
				salaryMin: data.salaryMin ? Number.parseInt(data.salaryMin, 10) : undefined,
				salaryMax: data.salaryMax ? Number.parseInt(data.salaryMax, 10) : undefined,
				skills: data.skills,
				requirements: data.requirements,
				benefits: data.benefits,
				deadline: data.deadline ? new Date(data.deadline) : undefined,
			});

			if (result.success) {
				toast.success('Job created successfully!', {
					description: 'Your job has been saved as a draft.',
				});
				reset();
				setOpen(false);
			} else {
				toast.error('Failed to create job', {
					description: result.error || 'Please try again.',
				});
			}
		} catch (_error) {
			toast.error('An error occurred', {
				description: 'Please try again later.',
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={handleOpenChange}
		>
			<DialogTrigger asChild>
				<Button className='gap-2'>
					<HugeiconsIcon
						icon={PlusSignIcon}
						className='size-4'
					/>
					Post New Job
				</Button>
			</DialogTrigger>
			<DialogContent className='md:max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl'>
				<DialogHeader>
					<DialogTitle className="text-2xl font-['outfit']">Create a New Job Posting</DialogTitle>
					<DialogDescription className="font-['outfit']">
						Fill in the details below to create a new job posting. It will be saved as a draft.
					</DialogDescription>
				</DialogHeader>

				<form
					onSubmit={handleSubmit(onSubmit)}
					className='space-y-6'
				>
					{/* Job Title */}
					<div className='space-y-2'>
						<Label
							htmlFor='title'
							className='text-base'
						>
							Job Title *
						</Label>
						<Input
							id='title'
							placeholder='e.g. Senior Frontend Developer'
							{...register('title')}
							className="font-['outfit']"
						/>
						{errors.title && <p className='text-sm text-destructive'>{errors.title.message}</p>}
					</div>

					{/* Location */}
					<div className='space-y-2'>
						<Label
							htmlFor='location'
							className='text-base'
						>
							Location *
						</Label>
						<Input
							id='location'
							placeholder='e.g. San Francisco, CA (Remote)'
							{...register('location')}
							className="font-['outfit']"
						/>
						{errors.location && (
							<p className='text-sm text-destructive'>{errors.location.message}</p>
						)}
					</div>

					{/* Job Type & Experience Level */}
					<div className='grid grid-cols-2 gap-4'>
						<div className='space-y-2'>
							<Label
								htmlFor='jobType'
								className='text-base'
							>
								Job Type *
							</Label>
							<Select
								value={jobType}
								onValueChange={(value) =>
									setValue(
										'jobType',
										value as 'full-time' | 'part-time' | 'contract' | 'internship'
									)
								}
							>
								<SelectTrigger className="font-['outfit']">
									<SelectValue placeholder='Select job type' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='full-time'>Full-time</SelectItem>
									<SelectItem value='part-time'>Part-time</SelectItem>
									<SelectItem value='contract'>Contract</SelectItem>
									<SelectItem value='internship'>Internship</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className='space-y-2'>
							<Label
								htmlFor='experienceLevel'
								className='text-base'
							>
								Experience Level *
							</Label>
							<Select
								value={experienceLevel}
								onValueChange={(value) =>
									setValue('experienceLevel', value as 'entry' | 'mid' | 'senior' | 'lead')
								}
							>
								<SelectTrigger className="font-['outfit']">
									<SelectValue placeholder='Select level' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='entry'>Entry Level</SelectItem>
									<SelectItem value='mid'>Mid Level</SelectItem>
									<SelectItem value='senior'>Senior Level</SelectItem>
									<SelectItem value='lead'>Lead/Principal</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{/* Salary Range */}
					<div className='space-y-2'>
						<Label className='text-base'>Salary Range (USD/year)</Label>
						<div className='grid grid-cols-2 gap-4'>
							<div className='space-y-2'>
								<Input
									type='number'
									placeholder='Minimum'
									{...register('salaryMin')}
									className="font-['outfit']"
								/>
							</div>
							<div className='space-y-2'>
								<Input
									type='number'
									placeholder='Maximum'
									{...register('salaryMax')}
									className="font-['outfit']"
								/>
							</div>
						</div>
					</div>

					{/* Job Description */}
					<div className='space-y-2'>
						<Label className='text-base'>Job Description *</Label>
						<RichTextEditor
							value={description || ''}
							onChange={handleDescriptionChange}
							placeholder='Describe the role, responsibilities, and what makes this opportunity exciting...'
						/>
						{errors.description && (
							<p className='text-sm text-destructive'>{errors.description.message}</p>
						)}
						{description &&
							description.length > 0 &&
							description.length < 50 &&
							!errors.description && (
								<p className='text-sm text-muted-foreground'>
									{50 - description.length} more characters needed
								</p>
							)}
					</div>

					{/* Skills */}
					<div className='space-y-2'>
						<Label
							htmlFor='skills'
							className='text-base'
						>
							Required Skills
						</Label>
						<Input
							id='skills'
							placeholder='e.g. React, TypeScript, Node.js, AWS (comma-separated)'
							{...register('skills')}
							className="font-['outfit']"
						/>
						<p className='text-sm text-muted-foreground'>Separate skills with commas</p>
					</div>

					{/* Requirements */}
					<div className='space-y-2'>
						<Label className='text-base'>Requirements & Qualifications</Label>
						<RichTextEditor
							value={requirements || ''}
							onChange={handleRequirementsChange}
							placeholder='List the requirements, qualifications, and must-have skills...'
						/>
						{errors.requirements && (
							<p className='text-sm text-destructive'>{errors.requirements.message}</p>
						)}
					</div>

					{/* Benefits */}
					<div className='space-y-2'>
						<Label className='text-base'>Benefits & Perks</Label>
						<RichTextEditor
							value={benefits || ''}
							onChange={handleBenefitsChange}
							placeholder='What benefits and perks does this role offer?'
						/>
						{errors.benefits && (
							<p className='text-sm text-destructive'>{errors.benefits.message}</p>
						)}
					</div>

					{/* Application Deadline */}
					<div className='space-y-2'>
						<Label
							htmlFor='deadline'
							className='text-base'
						>
							Application Deadline
						</Label>
						<Input
							id='deadline'
							type='date'
							{...register('deadline')}
							className="font-['outfit']"
						/>
					</div>

					{/* Submit Button */}
					<div className='flex justify-end gap-3 pt-4'>
						<Button
							type='button'
							variant='outline'
							onClick={() => setOpen(false)}
							disabled={isLoading}
							className="font-['outfit']"
						>
							Cancel
						</Button>
						<Button
							type='submit'
							disabled={isLoading}
							className="gap-2 font-['outfit']"
						>
							{isLoading && <Loader />}
							Create Job
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
