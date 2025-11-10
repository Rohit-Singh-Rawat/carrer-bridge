import { relations } from 'drizzle-orm';
import { integer, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'recruiter']);
export const jobTypeEnum = pgEnum('job_type', ['full-time', 'part-time', 'contract', 'internship']);
export const experienceLevelEnum = pgEnum('experience_level', ['entry', 'mid', 'senior', 'lead']);
export const jobStatusEnum = pgEnum('job_status', ['active', 'closed', 'draft']);
export const applicationStatusEnum = pgEnum('application_status', [
	'pending',
	'reviewed',
	'in_progress',
	'accepted',
	'rejected',
]);
export const interviewStatusEnum = pgEnum('interview_status', [
	'scheduled',
	'in_progress',
	'completed',
	'cancelled',
]);
export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);
export const messageTypeEnum = pgEnum('message_type', ['text', 'mcq']);
export const interviewPhaseEnum = pgEnum('interview_phase', ['introduction', 'questions', 'closing']);

// Users table (for both regular users and recruiters)
export const users = pgTable('users', {
	id: uuid('id').defaultRandom().primaryKey(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	password: text('password').notNull(),
	fullName: varchar('full_name', { length: 255 }).notNull(),
	role: userRoleEnum('role').notNull().default('user'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Recruiter profiles (additional info for recruiters)
export const recruiterProfiles = pgTable('recruiter_profiles', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' })
		.unique(),
	companyName: varchar('company_name', { length: 255 }).notNull(),
	companyWebsite: varchar('company_website', { length: 255 }),
	companySize: varchar('company_size', { length: 50 }),
	industry: varchar('industry', { length: 100 }),
	location: varchar('location', { length: 255 }),
	bio: text('bio'),
	verified: integer('verified').default(0).notNull(), // 0 = not verified, 1 = verified
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Jobs table
export const jobs = pgTable('jobs', {
	id: uuid('id').defaultRandom().primaryKey(),
	recruiterId: uuid('recruiter_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	title: varchar('title', { length: 255 }).notNull(),
	description: text('description').notNull(),
	location: varchar('location', { length: 255 }).notNull(),
	jobType: jobTypeEnum('job_type').notNull(),
	experienceLevel: experienceLevelEnum('experience_level').notNull(),
	salaryMin: integer('salary_min'),
	salaryMax: integer('salary_max'),
	skills: text('skills'), // JSON array as text, or comma-separated
	requirements: text('requirements'),
	benefits: text('benefits'),
	status: jobStatusEnum('status').notNull().default('draft'),
	deadline: timestamp('deadline'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Applications table (for users applying to jobs)
export const applications = pgTable('applications', {
	id: uuid('id').defaultRandom().primaryKey(),
	jobId: uuid('job_id')
		.notNull()
		.references(() => jobs.id, { onDelete: 'cascade' }),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	resumeId: uuid('resume_id')
		.notNull()
		.references(() => resumes.id, { onDelete: 'cascade' }),
	status: applicationStatusEnum('status').notNull().default('pending'),
	appliedAt: timestamp('applied_at').defaultNow().notNull(),
	reviewedAt: timestamp('reviewed_at'),
	notes: text('notes'),
	interviewEligible: integer('interview_eligible').default(0).notNull(),
	interviewScheduledAt: timestamp('interview_scheduled_at'),
});

// Resumes table (for candidates to manage their resumes)
export const resumes = pgTable('resumes', {
	id: uuid('id').defaultRandom().primaryKey(),
	userId: uuid('user_id')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	slug: varchar('slug', { length: 255 }).notNull().unique(),
	title: varchar('title', { length: 255 }).notNull(),
	description: text('description'),
	fileUrl: text('file_url').notNull(),
	thumbnailUrl: text('thumbnail_url').notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Interviews table
export const interviews = pgTable('interviews', {
	id: uuid('id').defaultRandom().primaryKey(),
	applicationId: uuid('application_id')
		.notNull()
		.references(() => applications.id, { onDelete: 'cascade' })
		.unique(),
	status: interviewStatusEnum('status').notNull().default('scheduled'),
	startedAt: timestamp('started_at'),
	completedAt: timestamp('completed_at'),
	duration: integer('duration'),
	interviewSettings: text('interview_settings'),
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Interview messages table
export const interviewMessages = pgTable('interview_messages', {
	id: uuid('id').defaultRandom().primaryKey(),
	interviewId: uuid('interview_id')
		.notNull()
		.references(() => interviews.id, { onDelete: 'cascade' }),
	role: messageRoleEnum('role').notNull(),
	content: text('content').notNull(),
	messageType: messageTypeEnum('message_type').notNull().default('text'),
	mcqOptions: text('mcq_options'),
	mcqAnswer: varchar('mcq_answer', { length: 10 }),
	phase: interviewPhaseEnum('phase'),
	questionIndex: integer('question_index'),
	timestamp: timestamp('timestamp').defaultNow().notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Monitoring images table
export const monitoringImages = pgTable('monitoring_images', {
	id: uuid('id').defaultRandom().primaryKey(),
	interviewId: uuid('interview_id')
		.notNull()
		.references(() => interviews.id, { onDelete: 'cascade' }),
	s3Key: text('s3_key').notNull(),
	capturedAt: timestamp('captured_at').notNull(),
	uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
	createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
	recruiterProfile: one(recruiterProfiles, {
		fields: [users.id],
		references: [recruiterProfiles.userId],
	}),
	jobs: many(jobs),
	applications: many(applications),
	resumes: many(resumes),
}));

export const recruiterProfilesRelations = relations(recruiterProfiles, ({ one }) => ({
	user: one(users, {
		fields: [recruiterProfiles.userId],
		references: [users.id],
	}),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
	recruiter: one(users, {
		fields: [jobs.recruiterId],
		references: [users.id],
	}),
	applications: many(applications),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
	job: one(jobs, {
		fields: [applications.jobId],
		references: [jobs.id],
	}),
	user: one(users, {
		fields: [applications.userId],
		references: [users.id],
	}),
	resume: one(resumes, {
		fields: [applications.resumeId],
		references: [resumes.id],
	}),
	interview: one(interviews, {
		fields: [applications.id],
		references: [interviews.applicationId],
	}),
}));

export const resumesRelations = relations(resumes, ({ one }) => ({
	user: one(users, {
		fields: [resumes.userId],
		references: [users.id],
	}),
}));

export const interviewsRelations = relations(interviews, ({ one, many }) => ({
	application: one(applications, {
		fields: [interviews.applicationId],
		references: [applications.id],
	}),
	messages: many(interviewMessages),
	monitoringImages: many(monitoringImages),
}));

export const interviewMessagesRelations = relations(interviewMessages, ({ one }) => ({
	interview: one(interviews, {
		fields: [interviewMessages.interviewId],
		references: [interviews.id],
	}),
}));

export const monitoringImagesRelations = relations(monitoringImages, ({ one }) => ({
	interview: one(interviews, {
		fields: [monitoringImages.interviewId],
		references: [interviews.id],
	}),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type RecruiterProfile = typeof recruiterProfiles.$inferSelect;
export type NewRecruiterProfile = typeof recruiterProfiles.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type Resume = typeof resumes.$inferSelect;
export type NewResume = typeof resumes.$inferInsert;
export type Interview = typeof interviews.$inferSelect;
export type NewInterview = typeof interviews.$inferInsert;
export type InterviewMessage = typeof interviewMessages.$inferSelect;
export type NewInterviewMessage = typeof interviewMessages.$inferInsert;
export type MonitoringImage = typeof monitoringImages.$inferSelect;
export type NewMonitoringImage = typeof monitoringImages.$inferInsert;
