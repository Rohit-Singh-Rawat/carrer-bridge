import { MagicLink } from './templates/MagicLink';
import { env } from '@/env';
import resend from '.';
import { rateLimit } from '../redis/ratelimit';

export async function sendMagicLinkEmail(
	email: string,
	url: string,
	user: { email: string; name?: string }
) {
	try {
		await rateLimit({ actionType: 'emailToken', identifier: email });
		const { data, error } = await resend.emails.send({
			from: env.RESEND_FROM_EMAIL,
			to: [email],
			subject: 'Sign in to your account',
			react: MagicLink({ url, email: user.email, name: user.name }),
		});

		if (error) {
			console.error('Failed to send magic link email:', error);
			throw new Error('Failed to send magic link email');
		}

		return data;
	} catch (error) {
		console.error('Error sending magic link email:', error);
		throw error;
	}
}
