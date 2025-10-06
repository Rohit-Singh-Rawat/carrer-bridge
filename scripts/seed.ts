import { db } from '../db';
import { users, recruiterProfiles, jobs } from '../db/schema';
import usersData from './users.json';
import recruiterProfilesData from './recruiter_profiles.json';
import jobsData from './jobs.json';
async function seed() {
	try {
		console.log('🌱 Starting database seed...\n');

		// Insert users
		console.log('📝 Inserting users...');
		for (const user of usersData) {
			await db
				.insert(users)
				.values({
					id: user.id,
					email: user.email,
					password: user.password,
					fullName: user.full_name,
					role: user.role as 'user' | 'recruiter',
					createdAt: new Date(user.created_at),
					updatedAt: new Date(user.updated_at),
				})
				.onConflictDoNothing();
		}
		console.log(`✅ Inserted ${usersData.length} users\n`);

		// Insert recruiter profiles
		console.log('📝 Inserting recruiter profiles...');
		for (const profile of recruiterProfilesData) {
			await db
				.insert(recruiterProfiles)
				.values({
					id: profile.id,
					userId: profile.user_id,
					companyName: profile.company_name,
					companyWebsite: profile.company_website,
					companySize: profile.company_size,
					industry: profile.industry,
					location: profile.location,
					bio: profile.bio,
					verified: profile.verified,
					createdAt: new Date(profile.created_at),
					updatedAt: new Date(profile.updated_at),
				})
				.onConflictDoNothing();
		}
		console.log(`✅ Inserted ${recruiterProfilesData.length} recruiter profiles\n`);

		// Insert jobs
		console.log('📝 Inserting jobs...');
		for (const job of jobsData) {
			await db
				.insert(jobs)
				.values({
					id: job.id,
					recruiterId: job.recruiter_id,
					title: job.title,
					description: job.description,
					location: job.location,
					jobType: job.job_type as 'full-time' | 'part-time' | 'contract' | 'internship',
					experienceLevel: job.experience_level as 'entry' | 'mid' | 'senior' | 'lead',
					salaryMin: job.salary_min,
					salaryMax: job.salary_max,
					skills: job.skills,
					requirements: job.requirements,
					benefits: job.benefits,
					status: job.status as 'active' | 'closed' | 'draft',
					deadline: job.deadline ? new Date(job.deadline) : null,
					createdAt: new Date(job.created_at),
					updatedAt: new Date(job.updated_at),
				})
				.onConflictDoNothing();
		}
		console.log(`✅ Inserted ${jobsData.length} jobs\n`);

		console.log('🎉 Database seed completed successfully!');
		process.exit(0);
	} catch (error) {
		console.error('❌ Error seeding database:', error);
		process.exit(1);
	}
}

seed();
