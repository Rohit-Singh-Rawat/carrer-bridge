import { headers } from "next/headers";
import { auth } from "./auth";

export async function validateSession() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session) {
		throw new Error('Unauthorized');
	}
	return session;
}

