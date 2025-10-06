'use server';

import { and, desc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { applications, type Application } from '@/db/schema';
import { getCurrentUserFromToken } from '@/lib/auth/jwt';

interface ApplicationResponse {
	success: boolean;
	message?: string;
	application?: any;
	applications?: any[];
}

/**
 * Create a new application
 */
export async function createApplication(
	jobId: string,
	resumeId: string
): Promise<ApplicationResponse> {
	try {
		const user = await getCurrentUserFromToken();
		if (!user || user.role !== 'user') {
			return {
				success: false,
				message: 'Unauthorized. Only candidates can apply to jobs.',
			};
		}

		// Check if user already applied to this job
		const existingApplication = await db.query.applications.findFirst({
			where: and(eq(applications.jobId, jobId), eq(applications.userId, user.userId)),
		});

		if (existingApplication) {
			return {
				success: false,
				message: 'You have already applied to this job.',
			};
		}

		// Create application
		const [newApplication] = await db
			.insert(applications)
			.values({
				jobId,
				userId: user.userId,
				resumeId,
				status: 'pending',
			})
			.returning();

		revalidatePath('/dashboard/applications');
		revalidatePath(`/dashboard/jobs/${jobId}`);

		return {
			success: true,
			message: 'Application submitted successfully!',
			application: newApplication,
		};
	} catch (error) {
		console.error('Error creating application:', error);
		return {
			success: false,
			message: 'Failed to submit application. Please try again.',
		};
	}
}

/**
 * Get all applications for the current user
 */
export async function getUserApplications(): Promise<ApplicationResponse> {
	try {
		const user = await getCurrentUserFromToken();
		if (!user || user.role !== 'user') {
			return {
				success: false,
				message: 'Unauthorized',
			};
		}

		const userApplications = await db.query.applications.findMany({
			where: eq(applications.userId, user.userId),
			orderBy: [desc(applications.appliedAt)],
			with: {
				job: {
					with: {
						recruiter: {
							with: {
								recruiterProfile: true,
							},
						},
					},
				},
				resume: true,
			},
		});

		return {
			success: true,
			applications: userApplications,
		};
	} catch (error) {
		console.error('Error fetching user applications:', error);
		return {
			success: false,
			message: 'Failed to fetch applications',
		};
	}
}

/**
 * Get a single application by ID
 */
export async function getApplicationById(applicationId: string): Promise<ApplicationResponse> {
	try {
		const user = await getCurrentUserFromToken();
		if (!user) {
			return {
				success: false,
				message: 'Unauthorized',
			};
		}

		const application = await db.query.applications.findFirst({
			where: eq(applications.id, applicationId),
			with: {
				job: {
					with: {
						recruiter: {
							with: {
								recruiterProfile: true,
							},
						},
					},
				},
				resume: true,
				user: true,
			},
		});

		if (!application) {
			return {
				success: false,
				message: 'Application not found',
			};
		}

		// Check authorization: user owns the application OR user is the recruiter who owns the job
		const isOwner = application.userId === user.userId;
		const isRecruiter = user.role === 'recruiter' && application.job.recruiterId === user.userId;

		if (!isOwner && !isRecruiter) {
			return {
				success: false,
				message: 'Unauthorized to view this application',
			};
		}

		return {
			success: true,
			application,
		};
	} catch (error) {
		console.error('Error fetching application:', error);
		return {
			success: false,
			message: 'Failed to fetch application',
		};
	}
}

/**
 * Get all applications for a specific job (recruiter only)
 */
export async function getJobApplications(jobId: string): Promise<ApplicationResponse> {
	try {
		const user = await getCurrentUserFromToken();
		if (!user || user.role !== 'recruiter') {
			return {
				success: false,
				message: 'Unauthorized. Only recruiters can view applications.',
			};
		}

		// Verify the job belongs to this recruiter
		const job = await db.query.jobs.findFirst({
			where: (jobs, { eq }) => eq(jobs.id, jobId),
		});

		if (!job || job.recruiterId !== user.userId) {
			return {
				success: false,
				message: 'Job not found or unauthorized',
			};
		}

		const jobApplications = await db.query.applications.findMany({
			where: eq(applications.jobId, jobId),
			orderBy: [desc(applications.appliedAt)],
			with: {
				user: true,
				resume: true,
			},
		});

		return {
			success: true,
			applications: jobApplications,
		};
	} catch (error) {
		console.error('Error fetching job applications:', error);
		return {
			success: false,
			message: 'Failed to fetch applications',
		};
	}
}

/**
 * Update application status (recruiter only)
 */
export async function updateApplicationStatus(
	applicationId: string,
	status: 'pending' | 'reviewed' | 'in_progress' | 'accepted' | 'rejected',
	notes?: string
): Promise<ApplicationResponse> {
	try {
		const user = await getCurrentUserFromToken();
		if (!user || user.role !== 'recruiter') {
			return {
				success: false,
				message: 'Unauthorized. Only recruiters can update application status.',
			};
		}

		// Get the application with job info
		const application = await db.query.applications.findFirst({
			where: eq(applications.id, applicationId),
			with: {
				job: true,
			},
		});

		if (!application) {
			return {
				success: false,
				message: 'Application not found',
			};
		}

		// Verify the job belongs to this recruiter
		if (application.job.recruiterId !== user.userId) {
			return {
				success: false,
				message: 'Unauthorized to update this application',
			};
		}

		// Update application
		const updateData: any = {
			status,
		};

		if (notes !== undefined) {
			updateData.notes = notes;
		}

		if (status !== 'pending') {
			updateData.reviewedAt = new Date();
		}

		const [updatedApplication] = await db
			.update(applications)
			.set(updateData)
			.where(eq(applications.id, applicationId))
			.returning();

		revalidatePath(`/dashboard/jobs/${application.jobId}/applications`);
		revalidatePath(`/dashboard/applications/${applicationId}`);

		return {
			success: true,
			message: 'Application status updated successfully',
			application: updatedApplication,
		};
	} catch (error) {
		console.error('Error updating application status:', error);
		return {
			success: false,
			message: 'Failed to update application status',
		};
	}
}

/**
 * Get application count for a job
 */
export async function getJobApplicationCount(jobId: string): Promise<number> {
	try {
		const result = await db.query.applications.findMany({
			where: eq(applications.jobId, jobId),
		});
		return result.length;
	} catch (error) {
		console.error('Error getting application count:', error);
		return 0;
	}
}
