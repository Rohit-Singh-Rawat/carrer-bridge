'use server';

import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { jobs } from '@/db/schema';
import { requireAuth } from './auth';

export async function createJob(data: {
	title: string;
	description: string;
	location: string;
	jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
	experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
	salaryMin?: number;
	salaryMax?: number;
	skills?: string;
	requirements?: string;
	benefits?: string;
	deadline?: Date;
}) {
	try {
		const user = await requireAuth();

		if (user.role !== 'recruiter') {
			return { success: false, error: 'Only recruiters can create jobs' };
		}

		const newJob = await db
			.insert(jobs)
			.values({
				recruiterId: user.id,
				title: data.title,
				description: data.description,
				location: data.location,
				jobType: data.jobType,
				experienceLevel: data.experienceLevel,
				salaryMin: data.salaryMin,
				salaryMax: data.salaryMax,
				skills: data.skills,
				requirements: data.requirements,
				benefits: data.benefits,
				deadline: data.deadline,
				status: 'draft',
			})
			.returning();

		revalidatePath('/dashboard/jobs');
		return { success: true, job: newJob[0] };
	} catch (error) {
		console.error('Error creating job:', error);
		return { success: false, error: 'Failed to create job' };
	}
}

export async function updateJobStatus(jobId: string, status: 'active' | 'closed' | 'draft') {
	try {
		const user = await requireAuth();

		if (user.role !== 'recruiter') {
			return { success: false, error: 'Only recruiters can update jobs' };
		}

		// Verify the job belongs to this recruiter
		const job = await db.query.jobs.findFirst({
			where: and(eq(jobs.id, jobId), eq(jobs.recruiterId, user.id)),
		});

		if (!job) {
			return { success: false, error: 'Job not found or unauthorized' };
		}

		await db.update(jobs).set({ status, updatedAt: new Date() }).where(eq(jobs.id, jobId));

		revalidatePath('/dashboard/jobs');
		revalidatePath(`/dashboard/jobs/${jobId}`);
		return { success: true };
	} catch (error) {
		console.error('Error updating job status:', error);
		return { success: false, error: 'Failed to update job status' };
	}
}

export async function getJobs() {
	try {
		const user = await requireAuth();

		if (user.role === 'recruiter') {
			// Get jobs created by this recruiter
			const recruiterJobs = await db.query.jobs.findMany({
				where: eq(jobs.recruiterId, user.id),
				orderBy: [desc(jobs.createdAt)],
				with: {
					recruiter: {
						with: {
							recruiterProfile: true,
						},
					},
				},
			});
			return { success: true, jobs: recruiterJobs };
		} else {
			// Get all active jobs for regular users
			const allJobs = await db.query.jobs.findMany({
				where: eq(jobs.status, 'active'),
				orderBy: [desc(jobs.createdAt)],
				with: {
					recruiter: {
						with: {
							recruiterProfile: true,
						},
					},
				},
			});
			return { success: true, jobs: allJobs };
		}
	} catch (error) {
		console.error('Error fetching jobs:', error);
		return { success: false, error: 'Failed to fetch jobs', jobs: [] };
	}
}

export async function getJobById(jobId: string) {
	try {
		const user = await requireAuth();

		const job = await db.query.jobs.findFirst({
			where: eq(jobs.id, jobId),
			with: {
				recruiter: {
					with: {
						recruiterProfile: true,
					},
				},
			},
		});

		if (!job) {
			return { success: false, error: 'Job not found' };
		}

		// If job is not active and user is not the recruiter who posted it, don't show it
		if (job.status !== 'active' && job.recruiterId !== user.id) {
			return { success: false, error: 'Job not available' };
		}

		return { success: true, job };
	} catch (error) {
		console.error('Error fetching job:', error);
		return { success: false, error: 'Failed to fetch job' };
	}
}

export async function updateJob(
	jobId: string,
	data: {
		title?: string;
		description?: string;
		location?: string;
		jobType?: 'full-time' | 'part-time' | 'contract' | 'internship';
		experienceLevel?: 'entry' | 'mid' | 'senior' | 'lead';
		salaryMin?: number;
		salaryMax?: number;
		skills?: string;
		requirements?: string;
		benefits?: string;
		deadline?: Date;
	}
) {
	try {
		const user = await requireAuth();

		if (user.role !== 'recruiter') {
			return { success: false, error: 'Only recruiters can update jobs' };
		}

		// Verify the job belongs to this recruiter
		const job = await db.query.jobs.findFirst({
			where: and(eq(jobs.id, jobId), eq(jobs.recruiterId, user.id)),
		});

		if (!job) {
			return { success: false, error: 'Job not found or unauthorized' };
		}

		await db
			.update(jobs)
			.set({ ...data, updatedAt: new Date() })
			.where(eq(jobs.id, jobId));

		revalidatePath('/dashboard/jobs');
		revalidatePath(`/dashboard/jobs/${jobId}`);
		return { success: true };
	} catch (error) {
		console.error('Error updating job:', error);
		return { success: false, error: 'Failed to update job' };
	}
}
