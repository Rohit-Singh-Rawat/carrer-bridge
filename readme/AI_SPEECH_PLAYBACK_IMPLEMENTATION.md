# AI Speech Playback Implementation Guide
## Complete Server-to-Client Audio Flow

This document provides a complete implementation guide for playing AI-generated speech responses, covering everything from server-side text-to-speech (TTS) generation to client-side audio playback.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Server-Side Implementation](#server-side-implementation)
3. [Client-Side Implementation](#client-side-implementation)
4. [Integration with Existing Code](#integration-with-existing-code)
5. [Alternative Approaches](#alternative-approaches)

---

## Architecture Overview

### Flow Diagram

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │ 1. User speaks
       │ 2. Speech → Text (Web Speech API)
       │
       ▼
┌─────────────────┐
│  Next.js API    │
│  /api/ai-chat   │
└──────┬──────────┘
       │ 3. Send text to server
       │
       ▼
┌─────────────────┐
│  AI Service     │
│  (Gemini)       │
└──────┬──────────┘
       │ 4. Generate text response
       │
       ▼
┌─────────────────┐
│  TTS Service    │
│  (Google/Azure) │
└──────┬──────────┘
       │ 5. Convert text → audio
       │
       ▼
┌─────────────────┐
│  Stream Audio   │
│  to Client      │
└──────┬──────────┘
       │ 6. Audio stream
       │
       ▼
┌─────────────┐
│   Client    │
│  Play Audio │
└─────────────┘
```

### Key Components

1. **Server Action**: Generates AI text response
2. **TTS API**: Converts text to audio (Google TTS, Azure TTS, or OpenAI TTS)
3. **Streaming Endpoint**: Streams audio chunks to client
4. **Client Hook**: Manages audio playback and state
5. **Audio Player Component**: Handles UI and playback controls

---

## Server-Side Implementation

### Option 1: Google Cloud Text-to-Speech (Recommended)

#### 1. Install Dependencies

```bash
npm install @google-cloud/text-to-speech
```

#### 2. Create TTS Service

**File**: `src/lib/tts/google-tts.ts`

```typescript
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { Readable } from 'stream';

// Initialize TTS client
const ttsClient = new TextToSpeechClient({
  keyFilename: process.env.GOOGLE_TTS_KEY_FILE, // Optional: path to service account key
  // OR use credentials directly:
  credentials: {
    client_email: process.env.GOOGLE_TTS_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_TTS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
});

export interface TTSOptions {
  text: string;
  languageCode?: string;
  voiceName?: string;
  ssmlGender?: 'NEUTRAL' | 'MALE' | 'FEMALE';
  audioEncoding?: 'MP3' | 'LINEAR16' | 'OGG_OPUS';
  speakingRate?: number; // 0.25 to 4.0
  pitch?: number; // -20.0 to 20.0
}

/**
 * Convert text to speech audio stream
 */
export async function textToSpeechStream(options: TTSOptions): Promise<Readable> {
  const {
    text,
    languageCode = 'en-US',
    voiceName = 'en-US-Neural2-F', // Natural female voice
    ssmlGender = 'FEMALE',
    audioEncoding = 'MP3',
    speakingRate = 1.0,
    pitch = 0.0,
  } = options;

  try {
    // Request TTS synthesis
    const [response] = await ttsClient.synthesizeSpeech({
      input: { text },
      voice: {
        languageCode,
        name: voiceName,
        ssmlGender,
      },
      audioConfig: {
        audioEncoding,
        speakingRate,
        pitch,
      },
    });

    if (!response.audioContent) {
      throw new Error('No audio content received from TTS');
    }

    // Convert buffer to stream
    const audioBuffer = Buffer.from(response.audioContent);
    const stream = new Readable();
    stream.push(audioBuffer);
    stream.push(null); // End stream

    return stream;
  } catch (error) {
    console.error('TTS synthesis error:', error);
    throw error;
  }
}

/**
 * Convert text to speech and return as base64 or buffer
 */
export async function textToSpeechBuffer(options: TTSOptions): Promise<Buffer> {
  const {
    text,
    languageCode = 'en-US',
    voiceName = 'en-US-Neural2-F',
    ssmlGender = 'FEMALE',
    audioEncoding = 'MP3',
    speakingRate = 1.0,
    pitch = 0.0,
  } = options;

  try {
    const [response] = await ttsClient.synthesizeSpeech({
      input: { text },
      voice: {
        languageCode,
        name: voiceName,
        ssmlGender,
      },
      audioConfig: {
        audioEncoding,
        speakingRate,
        pitch,
      },
    });

    if (!response.audioContent) {
      throw new Error('No audio content received from TTS');
    }

    return Buffer.from(response.audioContent);
  } catch (error) {
    console.error('TTS synthesis error:', error);
    throw error;
  }
}

/**
 * Get available voices for a language
 */
export async function getAvailableVoices(languageCode: string = 'en-US') {
  const [result] = await ttsClient.listVoices({
    languageCode,
  });

  return result.voices || [];
}
```

#### 3. Create Streaming API Route

**File**: `src/app/api/v1/ai-speech/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { textToSpeechBuffer } from '@/lib/tts/google-tts';
import { generateAIInterviewResponseWithUuid } from '@/actions/ai-interview';
import type { ConversationMessage } from '@/actions/ai-interview';

/**
 * POST /api/v1/ai-speech
 * 
 * Generates AI response and converts to speech audio
 * Returns audio stream or base64 encoded audio
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      conversationHistory,
      userMessage,
      applicationUuid,
      currentPhase,
      returnAudio = true, // Whether to return audio or just text
      audioFormat = 'mp3', // 'mp3' | 'base64'
    } = body;

    // 1. Generate AI text response
    const aiResponse = await generateAIInterviewResponseWithUuid(
      conversationHistory || [],
      userMessage,
      applicationUuid,
      currentPhase
    );

    if (!aiResponse.success || !aiResponse.nextQuestion) {
      return NextResponse.json(
        { error: 'Failed to generate AI response' },
        { status: 500 }
      );
    }

    // 2. If audio not requested, return text only
    if (!returnAudio) {
      return NextResponse.json({
        text: aiResponse.nextQuestion,
        feedback: aiResponse.feedback,
        phase: aiResponse.phase,
      });
    }

    // 3. Convert text to speech
    const audioBuffer = await textToSpeechBuffer({
      text: aiResponse.nextQuestion,
      languageCode: 'en-US',
      voiceName: 'en-US-Neural2-F',
      audioEncoding: 'MP3',
      speakingRate: 1.0,
    });

    // 4. Return audio based on format
    if (audioFormat === 'base64') {
      return NextResponse.json({
        text: aiResponse.nextQuestion,
        feedback: aiResponse.feedback,
        phase: aiResponse.phase,
        audio: audioBuffer.toString('base64'),
        audioFormat: 'mp3',
      });
    } else {
      // Return audio stream
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length.toString(),
          'X-Text-Response': encodeURIComponent(aiResponse.nextQuestion),
          'X-Feedback': encodeURIComponent(aiResponse.feedback || ''),
        },
      });
    }
  } catch (error) {
    console.error('AI speech generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate speech' },
      { status: 500 }
    );
  }
}
```

#### 4. Create Streaming Endpoint (Alternative)

**File**: `src/app/api/v1/ai-speech-stream/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { textToSpeechStream } from '@/lib/tts/google-tts';
import { generateAIInterviewResponseWithUuid } from '@/actions/ai-interview';

/**
 * POST /api/v1/ai-speech-stream
 * 
 * Streams audio chunks as they're generated
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationHistory, userMessage, applicationUuid, currentPhase } = body;

    // Generate AI response
    const aiResponse = await generateAIInterviewResponseWithUuid(
      conversationHistory || [],
      userMessage,
      applicationUuid,
      currentPhase
    );

    if (!aiResponse.success || !aiResponse.nextQuestion) {
      return new Response('Failed to generate response', { status: 500 });
    }

    // Convert to speech stream
    const audioStream = await textToSpeechStream({
      text: aiResponse.nextQuestion,
      languageCode: 'en-US',
      voiceName: 'en-US-Neural2-F',
      audioEncoding: 'MP3',
    });

    // Return stream with metadata headers
    return new Response(audioStream as any, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'X-Text-Response': encodeURIComponent(aiResponse.nextQuestion),
        'X-Feedback': encodeURIComponent(aiResponse.feedback || ''),
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Streaming error:', error);
    return new Response('Streaming failed', { status: 500 });
  }
}
```

---

### Option 2: Azure Text-to-Speech

#### 1. Install Dependencies

```bash
npm install microsoft-cognitiveservices-speech-sdk
```

#### 2. Create Azure TTS Service

**File**: `src/lib/tts/azure-tts.ts`

```typescript
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';

export interface AzureTTSOptions {
  text: string;
  language?: string;
  voice?: string;
  rate?: string; // e.g., "+0%", "-20%"
  pitch?: string; // e.g., "+0Hz", "+5Hz"
}

/**
 * Convert text to speech using Azure TTS
 */
export async function azureTextToSpeech(
  options: AzureTTSOptions
): Promise<Buffer> {
  const {
    text,
    language = 'en-US',
    voice = 'en-US-AriaNeural', // Natural female voice
    rate = '+0%',
    pitch = '+0Hz',
  } = options;

  const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.AZURE_SPEECH_KEY!,
    process.env.AZURE_SPEECH_REGION!
  );

  speechConfig.speechSynthesisLanguage = language;
  speechConfig.speechSynthesisVoiceName = voice;

  // Create SSML with voice customization
  const ssml = `
    <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${language}">
      <voice name="${voice}">
        <prosody rate="${rate}" pitch="${pitch}">
          ${text}
        </prosody>
      </voice>
    </speak>
  `;

  return new Promise((resolve, reject) => {
    const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

    synthesizer.speakSsmlAsync(
      ssml,
      (result) => {
        synthesizer.close();

        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          const audioBuffer = Buffer.from(result.audioData);
          resolve(audioBuffer);
        } else {
          reject(new Error(`Synthesis failed: ${result.errorDetails}`));
        }
      },
      (error) => {
        synthesizer.close();
        reject(error);
      }
    );
  });
}
```

---

### Option 3: OpenAI Text-to-Speech

#### 1. Install Dependencies

```bash
npm install openai
```

#### 2. Create OpenAI TTS Service

**File**: `src/lib/tts/openai-tts.ts`

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface OpenAITTSOptions {
  text: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  model?: 'tts-1' | 'tts-1-hd';
  speed?: number; // 0.25 to 4.0
}

/**
 * Convert text to speech using OpenAI TTS
 */
export async function openaiTextToSpeech(
  options: OpenAITTSOptions
): Promise<Buffer> {
  const {
    text,
    voice = 'nova', // Natural, expressive voice
    model = 'tts-1-hd', // Higher quality
    speed = 1.0,
  } = options;

  try {
    const mp3 = await openai.audio.speech.create({
      model,
      voice,
      input: text,
      speed,
    });

    // Convert response to buffer
    const arrayBuffer = await mp3.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('OpenAI TTS error:', error);
    throw error;
  }
}
```

---

## Client-Side Implementation

### 1. Create Speech Playback Hook

**File**: `src/app/(interview)/interview/[uuid]/session/hooks/use-speech-playback.ts`

```typescript
import { useState, useCallback, useRef, useEffect } from 'react';

export interface SpeechPlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  error: string | null;
  currentText: string | null;
}

/**
 * Hook to manage AI speech playback
 */
export const useSpeechPlayback = () => {
  const [state, setState] = useState<SpeechPlaybackState>({
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    error: null,
    currentText: null,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  /**
   * Play AI response as speech
   */
  const playSpeech = useCallback(
    async (
      text: string,
      options?: {
        applicationUuid: string;
        conversationHistory?: any[];
        currentPhase?: any;
        useBrowserTTS?: boolean; // Fallback to browser TTS
      }
    ) => {
      const {
        applicationUuid,
        conversationHistory = [],
        currentPhase,
        useBrowserTTS = false,
      } = options || {};

      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        currentText: text,
      }));

      try {
        // Option 1: Use server TTS (recommended)
        if (!useBrowserTTS) {
          const response = await fetch('/api/v1/ai-speech', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              conversationHistory,
              userMessage: '', // Not needed if text is provided
              applicationUuid,
              currentPhase,
              returnAudio: true,
              audioFormat: 'base64', // Get base64 for easier handling
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to generate speech');
          }

          const data = await response.json();

          // Create audio from base64
          const audioData = atob(data.audio);
          const audioArray = new Uint8Array(audioData.length);
          for (let i = 0; i < audioData.length; i++) {
            audioArray[i] = audioData.charCodeAt(i);
          }

          const blob = new Blob([audioArray], { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(blob);

          // Cleanup previous URL
          if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
          }
          audioUrlRef.current = audioUrl;

          // Create and play audio
          const audio = new Audio(audioUrl);
          audioRef.current = audio;

          // Set up event listeners
          audio.onplay = () => {
            setState((prev) => ({
              ...prev,
              isPlaying: true,
              isPaused: false,
              isLoading: false,
            }));
          };

          audio.onpause = () => {
            setState((prev) => ({
              ...prev,
              isPlaying: false,
              isPaused: true,
            }));
          };

          audio.onended = () => {
            setState((prev) => ({
              ...prev,
              isPlaying: false,
              isPaused: false,
            }));
            if (audioUrlRef.current) {
              URL.revokeObjectURL(audioUrlRef.current);
              audioUrlRef.current = null;
            }
          };

          audio.onerror = (error) => {
            setState((prev) => ({
              ...prev,
              error: 'Failed to play audio',
              isLoading: false,
              isPlaying: false,
            }));
            console.error('Audio playback error:', error);
          };

          await audio.play();
        } else {
          // Option 2: Use browser TTS (fallback)
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel(); // Cancel any ongoing speech

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onstart = () => {
              setState((prev) => ({
                ...prev,
                isPlaying: true,
                isLoading: false,
              }));
            };

            utterance.onend = () => {
              setState((prev) => ({
                ...prev,
                isPlaying: false,
              }));
            };

            utterance.onerror = (error) => {
              setState((prev) => ({
                ...prev,
                error: 'Speech synthesis failed',
                isLoading: false,
                isPlaying: false,
              }));
            };

            window.speechSynthesis.speak(utterance);
          } else {
            throw new Error('Speech synthesis not supported');
          }
        }
      } catch (error) {
        console.error('Speech playback error:', error);
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error',
          isLoading: false,
        }));
      }
    },
    []
  );

  /**
   * Pause current playback
   */
  const pauseSpeech = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.pause();
    }
  }, []);

  /**
   * Resume paused playback
   */
  const resumeSpeech = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.resume();
    }
  }, []);

  /**
   * Stop current playback
   */
  const stopSpeech = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setState((prev) => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
    }));
  }, []);

  return {
    ...state,
    playSpeech,
    pauseSpeech,
    resumeSpeech,
    stopSpeech,
  };
};
```

### 2. Create Audio Player Component

**File**: `src/app/(interview)/interview/[uuid]/session/_component/ai-audio-player.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { useSpeechPlayback } from '../hooks/use-speech-playback';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';

interface AIAudioPlayerProps {
  text: string;
  applicationUuid: string;
  conversationHistory?: any[];
  currentPhase?: any;
  autoPlay?: boolean;
  onPlaybackEnd?: () => void;
}

export function AIAudioPlayer({
  text,
  applicationUuid,
  conversationHistory,
  currentPhase,
  autoPlay = false,
  onPlaybackEnd,
}: AIAudioPlayerProps) {
  const {
    isPlaying,
    isPaused,
    isLoading,
    error,
    playSpeech,
    pauseSpeech,
    resumeSpeech,
    stopSpeech,
  } = useSpeechPlayback();

  // Auto-play when text changes
  useEffect(() => {
    if (autoPlay && text && !isPlaying && !isLoading) {
      playSpeech(text, {
        applicationUuid,
        conversationHistory,
        currentPhase,
      });
    }
  }, [text, autoPlay, applicationUuid, conversationHistory, currentPhase]);

  // Handle playback end callback
  useEffect(() => {
    if (!isPlaying && !isLoading && text) {
      onPlaybackEnd?.();
    }
  }, [isPlaying, isLoading, text, onPlaybackEnd]);

  const handleTogglePlay = () => {
    if (isPlaying) {
      pauseSpeech();
    } else if (isPaused) {
      resumeSpeech();
    } else {
      playSpeech(text, {
        applicationUuid,
        conversationHistory,
        currentPhase,
      });
    }
  };

  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-500">
        <VolumeX className="h-4 w-4" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleTogglePlay}
        disabled={isLoading || !text}
        className="h-8 w-8 p-0"
      >
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4" />
        ) : (
          <Play className="h-4 w-4" />
        )}
      </Button>

      {isPlaying && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Volume2 className="h-3 w-3 animate-pulse" />
          <span>Playing...</span>
        </div>
      )}
    </div>
  );
}
```

---

## Integration with Existing Code

### Update Speech Recognition Hook

**File**: `src/app/(interview)/interview/[uuid]/session/hooks/use-speech-recognition.ts`

Add speech playback integration:

```typescript
// Add import
import { useSpeechPlayback } from './use-speech-playback';

// Inside the hook, add:
const {
  playSpeech,
  isPlaying: isSpeechPlaying,
  stopSpeech,
} = useSpeechPlayback();

// In the AI response handler (around line 214):
.then(async (response) => {
  if (response.success && response.nextQuestion) {
    const aiMessage: TranscriptMessage = {
      id: Date.now() + 1,
      type: 'ai',
      text: response.nextQuestion,
      timestamp: new Date(),
    };

    setTranscriptMessages((prev) => [...prev, aiMessage]);

    // ... existing conversation history code ...

    // Auto-play AI response as speech
    await playSpeech(response.nextQuestion, {
      applicationUuid,
      conversationHistory: [...conversationHistory, userConversationMessage],
      currentPhase: response.phase,
    });
  }
})
```

### Update Interview Component

**File**: `src/app/(interview)/interview/[uuid]/session/_component/video-call.tsx` (or wherever transcript is displayed)

Add audio player to AI messages:

```typescript
import { AIAudioPlayer } from './ai-audio-player';

// In the transcript rendering:
{transcriptMessages.map((message) => (
  <div key={message.id} className={message.type === 'ai' ? 'ai-message' : 'user-message'}>
    <p>{message.text}</p>
    {message.type === 'ai' && (
      <AIAudioPlayer
        text={message.text}
        applicationUuid={applicationUuid}
        conversationHistory={conversationHistory}
        currentPhase={currentPhase}
        autoPlay={false} // Set to true for auto-play
      />
    )}
  </div>
))}
```

---

## Alternative Approaches

### 1. Browser-Only TTS (No Server)

If you want to avoid server-side TTS entirely:

```typescript
// Simple browser TTS hook
export const useBrowserTTS = () => {
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return { speak, stop };
};
```

**Pros**: No server cost, instant playback  
**Cons**: Lower quality, limited voice options, browser-dependent

### 2. WebSocket Streaming (Real-time)

For real-time streaming audio:

```typescript
// Server: Stream audio chunks via WebSocket
// Client: Play chunks as they arrive

const ws = new WebSocket('ws://api/ai-speech-stream');
const audioContext = new AudioContext();
const source = audioContext.createBufferSource();

ws.onmessage = async (event) => {
  const audioChunk = await event.data.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(audioChunk);
  // Play chunk immediately
};
```

### 3. Pre-generate Audio (Caching)

Cache audio responses for faster playback:

```typescript
// Server: Cache audio in Redis/S3
// Client: Check cache before generating new audio

const cachedAudio = await getCachedAudio(text);
if (cachedAudio) {
  playAudio(cachedAudio);
} else {
  const newAudio = await generateAudio(text);
  await cacheAudio(text, newAudio);
  playAudio(newAudio);
}
```

---

## Environment Variables

Add to `.env.local`:

```bash
# Google Cloud TTS
GOOGLE_TTS_KEY_FILE=./path/to/service-account-key.json
# OR
GOOGLE_TTS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_TTS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Azure TTS
AZURE_SPEECH_KEY=your-azure-key
AZURE_SPEECH_REGION=your-region

# OpenAI TTS
OPENAI_API_KEY=sk-...
```

---

## Testing

### Test Server Endpoint

```bash
curl -X POST http://localhost:3000/api/v1/ai-speech \
  -H "Content-Type: application/json" \
  -d '{
    "conversationHistory": [],
    "userMessage": "Hello",
    "applicationUuid": "test-uuid",
    "returnAudio": true,
    "audioFormat": "base64"
  }' \
  --output test-audio.mp3
```

### Test Client Hook

```typescript
const { playSpeech } = useSpeechPlayback();

// Test playback
await playSpeech('Hello, this is a test', {
  applicationUuid: 'test-uuid',
  useBrowserTTS: true, // Test browser fallback
});
```

---

## Performance Considerations

1. **Caching**: Cache frequently used phrases
2. **Streaming**: Use streaming for long responses
3. **Compression**: Use MP3 (smaller) vs WAV (larger)
4. **Rate Limiting**: Implement rate limits on TTS API calls
5. **Queue Management**: Queue multiple requests if needed

---

## Error Handling

```typescript
// Graceful fallback chain:
// 1. Try server TTS
// 2. Fall back to browser TTS
// 3. Show text if both fail

try {
  await playSpeech(text, { useBrowserTTS: false });
} catch (error) {
  console.warn('Server TTS failed, using browser TTS');
  try {
    await playSpeech(text, { useBrowserTTS: true });
  } catch (browserError) {
    console.error('All TTS methods failed');
    // Show text only
  }
}
```

---

## Complete Example Flow

```typescript
// 1. User speaks
recognition.onresult = async (event) => {
  const transcript = event.results[event.results.length - 1][0].transcript;
  
  // 2. Send to server
  const aiResponse = await generateAIInterviewResponseWithUuid(
    conversationHistory,
    transcript,
    applicationUuid
  );
  
  // 3. Display text
  setTranscriptMessages([...prev, {
    type: 'ai',
    text: aiResponse.nextQuestion,
  }]);
  
  // 4. Play audio
  await playSpeech(aiResponse.nextQuestion, {
    applicationUuid,
    conversationHistory,
  });
  
  // 5. Resume listening after audio finishes
  // (handled in onPlaybackEnd callback)
};
```

---

## Summary

This implementation provides:

✅ **Server-side TTS** with multiple provider options  
✅ **Client-side playback** with state management  
✅ **Streaming support** for real-time audio  
✅ **Fallback options** (browser TTS)  
✅ **Error handling** and graceful degradation  
✅ **Integration** with existing speech recognition  

Choose the approach that best fits your needs:
- **Google TTS**: Best quality, good pricing
- **Azure TTS**: Good quality, enterprise features
- **OpenAI TTS**: High quality, simple API
- **Browser TTS**: Free, but lower quality

