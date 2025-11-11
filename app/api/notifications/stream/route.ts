import Redis from 'ioredis';
import { env } from '@/env';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { NOTIFICATION_CHANNEL } from '@/lib/notifications/redis';
import { COOKIE_NAMES } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET() {
	const cookieStore = await cookies();
	const token = cookieStore.get(COOKIE_NAMES.AUTH_TOKEN)?.value;

	if (!token) {
		return new Response('Unauthorized', { status: 401 });
	}

	const payload = await verifyToken(token);
	if (!payload?.userId) {
		return new Response('Unauthorized', { status: 401 });
	}

	const userId = payload.userId as string;
	const encoder = new TextEncoder();

	let redisSubscriber: Redis | null = null;
	let keepAlive: NodeJS.Timeout | null = null;
	let channelKey = '';

	const customReadable = new ReadableStream({
		start(controller) {
			redisSubscriber = new Redis(env.UPSTASH_REDIS_URL);
			channelKey = `${NOTIFICATION_CHANNEL}:${userId}`;

			redisSubscriber.subscribe(channelKey, (err) => {
				if (err) {
					console.error('Redis subscription error:', err);
					controller.error(err);
				}
			});

			redisSubscriber.on('message', (channel, message) => {
				if (channel === channelKey) {
					try {
						controller.enqueue(encoder.encode(`data: ${message}\n\n`));
					} catch (err) {
						console.error('Error enqueuing message:', err);
					}
				}
			});

			redisSubscriber.on('error', (err) => {
				console.error('Redis connection error:', err);
			});

			keepAlive = setInterval(() => {
				try {
					controller.enqueue(encoder.encode(': keepalive\n\n'));
				} catch (err) {
					// Stream closed, ignore
				}
			}, 30000);
		},
		cancel() {
			console.log('SSE connection closed');
			if (keepAlive) {
				clearInterval(keepAlive);
			}
			if (redisSubscriber) {
				redisSubscriber.unsubscribe(channelKey);
				redisSubscriber.disconnect();
			}
		},
	});

	return new Response(customReadable, {
		headers: {
			'Content-Type': 'text/event-stream; charset=utf-8',
			Connection: 'keep-alive',
			'Cache-Control': 'no-cache, no-transform',
			'Content-Encoding': 'none',
			'X-Accel-Buffering': 'no',
		},
	});
}
