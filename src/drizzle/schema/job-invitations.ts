import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth';
import { jobs } from './jobs';

export const jobInvitations = pgTable('job_invitations', {
	id: uuid('id').defaultRandom().primaryKey(),
	jobId: uuid('job_id')
		.references(() => jobs.id)
		.notNull(),
	candidateId: uuid('candidate_id')
		.references(() => user.id)
		.notNull(),
	status: text('status', { enum: ['pending', 'accepted', 'declined'] })
		.default('pending')
		.notNull(),
	invitedBy: uuid('invited_by')
		.references(() => user.id)
		.notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const jobInvitationsRelations = relations(jobInvitations, ({ one }) => ({
	job: one(jobs, {
		fields: [jobInvitations.jobId],
		references: [jobs.id],
	}),
	candidate: one(user, {
		fields: [jobInvitations.candidateId],
		references: [user.id],
	}),
	inviter: one(user, {
		fields: [jobInvitations.invitedBy],
		references: [user.id],
	}),
}));

export type JobInvitation = typeof jobInvitations.$inferSelect;
export type NewJobInvitation = typeof jobInvitations.$inferInsert;
