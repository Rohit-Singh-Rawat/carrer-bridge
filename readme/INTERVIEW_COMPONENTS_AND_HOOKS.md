# Interview Components & Hooks

Full source dump for interview-related hooks/components so you can copy or migrate without digging through the tree. Structure mirrors `src/app/(interview)/interview`.

---

## Session Hooks (`src/app/(interview)/interview/[uuid]/session/hooks`)

### `useMediaStream(isInterviewStarted)`

- Manages camera/mic lifecycle and device switching.

```tsx
// File: src/app/(interview)/interview/[uuid]/session/hooks/use-media-stream.ts
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
```

### `useRecording()`

- Camera + screen `MediaRecorder` helpers.

```tsx
// File: src/app/(interview)/interview/[uuid]/session/hooks/use-recording.ts
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
```

### `useScreenMonitoring()`

- Enforces required full-screen sharing and periodic captures.

```tsx
// File: src/app/(interview)/interview/[uuid]/session/hooks/use-screen-monitoring.ts
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
```

### `useScreenShare()`

- Optional ad-hoc sharing (non-mandatory).

```tsx
// File: src/app/(interview)/interview/[uuid]/session/hooks/use-screen-share.ts
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
```

### `useSnapshot()`

- Captures still images (candidate and screen) and uploads to actions.

```tsx
// File: src/app/(interview)/interview/[uuid]/session/hooks/use-snapshot.ts
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
```

### `useSpeechRecognition(isInterviewStarted, isMuted, applicationUuid)`

- Speech-to-text + AI prompt integration.

```tsx
// File: src/app/(interview)/interview/[uuid]/session/hooks/use-speech-recognition.ts
import { useCallback, useEffect, useState } from 'react';

import {
  type ConversationMessage,
  generateAIInterviewResponseWithUuid,
  generateInterviewIntroductionWithUuid,
  type InterviewPhase,
} from '@/actions/ai-interview';

// Type declarations for Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

export interface TranscriptMessage {
  id: number;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

/**
 * Custom hook to manage speech recognition and transcript messages
 * Handles speech-to-text conversion and AI response integration
 */
export const useSpeechRecognition = (
  isInterviewStarted: boolean,
  isMuted: boolean,
  applicationUuid: string
) => {
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [isAITyping, setIsAITyping] = useState(false);
  const [isRecognitionActive, setIsRecognitionActive] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [transcriptMessages, setTranscriptMessages] = useState<TranscriptMessage[]>([]);
  const [currentPhase, setCurrentPhase] = useState<InterviewPhase>({
    current: 'introduction',
    questionIndex: 0,
    totalQuestions: 0, // Will be updated from fetched data
  });

  // Helper function to safely start recognition
  const startRecognition = useCallback(
    (recognitionInstance: SpeechRecognition) => {
      if (!isMuted && isInterviewStarted && !isRecognitionActive) {
        try {
          recognitionInstance.start();
        } catch (error) {
          console.log('Recognition start error (likely already running):', error);
        }
      }
    },
    [isMuted, isInterviewStarted, isRecognitionActive]
  );

  // Generate initial AI introduction when interview starts
  useEffect(() => {
    if (!isInterviewStarted || transcriptMessages.length > 0) return;

    const initializeInterview = async () => {
      try {
        const response = await generateInterviewIntroductionWithUuid(applicationUuid);

        if (response.success && response.nextQuestion) {
          const aiMessage: TranscriptMessage = {
            id: Date.now(),
            type: 'ai',
            text: response.nextQuestion,
            timestamp: new Date(),
          };

          setTranscriptMessages([aiMessage]);
          setConversationHistory([
            {
              role: 'assistant',
              content: response.nextQuestion,
              timestamp: new Date(),
            },
          ]);

          if (response.phase) {
            setCurrentPhase(response.phase);
          }
        }
      } catch (error) {
        console.error('Failed to generate interview introduction:', error);
        // Generic fallback message when UUID fails
        const fallbackText = `Hello! I'm Hirelytics AI and it's wonderful to meet you. I'll be conducting your interview today and I'm genuinely excited to learn about your background and experience. We have a structured conversation planned with thoughtful questions to assess your qualifications for this role. I'll provide feedback and encouragement throughout our discussion to help guide our conversation. To get us started, could you please share a brief introduction about yourself and what brings you to this opportunity? I'd love to hear your story.`;

        const fallbackMessage: TranscriptMessage = {
          id: Date.now(),
          type: 'ai',
          text: fallbackText,
          timestamp: new Date(),
        };
        setTranscriptMessages([fallbackMessage]);
        setConversationHistory([
          {
            role: 'assistant',
            content: fallbackText,
            timestamp: new Date(),
          },
        ]);
      }
    };

    initializeInterview();
  }, [isInterviewStarted, applicationUuid, transcriptMessages.length]);

  // Initialize speech recognition when interview starts
  useEffect(() => {
    if (!isInterviewStarted) return;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.error('SpeechRecognition is not available in this browser');
        return;
      }
      const recognitionInstance = new SpeechRecognition();

      // Configure speech recognition settings
      recognitionInstance.continuous = true; // Keep listening continuously
      recognitionInstance.interimResults = true; // Get partial results while speaking
      recognitionInstance.lang = 'en-IN'; // Set language to English (India)

      // Some browsers may have additional properties for timeout handling
      if ('maxAlternatives' in recognitionInstance) {
        recognitionInstance.maxAlternatives = 1;
      }

      // Handle speech recognition results
      recognitionInstance.onresult = async (event) => {
        const latest = event.results[event.results.length - 1];
        if (latest.isFinal) {
          const transcript = latest[0].transcript;

          // Add user message to transcript and conversation history
          const userMessage: TranscriptMessage = {
            id: Date.now(),
            type: 'user',
            text: transcript,
            timestamp: new Date(),
          };

          setTranscriptMessages((prev) => [...prev, userMessage]);

          const userConversationMessage: ConversationMessage = {
            role: 'user',
            content: transcript,
            timestamp: new Date(),
          };

          setConversationHistory((prev) => [...prev, userConversationMessage]);

          // Generate AI response using server action
          setIsAITyping(true);

          // Move to candidate introduction phase after the AI introduction
          const nextPhase: InterviewPhase = {
            current: 'candidate_intro',
            questionIndex: 0,
            totalQuestions: currentPhase.totalQuestions, // Use dynamic value from state
          };

          generateAIInterviewResponseWithUuid(
            [...conversationHistory, userConversationMessage],
            transcript,
            applicationUuid,
            nextPhase
          )
            .then(async (response) => {
              if (response.success && response.nextQuestion) {
                const aiMessage: TranscriptMessage = {
                  id: Date.now() + 1,
                  type: 'ai',
                  text: response.nextQuestion,
                  timestamp: new Date(),
                };

                setTranscriptMessages((prev) => [...prev, aiMessage]);

                const aiConversationMessage: ConversationMessage = {
                  role: 'assistant',
                  content: response.nextQuestion,
                  timestamp: new Date(),
                };

                setConversationHistory((prev) => [...prev, aiConversationMessage]);

                // Update phase
                if (response.phase) {
                  setCurrentPhase(response.phase);
                }
              } else {
                // Generic fallback response on error
                const fallbackResponse = `Thank you so much for sharing that with me - I really appreciate your openness. Could you tell me more about your experience and what aspects of this role excite you the most? I'd love to hear more about what draws you to this opportunity.`;

                const aiMessage: TranscriptMessage = {
                  id: Date.now() + 1,
                  type: 'ai',
                  text: fallbackResponse,
                  timestamp: new Date(),
                };

                setTranscriptMessages((prev) => [...prev, aiMessage]);

                const aiConversationMessage: ConversationMessage = {
                  role: 'assistant',
                  content: fallbackResponse,
                  timestamp: new Date(),
                };

                setConversationHistory((prev) => [...prev, aiConversationMessage]);
              }
              setIsAITyping(false);
            })
            .catch(async (error) => {
              console.error('Error generating AI response:', error);
              // Generic fallback response on error
              const fallbackResponse = `That's really interesting, and I appreciate you taking the time to share that with me. I'd love to hear about a challenging situation you've encountered in your career and how you approached solving it. Could you walk me through a specific example that showcases your problem-solving skills?`;

              const aiMessage: TranscriptMessage = {
                id: Date.now() + 1,
                type: 'ai',
                text: fallbackResponse,
                timestamp: new Date(),
              };

              setTranscriptMessages((prev) => [...prev, aiMessage]);

              const aiConversationMessage: ConversationMessage = {
                role: 'assistant',
                content: fallbackResponse,
                timestamp: new Date(),
              };

              setConversationHistory((prev) => [...prev, aiConversationMessage]);

              setIsAITyping(false);
            });
        }
      };

      // Handle speech recognition events
      recognitionInstance.onstart = () => {
        console.log('Speech recognition started');
        setIsRecognitionActive(true);
      };

      recognitionInstance.onerror = (event) => {
        // Handle different types of speech recognition errors
        if (event.error === 'no-speech') {
          // Silently handle no-speech errors - this is expected when user is quiet
          // This prevents console errors from showing when user isn't speaking
          console.log('No speech detected, keeping recognition in standby mode');

          // Don't restart immediately, let onend handle the restart to prevent conflicts
        } else if (event.error === 'audio-capture') {
          console.error('Audio capture error - please check microphone permissions');
          setIsRecognitionActive(false);
        } else if (event.error === 'network') {
          console.error('Network error during speech recognition');
          setIsRecognitionActive(false);
        } else if (event.error === 'not-allowed') {
          console.error('Speech recognition not allowed - please enable microphone permissions');
          setIsRecognitionActive(false);
        } else {
          // Only log other errors that aren't related to normal silence
          console.error('Speech recognition error:', event.error);
          setIsRecognitionActive(false);
        }
      };

      recognitionInstance.onend = () => {
        console.log('Speech recognition ended');
        setIsRecognitionActive(false);

        // Auto-restart recognition when it ends (unless muted or interview stopped)
        if (!isMuted && isInterviewStarted) {
          setTimeout(() => {
            startRecognition(recognitionInstance);
          }, 500); // Quick restart
        }
      };

      setRecognition(recognitionInstance);
    } else {
      console.warn('Speech recognition not supported in this browser');
    }

    // Cleanup: stop recognition when component unmounts
    return () => {
      if (recognition) {
        recognition.stop();
        setIsRecognitionActive(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInterviewStarted]);

  // Control speech recognition based on mute state
  useEffect(() => {
    if (recognition && isInterviewStarted) {
      if (isMuted) {
        if (isRecognitionActive) {
          recognition.stop();
        }
      } else {
        startRecognition(recognition);
      }
    }
  }, [isMuted, recognition, isRecognitionActive, isInterviewStarted, startRecognition]);

  // Heartbeat mechanism to ensure recognition stays active
  useEffect(() => {
    if (!isInterviewStarted || isMuted || !recognition) return;

    const heartbeatInterval = setInterval(() => {
      if (!isRecognitionActive && !isMuted && isInterviewStarted) {
        console.log('Heartbeat: Restarting inactive recognition');
        startRecognition(recognition);
      }
    }, 10000);

    return () => clearInterval(heartbeatInterval);
  }, [isInterviewStarted, isMuted, recognition, isRecognitionActive, startRecognition]);

  // Stop speech recognition (cleanup)
  const stopRecognition = useCallback(() => {
    if (recognition) {
      recognition.stop();
      setIsRecognitionActive(false);
    }
  }, [recognition]);

  // Add message manually to transcript
  const addMessage = useCallback((message: Omit<TranscriptMessage, 'id' | 'timestamp'>) => {
    setTranscriptMessages((prev) => [
      ...prev,
      {
        ...message,
        id: Date.now(),
        timestamp: new Date(),
      },
    ]);
  }, []);

  return {
    transcriptMessages,
    conversationHistory,
    currentPhase,
    recognition,
    stopRecognition,
    addMessage,
    isAITyping,
  };
};
```

### `hooks/index.ts`

- Barrel export for all session hooks.

```ts
// File: src/app/(interview)/interview/[uuid]/session/hooks/index.ts
// Export all custom hooks for easy importing
export { useMediaStream } from './use-media-stream';
export { useRecording } from './use-recording';
export { useScreenMonitoring } from './use-screen-monitoring';
export { useScreenShare } from './use-screen-share';
export { useSnapshot } from './use-snapshot';
export { useSpeechRecognition } from './use-speech-recognition';

// Export types
export type { TranscriptMessage } from './use-speech-recognition';
```

## Session UI Components (`src/app/(interview)/interview/[uuid]/session/_component`)

### `ai-video-feed.tsx`

- Animated card indicating when the AI interviewer is speaking.

```tsx
// File: src/app/(interview)/interview/[uuid]/session/_component/ai-video-feed.tsx
import React from 'react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AIVideoFeedProps {
  isAISpeaking: boolean;
}

const AIVideoFeed: React.FC<AIVideoFeedProps> = ({ isAISpeaking }) => {
  return (
    <Card
      className={cn(
        'relative w-full h-full bg-gradient-to-br from-primary to-primary/80 rounded-lg overflow-hidden border-border',
        isAISpeaking && 'ring-4 ring-green-500 ring-opacity-75 animate-pulse'
      )}
    >
      <div className="w-full h-full flex items-center justify-center">
        {/* AI Avatar */}
        <div
          className={cn(
            'w-16 h-16 lg:w-24 lg:h-24 bg-background rounded-full flex items-center justify-center transition-transform duration-300',
            isAISpeaking ? 'scale-110 animate-pulse' : 'scale-100'
          )}
        >
          <div className="w-8 h-8 lg:w-12 lg:h-12 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg lg:text-xl">AI</span>
          </div>
        </div>
      </div>

      {/* AI label */}
      <div className="absolute bottom-2 left-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded border border-border">
        <span className="text-foreground text-xs font-medium">AI Assistant</span>
      </div>

      {/* Speaking indicator */}
      {isAISpeaking && (
        <div className="absolute top-2 right-2">
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1 h-3 bg-primary rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default AIVideoFeed;
```

### `chat-transcript.tsx`

- Scrollable transcript with avatars, timestamps, and AI typing indicator.

```tsx
// File: src/app/(interview)/interview/[uuid]/session/_component/chat-transcript.tsx
import { Bot, Clock, User } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface Message {
  id: number;
  type: 'user' | 'ai';
  text: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'delivered'; // Add message status
}

interface ChatTranscriptProps {
  messages: Message[];
  isAITyping?: boolean; // Add typing indicator prop
}

const ChatTranscript: React.FC<ChatTranscriptProps> = ({ messages, isAITyping = false }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) {
      return 'Just now';
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className="h-full flex flex-col bg-background border-l border-border overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 rounded-full bg-primary/10">
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Live Transcript</h3>
        </div>
        <p className="text-sm text-muted-foreground">Real-time conversation transcription</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4 pb-8">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <div className="p-3 rounded-full bg-muted/50 mb-3">
                  <Bot className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Conversation will appear here as you speak
                </p>
              </div>
            ) : (
              messages.map((message, index) => {
                const isUser = message.type === 'user';
                const showAvatar = index === 0 || messages[index - 1].type !== message.type;

                return (
                  <div
                    key={message.id}
                    className={cn(
                      'flex gap-3 group animate-in slide-in-from-bottom-2 duration-300',
                      isUser ? 'flex-row-reverse' : 'flex-row'
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn('flex-shrink-0', !showAvatar && 'invisible')}>
                      <Avatar className="w-8 h-8">
                        <AvatarFallback
                          className={cn(
                            isUser
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground'
                          )}
                        >
                          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Message Content */}
                    <div className={cn('flex flex-col', isUser ? 'items-end' : 'items-start')}>
                      {/* Sender Name and Time */}
                      {showAvatar && (
                        <div
                          className={cn(
                            'flex items-center gap-2 mb-1 px-1',
                            isUser ? 'flex-row-reverse' : 'flex-row'
                          )}
                        >
                          <span className="text-xs font-medium text-foreground">
                            {isUser ? 'You' : 'AI Interviewer'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                      )}

                      {/* Message Bubble */}
                      <div
                        className={cn(
                          'relative max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm transition-all duration-200 group-hover:shadow-md',
                          isUser
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-muted text-foreground rounded-bl-md border border-border/50'
                        )}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {message.text}
                        </p>

                        {/* Timestamp for non-avatar messages */}
                        {!showAvatar && (
                          <div
                            className={cn(
                              'flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-70 transition-opacity',
                              isUser ? 'justify-end' : 'justify-start'
                            )}
                          >
                            <span className="text-xs">{formatTime(message.timestamp)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Typing Indicator */}
            {isAITyping && (
              <div className="flex gap-3 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex-shrink-0">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      <Bot className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span className="text-xs font-medium text-foreground">AI Interviewer</span>
                    <span className="text-xs text-muted-foreground">typing...</span>
                  </div>
                  <div className="bg-muted text-foreground rounded-2xl rounded-bl-md border border-border/50 px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      />
                      <div
                        className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Auto-scroll anchor */}
            <div ref={scrollRef} className="h-1" />
          </div>
        </ScrollArea>
      </div>

      {/* Footer with status */}
      <div className="p-3 border-t border-border bg-card/30 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Live transcription active</span>
        </div>
      </div>
    </div>
  );
};

export default ChatTranscript;
```

### `device-selector.tsx`

- Modal for switching audio/video/speaker devices mid-call.

```tsx
// File: src/app/(interview)/interview/[uuid]/session/_component/device-selector.tsx
import { X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DeviceSelectorProps {
  onClose: () => void;
  onDeviceChange: (deviceId: string, kind: string) => void;
}

const DeviceSelector: React.FC<DeviceSelectorProps> = ({ onClose, onDeviceChange }) => {
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    const getDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        setAudioInputs(devices.filter((device) => device.kind === 'audioinput'));
        setVideoInputs(devices.filter((device) => device.kind === 'videoinput'));
        setAudioOutputs(devices.filter((device) => device.kind === 'audiooutput'));
      } catch (error) {
        console.error('Error enumerating devices:', error);
      }
    };

    getDevices();
  }, []);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-card text-card-foreground border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-lg font-semibold">Device Settings</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          {/* Microphone */}
          <div>
            <label className="block text-sm font-medium mb-2">Microphone</label>
            <Select onValueChange={(value) => onDeviceChange(value, 'audioinput')}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent>
                {audioInputs.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Camera */}
          <div>
            <label className="block text-sm font-medium mb-2">Camera</label>
            <Select onValueChange={(value) => onDeviceChange(value, 'videoinput')}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="Select camera" />
              </SelectTrigger>
              <SelectContent>
                {videoInputs.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.slice(0, 5)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Speaker */}
          <div>
            <label className="block text-sm font-medium mb-2">Speaker</label>
            <Select onValueChange={(value) => onDeviceChange(value, 'audiooutput')}>
              <SelectTrigger className="bg-muted border-border">
                <SelectValue placeholder="Select speaker" />
              </SelectTrigger>
              <SelectContent>
                {audioOutputs.map((device) => (
                  <SelectItem key={device.deviceId} value={device.deviceId}>
                    {device.label || `Speaker ${device.deviceId.slice(0, 5)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <Button onClick={onClose} className="w-full">
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DeviceSelector;
```

### `interview-language-selector.tsx`

- Dialog for switching the interview language on the fly.

```tsx
// File: src/app/(interview)/interview/[uuid]/session/_component/interview-language-selector.tsx
'use client';

import { Globe, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { availableLanguages, type LanguageOption } from '@/lib/constants/language-constants';

interface InterviewLanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (languageCode: string) => Promise<void>;
  disabled?: boolean;
}

export default function InterviewLanguageSelector({
  currentLanguage,
  onLanguageChange,
  disabled = false,
}: InterviewLanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage);
  const [isUpdating, setIsUpdating] = useState(false);

  const currentLangData = availableLanguages.find((lang) => lang.code === currentLanguage);

  const handleLanguageChange = (value: string) => {
    setSelectedLanguage(value);
  };

  const handleSaveLanguage = async () => {
    if (selectedLanguage === currentLanguage) {
      setOpen(false);
      return;
    }

    setIsUpdating(true);
    try {
      await onLanguageChange(selectedLanguage);

      const newLangData = availableLanguages.find((lang) => lang.code === selectedLanguage);
      toast.success(`Interview language changed to ${newLangData?.name || selectedLanguage}`);

      setOpen(false);
    } catch (error) {
      console.error('Error updating language:', error);
      toast.error('Failed to update language preference. Please try again.');
      // Reset to current language on error
      setSelectedLanguage(currentLanguage);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled} className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span className="text-lg">{currentLangData?.flag}</span>
          <span className="hidden sm:inline">{currentLangData?.name}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Interview Language</DialogTitle>
          <DialogDescription>
            Select your preferred language for the interview session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="language-select">Interview Language</Label>
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger id="language-select">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages.map((language: LanguageOption) => (
                  <SelectItem key={language.code} value={language.code}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{language.flag}</span>
                      <span>{language.name}</span>
                      {language.isDefault && (
                        <span className="text-xs text-muted-foreground">(Default)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isUpdating}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveLanguage}
            disabled={isUpdating || selectedLanguage === currentLanguage}
            className="flex-1"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### `interview-start-screen.tsx`

- Welcome screen summarizing session details before the interview starts.

```tsx
// File: src/app/(interview)/interview/[uuid]/session/_component/interview-start-screen.tsx
import { Camera, CheckCircle, Clock, Mic, Monitor, Play, Users, Video } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { availableLanguages } from '@/lib/constants/language-constants';

import InterviewLanguageSelector from './interview-language-selector';
import ThemeToggle from './theme-toggle';

interface ApplicationData {
  preferredLanguage: string;
  candidate: {
    name: string;
  };
  jobDetails: {
    title: string;
    description: string;
    skills: string[];
  };
  sessionInstruction: {
    screenMonitoring: boolean;
    screenMonitoringMode: 'photo' | 'video';
    screenMonitoringInterval?: 30 | 60;
    cameraMonitoring: boolean;
    cameraMonitoringMode: 'photo' | 'video';
    cameraMonitoringInterval?: 30 | 60;
    duration: number; // mandatory field
  };
  instructionsForAi?: {
    instruction?: string;
    totalQuestions: number;
    difficultyLevel: 'easy' | 'normal' | 'hard' | 'expert' | 'advanced';
    questionMode?: 'manual' | 'ai-mode';
  };
}

interface InterviewStartScreenProps {
  onStartInterview: () => void;
  onCancel: () => void;
  applicationData: ApplicationData;
  onLanguageChange?: (languageCode: string) => Promise<void>;
}

/**
 * Interview Start Screen Component
 * Displays welcome message and instructions before starting the interview
 */
const InterviewStartScreen: React.FC<InterviewStartScreenProps> = ({
  onStartInterview,
  onCancel,
  applicationData,
  onLanguageChange,
}) => {
  const totalQuestions = applicationData.instructionsForAi?.totalQuestions || 10;
  // Use duration from session instruction (mandatory field)
  const estimatedDuration = applicationData.sessionInstruction.duration;
  const difficultyLevel = applicationData.instructionsForAi?.difficultyLevel || 'normal';

  // Get language information
  const selectedLanguage =
    availableLanguages.find((lang) => lang.code === applicationData.preferredLanguage) ||
    availableLanguages[0];

  return (
    <div className="h-screen flex items-center justify-center p-4 bg-background overflow-hidden">
      <Card className="max-w-5xl w-full h-fit max-h-[95vh] overflow-y-auto p-6 bg-card text-card-foreground border border-border relative">
        {/* Theme Toggle - Top Right */}
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-3">
            <Video className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-1">
            {applicationData.jobDetails.title} - AI Interview
          </h1>
          <p className="text-sm text-muted-foreground">Welcome {applicationData.candidate.name}</p>
        </div>

        {/* Session Info */}
        <div className="grid md:grid-cols-3 gap-2 mb-4">
          <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground bg-muted rounded-lg p-2">
            <Users size={16} className="text-primary" />
            <span>You + AI Interviewer</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground bg-muted rounded-lg p-2">
            <Clock size={16} className="text-primary" />
            <span>{estimatedDuration} minute session</span>
          </div>
          <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground bg-muted rounded-lg p-2">
            <CheckCircle size={16} className="text-green-500" />
            <span>
              {totalQuestions} Questions •{' '}
              {difficultyLevel.charAt(0).toUpperCase() + difficultyLevel.slice(1)}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          {/* Interview Session Details */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-foreground">Session Information</h2>
              {onLanguageChange && (
                <InterviewLanguageSelector
                  currentLanguage={applicationData.preferredLanguage}
                  onLanguageChange={onLanguageChange}
                  disabled={false}
                />
              )}
            </div>
            <div className="space-y-2">
              {/* Duration and Questions */}
              <div className="p-3 bg-muted rounded-lg">
                <h3 className="text-sm font-medium text-foreground mb-2">Interview Details</h3>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Duration: {estimatedDuration} minutes</p>
                  <p>• Total questions: {totalQuestions}</p>
                  <p>
                    • Difficulty:{' '}
                    {difficultyLevel.charAt(0).toUpperCase() + difficultyLevel.slice(1)}
                  </p>
                  <p>
                    • Language: {selectedLanguage.flag} {selectedLanguage.name}
                  </p>
                  {applicationData.instructionsForAi?.questionMode && (
                    <p>
                      • Question mode:{' '}
                      {applicationData.instructionsForAi.questionMode === 'ai-mode'
                        ? 'AI Generated'
                        : 'Manual'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Active Features */}
          <div>
            <h2 className="text-base font-semibold text-foreground mb-2">Active Features</h2>
            <div className="grid gap-2">
              {/* Core Features - Always enabled */}
              <div className="flex items-start space-x-2 p-2 bg-accent rounded-lg">
                <Video className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-foreground">Video Recording</h3>
                  <p className="text-xs text-muted-foreground">Audio & video recording active</p>
                </div>
              </div>

              <div className="flex items-start space-x-2 p-2 bg-accent rounded-lg">
                <Mic className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-foreground">Live Transcription</h3>
                  <p className="text-xs text-muted-foreground">Real-time speech-to-text</p>
                </div>
              </div>

              {/* Optional Features - Only show if enabled */}
              {applicationData.sessionInstruction.screenMonitoring === true && (
                <div className="flex items-start space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Monitor className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800 flex items-center gap-1">
                      Screen Monitoring
                      {applicationData.sessionInstruction.screenMonitoringMode === 'photo' ? (
                        <Camera className="w-4 h-4" />
                      ) : (
                        <Video className="w-4 h-4" />
                      )}
                      <span className="text-xs bg-yellow-200 px-1 rounded">Required</span>
                    </h3>
                    <p className="text-xs text-yellow-700">
                      {applicationData.sessionInstruction.screenMonitoringMode === 'video'
                        ? 'Continuous recording'
                        : `Snapshots every ${applicationData.sessionInstruction.screenMonitoringInterval || 30}s`}
                    </p>
                  </div>
                </div>
              )}

              {applicationData.sessionInstruction.cameraMonitoring === true && (
                <div className="flex items-start space-x-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <Camera className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-orange-800 flex items-center gap-1">
                      Camera Monitoring
                      {applicationData.sessionInstruction.cameraMonitoringMode === 'photo' ? (
                        <Camera className="w-4 h-4" />
                      ) : (
                        <Video className="w-4 h-4" />
                      )}
                    </h3>
                    <p className="text-xs text-orange-700">
                      {applicationData.sessionInstruction.cameraMonitoringMode === 'video'
                        ? 'Continuous recording'
                        : `Snapshots every ${applicationData.sessionInstruction.cameraMonitoringInterval || 30}s`}
                    </p>
                  </div>
                </div>
              )}

              {/* Show a message if no monitoring features are enabled */}
              {!applicationData.sessionInstruction.screenMonitoring &&
                !applicationData.sessionInstruction.cameraMonitoring && (
                  <div className="flex items-start space-x-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-blue-800">Privacy Mode</h3>
                      <p className="text-xs text-blue-700">No additional monitoring enabled</p>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* Ready to Start Section */}
        <div className="text-center mb-4">
          <h3 className="text-base font-semibold text-foreground mb-2">Ready to Begin?</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-2xl mx-auto">
            <div className="flex items-center space-x-1 p-2 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span className="text-green-800 text-xs">Camera Ready</span>
            </div>
            <div className="flex items-center space-x-1 p-2 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span className="text-green-800 text-xs">Audio Ready</span>
            </div>
            <div className="flex items-center space-x-1 p-2 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span className="text-green-800 text-xs">Internet Stable</span>
            </div>
            <div className="flex items-center space-x-1 p-2 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-3 h-3 text-green-600" />
              <span className="text-green-800 text-xs">Environment Quiet</span>
            </div>
          </div>
        </div>

        {/* Start Buttons */}
        <div className="flex space-x-3 justify-center mb-4">
          <Button onClick={onCancel} variant="outline" className="min-w-28">
            Cancel
          </Button>
          <Button onClick={onStartInterview} className="min-w-28">
            <Play size={16} className="mr-2" />
            Start Interview
          </Button>
        </div>

        {/* Footer Information */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Camera and microphone access will be required for this interview session.
          </p>
          {applicationData.sessionInstruction.screenMonitoring && (
            <p className="text-xs text-orange-700 mt-2 bg-orange-50 border border-orange-200 rounded px-3 py-1 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-orange-600" />
              Screen sharing is mandatory for this interview. You will be prompted to share your
              full screen.
            </p>
          )}
          {(applicationData.sessionInstruction.screenMonitoring ||
            applicationData.sessionInstruction.cameraMonitoring) && (
            <p className="text-xs text-yellow-700 mt-2 bg-yellow-50 border border-yellow-200 rounded px-3 py-1 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-yellow-600" />
              This session includes monitoring features for security and assessment purposes.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
};

export default InterviewStartScreen;
```

### `media-control.tsx`

- Bottom control strip for mute/camera/device/end-call actions.

```tsx
// File: src/app/(interview)/interview/[uuid]/session/_component/media-control.tsx
import { Camera, CameraOff, Mic, MicOff, Phone, Settings } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

interface MediaControlsProps {
  isMuted: boolean;
  isCameraOff: boolean;
  isRecording?: boolean; // Hidden for production
  isScreenSharing?: boolean; // Hidden for production
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare?: () => void; // Hidden for production
  onStartRecording?: () => void; // Hidden for production
  onStopRecording?: () => void; // Hidden for production
  onDownloadRecording?: () => void; // Hidden for production
  onTakeSnapshot?: () => void; // Hidden for production
  onEndCall: () => void;
  onShowDeviceSelector: () => void;
  hasRecording?: boolean; // Hidden for production
}

const MediaControls: React.FC<MediaControlsProps> = ({
  isMuted,
  isCameraOff,
  isRecording: _isRecording, // Hidden for production
  isScreenSharing: _isScreenSharing, // Hidden for production
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare: _onToggleScreenShare, // Hidden for production
  onStartRecording: _onStartRecording, // Hidden for production
  onStopRecording: _onStopRecording, // Hidden for production
  onDownloadRecording: _onDownloadRecording, // Hidden for production
  onTakeSnapshot: _onTakeSnapshot, // Hidden for production
  onEndCall,
  onShowDeviceSelector,
  hasRecording: _hasRecording, // Hidden for production
}) => {
  return (
    <div className="flex items-center justify-center space-x-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg border border-border">
      {/* Microphone */}
      <Button
        variant={isMuted ? 'destructive' : 'outline'}
        size="sm"
        onClick={onToggleMute}
        className="h-10 w-10 rounded-full p-0 hover:scale-105 transition-all duration-200"
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
      </Button>

      {/* Camera */}
      <Button
        variant={isCameraOff ? 'destructive' : 'outline'}
        size="sm"
        onClick={onToggleCamera}
        className="h-10 w-10 rounded-full p-0 hover:scale-105 transition-all duration-200"
        title={isCameraOff ? 'Turn On Camera' : 'Turn Off Camera'}
      >
        {isCameraOff ? <CameraOff size={18} /> : <Camera size={18} />}
      </Button>

      {/* Device Settings */}
      <Button
        variant="outline"
        size="sm"
        onClick={onShowDeviceSelector}
        className="h-10 w-10 rounded-full p-0 hover:scale-105 transition-all duration-200"
        title="Device Settings"
      >
        <Settings size={18} />
      </Button>

      {/* End Call */}
      <Button
        variant="destructive"
        size="sm"
        onClick={onEndCall}
        className="h-10 w-10 rounded-full p-0 hover:scale-105 transition-all duration-200"
        title="End Call"
      >
        <Phone size={18} className="rotate-45" />
      </Button>
    </div>
  );
};

export default MediaControls;
```

### `monitoring-status.tsx`

- Banner describing active monitoring modes.

```tsx
// File: src/app/(interview)/interview/[uuid]/session/_component/monitoring-status.tsx
import { Camera, Monitor, Video } from 'lucide-react';
import React from 'react';

import { Card } from '@/components/ui/card';

interface MonitoringStatusProps {
  sessionInstruction?: {
    screenMonitoring: boolean;
    screenMonitoringMode: 'photo' | 'video';
    screenMonitoringInterval?: 30 | 60;
    cameraMonitoring: boolean;
    cameraMonitoringMode: 'photo' | 'video';
    cameraMonitoringInterval?: 30 | 60;
    duration: number;
  };
}

const MonitoringStatus: React.FC<MonitoringStatusProps> = ({ sessionInstruction }) => {
  if (
    !sessionInstruction ||
    (!sessionInstruction.screenMonitoring && !sessionInstruction.cameraMonitoring)
  ) {
    return null;
  }

  return (
    <Card className="p-3 mb-4 bg-yellow-50 border-yellow-200">
      <h3 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center">
        <Camera className="w-4 h-4 mr-2" />
        Active Monitoring Features
      </h3>
      <div className="space-y-2 text-xs text-yellow-700">
        {sessionInstruction.screenMonitoring && (
          <div className="flex items-center space-x-2">
            <Monitor className="w-3 h-3" />
            <span>
              Screen monitoring: {sessionInstruction.screenMonitoringMode}
              {sessionInstruction.screenMonitoringMode === 'photo' &&
                sessionInstruction.screenMonitoringInterval &&
                ` (every ${sessionInstruction.screenMonitoringInterval}s)`}
            </span>
          </div>
        )}
        {sessionInstruction.cameraMonitoring && (
          <div className="flex items-center space-x-2">
            <Video className="w-3 h-3" />
            <span>
              Camera monitoring: {sessionInstruction.cameraMonitoringMode}
              {sessionInstruction.cameraMonitoringMode === 'photo' &&
                sessionInstruction.cameraMonitoringInterval &&
                ` (every ${sessionInstruction.cameraMonitoringInterval}s)`}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default MonitoringStatus;
```

### `theme-toggle.tsx`

- Dropdown to switch between light/dark/system themes.

```tsx
// File: src/app/(interview)/interview/[uuid]/session/_component/theme-toggle.tsx
'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 w-8 px-0">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### `timer-display.tsx`

- Countdown timer based on mandatory session duration.

```tsx
// File: src/app/(interview)/interview/[uuid]/session/_component/timer-display.tsx
import { Clock } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  totalQuestions?: number;
  duration: number; // Duration in minutes from session instruction (mandatory)
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({ duration }) => {
  // Use duration directly from session instruction
  const totalDuration = duration * 60; // Convert minutes to seconds
  const [timeLeft, setTimeLeft] = useState(totalDuration);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    if (timeLeft <= 60) return 'text-destructive'; // Last minute - red with bounce
    if (timeLeft <= 300) return 'text-muted-foreground'; // Last 5 minutes - warning
    return 'text-foreground';
  };

  const shouldBounce = timeLeft <= 60 && timeLeft > 0;

  return (
    <div
      className={cn(
        'flex items-center space-x-2 px-3 py-1 rounded-lg bg-muted border border-border',
        shouldBounce && 'animate-bounce'
      )}
    >
      <Clock size={16} className={getTimerColor()} />
      <span className={cn('font-mono text-sm font-medium', getTimerColor())}>
        {formatTime(timeLeft)}
      </span>
    </div>
  );
};

export default TimerDisplay;
```

### `user-video-feed.tsx`

- Candidate video feed with speaking indicator and camera-off placeholder.

```tsx
// File: src/app/(interview)/interview/[uuid]/session/_component/user-video-feed.tsx
import { CameraOff } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

interface UserVideoFeedProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCameraOff: boolean;
  isUserSpeaking: boolean;
}

const UserVideoFeed: React.FC<UserVideoFeedProps> = ({ videoRef, isCameraOff, isUserSpeaking }) => {
  return (
    <div
      className={cn(
        'relative w-full h-full bg-muted rounded-lg overflow-hidden border border-border',
        isUserSpeaking && 'ring-4 ring-primary ring-opacity-75 animate-pulse'
      )}
    >
      {!isCameraOff ? (
        <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <div className="text-center">
            <CameraOff size={48} className="text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">Camera is off</p>
          </div>
        </div>
      )}

      {/* User label */}
      <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm px-2 py-1 rounded border border-border">
        <span className="text-foreground text-sm font-medium">You</span>
      </div>
    </div>
  );
};

export default UserVideoFeed;
```

### `video-area.tsx`

- Responsive layout combining user video, AI placeholder, and screen-share picture-in-picture.

```tsx
// File: src/app/(interview)/interview/[uuid]/session/_component/video-area.tsx
import { Download } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';

import AIVideoFeed from './ai-video-feed';
import UserVideoFeed from './user-video-feed';

interface VideoAreaProps {
  // Video refs for rendering streams
  videoRef: React.RefObject<HTMLVideoElement | null>;
  screenRef: React.RefObject<HTMLVideoElement | null>;

  // Camera state
  isCameraOff: boolean;
  isUserSpeaking: boolean;

  // AI state
  isAISpeaking: boolean;

  // Screen sharing state
  isScreenSharing: boolean;
  screenStream: MediaStream | null;

  // Recording state
  isScreenRecording: boolean;
  screenRecordedChunks: Blob[];

  // Recording controls
  onStartScreenRecording: () => void;
  onStopScreenRecording: () => void;
  onDownloadScreenRecording: () => void;
}

/**
 * Video Area Component - Handles video display for both mobile and desktop layouts
 * Shows user camera, AI video, and screen sharing with appropriate picture-in-picture positioning
 */
const VideoArea: React.FC<VideoAreaProps> = ({
  videoRef,
  screenRef,
  isCameraOff,
  isUserSpeaking,
  isAISpeaking,
  isScreenSharing,
  screenStream,
  isScreenRecording,
  screenRecordedChunks,
  onStartScreenRecording,
  onStopScreenRecording,
  onDownloadScreenRecording,
}) => {
  return (
    <>
      {/* Mobile Layout */}
      <div className="lg:hidden relative bg-muted flex-1 min-h-0">
        {/* Screen Share View for Mobile */}
        {isScreenSharing && screenStream ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Main screen share video */}
            <video
              ref={screenRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
            />

            {/* User Camera Picture in Picture */}
            <div className="absolute top-4 right-4 w-24 h-24 rounded-lg overflow-hidden border-2 border-border shadow-lg">
              <UserVideoFeed
                videoRef={videoRef}
                isCameraOff={isCameraOff}
                isUserSpeaking={isUserSpeaking}
              />
            </div>

            {/* AI Video Picture in Picture */}
            <div className="absolute top-4 left-4 w-20 h-20">
              <AIVideoFeed isAISpeaking={isAISpeaking} />
            </div>

            {/* Screen Recording Controls */}
            {!isScreenRecording ? (
              <div className="absolute top-1/2 left-4">
                <Button onClick={onStartScreenRecording} variant="default" size="sm">
                  Start Screen Recording
                </Button>
              </div>
            ) : (
              <div className="absolute top-1/2 left-4">
                <Button
                  onClick={onStopScreenRecording}
                  variant="destructive"
                  size="sm"
                  className="animate-pulse"
                >
                  Stop Screen Recording
                </Button>
              </div>
            )}

            {/* Download Screen Recording Button */}
            {screenRecordedChunks.length > 0 && !isScreenRecording && (
              <div className="absolute bottom-1/2 left-4">
                <Button onClick={onDownloadScreenRecording} variant="secondary" size="sm">
                  Download Screen Recording
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* Normal Camera View for Mobile */
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Main user camera */}
            <div className="w-full max-w-xs aspect-square">
              <UserVideoFeed
                videoRef={videoRef}
                isCameraOff={isCameraOff}
                isUserSpeaking={isUserSpeaking}
              />
            </div>

            {/* AI Video Picture in Picture */}
            <div className="absolute top-8 right-8 w-20 h-20">
              <AIVideoFeed isAISpeaking={isAISpeaking} />
            </div>
          </div>
        )}
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex flex-1 relative bg-muted min-h-0">
        {/* Main User Camera - Always visible on desktop */}
        <div className="relative w-full h-full">
          <UserVideoFeed
            videoRef={videoRef}
            isCameraOff={isCameraOff}
            isUserSpeaking={isUserSpeaking}
          />

          {/* AI Video - Always in top right */}
          <div className="absolute top-4 right-4 w-48 h-36 z-10">
            <AIVideoFeed isAISpeaking={isAISpeaking} />
          </div>

          {/* Screen Share - Small window in bottom right when active */}
          {isScreenSharing && screenStream && (
            <div className="absolute bottom-20 right-4 w-64 h-48 rounded-lg overflow-hidden border-2 border-primary shadow-lg z-10">
              <video
                ref={screenRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain bg-muted"
              />

              {/* Screen share label */}
              <div className="absolute top-2 left-2 bg-primary px-2 py-1 rounded text-xs text-primary-foreground">
                Screen Share
              </div>

              {/* Screen Recording Controls */}
              <div className="absolute bottom-2 left-2 flex space-x-1">
                {!isScreenRecording ? (
                  <Button
                    size="sm"
                    onClick={onStartScreenRecording}
                    variant="default"
                    className="text-xs"
                  >
                    Record
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={onStopScreenRecording}
                    variant="destructive"
                    className="text-xs animate-pulse"
                  >
                    Stop
                  </Button>
                )}

                {/* Download button when recording is available */}
                {screenRecordedChunks.length > 0 && !isScreenRecording && (
                  <Button
                    size="sm"
                    onClick={onDownloadScreenRecording}
                    variant="secondary"
                    className="text-xs"
                  >
                    <Download size={12} />
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default VideoArea;
```

### `video-call.tsx`

- Orchestrates the entire interview session: streaming, monitoring, transcripts, and layout.

```tsx
// File: src/app/(interview)/interview/[uuid]/session/_component/video-call.tsx
'use client';
import { Camera, CheckCircle, Monitor, MonitorPlay, Video } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { updateJobApplicationLanguage, uploadScreenImage } from '@/actions/job-application';
import { useIsMobile } from '@/hooks/use-mobile';

// Import custom hooks for managing different aspects of the video call
import { useMediaStream } from '../hooks/use-media-stream';
import { useRecording } from '../hooks/use-recording';
import { useScreenMonitoring } from '../hooks/use-screen-monitoring';
import { useScreenShare } from '../hooks/use-screen-share';
import { useSnapshot } from '../hooks/use-snapshot';
import { useSpeechRecognition } from '../hooks/use-speech-recognition';
import AIVideoFeed from './ai-video-feed';
import ChatTranscript from './chat-transcript';
import DeviceSelector from './device-selector';
import InterviewLanguageSelector from './interview-language-selector';
// Import UI components
import InterviewStartScreen from './interview-start-screen';
import MediaControls from './media-control';
import ThemeToggle from './theme-toggle';
import TimerDisplay from './timer-display';
import UserVideoFeed from './user-video-feed';

interface ApplicationData {
  id: string;
  uuid: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  preferredLanguage: string;
  candidate: {
    email: string;
    name: string;
  };
  jobDetails: {
    title: string;
    description: string;
    skills: string[];
    benefits?: string;
    requirements?: string;
  };
  sessionInstruction: {
    screenMonitoring: boolean;
    screenMonitoringMode: 'photo' | 'video';
    screenMonitoringInterval?: 30 | 60;
    cameraMonitoring: boolean;
    cameraMonitoringMode: 'photo' | 'video';
    cameraMonitoringInterval?: 30 | 60;
    duration: number; // mandatory field
  };
  instructionsForAi?: {
    instruction: string;
    difficultyLevel: 'easy' | 'normal' | 'hard' | 'expert' | 'advanced';
    questionMode: 'manual' | 'ai-mode';
    totalQuestions: number;
    categoryConfigs: Array<{
      type: string;
      numberOfQuestions: number;
    }>;
    questions: Array<{
      id: string;
      type: string;
      question: string;
      isAIGenerated?: boolean;
    }>;
  };
  jobInfo?: {
    id: string;
    title: string;
    description: string;
    skills: string[];
    benefits?: string;
    requirements?: string;
    location?: string;
    salary?: string;
    type?: string;
    experience?: string;
    organization?: {
      id: string;
      name: string;
      website?: string;
      description?: string;
      industry?: string;
    };
  };
  userInfo?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

interface VideoCallProps {
  applicationData: ApplicationData;
}

/**
 * Main VideoCall Component
 * Orchestrates all video call functionality including:
 * - Media stream management (camera/microphone)
 * - Screen sharing
 * - Recording (camera and screen)
 * - Speech recognition and transcripts
 * - Snapshot capture
 * - Device management
 */
const VideoCall: React.FC<VideoCallProps> = ({ applicationData }) => {
  // Next.js router for navigation
  const router = useRouter();

  // Main state for interview flow
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);

  // Language state
  const [currentLanguage, setCurrentLanguage] = useState(applicationData.preferredLanguage);

  // UI state
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);

  // Mobile detection
  const isMobile = useIsMobile();

  // Video element refs for rendering streams
  const videoRef = useRef<HTMLVideoElement>(null);
  const screenRef = useRef<HTMLVideoElement>(null);

  // Custom hooks for managing different aspects of the video call
  const {
    mediaStream,
    isMuted,
    isCameraOff,
    toggleMute,
    toggleCamera,
    handleDeviceChange,
    stopMediaStream,
  } = useMediaStream(isInterviewStarted);

  const {
    screenStream,
    isScreenSharing,
    toggleScreenShare: _toggleScreenShare,
    stopScreenShare,
  } = useScreenShare();

  // Screen monitoring hook for mandatory screen sharing
  const {
    screenStream: monitoringScreenStream,
    isScreenSharing: isMonitoringScreenSharing,
    screenShareError,
    isScreenShareRequired,
    startMandatoryScreenShare,
    stopScreenShare: stopMonitoringScreenShare,
    setScreenShareRequired,
    isScreenShareActive,
    captureScreenSnapshot,
  } = useScreenMonitoring();

  const {
    isCameraRecording,
    cameraRecordedChunks: _cameraRecordedChunks, // Hidden for production
    startCameraRecording,
    stopCameraRecording: _stopCameraRecording, // Hidden for production
    downloadCameraRecording: _downloadCameraRecording, // Hidden for production
    isScreenRecording,
    screenRecordedChunks: _screenRecordedChunks,
    startScreenRecording,
    stopScreenRecording: _stopScreenRecording,
    downloadScreenRecording: _downloadScreenRecording,
    stopAllRecordings,
  } = useRecording();

  const { transcriptMessages, stopRecognition, isAITyping } = useSpeechRecognition(
    isInterviewStarted,
    isMuted,
    applicationData.uuid
  );

  const {
    takeSnapshot,
    takeMonitoringSnapshot,
    canvasRef,
    isUploading: isUploadingSnapshot,
    uploadError: snapshotUploadError,
  } = useSnapshot();

  // Update video refs when streams change
  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
      console.log('Video ref updated with media stream');
    }
  }, [mediaStream]);

  useEffect(() => {
    if (screenRef.current) {
      // Prioritize monitoring screen stream over regular screen sharing
      const streamToUse = monitoringScreenStream || screenStream;
      if (streamToUse) {
        screenRef.current.srcObject = streamToUse;
        console.log(
          'Screen ref updated with stream:',
          monitoringScreenStream ? 'monitoring' : 'regular'
        );
      }
    }
  }, [screenStream, monitoringScreenStream]);

  // Simulate speaking detection for demo purposes
  useEffect(() => {
    if (!isInterviewStarted) return;

    const speakingInterval = setInterval(() => {
      // Simulate random user speaking
      if (Math.random() > 0.8) {
        setIsUserSpeaking(true);
        setTimeout(() => setIsUserSpeaking(false), 1000);
      }

      // Simulate random AI speaking
      if (Math.random() > 0.9) {
        setIsAISpeaking(true);
        setTimeout(() => setIsAISpeaking(false), 1500);
      }
    }, 2000);

    return () => clearInterval(speakingInterval);
  }, [isInterviewStarted]);

  // Enhanced monitoring based on session instructions
  useEffect(() => {
    if (!isInterviewStarted || !applicationData.sessionInstruction) return;

    const { sessionInstruction } = applicationData;
    const intervals: NodeJS.Timeout[] = [];

    // Screen monitoring
    if (
      sessionInstruction.screenMonitoring &&
      sessionInstruction.screenMonitoringMode === 'photo'
    ) {
      const interval = sessionInstruction.screenMonitoringInterval || 30;
      const screenMonitoringInterval = setInterval(async () => {
        console.log(`Screen monitoring snapshot taken at: ${new Date().toISOString()}`);
        try {
          // Use the monitoring screen stream capture function
          const imageData = await captureScreenSnapshot();
          if (imageData) {
            await uploadScreenImage(applicationData.id, imageData);
            console.log('Screen monitoring image uploaded successfully');
          }
        } catch (error) {
          console.error('Error capturing/uploading screen monitoring image:', error);
        }
      }, interval * 1000);
      intervals.push(screenMonitoringInterval);
    }

    // Camera monitoring - Photo mode
    if (
      sessionInstruction.cameraMonitoring &&
      sessionInstruction.cameraMonitoringMode === 'photo'
    ) {
      const interval = sessionInstruction.cameraMonitoringInterval || 30;
      const cameraMonitoringInterval = setInterval(async () => {
        console.log(`Camera monitoring snapshot taken at: ${new Date().toISOString()}`);
        if (videoRef.current) {
          await takeMonitoringSnapshot(videoRef, applicationData.id, 'camera');
        }
      }, interval * 1000);
      intervals.push(cameraMonitoringInterval);
    }

    // Camera monitoring - Video mode (TODO: Implementation pending)
    if (
      sessionInstruction.cameraMonitoring &&
      sessionInstruction.cameraMonitoringMode === 'video'
    ) {
      // TODO: Implement automatic video recording and upload for camera monitoring
      console.log('Camera video monitoring mode - Implementation pending');
      console.log('This will automatically record and upload video segments to the server');
      // Future implementation:
      // - Start continuous recording in chunks (e.g., 5-minute segments)
      // - Automatically upload each chunk to the server
      // - Handle recording failures and retries
      // - Optimize video compression and quality
    }

    // Screen monitoring - Video mode
    if (
      sessionInstruction.screenMonitoring &&
      sessionInstruction.screenMonitoringMode === 'video' &&
      screenStream
    ) {
      console.log('Starting continuous screen recording for monitoring');
      startScreenRecording(screenStream);
    }

    return () => {
      intervals.forEach(clearInterval);
    };
  }, [
    isInterviewStarted,
    applicationData,
    mediaStream,
    screenStream,
    takeMonitoringSnapshot,
    captureScreenSnapshot,
    startCameraRecording,
    startScreenRecording,
    videoRef,
    screenRef,
  ]);

  // Legacy monitoring - kept for backward compatibility
  useEffect(() => {
    if (!isInterviewStarted || applicationData.sessionInstruction) return;

    const snapshotInterval = setInterval(() => {
      console.log('Periodic snapshot taken at:', new Date().toISOString());
      // Note: This just logs, doesn't actually take snapshots to avoid downloads
    }, 30000);

    return () => clearInterval(snapshotInterval);
  }, [isInterviewStarted, applicationData.sessionInstruction]);

  // Start interview handler
  const startInterview = useCallback(async () => {
    try {
      // Check if screen monitoring is required
      if (applicationData.sessionInstruction?.screenMonitoring) {
        setScreenShareRequired(true);

        // Start mandatory screen sharing before allowing interview to start
        await startMandatoryScreenShare();
        console.log('Screen monitoring started for interview');
      }

      setIsInterviewStarted(true);
      console.log('Interview started');
    } catch (error) {
      console.error('Failed to start interview:', error);
      // Don't start interview if screen sharing failed
      alert(
        'Screen sharing is required for this interview. Please allow screen sharing to continue.'
      );
    }
  }, [applicationData.sessionInstruction, setScreenShareRequired, startMandatoryScreenShare]);

  // End call handler - cleanup all resources
  const endCall = useCallback(() => {
    // Stop all media streams
    stopMediaStream();
    stopScreenShare();
    stopMonitoringScreenShare(); // Stop monitoring screen share

    // Stop all recordings
    stopAllRecordings();

    // Stop speech recognition
    stopRecognition();

    // Reset screen monitoring requirement
    setScreenShareRequired(false);

    // Navigate back to my applications page
    router.push('/my-applications');
  }, [
    stopMediaStream,
    stopScreenShare,
    stopMonitoringScreenShare,
    stopAllRecordings,
    stopRecognition,
    setScreenShareRequired,
    router,
  ]);

  // Take snapshot handler - captures from current video source (Hidden for production)
  const _handleTakeSnapshot = useCallback(() => {
    const currentVideoRef = isScreenSharing ? screenRef : videoRef;
    takeSnapshot(currentVideoRef);
  }, [isScreenSharing, takeSnapshot]);

  // Recording handlers that pass the appropriate streams (Hidden for production)
  const _handleStartCameraRecording = useCallback(() => {
    startCameraRecording(mediaStream);
  }, [startCameraRecording, mediaStream]);

  const _handleStartScreenRecording = useCallback(() => {
    startScreenRecording(screenStream);
  }, [startScreenRecording, screenStream]);

  // Language update handler
  const handleLanguageChange = useCallback(
    async (languageCode: string) => {
      try {
        await updateJobApplicationLanguage(applicationData.uuid, languageCode);
        setCurrentLanguage(languageCode);

        // Update the applicationData object for consistency
        applicationData.preferredLanguage = languageCode;
      } catch (error) {
        console.error('Failed to update language:', error);
        throw error; // Re-throw to let the component handle the error notification
      }
    },
    [applicationData]
  );

  // Monitor screen sharing during interview for mandatory monitoring
  useEffect(() => {
    if (!isInterviewStarted || !applicationData.sessionInstruction?.screenMonitoring) return;

    // Check if screen share is still active every 5 seconds
    const checkInterval = setInterval(() => {
      if (!isScreenShareActive()) {
        console.error('Screen sharing stopped during interview - pausing interview');
        setIsInterviewStarted(false);
        alert(
          'Screen sharing has stopped. The interview has been paused. Please restart screen sharing to continue.'
        );
      }
    }, 5000);

    return () => clearInterval(checkInterval);
  }, [isInterviewStarted, applicationData.sessionInstruction, isScreenShareActive]);

  // Show start screen if interview hasn't started yet
  if (!isInterviewStarted) {
    return (
      <InterviewStartScreen
        onStartInterview={startInterview}
        onCancel={() => window.history.back()}
        applicationData={applicationData}
        onLanguageChange={handleLanguageChange}
      />
    );
  }

  return (
    <div className="h-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Header with status indicators */}
      <header className="flex items-center justify-between p-4 bg-card border-b border-border flex-shrink-0">
        <div className="flex items-center space-x-3">
          <h1 className="text-lg font-semibold text-foreground">
            {applicationData.jobDetails.title} - Interview
          </h1>

          {/* Monitoring status indicators - Short versions with proper icons */}
          {applicationData.sessionInstruction?.screenMonitoring && (
            <span className="px-2 py-1 bg-purple-500 text-white text-xs rounded flex items-center gap-1">
              <Monitor className="w-3 h-3" />
              {applicationData.sessionInstruction.screenMonitoringMode === 'photo' ? (
                <Camera className="w-3 h-3" />
              ) : (
                <Video className="w-3 h-3" />
              )}
            </span>
          )}
          {applicationData.sessionInstruction?.cameraMonitoring && (
            <span className="px-2 py-1 bg-orange-500 text-white text-xs rounded flex items-center gap-1">
              <Camera className="w-3 h-3" />
              {applicationData.sessionInstruction.cameraMonitoringMode === 'photo' ? (
                <Camera className="w-3 h-3" />
              ) : (
                <Video className="w-3 h-3" />
              )}
            </span>
          )}

          {/* Status indicators - Short versions with proper icons */}
          {isScreenSharing && (
            <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded animate-pulse flex items-center gap-1">
              <MonitorPlay className="w-3 h-3" />
              <span>Share</span>
            </span>
          )}
          {isCameraRecording && (
            <span className="px-2 py-1 bg-destructive text-destructive-foreground text-xs rounded animate-pulse flex items-center gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>Rec</span>
            </span>
          )}
          {isScreenRecording && (
            <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded animate-pulse flex items-center gap-1">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span>Screen</span>
            </span>
          )}
        </div>

        {/* Language Selector, Theme Toggle and Timer */}
        <div className="flex items-center space-x-3">
          <InterviewLanguageSelector
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
            disabled={false}
          />

          <ThemeToggle />

          {/* Timer display */}
          <TimerDisplay
            totalQuestions={applicationData.instructionsForAi?.totalQuestions}
            duration={applicationData.sessionInstruction.duration}
          />
        </div>
      </header>

      {/* Main Content Area - Responsive layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Mobile Layout */}
        {isMobile ? (
          <>
            {/* Top Section - Camera Views (40% height, 50% user + 50% AI) */}
            <div className="w-full h-[40%] flex bg-muted">
              {/* User Camera - 50% */}
              <div className="w-1/2 h-full relative bg-muted">
                <UserVideoFeed
                  videoRef={videoRef}
                  isCameraOff={isCameraOff}
                  isUserSpeaking={isUserSpeaking}
                />

                {/* Status Indicators */}
                <div className="absolute top-2 left-2 flex flex-col space-y-1 z-10">
                  {isMuted && (
                    <div className="bg-destructive text-destructive-foreground px-1 py-1 rounded text-xs">
                      Muted
                    </div>
                  )}
                  {isCameraRecording && (
                    <div className="bg-destructive text-destructive-foreground px-1 py-1 rounded text-xs animate-pulse">
                      ● Rec
                    </div>
                  )}
                </div>

                {/* Screen Share Overlay (when active) */}
                {((isScreenSharing && screenStream) ||
                  (isMonitoringScreenSharing && monitoringScreenStream)) && (
                  <div className="absolute inset-2 rounded-lg overflow-hidden border-2 border-primary shadow-lg z-15">
                    <video
                      ref={screenRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-contain bg-muted"
                    />
                    <div className="absolute top-1 left-1 bg-primary px-1 py-0.5 rounded text-xs text-primary-foreground">
                      {isMonitoringScreenSharing ? 'Screen Monitoring' : 'Screen Share'}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Camera - 50% */}
              <div className="w-1/2 h-full">
                <AIVideoFeed isAISpeaking={isAISpeaking} />
              </div>
            </div>

            {/* Bottom Section - Chat (60% height) */}
            <div className="w-full h-[60%] bg-card border-t border-border">
              <ChatTranscript messages={transcriptMessages} isAITyping={isAITyping} />
            </div>
          </>
        ) : (
          /* Desktop Layout - 60% video + 40% chat */
          <>
            {/* Left Side - Video Area - 60% width */}
            <div className="w-[60%] relative bg-muted overflow-hidden">
              {/* Main User Camera */}
              <div className="w-full h-full relative flex items-center justify-center">
                {/* 
                  Video Layout Hierarchy:
                  - User Video: Always full screen/area (base layer)
                  - AI Video: Always top-right corner (z-20)
                  - Screen Share: Always bottom-right corner when active (z-15)
                  - Status Indicators: Top-left corner (z-10)
                */}
                <UserVideoFeed
                  videoRef={videoRef}
                  isCameraOff={isCameraOff}
                  isUserSpeaking={isUserSpeaking}
                />

                {/* Status Indicators */}
                <div className="absolute top-4 left-4 flex flex-col space-y-2 z-10">
                  {isMuted && (
                    <div className="bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs">
                      Muted
                    </div>
                  )}
                  {isCameraRecording && (
                    <div className="bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs animate-pulse">
                      ● Recording
                    </div>
                  )}
                </div>

                {/* AI Video Feed - Always Top Right Corner of User Video */}
                <div className="absolute top-4 right-4 w-32 h-24 md:w-48 md:h-36 z-20">
                  <AIVideoFeed isAISpeaking={isAISpeaking} />
                </div>

                {/* Screen Share - Always Bottom Right Corner of User Video (when active) */}
                {((isScreenSharing && screenStream) ||
                  (isMonitoringScreenSharing && monitoringScreenStream)) && (
                  <div className="absolute bottom-4 right-4 w-48 h-32 md:w-64 md:h-40 rounded-lg overflow-hidden border-2 border-primary shadow-lg z-15">
                    <video
                      ref={screenRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-contain bg-muted"
                    />
                    {/* Screen share label */}
                    <div className="absolute top-1 left-1 bg-primary px-2 py-1 rounded text-xs text-primary-foreground">
                      {isMonitoringScreenSharing ? 'Screen Monitoring' : 'Screen Share'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side - Chat Transcript - 40% width */}
            <div className="w-[40%] bg-card border-l border-border flex-shrink-0">
              <ChatTranscript messages={transcriptMessages} isAITyping={isAITyping} />
            </div>
          </>
        )}

        {/* Monitoring Status Indicators (for both layouts) */}
        {(applicationData.sessionInstruction?.cameraMonitoring ||
          applicationData.sessionInstruction?.screenMonitoring) && (
          <div className="absolute top-4 right-4 flex flex-col space-y-2 z-10">
            {/* Screen monitoring requirement indicator */}
            {applicationData.sessionInstruction?.screenMonitoring &&
              isScreenShareRequired &&
              !isMonitoringScreenSharing && (
                <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs animate-pulse">
                  Screen sharing required for monitoring
                </div>
              )}
            {/* Screen monitoring active indicator */}
            {applicationData.sessionInstruction?.screenMonitoring && isMonitoringScreenSharing && (
              <div className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                Screen monitoring active
              </div>
            )}
            {/* Screen sharing error */}
            {screenShareError && (
              <div className="bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs">
                {screenShareError}
              </div>
            )}

            {isUploadingSnapshot && (
              <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs animate-pulse">
                Uploading monitoring data...
              </div>
            )}
            {snapshotUploadError && (
              <div className="bg-destructive text-destructive-foreground px-2 py-1 rounded text-xs">
                Upload error: {snapshotUploadError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls Panel - Always at bottom, separate from content */}
      <div className="bg-card border-t border-border p-3 md:p-4 flex-shrink-0">
        <div className="flex justify-center items-center space-x-2">
          {/* Main Media Controls */}
          <MediaControls
            isMuted={isMuted}
            isCameraOff={isCameraOff}
            onToggleMute={toggleMute}
            onToggleCamera={toggleCamera}
            onEndCall={endCall}
            onShowDeviceSelector={() => setShowDeviceSelector(true)}
          />
        </div>
      </div>

      {/* Device Selector Modal */}
      {showDeviceSelector && (
        <DeviceSelector
          onClose={() => setShowDeviceSelector(false)}
          onDeviceChange={handleDeviceChange}
        />
      )}

      {/* Hidden canvas for snapshot functionality */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Monitoring Information Footer */}
      {(applicationData.sessionInstruction?.screenMonitoring ||
        applicationData.sessionInstruction?.cameraMonitoring) && (
        <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200 text-xs text-yellow-800 flex items-center justify-center">
          <CheckCircle className="w-4 h-4 mr-2 text-yellow-600" />
          <span>
            This session includes monitoring features for security and assessment purposes.
            {applicationData.sessionInstruction?.screenMonitoring &&
              ` Screen: ${applicationData.sessionInstruction.screenMonitoringMode}`}
            {applicationData.sessionInstruction?.cameraMonitoring &&
              ` | Camera: ${applicationData.sessionInstruction.cameraMonitoringMode}`}
          </span>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
```

## Pre-Session Components (`src/app/(interview)/interview/[uuid]/_components`)

### `custom-react-mic.tsx`

- Wrapper around `react-mic` that handles device switching and permission errors.

```tsx
// File: src/app/(interview)/interview/[uuid]/_components/custom-react-mic.tsx
'use client';

import { useCallback, useEffect, useState } from 'react';
import { ReactMic } from 'react-mic';

interface CustomReactMicProps {
  record: boolean;
  deviceId?: string | null;
  className?: string;
  onStop: (recordedBlob: {
    blob: Blob;
    blobURL: string;
    startTime: number;
    stopTime: number;
  }) => void;
  onData: (recordedData: unknown) => void;
  onError: (err: Error) => void;
  strokeColor?: string;
  backgroundColor?: string;
  mimeType?: string;
  visualSetting?: string;
}

export function CustomReactMic({
  record,
  deviceId,
  className,
  onStop,
  onData,
  onError,
  strokeColor = '#09f',
  backgroundColor = '#f0f0f0',
  mimeType = 'audio/webm' as const,
  visualSetting = 'frequencyBars' as const,
}: CustomReactMicProps) {
  const [key, setKey] = useState<number>(0);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  const initializeAudioStream = useCallback(async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          'getUserMedia is not supported in this browser or environment. Please use a modern browser with HTTPS or run on localhost.'
        );
      }

      if (audioStream) {
        // Stop any existing audio tracks
        audioStream.getTracks().forEach((track) => track.stop());
      }

      // Request access to the microphone with specified device if available
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
        video: false,
      });

      setAudioStream(stream);

      // Force re-mount of ReactMic component with new device
      setKey((prevKey) => prevKey + 1);
    } catch (err) {
      const error = err as Error;

      // Provide more helpful error messages
      let errorMessage = error.message;
      if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please ensure a microphone is connected.';
      } else if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone access denied. Please allow microphone permissions.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Microphone is not supported in this browser.';
      }

      onError(new Error(errorMessage));
    }
  }, [deviceId, audioStream, onError]);

  // Initialize audio stream when deviceId changes
  useEffect(() => {
    initializeAudioStream();

    // Cleanup when unmounting
    return () => {
      if (audioStream) {
        audioStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [deviceId, initializeAudioStream, audioStream]);

  return (
    <ReactMic
      key={key}
      record={record}
      className={className}
      onStop={onStop}
      onData={onData}
      strokeColor={strokeColor}
      backgroundColor={backgroundColor}
      mimeType={mimeType as 'audio/webm' | 'audio/wav' | undefined}
      visualSetting={visualSetting as 'frequencyBars' | 'sinewave' | undefined}
    />
  );
}
```

### `device-check.tsx`

- Guided camera/microphone check with live preview and audio recording test.

```tsx
// File: src/app/(interview)/interview/[uuid]/_components/device-check.tsx
'use client';

import { Check, Mic, RefreshCw, Settings, Video } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { CustomReactMic } from './custom-react-mic';
import { MediaDeviceSelector } from './media-device-selector';
import { MediaUnsupportedFallback } from './media-unsupported-fallback';

interface DeviceCheckProps {
  onComplete: (cameraChecked: boolean, microphoneChecked: boolean) => void;
  initialVideoDeviceId?: string | null;
  initialAudioDeviceId?: string | null;
  onDeviceChange?: (videoDeviceId: string | null, audioDeviceId: string | null) => void;
}

export function DeviceCheck({
  onComplete,
  initialVideoDeviceId,
  initialAudioDeviceId,
  onDeviceChange,
}: DeviceCheckProps) {
  const [cameraChecked, setCameraChecked] = useState(false);
  const [microphoneChecked, setMicrophoneChecked] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [microphoneError, setMicrophoneError] = useState<string | null>(null);
  const [selectedVideoDeviceId, setSelectedVideoDeviceId] = useState<string | null>(
    initialVideoDeviceId || null
  );
  const [selectedAudioDeviceId, setSelectedAudioDeviceId] = useState<string | null>(
    initialAudioDeviceId || null
  );
  const [showDeviceSelector, setShowDeviceSelector] = useState(false);
  const [isMediaSupported, setIsMediaSupported] = useState<boolean | null>(null);

  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTimeout, setRecordingTimeout] = useState<NodeJS.Timeout | null>(null);

  const webcamRef = useRef<Webcam>(null);

  // Check if getUserMedia is supported on component mount
  useEffect(() => {
    const checkMediaSupport = () => {
      const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      setIsMediaSupported(supported);
    };

    checkMediaSupport();
  }, []);

  // Update parent component when checks are completed
  useEffect(() => {
    onComplete(cameraChecked, microphoneChecked);
  }, [cameraChecked, microphoneChecked, onComplete]);

  // Clean up recording timeout when unmounting
  useEffect(() => {
    return () => {
      if (recordingTimeout) {
        clearTimeout(recordingTimeout);
      }
    };
  }, [recordingTimeout]);

  const handleCameraCheck = useCallback(() => {
    setCameraError(null);

    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError(
        'Camera access is not supported in this browser or environment. Please use a modern browser with HTTPS or run on localhost.'
      );
      return;
    }

    setShowCamera(true);

    const videoConstraints: MediaStreamConstraints = {
      video: selectedVideoDeviceId ? { deviceId: { exact: selectedVideoDeviceId } } : true,
    };

    navigator.mediaDevices
      .getUserMedia(videoConstraints)
      .then(() => {
        // The Webcam component will handle the stream
        // Just mark as successful after showing the camera feed
        setTimeout(() => {
          setCameraChecked(true);
        }, 2000);
      })
      .catch((err: Error) => {
        let errorMessage = `Error accessing camera: ${err.message}`;

        // Provide more helpful error messages based on common error types
        if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please ensure a camera is connected to your device.';
        } else if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera permissions and try again.';
        } else if (err.name === 'NotSupportedError') {
          errorMessage = 'Camera is not supported in this browser. Please use a modern browser.';
        } else if (err.message.includes('getUserMedia is not implemented')) {
          errorMessage = 'Camera access requires HTTPS or localhost. Please check your connection.';
        }

        setCameraError(errorMessage);
        setShowCamera(false);
      });
  }, [selectedVideoDeviceId]);

  const handleMicrophoneCheck = useCallback(() => {
    setMicrophoneError(null);
    setAudioBlob(null);

    // Check if getUserMedia is supported
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicrophoneError(
        'Microphone access is not supported in this browser or environment. Please use a modern browser with HTTPS or run on localhost.'
      );
      return;
    }

    const audioConstraints: MediaStreamConstraints = {
      audio: selectedAudioDeviceId ? { deviceId: { exact: selectedAudioDeviceId } } : true,
    };

    // Request microphone permission first
    navigator.mediaDevices
      .getUserMedia(audioConstraints)
      .then(() => {
        // Start recording with ReactMic once we have permission
        setIsRecording(true);

        // Auto-stop recording after 5 seconds
        const timeout = setTimeout(() => {
          setIsRecording(false);
        }, 5000);

        setRecordingTimeout(timeout);
      })
      .catch((err: Error) => {
        let errorMessage = `Error accessing microphone: ${err.message}`;

        // Provide more helpful error messages based on common error types
        if (err.name === 'NotFoundError') {
          errorMessage =
            'No microphone found. Please ensure a microphone is connected to your device.';
        } else if (err.name === 'NotAllowedError') {
          errorMessage =
            'Microphone access denied. Please allow microphone permissions and try again.';
        } else if (err.name === 'NotSupportedError') {
          errorMessage =
            'Microphone is not supported in this browser. Please use a modern browser.';
        } else if (err.message.includes('getUserMedia is not implemented')) {
          errorMessage =
            'Microphone access requires HTTPS or localhost. Please check your connection.';
        }

        setMicrophoneError(errorMessage);
      });
  }, [selectedAudioDeviceId]);

  // When camera check is complete, clean up the camera stream
  useEffect(() => {
    if (cameraChecked && showCamera) {
      setShowCamera(false);
      if (webcamRef.current?.video) {
        const video = webcamRef.current.video as HTMLVideoElement;
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
      }
    }
  }, [cameraChecked, showCamera]);

  return (
    <div className="space-y-4">
      {/* Show fallback if media is not supported */}
      {isMediaSupported === false && (
        <MediaUnsupportedFallback
          onProceedAnyway={() => {
            // Mark both as checked to allow proceeding
            setCameraChecked(true);
            setMicrophoneChecked(true);
          }}
        />
      )}

      {/* Show normal device checks if media is supported */}
      {isMediaSupported === true && (
        <>
          {/* Camera check section */}
          <div className="flex flex-col items-center">
            <Button
              size="lg"
              className="gap-2 mb-2"
              onClick={handleCameraCheck}
              disabled={cameraChecked}
              variant={cameraChecked ? 'outline' : 'default'}
            >
              {cameraChecked ? (
                <>
                  <Check className="h-5 w-5 text-primary" /> Camera Working
                </>
              ) : (
                <>
                  <Video className="h-5 w-5" /> Check Camera
                </>
              )}
            </Button>

            {cameraError && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{cameraError}</AlertDescription>
              </Alert>
            )}

            {showCamera && !cameraChecked && (
              <div className="relative mt-2 rounded-md overflow-hidden border border-muted">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  width={400}
                  height={300}
                  videoConstraints={
                    selectedVideoDeviceId
                      ? { deviceId: selectedVideoDeviceId }
                      : { facingMode: 'user' }
                  }
                  className="rounded-md"
                />
              </div>
            )}
          </div>

          {/* Microphone check section */}
          <div className="flex flex-col items-center">
            <Button
              size="lg"
              className="gap-2 mb-2"
              onClick={handleMicrophoneCheck}
              disabled={microphoneChecked || isRecording}
              variant={microphoneChecked ? 'outline' : isRecording ? 'secondary' : 'default'}
            >
              {microphoneChecked ? (
                <>
                  <Check className="h-5 w-5 text-primary" /> Microphone Working
                </>
              ) : isRecording ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" /> Recording...
                </>
              ) : (
                <>
                  <Mic className="h-5 w-5" /> Check Microphone
                </>
              )}
            </Button>

            {microphoneError && (
              <Alert variant="destructive" className="mt-2">
                <AlertDescription>{microphoneError}</AlertDescription>
              </Alert>
            )}

            <div className="w-full max-w-xs mt-2">
              {/* Show the ReactMic component only during recording, hide once test is complete */}
              <div style={{ display: isRecording ? 'block' : 'none' }}>
                <CustomReactMic
                  record={isRecording}
                  deviceId={selectedAudioDeviceId}
                  className="w-full h-16 rounded-md"
                  onStop={(recordedBlob: {
                    blob: Blob;
                    blobURL: string;
                    startTime: number;
                    stopTime: number;
                  }) => {
                    setAudioBlob(recordedBlob.blob);

                    // Check if the recorded blob has significant audio data
                    const blobSize = recordedBlob.blob.size;
                    const recordingDuration = recordedBlob.stopTime - recordedBlob.startTime;

                    // If the blob is too small, it might not have captured significant sound
                    if (blobSize < 1000 && recordingDuration > 2000) {
                      setMicrophoneError(
                        'No significant audio detected. Please check your microphone and try again.'
                      );
                      return;
                    }

                    // Mark microphone check as successful
                    setMicrophoneChecked(true);
                  }}
                  onData={() => {}}
                  onError={(err: Error) => {
                    setMicrophoneError(
                      `Error accessing microphone: ${err.message || 'Unknown error'}`
                    );
                    setIsRecording(false);
                  }}
                  strokeColor="#09f"
                  backgroundColor="#f0f0f0"
                  mimeType="audio/webm"
                  visualSetting="frequencyBars"
                />
              </div>

              {isRecording && (
                <p className="text-xs text-center mt-1 text-muted-foreground">
                  Please speak into your microphone
                </p>
              )}

              {!isRecording && !microphoneChecked && audioBlob && (
                <div className="mt-2 text-center">
                  <p className="text-xs font-medium">Processing audio...</p>
                </div>
              )}
            </div>
          </div>

          {/* Device Settings Dialog */}
          <Dialog open={showDeviceSelector} onOpenChange={setShowDeviceSelector}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 mt-4 w-full">
                <Settings className="h-5 w-5" /> Configure Devices
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[500px]">
              <DialogTitle className="flex gap-2">
                <Settings className="h-5 w-5" /> Media Device Settings
              </DialogTitle>
              <MediaDeviceSelector
                initialAudioDeviceId={selectedAudioDeviceId || undefined}
                initialVideoDeviceId={selectedVideoDeviceId || undefined}
                onDevicesSelected={(videoDeviceId, audioDeviceId) => {
                  setSelectedVideoDeviceId(videoDeviceId);
                  setSelectedAudioDeviceId(audioDeviceId);
                  // Notify parent component about device changes
                  if (onDeviceChange) {
                    onDeviceChange(videoDeviceId, audioDeviceId);
                  }
                  setShowDeviceSelector(false);
                  // Reset checks when devices change
                  setCameraChecked(false);
                  setMicrophoneChecked(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </>
      )}

      {/* Loading state */}
      {isMediaSupported === null && (
        <div className="text-center py-8">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Checking media device support...</p>
        </div>
      )}
    </div>
  );
}
```

### `interview-client.tsx`

- Entry point for `/interview/[uuid]`, stores preferred devices and routes to the session.

```tsx
// File: src/app/(interview)/interview/[uuid]/_components/interview-client.tsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

import { DeviceCheck } from './device-check';

export function InterviewClient() {
  const [cameraChecked, setCameraChecked] = useState(false);
  const [micChecked, setMicChecked] = useState(false);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string | null>(null);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const uuid = params.uuid as string;

  const handleDeviceCheckComplete = (camera: boolean, microphone: boolean) => {
    setCameraChecked(camera);
    setMicChecked(microphone);
  };

  // Save device preferences to localStorage when they change
  useEffect(() => {
    if (selectedVideoDevice) {
      localStorage.setItem('preferredVideoDevice', selectedVideoDevice);
    }
    if (selectedAudioDevice) {
      localStorage.setItem('preferredAudioDevice', selectedAudioDevice);
    }
  }, [selectedVideoDevice, selectedAudioDevice]);

  // Load device preferences from localStorage on component mount
  useEffect(() => {
    const savedVideoDevice = localStorage.getItem('preferredVideoDevice');
    const savedAudioDevice = localStorage.getItem('preferredAudioDevice');

    if (savedVideoDevice) setSelectedVideoDevice(savedVideoDevice);
    if (savedAudioDevice) setSelectedAudioDevice(savedAudioDevice);
  }, []);

  const handleStartInterview = () => {
    router.push(`/interview/${uuid}/session`);
  };

  const bothDevicesChecked = cameraChecked && micChecked;

  return (
    <div className="space-y-6">
      <div className="relative bg-muted/50 p-6 rounded-lg text-center overflow-hidden">
        <div className="relative z-10">
          <div className="mx-auto mb-4 flex flex-col items-center">
            <h2 className="text-2xl font-bold mt-4">Ready to begin your interview?</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Our AI-powered system will guide you through a series of questions to assess your skills
            and experience for this position. Please ensure your camera and microphone are working
            properly.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <DeviceCheck
            onComplete={handleDeviceCheckComplete}
            initialVideoDeviceId={selectedVideoDevice}
            initialAudioDeviceId={selectedAudioDevice}
            onDeviceChange={(videoId: string | null, audioId: string | null) => {
              setSelectedVideoDevice(videoId);
              setSelectedAudioDevice(audioId);
            }}
          />

          <Button
            size="lg"
            variant="default"
            className="w-full mt-4"
            disabled={!bothDevicesChecked}
            onClick={handleStartInterview}
          >
            {bothDevicesChecked ? 'Start Interview' : 'Check Devices First'}
          </Button>
        </div>
      </div>

      <div className="bg-muted/30 p-6 rounded-lg">
        <h3 className="font-medium mb-2">Interview Tips</h3>
        <ul className="list-disc list-inside space-y-2 text-muted-foreground">
          <li>Find a quiet place with good lighting and minimal background noise</li>
          <li>Dress professionally as you would for an in-person interview</li>
          <li>Speak clearly and take your time to answer thoughtfully</li>
          <li>Have your resume and relevant documents nearby for reference</li>
          <li>The interview will take approximately 15-20 minutes to complete</li>
        </ul>
      </div>
    </div>
  );
}
```

### `media-device-selector.tsx`

- Device picker dialog used by the pre-session workflow.

```tsx
// File: src/app/(interview)/interview/[uuid]/_components/media-device-selector.tsx
'use client';

import { Check, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface MediaDevice {
  deviceId: string;
  label: string;
}

interface MediaDeviceSelectorProps {
  onDevicesSelected: (videoDeviceId: string | null, audioDeviceId: string | null) => void;
  initialVideoDeviceId?: string;
  initialAudioDeviceId?: string;
}

export function MediaDeviceSelector({
  onDevicesSelected,
  initialVideoDeviceId,
  initialAudioDeviceId,
}: MediaDeviceSelectorProps) {
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>(
    initialVideoDeviceId || ''
  );
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>(
    initialAudioDeviceId || ''
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to enumerate devices
  const enumerateDevices = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // First request permissions to ensure device labels are accessible
      await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

      const devices = await navigator.mediaDevices.enumerateDevices();

      const videoInputs = devices
        .filter((device) => device.kind === 'videoinput')
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${videoDevices.length + 1}`,
        }));

      const audioInputs = devices
        .filter((device) => device.kind === 'audioinput')
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${audioDevices.length + 1}`,
        }));

      setVideoDevices(videoInputs);
      setAudioDevices(audioInputs);

      // Set default devices if not already set
      if (!selectedVideoDevice && videoInputs.length > 0) {
        setSelectedVideoDevice(videoInputs[0].deviceId);
      }

      if (!selectedAudioDevice && audioInputs.length > 0) {
        setSelectedAudioDevice(audioInputs[0].deviceId);
      }
    } catch (err) {
      setError(
        "Error accessing media devices. Please ensure you've granted camera and microphone permissions."
      );
      console.error('Error enumerating devices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    enumerateDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveDeviceSelection = () => {
    onDevicesSelected(selectedVideoDevice || null, selectedAudioDevice || null);
  };

  return (
    <div className="w-full space-y-4">
      {error && <div className="text-destructive text-sm mb-2">{error}</div>}

      <div className="space-y-2">
        <Label htmlFor="camera-select">Camera</Label>
        <Select
          disabled={isLoading || videoDevices.length === 0}
          value={selectedVideoDevice}
          onValueChange={setSelectedVideoDevice}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isLoading ? 'Loading cameras...' : 'Select camera'} />
          </SelectTrigger>
          <SelectContent>
            {videoDevices.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="microphone-select">Microphone</Label>
        <Select
          disabled={isLoading || audioDevices.length === 0}
          value={selectedAudioDevice}
          onValueChange={setSelectedAudioDevice}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isLoading ? 'Loading microphones...' : 'Select microphone'} />
          </SelectTrigger>
          <SelectContent>
            {audioDevices.map((device) => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <Button variant="outline" size="sm" onClick={enumerateDevices} disabled={isLoading}>
          <div className="flex items-center">
            {isLoading ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {isLoading ? 'Refreshing...' : 'Refresh devices'}
          </div>
        </Button>
        <Button
          size="sm"
          onClick={handleSaveDeviceSelection}
          disabled={!selectedVideoDevice || !selectedAudioDevice || isLoading}
        >
          <div className="flex items-center">
            <Check className="h-4 w-4 mr-2" /> Apply settings
          </div>
        </Button>
      </div>
    </div>
  );
}
```

### `media-unsupported-fallback.tsx`

- Fallback card that explains how to enable camera/mic access.

```tsx
// File: src/app/(interview)/interview/[uuid]/_components/media-unsupported-fallback.tsx
import { AlertTriangle, Globe, Shield } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MediaUnsupportedFallbackProps {
  onProceedAnyway?: () => void;
}

export function MediaUnsupportedFallback({ onProceedAnyway }: MediaUnsupportedFallbackProps) {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="w-5 h-5" />
          Media Access Not Available
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Camera and microphone testing is not available</AlertTitle>
          <AlertDescription>
            Your browser or current environment doesn&apos;t support media device access.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <h3 className="font-medium">To enable media access, please try one of the following:</h3>

          <div className="space-y-2">
            {!isHttps && !isLocalhost && (
              <div className="flex items-start gap-3 p-3 bg-primary/10 rounded-lg">
                <Shield className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-primary">Use HTTPS</p>
                  <p className="text-sm text-muted-foreground">
                    Most browsers require a secure connection (HTTPS) to access camera and
                    microphone.
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3 p-3 bg-accent rounded-lg">
              <Globe className="w-5 h-5 text-accent-foreground mt-0.5" />
              <div>
                <p className="font-medium text-accent-foreground">Use a Modern Browser</p>
                <p className="text-sm text-muted-foreground">
                  Ensure you&apos;re using an up-to-date version of Chrome, Firefox, Safari, or
                  Edge.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
              <Shield className="w-5 h-5 text-secondary-foreground mt-0.5" />
              <div>
                <p className="font-medium text-secondary-foreground">Check Browser Permissions</p>
                <p className="text-sm text-muted-foreground">
                  Make sure your browser allows camera and microphone access for this site.
                </p>
              </div>
            </div>
          </div>

          <Alert className="mt-4">
            <AlertDescription>
              <strong>For local development:</strong> Make sure you&apos;re running on localhost or
              127.0.0.1, or use HTTPS with a valid certificate.
            </AlertDescription>
          </Alert>

          {onProceedAnyway && (
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                You can proceed without testing your camera and microphone, but this may affect the
                interview experience.
              </p>
              <Button onClick={onProceedAnyway} variant="outline" className="w-full">
                Proceed Without Media Testing
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### `interview-setup-client.tsx`

- Currently empty placeholder for future setup logic.

```tsx
// File: src/app/(interview)/interview/[uuid]/_components/interview-setup-client.tsx
```

## Route Shells

### `src/app/(interview)/interview/[uuid]/page.tsx`

- Wraps the device check experience.

```tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import { InterviewClient } from './_components/interview-client';

export default function InterviewPage() {
  const job = {
    title: 'Software Engineer',
    companyName: 'Tech Innovations Inc.',
    location: 'Remote',
    skills: ['JavaScript', 'React', 'Node.js'],
    interviewDuration: 30, // in minutes
  };
  return (
    <div className="container px-4 py-8 mx-auto relative">
      <div className="max-w-3xl mx-auto relative z-10">
        <Card className="mb-6 border-border shadow-lg">
          <CardHeader>
            <h1 className="text-3xl font-bold">{job.title} - AI Interview</h1>
            <p className="text-muted-foreground">Virtual interview for {job.companyName}</p>
          </CardHeader>
          <CardContent>
            <InterviewClient />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### `src/app/(interview)/interview/[uuid]/session/page.tsx`

- Fetches application data and renders the live video call.

```tsx
import { notFound } from 'next/navigation';

import { getJobApplicationByUuid } from '@/actions/job-application';

import VideoCall from './_component/video-call';

interface InterviewPageProps {
  params: Promise<{
    uuid: string;
  }>;
}

export default async function InterviewPage({ params }: InterviewPageProps) {
  try {
    const { uuid } = await params;
    const applicationData = await getJobApplicationByUuid(uuid);

    if (!applicationData) {
      notFound();
    }

    return <VideoCall applicationData={applicationData} />;
  } catch (error) {
    console.error('Error fetching interview session:', error);
    notFound();
  }
}
```

### `src/app/(interview)/interview/page.tsx`

- Guard route that immediately 404s.

```tsx
import { notFound } from 'next/navigation';

export default function InterviewPage() {
  return notFound();
}
```

## Supporting Utilities

- `useIsMobile` (`src/hooks/use-mobile.ts`) – switches layout in `video-call.tsx`.
- `availableLanguages` (`src/lib/constants/language-constants.ts`) – language metadata for selectors.
- `job-application` and `ai-interview` actions (`src/actions`) – supply mutations and AI prompts consumed above.

## Usage Notes

- Hooks are re-exported via `src/app/(interview)/interview/[uuid]/session/hooks/index.ts`; import from `'../hooks'` within session components.
- Mandatory monitoring is enforced inside `video-call.tsx`; update both `useScreenMonitoring` and the session instruction wiring if new monitoring modes are added.
- Recording helpers in `useRecording` already assemble downloadable blobs. Re-enable UI controls by uncommenting the hidden buttons in `media-control.tsx` / `video-area.tsx` if you need operator tooling.
