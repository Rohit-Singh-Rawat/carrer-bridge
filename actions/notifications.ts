'use server';

import { db } from '@/db';
import { notifications } from '@/db/schema';
import { requireAuth } from './auth';
import { eq, desc, and } from 'drizzle-orm';
import type { NotificationPayload } from '@/lib/notifications/types';
import { publishNotification } from '@/lib/notifications/redis';
import { formatNotificationMessage } from '@/lib/notifications/utils';

export async function createNotification(payload: NotificationPayload) {
	try {
		const { title, message } = payload.title && payload.message 
			? { title: payload.title, message: payload.message }
			: formatNotificationMessage(payload.type, payload.data || {});

		const [notification] = await db
			.insert(notifications)
			.values({
				userId: payload.userId,
				type: payload.type,
				title,
				message,
				data: payload.data ? JSON.stringify(payload.data) : null,
			})
			.returning();

		if (notification) {
			await publishNotification(payload.userId, {
				...notification,
				parsedData: payload.data,
			});
		}

		return { success: true, notification };
	} catch (error) {
		console.error('Error creating notification:', error);
		return { success: false, error: 'Failed to create notification' };
	}
}

export async function getNotifications(limit = 10) {
	const user = await requireAuth();

	try {
		const userNotifications = await db
			.select()
			.from(notifications)
			.where(eq(notifications.userId, user.id))
			.orderBy(desc(notifications.createdAt))
			.limit(limit);

		return {
			success: true,
			notifications: userNotifications.map((n) => ({
				...n,
				parsedData: n.data ? JSON.parse(n.data) : null,
			})),
		};
	} catch (error) {
		console.error('Error fetching notifications:', error);
		return { success: false, error: 'Failed to fetch notifications' };
	}
}

export async function getUnreadCount() {
	const user = await requireAuth();

	try {
		const unread = await db
			.select()
			.from(notifications)
			.where(and(eq(notifications.userId, user.id), eq(notifications.read, 0)));

		return { success: true, count: unread.length };
	} catch (error) {
		console.error('Error fetching unread count:', error);
		return { success: false, count: 0 };
	}
}

export async function markAsRead(notificationId: string) {
	const user = await requireAuth();

	try {
		await db
			.update(notifications)
			.set({ read: 1 })
			.where(and(eq(notifications.id, notificationId), eq(notifications.userId, user.id)));

		return { success: true };
	} catch (error) {
		console.error('Error marking notification as read:', error);
		return { success: false, error: 'Failed to mark as read' };
	}
}

export async function markAllAsRead() {
	const user = await requireAuth();

	try {
		await db
			.update(notifications)
			.set({ read: 1 })
			.where(and(eq(notifications.userId, user.id), eq(notifications.read, 0)));

		return { success: true };
	} catch (error) {
		console.error('Error marking all as read:', error);
		return { success: false, error: 'Failed to mark all as read' };
	}
}

export async function deleteNotification(notificationId: string) {
	const user = await requireAuth();

	try {
		await db
			.delete(notifications)
			.where(and(eq(notifications.id, notificationId), eq(notifications.userId, user.id)));

		return { success: true };
	} catch (error) {
		console.error('Error deleting notification:', error);
		return { success: false, error: 'Failed to delete notification' };
	}
}

