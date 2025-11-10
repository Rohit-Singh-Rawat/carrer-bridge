import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { eq, and, desc } from 'drizzle-orm';
import { router, protectedProcedure } from '../trpc';
import { db } from '@/db';
import {
	applications,
	interviews,
	interviewMessages,
	monitoringImages,
	type Interview,
	type InterviewMessage,
	type MonitoringImage,
} from '@/db/schema';

export const interviewRouter = router({
	getByApplicationId: protectedProcedure
		.input(z.object({ applicationId: z.string() }))
		.query(async ({ input, ctx }) => {
			const interview = await db.query.interviews.findFirst({
				where: eq(interviews.applicationId, input.applicationId),
				with: {
					messages: {
						orderBy: [desc(interviewMessages.timestamp)],
					},
					monitoringImages: {
						orderBy: [desc(monitoringImages.capturedAt)],
					},
					application: {
						with: {
							job: true,
							user: true,
							resume: true,
						},
					},
				},
			});

			if (!interview) {
				return null;
			}

			const isOwner = interview.application.userId === ctx.user.userId;
			const isRecruiter =
				ctx.user.role === 'recruiter' &&
				interview.application.job.recruiterId === ctx.user.userId;

			if (!isOwner && !isRecruiter) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have access to this interview',
				});
			}

			return interview;
		}),

	checkEligibility: protectedProcedure
		.input(z.object({ applicationId: z.string() }))
		.query(async ({ input, ctx }) => {
			const application = await db.query.applications.findFirst({
				where: eq(applications.id, input.applicationId),
				with: {
					job: true,
				},
			});

			if (!application) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Application not found',
				});
			}

			if (application.userId !== ctx.user.userId) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have access to this application',
				});
			}

			return {
				eligible: application.interviewEligible === 1 && application.status === 'reviewed',
				status: application.status,
			};
		}),

	getMessages: protectedProcedure
		.input(z.object({ interviewId: z.string() }))
		.query(async ({ input, ctx }) => {
			const interview = await db.query.interviews.findFirst({
				where: eq(interviews.id, input.interviewId),
				with: {
					application: {
						with: {
							job: true,
						},
					},
				},
			});

			if (!interview) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Interview not found',
				});
			}

			const isOwner = interview.application.userId === ctx.user.userId;
			const isRecruiter =
				ctx.user.role === 'recruiter' &&
				interview.application.job.recruiterId === ctx.user.userId;

			if (!isOwner && !isRecruiter) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have access to this interview',
				});
			}

			const messages = await db.query.interviewMessages.findMany({
				where: eq(interviewMessages.interviewId, input.interviewId),
				orderBy: [interviewMessages.timestamp],
			});

			return messages;
		}),

	getMonitoringImages: protectedProcedure
		.input(z.object({ interviewId: z.string() }))
		.query(async ({ input, ctx }) => {
			const interview = await db.query.interviews.findFirst({
				where: eq(interviews.id, input.interviewId),
				with: {
					application: {
						with: {
							job: true,
						},
					},
				},
			});

			if (!interview) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Interview not found',
				});
			}

			const isRecruiter =
				ctx.user.role === 'recruiter' &&
				interview.application.job.recruiterId === ctx.user.userId;

			if (!isRecruiter) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'Only recruiters can access monitoring images',
				});
			}

			const images = await db.query.monitoringImages.findMany({
				where: eq(monitoringImages.interviewId, input.interviewId),
				orderBy: [monitoringImages.capturedAt],
			});

			return images;
		}),

	start: protectedProcedure
		.input(z.object({ applicationId: z.string() }))
		.mutation(async ({ input, ctx }) => {
			const application = await db.query.applications.findFirst({
				where: eq(applications.id, input.applicationId),
				with: {
					job: true,
					resume: true,
				},
			});

			if (!application) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Application not found',
				});
			}

			if (application.userId !== ctx.user.userId) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have access to this application',
				});
			}

			if (application.interviewEligible !== 1) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You are not eligible for this interview',
				});
			}

			const existingInterview = await db.query.interviews.findFirst({
				where: eq(interviews.applicationId, input.applicationId),
			});

			if (existingInterview) {
				throw new TRPCError({
					code: 'CONFLICT',
					message: 'Interview already exists for this application',
				});
			}

			const [interview] = await db
				.insert(interviews)
				.values({
					applicationId: input.applicationId,
					status: 'in_progress',
					startedAt: new Date(),
					interviewSettings: JSON.stringify({
						difficulty: 'medium',
						totalQuestions: 5,
						mcqMinCount: 1,
						maxDuration: 300,
					}),
				})
				.returning();

			const introMessage = await db
				.insert(interviewMessages)
				.values({
					interviewId: interview.id,
					role: 'assistant',
					content: `Hello! Welcome to your interview for the position of ${application.job.title}. I'm excited to learn about your experience and qualifications. This interview will consist of 5 questions and should take around 5 minutes. Let's begin. Could you please introduce yourself and tell me a bit about your background?`,
					messageType: 'text',
					phase: 'introduction',
					questionIndex: 0,
				})
				.returning();

			return {
				interviewId: interview.id,
				introMessage: introMessage[0],
			};
		}),

	end: protectedProcedure
		.input(z.object({ interviewId: z.string() }))
		.mutation(async ({ input, ctx }) => {
			const interview = await db.query.interviews.findFirst({
				where: eq(interviews.id, input.interviewId),
				with: {
					application: true,
					messages: true,
				},
			});

			if (!interview) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Interview not found',
				});
			}

			if (interview.application.userId !== ctx.user.userId) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have access to this interview',
				});
			}

			const completedAt = new Date();
			const duration = interview.startedAt
				? Math.floor((completedAt.getTime() - interview.startedAt.getTime()) / 1000)
				: 0;

			await db
				.update(interviews)
				.set({
					status: 'completed',
					completedAt,
					duration,
				})
				.where(eq(interviews.id, input.interviewId));

			await db
				.update(applications)
				.set({
					status: 'in_progress',
				})
				.where(eq(applications.id, interview.applicationId));

			return {
				duration,
				questionsAnswered: interview.messages.filter((m) => m.role === 'user').length,
				mcqCount: interview.messages.filter((m) => m.messageType === 'mcq').length,
			};
		}),

	saveMessage: protectedProcedure
		.input(
			z.object({
				interviewId: z.string(),
				role: z.enum(['user', 'assistant']),
				content: z.string(),
				messageType: z.enum(['text', 'mcq']),
				mcqOptions: z
					.array(
						z.object({
							id: z.string(),
							text: z.string(),
						})
					)
					.optional(),
				mcqAnswer: z.string().optional(),
				phase: z.enum(['introduction', 'questions', 'closing']).optional(),
				questionIndex: z.number().optional(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const interview = await db.query.interviews.findFirst({
				where: eq(interviews.id, input.interviewId),
				with: {
					application: true,
				},
			});

			if (!interview) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Interview not found',
				});
			}

			if (interview.application.userId !== ctx.user.userId) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have access to this interview',
				});
			}

			const [message] = await db
				.insert(interviewMessages)
				.values({
					interviewId: input.interviewId,
					role: input.role,
					content: input.content,
					messageType: input.messageType,
					mcqOptions: input.mcqOptions ? JSON.stringify(input.mcqOptions) : null,
					mcqAnswer: input.mcqAnswer,
					phase: input.phase,
					questionIndex: input.questionIndex,
				})
				.returning();

			return message;
		}),

	uploadSnapshot: protectedProcedure
		.input(
			z.object({
				interviewId: z.string(),
				imageData: z.string(),
				timestamp: z.number(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const interview = await db.query.interviews.findFirst({
				where: eq(interviews.id, input.interviewId),
				with: {
					application: true,
				},
			});

			if (!interview) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Interview not found',
				});
			}

			if (interview.application.userId !== ctx.user.userId) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have access to this interview',
				});
			}

			const { PutObjectCommand, S3Client } = await import('@aws-sdk/client-s3');
			const { env } = await import('@/env');

			const s3Client = new S3Client({
				region: 'auto',
				endpoint: env.R2_ACCESS_ENDPOINT,
				credentials: {
					accessKeyId: env.R2_ACCESS_KEYID,
					secretAccessKey: env.R2_SECRET_ACCEESS_KEY,
				},
			});

			const base64Data = input.imageData.replace(/^data:image\/\w+;base64,/, '');
			const buffer = Buffer.from(base64Data, 'base64');

			const s3Key = `interviews/${input.interviewId}/snapshots/${input.timestamp}.jpg`;

			await s3Client.send(
				new PutObjectCommand({
					Bucket: env.R2_BUCKET_NAME,
					Key: s3Key,
					Body: buffer,
					ContentType: 'image/jpeg',
				})
			);

			const [image] = await db
				.insert(monitoringImages)
				.values({
					interviewId: input.interviewId,
					s3Key,
					capturedAt: new Date(input.timestamp),
				})
				.returning();

			return image;
		}),

	generateAIResponse: protectedProcedure
		.input(
			z.object({
				interviewId: z.string(),
				userMessage: z.string(),
			})
		)
		.mutation(async ({ input, ctx }) => {
			const interview = await db.query.interviews.findFirst({
				where: eq(interviews.id, input.interviewId),
				with: {
					application: {
						with: {
							job: true,
							resume: true,
						},
					},
					messages: {
						orderBy: [interviewMessages.timestamp],
					},
				},
			});

			if (!interview) {
				throw new TRPCError({
					code: 'NOT_FOUND',
					message: 'Interview not found',
				});
			}

			if (interview.application.userId !== ctx.user.userId) {
				throw new TRPCError({
					code: 'FORBIDDEN',
					message: 'You do not have access to this interview',
				});
			}

			const { generateAIResponse: generateResponse } = await import('@/lib/ai/gemini');

			const conversationHistory = interview.messages.map((m) => ({
				role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
				content: m.content,
			}));

			const mcqCount = interview.messages.filter((m) => m.messageType === 'mcq').length;
			const currentQuestionIndex = interview.messages.filter((m) => m.role === 'assistant')
				.length;

			const response = await generateResponse({
				job: interview.application.job,
				resume: interview.application.resume,
				conversationHistory,
				userMessage: input.userMessage,
				currentQuestionIndex,
				mcqCount,
			});

			return response;
		}),
});

