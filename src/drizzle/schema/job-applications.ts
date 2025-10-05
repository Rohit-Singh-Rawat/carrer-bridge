import { pgTable, text, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { user } from './auth';
import { jobs } from './jobs';

export const jobApplications = pgTable('job_applications', {
	id: uuid('id').defaultRandom().primaryKey(),
	uuid: uuid('uuid').defaultRandom().notNull().unique(),
	jobId: uuid('job_id')
		.references(() => jobs.id)
		.notNull(),
	userId: uuid('user_id')
		.references(() => user.id)
		.notNull(),
	preferredLanguage: text('preferred_language').notNull(),
	status: text('status', { enum: ['pending', 'reviewed', 'accepted', 'rejected'] })
		.default('pending')
		.notNull(),

	// Complex nested structures as JSONB
	monitoringImages: jsonb('monitoring_images').$type<{
		camera: Array<{
			s3Key: string;
			timestamp: Date;
			type?: 'image' | 'video';
			duration?: number;
		}>;
		screen: Array<{
			s3Key: string;
			timestamp: Date;
			type?: 'image' | 'video';
			duration?: number;
		}>;
	}>(),

	interviewConversation: jsonb('interview_conversation').$type<
		Array<{
			messageId: string;
			type: 'ai' | 'user';
			content: string;
			timestamp: Date;
			phase?: string;
			questionIndex?: number;
		}>
	>(),

	candidate: jsonb('candidate')
		.$type<{
			email: string;
			name: string;
		}>()
		.notNull(),

	jobDetails: jsonb('job_details')
		.$type<{
			title: string;
			description: string;
			skills: string[];
			benefits?: string;
			requirements?: string;
		}>()
		.notNull(),

	sessionInstruction: jsonb('session_instruction')
		.$type<{
			screenMonitoring: boolean;
			screenMonitoringMode: 'photo' | 'video';
			screenMonitoringInterval?: 30 | 60;
			cameraMonitoring: boolean;
			cameraMonitoringMode: 'photo' | 'video';
			cameraMonitoringInterval?: 30 | 60;
			duration: number;
		}>()
		.notNull(),

	instructionsForAi: jsonb('instructions_for_ai')
		.$type<{
			instruction: string;
			difficultyLevel: 'easy' | 'normal' | 'hard' | 'expert' | 'advanced';
			questionMode: 'manual' | 'ai-mode';
			totalQuestions: number;
			categoryConfigs: Array<{
				type: string;
				numberOfQuestions: number;
			}>;
			questions?: Array<{
				id: string;
				type: string;
				question: string;
				isAIGenerated?: boolean;
			}>;
		}>()
		.notNull(),

	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const jobApplicationsRelations = relations(jobApplications, ({ one }) => ({
	job: one(jobs, {
		fields: [jobApplications.jobId],
		references: [jobs.id],
	}),
	user: one(user, {
		fields: [jobApplications.userId],
		references: [user.id],
	}),
}));

export type JobApplication = typeof jobApplications.$inferSelect;
export type NewJobApplication = typeof jobApplications.$inferInsert;
