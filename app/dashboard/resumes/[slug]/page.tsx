import { getResumeBySlug } from '@/actions/resumes';
import { Button } from '@/components/ui/button';
import { ArrowLeftIcon, DownloadIcon, Pencil } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ResumeViewClient } from './page-client';

export default async function ResumeViewPage({ params }: { params: { slug: string } }) {
	const result = await getResumeBySlug(params.slug);

	if (!result.success || !result.resume) {
		notFound();
	}

	return <ResumeViewClient resume={result.resume} />;
}
