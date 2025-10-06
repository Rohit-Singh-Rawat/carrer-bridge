'use client';

import { useEffect, useState } from 'react';

interface UsePdfPreviewOptions {
	file: File | null;
	scale?: number;
}

interface PdfPreviewState {
	thumbnail: string | null;
	loading: boolean;
	error: string | null;
}

/**
 * Generate a client-side PDF thumbnail preview using PDF.js
 */
export function usePdfPreview({ file, scale = 1.5 }: UsePdfPreviewOptions): PdfPreviewState {
	const [thumbnail, setThumbnail] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!file) {
			setThumbnail(null);
			setLoading(false);
			setError(null);
			return;
		}

		let cancelled = false;

		const generateThumbnail = async () => {
			setLoading(true);
			setError(null);

			try {
				// Dynamically import PDF.js
				const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

				// Set worker
				pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.mjs`;

				// Read file as array buffer
				const arrayBuffer = await file.arrayBuffer();

				// Load PDF
				const loadingTask = pdfjsLib.getDocument({
					data: arrayBuffer,
					standardFontDataUrl: `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
				});

				const pdf = await loadingTask.promise;

				if (cancelled) return;

				// Get first page
				const page = await pdf.getPage(1);

				if (cancelled) return;

				// Calculate viewport
				const viewport = page.getViewport({ scale });

				// Create canvas
				const canvas = document.createElement('canvas');
				const context = canvas.getContext('2d');

				if (!context) {
					throw new Error('Could not get canvas context');
				}

				canvas.height = viewport.height;
				canvas.width = viewport.width;

				// Render PDF page
				const renderContext = {
					canvasContext: context,
					viewport: viewport,
					canvas: canvas
				};

				await page.render(renderContext).promise;

				if (cancelled) return;

				// Convert to data URL
				const dataUrl = canvas.toDataURL('image/png');
				setThumbnail(dataUrl);
				setLoading(false);
			} catch (err) {
				if (!cancelled) {
					console.error('Failed to generate thumbnail:', err);
					setError('Failed to generate preview');
					setLoading(false);
				}
			}
		};

		generateThumbnail();

		return () => {
			cancelled = true;
		};
	}, [file, scale]);

	return { thumbnail, loading, error };
}
