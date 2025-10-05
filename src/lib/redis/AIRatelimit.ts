import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Free tier rate limiters for AI features
export const aiMessageRateLimiter = new Ratelimit({
	redis: Redis.fromEnv(),
	limiter: Ratelimit.slidingWindow(50, '1 h'), // 50 messages per hour
	analytics: true,
});

export const aiWebSearchRateLimiter = new Ratelimit({
	redis: Redis.fromEnv(),
	limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 web searches per hour
	analytics: true,
});

export const aiMemoryRateLimiter = new Ratelimit({
	redis: Redis.fromEnv(),
	limiter: Ratelimit.slidingWindow(20, '1 d'), // 20 memory operations per day
	analytics: true,
});

type AIRateLimitProps = {
	actionType: 'message' | 'webSearch' | 'memory';
	identifier: string; // user ID or session ID
};

function getAIRateLimiter(actionType: 'message' | 'webSearch' | 'memory'): Ratelimit {
	switch (actionType) {
		case 'message':
			return aiMessageRateLimiter;
		case 'webSearch':
			return aiWebSearchRateLimiter;
		case 'memory':
			return aiMemoryRateLimiter;
		default:
			return aiMessageRateLimiter;
	}
}

export async function aiRateLimit({ actionType, identifier }: AIRateLimitProps): Promise<void> {
	const rateLimiter = getAIRateLimiter(actionType);
	const { success } = await rateLimiter.limit(identifier);

	if (!success) {
		const actionMessages = {
			message: 'Too many messages. Please try again later or add your own API key.',
			webSearch: 'Too many web searches. Please try again later or add your own API key.',
			memory: 'Too many memory operations. Please try again later or add your own API key.',
		};
		throw new Error(actionMessages[actionType]);
	}
}
