	import { env } from '@/env';
	import { db } from '@/drizzle';

const createDrizzleClient = () => {
	return db;
};

const globalForDrizzle = globalThis as unknown as {
	drizzle: ReturnType<typeof createDrizzleClient> | undefined;
};

export const database = globalForDrizzle.drizzle ?? createDrizzleClient();

if (env.NODE_ENV !== 'production') globalForDrizzle.drizzle = database;
