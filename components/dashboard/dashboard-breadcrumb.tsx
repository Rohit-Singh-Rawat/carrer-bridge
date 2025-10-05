'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export function DashboardBreadcrumb() {
	const pathname = usePathname();
	const pathSegments = pathname.split('/').filter(Boolean);

	// Generate breadcrumb items based on path
	const breadcrumbItems = pathSegments.map((segment, index) => {
		const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
		const isLast = index === pathSegments.length - 1;
		const label = segment.charAt(0).toUpperCase() + segment.slice(1);

		return {
			href,
			label,
			isLast,
		};
	});

	return (
		<Breadcrumb>
			<BreadcrumbList className='font-light'>
				{breadcrumbItems.map((item, index) => (
					<React.Fragment key={item.href}>
						<BreadcrumbItem>
							{item.isLast ? (
								<BreadcrumbPage className='font-light'>{item.label}</BreadcrumbPage>
							) : (
								<BreadcrumbLink
									asChild
									className='font-light'
								>
									<Link href={item.href}>{item.label}</Link>
								</BreadcrumbLink>
							)}
						</BreadcrumbItem>
						{!item.isLast && <BreadcrumbSeparator />}
					</React.Fragment>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
