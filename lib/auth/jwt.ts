import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');
const TOKEN_NAME = 'auth-token';
const TOKEN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface JWTPayload {
	userId: string;
	email: string;
	role: 'user' | 'recruiter';
}

/**
 * Generate a JWT token
 */
export async function generateToken(payload: JWTPayload): Promise<string> {
	const token = await new SignJWT({ ...payload })
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime('7d')
		.sign(secret);

	return token;
}

/**
 * Verify a JWT token
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
	try {
		const { payload } = await jwtVerify(token, secret);
		return payload as JWTPayload;
	} catch (error) {
		console.error('Token verification failed:', error);
		return null;
	}
}

/**
 * Set auth token as cookie
 */
export async function setAuthCookie(token: string) {
	const cookieStore = await cookies();
	cookieStore.set(TOKEN_NAME, token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: TOKEN_MAX_AGE,
		path: '/',
	});
}

/**
 * Get auth token from cookie
 */
export async function getAuthToken(): Promise<string | null> {
	const cookieStore = await cookies();
	const cookie = cookieStore.get(TOKEN_NAME);
	return cookie?.value || null;
}

/**
 * Remove auth token cookie
 */
export async function removeAuthCookie() {
	const cookieStore = await cookies();
	cookieStore.delete(TOKEN_NAME);
}

/**
 * Get current user from token
 */
export async function getCurrentUserFromToken(): Promise<JWTPayload | null> {
	const token = await getAuthToken();
	if (!token) return null;
	return verifyToken(token);
}

