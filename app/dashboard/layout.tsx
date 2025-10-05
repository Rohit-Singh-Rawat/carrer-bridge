import { requireAuth } from '@/actions/auth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	// Require authentication for all dashboard routes
	await requireAuth();

	return <>{children}</>;
}

