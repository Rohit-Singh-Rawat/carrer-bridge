# AI Interview Integration with Job Application Context

## Overview

The AI interview system now uses complete job application context from the database to provide more personalized and relevant interview experiences.

## Key Features

### 1. **Comprehensive Context Integration**

- **Candidate Information**: Name, email for personalization
- **Job Details**: Title, description, required skills, requirements, benefits
- **AI Instructions**: Custom instructions, difficulty level, question categories
- **Session Settings**: Duration, monitoring preferences
- **Language Preferences**: Localized interview experience

### 2. **Enhanced AI Responses**

- **Natural, Complete Responses**: No placeholders, brackets, or template language
- **Professional Conversation Flow**: Sounds like a real interviewer, not scripted
- **Contextual Personalization**: Uses actual candidate name and job title naturally
- **Specific Feedback**: References details from candidate responses
- **Relevant Follow-ups**: Questions build logically on previous answers
- Questions tailored to specific job requirements
- Difficulty adjustment based on configured level
- Industry-agnostic yet role-specific questioning
- Personalized feedback and follow-ups

### 3. **Response Quality Standards**

- **Complete Sentences**: Full, flowing conversation without gaps
- **No Template Language**: Eliminates [Name], [Role], [Company] placeholders
- **Contextual Integration**: Seamlessly incorporates available job data
- **Professional Tone**: Maintains interview formality while being conversational
- **Specific Details**: References actual job requirements and candidate information

## Usage Example

```typescript
import { useSpeechRecognition } from './hooks/use-speech-recognition';
import { transformJobApplicationToAIContext } from '@/lib/utils/job-utils';

// Job application data from database (example from Nurse Practitioner role)
const jobApplicationData = {
  candidate: {
    name: 'Sumanta Kabiraj',
    email: 'user@hirelytics.app',
  },
  jobDetails: {
    title: 'Nurse Practitioner',
    skills: ['Medical Terminology'],
    requirements: "Bachelor's degree in relevant field or equivalent experience...",
    description: 'We are seeking a qualified professional to join our team...',
  },
  instructionsForAi: {
    instruction: 'Focus on healthcare experience and patient care',
    difficultyLevel: 'normal',
    questionMode: 'manual',
    totalQuestions: 3,
  },
  sessionInstruction: {
    duration: '30',
  },
  preferredLanguage: 'en-IN',
};

// Transform to AI context
const aiContext = transformJobApplicationToAIContext(jobApplicationData);

// Use in interview hook
const { transcriptMessages, conversationHistory, isAITyping } = useSpeechRecognition(
  isInterviewStarted,
  isMuted,
  aiContext // Full job application context
);
```

## AI Behavior

### Introduction Generation

The AI generates personalized introductions like:

> "Hello Sumanta! Welcome to your interview for the Nurse Practitioner position. I'm excited to learn about your healthcare background and experience with medical terminology. This will be a 30-minute conversation where we'll discuss your qualifications and experience. To get started, could you please tell me about your journey in healthcare?"

### Dynamic Questioning

Based on the job context, the AI asks relevant questions such as:

- **For Healthcare Roles**: "Tell me about a challenging patient care situation you've handled."
- **For Any Role**: "Describe a time when you had to learn new skills quickly."
- **Technical Roles**: "How do you stay updated with industry developments?"

### Contextual Feedback

The AI provides feedback that references:

- Specific job requirements mentioned in the job description
- Required skills from the job posting
- Difficulty level appropriate responses
- Industry-relevant scenarios

## Benefits

1. **Personalized Experience**: Each interview feels tailored to the specific role and candidate
2. **Relevant Questioning**: Questions align with actual job requirements
3. **Scalable**: Works across any industry or profession
4. **Contextual**: AI maintains awareness of the entire application context
5. **Flexible**: Adapts to different difficulty levels and instruction types

## Error Handling

The system includes robust fallback mechanisms:

- Default professional questions if AI service fails
- Generic responses if job context is missing
- Graceful degradation to ensure interview continuity

## Future Enhancements

- Integration with specific industry question banks
- Real-time performance scoring based on job requirements
- Multi-language support based on preferred language
- Integration with assessment frameworks


## AI Interview Implementation

### 1. AI Service

```typescript
// src/ai/index.ts
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText } from 'ai';
import { env } from '@/env';

const google = createGoogleGenerativeAI({
  apiKey: env.GOOGLE_API_KEY!,
});

export interface AIGenerateParams {
  jobDetails: {
    title: string;
    description: string;
    skills: string[];
    requirements?: string;
  };
  instructionsForAi: {
    instruction: string;
    difficultyLevel: string;
    totalQuestions: number;
  };
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  userMessage: string;
  phase: {
    current: string;
    questionIndex: number;
    totalQuestions: number;
  };
}

export async function generateAIInterviewResponse(params: AIGenerateParams) {
  const systemPrompt = buildSystemPrompt(params);

  const result = await streamText({
    model: google('gemini-2.0-flash-exp'),
    system: systemPrompt,
    messages: [...params.conversationHistory, { role: 'user', content: params.userMessage }],
    temperature: 0.7,
    maxTokens: 500,
  });

  const message = await result.text;

  return {
    message,
    phase: determineNextPhase(params.phase, params.instructionsForAi),
  };
}

function buildSystemPrompt(params: AIGenerateParams): string {
  return `You are an expert AI interviewer conducting a ${params.instructionsForAi.difficultyLevel} level interview for the position of ${params.jobDetails.title}.

Job Context:
- Title: ${params.jobDetails.title}
- Required Skills: ${params.jobDetails.skills.join(', ')}
- Requirements: ${params.jobDetails.requirements || 'Not specified'}

Interview Instructions:
${params.instructionsForAi.instruction}

Current Interview Phase: ${params.phase.current}
Question ${params.phase.questionIndex + 1} of ${params.phase.totalQuestions}

Guidelines:
1. Ask ONE clear, specific question at a time
2. Be conversational but professional
3. Adapt difficulty to candidate responses
4. Provide brief acknowledgment before next question
5. Use natural, complete sentences (no placeholders)
6. Reference the job requirements when relevant

${params.phase.current === 'introduction' ? 'Start with a warm introduction and explain the interview process.' : ''}
${params.phase.current === 'technical' ? 'Focus on technical skills and problem-solving abilities related to: ' + params.jobDetails.skills.join(', ') : ''}
${params.phase.current === 'behavioral' ? 'Explore soft skills, teamwork, and past experiences.' : ''}
${params.phase.current === 'closing' ? 'Thank the candidate and provide next steps information.' : ''}
`;
}

function determineNextPhase(currentPhase: any, instructions: any) {
  const { questionIndex, totalQuestions } = currentPhase;

  if (questionIndex >= totalQuestions - 1) {
    return { current: 'closing', questionIndex, totalQuestions };
  }

  if (questionIndex < Math.floor(totalQuestions / 2)) {
    return { current: 'technical', questionIndex: questionIndex + 1, totalQuestions };
  } else {
    return { current: 'behavioral', questionIndex: questionIndex + 1, totalQuestions };
  }
}
```

### 2. AI Interview API Route

```typescript
// src/app/api/v1/ai-interview/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { jobApplications } from '@/db/drizzle/schema';
import { generateAIInterviewResponse } from '@/ai';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { uuid, conversationHistory, userMessage, phase } = await req.json();

    // Fetch application context
    const application = await db.query.jobApplications.findFirst({
      where: eq(jobApplications.uuid, uuid),
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Generate AI response
    const response = await generateAIInterviewResponse({
      jobDetails: application.jobDetails,
      instructionsForAi: application.instructionsForAi,
      conversationHistory,
      userMessage,
      phase,
    });

    // Update conversation in DB
    const updatedConversation = [
      ...(application.interviewConversation || []),
      {
        messageId: `user-${Date.now()}`,
        type: 'user' as const,
        content: userMessage,
        timestamp: new Date(),
        phase: phase.current,
        questionIndex: phase.questionIndex,
      },
      {
        messageId: `ai-${Date.now()}`,
        type: 'ai' as const,
        content: response.message,
        timestamp: new Date(),
        phase: response.phase.current,
        questionIndex: response.phase.questionIndex,
      },
    ];

    await db
      .update(jobApplications)
      .set({ interviewConversation: updatedConversation })
      .where(eq(jobApplications.id, application.id));

    return NextResponse.json({
      success: true,
      nextQuestion: response.message,
      phase: response.phase,
    });
  } catch (error) {
    console.error('AI Interview Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}