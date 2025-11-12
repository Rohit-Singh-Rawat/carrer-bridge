import { useCallback, useEffect, useState } from 'react';

/**
 * Custom hook to manage media stream (camera and audio)
 * Handles initialization, device switching, and stream cleanup
 */
export const useMediaStream = (isInterviewStarted: boolean) => {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);

  // Initialize media stream when interview starts
  useEffect(() => {
    if (!isInterviewStarted) return;

    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setMediaStream(stream);
        console.log('Media stream initialized');
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    initializeMedia();

    // Cleanup function - stop all tracks when component unmounts
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInterviewStarted]);

  // Toggle microphone mute/unmute
  const toggleMute = useCallback(() => {
    if (mediaStream) {
      const audioTrack = mediaStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        console.log('Audio toggled:', !audioTrack.enabled ? 'MUTED' : 'UNMUTED');
      }
    }
  }, [mediaStream]);

  // Toggle camera on/off
  const toggleCamera = useCallback(async () => {
    if (mediaStream) {
      if (isCameraOff) {
        // Camera is off, turn it on by creating new stream
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

          // Stop old stream and replace with new one
          mediaStream.getTracks().forEach((track) => track.stop());
          setMediaStream(newStream);
          setIsCameraOff(false);
          console.log('Camera turned ON with new stream');
        } catch (error) {
          console.error('Error turning camera on:', error);
        }
      } else {
        // Camera is on, turn it off
        const videoTrack = mediaStream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.enabled = false;
          setIsCameraOff(true);
          console.log('Camera turned OFF');
        }
      }
    }
  }, [mediaStream, isCameraOff]);

  // Change camera or microphone device
  const handleDeviceChange = useCallback(
    async (deviceId: string, kind: string) => {
      try {
        console.log('Changing device:', deviceId, kind);

        if (!mediaStream) return;

        const constraints: MediaStreamConstraints = {};

        // Set constraints based on device type
        if (kind === 'videoinput') {
          constraints.video = { deviceId: { exact: deviceId } };
          constraints.audio = true;
        } else if (kind === 'audioinput') {
          constraints.audio = { deviceId: { exact: deviceId } };
          constraints.video = true;
        }

        // Stop current tracks and get new stream with selected device
        mediaStream.getTracks().forEach((track) => track.stop());
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        setMediaStream(newStream);

        console.log('Device changed successfully to:', deviceId);
      } catch (error) {
        console.error('Error changing device:', error);
      }
    },
    [mediaStream]
  );

  // Stop all media streams (cleanup)
  const stopMediaStream = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
      setMediaStream(null);
    }
  }, [mediaStream]);

  return {
    mediaStream,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
    handleDeviceChange,
    stopMediaStream,
  };
};
