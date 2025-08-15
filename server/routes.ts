import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupOAuthStrategies, setupOAuthRoutes } from './googleAuth';
import { 
  insertUserSettingsSchema, 
  insertUserProgressSchema, 
  insertWaitlistSchema,
  insertCourseSchema,
  insertLessonSchema,
  insertLessonStepSchema,
  insertLanguageSchema,
  insertSkillLevelSchema,
  insertCheckpointSchema,
  insertCheckpointProgressSchema
} from "@shared/schema";
import { z } from "zod";
import fs from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit authentication system
  const { setupAuth, isAuthenticated } = await import("./replitAuth");
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

  // Helper function to calculate streak from completion history
  async function calculateStreakFromHistory(userId: string, language: string): Promise<number> {
    try {
      // Get all completed lessons ordered by completion date (newest first)
      const progress = await storage.getUserProgress(userId, language);
      const completedLessons = progress
        .filter(p => p.completed)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
      
      if (completedLessons.length === 0) {
        return 0;
      }
      
      // Get unique completion dates (YYYY-MM-DD format)
      const completionDates = [...new Set(
        completedLessons.map(lesson => 
          new Date(lesson.completedAt!).toISOString().split('T')[0]
        )
      )].sort((a, b) => b.localeCompare(a)); // Sort newest to oldest
      
      if (completionDates.length === 0) {
        return 0;
      }
      
      // Start from the most recent date and count consecutive days
      let streak = 1;
      const today = new Date().toISOString().split('T')[0];
      
      // Check if the most recent completion was today or yesterday
      const mostRecentDate = completionDates[0];
      const daysSinceLastLesson = Math.floor(
        (new Date(today).getTime() - new Date(mostRecentDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // If last lesson was more than 1 day ago, streak is broken
      if (daysSinceLastLesson > 1) {
        return 0;
      }
      
      // If last lesson was yesterday, start streak from 1
      // If last lesson was today, start streak from 1
      
      // Count consecutive days backwards from the most recent date
      for (let i = 1; i < completionDates.length; i++) {
        const currentDate = new Date(completionDates[i-1]);
        const previousDate = new Date(completionDates[i]);
        const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          streak++;
        } else {
          // Gap found - stop counting
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating streak from history:', error);
      return 0;
    }
  }
  
  // Endpoint to recalculate and fix streak
  app.post('/api/recalculate-streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { language } = req.body;
      
      if (!language) {
        return res.status(400).json({ message: 'Language is required' });
      }
      
      // Calculate the correct streak from history
      const correctStreak = await calculateStreakFromHistory(userId, language);
      
      // Get current stats
      const stats = await storage.getUserStats(userId, language);
      if (!stats) {
        return res.status(404).json({ message: 'User stats not found' });
      }
      
      // Update stats with correct streak
      await storage.upsertUserStats({
        ...stats,
        streak: correctStreak
      });
      
      res.json({ 
        message: 'Streak recalculated successfully',
        oldStreak: stats.streak,
        newStreak: correctStreak
      });
    } catch (error) {
      console.error('Error recalculating streak:', error);
      res.status(500).json({ message: 'Failed to recalculate streak' });
    }
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

  // Helper function to calculate streak from completion history
  async function calculateStreakFromHistory(userId: string, language: string): Promise<number> {
    try {
      // Get all completed lessons ordered by completion date (newest first)
      const progress = await storage.getUserProgress(userId, language);
      const completedLessons = progress
        .filter(p => p.completed)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
      
      if (completedLessons.length === 0) {
        return 0;
      }
      
      // Get unique completion dates (YYYY-MM-DD format)
      const completionDates = [...new Set(
        completedLessons.map(lesson => 
          new Date(lesson.completedAt!).toISOString().split('T')[0]
        )
      )].sort((a, b) => b.localeCompare(a)); // Sort newest to oldest
      
      if (completionDates.length === 0) {
        return 0;
      }
      
      // Start from the most recent date and count consecutive days
      let streak = 1;
      const today = new Date().toISOString().split('T')[0];
      
      // Check if the most recent completion was today or yesterday
      const mostRecentDate = completionDates[0];
      const daysSinceLastLesson = Math.floor(
        (new Date(today).getTime() - new Date(mostRecentDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // If last lesson was more than 1 day ago, streak is broken
      if (daysSinceLastLesson > 1) {
        return 0;
      }
      
      // If last lesson was yesterday, start streak from 1
      // If last lesson was today, start streak from 1
      
      // Count consecutive days backwards from the most recent date
      for (let i = 1; i < completionDates.length; i++) {
        const currentDate = new Date(completionDates[i-1]);
        const previousDate = new Date(completionDates[i]);
        const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          streak++;
        } else {
          // Gap found - stop counting
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating streak from history:', error);
      return 0;
    }
  }
  
  // Endpoint to recalculate and fix streak
  app.post('/api/recalculate-streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { language } = req.body;
      
      if (!language) {
        return res.status(400).json({ message: 'Language is required' });
      }
      
      // Calculate the correct streak from history
      const correctStreak = await calculateStreakFromHistory(userId, language);
      
      // Get current stats
      const stats = await storage.getUserStats(userId, language);
      if (!stats) {
        return res.status(404).json({ message: 'User stats not found' });
      }
      
      // Update stats with correct streak
      await storage.upsertUserStats({
        ...stats,
        streak: correctStreak
      });
      
      res.json({ 
        message: 'Streak recalculated successfully',
        oldStreak: stats.streak,
        newStreak: correctStreak
      });
    } catch (error) {
      console.error('Error recalculating streak:', error);
      res.status(500).json({ message: 'Failed to recalculate streak' });
    }
  });
    } catch (error) {
      console.error("Error adding to waitlist:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data provided",
          errors: error.errors 
        });

  // Helper function to calculate streak from completion history
  async function calculateStreakFromHistory(userId: string, language: string): Promise<number> {
    try {
      // Get all completed lessons ordered by completion date (newest first)
      const progress = await storage.getUserProgress(userId, language);
      const completedLessons = progress
        .filter(p => p.completed)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
      
      if (completedLessons.length === 0) {
        return 0;
      }
      
      // Get unique completion dates (YYYY-MM-DD format)
      const completionDates = [...new Set(
        completedLessons.map(lesson => 
          new Date(lesson.completedAt!).toISOString().split('T')[0]
        )
      )].sort((a, b) => b.localeCompare(a)); // Sort newest to oldest
      
      if (completionDates.length === 0) {
        return 0;
      }
      
      // Start from the most recent date and count consecutive days
      let streak = 1;
      const today = new Date().toISOString().split('T')[0];
      
      // Check if the most recent completion was today or yesterday
      const mostRecentDate = completionDates[0];
      const daysSinceLastLesson = Math.floor(
        (new Date(today).getTime() - new Date(mostRecentDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // If last lesson was more than 1 day ago, streak is broken
      if (daysSinceLastLesson > 1) {
        return 0;
      }
      
      // If last lesson was yesterday, start streak from 1
      // If last lesson was today, start streak from 1
      
      // Count consecutive days backwards from the most recent date
      for (let i = 1; i < completionDates.length; i++) {
        const currentDate = new Date(completionDates[i-1]);
        const previousDate = new Date(completionDates[i]);
        const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          streak++;
        } else {
          // Gap found - stop counting
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating streak from history:', error);
      return 0;
    }
  }
  
  // Endpoint to recalculate and fix streak
  app.post('/api/recalculate-streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { language } = req.body;
      
      if (!language) {
        return res.status(400).json({ message: 'Language is required' });
      }
      
      // Calculate the correct streak from history
      const correctStreak = await calculateStreakFromHistory(userId, language);
      
      // Get current stats
      const stats = await storage.getUserStats(userId, language);
      if (!stats) {
        return res.status(404).json({ message: 'User stats not found' });
      }
      
      // Update stats with correct streak
      await storage.upsertUserStats({
        ...stats,
        streak: correctStreak
      });
      
      res.json({ 
        message: 'Streak recalculated successfully',
        oldStreak: stats.streak,
        newStreak: correctStreak
      });
    } catch (error) {
      console.error('Error recalculating streak:', error);
      res.status(500).json({ message: 'Failed to recalculate streak' });
    }
  });
      }
      res.status(500).json({ message: "Failed to add to waitlist" });
    }
  });

  // Helper function to calculate streak from completion history
  async function calculateStreakFromHistory(userId: string, language: string): Promise<number> {
    try {
      // Get all completed lessons ordered by completion date (newest first)
      const progress = await storage.getUserProgress(userId, language);
      const completedLessons = progress
        .filter(p => p.completed)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
      
      if (completedLessons.length === 0) {
        return 0;
      }
      
      // Get unique completion dates (YYYY-MM-DD format)
      const completionDates = [...new Set(
        completedLessons.map(lesson => 
          new Date(lesson.completedAt!).toISOString().split('T')[0]
        )
      )].sort((a, b) => b.localeCompare(a)); // Sort newest to oldest
      
      if (completionDates.length === 0) {
        return 0;
      }
      
      // Start from the most recent date and count consecutive days
      let streak = 1;
      const today = new Date().toISOString().split('T')[0];
      
      // Check if the most recent completion was today or yesterday
      const mostRecentDate = completionDates[0];
      const daysSinceLastLesson = Math.floor(
        (new Date(today).getTime() - new Date(mostRecentDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // If last lesson was more than 1 day ago, streak is broken
      if (daysSinceLastLesson > 1) {
        return 0;
      }
      
      // If last lesson was yesterday, start streak from 1
      // If last lesson was today, start streak from 1
      
      // Count consecutive days backwards from the most recent date
      for (let i = 1; i < completionDates.length; i++) {
        const currentDate = new Date(completionDates[i-1]);
        const previousDate = new Date(completionDates[i]);
        const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          streak++;
        } else {
          // Gap found - stop counting
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating streak from history:', error);
      return 0;
    }
  }
  
  // Endpoint to recalculate and fix streak
  app.post('/api/recalculate-streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { language } = req.body;
      
      if (!language) {
        return res.status(400).json({ message: 'Language is required' });
      }
      
      // Calculate the correct streak from history
      const correctStreak = await calculateStreakFromHistory(userId, language);
      
      // Get current stats
      const stats = await storage.getUserStats(userId, language);
      if (!stats) {
        return res.status(404).json({ message: 'User stats not found' });
      }
      
      // Update stats with correct streak
      await storage.upsertUserStats({
        ...stats,
        streak: correctStreak
      });
      
      res.json({ 
        message: 'Streak recalculated successfully',
        oldStreak: stats.streak,
        newStreak: correctStreak
      });
    } catch (error) {
      console.error('Error recalculating streak:', error);
      res.status(500).json({ message: 'Failed to recalculate streak' });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Helper function to calculate streak from completion history
  async function calculateStreakFromHistory(userId: string, language: string): Promise<number> {
    try {
      // Get all completed lessons ordered by completion date (newest first)
      const progress = await storage.getUserProgress(userId, language);
      const completedLessons = progress
        .filter(p => p.completed)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
      
      if (completedLessons.length === 0) {
        return 0;
      }
      
      // Get unique completion dates (YYYY-MM-DD format)
      const completionDates = [...new Set(
        completedLessons.map(lesson => 
          new Date(lesson.completedAt!).toISOString().split('T')[0]
        )
      )].sort((a, b) => b.localeCompare(a)); // Sort newest to oldest
      
      if (completionDates.length === 0) {
        return 0;
      }
      
      // Start from the most recent date and count consecutive days
      let streak = 1;
      const today = new Date().toISOString().split('T')[0];
      
      // Check if the most recent completion was today or yesterday
      const mostRecentDate = completionDates[0];
      const daysSinceLastLesson = Math.floor(
        (new Date(today).getTime() - new Date(mostRecentDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // If last lesson was more than 1 day ago, streak is broken
      if (daysSinceLastLesson > 1) {
        return 0;
      }
      
      // If last lesson was yesterday, start streak from 1
      // If last lesson was today, start streak from 1
      
      // Count consecutive days backwards from the most recent date
      for (let i = 1; i < completionDates.length; i++) {
        const currentDate = new Date(completionDates[i-1]);
        const previousDate = new Date(completionDates[i]);
        const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          streak++;
        } else {
          // Gap found - stop counting
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating streak from history:', error);
      return 0;
    }
  }
  
  // Endpoint to recalculate and fix streak
  app.post('/api/recalculate-streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { language } = req.body;
      
      if (!language) {
        return res.status(400).json({ message: 'Language is required' });
      }
      
      // Calculate the correct streak from history
      const correctStreak = await calculateStreakFromHistory(userId, language);
      
      // Get current stats
      const stats = await storage.getUserStats(userId, language);
      if (!stats) {
        return res.status(404).json({ message: 'User stats not found' });
      }
      
      // Update stats with correct streak
      await storage.upsertUserStats({
        ...stats,
        streak: correctStreak
      });
      
      res.json({ 
        message: 'Streak recalculated successfully',
        oldStreak: stats.streak,
        newStreak: correctStreak
      });
    } catch (error) {
      console.error('Error recalculating streak:', error);
      res.status(500).json({ message: 'Failed to recalculate streak' });
    }
  });

  // Dashboard route - combines user data, settings, progress, and stats
  app.get('/api/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get user settings, creating defaults if none exist
      let settings = await storage.getUserSettings(userId);
      if (!settings) {
        settings = await storage.upsertUserSettings({
          userId,
          language: user.selectedLanguage || "italian",
          notificationsEnabled: false,
          notificationFrequency: 15,
          notificationStartTime: "09:00",
          notificationEndTime: "18:00",
          theme: "light",
          soundEnabled: true,
          difficultyLevel: "beginner",
        });

  // Helper function to calculate streak from completion history
  async function calculateStreakFromHistory(userId: string, language: string): Promise<number> {
    try {
      // Get all completed lessons ordered by completion date (newest first)
      const progress = await storage.getUserProgress(userId, language);
      const completedLessons = progress
        .filter(p => p.completed)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
      
      if (completedLessons.length === 0) {
        return 0;
      }
      
      // Get unique completion dates (YYYY-MM-DD format)
      const completionDates = [...new Set(
        completedLessons.map(lesson => 
          new Date(lesson.completedAt!).toISOString().split('T')[0]
        )
      )].sort((a, b) => b.localeCompare(a)); // Sort newest to oldest
      
      if (completionDates.length === 0) {
        return 0;
      }
      
      // Start from the most recent date and count consecutive days
      let streak = 1;
      const today = new Date().toISOString().split('T')[0];
      
      // Check if the most recent completion was today or yesterday
      const mostRecentDate = completionDates[0];
      const daysSinceLastLesson = Math.floor(
        (new Date(today).getTime() - new Date(mostRecentDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // If last lesson was more than 1 day ago, streak is broken
      if (daysSinceLastLesson > 1) {
        return 0;
      }
      
      // If last lesson was yesterday, start streak from 1
      // If last lesson was today, start streak from 1
      
      // Count consecutive days backwards from the most recent date
      for (let i = 1; i < completionDates.length; i++) {
        const currentDate = new Date(completionDates[i-1]);
        const previousDate = new Date(completionDates[i]);
        const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          streak++;
        } else {
          // Gap found - stop counting
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating streak from history:', error);
      return 0;
    }
  }
  
  // Endpoint to recalculate and fix streak
  app.post('/api/recalculate-streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { language } = req.body;
      
      if (!language) {
        return res.status(400).json({ message: 'Language is required' });
      }
      
      // Calculate the correct streak from history
      const correctStreak = await calculateStreakFromHistory(userId, language);
      
      // Get current stats
      const stats = await storage.getUserStats(userId, language);
      if (!stats) {
        return res.status(404).json({ message: 'User stats not found' });
      }
      
      // Update stats with correct streak
      await storage.upsertUserStats({
        ...stats,
        streak: correctStreak
      });
      
      res.json({ 
        message: 'Streak recalculated successfully',
        oldStreak: stats.streak,
        newStreak: correctStreak
      });
    } catch (error) {
      console.error('Error recalculating streak:', error);
      res.status(500).json({ message: 'Failed to recalculate streak' });
    }
  });
      }

      // Get user stats for selected language
      const language = user.selectedLanguage || "italian";
      let stats = await storage.getUserStats(userId, language);
      if (!stats) {
        stats = await storage.upsertUserStats({
          userId,
          language,
          streak: 0,
          lessonsCompleted: 0,
          wordsLearned: 0,
        });

  // Helper function to calculate streak from completion history
  async function calculateStreakFromHistory(userId: string, language: string): Promise<number> {
    try {
      // Get all completed lessons ordered by completion date (newest first)
      const progress = await storage.getUserProgress(userId, language);
      const completedLessons = progress
        .filter(p => p.completed)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
      
      if (completedLessons.length === 0) {
        return 0;
      }
      
      // Get unique completion dates (YYYY-MM-DD format)
      const completionDates = [...new Set(
        completedLessons.map(lesson => 
          new Date(lesson.completedAt!).toISOString().split('T')[0]
        )
      )].sort((a, b) => b.localeCompare(a)); // Sort newest to oldest
      
      if (completionDates.length === 0) {
        return 0;
      }
      
      // Start from the most recent date and count consecutive days
      let streak = 1;
      const today = new Date().toISOString().split('T')[0];
      
      // Check if the most recent completion was today or yesterday
      const mostRecentDate = completionDates[0];
      const daysSinceLastLesson = Math.floor(
        (new Date(today).getTime() - new Date(mostRecentDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // If last lesson was more than 1 day ago, streak is broken
      if (daysSinceLastLesson > 1) {
        return 0;
      }
      
      // If last lesson was yesterday, start streak from 1
      // If last lesson was today, start streak from 1
      
      // Count consecutive days backwards from the most recent date
      for (let i = 1; i < completionDates.length; i++) {
        const currentDate = new Date(completionDates[i-1]);
        const previousDate = new Date(completionDates[i]);
        const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          streak++;
        } else {
          // Gap found - stop counting
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating streak from history:', error);
      return 0;
    }
  }
  
  // Endpoint to recalculate and fix streak
  app.post('/api/recalculate-streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { language } = req.body;
      
      if (!language) {
        return res.status(400).json({ message: 'Language is required' });
      }
      
      // Calculate the correct streak from history
      const correctStreak = await calculateStreakFromHistory(userId, language);
      
      // Get current stats
      const stats = await storage.getUserStats(userId, language);
      if (!stats) {
        return res.status(404).json({ message: 'User stats not found' });
      }
      
      // Update stats with correct streak
      await storage.upsertUserStats({
        ...stats,
        streak: correctStreak
      });
      
      res.json({ 
        message: 'Streak recalculated successfully',
        oldStreak: stats.streak,
        newStreak: correctStreak
      });
    } catch (error) {
      console.error('Error recalculating streak:', error);
      res.status(500).json({ message: 'Failed to recalculate streak' });
    }
  });
      }

      // Get recent progress
      const progress = await storage.getUserProgress(userId, language);
      
      // Enrich progress data with actual lesson content
      const enrichedProgress = await Promise.all(
        progress.map(async (progressItem) => {
          if (language === 'italian') {
            try {
              const courseFileName = `${progressItem.courseId}.json`;
              const coursePath = path.join(process.cwd(), 'server', courseFileName);
              
              if (fs.existsSync(coursePath)) {
                const courseData = JSON.parse(fs.readFileSync(coursePath, 'utf-8'));
                const course = courseData[progressItem.courseId];
                
                if (course && course.lessons[progressItem.lessonId]) {
                  const lesson = course.lessons[progressItem.lessonId];
                  return {
                    ...progressItem,
                    lessonTitle: lesson.title,
                    italianPhrase: lesson.step1.italian,
                    englishTranslation: lesson.step1.english,
                    courseTitle: course.title
                  };
                }
              }
            } catch (error) {
              console.error(`Error loading lesson content for ${progressItem.courseId}/${progressItem.lessonId}:`, error);
            }
          }
          return progressItem;
        })
      );

      res.json({
        user,
        settings: {
          notificationsEnabled: settings.notificationsEnabled,
          notificationFrequency: settings.notificationFrequency || 15,
          notificationStartTime: settings.notificationStartTime || "09:00",
          notificationEndTime: settings.notificationEndTime || "18:00",
          selectedLanguage: settings.language,
        },
        stats: {
          ...stats,
          lessonsCompleted: stats.lessonsCompleted || 0,
        },
        progress: enrichedProgress
      });

  // Helper function to calculate streak from completion history
  async function calculateStreakFromHistory(userId: string, language: string): Promise<number> {
    try {
      // Get all completed lessons ordered by completion date (newest first)
      const progress = await storage.getUserProgress(userId, language);
      const completedLessons = progress
        .filter(p => p.completed)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
      
      if (completedLessons.length === 0) {
        return 0;
      }
      
      // Get unique completion dates (YYYY-MM-DD format)
      const completionDates = [...new Set(
        completedLessons.map(lesson => 
          new Date(lesson.completedAt!).toISOString().split('T')[0]
        )
      )].sort((a, b) => b.localeCompare(a)); // Sort newest to oldest
      
      if (completionDates.length === 0) {
        return 0;
      }
      
      // Start from the most recent date and count consecutive days
      let streak = 1;
      const today = new Date().toISOString().split('T')[0];
      
      // Check if the most recent completion was today or yesterday
      const mostRecentDate = completionDates[0];
      const daysSinceLastLesson = Math.floor(
        (new Date(today).getTime() - new Date(mostRecentDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // If last lesson was more than 1 day ago, streak is broken
      if (daysSinceLastLesson > 1) {
        return 0;
      }
      
      // If last lesson was yesterday, start streak from 1
      // If last lesson was today, start streak from 1
      
      // Count consecutive days backwards from the most recent date
      for (let i = 1; i < completionDates.length; i++) {
        const currentDate = new Date(completionDates[i-1]);
        const previousDate = new Date(completionDates[i]);
        const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          streak++;
        } else {
          // Gap found - stop counting
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating streak from history:', error);
      return 0;
    }
  }
  
  // Endpoint to recalculate and fix streak
  app.post('/api/recalculate-streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { language } = req.body;
      
      if (!language) {
        return res.status(400).json({ message: 'Language is required' });
      }
      
      // Calculate the correct streak from history
      const correctStreak = await calculateStreakFromHistory(userId, language);
      
      // Get current stats
      const stats = await storage.getUserStats(userId, language);
      if (!stats) {
        return res.status(404).json({ message: 'User stats not found' });
      }
      
      // Update stats with correct streak
      await storage.upsertUserStats({
        ...stats,
        streak: correctStreak
      });
      
      res.json({ 
        message: 'Streak recalculated successfully',
        oldStreak: stats.streak,
        newStreak: correctStreak
      });
    } catch (error) {
      console.error('Error recalculating streak:', error);
      res.status(500).json({ message: 'Failed to recalculate streak' });
    }
  });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Helper function to calculate streak from completion history
  async function calculateStreakFromHistory(userId: string, language: string): Promise<number> {
    try {
      // Get all completed lessons ordered by completion date (newest first)
      const progress = await storage.getUserProgress(userId, language);
      const completedLessons = progress
        .filter(p => p.completed)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
      
      if (completedLessons.length === 0) {
        return 0;
      }
      
      // Get unique completion dates (YYYY-MM-DD format)
      const completionDates = [...new Set(
        completedLessons.map(lesson => 
          new Date(lesson.completedAt!).toISOString().split('T')[0]
        )
      )].sort((a, b) => b.localeCompare(a)); // Sort newest to oldest
      
      if (completionDates.length === 0) {
        return 0;
      }
      
      // Start from the most recent date and count consecutive days
      let streak = 1;
      const today = new Date().toISOString().split('T')[0];
      
      // Check if the most recent completion was today or yesterday
      const mostRecentDate = completionDates[0];
      const daysSinceLastLesson = Math.floor(
        (new Date(today).getTime() - new Date(mostRecentDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // If last lesson was more than 1 day ago, streak is broken
      if (daysSinceLastLesson > 1) {
        return 0;
      }
      
      // If last lesson was yesterday, start streak from 1
      // If last lesson was today, start streak from 1
      
      // Count consecutive days backwards from the most recent date
      for (let i = 1; i < completionDates.length; i++) {
        const currentDate = new Date(completionDates[i-1]);
        const previousDate = new Date(completionDates[i]);
        const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          streak++;
        } else {
          // Gap found - stop counting
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating streak from history:', error);
      return 0;
    }
  }
  
  // Endpoint to recalculate and fix streak
  app.post('/api/recalculate-streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { language } = req.body;
      
      if (!language) {
        return res.status(400).json({ message: 'Language is required' });
      }
      
      // Calculate the correct streak from history
      const correctStreak = await calculateStreakFromHistory(userId, language);
      
      // Get current stats
      const stats = await storage.getUserStats(userId, language);
      if (!stats) {
        return res.status(404).json({ message: 'User stats not found' });
      }
      
      // Update stats with correct streak
      await storage.upsertUserStats({
        ...stats,
        streak: correctStreak
      });
      
      res.json({ 
        message: 'Streak recalculated successfully',
        oldStreak: stats.streak,
        newStreak: correctStreak
      });
    } catch (error) {
      console.error('Error recalculating streak:', error);
      res.status(500).json({ message: 'Failed to recalculate streak' });
    }
  });

  // Next lesson route
  app.get('/api/next-lesson', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      const language = user?.selectedLanguage || "italian";
      
      const nextLesson = await storage.getNextLesson(userId, language);
      
      if (!nextLesson) {
        return res.json({ message: "All lessons completed!", completed: true });
      }

      // Handle checkpoint reviews
      if (nextLesson.courseId === 'checkpoint') {
        const checkpointNumber = parseInt(nextLesson.lessonId.replace('checkpoint', ''));
        
        // Try to find existing checkpoint in database
        const allCheckpoints = await storage.getAllCheckpoints();
        const existingCheckpoint = allCheckpoints.find(cp => cp.checkpointNumber === checkpointNumber);
        
        if (existingCheckpoint) {
          return res.json({
            courseId: 'checkpoint',
            lessonId: nextLesson.lessonId,
            title: existingCheckpoint.title,
            description: existingCheckpoint.description,
            courseTitle: 'Checkpoint Review',
            isCheckpoint: true,
            checkpointNumber: checkpointNumber,
            questions: existingCheckpoint.questions
          });

  // Helper function to calculate streak from completion history
  async function calculateStreakFromHistory(userId: string, language: string): Promise<number> {
    try {
      // Get all completed lessons ordered by completion date (newest first)
      const progress = await storage.getUserProgress(userId, language);
      const completedLessons = progress
        .filter(p => p.completed)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
      
      if (completedLessons.length === 0) {
        return 0;
      }
      
      // Get unique completion dates (YYYY-MM-DD format)
      const completionDates = [...new Set(
        completedLessons.map(lesson => 
          new Date(lesson.completedAt!).toISOString().split('T')[0]
        )
      )].sort((a, b) => b.localeCompare(a)); // Sort newest to oldest
      
      if (completionDates.length === 0) {
        return 0;
      }
      
      // Start from the most recent date and count consecutive days
      let streak = 1;
      const today = new Date().toISOString().split('T')[0];
      
      // Check if the most recent completion was today or yesterday
      const mostRecentDate = completionDates[0];
      const daysSinceLastLesson = Math.floor(
        (new Date(today).getTime() - new Date(mostRecentDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // If last lesson was more than 1 day ago, streak is broken
      if (daysSinceLastLesson > 1) {
        return 0;
      }
      
      // If last lesson was yesterday, start streak from 1
      // If last lesson was today, start streak from 1
      
      // Count consecutive days backwards from the most recent date
      for (let i = 1; i < completionDates.length; i++) {
        const currentDate = new Date(completionDates[i-1]);
        const previousDate = new Date(completionDates[i]);
        const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          streak++;
        } else {
          // Gap found - stop counting
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating streak from history:', error);
      return 0;
    }
  }
  
  // Endpoint to recalculate and fix streak
  app.post('/api/recalculate-streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { language } = req.body;
      
      if (!language) {
        return res.status(400).json({ message: 'Language is required' });
      }
      
      // Calculate the correct streak from history
      const correctStreak = await calculateStreakFromHistory(userId, language);
      
      // Get current stats
      const stats = await storage.getUserStats(userId, language);
      if (!stats) {
        return res.status(404).json({ message: 'User stats not found' });
      }
      
      // Update stats with correct streak
      await storage.upsertUserStats({
        ...stats,
        streak: correctStreak
      });
      
      res.json({ 
        message: 'Streak recalculated successfully',
        oldStreak: stats.streak,
        newStreak: correctStreak
      });
    } catch (error) {
      console.error('Error recalculating streak:', error);
      res.status(500).json({ message: 'Failed to recalculate streak' });
    }
  });
        } else {
          // Create a generic checkpoint if none exists
          return res.json({
            courseId: 'checkpoint',
            lessonId: nextLesson.lessonId,
            title: `Checkpoint ${checkpointNumber}: Review`,
            description: `Review your progress from the last 4 lessons`,
            courseTitle: 'Checkpoint Review',
            isCheckpoint: true,
            checkpointNumber: checkpointNumber,
            questions: [
              {
                id: 1,
                question: "Review question will be generated based on your recent lessons",
                options: ["Option A", "Option B", "Option C", "Option D"],
                correctAnswer: "Option A",
                explanation: "Checkpoint review in progress"
              }
            ]
          });

  // Helper function to calculate streak from completion history
  async function calculateStreakFromHistory(userId: string, language: string): Promise<number> {
    try {
      // Get all completed lessons ordered by completion date (newest first)
      const progress = await storage.getUserProgress(userId, language);
      const completedLessons = progress
        .filter(p => p.completed)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
      
      if (completedLessons.length === 0) {
        return 0;
      }
      
      // Get unique completion dates (YYYY-MM-DD format)
      const completionDates = [...new Set(
        completedLessons.map(lesson => 
          new Date(lesson.completedAt!).toISOString().split('T')[0]
        )
      )].sort((a, b) => b.localeCompare(a)); // Sort newest to oldest
      
      if (completionDates.length === 0) {
        return 0;
      }
      
      // Start from the most recent date and count consecutive days
      let streak = 1;
      const today = new Date().toISOString().split('T')[0];
      
      // Check if the most recent completion was today or yesterday
      const mostRecentDate = completionDates[0];
      const daysSinceLastLesson = Math.floor(
        (new Date(today).getTime() - new Date(mostRecentDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // If last lesson was more than 1 day ago, streak is broken
      if (daysSinceLastLesson > 1) {
        return 0;
      }
      
      // If last lesson was yesterday, start streak from 1
      // If last lesson was today, start streak from 1
      
      // Count consecutive days backwards from the most recent date
      for (let i = 1; i < completionDates.length; i++) {
        const currentDate = new Date(completionDates[i-1]);
        const previousDate = new Date(completionDates[i]);
        const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          streak++;
        } else {
          // Gap found - stop counting
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating streak from history:', error);
      return 0;
    }
  }
  
  // Endpoint to recalculate and fix streak
  app.post('/api/recalculate-streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { language } = req.body;
      
      if (!language) {
        return res.status(400).json({ message: 'Language is required' });
      }
      
      // Calculate the correct streak from history
      const correctStreak = await calculateStreakFromHistory(userId, language);
      
      // Get current stats
      const stats = await storage.getUserStats(userId, language);
      if (!stats) {
        return res.status(404).json({ message: 'User stats not found' });
      }
      
      // Update stats with correct streak
      await storage.upsertUserStats({
        ...stats,
        streak: correctStreak
      });
      
      res.json({ 
        message: 'Streak recalculated successfully',
        oldStreak: stats.streak,
        newStreak: correctStreak
      });
    } catch (error) {
      console.error('Error recalculating streak:', error);
      res.status(500).json({ message: 'Failed to recalculate streak' });
    }
  });
        }
      }

      // Get the actual lesson data
      if (language === 'italian') {
        const coursePath = path.join(process.cwd(), 'server', `${nextLesson.courseId}.json`);
        if (fs.existsSync(coursePath)) {
          const courseData = JSON.parse(fs.readFileSync(coursePath, 'utf-8'));
          const course = courseData[nextLesson.courseId];
          
          if (course && course.lessons[nextLesson.lessonId]) {
            return res.json({
              courseId: nextLesson.courseId,
              lessonId: nextLesson.lessonId,
              title: course.lessons[nextLesson.lessonId].title,
              description: course.lessons[nextLesson.lessonId].description || course.description,
              courseTitle: course.title,
            });

  // Helper function to calculate streak from completion history
  async function calculateStreakFromHistory(userId: string, language: string): Promise<number> {
    try {
      // Get all completed lessons ordered by completion date (newest first)
      const progress = await storage.getUserProgress(userId, language);
      const completedLessons = progress
        .filter(p => p.completed)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
      
      if (completedLessons.length === 0) {
        return 0;
      }
      
      // Get unique completion dates (YYYY-MM-DD format)
      const completionDates = [...new Set(
        completedLessons.map(lesson => 
          new Date(lesson.completedAt!).toISOString().split('T')[0]
        )
      )].sort((a, b) => b.localeCompare(a)); // Sort newest to oldest
      
      if (completionDates.length === 0) {
        return 0;
      }
      
      // Start from the most recent date and count consecutive days
      let streak = 1;
      const today = new Date().toISOString().split('T')[0];
      
      // Check if the most recent completion was today or yesterday
      const mostRecentDate = completionDates[0];
      const daysSinceLastLesson = Math.floor(
        (new Date(today).getTime() - new Date(mostRecentDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // If last lesson was more than 1 day ago, streak is broken
      if (daysSinceLastLesson > 1) {
        return 0;
      }
      
      // If last lesson was yesterday, start streak from 1
      // If last lesson was today, start streak from 1
      
      // Count consecutive days backwards from the most recent date
      for (let i = 1; i < completionDates.length; i++) {
        const currentDate = new Date(completionDates[i-1]);
        const previousDate = new Date(completionDates[i]);
        const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          streak++;
        } else {
          // Gap found - stop counting
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating streak from history:', error);
      return 0;
    }
  }
  
  // Endpoint to recalculate and fix streak
  app.post('/api/recalculate-streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { language } = req.body;
      
      if (!language) {
        return res.status(400).json({ message: 'Language is required' });
      }
      
      // Calculate the correct streak from history
      const correctStreak = await calculateStreakFromHistory(userId, language);
      
      // Get current stats
      const stats = await storage.getUserStats(userId, language);
      if (!stats) {
        return res.status(404).json({ message: 'User stats not found' });
      }
      
      // Update stats with correct streak
      await storage.upsertUserStats({
        ...stats,
        streak: correctStreak
      });
      
      res.json({ 
        message: 'Streak recalculated successfully',
        oldStreak: stats.streak,
        newStreak: correctStreak
      });
    } catch (error) {
      console.error('Error recalculating streak:', error);
      res.status(500).json({ message: 'Failed to recalculate streak' });
    }
  });
          }
        }
      }
      
      res.json({
        courseId: nextLesson.courseId,
        lessonId: nextLesson.lessonId,
        title: `${nextLesson.courseId} - ${nextLesson.lessonId}`,
        description: "Continue your language learning journey"
      });

  // Helper function to calculate streak from completion history
  async function calculateStreakFromHistory(userId: string, language: string): Promise<number> {
    try {
      // Get all completed lessons ordered by completion date (newest first)
      const progress = await storage.getUserProgress(userId, language);
      const completedLessons = progress
        .filter(p => p.completed)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
      
      if (completedLessons.length === 0) {
        return 0;
      }
      
      // Get unique completion dates (YYYY-MM-DD format)
      const completionDates = [...new Set(
        completedLessons.map(lesson => 
          new Date(lesson.completedAt!).toISOString().split('T')[0]
        )
      )].sort((a, b) => b.localeCompare(a)); // Sort newest to oldest
      
      if (completionDates.length === 0) {
        return 0;
      }
      
      // Start from the most recent date and count consecutive days
      let streak = 1;
      const today = new Date().toISOString().split('T')[0];
      
      // Check if the most recent completion was today or yesterday
      const mostRecentDate = completionDates[0];
      const daysSinceLastLesson = Math.floor(
        (new Date(today).getTime() - new Date(mostRecentDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      
      // If last lesson was more than 1 day ago, streak is broken
      if (daysSinceLastLesson > 1) {
        return 0;
      }
      
      // If last lesson was yesterday, start streak from 1
      // If last lesson was today, start streak from 1
      
      // Count consecutive days backwards from the most recent date
      for (let i = 1; i < completionDates.length; i++) {
        const currentDate = new Date(completionDates[i-1]);
        const previousDate = new Date(completionDates[i]);
        const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 1) {
          // Consecutive day
          streak++;
        } else {
          // Gap found - stop counting
          break;
        }
      }
      
      return streak;
    } catch (error) {
      console.error('Error calculating streak from history:', error);
      return 0;
    }
  }
  
  // Endpoint to recalculate and fix streak
  app.post('/api/recalculate-streak', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const { language } = req.body;
      
      if (!language) {
        return res.status(400).json({ message: 'Language is required' });
      }
      
      // Calculate the correct streak from history
      const correctStreak = await calculateStreakFromHistory(userId, language);
      
      // Get current stats
      const stats = await storage.getUserStats(userId, language);
      if (!stats) {
        return res.status(404).json({ message: 'User stats not found' });
      }
      
      // Update stats with correct streak
      await storage.upsertUserStats({
        ...stats,
        streak: correctStreak
      });
      
      res.json({ 
        message: 'Streak recalculated successfully',
        oldStreak: stats.streak,
        newStreak: correctStreak
      });
    } catch (error) {
      console.error('Error recalculating streak:', error);
      res.status(500).json({ message: 'Failed to recalculate streak' });
    }
  });
    } catch (error) {
      console.error("Error fetching next lesson:", error);
      res.status(500).json({ message: "Failed to fetch next lesson" });
    }
  });

  // Helper function to calculate streak from completion history
  async function calculateStreakFromHistory(userId: string, language: string): Promise<number> {
    try {
      // Get all completed lessons ordered by completion date (newest first)
      const progress = await storage.getUserProgress(userId, language);
      const completedLessons = progress
        .filter(p => p.completed)
        .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
      
      if (completedLessons.length === 0) {
        return 0;
      }
      
      // Get unique completion dates (YYYY-MM-DD format)
      const completionDates = [...new Set(
        completedLessons.map(lesson => 
          new Date(lesson.completedAt!).toISOString().split('T')[0]
        )
      )].sort((a, b) => b.localeCompare(a)); // Sort newest to oldest
      
      if (completionDates.length === 0) {
        return 0;
      }
      
      // Start from the most recent date and count consecutive days
