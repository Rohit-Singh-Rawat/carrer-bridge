import { createAuthClient } from 'better-auth/react';
import {
	adminClient,
	inferAdditionalFields,
	lastLoginMethodClient,
	magicLinkClient,
	organizationClient,
} from 'better-auth/client/plugins';
import { auth } from './auth';
export const authClient = createAuthClient({
	plugins: [
		adminClient(),
		magicLinkClient(),
		organizationClient(),
		inferAdditionalFields<typeof auth>(),
		lastLoginMethodClient(),
	],
});
