import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertUserSettingsSchema, insertUserProgressSchema, insertWaitlistSchema } from "@shared/schema";
import { z } from "zod";
import fs from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Waitlist route (no auth required)
  app.post('/api/waitlist', async (req, res) => {
    try {
      const waitlistData = insertWaitlistSchema.parse(req.body);
      
      // Check if email already exists
      const existingEntries = await storage.getWaitlistEntries();
      const emailExists = existingEntries.find(entry => 
        entry.email.toLowerCase() === waitlistData.email.toLowerCase()
      );
      
      if (emailExists) {
        return res.status(400).json({ 
          message: "This email is already on the waitlist." 
        });
      }
      
      const entry = await storage.addToWaitlist(waitlistData);
      res.json({ 
        message: "Successfully added to waitlist",
        entry: {
          id: entry.id,
          email: entry.email,
          language: entry.language,
          level: entry.level,
          createdAt: entry.createdAt
        }
      });
    } catch (error) {
      console.error("Error adding to waitlist:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data provided",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to add to waitlist" });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User settings routes
  app.get('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getUserSettings(userId);
      
      if (!settings) {
        // Create default settings
        const defaultSettings = await storage.upsertUserSettings({
          userId,
          selectedLanguage: "spanish",
          notificationFrequency: 30,
          notificationsEnabled: false,
        });
        return res.json(defaultSettings);
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put('/api/settings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settingsData = insertUserSettingsSchema.parse({
        ...req.body,
        userId,
      });
      
      const settings = await storage.upsertUserSettings(settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid settings data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // User progress routes
  app.get('/api/progress/:language', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { language } = req.params;
      
      const progress = await storage.getUserProgress(userId, language);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  // Get next lesson for user
  app.get('/api/next-lesson/:language', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { language } = req.params;
      
      const nextLesson = await storage.getNextLesson(userId, language);
      
      if (!nextLesson) {
        return res.json({ message: "All lessons completed!", completed: true });
      }

      // Get the actual lesson data
      if (language === 'italian') {
        const coursesPath = path.join(process.cwd(), 'server', 'italian-courses.json');
        const coursesData = JSON.parse(fs.readFileSync(coursesPath, 'utf-8'));
        const course = coursesData[nextLesson.courseId];
        
        if (course && course.lessons[nextLesson.lessonId]) {
          res.json({
            courseId: nextLesson.courseId,
            courseTitle: course.title,
            courseDescription: course.description,
            lessonId: nextLesson.lessonId,
            lesson: course.lessons[nextLesson.lessonId]
          });
        } else {
          res.status(404).json({ message: "Lesson data not found" });
        }
      } else {
        res.status(404).json({ message: "Language not supported for course structure" });
      }
    } catch (error) {
      console.error("Error fetching next lesson:", error);
      res.status(500).json({ message: "Failed to fetch next lesson" });
    }
  });

  app.post('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Convert completedAt from string to Date if provided
      const requestData = { ...req.body, userId };
      if (requestData.completedAt && typeof requestData.completedAt === 'string') {
        requestData.completedAt = new Date(requestData.completedAt);
      }
      
      const progressData = insertUserProgressSchema.parse(requestData);
      
      const progress = await storage.upsertUserProgress(progressData);
      
      // Update stats if lesson is completed
      if (progressData.completed) {
        const stats = await storage.getUserStats(userId, progressData.language);
        const totalLessons = (stats?.totalLessons || 0) + 1;
        
        // Calculate streak
        const today = new Date();
        const lastLessonDate = stats?.lastLessonDate;
        let streak = stats?.streak || 0;
        
        if (lastLessonDate) {
          const daysDiff = Math.floor((today.getTime() - lastLessonDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff === 1) {
            streak += 1;
          } else if (daysDiff > 1) {
            streak = 1;
          }
          // If daysDiff === 0, keep current streak (same day)
        } else {
          streak = 1;
        }
        
        await storage.upsertUserStats({
          userId,
          language: progressData.language,
          streak,
          totalLessons,
          wordsLearned: stats?.wordsLearned || 0,
          lastLessonDate: today,
        });
      }
      
      res.json(progress);
    } catch (error) {
      console.error("Error updating progress:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid progress data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  // User stats routes
  app.get('/api/stats/:language', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { language } = req.params;
      
      let stats = await storage.getUserStats(userId, language);
      
      if (!stats) {
        // Create default stats
        stats = await storage.upsertUserStats({
          userId,
          language,
          streak: 0,
          totalLessons: 0,
          wordsLearned: 0,
        });
      }
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Reset user progress endpoint
  app.delete('/api/progress/:language/reset', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { language } = req.params;
      
      console.log(`🔄 Resetting progress for user ${userId} in language ${language}`);
      
      // Reset user progress and stats
      await storage.resetUserProgress(userId, language);
      await storage.resetUserStats(userId, language);
      
      console.log(`✅ Successfully reset all progress for user ${userId} in language ${language}`);
      
      res.json({ 
        message: "Progress reset successfully", 
        language,
        resetAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error resetting progress:", error);
      res.status(500).json({ message: "Failed to reset progress" });
    }
  });

  // Italian courses routes
  app.get('/api/courses/:language', async (req, res) => {
    try {
      const { language } = req.params;
      let coursesPath;
      
      if (language === 'italian') {
        coursesPath = path.join(process.cwd(), 'server', 'italian-courses.json');
      } else {
        // Fallback to old lessons structure for other languages
        coursesPath = path.join(process.cwd(), 'server', 'lessons.json');
      }
      
      if (!fs.existsSync(coursesPath)) {
        return res.status(404).json({ message: "Courses file not found" });
      }
      
      const coursesData = JSON.parse(fs.readFileSync(coursesPath, 'utf-8'));
      
      if (language === 'italian') {
        res.json(coursesData);
      } else {
        const languageLessons = coursesData[language];
        if (!languageLessons) {
          return res.status(404).json({ message: `Courses not found for language: ${language}` });
        }
        res.json(languageLessons);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  // Get specific course and lesson
  app.get('/api/courses/:language/:courseId/:lessonId', async (req, res) => {
    try {
      const { language, courseId, lessonId } = req.params;
      
      if (language === 'italian') {
        const coursesPath = path.join(process.cwd(), 'server', 'italian-courses.json');
        
        if (!fs.existsSync(coursesPath)) {
          return res.status(404).json({ message: "Italian courses file not found" });
        }
        
        const coursesData = JSON.parse(fs.readFileSync(coursesPath, 'utf-8'));
        const course = coursesData[courseId];
        
        if (!course || !course.lessons[lessonId]) {
          return res.status(404).json({ message: `Lesson not found: ${courseId}/${lessonId}` });
        }
        
        res.json({
          courseId,
          courseTitle: course.title,
          courseDescription: course.description,
          lessonId,
          lesson: course.lessons[lessonId]
        });
      } else {
        // Fallback for other languages using old structure
        return res.status(404).json({ message: "Course structure not supported for this language" });
      }
    } catch (error) {
      console.error("Error fetching specific course lesson:", error);
      res.status(500).json({ message: "Failed to fetch course lesson" });
    }
  });

  // Lessons routes (backward compatibility)
  app.get('/api/lessons/:language', async (req, res) => {
    try {
      const { language } = req.params;
      const lessonsPath = path.join(process.cwd(), 'server', 'lessons.json');
      
      console.log(`Looking for lessons file at: ${lessonsPath}`);
      console.log(`File exists: ${fs.existsSync(lessonsPath)}`);
      
      if (!fs.existsSync(lessonsPath)) {
        return res.status(404).json({ message: "Lessons file not found" });
      }
      
      const lessonsData = JSON.parse(fs.readFileSync(lessonsPath, 'utf-8'));
      const languageLessons = lessonsData[language];
      
      if (!languageLessons) {
        return res.status(404).json({ message: `Lessons not found for language: ${language}` });
      }
      
      res.json(languageLessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  // Get specific lesson by week and day (maps to category-based structure)
  app.get('/api/lessons/:language/:week/:day', async (req, res) => {
    try {
      const { language, week, day } = req.params;
      const lessonsPath = path.join(process.cwd(), 'server', 'lessons.json');
      
      if (!fs.existsSync(lessonsPath)) {
        return res.status(404).json({ message: "Lessons file not found" });
      }
      
      const lessonsData = JSON.parse(fs.readFileSync(lessonsPath, 'utf-8'));
      const languageLessons = lessonsData[language];
      
      if (!languageLessons) {
        return res.status(404).json({ message: `Lessons not found for language: ${language}` });
      }

      // First try old week/day structure for backwards compatibility
      const weekKey = `week_${week}`;
      const dayKey = `day_${day}`;
      
      const weekLessons = languageLessons[weekKey];
      if (weekLessons && weekLessons[dayKey]) {
        return res.json(weekLessons[dayKey]);
      }

      // Map week/day to category-based structure
      // Week corresponds to categoryOrder, Day corresponds to lesson number within category
      const targetCategoryOrder = parseInt(week);
      const targetLessonNumber = parseInt(day);
      
      console.log(`Mapping week ${week}, day ${day} to categoryOrder ${targetCategoryOrder}, lesson ${targetLessonNumber}`);
      
      // Find lessons with the target categoryOrder
      let foundLesson: any = null;
      
      Object.keys(languageLessons).forEach(categoryKey => {
        const categoryData = languageLessons[categoryKey];
        
        Object.keys(categoryData).forEach(lessonKey => {
          const lesson = categoryData[lessonKey];
          
          if (lesson.categoryOrder === targetCategoryOrder) {
            const lessonNumber = parseInt(lessonKey.replace('lesson_', ''));
            if (lessonNumber === targetLessonNumber) {
              foundLesson = lesson;
            }
          }
        });
      });
      
      if (!foundLesson) {
        return res.status(404).json({ 
          message: `Lesson not found: week ${week} (categoryOrder ${targetCategoryOrder}), day ${day} (lesson ${targetLessonNumber}) for ${language}` 
        });
      }
      
      console.log(`Found lesson: ${foundLesson.category} - ${foundLesson.title}`);
      res.json(foundLesson);
    } catch (error) {
      console.error("Error fetching specific lesson:", error);
      res.status(500).json({ message: "Failed to fetch lesson" });
    }
  });

  // Notification lesson route - gets a random lesson question for notifications
  app.get('/api/notification-lesson/:language', async (req, res) => {
    try {
      const { language } = req.params;
      const lessonsPath = path.join(process.cwd(), 'server', 'lessons.json');
      
      console.log(`🔍 Looking for lessons at: ${lessonsPath}`);
      
      if (!fs.existsSync(lessonsPath)) {
        console.error(`❌ Lessons file not found at: ${lessonsPath}`);
        return res.status(404).json({ message: "Lessons file not found" });
      }
      
      const lessonsData = JSON.parse(fs.readFileSync(lessonsPath, 'utf-8'));
      const languageLessons = lessonsData[language];
      
      console.log(`🔍 Available languages: ${Object.keys(lessonsData)}`);
      console.log(`🔍 Looking for language: ${language}`);
      console.log(`🔍 Language lessons found: ${!!languageLessons}`);
      
      if (!languageLessons) {
        return res.status(404).json({ message: `Lessons not found for language: ${language}` });
      }
      
      // Get all available lessons (handle both old week-based and new category-based structure)
      const allLessons: Array<{
        lesson: any;
        week?: number;
        day?: number;
        category?: string;
      }> = [];
      
      Object.keys(languageLessons).forEach(categoryKey => {
        const categoryData = languageLessons[categoryKey];
        
        if (categoryKey.startsWith('week_')) {
          // Handle old week-based structure
          const week = parseInt(categoryKey.replace('week_', ''));
          Object.keys(categoryData).forEach(dayKey => {
            const day = parseInt(dayKey.replace('day_', ''));
            const lesson = categoryData[dayKey];
            allLessons.push({ lesson, week, day });
          });
        } else {
          // Handle new category-based structure
          Object.keys(categoryData).forEach(lessonKey => {
            const lesson = categoryData[lessonKey];
            allLessons.push({ 
              lesson, 
              category: lesson.category || categoryKey,
              week: lesson.week || 1,
              day: lesson.day || allLessons.length + 1
            });
          });
        }
      });
      
      if (allLessons.length === 0) {
        return res.status(404).json({ message: `No lessons found for ${language}` });
      }
      
      // Pick a random lesson
      const randomIndex = Math.floor(Math.random() * allLessons.length);
      const { lesson, week, day, category } = allLessons[randomIndex];
      
      res.json({
        question: lesson.quiz.question,
        lessonPath: `/lesson/${language}/${week}/${day}`,
        week,
        day,
        category,
        title: lesson.title
      });
    } catch (error) {
      console.error("Error fetching notification lesson:", error);
      res.status(500).json({ message: "Failed to fetch notification lesson" });
    }
  });

  // User progress route
  app.get('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user progress:", error);
      res.status(500).json({ message: "Failed to fetch user progress" });
    }
  });

  // Dashboard data route
  app.get('/api/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getUserSettings(userId);
      
      if (!settings) {
        return res.status(400).json({ message: "User settings not found. Please complete setup." });
      }
      
      const [stats, progress, latestProgress] = await Promise.all([
        storage.getUserStats(userId, settings.selectedLanguage),
        storage.getUserProgress(userId, settings.selectedLanguage),
        storage.getLatestProgress(userId, settings.selectedLanguage),
      ]);
      
      res.json({
        settings,
        stats: stats || {
          streak: 0,
          totalLessons: 0,
          wordsLearned: 0,
        },
        progress: progress.slice(0, 5), // Recent 5 lessons
        latestProgress,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
