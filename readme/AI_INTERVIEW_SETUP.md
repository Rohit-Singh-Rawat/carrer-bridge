# AI Interview System - Setup Guide

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Google Gemini API Key (required for AI interview)
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key_here

# Interview Configuration (optional, defaults provided)
NEXT_PUBLIC_INTERVIEW_MAX_DURATION=300
NEXT_PUBLIC_SNAPSHOT_INTERVAL=10
```

## Getting Started

### 1. Database Migration

The database schema has already been applied. If you need to reapply:

```bash
bun run db:push
```

### 2. Install Dependencies

All required dependencies have been installed:
- `@ai-sdk/google` - Google Gemini AI integration
- `ai` - Vercel AI SDK
- `@trpc/server`, `@trpc/client`, `@trpc/react-query`, `@trpc/next` - tRPC
- `@tanstack/react-query` - React Query
- `superjson` - JSON serialization

### 3. Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env` file as `GOOGLE_GEMINI_API_KEY`

## How It Works

### For Candidates (Users)

1. Apply to a job with a resume
2. Wait for recruiter to review application
3. When status changes to "Reviewed", interview becomes available
4. Click "Start Interview" button on application page
5. Complete pre-interview checks (camera, microphone, browser compatibility)
6. Interview starts automatically with AI introduction
7. Answer 5 questions (including at least 1 MCQ) in 5 minutes
8. Stay in fullscreen mode (will be warned if exited)
9. Interview completes automatically or manually
10. View summary and wait for recruiter review

### For Recruiters

1. Review applications and change status to "Reviewed"
2. This automatically enables interview for the candidate
3. After candidate completes interview, view:
   - Complete transcript with timestamps
   - Camera monitoring snapshots (every 10 seconds)
   - Interview metrics (duration, questions answered, MCQ count)
4. Make final hiring decision based on interview performance

## Features

- **AI-Powered Questions**: Google Gemini generates contextual questions based on job requirements and candidate resume
- **Speech Recognition**: Browser-native speech-to-text for natural conversation
- **Text-to-Speech**: AI responses are spoken aloud
- **Multiple Choice Questions**: At least 1 MCQ in every interview
- **Camera Monitoring**: Snapshots captured every 10 seconds
- **Fullscreen Enforcement**: Interview terminates if user exits fullscreen
- **5-Minute Duration**: Keeps interviews concise and focused
- **Complete Transcripts**: Every question and answer saved with timestamps
- **Real-time Processing**: No delays between questions

## Technical Architecture

### Frontend
- React 19 with Next.js 15
- tRPC for type-safe API calls
- React Query for data fetching
- Custom hooks for interview orchestration

### Backend
- tRPC routers for interview management
- Google Gemini AI for question generation
- Drizzle ORM with PostgreSQL
- R2/S3 for snapshot storage

### Database Tables
- `interviews` - Interview sessions
- `interview_messages` - Conversation history
- `monitoring_images` - Camera snapshots
- `applications` - Updated with interview eligibility

## Browser Compatibility

**Supported Browsers:**
- Google Chrome (recommended)
- Microsoft Edge
- Safari (limited speech recognition)

**Not Supported:**
- Firefox (no Web Speech API support)
- Internet Explorer

## Security Features

- Fullscreen enforcement prevents cheating
- Camera monitoring for identity verification
- All communication encrypted (HTTPS)
- Role-based access control
- Interview data accessible only to candidate and recruiter

## Troubleshooting

### Camera/Microphone Not Working
- Check browser permissions
- Ensure camera/mic are not in use by other apps
- Try a different browser (Chrome recommended)

### Speech Recognition Not Working
- Check microphone permissions
- Ensure you're using Chrome or Edge
- Speak clearly and wait for AI response

### AI Not Responding
- Check `GOOGLE_GEMINI_API_KEY` is set correctly
- Verify API key has Gemini 2.0 access
- Check browser console for errors

### Interview Won't Start
- Ensure application status is "Reviewed"
- Check `interviewEligible` flag in database
- Verify no existing interview for this application

## Limitations

- Maximum 5 minutes per interview
- Fixed 5 questions (including introduction)
- English language only (can be extended)
- Requires stable internet connection
- Browser compatibility required

## Future Enhancements

Potential improvements for future versions:
- Multi-language support
- Custom question templates
- Video recording (currently only snapshots)
- Screen sharing for technical interviews
- Real-time scoring and feedback
- Interview rescheduling
- Email notifications
- Integration with calendar systems

