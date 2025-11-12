import { useCallback, useEffect, useState } from 'react';

/**
 * Custom hook to manage mandatory screen monitoring functionality
 * Requires full screen sharing when screen monitoring is enabled
 */
export const useScreenMonitoring = () => {
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenShareError, setScreenShareError] = useState<string | null>(null);
  const [isScreenShareRequired, setIsScreenShareRequired] = useState(false);

  // Start mandatory screen sharing
  const startMandatoryScreenShare = useCallback(async () => {
    try {
      setScreenShareError(null);

      // Request full screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false, // Audio not required for monitoring
      });

      // Validate that user shared a screen (not just a window)
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();

        // Check if it's actually a screen share (monitor) and not just a window
        if (settings.displaySurface && settings.displaySurface !== 'monitor') {
          // User shared a window instead of screen - reject it
          stream.getTracks().forEach((track) => track.stop());
          throw new Error('Please share your entire screen, not just a window.');
        }
      }

      setScreenStream(stream);
      setIsScreenSharing(true);
      console.log('Mandatory screen sharing started for monitoring');

      // Listen for when user stops screen sharing
      if (videoTrack) {
        videoTrack.addEventListener('ended', () => {
          setScreenStream(null);
          setIsScreenSharing(false);
          if (isScreenShareRequired) {
            setScreenShareError(
              'Screen sharing is required for this interview. Please share your screen to continue.'
            );
          }
          console.log('Screen sharing ended - interview cannot continue without screen monitoring');
        });
      }

      return stream;
    } catch (error) {
      console.error('Error starting mandatory screen share:', error);
      let errorMessage = 'Failed to start screen sharing.';

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Screen sharing permission denied. This is required for the interview.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No screen available for sharing.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Screen sharing is not supported in this browser.';
        } else if (error.message.includes('window')) {
          errorMessage =
            'Please share your entire screen, not just a window. Try again and select "Entire Screen".';
        }
      }

      setScreenShareError(errorMessage);
      throw error;
    }
  }, [isScreenShareRequired]);

  // Stop screen sharing
  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
    }
  }, [screenStream]);

  // Set whether screen sharing is required
  const setScreenShareRequired = useCallback((required: boolean) => {
    setIsScreenShareRequired(required);
    if (!required) {
      setScreenShareError(null);
    }
  }, []);

  // Check if screen sharing is active and valid
  const isScreenShareActive = useCallback(() => {
    return isScreenSharing && screenStream && screenStream.active;
  }, [isScreenSharing, screenStream]);

  // Capture screen monitoring snapshot
  const captureScreenSnapshot = useCallback(() => {
    if (!screenStream || !isScreenSharing) {
      console.warn('No screen stream available for monitoring snapshot');
      return null;
    }

    // Create a video element to capture from the stream
    const video = document.createElement('video');
    video.srcObject = screenStream;
    video.muted = true;
    video.playsInline = true;

    return new Promise<string>((resolve, reject) => {
      video.onloadedmetadata = () => {
        video
          .play()
          .then(() => {
            // Create canvas to capture the frame
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // Draw the current frame
            ctx.drawImage(video, 0, 0);

            // Convert to base64 image data
            const imageData = canvas.toDataURL('image/jpeg', 0.8);

            // Cleanup
            video.pause();
            video.srcObject = null;

            resolve(imageData);
          })
          .catch(reject);
      };

      video.onerror = () => {
        reject(new Error('Failed to load video stream'));
      };
    });
  }, [screenStream, isScreenSharing]);

  // Validate screen sharing type
  const validateScreenShare = useCallback((stream: MediaStream) => {
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      const settings = videoTrack.getSettings();
      console.log('Screen share settings:', settings);

      // Check dimensions to ensure it's likely a full screen
      if (settings.width && settings.height) {
        // Most monitors have aspect ratios between 1.0 (square) and 2.4 (ultrawide)
        // Small windows typically have unusual aspect ratios
        if (settings.width < 800 || settings.height < 600) {
          console.warn('Screen share appears to be a small window');
          return {
            isValid: false,
            message: 'Please share your entire screen, not just a window or tab.',
          };
        }
      }

      // Check if it's a browser tab (displaySurface would be 'browser' for tabs)
      if (settings.displaySurface === 'browser') {
        return {
          isValid: false,
          message: 'Please share your entire screen, not just a browser tab.',
        };
      }

      // Check if it's an application window
      if (settings.displaySurface === 'window') {
        return {
          isValid: false,
          message: 'Please share your entire screen, not just an application window.',
        };
      }
    }

    return { isValid: true, message: 'Screen sharing validated successfully' };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [screenStream]);

  return {
    screenStream,
    isScreenSharing,
    screenShareError,
    isScreenShareRequired,
    startMandatoryScreenShare,
    stopScreenShare,
    setScreenShareRequired,
    isScreenShareActive,
    captureScreenSnapshot,
    validateScreenShare,
  };
};
