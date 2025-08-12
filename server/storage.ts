import {
  users,
  userSettings,
  userProgress,
  userStats,
  waitlist,
  languages,
  skillLevels,
  courses,
  lessons,
  lessonSteps,
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
  type CourseWithRelations,
  type LessonWithSteps,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User[]>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, lesson: Partial<InsertLesson>): Promise<Lesson>;
  deleteLesson(id: number): Promise<void>;
  
  // Lesson step operations
  getLessonSteps(lessonId: number): Promise<LessonStep[]>;
  createLessonStep(step: InsertLessonStep): Promise<LessonStep>;
  updateLessonStep(id: number, step: Partial<InsertLessonStep>): Promise<LessonStep>;
  deleteLessonStep(id: number): Promise<void>;
  
  // Bulk import operations
  importCourseFromJSON(languageCode: string, skillLevelCode: string, courseData: any): Promise<Course>;
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

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
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
    // Get all completed lessons for the user
    const completedLessons = await db
      .select()
      .from(userProgress)
      .where(and(
        eq(userProgress.userId, userId), 
        eq(userProgress.language, language),
        eq(userProgress.completed, true)
      ));

    // For Italian, we have courses 1-4, each with lessons 1-4 (some have 3)
    const courseOrder = ['course1', 'course2', 'course3', 'course4'];
    const lessonOrder = ['lesson1', 'lesson2', 'lesson3', 'lesson4'];

    // If no progress at all, start from course1/lesson1
    if (completedLessons.length === 0) {
      console.log('🆕 No progress found, starting from course1/lesson1');
      return { courseId: 'course1', lessonId: 'lesson1' };
    }

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
    const courseNumber = parseInt(courseKey.replace('course', ''));

    // Create or update course
    const existingCourse = await db.select().from(courses).where(
      and(
        eq(courses.languageId, language.id),
        eq(courses.skillLevelId, skillLevel.id),
        eq(courses.courseNumber, courseNumber)
      )
    );

    let createdCourse: Course;
    if (existingCourse.length > 0) {
      // Update existing course
      [createdCourse] = await db
        .update(courses)
        .set({
          title: course.title,
          description: course.description,
          updatedAt: new Date(),
        })
        .where(eq(courses.id, existingCourse[0].id))
        .returning();

      // Delete existing lessons and steps
      await db.delete(lessons).where(eq(lessons.courseId, createdCourse.id));
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

    // Import lessons
    for (const [lessonKey, lessonData] of Object.entries(course.lessons)) {
      const lessonNumber = parseInt(lessonKey.replace('lesson', ''));
      const lesson = lessonData as any;

      const createdLesson = await this.createLesson({
        courseId: createdCourse.id,
        lessonNumber,
        title: lesson.title,
      });

      // Import steps
      const steps = [
        { stepNumber: 1, stepType: 'introduction', content: lesson.step1 },
        { stepNumber: 2, stepType: 'typing', content: lesson.step2 },
        { stepNumber: 3, stepType: 'comprehension', content: lesson.step3 },
      ];

      for (const step of steps) {
        await this.createLessonStep({
          lessonId: createdLesson.id,
          stepNumber: step.stepNumber,
          stepType: step.stepType,
          content: step.content,
        });
      }
    }

    return createdCourse;
  }
}

export const storage = new DatabaseStorage();
