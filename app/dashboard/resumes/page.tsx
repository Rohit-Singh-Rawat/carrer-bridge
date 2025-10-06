import { getUserResumes } from '@/actions/resumes';
import { FileTextIcon } from 'lucide-react';
import { redirect } from 'next/navigation';
import { ResumesPageClient } from './page-client';

export default async function ResumesPage() {
	const result = await getUserResumes();

	if (!result.success) {
		redirect('/login');
	}

	return <ResumesPageClient initialResumes={result.resumes || []} />;
}
