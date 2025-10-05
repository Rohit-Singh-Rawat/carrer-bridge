'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { HugeiconsIcon } from '@hugeicons/react';
import {
	Mail01Icon,
	LockPasswordIcon,
	ArrowRight01Icon,
	UserIcon,
} from '@hugeicons/core-free-icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AuthContainer from '@/components/auth/auth-container';

const registerSchema = z
	.object({
		fullName: z.string().min(2, 'Full name must be at least 2 characters'),
		email: z.string().email('Please enter a valid email address'),
		password: z.string().min(6, 'Password must be at least 6 characters'),
		confirmPassword: z.string().min(6, 'Please confirm your password'),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword'],
	});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting },
	} = useForm<RegisterFormData>({
		resolver: zodResolver(registerSchema),
	});

	const onSubmit = async (data: RegisterFormData) => {
		const { registerUser } = await import('@/actions/auth');
		const result = await registerUser({
			email: data.email,
			password: data.password,
			fullName: data.fullName,
		});

		if (!result.success) {
			toast.error(result.message);
		} else {
			toast.success('Account created successfully! Redirecting...');
			if (result.redirectTo) {
				window.location.href = result.redirectTo;
			}
		}
	};

	return (
		<AuthContainer imageOnLeft={false}>
			<div className='space-y-8'>
				<div>
					<h1 className="text-4xl font-['outfit'] font-normal mb-2">Create an account</h1>
					<p className="text-muted-foreground font-['outfit'] font-light">
						Start your career journey today
					</p>
				</div>

				<form
					onSubmit={handleSubmit(onSubmit)}
					className='space-y-5'
				>
					<div className='space-y-2'>
						<label
							htmlFor='fullName'
							className="block text-sm font-['outfit'] font-normal text-foreground/80"
						>
							Full Name
						</label>
						<div className='relative'>
							<HugeiconsIcon
								icon={UserIcon}
								className='absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60'
								size={20}
							/>
							<Input
								id='fullName'
								type='text'
								placeholder='Enter your full name'
								className='pl-12 h-12 rounded-full bg-background border-border/50 font-["outfit"] font-light focus-visible:border-primary/50'
								{...register('fullName')}
								aria-invalid={!!errors.fullName}
							/>
						</div>
						{errors.fullName && (
							<p className="text-sm text-destructive font-['outfit'] font-light mt-1">
								{errors.fullName.message}
							</p>
						)}
					</div>

					<div className='space-y-2'>
						<label
							htmlFor='email'
							className="block text-sm font-['outfit'] font-normal text-foreground/80"
						>
							Email Address
						</label>
						<div className='relative'>
							<HugeiconsIcon
								icon={Mail01Icon}
								className='absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60'
								size={20}
							/>
							<Input
								id='email'
								type='email'
								placeholder='Enter your email address'
								className='pl-12 h-12 rounded-full bg-background border-border/50 font-["outfit"] font-light focus-visible:border-primary/50'
								{...register('email')}
								aria-invalid={!!errors.email}
							/>
						</div>
						{errors.email && (
							<p className="text-sm text-destructive font-['outfit'] font-light mt-1">
								{errors.email.message}
							</p>
						)}
					</div>

					<div className='space-y-2'>
						<label
							htmlFor='password'
							className="block text-sm font-['outfit'] font-normal text-foreground/80"
						>
							Password
						</label>
						<div className='relative'>
							<HugeiconsIcon
								icon={LockPasswordIcon}
								className='absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60'
								size={20}
							/>
							<Input
								id='password'
								type='password'
								placeholder='Create a password'
								className='pl-12 h-12 rounded-full bg-background border-border/50 font-["outfit"] font-light focus-visible:border-primary/50'
								{...register('password')}
								aria-invalid={!!errors.password}
							/>
						</div>
						{errors.password && (
							<p className="text-sm text-destructive font-['outfit'] font-light mt-1">
								{errors.password.message}
							</p>
						)}
					</div>

					<div className='space-y-2'>
						<label
							htmlFor='confirmPassword'
							className="block text-sm font-['outfit'] font-normal text-foreground/80"
						>
							Confirm Password
						</label>
						<div className='relative'>
							<HugeiconsIcon
								icon={LockPasswordIcon}
								className='absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60'
								size={20}
							/>
							<Input
								id='confirmPassword'
								type='password'
								placeholder='Confirm your password'
								className='pl-12 h-12 rounded-full bg-background border-border/50 font-["outfit"] font-light focus-visible:border-primary/50'
								{...register('confirmPassword')}
								aria-invalid={!!errors.confirmPassword}
							/>
						</div>
						{errors.confirmPassword && (
							<p className="text-sm text-destructive font-['outfit'] font-light mt-1">
								{errors.confirmPassword.message}
							</p>
						)}
					</div>

					<Button
						type='submit'
						isLoading={isSubmitting}
						loadingText='Creating account...'
						className='w-full h-12 rounded-full text-base font-["outfit"] font-normal shadow-sm hover:shadow-md transition-all mt-6'
					>
						Create account
						<HugeiconsIcon
							icon={ArrowRight01Icon}
							size={20}
						/>
					</Button>

					<div className='space-y-4 text-center pt-4'>
						<p className="text-sm text-muted-foreground font-['outfit'] font-light">
							Already have an account?{' '}
							<Link
								href='/login'
								className='text-primary hover:underline font-normal'
							>
								Sign in
							</Link>
						</p>
						<Link
							href='/register/recruiter'
							className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-['outfit'] font-light"
						>
							Register as Recruiter
							<HugeiconsIcon
								icon={ArrowRight01Icon}
								size={16}
							/>
						</Link>
					</div>
				</form>
			</div>
		</AuthContainer>
	);
}
