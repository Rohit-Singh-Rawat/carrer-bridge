import { useCallback, useRef, useState } from 'react';

import { uploadCameraImage, uploadScreenImage } from '@/actions/job-application';

/**
 * Custom hook to handle taking snapshots from video streams
 * Can capture from either camera or screen share video and upload to server
 */
export const useSnapshot = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Take a snapshot from a video element and upload to server
  const takeSnapshot = useCallback(
    (videoRef: React.RefObject<HTMLVideoElement | null>, filename?: string) => {
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');

        if (context && video.videoWidth && video.videoHeight) {
          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Draw the current video frame to canvas
          context.drawImage(video, 0, 0);

          // Convert canvas to blob and trigger download (for manual snapshots)
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = filename || `interview-snapshot-${new Date().toISOString()}.png`;
              a.click();
              URL.revokeObjectURL(url);
            }
          });

          console.log('Snapshot taken at:', new Date().toISOString());
        } else {
          console.warn('Video not ready for snapshot or no video content');
        }
      } else {
        console.warn('Video ref or canvas ref not available');
      }
    },
    []
  );

  // Take a monitoring snapshot and upload to server
  const takeMonitoringSnapshot = useCallback(
    async (
      videoRef: React.RefObject<HTMLVideoElement | null>,
      applicationId: string,
      type: 'camera' | 'screen'
    ) => {
      if (!videoRef.current || !canvasRef.current) {
        console.warn('Video ref or canvas ref not available for monitoring');
        return;
      }

      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');

      if (!context || !video.videoWidth || !video.videoHeight) {
        console.warn('Video not ready for monitoring snapshot or no video content');
        return;
      }

      setIsUploading(true);
      setUploadError(null);

      try {
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw the current video frame to canvas
        context.drawImage(video, 0, 0);

        // Convert canvas to base64 image data
        const imageData = canvas.toDataURL('image/jpeg', 0.8);

        // Upload to server using appropriate action
        if (type === 'camera') {
          await uploadCameraImage(applicationId, imageData);
        } else {
          await uploadScreenImage(applicationId, imageData);
        }

        console.log(`${type} monitoring snapshot uploaded at:`, new Date().toISOString());
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : `Failed to upload ${type} monitoring image`;
        setUploadError(errorMessage);
        console.error(`Error uploading ${type} monitoring snapshot:`, error);
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  return {
    takeSnapshot,
    takeMonitoringSnapshot,
    canvasRef,
    isUploading,
    uploadError,
  };
};
