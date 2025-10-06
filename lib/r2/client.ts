import { env } from '@/env';
import { S3Client } from '@aws-sdk/client-s3';

export const R2 = new S3Client({
	region: 'auto',
	endpoint: env.R2_ACCESS_ENDPOINT,
	credentials: {
		accessKeyId: env.R2_ACCESS_KEYID,
		secretAccessKey: env.R2_SECRET_ACCEESS_KEY,
	},
});
