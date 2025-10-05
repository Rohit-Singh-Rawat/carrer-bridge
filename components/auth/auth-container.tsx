import Image from 'next/image';
import Link from 'next/link';
import Logo from '@/components/career-bridge/logo';

interface AuthContainerProps {
	children: React.ReactNode;
	imageOnLeft?: boolean;
}

export default function AuthContainer({ children, imageOnLeft = false }: AuthContainerProps) {
	const imageSection = (
		<div className='hidden lg:flex items-center justify-center relative overflow-hidden m-8 rounded-4xl col-span-3 '>
			<Image
				src='/images/career.jpg'
				alt='Career Bridge'
				fill
				sizes='40vw'
				className='object-cover rounded-4xl '
				priority
			/>
			<div className='absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent' />
		</div>
	);

	const formSection = (
		<div className='flex items-center justify-center p-8 lg:p-12 bg-background col-span-4 rounded-4xl   '>
			<div className='w-full max-w-md'>
				{/* Logo and App Name */}
				<div className='mb-10 text-center lg:text-left'>
					<Link
						href='/'
						className='inline-flex items-center gap-3 group'
					>
						<Logo className=' group-hover:scale-105 transition-transform' />
					</Link>
				</div>

				{/* Form Content */}
				{children}
			</div>
		</div>
	);

	return (
		<div className='min-h-screen grid lg:grid-cols-7'>
			{imageOnLeft ? (
				<>
					{imageSection}
					{formSection}
				</>
			) : (
				<>
					{formSection}
					{imageSection}
				</>
			)}
		</div>
	);
}
