'use client';

import { updateResume } from '@/actions/resumes';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader } from '@/components/ui/loader';
import type { Resume } from '@/db/schema';
import { useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

interface EditResumeDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	resume: Resume | null;
	onSuccess?: () => void;
}

export function EditResumeDialog({ open, onOpenChange, resume, onSuccess }: EditResumeDialogProps) {
	const [isPending, startTransition] = useTransition();
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');

	useEffect(() => {
		if (resume) {
			setTitle(resume.title);
			setDescription(resume.description || '');
		}
	}, [resume]);

	const handleSubmit = async () => {
		if (!resume) return;

		if (!title.trim()) {
			toast.error('Please enter a resume title');
			return;
		}

		startTransition(async () => {
			try {
				const result = await updateResume(resume.id, {
					title: title.trim(),
					description: description.trim() || undefined,
				});

				if (result.success) {
					toast.success(result.message || 'Resume updated successfully');
					onOpenChange(false);
					onSuccess?.();
				} else {
					toast.error(result.message || 'Failed to update resume');
				}
			} catch (error) {
				console.error('Update error:', error);
				toast.error('An unexpected error occurred');
			}
		});
	};

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
		>
			<DialogContent className='sm:max-w-[500px]'>
				<DialogHeader>
					<DialogTitle>Edit Resume</DialogTitle>
					<DialogDescription>Update your resume title and description.</DialogDescription>
				</DialogHeader>

				<div className='space-y-4 py-4'>
					{/* Title Input */}
					<div className='space-y-2'>
						<Label htmlFor='edit-title'>
							Resume Name <span className='text-destructive'>*</span>
						</Label>
						<Input
							id='edit-title'
							placeholder='e.g., Software Engineer Resume 2024'
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							disabled={isPending}
						/>
					</div>

					{/* Description Input */}
					<div className='space-y-2'>
						<Label htmlFor='edit-description'>
							Description <span className='text-muted-foreground text-xs'>(Optional)</span>
						</Label>
						<Input
							id='edit-description'
							placeholder='Brief description of this resume'
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							disabled={isPending}
						/>
					</div>
				</div>

				<DialogFooter>
					<Button
						variant='outline'
						onClick={() => onOpenChange(false)}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={isPending || !title.trim()}
					>
						{isPending ? (
							<>
								<Loader className='mr-2' />
								Saving...
							</>
						) : (
							'Save Changes'
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
