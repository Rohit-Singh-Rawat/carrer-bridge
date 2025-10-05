import Link from 'next/link';
import Logo from '@/components/career-bridge/logo';

type Props = {};

function Navbar({}: Props) {
	return (
		<nav className='fixed top-0 left-0 right-0 z-50 bg-transparent'>
			<div className='container mx-auto flex items-center justify-between px-6 py-4'>
				<Logo className='size-7' />

				<div className='flex items-center gap-8'>
					<Link
						href='/dashboard/jobs'
						className='hover:text-primary/80 font-light'
					>
						Find Jobs
					</Link>
				</div>

				<div className='flex items-center gap-4'>
					<Link
						href='/login'
						className='px-4 py-2 hover:text-primary font-light'
					>
						Log in
					</Link>
					<Link
						href='/register'
						className='px-4 py-2 rounded-full bg-primary text-white hover:bg-primary/90 font-light'
					>
						Sign up
					</Link>
				</div>
			</div>
		</nav>
	);
}

export default Navbar;
