import { useCallback, useState } from 'react';

/**
 * Custom hook to manage screen sharing functionality
 * Handles starting/stopping screen share and screen recording
 */
export const useScreenShare = () => {
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Toggle screen share on/off
  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing
        if (screenStream) {
          screenStream.getTracks().forEach((track) => track.stop());
          setScreenStream(null);
        }
        setIsScreenSharing(false);
        console.log('Screen sharing stopped');
      } else {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        setScreenStream(stream);
        setIsScreenSharing(true);
        console.log('Screen sharing started');

        // Listen for when user stops screen sharing from browser controls
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          setScreenStream(null);
          setIsScreenSharing(false);
          console.log('Screen sharing ended by user');
        });
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  }, [isScreenSharing, screenStream]);

  // Stop screen sharing (cleanup)
  const stopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => track.stop());
      setScreenStream(null);
      setIsScreenSharing(false);
    }
  }, [screenStream]);

  return {
    screenStream,
    isScreenSharing,
    toggleScreenShare,
    stopScreenShare,
  };
};
