import { pgTable, varchar, boolean, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const roleEnum = pgEnum('role', ['user', 'admin', 'recruiter']);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
	'active',
	'inactive',
	'cancelled',
]);

// Tables
export const user = pgTable(
	'user',
	{
		id: varchar('id').primaryKey(),
		name: varchar('name').notNull(),
		email: varchar('email').notNull(),
		role: roleEnum('role').default('user').notNull(),
		banned: boolean('banned').default(false).notNull(),
		bannedReason: varchar('banned_reason'),
		banExpiresAt: timestamp('ban_expires_at'),
		emailVerified: boolean('email_verified').notNull(),
		image: varchar('image'),
		deleted: boolean('deleted').default(false).notNull(),
		deletedAt: timestamp('deleted_at'),
		createdAt: timestamp('created_at').notNull(),
		updatedAt: timestamp('updated_at').notNull(),
	},
	(table) => ({
		emailUnique: unique().on(table.email),
	})
);

export const session = pgTable(
	'session',
	{
		id: varchar('id').primaryKey(),
		expiresAt: timestamp('expires_at').notNull(),
		token: varchar('token').notNull(),
		createdAt: timestamp('created_at').notNull(),
		updatedAt: timestamp('updated_at').notNull(),
		ipAddress: varchar('ip_address'),
		impersonatedBy: varchar('impersonated_by'),
		userAgent: varchar('user_agent'),
		activeOrganizationId: varchar('active_organization_id'),
		userId: varchar('user_id')
			.notNull()
			.references(() => user.id),
	},
	(table) => ({
		tokenUnique: unique().on(table.token),
	})
);

export const account = pgTable('account', {
	id: varchar('id').primaryKey(),
	accountId: varchar('account_id').notNull(),
	providerId: varchar('provider_id').notNull(),
	userId: varchar('user_id')
		.notNull()
		.references(() => user.id),
	accessToken: varchar('access_token'),
	refreshToken: varchar('refresh_token'),
	idToken: varchar('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: varchar('scope'),
	password: varchar('password'),
	createdAt: timestamp('created_at').notNull(),
	updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable('verification', {
	id: varchar('id').primaryKey(),
	identifier: varchar('identifier').notNull(),
	value: varchar('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at'),
	updatedAt: timestamp('updated_at'),
});

export const subscriptions = pgTable('subscriptions', {
	id: varchar('id').primaryKey(),
	userId: varchar('user_id')
		.notNull()
		.unique()
		.references(() => user.id),
	status: subscriptionStatusEnum('status').notNull(),
	plan: varchar('plan').notNull(),
	stripeId: varchar('stripe_id'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').notNull(),
});

// Relations will be defined after importing jobs
// Temporarily export basic relations
export const userRelations = relations(user, ({ many, one }) => ({
	sessions: many(session),
	accounts: many(account),
	subscription: one(subscriptions),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
	user: one(user, {
		fields: [subscriptions.userId],
		references: [user.id],
	}),
}));
