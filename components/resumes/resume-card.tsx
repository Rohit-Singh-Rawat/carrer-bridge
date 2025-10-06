'use client';

import { deleteResume } from '@/actions/resumes';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Resume } from '@/db/schema';
import { File01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { EyeIcon, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';

interface ResumeCardProps {
	resume: Resume;
	onEdit: (resume: Resume) => void;
	onDelete: () => void;
}

export function ResumeCard({ resume, onEdit, onDelete }: ResumeCardProps) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [imageLoaded, setImageLoaded] = useState(false);
	const [imageError, setImageError] = useState(false);

	const handleDelete = () => {
		startTransition(async () => {
			const result = await deleteResume(resume.id);
			if (result.success) {
				toast.success(result.message || 'Resume deleted successfully');
				onDelete();
			} else {
				toast.error(result.message || 'Failed to delete resume');
			}
		});
	};

	// Check if we have a real thumbnail (not a placeholder)
	const hasRealThumbnail = resume.thumbnailUrl && !resume.thumbnailUrl.startsWith('/');

	return (
		<div className='group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-lg'>
			{/* Thumbnail */}
			<Link
				href={`/dashboard/resumes/${resume.slug}`}
				className='block'
			>
				<div className='relative aspect-[5/6] w-full overflow-hidden bg-white border-b'>
					{hasRealThumbnail && !imageError ? (
						<>
							{/* Loading skeleton */}
							{!imageLoaded && (
								<div className='absolute inset-0 flex items-center justify-center bg-muted'>
									<div className='h-8 w-8 animate-spin rounded-full border-4 border-muted-foreground/20 border-t-muted-foreground/60' />
								</div>
							)}

							{/* Thumbnail Image */}
							<img
								src={resume.thumbnailUrl}
								alt={resume.title}
								className={`h-full w-full object-contain p-2 transition-all duration-300 ${
									imageLoaded ? 'opacity-100' : 'opacity-0'
								} group-hover:scale-[1.02]`}
								onLoad={() => setImageLoaded(true)}
								onError={() => setImageError(true)}
							/>
						</>
					) : (
						/* Fallback Icon */
						<div className='flex h-full items-center justify-center bg-muted transition-colors group-hover:bg-muted/80'>
							<HugeiconsIcon
								icon={File01Icon}
								size={96}
								className='text-muted-foreground'
							/>
						</div>
					)}
				</div>
			</Link>

			{/* Content */}
			<div className='p-4'>
				<div className='flex items-start justify-between gap-2'>
					<div className='min-w-0 flex-1'>
						<Link href={`/dashboard/resumes/${resume.slug}`}>
							<h3 className='truncate font-semibold hover:underline'>{resume.title}</h3>
						</Link>
						{resume.description && (
							<p className='text-muted-foreground mt-1 line-clamp-2 text-sm'>
								{resume.description}
							</p>
						)}
						<p className='text-muted-foreground mt-2 text-xs'>
							Updated {new Date(resume.updatedAt).toLocaleDateString()}
						</p>
					</div>

					{/* Actions Dropdown */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant='ghost'
								size='icon'
								className='h-8 w-8 shrink-0'
								disabled={isPending}
							>
								<MoreVertical className='h-4 w-4' />
								<span className='sr-only'>Actions</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align='end'>
							<DropdownMenuItem asChild>
								<Link
									href={`/dashboard/resumes/${resume.slug}`}
									className='flex items-center'
								>
									<EyeIcon className='mr-2 h-4 w-4' />
									View
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => onEdit(resume)}
								className='flex items-center'
							>
								<Pencil className='mr-2 h-4 w-4' />
								Edit
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={handleDelete}
								className='text-destructive focus:text-destructive flex items-center'
								disabled={isPending}
							>
								<Trash2 className='mr-2 h-4 w-4' />
								{isPending ? 'Deleting...' : 'Delete'}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</div>
	);
}
