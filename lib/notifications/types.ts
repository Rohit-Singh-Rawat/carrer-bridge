import type { Notification } from '@/db/schema';

export type NotificationType =
	| 'application_submitted'
	| 'application_status_changed'
	| 'interview_scheduled'
	| 'interview_status_changed'
	| 'interview_completed';

export interface NotificationData {
	applicationId?: string;
	jobId?: string;
	jobTitle?: string;
	interviewId?: string;
	oldStatus?: string;
	newStatus?: string;
	companyName?: string;
	applicantName?: string;
	scheduledAt?: string;
}

export interface NotificationPayload {
	userId: string;
	type: NotificationType;
	title: string;
	message: string;
	data?: NotificationData;
}

export type NotificationWithData = Notification & {
	parsedData?: NotificationData;
};

