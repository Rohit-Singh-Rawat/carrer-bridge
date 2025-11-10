import { initTRPC, TRPCError } from '@trpc/server';
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import superjson from 'superjson';
import { getCurrentUserFromToken } from '@/lib/auth/jwt';

export const createTRPCContext = async (opts: FetchCreateContextFnOptions) => {
	const user = await getCurrentUserFromToken();

	return {
		user,
		headers: opts.req.headers,
	};
};

const t = initTRPC.context<typeof createTRPCContext>().create({
	transformer: superjson,
	errorFormatter({ shape }) {
		return shape;
	},
});

export const createCallerFactory = t.createCallerFactory;

export const router = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
	if (!ctx.user) {
		throw new TRPCError({ code: 'UNAUTHORIZED' });
	}
	return next({
		ctx: {
			user: ctx.user,
		},
	});
});

