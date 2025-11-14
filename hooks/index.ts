// Export all custom hooks for easy importing
export { useMediaStream } from './use-media-stream';
export { useSpeechRecognition } from './use-speech-recognition';
export { useSpeechPlayback } from './use-speech-playback';
export { useFileUpload, formatBytes } from './use-file-upload';
export { usePdfPreview } from './use-pdf-preview';

// Export types
export type { TranscriptMessage } from './use-speech-recognition';
export type { SpeechPlaybackState } from './use-speech-playback';
export type {
	FileWithPreview,
	UseFileUploadOptions,
	UseFileUploadReturn,
	UseFileUploadActions,
} from './use-file-upload';