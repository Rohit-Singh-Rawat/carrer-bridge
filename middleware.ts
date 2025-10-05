import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-key');
const TOKEN_NAME = 'auth-token';

// Routes that require authentication
const protectedRoutes = ['/dashboard'];

// Routes that should redirect to dashboard if authenticated
const authRoutes = ['/login', '/register'];

export async function middleware(request: NextRequest) {
	const token = request.cookies.get(TOKEN_NAME)?.value;
	const { pathname } = request.nextUrl;

	// Check if route is protected
	const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
	const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

	// Verify token if exists
	let isAuthenticated = false;
	if (token) {
		try {
			await jwtVerify(token, secret);
			isAuthenticated = true;
		} catch (error) {
			// Token is invalid, remove it
			const response = NextResponse.next();
			response.cookies.delete(TOKEN_NAME);
		}
	}

	// Redirect to login if trying to access protected route without auth
	if (isProtectedRoute && !isAuthenticated) {
		const loginUrl = new URL('/login', request.url);
		loginUrl.searchParams.set('redirect', pathname);
		return NextResponse.redirect(loginUrl);
	}

	// Redirect to dashboard if trying to access auth routes while authenticated
	if (isAuthRoute && isAuthenticated) {
		return NextResponse.redirect(new URL('/dashboard/jobs', request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public (public files)
		 */
		'/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$).*)',
	],
};

