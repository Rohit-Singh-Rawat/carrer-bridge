'use client';

import { EditResumeDialog } from '@/components/resumes/edit-resume-dialog';
import { Button } from '@/components/ui/button';
import type { Resume } from '@/db/schema';
import { ArrowLeftIcon, DownloadIcon, Pencil } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ResumeViewClientProps {
	resume: Resume;
}

export function ResumeViewClient({ resume }: ResumeViewClientProps) {
	const router = useRouter();
	const [editDialogOpen, setEditDialogOpen] = useState(false);

	const handleEdit = () => {
		setEditDialogOpen(true);
	};

	const handleSuccess = () => {
		router.refresh();
	};

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-start justify-between gap-4'>
				<div className='flex-1 space-y-2'>
					<Link
						href='/dashboard/resumes'
						className='text-muted-foreground hover:text-foreground inline-flex items-center text-sm transition-colors'
					>
						<ArrowLeftIcon className='mr-2 h-4 w-4' />
						Back to Resumes
					</Link>
					<h1 className='text-3xl font-bold'>{resume.title}</h1>
					{resume.description && (
						<p className='text-muted-foreground text-lg'>{resume.description}</p>
					)}
					<p className='text-muted-foreground text-sm'>
						Last updated {new Date(resume.updatedAt).toLocaleDateString()}
					</p>
				</div>

				<div className='flex items-center gap-2'>
					<Button
						variant='outline'
						onClick={handleEdit}
					>
						<Pencil className='mr-2 h-4 w-4' />
						Edit
					</Button>
					<Button asChild>
						<a
							href={resume.fileUrl}
							download
							target='_blank'
							rel='noopener noreferrer'
						>
							<DownloadIcon className='mr-2 h-4 w-4' />
							Download
						</a>
					</Button>
				</div>
			</div>

			{/* PDF Viewer */}
			<div className='overflow-hidden rounded-xl border bg-muted'>
				<iframe
					src={`${resume.fileUrl}#view=FitH`}
					className='h-[800px] w-full'
					title={resume.title}
				/>
			</div>

			{/* Edit Dialog */}
			<EditResumeDialog
				open={editDialogOpen}
				onOpenChange={setEditDialogOpen}
				resume={resume}
				onSuccess={handleSuccess}
			/>
		</div>
	);
}
