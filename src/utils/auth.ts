import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import {
	admin,
	createAuthMiddleware,
	lastLoginMethod,
	magicLink,
	organization,
} from 'better-auth/plugins';

import { APIError } from 'better-auth/api';
import { sendMagicLinkEmail } from '@/lib/resend/sendMagicLink';
import { sendOrganizationInvitation } from '@/lib/resend/sendOrganizationInvite';

import { isValidEmailDomain } from '@/lib/utils';
import { database } from '@/server/db';

export const auth = betterAuth({
	database: drizzleAdapter(database, {
		provider: 'pg', // or "mysql", "postgresql", ...etc
	}),
	user: {
		additionalFields: {
			role: {
				type: ['user', 'admin', 'recruiter'],
				input: false,
			},
			deleted: {
				type: 'boolean',
				defaultValue: false,
				input: false,
			},
			deletedAt: {
				type: 'date',
				required: false,
			},
		},
	},
	socialProviders: {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
		github: {
			clientId: process.env.GITHUB_CLIENT_ID as string,
			clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
		},
	},
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			if (ctx.path === '/sign-in/magic-link') {
				const email = ctx.body.email;
				if (!isValidEmailDomain(email)) {
					throw new APIError('BAD_REQUEST', {
						code: 'INVALID_EMAIL_DOMAIN',
						message: 'Invalid domain.Please use a valid email domain',
					});
				}
			}

			return ctx;
		}),
	},
	plugins: [
		admin({
			defaultRole: 'user',
			adminRoles: ['admin'],
		}),
		magicLink({
			sendMagicLink: async ({ email, token, url }, request) => {
				await sendMagicLinkEmail(email, url, { email, name: email.split('@')[0] });
			},
		}),
		organization({
			allowUserToCreateOrganization: true,
			organizationLimit: 10,
			async sendInvitationEmail(data) {
				const inviteLink = `${process.env.SITE_URL}/accept-invitation/${data.id}`;
				await sendOrganizationInvitation({
					email: data.email,
					invitedByUsername: data.inviter.user.name,
					invitedByEmail: data.inviter.user.email,
					teamName: data.organization.name,
					inviteLink,
				});
			},
		}),
		lastLoginMethod(),
	],
	rateLimit: {
		enabled: true,
		window: 10,
		max: 50,
		customRules: {
			'/sign-in/magic-link': {
				window: 60 * 5,
				max: 3,
			},
			'/magic-link/verify': {
				window: 60,
				max: 5,
			},
		},
		storage: 'memory',
		modelName: 'rateLimit',
	},
});
