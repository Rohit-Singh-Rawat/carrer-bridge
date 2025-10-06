'use client';

import { getResumeUploadUrls, saveResumeMetadata } from '@/actions/resumes';
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
import { usePdfPreview } from '@/hooks/use-pdf-preview';
import { AlertCircleIcon, FileTextIcon, PaperclipIcon, UploadIcon, XIcon } from 'lucide-react';
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

	// Generate PDF preview thumbnail
	const { thumbnail, loading: thumbnailLoading } = usePdfPreview({
		file: file?.file instanceof File ? file.file : null,
		scale: 1.5,
	});

	const handleSubmit = async () => {
		if (!title.trim()) {
			toast.error('Please enter a resume title');
			return;
		}

		if (!file) {
			toast.error('Please upload a PDF file');
			return;
		}

		if (thumbnailLoading) {
			toast.error('Please wait for thumbnail generation to complete');
			return;
		}

		if (!thumbnail) {
			toast.error('Failed to generate thumbnail. Please try again.');
			return;
		}

		startTransition(async () => {
			try {
				// Step 1: Get presigned URLs
				const urlsResult = await getResumeUploadUrls(title.trim());

				if (!urlsResult.success || !urlsResult.data) {
					toast.error(urlsResult.message || 'Failed to get upload URLs');
					return;
				}

				const { pdfUrl, thumbnailUrl, slug, pdfKey, thumbnailKey } = urlsResult.data;

				// Step 2: Convert thumbnail data URL to blob
				const thumbnailBlob = await fetch(thumbnail).then((res) => res.blob());

				// Step 3: Get PDF file
				if (!(file.file instanceof File)) {
					toast.error('Invalid file type');
					return;
				}

				// Upload PDF to R2
				const pdfUpload = fetch(pdfUrl, {
					method: 'PUT',
					body: file.file,
					headers: {
						'Content-Type': 'application/pdf',
					},
				});

				// Step 4: Upload thumbnail to R2
				const thumbnailUpload = fetch(thumbnailUrl, {
					method: 'PUT',
					body: thumbnailBlob,
					headers: {
						'Content-Type': 'image/png',
					},
				});

				// Wait for both uploads to complete
				const [pdfResponse, thumbnailResponse] = await Promise.all([pdfUpload, thumbnailUpload]);

				if (!pdfResponse.ok) {
					toast.error('Failed to upload PDF file');
					return;
				}

				if (!thumbnailResponse.ok) {
					toast.error('Failed to upload thumbnail');
					return;
				}

				// Step 5: Save metadata to database
				const result = await saveResumeMetadata({
					slug,
					title: title.trim(),
					description: description.trim() || undefined,
					pdfKey,
					thumbnailKey,
				});

				if (result.success) {
					toast.success(result.message || 'Resume uploaded successfully');
					handleClose();
					onSuccess?.();
				} else {
					toast.error(result.message || 'Failed to save resume');
				}
			} catch (error) {
				console.error('Upload error:', error);
				toast.error('An unexpected error occurred');
			}
		});
	};

	const handleClose = () => {
		setTitle('');
		setDescription('');
		clearFiles();
		onOpenChange(false);
	};

	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
		>
			<DialogContent className='sm:max-w-[800px]'>
				<DialogHeader>
					<DialogTitle>Upload Resume</DialogTitle>
					<DialogDescription>
						Add a new resume to your collection. Only PDF files are supported.
					</DialogDescription>
				</DialogHeader>

				<div className='flex gap-6 py-4'>
					<div className='flex-1 space-y-4'>
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
						</div>
					</div>

					{/* File Preview */}
					{file && (
						<div className='w-[300px] rounded-xl border overflow-hidden'>
							{/* Thumbnail Preview */}
							{thumbnail ? (
								<div className='relative aspect-[5/6] w-full bg-muted'>
									<img
										src={thumbnail}
										alt='Resume preview'
										className='h-full w-full object-contain'
									/>
									<Button
										size='icon'
										variant='destructive'
										className='absolute top-2 right-2 size-8 shadow-lg'
										onClick={() => removeFile(file.id)}
										aria-label='Remove file'
										disabled={isPending}
									>
										<XIcon className='size-4' />
									</Button>
								</div>
							) : thumbnailLoading ? (
								<div className='relative aspect-[5/6] w-full bg-muted flex flex-col items-center justify-center'>
									<div className='h-12 w-12 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-muted-foreground/60 mb-2' />
									<p className='text-sm text-muted-foreground'>Generating preview...</p>
									<Button
										size='icon'
										variant='destructive'
										className='absolute top-2 right-2 size-8 shadow-lg'
										onClick={() => removeFile(file.id)}
										aria-label='Remove file'
										disabled={isPending}
									>
										<XIcon className='size-4' />
									</Button>
								</div>
							) : (
								<div className='relative aspect-[5/6] w-full bg-muted flex flex-col items-center justify-center'>
									<FileTextIcon className='h-20 w-20 text-muted-foreground mb-2' />
									<p className='text-sm text-muted-foreground'>Preview unavailable</p>
									<Button
										size='icon'
										variant='destructive'
										className='absolute top-2 right-2 size-8 shadow-lg'
										onClick={() => removeFile(file.id)}
										aria-label='Remove file'
										disabled={isPending}
									>
										<XIcon className='size-4' />
									</Button>
								</div>
							)}

							{/* File Info */}
							<div className='px-4 py-3 border-t bg-muted/30'>
								<div className='flex items-center gap-3'>
									<PaperclipIcon className='size-4 shrink-0 opacity-60' />
									<div className='min-w-0 flex-1'>
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
							</div>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						variant='outline'
						onClick={handleClose}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={isPending || !title.trim() || !file || thumbnailLoading || !thumbnail}
					>
						{isPending ? (
							<>
								<Loader className='mr-2' />
								Uploading...
							</>
						) : thumbnailLoading ? (
							<>
								<Loader className='mr-2' />
								Generating preview...
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
