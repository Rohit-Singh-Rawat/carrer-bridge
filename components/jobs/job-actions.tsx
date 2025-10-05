'use client';

import { ArtificialIntelligence07Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function JobActions() {
	const handleAIInterview = () => {
		toast.success('AI Interview', {
			description: 'AI-powered interviews coming soon! Stay tuned for this exciting feature.',
		});
	};

	return (
		<div className='flex gap-3 pt-2'>
			<Button
				size='default'
				className="gap-2 font-['outfit']"
			>
				Apply Now
			</Button>
			<Button
				size='default'
				variant='secondary'
				className="gap-2 font-['outfit']"
				onClick={handleAIInterview}
			>
				<HugeiconsIcon
					icon={ArtificialIntelligence07Icon}
					className='size-4'
				/>
				AI Interview
			</Button>
		</div>
	);
}
