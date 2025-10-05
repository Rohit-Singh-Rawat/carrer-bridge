import Link from 'next/link';
import Prism from '@/components/prism';

export default function Hero() {
	return (
		<section className='min-h-screen flex flex-col items-center justify-center text-center px-4 '>
			<div className='absolute inset-0 mask-radial  rounded-3xl'>
				<Prism
					animationType='rotate'
					timeScale={0.5}
					height={3.5}
					baseWidth={5.5}
					scale={1.8}
					hueShift={0}
					colorFrequency={1}
					noise={0.2}
					glow={1}
					className='rounded-3xl mask-radial from-white to-transparent'
				/>
			</div>
			<div className='relative z-10'>
				<h1 className="font-['eb_garamond'] text-5xl md:text-7xl font-medium max-w-4xl leading-tight">
					AI-Powered Hiring, Simplified.
				</h1>

				<p className="mt-6 text-xl text-gray-600 max-w-2xl font-['outfit'] font-light">
					Our intelligent platform streamlines your job search experience, from discovering
					opportunities to landing interviews. Let AI match you with your ideal career path.
				</p>

				<div className='flex flex-wrap items-center justify-center gap-4 mt-12'>
					<Link
						href='/jobs'
						className='px-7 py-2.5 rounded-full bg-primary text-white hover:bg-primary/90 text-lg border border-primary'
					>
						Find Jobs
					</Link>
					<Link
						href='/register'
						className='px-7 py-2.5 rounded-full border border-primary/60 text-primary hover:bg-primary/5 text-lg'
					>
						Get Started
					</Link>
				</div>
			</div>
		</section>
	);
}
