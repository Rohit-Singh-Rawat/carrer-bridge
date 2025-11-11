import { Redis } from '@upstash/redis';
import { env } from '@/env';

export const redis = new Redis({
	url: env.UPSTASH_REDIS_REST_URL,
	token: env.UPSTASH_REDIS_REST_TOKEN,
});

export const NOTIFICATION_CHANNEL = 'notifications';

export async function publishNotification(userId: string, notification: unknown) {
	await redis.publish(`${NOTIFICATION_CHANNEL}:${userId}`, JSON.stringify(notification));
}

