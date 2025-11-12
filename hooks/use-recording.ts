import { useCallback, useState } from 'react';

/**
 * Custom hook to manage media recording functionality
 * Handles both camera and screen recording with download capabilities
 */
export const useRecording = () => {
  // Camera recording state
  const [cameraRecorder, setCameraRecorder] = useState<MediaRecorder | null>(null);
  const [isCameraRecording, setIsCameraRecording] = useState(false);
  const [cameraRecordedChunks, setCameraRecordedChunks] = useState<Blob[]>([]);

  // Screen recording state
  const [screenRecorder, setScreenRecorder] = useState<MediaRecorder | null>(null);
  const [isScreenRecording, setIsScreenRecording] = useState(false);
  const [screenRecordedChunks, setScreenRecordedChunks] = useState<Blob[]>([]);

  // Start recording camera stream
  const startCameraRecording = useCallback(
    (mediaStream: MediaStream | null) => {
      if (mediaStream && !isCameraRecording) {
        const recorder = new MediaRecorder(mediaStream, {
          mimeType: 'video/webm;codecs=vp9,opus',
        });
        const chunks: Blob[] = [];

        // Collect recording data chunks
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        // Save chunks when recording stops
        recorder.onstop = () => {
          setCameraRecordedChunks(chunks);
          console.log('Camera recording stopped, chunks:', chunks.length);
        };

        recorder.start();
        setCameraRecorder(recorder);
        setIsCameraRecording(true);
        console.log('Camera recording started');
      }
    },
    [isCameraRecording]
  );

  // Stop camera recording
  const stopCameraRecording = useCallback(() => {
    if (cameraRecorder && isCameraRecording) {
      cameraRecorder.stop();
      setIsCameraRecording(false);
      console.log('Camera recording stopped');
    }
  }, [cameraRecorder, isCameraRecording]);

  // Start recording screen stream
  const startScreenRecording = useCallback(
    (screenStream: MediaStream | null) => {
      if (screenStream && !isScreenRecording) {
        const recorder = new MediaRecorder(screenStream, {
          mimeType: 'video/webm;codecs=vp9,opus',
        });
        const chunks: Blob[] = [];

        // Collect recording data chunks
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        // Save chunks when recording stops
        recorder.onstop = () => {
          setScreenRecordedChunks(chunks);
          console.log('Screen recording stopped, chunks:', chunks.length);
        };

        recorder.start();
        setScreenRecorder(recorder);
        setIsScreenRecording(true);
        console.log('Screen recording started');
      }
    },
    [isScreenRecording]
  );

  // Stop screen recording
  const stopScreenRecording = useCallback(() => {
    if (screenRecorder && isScreenRecording) {
      screenRecorder.stop();
      setIsScreenRecording(false);
      console.log('Screen recording stopped');
    }
  }, [screenRecorder, isScreenRecording]);

  // Download camera recording as file
  const downloadCameraRecording = useCallback(() => {
    if (cameraRecordedChunks.length > 0) {
      const blob = new Blob(cameraRecordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `camera-recording-${new Date().toISOString()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      console.log('Camera recording downloaded');
    }
  }, [cameraRecordedChunks]);

  // Download screen recording as file
  const downloadScreenRecording = useCallback(() => {
    if (screenRecordedChunks.length > 0) {
      const blob = new Blob(screenRecordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screen-recording-${new Date().toISOString()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      console.log('Screen recording downloaded');
    }
  }, [screenRecordedChunks]);

  // Stop all recordings (cleanup)
  const stopAllRecordings = useCallback(() => {
    if (cameraRecorder && isCameraRecording) {
      cameraRecorder.stop();
      setIsCameraRecording(false);
    }
    if (screenRecorder && isScreenRecording) {
      screenRecorder.stop();
      setIsScreenRecording(false);
    }
  }, [cameraRecorder, screenRecorder, isCameraRecording, isScreenRecording]);

  return {
    // Camera recording
    isCameraRecording,
    cameraRecordedChunks,
    startCameraRecording,
    stopCameraRecording,
    downloadCameraRecording,

    // Screen recording
    isScreenRecording,
    screenRecordedChunks,
    startScreenRecording,
    stopScreenRecording,
    downloadScreenRecording,

    // General
    stopAllRecordings,
  };
};
