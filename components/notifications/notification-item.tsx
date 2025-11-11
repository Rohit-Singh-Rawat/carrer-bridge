'use client';

import { formatTimeAgo, getNotificationIcon } from '@/lib/notifications/utils';
import type { NotificationWithData } from '@/lib/notifications/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface NotificationItemProps {
	notification: NotificationWithData;
	onMarkAsRead: (id: string) => void;
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
	const isUnread = notification.read === 0;
	const icon = getNotificationIcon(notification.type);
	const timeAgo = formatTimeAgo(new Date(notification.createdAt));

	function getNotificationLink(): string | null {
		const data = notification.parsedData;
		if (!data) return null;

		switch (notification.type) {
			case 'application_submitted':
				return data.applicationId ? `/dashboard/jobs/${data.jobId}/applications` : null;
			case 'application_status_changed':
				return data.applicationId ? `/dashboard/applications/${data.applicationId}` : null;
			case 'interview_scheduled':
			case 'interview_status_changed':
			case 'interview_completed':
				return data.applicationId ? `/dashboard/applications/${data.applicationId}` : null;
			default:
				return null;
		}
	}

	const link = getNotificationLink();

	function handleClick() {
		if (isUnread) {
			onMarkAsRead(notification.id);
		}
	}

	const content = (
		<div
			className={cn(
				'flex gap-3 p-3 transition-colors cursor-pointer hover:bg-muted/50',
				isUnread && 'bg-ocean-mist/10'
			)}
			onClick={handleClick}
		>
			<div className="flex-shrink-0 text-xl mt-0.5">{icon}</div>
			<div className="flex-1 min-w-0 space-y-1">
				<div className="flex items-start justify-between gap-2">
					<p className="text-sm font-medium line-clamp-1">{notification.title}</p>
					{isUnread && (
						<div className="flex-shrink-0 size-2 rounded-full bg-primary mt-1.5" />
					)}
				</div>
				<p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
				<p className="text-xs text-muted-foreground">{timeAgo}</p>
			</div>
		</div>
	);

	if (link) {
		return (
			<Link
				href={link}
				className="block"
			>
				{content}
			</Link>
		);
	}

	return content;
}

