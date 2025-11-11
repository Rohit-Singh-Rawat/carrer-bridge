import type { NotificationData, NotificationType } from './types';

export function formatNotificationMessage(
	type: NotificationType,
	data: NotificationData
): { title: string; message: string } {
	switch (type) {
		case 'application_submitted':
			return {
				title: 'New Application',
				message: `${data.applicantName} applied for ${data.jobTitle}`,
			};
		case 'application_status_changed':
			return {
				title: 'Application Status Updated',
				message: `Your application for ${data.jobTitle} is now ${data.newStatus?.replace('_', ' ')}`,
			};
		case 'interview_scheduled':
			return {
				title: 'Interview Scheduled',
				message: `Your interview for ${data.jobTitle} has been scheduled`,
			};
		case 'interview_status_changed':
			return {
				title: 'Interview Status Updated',
				message: `Interview status changed to ${data.newStatus?.replace('_', ' ')}`,
			};
		case 'interview_completed':
			return {
				title: 'Interview Completed',
				message: `You completed the interview for ${data.jobTitle}`,
			};
		default:
			return {
				title: 'Notification',
				message: 'You have a new notification',
			};
	}
}

export function getNotificationIcon(type: NotificationType): string {
	switch (type) {
		case 'application_submitted':
			return '📝';
		case 'application_status_changed':
			return '🔄';
		case 'interview_scheduled':
			return '📅';
		case 'interview_status_changed':
			return '🔔';
		case 'interview_completed':
			return '✅';
		default:
			return '🔔';
	}
}

export function formatTimeAgo(date: Date): string {
	const now = new Date();
	const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (seconds < 60) return 'just now';
	if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
	if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
	if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
	return date.toLocaleDateString();
}

