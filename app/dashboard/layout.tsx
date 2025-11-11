import { Logout01Icon, UserCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { logout, requireAuth } from '@/actions/auth';
import Logo from '@/components/career-bridge/logo';
import { DashboardBreadcrumb } from '@/components/dashboard/dashboard-breadcrumb';
import { DashboardSidebarContent } from '@/components/dashboard/dashboard-sidebar-content';
import { NotificationBell } from '@/components/notifications/notification-bell';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarInset,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarProvider,
	SidebarTrigger,
} from '@/components/ui/sidebar';
import { cookies } from 'next/headers';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
	// Require authentication for all dashboard routes
	const user = await requireAuth();
	const cookieStore = await cookies();
	const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
	return (
		<SidebarProvider defaultOpen={defaultOpen}>
			<Sidebar
				variant='inset'
				collapsible='icon'
				className='bg-primary'
			>
				<SidebarHeader className='border-b border-primary-foreground/20'>
					<div className='flex items-center gap-2 py-2 '>
						<Logo
							size={32}
							iconOnly
							className='[&_path:first-child]:fill-primary-foreground [&_path:nth-child(2)]:fill-primary-foreground/70 [&_path:nth-child(3)]:fill-primary-foreground/50 group-data-[collapsible=icon]:children:hidden'
						/>
						<span className="text-xl font-['outfit'] group-data-[collapsible=icon]:hidden">
							/Career.bridge
						</span>
					</div>
				</SidebarHeader>
				<SidebarContent className='bg-primary'>
					<DashboardSidebarContent userRole={user.role} />
				</SidebarContent>
				<SidebarFooter className='border-t border-primary-foreground/20 bg-primary'>
					<SidebarMenu>
						<SidebarMenuItem>
							<NotificationBell />
						</SidebarMenuItem>
						<SidebarMenuItem>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<SidebarMenuButton className='text-primary-foreground hover:bg-primary-foreground/10 data-[state=open]:bg-primary-foreground/5'>
										<HugeiconsIcon
											icon={UserCircleIcon}
											className='size-4'
										/>
										<div className='flex flex-col items-start overflow-hidden group-data-[collapsible=icon]:hidden'>
											<span className='text-sm font-medium truncate w-full'>{user.fullName}</span>
										</div>
									</SidebarMenuButton>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									side='top'
									align='end'
									className='w-56'
								>
									<DropdownMenuLabel>
										<div className='flex flex-col space-y-1'>
											<p className='text-sm font-medium leading-none'>{user.fullName}</p>
											<p className='text-xs leading-none text-muted-foreground'>{user.email}</p>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<form action={logout}>
										<DropdownMenuItem asChild>
											<button
												type='submit'
												className='w-full cursor-pointer'
											>
												<HugeiconsIcon
													icon={Logout01Icon}
													className='mr-2 size-4'
												/>
												<span>Log out</span>
											</button>
										</DropdownMenuItem>
									</form>
								</DropdownMenuContent>
							</DropdownMenu>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarFooter>
			</Sidebar>
			<SidebarInset>
				<header className='flex h-16 shrink-0 items-center gap-2 border-b px-4'>
					<SidebarTrigger className='-ml-1' />
					<Separator
						orientation='vertical'
						className='mr-2 h-4'
					/>
					<DashboardBreadcrumb />
				</header>
				<div className='flex flex-1 flex-col gap-4 p-4'>{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
