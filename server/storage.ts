import {
  users,
  userSettings,
  userProgress,
  userStats,
  type User,
  type UpsertUser,
  type UserSettings,
  type InsertUserSettings,
  type UserProgress,
  type InsertUserProgress,
  type UserStats,
  type InsertUserStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
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
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
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
    const [progress] = await db
      .insert(userProgress)
      .values({
        ...progressData,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [userProgress.userId, userProgress.language, userProgress.courseId, userProgress.lessonId],
        set: {
          ...progressData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return progress;
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
}

export const storage = new DatabaseStorage();
