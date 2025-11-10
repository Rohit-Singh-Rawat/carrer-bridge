import { getResumeBySlug } from '@/actions/resumes';

import { notFound } from 'next/navigation';
import { ResumeViewClient } from './page-client';

export default async function ResumeViewPage({ params }: { params: { slug: string } }) {
	const result = await getResumeBySlug(params.slug);

	if (!result.success || !result.resume) {
		notFound();
	}

	return <ResumeViewClient resume={result.resume} />;
}
