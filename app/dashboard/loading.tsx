import { Loading03Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

export default function DashboardLoading() {
	return (
		<div className='flex items-center justify-center h-full'>
			<HugeiconsIcon
				icon={Loading03Icon}
				className='size-8 text-ocean-wave animate-spin'
			/>
		</div>
	);
}
