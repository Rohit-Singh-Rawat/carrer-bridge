import { ERROR_MESSAGES } from '@/ai/constant';
import { validateSession } from '@/utils/apis';

export async function validateUser() {
	try {
		const session = await validateSession();
		return session;
	} catch (error) {
		console.error('User validation error:', error);
		throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
	}
}
