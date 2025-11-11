'use client';

import { useEffect, useState, useCallback } from 'react';
import { DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { getNotifications, markAsRead, markAllAsRead } from '@/actions/notifications';
import type { NotificationWithData } from '@/lib/notifications/types';
import { NotificationItem } from './notification-item';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface NotificationDropdownProps {
	onNotificationRead: () => void;
	onMarkAllRead: () => void;
	onNewNotification: () => void;
	isOpen: boolean;
}

export function NotificationDropdown({
	onNotificationRead,
	onMarkAllRead,
	onNewNotification,
	isOpen,
}: NotificationDropdownProps) {
	const [notifications, setNotifications] = useState<NotificationWithData[]>([]);
	const [loading, setLoading] = useState(true);

	const connectToStream = useCallback(() => {
		const eventSource = new EventSource('/api/notifications/stream', {
			withCredentials: true,
		});

		eventSource.addEventListener('message', (event) => {
			try {
				const notification = JSON.parse(event.data) as NotificationWithData;
				setNotifications((prev) => [notification, ...prev]);
				onNewNotification();
			} catch (error) {
				console.error('Failed to parse notification:', error);
			}
		});

		eventSource.addEventListener('error', (err) => {
			console.error('SSE error:', err);
			eventSource.close();
			setTimeout(connectToStream, 1000);
		});

		return eventSource;
	}, [onNewNotification]);

	useEffect(() => {
		async function fetchNotifications() {
			setLoading(true);
			const result = await getNotifications(10);
			if (result.success && result.notifications) {
				setNotifications(result.notifications as NotificationWithData[]);
			}
			setLoading(false);
		}

		fetchNotifications();
		const eventSource = connectToStream();

		return () => {
			eventSource.close();
		};
	}, [connectToStream]);

	async function handleMarkAsRead(notificationId: string) {
		const result = await markAsRead(notificationId);
		if (result.success) {
			setNotifications((prev) =>
				prev.map((n) => (n.id === notificationId ? { ...n, read: 1 } : n))
			);
			onNotificationRead();
		}
	}

	async function handleMarkAllAsRead() {
		const result = await markAllAsRead();
		if (result.success) {
			setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
			onMarkAllRead();
		}
	}

	const hasUnread = notifications.some((n) => n.read === 0);

	return (
		<DropdownMenuContent
			align='start'
			side='top'
			className='w-[380px] max-w-[calc(100vw-2rem)] p-0'
			sideOffset={18}
		>
			<div className='flex items-center justify-between px-4 py-3 border-b'>
				<h3 className='font-semibold text-sm'>Notifications</h3>
				{hasUnread && (
					<Button
						variant='ghost'
						size='sm'
						onClick={handleMarkAllAsRead}
						className='h-auto p-0 text-xs text-muted-foreground hover:text-foreground'
					>
						Mark all as read
					</Button>
				)}
			</div>

			<div className='max-h-[400px] overflow-y-auto'>
				{loading ? (
					<div className='space-y-2 p-3'>
						{Array.from({ length: 3 }).map((_, i) => (
							<div
								key={i}
								className='space-y-2 p-3'
							>
								<Skeleton className='h-4 w-3/4' />
								<Skeleton className='h-3 w-full' />
								<Skeleton className='h-3 w-1/2' />
							</div>
						))}
					</div>
				) : notifications.length === 0 ? (
					<div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
						<div className='text-4xl mb-2'>🔔</div>
						<p className='text-sm font-medium text-muted-foreground'>No notifications yet</p>
						<p className='text-xs text-muted-foreground mt-1'>
							We'll notify you when something important happens
						</p>
					</div>
				) : (
					<div className='divide-y'>
						{notifications.map((notification) => (
							<NotificationItem
								key={notification.id}
								notification={notification}
								onMarkAsRead={handleMarkAsRead}
							/>
						))}
					</div>
				)}
			</div>
		</DropdownMenuContent>
	);
}
