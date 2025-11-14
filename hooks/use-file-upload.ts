import { useCallback, useState } from 'react';

export interface FileWithPreview {
	id: string;
	file: File;
	preview?: string;
}

export interface UseFileUploadOptions {
	maxSize?: number;
	accept?: string;
	multiple?: boolean;
	onFilesAdded?: (files: FileWithPreview[]) => void;
}

export interface UseFileUploadReturn {
	files: FileWithPreview[];
	isDragging: boolean;
	errors: string[];
}

export interface UseFileUploadActions {
	handleDragEnter: (e: React.DragEvent) => void;
	handleDragLeave: (e: React.DragEvent) => void;
	handleDragOver: (e: React.DragEvent) => void;
	handleDrop: (e: React.DragEvent) => void;
	openFileDialog: () => void;
	removeFile: (id: string) => void;
	getInputProps: () => {
		type: 'file';
		accept?: string;
		multiple?: boolean;
		onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	};
	clearFiles: () => void;
}

export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

export function useFileUpload(
	options: UseFileUploadOptions = {}
): [UseFileUploadReturn, UseFileUploadActions] {
	const { maxSize, accept, multiple = false, onFilesAdded } = options;

	const [files, setFiles] = useState<FileWithPreview[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [errors, setErrors] = useState<string[]>([]);

	const validateFile = useCallback(
		(file: File): string | null => {
			// Check file size
			if (maxSize && file.size > maxSize) {
				return `File size exceeds ${formatBytes(maxSize)}`;
			}

			// Check file type
			if (accept) {
				const acceptedTypes = accept.split(',').map((type) => type.trim());
				const fileType = file.type;
				const isAccepted = acceptedTypes.some((type) => {
					if (type.endsWith('/*')) {
						const prefix = type.slice(0, -2);
						return fileType.startsWith(prefix);
					}
					return fileType === type;
				});

				if (!isAccepted) {
					return `File type not accepted. Only ${accept} files are allowed.`;
				}
			}

			return null;
		},
		[maxSize, accept]
	);

	const processFiles = useCallback(
		(fileList: FileList | null) => {
			if (!fileList) return;

			const newFiles: FileWithPreview[] = [];
			const newErrors: string[] = [];

			const filesToProcess = multiple ? Array.from(fileList) : [fileList[0]];

			for (const file of filesToProcess) {
				const error = validateFile(file);
				if (error) {
					newErrors.push(error);
					continue;
				}

				const fileWithPreview: FileWithPreview = {
					id: `${file.name}-${Date.now()}-${Math.random()}`,
					file,
					preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
				};

				newFiles.push(fileWithPreview);
			}

			setErrors(newErrors);

			if (newFiles.length > 0) {
				setFiles((prev) => (multiple ? [...prev, ...newFiles] : newFiles));
				onFilesAdded?.(newFiles);
			}
		},
		[multiple, validateFile, onFilesAdded]
	);

	const handleDragEnter = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	}, []);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);

			const { files } = e.dataTransfer;
			processFiles(files);
		},
		[processFiles]
	);

	const openFileDialog = useCallback(() => {
		// This is handled by clicking the hidden input
	}, []);

	const removeFile = useCallback((id: string) => {
		setFiles((prev) => {
			const file = prev.find((f) => f.id === id);
			if (file?.preview) {
				URL.revokeObjectURL(file.preview);
			}
			return prev.filter((f) => f.id !== id);
		});
		setErrors([]);
	}, []);

	const getInputProps = useCallback(
		() => ({
			type: 'file' as const,
			accept,
			multiple,
			onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
				processFiles(e.target.files);
				e.target.value = '';
			},
		}),
		[accept, multiple, processFiles]
	);

	const clearFiles = useCallback(() => {
		files.forEach((file) => {
			if (file.preview) {
				URL.revokeObjectURL(file.preview);
			}
		});
		setFiles([]);
		setErrors([]);
	}, [files]);

	return [
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
	];
}

