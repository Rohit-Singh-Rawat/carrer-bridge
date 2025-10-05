import { OrganizationInvite } from './templates/OrganizationInvite';
import { env } from '@/env';
import resend from '.';
import { rateLimit } from '../redis/ratelimit';

export async function sendOrganizationInvitation({
	email,
	invitedByUsername,
	invitedByEmail,
	teamName,
	inviteLink,
}: {
	email: string;
	invitedByUsername: string;
	invitedByEmail: string;
	teamName: string;
	inviteLink: string;
}) {
	try {
		await rateLimit({ actionType: 'emailToken', identifier: email });
		const { data, error } = await resend.emails.send({
			from: env.RESEND_FROM_EMAIL,
			to: [email],
			subject: `You've been invited to join ${teamName}`,
			react: OrganizationInvite({
				inviteLink,
				invitedByUsername,
				invitedByEmail,
				teamName,
				email,
			}),
		});

		if (error) {
			console.error('Failed to send organization invitation email:', error);
			throw new Error('Failed to send organization invitation email');
		}

		return data;
	} catch (error) {
		console.error('Error sending organization invitation email:', error);
		throw error;
	}
}
