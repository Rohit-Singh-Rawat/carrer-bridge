'use server';

import { db } from '@/db';
import { resumes, type Resume } from '@/db/schema';
import { getCurrentUserFromToken } from '@/lib/auth/jwt';
import { getKeyFromUrl, getUploadPresignedUrl, getPublicUrl } from '@/lib/r2/upload';
import { generateUniqueSlug } from '@/lib/utils/slug';
import { and, eq } from 'drizzle-orm';

interface ResumeResponse {
	success: boolean;
	message?: string;
	resume?: Resume;
	resumes?: Resume[];
}

interface PresignedUrlsResponse {
	success: boolean;
	message?: string;
	data?: {
		slug: string;
		pdfUrl: string;
		thumbnailUrl: string;
		pdfKey: string;
		thumbnailKey: string;
	};
}

/**
 * Get presigned URLs for uploading resume and thumbnail
 */
export async function getResumeUploadUrls(title: string): Promise<PresignedUrlsResponse> {
	try {
		// Verify user is authenticated and is a candidate (user role)
		const user = await getCurrentUserFromToken();
		if (!user || user.role !== 'user') {
			return {
				success: false,
				message: 'Unauthorized. Only candidates can upload resumes.',
			};
		}

		if (!title) {
			return {
				success: false,
				message: 'Title is required',
			};
		}

		// Generate unique slug
		const slug = await generateUniqueSlug(title, user.userId);

		// Generate keys for PDF and thumbnail
		const pdfKey = `resumes/${user.userId}/${slug}.pdf`;
		const thumbnailKey = `resumes/${user.userId}/${slug}-thumbnail.png`;

		// Get presigned URLs
		const pdfUrl = await getUploadPresignedUrl(pdfKey, 'application/pdf');
		const thumbnailUrl = await getUploadPresignedUrl(thumbnailKey, 'image/png');

		return {
			success: true,
			data: {
				slug,
				pdfUrl,
				thumbnailUrl,
				pdfKey,
				thumbnailKey,
			},
		};
	} catch (error) {
		console.error('Error getting presigned URLs:', error);
		return {
			success: false,
			message: 'Failed to generate upload URLs. Please try again.',
		};
	}
}

/**
 * Save resume metadata after client-side upload
 */
export async function saveResumeMetadata(data: {
	slug: string;
	title: string;
	description?: string;
	pdfKey: string;
	thumbnailKey: string;
}): Promise<ResumeResponse> {
	try {
		const user = await getCurrentUserFromToken();
		if (!user || user.role !== 'user') {
			return {
				success: false,
				message: 'Unauthorized',
			};
		}

		const fileUrl = getPublicUrl(data.pdfKey);
		const thumbnailUrl = getPublicUrl(data.thumbnailKey);

		// Create resume record in database
		const [newResume] = await db
			.insert(resumes)
			.values({
				userId: user.userId,
				slug: data.slug,
				title: data.title,
				description: data.description || null,
				fileUrl,
				thumbnailUrl,
			})
			.returning();

		return {
			success: true,
			message: 'Resume uploaded successfully',
			resume: newResume,
		};
	} catch (error) {
		console.error('Error saving resume metadata:', error);
		return {
			success: false,
			message: 'Failed to save resume. Please try again.',
		};
	}
}

/**
 * Get all resumes for the current user
 */
export async function getUserResumes(): Promise<ResumeResponse> {
	try {
		const user = await getCurrentUserFromToken();
		if (!user || user.role !== 'user') {
			return {
				success: false,
				message: 'Unauthorized',
			};
		}

		const userResumes = await db.query.resumes.findMany({
			where: eq(resumes.userId, user.userId),
			orderBy: (resumes, { desc }) => [desc(resumes.createdAt)],
		});

		return {
			success: true,
			resumes: userResumes,
		};
	} catch (error) {
		console.error('Error fetching resumes:', error);
		return {
			success: false,
			message: 'Failed to fetch resumes',
		};
	}
}

/**
 * Get a single resume by slug
 */
export async function getResumeBySlug(slug: string): Promise<ResumeResponse> {
	try {
		const user = await getCurrentUserFromToken();
		if (!user || user.role !== 'user') {
			return {
				success: false,
				message: 'Unauthorized',
			};
		}

		const resume = await db.query.resumes.findFirst({
			where: and(eq(resumes.slug, slug), eq(resumes.userId, user.userId)),
		});

		if (!resume) {
			return {
				success: false,
				message: 'Resume not found',
			};
		}

		return {
			success: true,
			resume,
		};
	} catch (error) {
		console.error('Error fetching resume:', error);
		return {
			success: false,
			message: 'Failed to fetch resume',
		};
	}
}

/**
 * Update a resume (title and description only)
 */
export async function updateResume(
	id: string,
	data: { title?: string; description?: string }
): Promise<ResumeResponse> {
	try {
		const user = await getCurrentUserFromToken();
		if (!user || user.role !== 'user') {
			return {
				success: false,
				message: 'Unauthorized',
			};
		}

		// Check if resume exists and belongs to user
		const existingResume = await db.query.resumes.findFirst({
			where: and(eq(resumes.id, id), eq(resumes.userId, user.userId)),
		});

		if (!existingResume) {
			return {
				success: false,
				message: 'Resume not found',
			};
		}

		// Update resume
		const [updatedResume] = await db
			.update(resumes)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(eq(resumes.id, id))
			.returning();

		return {
			success: true,
			message: 'Resume updated successfully',
			resume: updatedResume,
		};
	} catch (error) {
		console.error('Error updating resume:', error);
		return {
			success: false,
			message: 'Failed to update resume',
		};
	}
}

/**
 * Delete a resume
 */
export async function deleteResume(id: string): Promise<ResumeResponse> {
	try {
		const user = await getCurrentUserFromToken();
		if (!user || user.role !== 'user') {
			return {
				success: false,
				message: 'Unauthorized',
			};
		}

		// Check if resume exists and belongs to user
		const existingResume = await db.query.resumes.findFirst({
			where: and(eq(resumes.id, id), eq(resumes.userId, user.userId)),
		});

		if (!existingResume) {
			return {
				success: false,
				message: 'Resume not found',
			};
		}

		// Delete files from R2
		try {
			const { deleteFromR2 } = await import('@/lib/r2/upload');
			await deleteFromR2(getKeyFromUrl(existingResume.fileUrl));

			// Delete thumbnail if it's not a placeholder
			if (existingResume.thumbnailUrl && !existingResume.thumbnailUrl.startsWith('/')) {
				await deleteFromR2(getKeyFromUrl(existingResume.thumbnailUrl));
			}
		} catch (error) {
			console.error('Error deleting files from R2:', error);
			// Continue with database deletion even if R2 deletion fails
		}

		// Delete from database
		await db.delete(resumes).where(eq(resumes.id, id));

		return {
			success: true,
			message: 'Resume deleted successfully',
		};
	} catch (error) {
		console.error('Error deleting resume:', error);
		return {
			success: false,
			message: 'Failed to delete resume',
		};
	}
}
