'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { recruiterProfiles, users } from '@/db/schema';
import {
	generateToken,
	getCurrentUserFromToken,
	removeAuthCookie,
	setAuthCookie,
} from '@/lib/auth/jwt';
import { hashPassword, verifyPassword } from '@/lib/auth/password';

export interface AuthResponse {
	success: boolean;
	message: string;
	redirectTo?: string;
}

/**
 * Register a new user
 */
export async function registerUser(data: {
	email: string;
	password: string;
	fullName: string;
}): Promise<AuthResponse> {
	try {
		// Check if user already exists
		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, data.email.toLowerCase()),
		});

		if (existingUser) {
			return {
				success: false,
				message: 'An account with this email already exists',
			};
		}

		// Hash password
		const hashedPassword = await hashPassword(data.password);

		// Create user
		const [newUser] = await db
			.insert(users)
			.values({
				email: data.email.toLowerCase(),
				password: hashedPassword,
				fullName: data.fullName,
				role: 'user',
			})
			.returning();

		// Generate token
		const token = await generateToken({
			userId: newUser.id,
			email: newUser.email,
			role: newUser.role,
		});

		// Set cookie
		await setAuthCookie(token);

		return {
			success: true,
			message: 'Account created successfully',
			redirectTo: '/dashboard/jobs',
		};
	} catch (error) {
		console.error('Registration error:', error);
		return {
			success: false,
			message: 'Failed to create account. Please try again.',
		};
	}
}

/**
 * Register a new recruiter
 */
export async function registerRecruiter(data: {
	email: string;
	password: string;
	fullName: string;
	companyName: string;
}): Promise<AuthResponse> {
	try {
		// Check if user already exists
		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, data.email.toLowerCase()),
		});

		if (existingUser) {
			return {
				success: false,
				message: 'An account with this email already exists',
			};
		}

		// Hash password
		const hashedPassword = await hashPassword(data.password);

		// Create user
		const [newUser] = await db
			.insert(users)
			.values({
				email: data.email.toLowerCase(),
				password: hashedPassword,
				fullName: data.fullName,
				role: 'recruiter',
			})
			.returning();

		// Create recruiter profile
		await db.insert(recruiterProfiles).values({
			userId: newUser.id,
			companyName: data.companyName,
		});

		// Generate token
		const token = await generateToken({
			userId: newUser.id,
			email: newUser.email,
			role: newUser.role,
		});

		// Set cookie
		await setAuthCookie(token);

		return {
			success: true,
			message: 'Recruiter account created successfully',
			redirectTo: '/dashboard/jobs',
		};
	} catch (error) {
		console.error('Recruiter registration error:', error);
		return {
			success: false,
			message: 'Failed to create recruiter account. Please try again.',
		};
	}
}

/**
 * Login user
 */
export async function loginUser(data: { email: string; password: string }): Promise<AuthResponse> {
	try {
		// Find user
		const user = await db.query.users.findFirst({
			where: eq(users.email, data.email.toLowerCase()),
		});

		if (!user) {
			return {
				success: false,
				message: 'Invalid email or password',
			};
		}

		// Verify password
		const isValidPassword = await verifyPassword(data.password, user.password);

		if (!isValidPassword) {
			return {
				success: false,
				message: 'Invalid email or password',
			};
		}

		// Check if user is regular user
		if (user.role !== 'user') {
			return {
				success: false,
				message: 'Please use the recruiter login',
			};
		}

		// Generate token
		const token = await generateToken({
			userId: user.id,
			email: user.email,
			role: user.role,
		});

		// Set cookie
		await setAuthCookie(token);

		return {
			success: true,
			message: 'Logged in successfully',
			redirectTo: '/dashboard/jobs',
		};
	} catch (error) {
		console.error('Login error:', error);
		return {
			success: false,
			message: 'Failed to login. Please try again.',
		};
	}
}

/**
 * Login recruiter
 */
export async function loginRecruiter(data: {
	email: string;
	password: string;
}): Promise<AuthResponse> {
	try {
		// Find user
		const user = await db.query.users.findFirst({
			where: eq(users.email, data.email.toLowerCase()),
			with: {
				recruiterProfile: true,
			},
		});

		if (!user) {
			return {
				success: false,
				message: 'Invalid email or password',
			};
		}

		// Verify password
		const isValidPassword = await verifyPassword(data.password, user.password);

		if (!isValidPassword) {
			return {
				success: false,
				message: 'Invalid email or password',
			};
		}

		// Check if user is recruiter
		if (user.role !== 'recruiter') {
			return {
				success: false,
				message: 'Please use the regular user login',
			};
		}

		// Generate token
		const token = await generateToken({
			userId: user.id,
			email: user.email,
			role: user.role,
		});

		// Set cookie
		await setAuthCookie(token);

		return {
			success: true,
			message: 'Logged in successfully',
			redirectTo: '/dashboard/jobs',
		};
	} catch (error) {
		console.error('Recruiter login error:', error);
		return {
			success: false,
			message: 'Failed to login. Please try again.',
		};
	}
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
	await removeAuthCookie();
	revalidatePath('/');
	redirect('/');
}

/**
 * Get current user
 */
export async function getCurrentUser() {
	const payload = await getCurrentUserFromToken();

	if (!payload) {
		return null;
	}

	// Fetch user from database with relations
	const user = await db.query.users.findFirst({
		where: eq(users.id, payload.userId),
		with: {
			recruiterProfile: true,
		},
	});

	if (!user) {
		return null;
	}

	// Return user without password
	// biome-ignore lint/correctness/noUnusedVariables: intentionally destructuring to remove password
	const { password, ...userWithoutPassword } = user;
	return userWithoutPassword;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
	const user = await getCurrentUser();
	return !!user;
}

/**
 * Require authentication (throws error if not authenticated)
 */
export async function requireAuth() {
	const user = await getCurrentUser();
	if (!user) {
		redirect('/login');
	}
	return user;
}

/**
 * Require recruiter role
 */
export async function requireRecruiter() {
	const user = await requireAuth();
	if (user.role !== 'recruiter') {
		redirect('/dashboard/jobs');
	}
	return user;
}
