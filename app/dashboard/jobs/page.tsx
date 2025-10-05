import { getCurrentUser, logout } from '@/actions/auth';
import { Button } from '@/components/ui/button';

export default async function JobsPage() {
	const user = await getCurrentUser();

	if (!user) {
		return null;
	}

	return (
		<div className='min-h-screen p-8'>
			<div className='max-w-7xl mx-auto'>
				<div className='flex items-center justify-between mb-8'>
					<div>
						<h1 className="text-4xl font-['outfit'] font-normal mb-2">
							Welcome back, {user.fullName}!
						</h1>
						<p className="text-muted-foreground font-['outfit'] font-light">
							{user.role === 'recruiter' ? 'Manage your job postings' : 'Find your dream job'}
						</p>
					</div>
					<form action={logout}>
						<Button
							type='submit'
							variant='outline'
							className="rounded-full font-['outfit']"
						>
							Logout
						</Button>
					</form>
				</div>

				<div className='grid gap-6'>
					<div className='p-6 rounded-2xl border bg-card'>
						<h2 className="text-2xl font-['outfit'] font-normal mb-4">Jobs Dashboard</h2>
						<p className="text-muted-foreground font-['outfit'] font-light">
							Your jobs dashboard is ready! You're logged in as a {user.role}.
						</p>
						{user.role === 'recruiter' && user.recruiterProfile && (
							<div className='mt-4'>
								<p className="text-sm text-muted-foreground font-['outfit']">
									Company: {user.recruiterProfile.companyName}
								</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

