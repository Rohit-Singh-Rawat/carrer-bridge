import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth';

export const jobs = pgTable('jobs', {
	id: uuid('id').defaultRandom().primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	organizationId: uuid('organization_id').notNull(),
	organizationName: text('organization_name'),
	industry: text('industry').notNull(),
	expiryDate: timestamp('expiry_date').notNull(),
	location: text('location').notNull(),
	salary: text('salary'),
	currency: text('currency'),
	skills: text('skills').array().notNull(),
	requirements: text('requirements'),
	benefits: text('benefits'),
	recruiterId: uuid('recruiter_id')
		.references(() => user.id)
		.notNull(),
	status: text('status', { enum: ['draft', 'published', 'expired', 'deleted'] })
		.default('draft')
		.notNull(),
	jobType: text('job_type', { enum: ['regular', 'mock'] })
		.default('regular')
		.notNull(),

	// JSON columns for complex nested data
	interviewConfig: jsonb('interview_config')
		.$type<{
			duration: number;
			instructions?: string;
			difficultyLevel: 'easy' | 'normal' | 'hard' | 'expert' | 'advanced';
			screenMonitoring: boolean;
			screenMonitoringMode: 'photo' | 'video';
			screenMonitoringInterval?: 30 | 60;
			cameraMonitoring: boolean;
			cameraMonitoringMode: 'photo' | 'video';
			cameraMonitoringInterval?: 30 | 60;
		}>()
		.notNull(),

	questionsConfig: jsonb('questions_config')
		.$type<{
			mode: 'manual' | 'ai-mode';
			totalQuestions: number;
			categoryConfigs: Array<{
				type: string;
				numberOfQuestions: number;
			}>;
			questionTypes: string[];
			questions?: Array<{
				id: string;
				type: string;
				question: string;
				isAIGenerated?: boolean;
			}>;
		}>()
		.notNull(),

	deletedAt: timestamp('deleted_at'),
	deletedBy: text('deleted_by'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const jobsRelations = relations(jobs, ({ one, many }) => ({
	recruiter: one(user, {
		fields: [jobs.recruiterId],
		references: [user.id],
	}),
}));

export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
