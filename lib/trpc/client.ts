import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import superjson from 'superjson';
import type { AppRouter } from '@/server/routers/_app';

export const trpc = createTRPCReact<AppRouter>();

export const getTRPCClient = () => {
	return createTRPCClient<AppRouter>({
		links: [
			httpBatchLink({
				url: `${process.env.NEXT_PUBLIC_APP_URL}/api/trpc`,
				transformer: superjson,
			}),
		],
	});
};

