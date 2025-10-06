'use client';

import { JobSearchIcon, File01Icon, SentIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar';

interface DashboardSidebarContentProps {
	userRole: 'user' | 'recruiter';
}

const menuItems = {
	user: [
		{
			href: '/dashboard/jobs',
			icon: JobSearchIcon,
			label: 'Jobs',
		},
		{
			href: '/dashboard/resumes',
			icon: File01Icon,
			label: 'Resumes',
		},
		{
			href: '/dashboard/applications',
			icon: SentIcon,
			label: 'My Applications',
		},
	],
	recruiter: [
		{
			href: '/dashboard/jobs',
			icon: JobSearchIcon,
			label: 'Jobs',
		},
	],
};

export function DashboardSidebarContent({ userRole }: DashboardSidebarContentProps) {
	const pathname = usePathname();

	return (
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					{menuItems[userRole].map((item) => (
						<SidebarMenuItem key={item.href}>
							<SidebarMenuButton
								asChild
								isActive={
									item.href === '/dashboard/jobs'
										? pathname === item.href
										: item.href === '/dashboard/applications'
										? pathname.startsWith('/dashboard/applications')
										: pathname.startsWith(item.href)
								}
								className='text-primary-foreground data-[active=true]:text-black hover:bg-primary-foreground/10 data-[active=true]:bg-ocean-mist/90 data-[active=true]:font-medium'
							>
								<Link href={item.href}>
									<HugeiconsIcon
										color='currentColor'
										icon={item.icon}
										className='size-4'
									/>
									<span>{item.label}</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	);
}
