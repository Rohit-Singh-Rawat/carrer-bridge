import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		DATABASE_URL: z.string().url(),
		JWT_SECRET: z.string().min(32),
		R2_ACCESS_ENDPOINT: z.string().url(),
		R2_ACCESS_KEYID: z.string().min(1),
		R2_SECRET_ACCEESS_KEY: z.string().min(1),
		R2_BUCKET_NAME: z.string().min(1),
		GOOGLE_GEMINI_API_KEY: z.string().min(1),
		UPSTASH_REDIS_URL: z.string().url(),
		UPSTASH_REDIS_REST_URL: z.string().url(),
		UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
		NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		NEXT_PUBLIC_APP_URL: z.string().url(),
		NEXT_PUBLIC_R2_URL: z.string().url(),
		NEXT_PUBLIC_INTERVIEW_MAX_DURATION: z.string().default('1800'),
		NEXT_PUBLIC_INTERVIEW_TOTAL_QUESTIONS: z.string().default('8'),
		NEXT_PUBLIC_SNAPSHOT_INTERVAL: z.string().default('10'),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		DATABASE_URL: process.env.DATABASE_URL,
		JWT_SECRET: process.env.JWT_SECRET,
		R2_ACCESS_ENDPOINT: process.env.R2_ACCESS_ENDPOINT,
		R2_ACCESS_KEYID: process.env.R2_ACCESS_KEYID,
		R2_SECRET_ACCEESS_KEY: process.env.R2_SECRET_ACCEESS_KEY,
		R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
		GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
		UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL,
		UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
		UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
		NODE_ENV: process.env.NODE_ENV,
		NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
		NEXT_PUBLIC_R2_URL: process.env.NEXT_PUBLIC_R2_URL,
		NEXT_PUBLIC_INTERVIEW_MAX_DURATION: process.env.NEXT_PUBLIC_INTERVIEW_MAX_DURATION,
		NEXT_PUBLIC_INTERVIEW_TOTAL_QUESTIONS: process.env.NEXT_PUBLIC_INTERVIEW_TOTAL_QUESTIONS,
		NEXT_PUBLIC_SNAPSHOT_INTERVAL: process.env.NEXT_PUBLIC_SNAPSHOT_INTERVAL,
	},

	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,

	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,
});
