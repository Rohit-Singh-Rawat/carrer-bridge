type ErrorCode =
	| 'INVALID_CREDENTIALS'
	| 'INVALID_EMAIL_OR_PASSWORD'
	| 'USER_NOT_FOUND'
	| 'USER_ALREADY_EXISTS'
	| 'WEAK_PASSWORD'
	| 'TOO_MANY_ATTEMPTS'
	| 'NETWORK_ERROR'
	| 'PASSWORD_COMPROMISED'
	| 'SERVER_ERROR'
	| 'INVALID_EMAIL_DOMAIN';

const ERROR_MESSAGES: Record<ErrorCode, string> = {
	INVALID_CREDENTIALS: 'Invalid credentials',
	INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password',
	USER_NOT_FOUND: 'User not found',
	USER_ALREADY_EXISTS: 'User already exists',
	WEAK_PASSWORD: 'Password is too weak',
	TOO_MANY_ATTEMPTS: 'Too many login attempts. Please try again later',
	NETWORK_ERROR: 'Network error. Please check your connection',
	SERVER_ERROR: 'Server error. Please try again later',
	PASSWORD_COMPROMISED: 'Password is compromised',
	INVALID_EMAIL_DOMAIN: 'Invalid domain.Please use a valid email domain',
};

export const getErrorMessage = (errorCode: string): string | undefined => {
	return (
		ERROR_MESSAGES[errorCode as ErrorCode] 
	);
};

export default getErrorMessage;
