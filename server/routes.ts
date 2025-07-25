import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertUserSettingsSchema, insertUserProgressSchema } from "@shared/schema";
import { z } from "zod";
import fs from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

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

  app.post('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progressData = insertUserProgressSchema.parse({
        ...req.body,
        userId,
      });
      
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

  // Lessons routes
  app.get('/api/lessons/:language', async (req, res) => {
    try {
      const { language } = req.params;
      const lessonsPath = path.join(import.meta.dirname, 'lessons.json');
      
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

  // Get specific lesson by week and day
  app.get('/api/lessons/:language/:week/:day', async (req, res) => {
    try {
      const { language, week, day } = req.params;
      const lessonsPath = path.join(import.meta.dirname, 'lessons.json');
      
      if (!fs.existsSync(lessonsPath)) {
        return res.status(404).json({ message: "Lessons file not found" });
      }
      
      const lessonsData = JSON.parse(fs.readFileSync(lessonsPath, 'utf-8'));
      const languageLessons = lessonsData[language];
      
      if (!languageLessons) {
        return res.status(404).json({ message: `Lessons not found for language: ${language}` });
      }

      const weekKey = `week_${week}`;
      const dayKey = `day_${day}`;
      
      const weekLessons = languageLessons[weekKey];
      if (!weekLessons) {
        return res.status(404).json({ message: `Week ${week} not found for ${language}` });
      }

      const dayLesson = weekLessons[dayKey];
      if (!dayLesson) {
        return res.status(404).json({ message: `Day ${day} of week ${week} not found for ${language}` });
      }
      
      res.json(dayLesson);
    } catch (error) {
      console.error("Error fetching specific lesson:", error);
      res.status(500).json({ message: "Failed to fetch lesson" });
    }
  });

  // Notification lesson route - gets a random lesson question for notifications
  app.get('/api/notification-lesson/:language', async (req, res) => {
    try {
      const { language } = req.params;
      const lessonsPath = path.join(import.meta.dirname, 'lessons.json');
      
      if (!fs.existsSync(lessonsPath)) {
        return res.status(404).json({ message: "Lessons file not found" });
      }
      
      const lessonsData = JSON.parse(fs.readFileSync(lessonsPath, 'utf-8'));
      const languageLessons = lessonsData[language];
      
      if (!languageLessons) {
        return res.status(404).json({ message: `Lessons not found for language: ${language}` });
      }
      
      // Get all available lessons
      const allLessons: Array<{
        lesson: any;
        week: number;
        day: number;
      }> = [];
      
      Object.keys(languageLessons).forEach(weekKey => {
        const week = parseInt(weekKey.replace('week_', ''));
        Object.keys(languageLessons[weekKey]).forEach(dayKey => {
          const day = parseInt(dayKey.replace('day_', ''));
          const lesson = languageLessons[weekKey][dayKey];
          allLessons.push({ lesson, week, day });
        });
      });
      
      if (allLessons.length === 0) {
        return res.status(404).json({ message: `No lessons found for ${language}` });
      }
      
      // Pick a random lesson
      const randomIndex = Math.floor(Math.random() * allLessons.length);
      const { lesson, week, day } = allLessons[randomIndex];
      
      res.json({
        question: lesson.quiz.question,
        lessonPath: `/lesson/${language}/${week}/${day}`,
        week,
        day,
        title: lesson.title
      });
    } catch (error) {
      console.error("Error fetching notification lesson:", error);
      res.status(500).json({ message: "Failed to fetch notification lesson" });
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
