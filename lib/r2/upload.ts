import { env } from '@/env';
import {
	DeleteObjectCommand,
	PutObjectCommand,
	type PutObjectCommandInput,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { R2 } from './client';

const BUCKET_NAME = env.R2_BUCKET_NAME;

/**
 * Generate a presigned URL for uploading a file to R2
 */
export async function getUploadPresignedUrl(
	key: string,
	contentType: string,
	expiresIn = 3600 // 1 hour
): Promise<string> {
	const command = new PutObjectCommand({
		Bucket: BUCKET_NAME,
		Key: key,
		ContentType: contentType,
	});

	return await getSignedUrl(R2, command, { expiresIn });
}

/**
 * Upload a file directly to R2
 */
export async function uploadToR2(key: string, file: Buffer, contentType: string): Promise<string> {
	const params: PutObjectCommandInput = {
		Bucket: BUCKET_NAME,
		Key: key,
		Body: file,
		ContentType: contentType,
	};

	await R2.send(new PutObjectCommand(params));

	return `${env.NEXT_PUBLIC_R2_URL}/${key}`;
}

/**
 * Delete a file from R2
 */
export async function deleteFromR2(key: string): Promise<void> {
	const command = new DeleteObjectCommand({
		Bucket: BUCKET_NAME,
		Key: key,
	});

	await R2.send(command);
}

/**
 * Get the public URL for a file in R2
 */
export function getPublicUrl(key: string): string {
	return `${env.NEXT_PUBLIC_R2_URL}/${key}`;
}

/**
 * Extract the key from a public URL
 */
export function getKeyFromUrl(url: string): string {
	return url.replace(`${env.NEXT_PUBLIC_R2_URL}/`, '');
}
