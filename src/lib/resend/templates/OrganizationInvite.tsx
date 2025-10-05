import { env } from '@/env';
import React from 'react';

interface OrganizationInviteProps {
	inviteLink: string;
	invitedByUsername: string;
	invitedByEmail: string;
	teamName: string;
	email: string;
}

export const OrganizationInvite = ({
	inviteLink,
	invitedByUsername,
	invitedByEmail,
	teamName,
	email,
}: OrganizationInviteProps) => {
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
					Join {teamName}
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
					{invitedByUsername} ({invitedByEmail}) has invited you to join {teamName}. Click the
					button below to accept the invitation.
				</p>
				<a
					href={inviteLink}
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
					Accept Invitation
				</a>
				<p
					style={{
						color: '#000000',
						fontSize: '14px',
						marginTop: '32px',
						margin: '32px 0 0 0',
					}}
				>
					If you didn't expect this invitation, you can safely ignore this email.
				</p>
			</div>
		</div>
	);
};
