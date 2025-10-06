'use server';

import { db } from '@/db';
import { resumes, type Resume } from '@/db/schema';
import { getCurrentUserFromToken } from '@/lib/auth/jwt';
import { getKeyFromUrl, uploadToR2 } from '@/lib/r2/upload';
import { generateUniqueSlug } from '@/lib/utils/slug';
import { and, eq } from 'drizzle-orm';
import { pdf } from 'pdf-to-img';
import sharp from 'sharp';

interface ResumeResponse {
	success: boolean;
	message?: string;
	resume?: Resume;
	resumes?: Resume[];
}

/**
 * Generate a thumbnail from a PDF file
 */
async function generatePdfThumbnail(
	pdfBuffer: Buffer
): Promise<{ buffer: Buffer; width: number; height: number }> {
	try {
		// Convert PDF to image
		const document = await pdf(pdfBuffer, { scale: 2.0 });

		// Get first page
		const firstPage = await document.getPage(1);

		if (!firstPage) {
			throw new Error('Failed to get first page');
		}

		// Resize to thumbnail size with sharp
		const thumbnail = await sharp(firstPage)
			.resize(400, null, {
				fit: 'inside',
				withoutEnlargement: true,
			})
			.png({ quality: 90, compressionLevel: 9 })
			.toBuffer();

		const metadata = await sharp(thumbnail).metadata();

		return {
			buffer: thumbnail,
			width: metadata.width || 400,
			height: metadata.height || 560,
		};
	} catch (error) {
		console.error('Error generating PDF thumbnail:', error);
		// Return a default gray thumbnail on error
		const defaultThumbnail = await sharp({
			create: {
				width: 400,
				height: 560,
				channels: 4,
				background: { r: 240, g: 240, b: 240, alpha: 1 },
			},
		})
			.png()
			.toBuffer();

		return { buffer: defaultThumbnail, width: 400, height: 560 };
	}
}

/**
 * Create a new resume
 */
export async function createResume(formData: FormData): Promise<ResumeResponse> {
	try {
		// Verify user is authenticated and is a candidate (user role)
		const user = await getCurrentUserFromToken();
		if (!user || user.role !== 'user') {
			return {
				success: false,
				message: 'Unauthorized. Only candidates can upload resumes.',
			};
		}

		const title = formData.get('title') as string;
		const description = (formData.get('description') as string) || null;
		const file = formData.get('file') as File;

		if (!title || !file) {
			return {
				success: false,
				message: 'Title and file are required',
			};
		}

		// Validate file type
		if (file.type !== 'application/pdf') {
			return {
				success: false,
				message: 'Only PDF files are allowed',
			};
		}

		// Generate unique slug
		const slug = await generateUniqueSlug(title, user.userId);

		// Convert file to buffer
		const fileBuffer = Buffer.from(await file.arrayBuffer());

		// Upload PDF to R2
		const pdfKey = `resumes/${user.userId}/${slug}.pdf`;
		const fileUrl = await uploadToR2(pdfKey, fileBuffer, 'application/pdf');

		// Generate and upload thumbnail
		const thumbnail = await generatePdfThumbnail(fileBuffer);
		const thumbnailKey = `resumes/${user.userId}/${slug}-thumb.png`;
		const thumbnailUrl = await uploadToR2(thumbnailKey, thumbnail.buffer, 'image/png');

		// Create resume record in database
		const [newResume] = await db
			.insert(resumes)
			.values({
				userId: user.userId,
				slug,
				title,
				description,
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
		console.error('Error creating resume:', error);
		return {
			success: false,
			message: 'Failed to upload resume. Please try again.',
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
			await deleteFromR2(getKeyFromUrl(existingResume.thumbnailUrl));
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
