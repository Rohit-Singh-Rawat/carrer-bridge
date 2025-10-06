import { db } from '@/db';
import { resumes } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Generate a URL-friendly slug from a string
 */
export function slugify(text: string): string {
	return text
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '') // Remove special characters
		.replace(/[\s_-]+/g, '-') // Replace spaces, underscores with hyphens
		.replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a unique slug for a resume
 * If slug exists, append a number (e.g., my-resume-2, my-resume-3)
 */
export async function generateUniqueSlug(title: string, userId: string): Promise<string> {
	const baseSlug = slugify(title);

	// Check if slug exists for this user
	const existingResume = await db.query.resumes.findFirst({
		where: eq(resumes.slug, baseSlug),
	});

	if (!existingResume) {
		return baseSlug;
	}

	// If exists, try with numbers
	let counter = 2;
	let newSlug = `${baseSlug}-${counter}`;

	while (true) {
		const exists = await db.query.resumes.findFirst({
			where: eq(resumes.slug, newSlug),
		});

		if (!exists) {
			return newSlug;
		}

		counter++;
		newSlug = `${baseSlug}-${counter}`;
	}
}
