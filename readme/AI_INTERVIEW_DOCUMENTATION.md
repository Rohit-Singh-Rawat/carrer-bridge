# AI Interview System - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Video & Audio Implementation](#video--audio-implementation)
4. [Data Storage](#data-storage)
5. [Recruiter View](#recruiter-view)
6. [Technical Implementation Details](#technical-implementation-details)
7. [Interview Flow](#interview-flow)
8. [Monitoring System](#monitoring-system)

---

## Overview

The AI Interview System is a comprehensive, real-time video interview platform that uses AI (Google Gemini) to conduct automated interviews with candidates. The system captures video, audio, screen activity, and conversation transcripts for recruiter review.

### Key Features

- **Real-time AI-powered interviews** using Google Gemini 2.0 Flash Lite
- **Speech-to-text conversion** using Web Speech Recognition API
- **Video recording** of candidate camera feed
- **Screen monitoring** with photo/video capture
- **Camera monitoring** with photo/video capture
- **Complete conversation transcripts** saved to database
- **Multi-language support** for interviews
- **Configurable interview settings** (difficulty, questions, duration)

---

## System Architecture

### Component Structure

```
Interview System
├── Frontend Components
│   ├── VideoCall (Main interview interface)
│   ├── DeviceCheck (Hardware testing)
│   ├── InterviewStartScreen (Pre-interview setup)
│   ├── ChatTranscript (Real-time conversation display)
│   ├── UserVideoFeed (Candidate video display)
│   └── AIVideoFeed (AI avatar display)
│
├── Custom Hooks
│   ├── useMediaStream (Camera/microphone access)
│   ├── useSpeechRecognition (Speech-to-text)
│   ├── useRecording (Video recording)
│   ├── useScreenMonitoring (Screen capture)
│   ├── useSnapshot (Photo capture)
│   └── useVideoMonitoring (Video chunking & upload)
│
├── Server Actions
│   ├── ai-interview.ts (AI response generation)
│   └── job-application.ts (Data persistence)
│
└── Database Schema
    └── JobApplication (MongoDB document)
```

### Technology Stack

- **Frontend**: React 19, Next.js 15, TypeScript
- **AI**: Google Gemini 2.0 Flash Lite
- **Speech Recognition**: Web Speech Recognition API (browser-native)
- **Video Recording**: MediaRecorder API (WebM format)
- **Storage**: AWS S3 (for videos/images), MongoDB (for metadata)
- **Database**: MongoDB with Mongoose ODM

---

## Video & Audio Implementation

### 1. Media Stream Acquisition

**Location**: `src/app/(interview)/interview/[uuid]/session/hooks/use-media-stream.ts`

The system uses the browser's `getUserMedia()` API to access camera and microphone:

```typescript
// Request camera and microphone access
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    deviceId: selectedVideoDeviceId ? { exact: selectedVideoDeviceId } : undefined,
    width: { ideal: 1280 },
    height: { ideal: 720 },
  },
  audio: {
    deviceId: selectedAudioDeviceId ? { exact: selectedAudioDeviceId } : undefined,
    echoCancellation: true,
    noiseSuppression: true,
  },
});
```

**Features**:

- Device selection (camera/microphone)
- Video quality settings (1280x720 ideal)
- Audio enhancements (echo cancellation, noise suppression)
- Real-time stream preview

### 2. Speech Recognition (Audio Processing)

**Location**: `src/app/(interview)/interview/[uuid]/session/hooks/use-speech-recognition.ts`

**How it works**:

1. Uses browser's native `SpeechRecognition` or `webkitSpeechRecognition` API
2. Continuously listens to microphone input
3. Converts speech to text in real-time
4. Triggers AI response when user finishes speaking

**Configuration**:

```typescript
recognitionInstance.continuous = true; // Keep listening
recognitionInstance.interimResults = true; // Get partial results
recognitionInstance.lang = 'en-IN'; // Language setting
recognitionInstance.maxAlternatives = 1; // Single best result
```

**Process Flow**:

```
User Speaks → Speech Recognition API → Text Transcript →
Save to Database → Generate AI Response → Display Response
```

**Key Features**:

- Auto-restart on silence (handles natural pauses)
- Mute/unmute control
- Error handling for network/audio issues
- Heartbeat mechanism to keep recognition active

### 3. Video Recording

**Location**: `src/app/(interview)/interview/[uuid]/session/hooks/use-recording.ts`

**Camera Recording**:

- Uses `MediaRecorder` API
- Format: `video/webm;codecs=vp9,opus` (VP9 video, Opus audio)
- Records camera stream with audio
- Chunks stored in memory during recording

**Screen Recording**:

- Uses `getDisplayMedia()` API for screen capture
- Same format as camera recording
- Can record entire screen or specific window/tab

**Recording Process**:

```typescript
const recorder = new MediaRecorder(mediaStream, {
  mimeType: 'video/webm;codecs=vp9,opus',
});

recorder.ondataavailable = (event) => {
  if (event.data.size > 0) {
    chunks.push(event.data); // Collect video chunks
  }
};

recorder.onstop = () => {
  // Combine chunks into single video blob
  const videoBlob = new Blob(chunks, { type: 'video/webm' });
  // Upload to S3
};
```

### 4. Video Monitoring (Chunked Upload)

**Location**: `src/hooks/use-video-monitoring.ts`

**Why Chunking?**

- Prevents memory issues with long interviews
- Enables progressive upload (5-minute chunks)
- Better error recovery

**Implementation**:

- Records in 5-minute chunks
- Automatically stops and restarts recording
- Each chunk uploaded to S3 immediately
- Chunks stored with timestamps for reconstruction

```typescript
const CHUNK_DURATION = 5 * 60 * 1000; // 5 minutes

// Auto-chunk every 5 minutes
setInterval(() => {
  if (mediaRecorder.state === 'recording') {
    mediaRecorder.stop(); // Uploads current chunk
    // Restart for next chunk
    setTimeout(() => mediaRecorder.start(), 100);
  }
}, CHUNK_DURATION);
```

---

## Data Storage

### 1. Database Schema (MongoDB)

**Location**: `src/db/schema/job-application.ts`

#### Interview Conversation

Stores all AI questions and candidate responses:

```typescript
interviewConversation: [{
  messageId: string;           // Unique ID (e.g., "user-1234567890")
  type: 'ai' | 'user';         // Message sender
  content: string;             // Full text content
  timestamp: Date;             // When message was sent
  phase?: string;              // 'introduction' | 'candidate_intro' | 'questions' | 'closing'
  questionIndex?: number;       // Which question number (0-based)
}]
```

**Example**:

```json
{
  "messageId": "ai-1699123456789",
  "type": "ai",
  "content": "Hello! I'm Hirelytics AI. Could you introduce yourself?",
  "timestamp": "2024-11-05T10:30:00Z",
  "phase": "introduction",
  "questionIndex": 0
}
```

#### Monitoring Images/Videos

Stores references to S3-stored media:

```typescript
monitoringImages: {
  camera: [{
    s3Key: string;             // S3 object key
    timestamp: Date;            // Capture time
    type: 'image' | 'video';   // Media type
    duration?: number;          // Video duration (seconds)
  }],
  screen: [{
    s3Key: string;
    timestamp: Date;
    type: 'image' | 'video';
    duration?: number;
  }]
}
```

**S3 Key Format**:

- Images: `monitoring/{applicationId}/camera/image/{timestamp}-{uuid}.jpg`
- Videos: `monitoring/{applicationId}/camera/video/{timestamp}-{uuid}.webm`
- Screen: Same pattern with `/screen/` instead of `/camera/`

### 2. AWS S3 Storage

**Upload Process** (`src/actions/job-application.ts`):

1. **Image Upload**:

```typescript
// Convert canvas to base64
const imageData = canvas.toDataURL('image/jpeg', 0.8);

// Upload to S3
const s3Key = `monitoring/${applicationId}/camera/image/${timestamp}-${uuid}.jpg`;
await s3Client.send(
  new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET_NAME,
    Key: s3Key,
    Body: Buffer.from(imageData.split(',')[1], 'base64'),
    ContentType: 'image/jpeg',
  })
);
```

2. **Video Upload**:

```typescript
// Convert blob to buffer
const arrayBuffer = await videoBlob.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);

// Upload to S3
const s3Key = `monitoring/${applicationId}/camera/video/${timestamp}-${uuid}.webm`;
await s3Client.send(
  new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET_NAME,
    Key: s3Key,
    Body: buffer,
    ContentType: 'video/webm',
  })
);
```

3. **Database Update**:
   After S3 upload, metadata is saved to MongoDB:

```typescript
await JobApplication.findByIdAndUpdate(applicationId, {
  $push: {
    'monitoringImages.camera': {
      s3Key,
      timestamp: new Date(),
      type: 'video',
      duration: durationInSeconds,
    },
  },
});
```

### 3. What Gets Saved

**During Interview**:

- ✅ Every AI question (with phase and question index)
- ✅ Every candidate response (transcribed from speech)
- ✅ Camera snapshots/videos (based on monitoring config)
- ✅ Screen snapshots/videos (based on monitoring config)
- ✅ Interview metadata (duration, language, difficulty)

**After Interview**:

- ✅ Complete conversation transcript
- ✅ All monitoring media (S3 references in database)
- ✅ Interview configuration used
- ✅ Application status updates

---

## Recruiter View

### Access Location

**Path**: `/recruiter/job-application/[id]`

**Component**: `src/app/(dashboard)/(recruiter)/job-application/[id]/_components/job-application-detail-view.tsx`

### What Recruiters See

#### 1. Overview Tab

- Application status (Pending/Reviewed/Accepted/Rejected)
- Candidate name and email
- Preferred interview language
- Application dates (created/updated)
- Organization information

#### 2. Candidate Tab

- Full candidate details
- User account information
- Avatar (if available)

#### 3. Job Details Tab

- Complete job description
- Required skills
- Requirements and benefits
- Additional job metadata (location, salary, type, experience)

#### 4. Interview Config Tab

**Session Configuration**:

- Screen monitoring settings:
  - Enabled/Disabled
  - Mode: Photo or Video
  - Interval: 30 or 60 seconds
- Camera monitoring settings:
  - Enabled/Disabled
  - Mode: Photo or Video
  - Interval: 30 or 60 seconds
- Interview duration

**AI Configuration**:

- Difficulty level (Easy/Normal/Hard/Expert/Advanced)
- Question mode (Manual or AI-generated)
- Total number of questions
- Special instructions for AI
- Question categories and counts
- Pre-configured questions (if manual mode)

#### 5. Monitoring Tab

**Camera Captures**:

- List of all camera images/videos
- S3 key for each capture
- Timestamp for each capture
- Duration (for videos)

**Screen Captures**:

- List of all screen images/videos
- S3 key for each capture
- Timestamp for each capture
- Duration (for videos)

**Note**: Currently shows S3 keys. To view actual media, recruiters need:

- Presigned URL generation (to be implemented)
- Or direct S3 access with proper IAM permissions

#### 6. Interview Transcript (Future Enhancement)

**Planned Features**:

- Full conversation transcript view
- Searchable transcript
- Export transcript as PDF/CSV
- Filter by phase (introduction, questions, closing)
- Question-by-question breakdown

**Data Available**:
The `interviewConversation` array contains all messages:

```typescript
// Example structure
[
  {
    messageId: 'ai-123',
    type: 'ai',
    content: 'Hello! Please introduce yourself.',
    timestamp: '2024-11-05T10:00:00Z',
    phase: 'introduction',
    questionIndex: 0,
  },
  {
    messageId: 'user-124',
    type: 'user',
    content: "Hi, I'm John Doe, a software engineer...",
    timestamp: '2024-11-05T10:00:15Z',
    phase: 'candidate_intro',
    questionIndex: 0,
  },
  // ... more messages
];
```

### Recruiter Actions

1. **Update Application Status**:

   - Pending → Reviewed → Accepted/Rejected
   - Status dropdown in header

2. **View Monitoring Data**:

   - Access camera captures
   - Access screen captures
   - View timestamps and durations

3. **Review Interview Configuration**:
   - See what settings were used
   - View configured questions
   - Check AI instructions

---

## Technical Implementation Details

### 1. AI Response Generation

**Location**: `src/actions/ai-interview.ts`

**Process**:

1. Fetch job application context from database
2. Build conversation history
3. Determine current interview phase
4. Generate system prompt with context
5. Call Google Gemini API
6. Parse response (JSON or text)
7. Save to database
8. Return to frontend

**System Prompt Structure**:

```
You are Hirelytics AI conducting a professional interview.

Phase Instructions: [Current phase guidance]
Job Context: [Role, skills, candidate name]
Conversation History: [Previous messages]
Latest Response: [User's latest answer]

Instructions:
1. Acknowledge response with feedback
2. Ask next relevant question
3. Be warm and professional
```

**Response Format**:

```json
{
  "feedback": "Thank you for sharing that...",
  "nextQuestion": "Can you tell me about...",
  "phase": {
    "current": "questions",
    "questionIndex": 2,
    "totalQuestions": 5
  }
}
```

### 2. Interview Phases

**Phase Flow**:

```
introduction → candidate_intro → questions → closing
```

1. **Introduction**: AI introduces itself and welcomes candidate
2. **Candidate Intro**: Candidate provides background
3. **Questions**: Structured interview questions (1 to N)
4. **Closing**: Thank you and next steps

**Phase Management**:

- Tracked in `currentPhase` state
- Updated after each AI response
- Saved with each conversation message

### 3. Screen Monitoring

**Location**: `src/app/(interview)/interview/[uuid]/session/hooks/use-screen-monitoring.ts`

**Modes**:

- **Photo Mode**: Takes snapshots at intervals (30s or 60s)
- **Video Mode**: Records video chunks (5 minutes each)

**Implementation**:

```typescript
// Photo mode
setInterval(() => {
  takeMonitoringSnapshot(screenRef, applicationId, 'screen');
}, intervalSeconds * 1000);

// Video mode
startScreenRecording(screenStream, applicationId);
// Auto-chunks every 5 minutes
```

**Mandatory Screen Share**:

- Can be required by interview config
- Prevents interview start without screen share
- Monitors screen activity throughout

### 4. Camera Monitoring

**Location**: `src/app/(interview)/interview/[uuid]/session/hooks/use-snapshot.ts`

**Modes**:

- **Photo Mode**: Snapshots at intervals
- **Video Mode**: Continuous recording with chunking

**Photo Capture Process**:

1. Draw video frame to canvas
2. Convert canvas to JPEG (80% quality)
3. Upload to S3 as base64
4. Save metadata to database

**Video Capture Process**:

1. Record MediaStream using MediaRecorder
2. Collect chunks in memory
3. Every 5 minutes: stop, upload chunk, restart
4. On interview end: upload final chunk

### 5. Error Handling

**Speech Recognition Errors**:

- `no-speech`: Silently handled (normal silence)
- `audio-capture`: Microphone permission issue
- `network`: Connection problem
- `not-allowed`: Permission denied

**Recording Errors**:

- Stream disconnection: Auto-reconnect
- Upload failures: Retry mechanism
- S3 errors: Logged, user notified

**AI Response Errors**:

- API failures: Fallback responses
- Parse errors: Default question generation
- Timeout: Generic continuation message

---

## Interview Flow

### Complete User Journey

```
1. Candidate receives interview link
   ↓
2. Device Check Page
   - Test camera
   - Test microphone
   - Select devices
   ↓
3. Pre-Interview Setup
   - Language selection
   - Review instructions
   - Start interview button
   ↓
4. Interview Session
   ├── AI Introduction (auto-generated)
   ├── Candidate Introduction (speech-to-text)
   ├── Question 1 (AI-generated or manual)
   ├── Answer 1 (speech-to-text)
   ├── Question 2
   ├── Answer 2
   ├── ... (repeat for N questions)
   ├── Closing Message (AI-generated)
   └── End Interview
   ↓
5. Post-Interview
   - Thank you screen
   - Redirect to dashboard
```

### Real-Time Flow During Interview

```
┌─────────────────────────────────────────────────┐
│ User Speaks                                      │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ Speech Recognition API                          │
│ - Listens continuously                          │
│ - Converts speech → text                       │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ Save User Message to Database                   │
│ - messageId: "user-{timestamp}"                 │
│ - type: "user"                                  │
│ - content: transcript                          │
│ - phase, questionIndex                          │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ Generate AI Response                            │
│ - Fetch job context                             │
│ - Build conversation history                    │
│ - Call Gemini API                               │
│ - Parse response                                │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ Save AI Message to Database                     │
│ - messageId: "ai-{timestamp}"                   │
│ - type: "ai"                                    │
│ - content: response                             │
│ - phase, questionIndex                          │
└──────────────┬──────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────┐
│ Display in Chat Transcript                      │
│ - User message (left)                           │
│ - AI message (right)                            │
└─────────────────────────────────────────────────┘
```

### Parallel Monitoring Flow

```
Interview Starts
    │
    ├─── Camera Monitoring ────┐
    │                          │
    │   [Photo Mode]           │
    │   - Snapshot every 30s   │
    │   - Upload to S3         │
    │   - Save metadata        │
    │                          │
    │   [Video Mode]           │
    │   - Record continuously  │
    │   - Chunk every 5 min    │
    │   - Upload chunks        │
    │                          │
    └─── Screen Monitoring ─────┤
                               │
        [Photo Mode]           │
        - Snapshot every 30s   │
        - Upload to S3         │
        - Save metadata        │
                               │
        [Video Mode]           │
        - Record continuously  │
        - Chunk every 5 min    │
        - Upload chunks        │
                               │
                               ▼
                    All data saved to:
                    - MongoDB (metadata)
                    - S3 (media files)
```

---

## Monitoring System

### Configuration Options

**Set by Recruiter** (during job creation):

```typescript
sessionInstruction: {
  screenMonitoring: boolean; // Enable/disable
  screenMonitoringMode: 'photo' | 'video';
  screenMonitoringInterval: 30 | 60; // Seconds (photo mode)

  cameraMonitoring: boolean;
  cameraMonitoringMode: 'photo' | 'video';
  cameraMonitoringInterval: 30 | 60; // Seconds (photo mode)

  duration: number; // Interview duration (minutes)
}
```

### Photo Mode

**How it works**:

1. Set interval timer (30s or 60s)
2. At each interval:
   - Capture current video frame to canvas
   - Convert to JPEG
   - Upload to S3
   - Save S3 key to database

**Storage**:

- S3: `monitoring/{applicationId}/camera/image/{timestamp}-{uuid}.jpg`
- Database: Array entry with `s3Key`, `timestamp`, `type: 'image'`

### Video Mode

**How it works**:

1. Start MediaRecorder on stream
2. Record continuously
3. Every 5 minutes:
   - Stop recording
   - Combine chunks into blob
   - Upload to S3
   - Restart recording for next chunk
4. On interview end: Upload final chunk

**Storage**:

- S3: `monitoring/{applicationId}/camera/video/{timestamp}-{uuid}.webm`
- Database: Array entry with `s3Key`, `timestamp`, `type: 'video'`, `duration`

### Access Control

**Who can view monitoring data**:

- **Recruiters**: Can view for applications in their organization
- **Admins**: Can view all applications
- **Candidates**: Can view their own application data

**Implementation** (`src/actions/job-application.ts`):

```typescript
// Role-based access control
if (!isAdmin && !isRecruiter) {
  // Candidates: own applications only
  if (application.userId.toString() !== user.id) {
    throw new Error('Access denied');
  }
} else if (isRecruiter && !isAdmin) {
  // Recruiters: organization applications only
  const job = application.jobId;
  if (job.organizationId !== user.organizationId) {
    throw new Error('Access denied');
  }
}
```

---

## Summary

### What the System Does

1. **Conducts AI-powered interviews** using Google Gemini
2. **Captures audio** via speech recognition
3. **Records video** of candidate camera feed
4. **Monitors screen** with photo/video capture
5. **Monitors camera** with photo/video capture
6. **Saves everything** to database and S3
7. **Provides recruiter dashboard** for review

### What Gets Saved

- ✅ Complete conversation transcript (AI + user messages)
- ✅ Camera images/videos (S3 + metadata)
- ✅ Screen images/videos (S3 + metadata)
- ✅ Interview configuration used
- ✅ Timestamps and phases for all messages

### What Recruiters See

- ✅ Application overview and status
- ✅ Candidate information
- ✅ Job details
- ✅ Interview configuration
- ✅ Monitoring data (S3 keys and timestamps)
- ✅ Full conversation transcript (data available, UI pending)

### Technical Highlights

- Real-time speech-to-text (browser-native API)
- Chunked video upload (5-minute segments)
- Progressive data saving (no data loss)
- Role-based access control
- Error handling and recovery
- Multi-language support

---

**Last Updated**: November 2024
**Version**: 1.0
