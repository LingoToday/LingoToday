import {
  users,
  userSettings,
  userProgress,
  userStats,
  waitlist,
  pageViews,
  languages,
  skillLevels,
  courses,
  lessons,
  lessonSteps,
  checkpoints,
  checkpointProgress,
  draftUploads,
  type User,
  type UpsertUser,
  type UserSettings,
  type InsertUserSettings,
  type UserProgress,
  type InsertUserProgress,
  type UserStats,
  type InsertUserStats,
  type Waitlist,
  type InsertWaitlist,
  type PageView,
  type InsertPageView,
  type Language,
  type InsertLanguage,
  type SkillLevel,
  type InsertSkillLevel,
  type Course,
  type InsertCourse,
  type Lesson,
  type InsertLesson,
  type LessonStep,
  type InsertLessonStep,
  type Checkpoint,
  type InsertCheckpoint,
  type CheckpointProgress,
  type InsertCheckpointProgress,
  type CourseWithRelations,
  type LessonWithSteps,
  type DraftUpload,
  type InsertDraftUpload,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, notInArray } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Stripe operations
  updateUserStripeCustomerId(userId: string, customerId: string): Promise<User>;
  updateUserStripeSubscriptionId(userId: string, subscriptionId: string): Promise<User>;
  updateUserPriceTier(userId: string, priceTier: string): Promise<User>;
  
  // User settings operations
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  upsertUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  
  // User progress operations
  getUserProgress(userId: string, language?: string): Promise<UserProgress[]>;
  upsertUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  getLatestProgress(userId: string, language: string): Promise<UserProgress | undefined>;
  
  // User stats operations
  getUserStats(userId: string, language: string): Promise<UserStats | undefined>;
  upsertUserStats(stats: InsertUserStats): Promise<UserStats>;
  updateStreak(userId: string, language: string, streak: number): Promise<void>;
  incrementWordsLearned(userId: string, language: string, count: number): Promise<void>;
  
  // Reset operations
  resetUserProgress(userId: string, language: string): Promise<void>;
  resetUserStats(userId: string, language: string): Promise<void>;
  
  // Waitlist operations
  addToWaitlist(waitlistData: InsertWaitlist): Promise<Waitlist>;
  getWaitlistEntries(): Promise<Waitlist[]>;
  
  // Language operations
  getLanguages(): Promise<Language[]>;
  getLanguage(id: number): Promise<Language | undefined>;
  getLanguageByCode(code: string): Promise<Language | undefined>;
  createLanguage(language: InsertLanguage): Promise<Language>;
  
  // Skill level operations  
  getSkillLevels(): Promise<SkillLevel[]>;
  getSkillLevel(id: number): Promise<SkillLevel | undefined>;
  getSkillLevelByCode(code: string): Promise<SkillLevel | undefined>;
  createSkillLevel(skillLevel: InsertSkillLevel): Promise<SkillLevel>;
  
  // Course operations
  getCourses(languageId?: number, skillLevelId?: number): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  getCourseWithRelations(id: number): Promise<CourseWithRelations | undefined>;
  getCoursesWithRelations(languageId?: number, skillLevelId?: number): Promise<CourseWithRelations[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  updateCourse(id: number, course: Partial<InsertCourse>): Promise<Course>;
  deleteCourse(id: number): Promise<void>;
  
  // Lesson operations
  getLessons(courseId: number): Promise<Lesson[]>;
  getLesson(id: number): Promise<Lesson | undefined>;
  getLessonWithSteps(id: number): Promise<LessonWithSteps | undefined>;
  getLessonByCourseAndNumber(languageCode: string, courseNumber: number, lessonNumber: number): Promise<LessonWithSteps | undefined>;
  getLessonByCourseIdAndNumber(courseId: number, lessonNumber: number): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, lesson: Partial<InsertLesson>): Promise<Lesson>;
  deleteLesson(id: number): Promise<void>;
  deleteLessonsNotInList(courseId: number, lessonNumbers: number[]): Promise<void>;
  
  // Lesson step operations
  getLessonSteps(lessonId: number): Promise<LessonStep[]>;
  getLessonStepByNumber(lessonId: number, stepNumber: number): Promise<LessonStep | undefined>;
  createLessonStep(step: InsertLessonStep): Promise<LessonStep>;
  updateLessonStep(id: number, step: Partial<InsertLessonStep>): Promise<LessonStep>;
  deleteLessonStep(id: number): Promise<void>;
  deleteStepsNotInList(lessonId: number, stepNumbers: number[]): Promise<void>;
  
  // Checkpoint operations
  getCheckpoints(courseId: number): Promise<Checkpoint[]>;
  getAllCheckpoints(): Promise<Checkpoint[]>;
  getCheckpoint(id: number): Promise<Checkpoint | undefined>;
  getCheckpointByCourseAndNumber(courseId: number, checkpointNumber: number): Promise<Checkpoint | undefined>;
  createCheckpoint(checkpoint: InsertCheckpoint): Promise<Checkpoint>;
  updateCheckpoint(id: number, checkpoint: Partial<InsertCheckpoint>): Promise<Checkpoint>;
  deleteCheckpoint(id: number): Promise<void>;
  deleteCheckpointsNotInList(courseId: number, checkpointNumbers: number[]): Promise<void>;
  
  // Checkpoint progress operations
  getCheckpointProgress(userId: string, checkpointId?: number): Promise<CheckpointProgress[]>;
  getUserCheckpointProgress(userId: string, courseId: number): Promise<CheckpointProgress[]>;
  upsertCheckpointProgress(progress: InsertCheckpointProgress): Promise<CheckpointProgress>;
  
  // Bulk import operations
  importCourseFromJSON(languageCode: string, skillLevelCode: string, courseData: any): Promise<Course>;
  
  // Analytics operations
  trackPageView(pageView: InsertPageView): Promise<PageView>;
  getPageViewsCount(startDate?: Date, endDate?: Date, page?: string): Promise<{date: string, count: number, page?: string}[]>;
  getPageViewsByPage(startDate?: Date, endDate?: Date): Promise<{page: string, count: number}[]>;
  
  // Draft uploads operations (from blueprint:javascript_object_storage)
  getDraftUploads(uploadType?: 'video' | 'json'): Promise<DraftUpload[]>;
  getDraftUpload(id: number): Promise<DraftUpload | undefined>;
  createDraftUpload(upload: InsertDraftUpload): Promise<DraftUpload>;
  updateDraftUpload(id: number, data: Partial<InsertDraftUpload>): Promise<DraftUpload>;
  deleteDraftUpload(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.email, email));
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values([userData])
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    // Delete related data first (due to foreign key constraints)
    await db.delete(checkpointProgress).where(eq(checkpointProgress.userId, id));
    await db.delete(userProgress).where(eq(userProgress.userId, id));
    await db.delete(userStats).where(eq(userStats.userId, id));
    await db.delete(userSettings).where(eq(userSettings.userId, id));
    
    // Finally delete the user
    await db.delete(users).where(eq(users.id, id));
  }

  // Stripe operations
  async updateUserStripeCustomerId(userId: string, customerId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserStripeSubscriptionId(userId: string, subscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ stripeSubscriptionId: subscriptionId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserPriceTier(userId: string, priceTier: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ priceTier, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // User settings operations
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return settings;
  }

  async upsertUserSettings(settingsData: InsertUserSettings): Promise<UserSettings> {
    const [settings] = await db
      .insert(userSettings)
      .values({
        ...settingsData,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: {
          ...settingsData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return settings;
  }

  // User progress operations
  async getUserProgress(userId: string, language?: string): Promise<UserProgress[]> {
    if (language) {
      return await db
        .select()
        .from(userProgress)
        .where(and(eq(userProgress.userId, userId), eq(userProgress.language, language)))
        .orderBy(desc(userProgress.completedAt));
    } else {
      return await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId))
        .orderBy(desc(userProgress.completedAt));
    }
  }

  async getNextLesson(userId: string, language: string): Promise<{courseId: string, lessonId: string} | null> {
    // Get user's skill level from settings
    const userSettingsData = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId))
      .limit(1);
    
    const skillLevelId = userSettingsData.length > 0 ? userSettingsData[0].skillLevelId : 1; // Default to beginner (1) if no settings
    
    // Get all completed lessons for the user
    const completedLessons = await db
      .select()
      .from(userProgress)
      .where(and(
        eq(userProgress.userId, userId), 
        eq(userProgress.language, language),
        eq(userProgress.completed, true)
      ));

    // If no progress at all, start from course1/lesson1
    if (completedLessons.length === 0) {
      console.log('🆕 No progress found, starting from course1/lesson1');
      return { courseId: 'course1', lessonId: 'lesson1' };
    }

    // All languages now use JSON structure with imported checkpoints only

    // For all languages, use database structure with imported course data
    if (true) {
      try {
        // Map language names to language codes
        const languageCodeMap: { [key: string]: string } = {
          'italian': 'it',
          'spanish': 'es', 
          'german': 'de',
          'french': 'fr'
        };
        
        const languageCode = languageCodeMap[language] || language;
        
        const languageRecord = await db
          .select()
          .from(languages)
          .where(eq(languages.code, languageCode))
          .limit(1);
        
        if (languageRecord.length > 0) {
          const courseOrder = ['course1', 'course2', 'course3', 'course4', 'course5', 'course6', 'course7', 'course8', 'course9', 'course10', 'course11', 'course12', 'course13'];
          
          for (const courseId of courseOrder) {
            const courseNumber = parseInt(courseId.replace('course', ''));
            
            // Get course and its lessons and checkpoints from database (filtering by skill level!)
            const course = await db
              .select()
              .from(courses)
              .where(and(
                eq(courses.languageId, languageRecord[0].id),
                eq(courses.skillLevelId, skillLevelId), // Filter by user's skill level
                eq(courses.courseNumber, courseNumber)
              ))
              .limit(1);
            
            if (course.length > 0) {
              // Get lessons for this course
              const courseLessons = await db
                .select()
                .from(lessons)
                .where(eq(lessons.courseId, course[0].id))
                .orderBy(lessons.lessonNumber);
              
              // Get checkpoints for this course
              const courseCheckpoints = await db
                .select()
                .from(checkpoints)
                .where(eq(checkpoints.courseId, course[0].id))
                .orderBy(checkpoints.checkpointNumber);
              
              // Separate regular lessons from IRL lessons
              const regularLessons = courseLessons.filter(lesson => lesson.lessonNumber < 1000);
              const irlLessons = courseLessons.filter(lesson => lesson.lessonNumber >= 1000);
              
              // Create proper lesson sequence: lesson1-4, review1, lesson_irl1, lesson5-8, review2, lesson_irl2, etc.
              const lessonIds: string[] = [];
              
              for (const lesson of regularLessons) {
                lessonIds.push(`lesson${lesson.lessonNumber}`);
                
                // After every 4 lessons, check if there's a corresponding review
                if (lesson.lessonNumber % 4 === 0) {
                  const reviewNumber = lesson.lessonNumber / 4;
                  const correspondingCheckpoint = courseCheckpoints.find((cp: any) => cp.checkpointNumber === reviewNumber);
                  if (correspondingCheckpoint) {
                    lessonIds.push(`review${reviewNumber}`);
                    
                    // Add corresponding IRL lesson after review
                    // lesson_irl1 after review1, lesson_irl2 after review2, etc.
                    const correspondingIRL = irlLessons.find(irl => irl.lessonNumber === 1000 + reviewNumber);
                    if (correspondingIRL) {
                      lessonIds.push(`lesson_irl${reviewNumber}`);
                    }
                  }
                }
              }
              
              // Add final review if it exists
              const finalReview = courseCheckpoints.find((cp: any) => cp.checkpointNumber === 0);
              if (finalReview && courseLessons.length > 0) {
                lessonIds.push('review_final');
              }
              
              // Check each lesson/review in order
              for (const lessonId of lessonIds) {
                const isCompleted = completedLessons.some(
                  lesson => lesson.courseId === courseId && lesson.lessonId === lessonId
                );
                
                if (!isCompleted) {
                  console.log(`📚 Next lesson found: ${courseId}/${lessonId}`);
                  return { courseId, lessonId };
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading course structure from database:', error);
        // Fall back to hardcoded structure if database loading fails
      }
    }

    // Fallback for other languages or if JSON loading fails - use full course structure
    const courseOrder = ['course1', 'course2', 'course3', 'course4', 'course5', 'course6', 'course7', 'course8', 'course9', 'course10', 'course11', 'course12', 'course13'];
    const lessonOrder = ['lesson1', 'lesson2', 'lesson3', 'lesson4', 'lesson5', 'lesson6', 'lesson7', 'lesson8', 'lesson9', 'lesson10'];

    for (const courseId of courseOrder) {
      for (const lessonId of lessonOrder) {
        const isCompleted = completedLessons.some(
          lesson => lesson.courseId === courseId && lesson.lessonId === lessonId
        );
        
        if (!isCompleted) {
          return { courseId, lessonId };
        }
      }
    }

    console.log('🎉 All lessons completed!');
    return null; // All lessons completed
  }

  async upsertUserProgress(progressData: InsertUserProgress): Promise<UserProgress> {
    // Check if progress already exists
    const [existingProgress] = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, progressData.userId),
          eq(userProgress.language, progressData.language),
          eq(userProgress.courseId, progressData.courseId),
          eq(userProgress.lessonId, progressData.lessonId)
        )
      );

    if (existingProgress) {
      // Update existing progress
      const [updatedProgress] = await db
        .update(userProgress)
        .set({
          ...progressData,
          updatedAt: new Date(),
        })
        .where(eq(userProgress.id, existingProgress.id))
        .returning();
      return updatedProgress;
    } else {
      // Insert new progress
      const [newProgress] = await db
        .insert(userProgress)
        .values({
          ...progressData,
          updatedAt: new Date(),
        })
        .returning();
      return newProgress;
    }
  }

  async getLatestProgress(userId: string, language: string): Promise<UserProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.language, language)))
      .orderBy(desc(userProgress.createdAt))
      .limit(1);
    return progress;
  }

  // User stats operations
  async getUserStats(userId: string, language: string): Promise<UserStats | undefined> {
    const [stats] = await db
      .select()
      .from(userStats)
      .where(and(eq(userStats.userId, userId), eq(userStats.language, language)));
    return stats;
  }

  async upsertUserStats(statsData: InsertUserStats): Promise<UserStats> {
    const [stats] = await db
      .insert(userStats)
      .values({
        ...statsData,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userStats.userId, userStats.language],
        set: {
          ...statsData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return stats;
  }

  async updateStreak(userId: string, language: string, streak: number): Promise<void> {
    await db
      .update(userStats)
      .set({ 
        streak, 
        updatedAt: new Date(),
        lastLessonDate: new Date()
      })
      .where(and(eq(userStats.userId, userId), eq(userStats.language, language)));
  }

  async incrementWordsLearned(userId: string, language: string, count: number): Promise<void> {
    const currentStats = await this.getUserStats(userId, language);
    const newWordsLearned = (currentStats?.wordsLearned || 0) + count;
    
    await db
      .update(userStats)
      .set({ 
        wordsLearned: newWordsLearned,
        updatedAt: new Date()
      })
      .where(and(eq(userStats.userId, userId), eq(userStats.language, language)));
  }

  // Reset operations
  async resetUserProgress(userId: string, language: string): Promise<void> {
    await db
      .delete(userProgress)
      .where(and(eq(userProgress.userId, userId), eq(userProgress.language, language)));
  }

  async resetUserStats(userId: string, language: string): Promise<void> {
    await db
      .delete(userStats)
      .where(and(eq(userStats.userId, userId), eq(userStats.language, language)));
  }

  // Waitlist operations
  async addToWaitlist(waitlistData: InsertWaitlist): Promise<Waitlist> {
    const [entry] = await db
      .insert(waitlist)
      .values(waitlistData)
      .onConflictDoNothing()
      .returning();
    
    if (!entry) {
      // Email already exists, fetch the existing entry
      const [existingEntry] = await db
        .select()
        .from(waitlist)
        .where(eq(waitlist.email, waitlistData.email));
      return existingEntry;
    }
    
    return entry;
  }

  async getWaitlistEntries(): Promise<Waitlist[]> {
    return await db.select().from(waitlist).orderBy(desc(waitlist.createdAt));
  }

  // Language operations
  async getLanguages(): Promise<Language[]> {
    return await db.select().from(languages).orderBy(languages.name);
  }

  async getLanguage(id: number): Promise<Language | undefined> {
    const [language] = await db.select().from(languages).where(eq(languages.id, id));
    return language;
  }

  async getLanguageByCode(code: string): Promise<Language | undefined> {
    const [language] = await db.select().from(languages).where(eq(languages.code, code));
    return language;
  }

  async createLanguage(languageData: InsertLanguage): Promise<Language> {
    const [language] = await db.insert(languages).values(languageData).returning();
    return language;
  }

  // Skill level operations
  async getSkillLevels(): Promise<SkillLevel[]> {
    return await db.select().from(skillLevels).orderBy(skillLevels.sortOrder);
  }

  async getSkillLevel(id: number): Promise<SkillLevel | undefined> {
    const [skillLevel] = await db.select().from(skillLevels).where(eq(skillLevels.id, id));
    return skillLevel;
  }

  async getSkillLevelByCode(code: string): Promise<SkillLevel | undefined> {
    const [skillLevel] = await db.select().from(skillLevels).where(eq(skillLevels.code, code));
    return skillLevel;
  }

  async createSkillLevel(skillLevelData: InsertSkillLevel): Promise<SkillLevel> {
    const [skillLevel] = await db.insert(skillLevels).values(skillLevelData).returning();
    return skillLevel;
  }

  // Course operations
  async getCourses(languageId?: number, skillLevelId?: number): Promise<Course[]> {
    if (languageId && skillLevelId) {
      return await db.select().from(courses)
        .where(and(eq(courses.languageId, languageId), eq(courses.skillLevelId, skillLevelId)))
        .orderBy(courses.courseNumber);
    } else if (languageId) {
      return await db.select().from(courses)
        .where(eq(courses.languageId, languageId))
        .orderBy(courses.courseNumber);
    } else if (skillLevelId) {
      return await db.select().from(courses)
        .where(eq(courses.skillLevelId, skillLevelId))
        .orderBy(courses.courseNumber);
    }
    
    return await db.select().from(courses).orderBy(courses.courseNumber);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async getCourseWithRelations(id: number): Promise<CourseWithRelations | undefined> {
    const result = await db.query.courses.findFirst({
      where: eq(courses.id, id),
      with: {
        language: true,
        skillLevel: true,
        lessons: {
          with: {
            steps: true,
          },
          orderBy: lessons.lessonNumber,
        },
        checkpoints: {
          orderBy: checkpoints.checkpointNumber,
        },
      },
    });
    return result;
  }

  async getCoursesWithRelations(languageId?: number, skillLevelId?: number): Promise<CourseWithRelations[]> {
    let whereClause;
    
    if (languageId && skillLevelId) {
      whereClause = and(eq(courses.languageId, languageId), eq(courses.skillLevelId, skillLevelId));
    } else if (languageId) {
      whereClause = eq(courses.languageId, languageId);
    } else if (skillLevelId) {
      whereClause = eq(courses.skillLevelId, skillLevelId);
    }

    const result = await db.query.courses.findMany({
      where: whereClause,
      with: {
        language: true,
        skillLevel: true,
        lessons: {
          with: {
            steps: true,
          },
          orderBy: lessons.lessonNumber,
        },
        checkpoints: {
          orderBy: checkpoints.checkpointNumber,
        },
      },
      orderBy: courses.courseNumber,
    });
    return result;
  }

  async createCourse(courseData: InsertCourse): Promise<Course> {
    const [course] = await db.insert(courses).values(courseData).returning();
    return course;
  }

  async updateCourse(id: number, courseData: Partial<InsertCourse>): Promise<Course> {
    const [course] = await db
      .update(courses)
      .set({ ...courseData, updatedAt: new Date() })
      .where(eq(courses.id, id))
      .returning();
    return course;
  }

  async deleteCourse(id: number): Promise<void> {
    await db.delete(courses).where(eq(courses.id, id));
  }

  // Lesson operations
  async getLessons(courseId: number): Promise<Lesson[]> {
    return await db.select().from(lessons).where(eq(lessons.courseId, courseId)).orderBy(lessons.lessonNumber);
  }

  async getLesson(id: number): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons).where(eq(lessons.id, id));
    return lesson;
  }

  async getLessonWithSteps(id: number): Promise<LessonWithSteps | undefined> {
    const result = await db.query.lessons.findFirst({
      where: eq(lessons.id, id),
      with: {
        steps: {
          orderBy: lessonSteps.stepNumber,
        },
      },
    });
    return result;
  }

  async getLessonByCourseAndNumber(languageCode: string, courseNumber: number, lessonNumber: number): Promise<LessonWithSteps | undefined> {
    // Get language and skill level
    const language = await this.getLanguageByCode(languageCode);
    const skillLevel = await this.getSkillLevelByCode('beginner');
    
    if (!language || !skillLevel) {
      return undefined;
    }

    // Find the most recent active course (handles versioning/updates)
    const courseResults = await db.select()
      .from(courses)
      .where(and(
        eq(courses.languageId, language.id),
        eq(courses.skillLevelId, skillLevel.id),
        eq(courses.courseNumber, courseNumber),
        eq(courses.isActive, true)
      ))
      .orderBy(desc(courses.createdAt));
    
    if (courseResults.length === 0) {
      return undefined;
    }

    const course = courseResults[0];

    // Find the lesson with steps
    const result = await db.query.lessons.findFirst({
      where: and(
        eq(lessons.courseId, course.id),
        eq(lessons.lessonNumber, lessonNumber)
      ),
      with: {
        steps: {
          orderBy: lessonSteps.stepNumber,
        },
      },
    });
    
    return result;
  }

  async createLesson(lessonData: InsertLesson): Promise<Lesson> {
    const [lesson] = await db.insert(lessons).values(lessonData).returning();
    return lesson;
  }

  async updateLesson(id: number, lessonData: Partial<InsertLesson>): Promise<Lesson> {
    const [lesson] = await db
      .update(lessons)
      .set({ ...lessonData, updatedAt: new Date() })
      .where(eq(lessons.id, id))
      .returning();
    return lesson;
  }

  async deleteLesson(id: number): Promise<void> {
    await db.delete(lessons).where(eq(lessons.id, id));
  }

  async getLessonByCourseIdAndNumber(courseId: number, lessonNumber: number): Promise<Lesson | undefined> {
    const [lesson] = await db.select().from(lessons)
      .where(and(eq(lessons.courseId, courseId), eq(lessons.lessonNumber, lessonNumber)));
    return lesson;
  }

  async deleteLessonsNotInList(courseId: number, lessonNumbers: number[]): Promise<void> {
    if (lessonNumbers.length === 0) {
      // Delete all lessons if no lesson numbers provided
      await db.delete(lessons).where(eq(lessons.courseId, courseId));
    } else {
      // Delete lessons not in the provided list
      await db.delete(lessons).where(
        and(
          eq(lessons.courseId, courseId),
          notInArray(lessons.lessonNumber, lessonNumbers)
        )
      );
    }
  }

  // Lesson step operations
  async getLessonSteps(lessonId: number): Promise<LessonStep[]> {
    return await db.select().from(lessonSteps).where(eq(lessonSteps.lessonId, lessonId)).orderBy(lessonSteps.stepNumber);
  }

  async createLessonStep(stepData: InsertLessonStep): Promise<LessonStep> {
    const [step] = await db.insert(lessonSteps).values(stepData).returning();
    return step;
  }

  async updateLessonStep(id: number, stepData: Partial<InsertLessonStep>): Promise<LessonStep> {
    const [step] = await db
      .update(lessonSteps)
      .set({ ...stepData, updatedAt: new Date() })
      .where(eq(lessonSteps.id, id))
      .returning();
    return step;
  }

  async deleteLessonStep(id: number): Promise<void> {
    await db.delete(lessonSteps).where(eq(lessonSteps.id, id));
  }

  async getLessonStepByNumber(lessonId: number, stepNumber: number): Promise<LessonStep | undefined> {
    const [step] = await db.select().from(lessonSteps)
      .where(and(eq(lessonSteps.lessonId, lessonId), eq(lessonSteps.stepNumber, stepNumber)));
    return step;
  }

  async deleteStepsNotInList(lessonId: number, stepNumbers: number[]): Promise<void> {
    if (stepNumbers.length === 0) {
      // Delete all steps if no step numbers provided
      await db.delete(lessonSteps).where(eq(lessonSteps.lessonId, lessonId));
    } else {
      // Delete steps not in the provided list
      await db.delete(lessonSteps).where(
        and(
          eq(lessonSteps.lessonId, lessonId),
          notInArray(lessonSteps.stepNumber, stepNumbers)
        )
      );
    }
  }

  // Bulk import operations
  async importCourseFromJSON(languageCode: string, skillLevelCode: string, courseData: any): Promise<Course> {
    // Get language and skill level
    const language = await this.getLanguageByCode(languageCode);
    const skillLevel = await this.getSkillLevelByCode(skillLevelCode);

    if (!language) {
      throw new Error(`Language with code '${languageCode}' not found`);
    }
    if (!skillLevel) {
      throw new Error(`Skill level with code '${skillLevelCode}' not found`);
    }

    // Extract course key and data
    const courseKey = Object.keys(courseData)[0];
    const course = courseData[courseKey];
    
    // Parse course number from key (e.g., "course1" -> 1)
    const courseNumberMatch = courseKey.match(/\d+/);
    const courseNumber = courseNumberMatch ? parseInt(courseNumberMatch[0]) : 1;

    // Create or update course
    const existingCourse = await db.select().from(courses).where(
      and(
        eq(courses.languageId, language.id),
        eq(courses.skillLevelId, skillLevel.id),
        eq(courses.courseNumber, courseNumber)
      )
    );

    let createdCourse: Course;
    const isUpdate = existingCourse.length > 0;
    
    if (isUpdate) {
      // Update existing course metadata
      [createdCourse] = await db
        .update(courses)
        .set({
          title: course.title,
          description: course.description,
          updatedAt: new Date(),
        })
        .where(eq(courses.id, existingCourse[0].id))
        .returning();
    } else {
      // Create new course
      createdCourse = await this.createCourse({
        languageId: language.id,
        skillLevelId: skillLevel.id,
        courseNumber,
        title: course.title,
        description: course.description,
      });
    }

    // Track lesson and checkpoint numbers from JSON to know what to keep
    const jsonLessonNumbers: number[] = [];
    const jsonCheckpointNumbers: number[] = [];

    // Import lessons and reviews (iterate over course object, excluding metadata)
    for (const [lessonKey, lessonData] of Object.entries(course).filter(([key]) => 
      key.startsWith('lesson') || key.startsWith('review')
    )) {
      if (lessonKey.startsWith('lesson')) {
        let lessonNumber: number;
        let isIRLLesson = false;
        
        // Handle IRL lessons (lesson_irl1, lesson_irl2, etc.)
        if (lessonKey.startsWith('lesson_irl')) {
          const irlNumber = parseInt(lessonKey.replace('lesson_irl', ''));
          if (isNaN(irlNumber)) {
            console.warn(`Skipping invalid IRL lesson key: ${lessonKey}`);
            continue;
          }
          lessonNumber = 1000 + irlNumber; // Use offset to avoid conflicts with regular lessons
          isIRLLesson = true;
        } else {
          // Handle regular lessons
          lessonNumber = parseInt(lessonKey.replace('lesson', ''));
          if (isNaN(lessonNumber)) {
            console.warn(`Skipping invalid lesson key: ${lessonKey}`);
            continue;
          }
        }
        
        const lesson = lessonData as any;
        jsonLessonNumbers.push(lessonNumber);

        // Check if lesson already exists (for updates)
        let createdLesson: Lesson;
        const existingLesson = await this.getLessonByCourseIdAndNumber(createdCourse.id, lessonNumber);
        
        if (existingLesson) {
          // Update existing lesson
          createdLesson = await this.updateLesson(existingLesson.id, { title: lesson.title });
        } else {
          // Create new lesson
          createdLesson = await this.createLesson({
            courseId: createdCourse.id,
            lessonNumber,
            title: lesson.title,
          });
        }

        if (isIRLLesson) {
          // Handle IRL video lesson structure - support both old (step1) and new (steps array) format
          const stepData = lesson.steps?.[0] || lesson.step1;
          if (!stepData) {
            console.warn(`Skipping IRL lesson ${lessonKey} - no step data found`);
            continue;
          }

          const irlContent = {
            isIRLLesson: true,
            videoUrl: stepData.video_url,
            word: stepData.prompt, // Store prompt as word for consistency
            expectedAnswers: stepData.expected_answers,
            answerPrompt: stepData.answer_prompt || '' // Add the new answer_prompt field
          };

          // Check if step already exists (for updates)
          const existingStep = await this.getLessonStepByNumber(createdLesson.id, 1);
          if (existingStep) {
            await this.updateLessonStep(existingStep.id, { stepType: 'irl_video', content: irlContent });
          } else {
            await this.createLessonStep({
              lessonId: createdLesson.id,
              stepNumber: 1,
              stepType: 'irl_video',
              content: irlContent,
            });
          }
        } else {
          // Import steps - split original step1 into word review and quick check
          const originalStep1 = lesson.step1;
          const wordReviewContent = {
            italian: originalStep1.italian,
            english: originalStep1.english,
            audio: originalStep1.audio,
            note: originalStep1.note,
          };
          const quickCheckContent = {
            mcq: originalStep1.mcq,
          };

          const steps = [
            { stepNumber: 1, stepType: 'word_review', content: wordReviewContent },
            { stepNumber: 2, stepType: 'quick_check', content: quickCheckContent },
            { stepNumber: 3, stepType: 'typing', content: lesson.step2 },
          ];

          // Handle step 4 - check if it's a video step or traditional comprehension
          if (lesson.step4) {
            if (lesson.step4.type === 'video_choice') {
              // Gender-based video choice step
              steps.push({ 
                stepNumber: 4, 
                stepType: 'video_choice', 
                content: lesson.step4 
              });
            } else if (lesson.step4.type === 'video' && lesson.step4.requiredTier) {
              // Pro tier video step - add field mapping for answer_prompt
              const proVideoContent = {
                ...lesson.step4,
                answerPrompt: lesson.step4.answer_prompt || '',
                expectedAnswers: lesson.step4.expected_answers || []
              };
              steps.push({ 
                stepNumber: 4, 
                stepType: 'pro_video', 
                content: proVideoContent 
              });
            } else {
              // Fallback to comprehension if step4 doesn't have expected video structure
              steps.push({ 
                stepNumber: 4, 
                stepType: 'comprehension', 
                content: lesson.step3 
              });
            }
          } else {
            // Traditional comprehension step
            steps.push({ 
              stepNumber: 4, 
              stepType: 'comprehension', 
              content: lesson.step3 
            });
          }

          // Handle step 5 - text-based educational content (bonus tips, cultural snacks, mini challenges)
          if (lesson.step5 && lesson.step5.type === 'text') {
            steps.push({
              stepNumber: 5,
              stepType: 'text_tip',
              content: lesson.step5
            });
          }

          // Track step numbers for cleanup
          const stepNumbers = steps.map(s => s.stepNumber);
          
          for (const step of steps) {
            // Check if step already exists (for updates)
            const existingStep = await this.getLessonStepByNumber(createdLesson.id, step.stepNumber);
            if (existingStep) {
              await this.updateLessonStep(existingStep.id, { stepType: step.stepType, content: step.content });
            } else {
              await this.createLessonStep({
                lessonId: createdLesson.id,
                stepNumber: step.stepNumber,
                stepType: step.stepType,
                content: step.content,
              });
            }
          }
          
          // Delete steps not in current JSON
          await this.deleteStepsNotInList(createdLesson.id, stepNumbers);
        }
      } else if (lessonKey.startsWith('review')) {
        // Handle review checkpoints
        const reviewMatch = lessonKey.match(/review(\d+|_final)/);
        let checkpointNumber = 0;
        if (reviewMatch) {
          if (reviewMatch[1] === '_final') {
            checkpointNumber = 999; // Use high number for final review
          } else {
            checkpointNumber = parseInt(reviewMatch[1]) || 0;
          }
        }
        const review = lessonData as any;
        jsonCheckpointNumbers.push(checkpointNumber);

        // Extract teaser content if present (lesson_teaser1)
        const teaserContent = review.lesson_teaser1 || null;

        // Check if checkpoint already exists (for updates)
        const existingCheckpoint = await this.getCheckpointByCourseAndNumber(createdCourse.id, checkpointNumber);
        
        if (existingCheckpoint) {
          // Update existing checkpoint (preserves user progress since we don't delete checkpoint)
          await this.updateCheckpoint(existingCheckpoint.id, {
            title: review.title,
            description: review.title,
            questions: review.questions,
            teaser: teaserContent,
          });
        } else {
          // Create new checkpoint
          await this.createCheckpoint({
            courseId: createdCourse.id,
            checkpointNumber,
            title: review.title,
            description: review.title,
            questions: review.questions,
            teaser: teaserContent,
          });
        }
      }
    }

    // Clean up lessons and checkpoints not in the current JSON (only for updates)
    if (isUpdate) {
      await this.deleteLessonsNotInList(createdCourse.id, jsonLessonNumbers);
      await this.deleteCheckpointsNotInList(createdCourse.id, jsonCheckpointNumbers);
    }

    return createdCourse;
  }

  // Checkpoint operations
  async getCheckpoints(courseId: number): Promise<Checkpoint[]> {
    return await db.select().from(checkpoints).where(eq(checkpoints.courseId, courseId)).orderBy(checkpoints.checkpointNumber);
  }

  async getAllCheckpoints(): Promise<Checkpoint[]> {
    return await db.select().from(checkpoints).where(eq(checkpoints.isActive, true)).orderBy(checkpoints.checkpointNumber);
  }

  async getCheckpoint(id: number): Promise<Checkpoint | undefined> {
    const [checkpoint] = await db.select().from(checkpoints).where(eq(checkpoints.id, id));
    return checkpoint;
  }

  async createCheckpoint(checkpointData: InsertCheckpoint): Promise<Checkpoint> {
    const [checkpoint] = await db.insert(checkpoints).values(checkpointData).returning();
    return checkpoint;
  }

  async updateCheckpoint(id: number, checkpointData: Partial<InsertCheckpoint>): Promise<Checkpoint> {
    const [checkpoint] = await db
      .update(checkpoints)
      .set({ ...checkpointData, updatedAt: new Date() })
      .where(eq(checkpoints.id, id))
      .returning();
    return checkpoint;
  }

  async deleteCheckpoint(id: number): Promise<void> {
    await db.delete(checkpoints).where(eq(checkpoints.id, id));
  }

  async getCheckpointByCourseAndNumber(courseId: number, checkpointNumber: number): Promise<Checkpoint | undefined> {
    const [checkpoint] = await db.select().from(checkpoints)
      .where(and(eq(checkpoints.courseId, courseId), eq(checkpoints.checkpointNumber, checkpointNumber)));
    return checkpoint;
  }

  async deleteCheckpointsNotInList(courseId: number, checkpointNumbers: number[]): Promise<void> {
    if (checkpointNumbers.length === 0) {
      // Delete all checkpoints if no checkpoint numbers provided
      await db.delete(checkpoints).where(eq(checkpoints.courseId, courseId));
    } else {
      // Delete checkpoints not in the provided list
      await db.delete(checkpoints).where(
        and(
          eq(checkpoints.courseId, courseId),
          notInArray(checkpoints.checkpointNumber, checkpointNumbers)
        )
      );
    }
  }

  // Checkpoint progress operations
  async getCheckpointProgress(userId: string, checkpointId?: number): Promise<CheckpointProgress[]> {
    if (checkpointId) {
      return await db.select().from(checkpointProgress)
        .where(and(eq(checkpointProgress.userId, userId), eq(checkpointProgress.checkpointId, checkpointId)))
        .orderBy(desc(checkpointProgress.createdAt));
    } else {
      return await db.select().from(checkpointProgress)
        .where(eq(checkpointProgress.userId, userId))
        .orderBy(desc(checkpointProgress.createdAt));
    }
  }

  async getUserCheckpointProgress(userId: string, courseId: number): Promise<CheckpointProgress[]> {
    const results = await db
      .select({
        id: checkpointProgress.id,
        userId: checkpointProgress.userId,
        checkpointId: checkpointProgress.checkpointId,
        completed: checkpointProgress.completed,
        score: checkpointProgress.score,
        answers: checkpointProgress.answers,
        timeSpent: checkpointProgress.timeSpent,
        completedAt: checkpointProgress.completedAt,
        createdAt: checkpointProgress.createdAt,
        updatedAt: checkpointProgress.updatedAt,
      })
      .from(checkpointProgress)
      .innerJoin(checkpoints, eq(checkpointProgress.checkpointId, checkpoints.id))
      .where(and(eq(checkpointProgress.userId, userId), eq(checkpoints.courseId, courseId)))
      .orderBy(checkpoints.checkpointNumber);
    
    return results;
  }

  async upsertCheckpointProgress(progressData: InsertCheckpointProgress): Promise<CheckpointProgress> {
    const existing = await db
      .select()
      .from(checkpointProgress)
      .where(
        and(
          eq(checkpointProgress.userId, progressData.userId),
          eq(checkpointProgress.checkpointId, progressData.checkpointId)
        )
      );

    if (existing.length > 0) {
      const [updated] = await db
        .update(checkpointProgress)
        .set({ ...progressData, updatedAt: new Date() })
        .where(eq(checkpointProgress.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(checkpointProgress).values(progressData).returning();
      return created;
    }
  }

  // Analytics operations
  async trackPageView(pageViewData: InsertPageView): Promise<PageView> {
    const [pageView] = await db.insert(pageViews).values(pageViewData).returning();
    return pageView;
  }

  async getPageViewsCount(startDate?: Date, endDate?: Date, page?: string): Promise<{date: string, count: number, page?: string}[]> {
    let whereConditions: any = sql`1 = 1`;
    
    // Filter out non-user-facing pages and assets
    whereConditions = sql`${whereConditions} AND ${pageViews.page} NOT LIKE '/api/%' 
      AND ${pageViews.page} NOT LIKE '%.js' 
      AND ${pageViews.page} NOT LIKE '%.css' 
      AND ${pageViews.page} NOT LIKE '%.map' 
      AND ${pageViews.page} NOT LIKE '%.ts' 
      AND ${pageViews.page} NOT LIKE '%.tsx' 
      AND ${pageViews.page} NOT LIKE '%.png' 
      AND ${pageViews.page} NOT LIKE '%.jpg' 
      AND ${pageViews.page} NOT LIKE '%.jpeg' 
      AND ${pageViews.page} NOT LIKE '%.gif' 
      AND ${pageViews.page} NOT LIKE '%.svg' 
      AND ${pageViews.page} NOT LIKE '%.ico' 
      AND ${pageViews.page} NOT LIKE '%.mov' 
      AND ${pageViews.page} NOT LIKE '%.mp4' 
      AND ${pageViews.page} NOT LIKE '%.webm' 
      AND ${pageViews.page} NOT LIKE '%.pdf' 
      AND ${pageViews.page} NOT LIKE '%.docx' 
      AND ${pageViews.page} NOT LIKE '%.json' 
      AND ${pageViews.page} NOT LIKE '/src/%'
      AND ${pageViews.page} NOT LIKE '/_next/%'
      AND ${pageViews.page} NOT LIKE '/static/%'
      AND ${pageViews.page} NOT LIKE '/attached_assets/%'
      AND ${pageViews.page} NOT LIKE '/@fs/%'
      AND ${pageViews.page} NOT LIKE '/node_modules/%'
      AND ${pageViews.page} NOT LIKE '/assets/%'`;
    
    if (startDate) {
      whereConditions = sql`${whereConditions} AND ${pageViews.viewedAt} >= ${startDate}`;
    }
    if (endDate) {
      whereConditions = sql`${whereConditions} AND ${pageViews.viewedAt} <= ${endDate}`;
    }
    if (page) {
      whereConditions = sql`${whereConditions} AND ${pageViews.page} = ${page}`;
    }

    const query = sql`
      SELECT 
        DATE(${pageViews.viewedAt}) as date, 
        COUNT(*) as count
        ${page ? sql`` : sql`, ${pageViews.page} as page`}
      FROM ${pageViews} 
      WHERE ${whereConditions}
      GROUP BY DATE(${pageViews.viewedAt})${page ? sql`` : sql`, ${pageViews.page}`}
      ORDER BY date DESC
    `;

    const results = await db.execute(query);
    return results.rows as {date: string, count: number, page?: string}[];
  }

  async getPageViewsByPage(startDate?: Date, endDate?: Date): Promise<{page: string, count: number}[]> {
    let whereConditions: any = sql`1 = 1`;
    
    // Filter out non-user-facing pages and assets
    whereConditions = sql`${whereConditions} AND ${pageViews.page} NOT LIKE '/api/%' 
      AND ${pageViews.page} NOT LIKE '%.js' 
      AND ${pageViews.page} NOT LIKE '%.css' 
      AND ${pageViews.page} NOT LIKE '%.map' 
      AND ${pageViews.page} NOT LIKE '%.ts' 
      AND ${pageViews.page} NOT LIKE '%.tsx' 
      AND ${pageViews.page} NOT LIKE '%.png' 
      AND ${pageViews.page} NOT LIKE '%.jpg' 
      AND ${pageViews.page} NOT LIKE '%.jpeg' 
      AND ${pageViews.page} NOT LIKE '%.gif' 
      AND ${pageViews.page} NOT LIKE '%.svg' 
      AND ${pageViews.page} NOT LIKE '%.ico' 
      AND ${pageViews.page} NOT LIKE '%.mov' 
      AND ${pageViews.page} NOT LIKE '%.mp4' 
      AND ${pageViews.page} NOT LIKE '%.webm' 
      AND ${pageViews.page} NOT LIKE '%.pdf' 
      AND ${pageViews.page} NOT LIKE '%.docx' 
      AND ${pageViews.page} NOT LIKE '%.json' 
      AND ${pageViews.page} NOT LIKE '/src/%'
      AND ${pageViews.page} NOT LIKE '/_next/%'
      AND ${pageViews.page} NOT LIKE '/static/%'
      AND ${pageViews.page} NOT LIKE '/attached_assets/%'
      AND ${pageViews.page} NOT LIKE '/@fs/%'
      AND ${pageViews.page} NOT LIKE '/node_modules/%'
      AND ${pageViews.page} NOT LIKE '/assets/%'`;
    
    if (startDate) {
      whereConditions = sql`${whereConditions} AND ${pageViews.viewedAt} >= ${startDate}`;
    }
    if (endDate) {
      whereConditions = sql`${whereConditions} AND ${pageViews.viewedAt} <= ${endDate}`;
    }

    const query = sql`
      SELECT 
        ${pageViews.page} as page, 
        COUNT(*) as count
      FROM ${pageViews} 
      WHERE ${whereConditions}
      GROUP BY ${pageViews.page}
      ORDER BY count DESC
    `;

    const results = await db.execute(query);
    return results.rows as {page: string, count: number}[];
  }

  // Draft uploads operations (from blueprint:javascript_object_storage)
  async getDraftUploads(uploadType?: 'video' | 'json'): Promise<DraftUpload[]> {
    if (uploadType) {
      return await db.select().from(draftUploads)
        .where(eq(draftUploads.uploadType, uploadType))
        .orderBy(desc(draftUploads.createdAt));
    }
    return await db.select().from(draftUploads).orderBy(desc(draftUploads.createdAt));
  }

  async getDraftUpload(id: number): Promise<DraftUpload | undefined> {
    const [upload] = await db.select().from(draftUploads).where(eq(draftUploads.id, id));
    return upload;
  }

  async createDraftUpload(upload: InsertDraftUpload): Promise<DraftUpload> {
    const [newUpload] = await db.insert(draftUploads).values(upload).returning();
    return newUpload;
  }

  async updateDraftUpload(id: number, data: Partial<InsertDraftUpload>): Promise<DraftUpload> {
    const [updated] = await db.update(draftUploads)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(draftUploads.id, id))
      .returning();
    return updated;
  }

  async deleteDraftUpload(id: number): Promise<void> {
    await db.delete(draftUploads).where(eq(draftUploads.id, id));
  }
}

export const storage = new DatabaseStorage();
