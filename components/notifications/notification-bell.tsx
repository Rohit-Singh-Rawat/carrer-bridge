'use client';

import { SolarBellLineDuotone } from '@/components/icons/bell-icon';
import { NotificationDropdown } from './notification-dropdown';
import { useState, useEffect } from 'react';
import { getUnreadCount } from '@/actions/notifications';
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export function NotificationBell() {
	const [unreadCount, setUnreadCount] = useState(0);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		fetchUnreadCount();
	}, []);

	async function fetchUnreadCount() {
		const result = await getUnreadCount();
		if (result.success) {
			setUnreadCount(result.count);
		}
	}

	function handleOpenChange(open: boolean) {
		setIsOpen(open);
	}

	function handleNotificationRead() {
		setUnreadCount((prev) => Math.max(0, prev - 1));
	}

	function handleMarkAllRead() {
		setUnreadCount(0);
	}

	function handleNewNotification() {
		setUnreadCount((prev) => prev + 1);
	}

	return (
		<DropdownMenu
			open={isOpen}
			onOpenChange={handleOpenChange}
		>
			<DropdownMenuTrigger asChild>
				<button
					type='button'
					className='relative flex items-center gap-2 w-full rounded-md px-2 py-2 hover:bg-primary-foreground/10 transition-colors text-primary-foreground'
				>
					<div className='relative'>
						<SolarBellLineDuotone className='size-4' />
						{unreadCount > 0 && (
							<span className='absolute -top-1 -right-1 flex items-center justify-center min-w-[12px] h-[12px] px-0.5 text-[8px] font-bold text-black bg-ocean-mist rounded-full border border-primary-foreground'>
								{unreadCount > 9 ? '9+' : unreadCount}
							</span>
						)}
					</div>
					<span className='text-sm font-medium flex-1 text-left group-data-[collapsible=icon]:hidden'>
						Notifications
					</span>
				</button>
			</DropdownMenuTrigger>
			<NotificationDropdown
				onNotificationRead={handleNotificationRead}
				onMarkAllRead={handleMarkAllRead}
				onNewNotification={handleNewNotification}
				isOpen={isOpen}
			/>
		</DropdownMenu>
	);
}
