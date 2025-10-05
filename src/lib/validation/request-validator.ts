import type { NextRequest } from 'next/server';
import { RequestSchema, type ChatRequest } from '@/types/chatPayload';
import { ERROR_MESSAGES } from '@/ai/constant';

export async function validateRequest(request: NextRequest): Promise<ChatRequest> {
	try {
		const body = await request.json();
		const result = RequestSchema.safeParse(body);

		if (!result.success) {
			console.error('Validation error:', result.error.message);
			throw new Error(ERROR_MESSAGES.INVALID_REQUEST);
		}
		return result.data;
	} catch (error) {
		if (error instanceof Error) throw error;
		throw new Error(ERROR_MESSAGES.INVALID_REQUEST);
	}
}
