'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { applications } from '@/db/schema';
import { INTERVIEW_CONFIG } from '@/lib/constants/interview-constants';

/**
 * Get job application by UUID for interview session
 */
export async function getJobApplicationByUuid(uuid: string) {
  try {
    const application = await db.query.applications.findFirst({
      where: eq(applications.id, uuid),
      with: {
        job: true,
        resume: true,
        user: true,
      },
    });

    if (!application) {
      return null;
    }

    // Transform to match expected structure
    return {
      id: application.id,
      uuid: application.id, // Using ID as UUID since schema doesn't have separate UUID field
      status: application.status,
      preferredLanguage: 'en-US', // Default language, could be stored in user preferences
      candidate: {
        email: application.user.email,
        name: application.user.fullName,
      },
      jobDetails: {
        title: application.job.title,
        description: application.job.description,
        skills: application.job.skills ? JSON.parse(application.job.skills) : [],
        benefits: application.job.benefits,
        requirements: application.job.requirements,
      },
      sessionInstruction: {
        screenMonitoring: false,
        screenMonitoringMode: 'photo' as const,
        screenMonitoringInterval: 30 as const,
        cameraMonitoring: false,
        cameraMonitoringMode: 'photo' as const,
        cameraMonitoringInterval: 30 as const,
        duration: Math.floor(INTERVIEW_CONFIG.MAX_DURATION_SECONDS / 60), // Convert seconds to minutes
      },
      instructionsForAi: {
        instruction: 'Conduct a professional interview assessing the candidate\'s qualifications.',
        difficultyLevel: 'normal' as const,
        questionMode: 'ai-mode' as const,
        totalQuestions: INTERVIEW_CONFIG.TOTAL_QUESTIONS,
        categoryConfigs: [
          { type: 'technical', numberOfQuestions: 3 },
          { type: 'behavioral', numberOfQuestions: 2 },
        ],
        questions: [],
      },
      jobInfo: {
        id: application.job.id,
        title: application.job.title,
        description: application.job.description,
        skills: application.job.skills ? JSON.parse(application.job.skills) : [],
        benefits: application.job.benefits,
        requirements: application.job.requirements,
        location: application.job.location,
        salary: application.job.salaryMin && application.job.salaryMax
          ? `$${application.job.salaryMin} - $${application.job.salaryMax}`
          : undefined,
        type: application.job.jobType,
        experience: application.job.experienceLevel,
      },
      userInfo: {
        id: application.user.id,
        name: application.user.fullName,
        email: application.user.email,
      },
    };
  } catch (error) {
    console.error('Error fetching job application:', error);
    return null;
  }
}

/**
 * Update job application language preference
 */
export async function updateJobApplicationLanguage(
  applicationUuid: string,
  languageCode: string
): Promise<void> {
  try {
    // In a real implementation, you would update the language in the database
    // For now, we'll just log it since the schema doesn't have a language field
    console.log('Updating language for application:', applicationUuid, 'to:', languageCode);
    
    // You could add a language field to the applications table or user preferences
    // await db.update(applications)
    //   .set({ preferredLanguage: languageCode })
    //   .where(eq(applications.id, applicationUuid));
  } catch (error) {
    console.error('Error updating language:', error);
    throw error;
  }
}

/**
 * Upload camera monitoring image
 */
export async function uploadCameraImage(
  applicationId: string,
  imageData: string
): Promise<void> {
  try {
    // In a real implementation, you would:
    // 1. Upload the image to a storage service (S3, Cloudinary, etc.)
    // 2. Store the URL in the database with timestamp
    // 3. Associate it with the interview session
    
    console.log('Uploading camera image for application:', applicationId);
    
    // For now, we'll just log it
    // The imageData is a base64 string that can be uploaded to storage
    
    // Example implementation:
    // const imageUrl = await uploadToStorage(imageData, `camera/${applicationId}/${Date.now()}.jpg`);
    // await db.insert(monitoringImages).values({
    //   applicationId,
    //   type: 'camera',
    //   imageUrl,
    //   timestamp: new Date(),
    // });
  } catch (error) {
    console.error('Error uploading camera image:', error);
    throw error;
  }
}

/**
 * Upload screen monitoring image
 */
export async function uploadScreenImage(
  applicationId: string,
  imageData: string
): Promise<void> {
  try {
    // In a real implementation, you would:
    // 1. Upload the image to a storage service (S3, Cloudinary, etc.)
    // 2. Store the URL in the database with timestamp
    // 3. Associate it with the interview session
    
    console.log('Uploading screen image for application:', applicationId);
    
    // For now, we'll just log it
    // The imageData is a base64 string that can be uploaded to storage
    
    // Example implementation:
    // const imageUrl = await uploadToStorage(imageData, `screen/${applicationId}/${Date.now()}.jpg`);
    // await db.insert(monitoringImages).values({
    //   applicationId,
    //   type: 'screen',
    //   imageUrl,
    //   timestamp: new Date(),
    // });
  } catch (error) {
    console.error('Error uploading screen image:', error);
    throw error;
  }
}

