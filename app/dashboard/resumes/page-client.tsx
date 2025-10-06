'use client';

import { EditResumeDialog } from '@/components/resumes/edit-resume-dialog';
import { ResumeCard } from '@/components/resumes/resume-card';
import { UploadResumeDialog } from '@/components/resumes/upload-resume-dialog';
import { Button } from '@/components/ui/button';
import type { Resume } from '@/db/schema';
import { FileTextIcon, PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ResumesPageClientProps {
	initialResumes: Resume[];
}

export function ResumesPageClient({ initialResumes }: ResumesPageClientProps) {
	const router = useRouter();
	const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
	const [editDialogOpen, setEditDialogOpen] = useState(false);
	const [selectedResume, setSelectedResume] = useState<Resume | null>(null);

	const handleEdit = (resume: Resume) => {
		setSelectedResume(resume);
		setEditDialogOpen(true);
	};

	const handleSuccess = () => {
		router.refresh();
	};

	const isEmpty = initialResumes.length === 0;

	return (
		<div className='space-y-6'>
			{/* Header */}
			<div className='flex items-center justify-between'>
				<div>
					<h1 className="text-3xl font-['outfit'] font-medium tracking-tight">My Resumes</h1>
					<p className='text-muted-foreground mt-1'>Manage and organize your resume collection</p>
				</div>
				{!isEmpty && (
					<Button onClick={() => setUploadDialogOpen(true)}>
						<PlusIcon className='mr-2 h-4 w-4' />
						Add Resume
					</Button>
				)}
			</div>

			{/* Empty State */}
			{isEmpty ? (
				<div className='flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center'>
					<div className='bg-muted mb-4 flex h-20 w-20 items-center justify-center rounded-full'>
						<FileTextIcon className='h-10 w-10 text-muted-foreground' />
					</div>
					<h2 className='mb-2 text-2xl '>No resumes yet</h2>
					<p className='text-muted-foreground mb-6 max-w-md'>
						Start building your resume collection by uploading your first PDF resume. You can manage
						multiple versions and easily apply to jobs.
					</p>
					<Button
						onClick={() => setUploadDialogOpen(true)}
						size='lg'
					>
						<PlusIcon className='mr-2 h-5 w-5' />
						Upload Your First Resume
					</Button>
				</div>
			) : (
				/* Resume Grid */
				<div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
					{initialResumes.map((resume) => (
						<ResumeCard
							key={resume.id}
							resume={resume}
							onEdit={handleEdit}
							onDelete={handleSuccess}
						/>
					))}
				</div>
			)}

			{/* Dialogs */}
			<UploadResumeDialog
				open={uploadDialogOpen}
				onOpenChange={setUploadDialogOpen}
				onSuccess={handleSuccess}
			/>
			<EditResumeDialog
				open={editDialogOpen}
				onOpenChange={setEditDialogOpen}
				resume={selectedResume}
				onSuccess={handleSuccess}
			/>
		</div>
	);
}
