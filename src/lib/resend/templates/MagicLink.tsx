import { env } from '@/env';
import React from 'react';

interface MagicLinkProps {
	url: string;
	email: string;
	name?: string;
}

export const MagicLink = ({ url, email, name }: MagicLinkProps) => {
	return (
		<div
			style={{
				fontFamily: 'Arial, sans-serif',
				maxWidth: '600px',
				margin: '0 auto',
				boxSizing: 'border-box',
			}}
		>
			<div
				style={{
					backgroundColor: '#ffffff',
					padding: '40px',
					textAlign: 'center',
					border: '1px solid #000000',
					boxSizing: 'border-box',
				}}
			>
				<img
					src={`${env.SITE_URL}/icon1.png`}
					alt='Logo'
					style={{
						width: '120px',
						height: 'auto',
						marginBottom: '30px',
						display: 'block',
						margin: '0 auto 30px auto',
					}}
				/>
				<h1
					style={{
						color: '#000000',
						fontSize: '28px',
						fontWeight: 'bold',
						marginBottom: '20px',
						margin: '0 0 20px 0',
					}}
				>
					Sign In to Your Account
				</h1>
				<p
					style={{
						color: '#000000',
						fontSize: '16px',
						marginBottom: '32px',
						lineHeight: '1.5',
						margin: '0 0 32px 0',
					}}
				>
					Hi {name || 'there'}, click the button below to sign in to your account.
				</p>
				<a
					href={url}
					style={{
						backgroundColor: '#000000',
						color: 'white',
						padding: '12px 32px',
						textDecoration: 'none',
						display: 'inline-block',
						fontSize: '16px',
						fontWeight: '600',
						transition: 'background-color 0.2s',
					}}
				>
					Sign In
				</a>
				<p
					style={{
						color: '#000000',
						fontSize: '14px',
						marginTop: '32px',
						margin: '32px 0 0 0',
					}}
				>
					If you didn't request this email, you can safely ignore it. This link will expire in 15
					minutes.
				</p>
			</div>
		</div>
	);
};
