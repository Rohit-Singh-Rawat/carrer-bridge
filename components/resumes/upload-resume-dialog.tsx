'use client';

import { createResume } from '@/actions/resumes';
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
import { formatBytes, useFileUpload, type FileWithPreview } from '@/hooks/use-file-upload';
import { AlertCircleIcon, PaperclipIcon, UploadIcon, XIcon } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

interface UploadResumeDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSuccess?: () => void;
}

export function UploadResumeDialog({ open, onOpenChange, onSuccess }: UploadResumeDialogProps) {
	const [isPending, startTransition] = useTransition();
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');

	const maxSize = 10 * 1024 * 1024; // 10MB

	const [
		{ files, isDragging, errors },
		{
			handleDragEnter,
			handleDragLeave,
			handleDragOver,
			handleDrop,
			openFileDialog,
			removeFile,
			getInputProps,
			clearFiles,
		},
	] = useFileUpload({
		maxSize,
		accept: 'application/pdf',
		multiple: false,
	});

	const file = files[0];

	const handleSubmit = async () => {
		if (!title.trim()) {
			toast.error('Please enter a resume title');
			return;
		}

		if (!file) {
			toast.error('Please upload a PDF file');
			return;
		}

		startTransition(async () => {
			try {
				const formData = new FormData();
				formData.append('title', title.trim());
				if (description.trim()) {
					formData.append('description', description.trim());
				}

				if (file.file instanceof File) {
					formData.append('file', file.file);
				}

				const result = await createResume(formData);

				if (result.success) {
					toast.success(result.message || 'Resume uploaded successfully');
					setTitle('');
					setDescription('');
					clearFiles();
					onOpenChange(false);
					onSuccess?.();
				} else {
					toast.error(result.message || 'Failed to upload resume');
				}
			} catch (error) {
				console.error('Upload error:', error);
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
					<DialogTitle>Upload Resume</DialogTitle>
					<DialogDescription>
						Add a new resume to your collection. Only PDF files are supported.
					</DialogDescription>
				</DialogHeader>

				<div className='space-y-4 py-4'>
					{/* Title Input */}
					<div className='space-y-2'>
						<Label htmlFor='title'>
							Resume Name <span className='text-destructive'>*</span>
						</Label>
						<Input
							id='title'
							placeholder='e.g., Software Engineer Resume 2024'
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							disabled={isPending}
						/>
					</div>

					{/* Description Input */}
					<div className='space-y-2'>
						<Label htmlFor='description'>
							Description <span className='text-muted-foreground text-xs'>(Optional)</span>
						</Label>
						<Input
							id='description'
							placeholder='Brief description of this resume'
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							disabled={isPending}
						/>
					</div>

					{/* File Upload */}
					<div className='space-y-2'>
						<Label>
							Upload PDF <span className='text-destructive'>*</span>
						</Label>
						<div
							role='button'
							onClick={openFileDialog}
							onDragEnter={handleDragEnter}
							onDragLeave={handleDragLeave}
							onDragOver={handleDragOver}
							onDrop={handleDrop}
							data-dragging={isDragging || undefined}
							className='border-input hover:bg-accent/50 data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed p-4 transition-colors has-disabled:pointer-events-none has-disabled:opacity-50 has-[input:focus]:ring-[3px]'
						>
							<input
								{...getInputProps()}
								className='sr-only'
								aria-label='Upload PDF file'
								disabled={Boolean(file) || isPending}
							/>

							<div className='flex flex-col items-center justify-center text-center'>
								<div
									className='bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border'
									aria-hidden='true'
								>
									<UploadIcon className='size-4 opacity-60' />
								</div>
								<p className='mb-1.5 text-sm font-medium'>Upload PDF file</p>
								<p className='text-muted-foreground text-xs'>
									Drag & drop or click to browse (max. {formatBytes(maxSize)})
								</p>
							</div>
						</div>

						{errors.length > 0 && (
							<div
								className='text-destructive flex items-center gap-1 text-xs'
								role='alert'
							>
								<AlertCircleIcon className='size-3 shrink-0' />
								<span>{errors[0]}</span>
							</div>
						)}

						{/* File Preview */}
						{file && (
							<div className='rounded-xl border px-4 py-2'>
								<div className='flex items-center justify-between gap-2'>
									<div className='flex items-center gap-3 overflow-hidden'>
										<PaperclipIcon
											className='size-4 shrink-0 opacity-60'
											aria-hidden='true'
										/>
										<div className='min-w-0'>
											<p className='truncate text-[13px] font-medium'>
												{file.file instanceof File ? file.file.name : file.file.name}
											</p>
											<p className='text-muted-foreground text-xs'>
												{file.file instanceof File
													? formatBytes(file.file.size)
													: formatBytes(file.file.size)}
											</p>
										</div>
									</div>

									<Button
										size='icon'
										variant='ghost'
										className='text-muted-foreground/80 hover:text-foreground -me-2 size-8 hover:bg-transparent'
										onClick={() => removeFile(file.id)}
										aria-label='Remove file'
										disabled={isPending}
									>
										<XIcon
											className='size-4'
											aria-hidden='true'
										/>
									</Button>
								</div>
							</div>
						)}
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
						disabled={isPending || !title.trim() || !file}
					>
						{isPending ? (
							<>
								<Loader className='mr-2' />
								Uploading...
							</>
						) : (
							'Upload Resume'
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
