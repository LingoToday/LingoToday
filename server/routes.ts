import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupOAuthStrategies, setupOAuthRoutes } from './googleAuth';
import { ObjectStorageService } from './objectStorage';
import Stripe from "stripe";
import { 
  insertUserSettingsSchema, 
  insertUserProgressSchema, 
  insertWaitlistSchema,
  insertPageViewSchema,
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
import multer from "multer";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit for videos
});

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Comprehensive helper to remove all video/media URLs from an object
  const stripVideoUrls = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const videoUrlFields = ['video_url', 'videoUrl', 'videoSrc', 'src', 'url', 'sources', 'thumbnails', 'poster'];
    const sanitized = { ...obj };
    
    // Remove all video URL fields while preserving types
    videoUrlFields.forEach(field => {
      if (sanitized[field] !== undefined) {
        const value = sanitized[field];
        // Preserve types: arrays become empty arrays, objects become empty objects, strings become empty strings
        if (Array.isArray(value)) {
          sanitized[field] = [];
        } else if (value && typeof value === 'object') {
          sanitized[field] = {};
        } else {
          sanitized[field] = '';
        }
      }
    });
    
    // Add restriction flag
    sanitized.isRestricted = true;
    
    // Recursively sanitize nested objects and arrays
    Object.keys(sanitized).forEach(key => {
      if (Array.isArray(sanitized[key])) {
        sanitized[key] = sanitized[key].map((item: any) => stripVideoUrls(item));
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = stripVideoUrls(sanitized[key]);
      }
    });
    
    return sanitized;
  };

  // Helper to normalize tier values to array format
  const normalizeTiers = (value: any): string[] => {
    if (!value) return [];
    if (typeof value === 'string') return [value];
    if (Array.isArray(value)) return value;
    return [];
  };

  // Check if content requires pro tier access
  const requiresProAccess = (obj: any): boolean => {
    if (!obj) return false;
    
    // Check direct requiredTier (step-level)
    const directTiers = normalizeTiers(obj.requiredTier);
    if (directTiers.some(tier => tier === 'pro' || tier === 'pro-monthly' || tier === 'pro-yearly')) {
      return true;
    }
    
    // Check nested content.requiredTier (content-level)  
    if (obj.content) {
      const contentTiers = normalizeTiers(obj.content.requiredTier);
      if (contentTiers.some(tier => tier === 'pro' || tier === 'pro-monthly' || tier === 'pro-yearly')) {
        return true;
      }
    }
    
    // Check if any options require pro access (for video_choice steps)
    if (obj.options && Array.isArray(obj.options)) {
      return obj.options.some((option: any) => requiresProAccess(option));
    }
    
    return false;
  };

  // Comprehensive sanitization function for any lesson data
  const sanitizeResponse = (userTier: string, payload: any): any => {
    if (!payload) return payload;
    
    const isProUser = userTier === 'pro' || userTier === 'pro-monthly' || userTier === 'pro-yearly';
    
    // Helper to sanitize a single step
    const sanitizeStep = (step: any): any => {
      if (!step) return step;
      
      // Check if this step or its content requires pro access
      const stepRequiresPro = step.stepType === 'pro_video' || 
                              requiresProAccess(step.content) ||
                              requiresProAccess(step);
      
      if (stepRequiresPro && !isProUser) {
        const sanitizedContent = stripVideoUrls(step.content || {});
        // Preserve important fields that should be visible even for non-pro users
        if (step.content?.answerPrompt) {
          sanitizedContent.answerPrompt = step.content.answerPrompt;
        }
        if (step.content?.prompt) {
          sanitizedContent.prompt = step.content.prompt;
        }
        return {
          ...step,
          content: sanitizedContent,
          // Preserve tier requirements for frontend to show upgrade prompt
          requiredTier: step.content?.requiredTier || step.requiredTier || ['pro']
        };
      }
      
      // For video_choice steps, sanitize individual options that require pro
      if (step.stepType === 'video_choice' && step.content?.options) {
        const sanitizedOptions = step.content.options.map((option: any) => {
          if (requiresProAccess(option) && !isProUser) {
            return stripVideoUrls(option);
          }
          return option;
        });
        
        return {
          ...step,
          content: {
            ...step.content,
            options: sanitizedOptions
          }
        };
      }
      
      return step;
    };
    
    // Handle different payload structures
    if (Array.isArray(payload)) {
      // Array of steps
      return payload.map(sanitizeStep);
    }
    
    if (payload.lesson) {
      // Lesson with nested data
      const sanitizedLesson = { ...payload };
      
      // Handle lesson.steps array
      if (sanitizedLesson.lesson.steps && Array.isArray(sanitizedLesson.lesson.steps)) {
        sanitizedLesson.lesson.steps = sanitizedLesson.lesson.steps.map(sanitizeStep);
      }
      
      // Handle lesson step properties (step1, step2, etc.)
      Object.keys(sanitizedLesson.lesson).forEach(key => {
        if (key.startsWith('step') && sanitizedLesson.lesson[key]) {
          // Preserve all step metadata including requiredTier for proper security checking
          const originalStep = sanitizedLesson.lesson[key];
          const sanitizedStep = sanitizeStep({
            content: originalStep,
            stepType: originalStep.stepType,
            requiredTier: originalStep.requiredTier
          });
          // Preserve all step fields, not just content
          sanitizedLesson.lesson[key] = {
            ...originalStep,
            ...sanitizedStep.content
          };
        }
      });
      
      return sanitizedLesson;
    }
    
    if (payload.steps) {
      // Direct steps property
      return {
        ...payload,
        steps: payload.steps.map(sanitizeStep)
      };
    }
    
    // Handle as single step
    return sanitizeStep(payload);
  };

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
      }
      
      const entry = await storage.addToWaitlist(waitlistData);
      res.json({ 
        message: "Successfully added to waitlist",
        entry: {
          id: entry.id,
          email: entry.email,
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
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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
      }

      // Get user stats for selected language
      const language = user.selectedLanguage || "italian";
      let stats = await storage.getUserStats(userId, language);
      
      // Get recent progress
      const progress = await storage.getUserProgress(userId, language);
      
      // Calculate real-time stats from progress data
      const completedLessons = progress.filter(p => p.completed && p.completedAt);
      const actualLessonsCompleted = completedLessons.length;
      
      // Calculate actual words learned from all completed lessons
      let actualWordsLearned = 0;
      const uniqueWords = new Set<string>();
      
      for (const progressItem of completedLessons) {
        try {
          // Extract course number from courseId (e.g., "course1" -> 1)
          const courseNumber = parseInt(progressItem.courseId.replace('course', ''));
          // Extract lesson number from lessonId (e.g., "lesson1" -> 1)  
          const lessonNumber = parseInt(progressItem.lessonId.replace('lesson', ''));
          
          // Skip if not a regular lesson
          if (isNaN(courseNumber) || isNaN(lessonNumber)) {
            continue;
          }
          
          // Get language code for database query
          let languageCode = language;
          if (language === 'italian') languageCode = 'it';
          else if (language === 'spanish') languageCode = 'es';
          else if (language === 'german') languageCode = 'de';
          else if (language === 'french') languageCode = 'fr';
          
          // Get lesson data from database
          const lessonWithSteps = await storage.getLessonByCourseAndNumber(languageCode, courseNumber, lessonNumber);
          
          if (lessonWithSteps && lessonWithSteps.steps) {
            // Find word review step (should be the first step)
            const wordReviewStep = lessonWithSteps.steps.find(step => step.stepType === 'word_review');
            
            if (wordReviewStep && wordReviewStep.content) {
              const content = wordReviewStep.content as any;
              let targetPhrase: string | undefined;
              
              // Get the appropriate language phrase from database content
              if (language === 'italian') {
                targetPhrase = content.italian;
              } else if (language === 'spanish') {
                targetPhrase = content.spanish;
              } else if (language === 'german') {
                targetPhrase = content.german;
              } else if (language === 'french') {
                targetPhrase = content.french;
              }
              
              if (targetPhrase) {
                const words = targetPhrase.toLowerCase()
                  .replace(/[!?.,:;"'¡¿]/g, '') // Include Spanish punctuation
                  .split(/\s+/)
                  .filter(word => word.length > 0);
                
                words.forEach((word: string) => uniqueWords.add(word));
              }
            }
          }
        } catch (error) {
          console.error(`Error counting words for ${progressItem.courseId}/${progressItem.lessonId}:`, error);
        }
      }
      
      actualWordsLearned = uniqueWords.size;
      
      // Calculate actual streak
      let actualStreak = 0;
      if (completedLessons.length > 0) {
        // Sort by completion date
        const sortedLessons = completedLessons
          .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
        
        // Check if user completed a lesson today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let currentDate = new Date(today);
        actualStreak = 0;
        
        // Count consecutive days from today backwards
        while (true) {
          const hasLessonOnDate = sortedLessons.some(lesson => {
            const lessonDate = new Date(lesson.completedAt!);
            lessonDate.setHours(0, 0, 0, 0);
            return lessonDate.getTime() === currentDate.getTime();
          });
          
          if (hasLessonOnDate) {
            actualStreak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
      
      // Update stats if they don't exist or are outdated
      if (!stats) {
        stats = await storage.upsertUserStats({
          userId,
          language,
          streak: actualStreak,
          lessonsCompleted: actualLessonsCompleted,
          wordsLearned: actualWordsLearned,
        });
      } else if (stats.lessonsCompleted !== actualLessonsCompleted || 
                 stats.wordsLearned !== actualWordsLearned || 
                 stats.streak !== actualStreak) {
        // Update stats to match actual progress
        stats = await storage.upsertUserStats({
          userId,
          language,
          streak: actualStreak,
          lessonsCompleted: actualLessonsCompleted,
          wordsLearned: actualWordsLearned,
          lastLessonDate: stats.lastLessonDate,
        });
      }
      
      // Enrich progress data with actual lesson content from database
      const enrichedProgress = await Promise.all(
        progress.map(async (progressItem) => {
          try {
            // Extract course and lesson numbers
            const courseNumber = parseInt(progressItem.courseId.replace('course', ''));
            const lessonNumber = parseInt(progressItem.lessonId.replace('lesson', ''));
            
            if (isNaN(courseNumber) || isNaN(lessonNumber)) {
              return progressItem; // Skip non-standard lesson IDs
            }
            
            // Get language code for database query
            let languageCode = language;
            if (language === 'italian') languageCode = 'it';
            else if (language === 'spanish') languageCode = 'es';
            else if (language === 'german') languageCode = 'de';
            else if (language === 'french') languageCode = 'fr';
            else {
              return progressItem; // Unsupported language
            }
            
            // Get lesson data from database
            const lessonWithSteps = await storage.getLessonByCourseAndNumber(languageCode, courseNumber, lessonNumber);
            
            if (lessonWithSteps && lessonWithSteps.steps) {
              // Find word review step for phrases
              const wordReviewStep = lessonWithSteps.steps.find(step => step.stepType === 'word_review');
              
              let languagePhrase: string | undefined;
              let allPhrases: any = {};
              
              if (wordReviewStep && wordReviewStep.content) {
                const content = wordReviewStep.content as any;
                
                // Get the appropriate language phrase
                if (language === 'italian') {
                  languagePhrase = content.italian;
                } else if (language === 'spanish') {
                  languagePhrase = content.spanish;
                } else if (language === 'german') {
                  languagePhrase = content.german;
                } else if (language === 'french') {
                  languagePhrase = content.french;
                }
                
                // Collect all language phrases
                allPhrases = {
                  italian: content.italian,
                  spanish: content.spanish,
                  german: content.german,
                  french: content.french,
                  english: content.english
                };
              }
              
              // Get course info for title
              const dbLanguage = await storage.getLanguageByCode(languageCode);
              const skillLevel = await storage.getSkillLevelByCode('beginner');
              
              if (dbLanguage && skillLevel) {
                const coursesWithRelations = await storage.getCoursesWithRelations(dbLanguage.id, skillLevel.id);
                const courseInfo = coursesWithRelations.find(c => c.courseNumber === courseNumber);
                
                return {
                  ...progressItem,
                  lessonTitle: lessonWithSteps.title,
                  targetPhrase: languagePhrase, // Generic field for target language phrase
                  spanishPhrase: allPhrases.spanish, // Specific field for Spanish
                  italianPhrase: allPhrases.italian, // Specific field for Italian
                  germanPhrase: allPhrases.german,   // Specific field for German
                  frenchPhrase: allPhrases.french,   // Specific field for French
                  englishTranslation: allPhrases.english,
                  courseTitle: courseInfo?.title || `Course ${courseNumber}`
                };
              }
            }
          } catch (error) {
            console.error(`Error loading lesson content for ${progressItem.courseId}/${progressItem.lessonId}:`, error);
          }
          return progressItem;
        })
      );

      res.json({
        user,
        settings,
        stats: {
          ...stats,
          lessonsCompleted: stats.lessonsCompleted || 0,
        },
        progress: enrichedProgress
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
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
        }
      }

      // Get the actual lesson data from database
      try {
        // Extract course and lesson numbers
        const courseNumber = parseInt(nextLesson.courseId.replace('course', ''));
        const lessonNumber = parseInt(nextLesson.lessonId.replace('lesson', ''));
        
        if (isNaN(courseNumber) || isNaN(lessonNumber)) {
          // Fallback for non-standard lesson IDs
          return res.json({
            courseId: nextLesson.courseId,
            lessonId: nextLesson.lessonId,
            title: `${nextLesson.courseId} - ${nextLesson.lessonId}`,
            description: "Continue your language learning journey"
          });
        }
        
        // Get language code for database query
        let languageCode = language;
        if (language === 'italian') languageCode = 'it';
        else if (language === 'spanish') languageCode = 'es';
        else if (language === 'german') languageCode = 'de';
        else if (language === 'french') languageCode = 'fr';
        
        // Get lesson data from database
        const lessonWithSteps = await storage.getLessonByCourseAndNumber(languageCode, courseNumber, lessonNumber);
        
        if (lessonWithSteps && lessonWithSteps.steps) {
          // Find word review step for the target phrase
          const wordReviewStep = lessonWithSteps.steps.find(step => step.stepType === 'word_review');
          
          let targetPhrase: string | undefined;
          if (wordReviewStep && wordReviewStep.content) {
            const content = wordReviewStep.content as any;
            
            // Get the appropriate language phrase from database content
            if (language === 'italian') {
              targetPhrase = content.italian;
            } else if (language === 'spanish') {
              targetPhrase = content.spanish;
            } else if (language === 'german') {
              targetPhrase = content.german;
            } else if (language === 'french') {
              targetPhrase = content.french;
            }
          }
          
          // Get course info from database to get title and description
          const dbLanguage = await storage.getLanguageByCode(languageCode);
          const skillLevel = await storage.getSkillLevelByCode('beginner');
          
          if (dbLanguage && skillLevel) {
            const coursesWithRelations = await storage.getCoursesWithRelations(dbLanguage.id, skillLevel.id);
            const courseInfo = coursesWithRelations.find(c => c.courseNumber === courseNumber);
            
            return res.json({
              courseId: nextLesson.courseId,
              lessonId: nextLesson.lessonId,
              title: lessonWithSteps.title,
              targetPhrase: targetPhrase, // The actual phrase in the target language
              notificationText: targetPhrase || lessonWithSteps.title, // Phrase to use in notifications
              description: courseInfo?.description || "Continue your language learning journey",
              courseTitle: courseInfo?.title || `Course ${courseNumber}`,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching lesson from database:", error);
      }
      
      res.json({
        courseId: nextLesson.courseId,
        lessonId: nextLesson.lessonId,
        title: `${nextLesson.courseId} - ${nextLesson.lessonId}`,
        description: "Continue your language learning journey"
      });
    } catch (error) {
      console.error("Error fetching next lesson:", error);
      res.status(500).json({ message: "Failed to fetch next lesson" });
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
          language: "spanish",
          notificationFrequency: 60,
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
      const userId = req.user.claims?.sub || req.user.id;
      const existingSettings = await storage.getUserSettings(userId);
      
      const settingsData = {
        userId,
        language: existingSettings?.language || "italian",
        theme: existingSettings?.theme || "light",
        soundEnabled: existingSettings?.soundEnabled ?? true,
        notificationsEnabled: req.body.notificationsEnabled ?? (existingSettings?.notificationsEnabled ?? false),
        notificationFrequency: req.body.notificationFrequency ?? (existingSettings?.notificationFrequency ?? 60),
        notificationStartTime: req.body.notificationStartTime ?? (existingSettings?.notificationStartTime ?? "09:00"),
        notificationEndTime: req.body.notificationEndTime ?? (existingSettings?.notificationEndTime ?? "18:00"),
        difficultyLevel: existingSettings?.difficultyLevel || "beginner",
        ...req.body,
      };
      
      const settings = await storage.upsertUserSettings(settingsData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating settings:", error);
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
      if (language === 'italian' || language === 'spanish') {
        const languageCode = language === 'italian' ? 'it' : 'es';
        const dbLanguage = await storage.getLanguageByCode(languageCode);
        const beginnerLevel = await storage.getSkillLevelByCode('beginner');
        
        if (!dbLanguage || !beginnerLevel) {
          return res.status(404).json({ message: `Language ${language} not found in database` });
        }
        
        const courses = await storage.getCoursesWithRelations(dbLanguage.id, beginnerLevel.id);
        const course = courses.find(c => `course${c.courseNumber}` === nextLesson.courseId);
        
        if (!course) {
          return res.status(404).json({ message: "Course not found" });
        }
        
        const lesson = course.lessons.find(l => `lesson${l.lessonNumber}` === nextLesson.lessonId);
        
        if (!lesson) {
          return res.status(404).json({ message: "Lesson not found" });
        }
        
        // Get user tier for access control
        const userId = req.user.claims?.sub || req.user.id;
        const user = await storage.getUser(userId);
        const userTier = user?.priceTier || 'free';
        const isProUser = userTier === 'pro' || userTier === 'pro-monthly' || userTier === 'pro-yearly';
        
        // Convert to expected format
        const lessonData: any = {
          title: lesson.title
        };
        
        lesson.steps.forEach(step => {
          lessonData[`step${step.stepNumber}`] = step.content;
        });
        
        // Apply comprehensive security sanitization
        const sanitizedLessonData = sanitizeResponse(userTier, { lesson: lessonData });
        
        res.json({
          courseId: nextLesson.courseId,
          courseTitle: course.title,
          courseDescription: course.description,
          lessonId: nextLesson.lessonId,
          lesson: sanitizedLessonData.lesson
        });
      } else {
        res.status(404).json({ message: "Language not supported for course structure" });
      }
    } catch (error) {
      console.error("Error fetching next lesson:", error);
      res.status(500).json({ message: "Failed to fetch next lesson" });
    }
  });

  // Get next 5 lessons for "Coming Up Next" section
  app.get('/api/upcoming-lessons', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      const language = user?.selectedLanguage || 'italian';
      
      // Get user progress to determine current position
      const userProgress = await storage.getUserProgress(userId, language);
      
      let upcomingLessons: any[] = [];

      if (['italian', 'spanish', 'french', 'german'].includes(language)) {
        // Get language code for database query
        let languageCode = language;
        if (language === 'italian') languageCode = 'it';
        else if (language === 'spanish') languageCode = 'es';
        else if (language === 'german') languageCode = 'de';
        else if (language === 'french') languageCode = 'fr';
        
        // Get all courses from database with their lessons
        const dbLanguage = await storage.getLanguageByCode(languageCode);
        const skillLevel = await storage.getSkillLevelByCode('beginner');
        
        if (dbLanguage && skillLevel) {
          const coursesWithRelations = await storage.getCoursesWithRelations(dbLanguage.id, skillLevel.id);
          const allLessons: any[] = [];
          
          for (const course of coursesWithRelations) {
            // Get lessons and checkpoints
            const lessons = course.lessons.filter(lesson => lesson.lessonNumber > 0).sort((a, b) => a.lessonNumber - b.lessonNumber);
            const checkpoints = course.checkpoints.sort((a, b) => a.checkpointNumber - b.checkpointNumber);
            
            // Create an interleaved sequence of lessons and reviews
            const courseItems: any[] = [];
            
            // Add lessons with reviews at appropriate points
            for (const lesson of lessons) {
              let lessonId: string;
              let title: string;
              let targetPhrase = '';
              let isIRLLesson = false;
              
              // Handle IRL lessons (lesson numbers 1000+)
              if (lesson.lessonNumber >= 1000) {
                const irlNumber = lesson.lessonNumber - 1000;
                lessonId = `lesson_irl${irlNumber}`;
                isIRLLesson = true;
                
                // For IRL lessons, always use the lesson title (e.g., "IRL Video Challenge 2")
                title = lesson.title;
                console.log(`📺 IRL Lesson - lessonNumber: ${lesson.lessonNumber}, title: "${lesson.title}", lessonId: ${lessonId}`);
              } else {
                // Handle regular lessons
                lessonId = `lesson${lesson.lessonNumber}`;
                const wordReviewStep = lesson.steps?.find(step => step.stepType === 'word_review');
                
                if (wordReviewStep && wordReviewStep.content) {
                  const content = wordReviewStep.content as any;
                  if (language === 'italian') targetPhrase = content.italian || '';
                  else if (language === 'spanish') targetPhrase = content.spanish || '';
                  else if (language === 'german') targetPhrase = content.german || '';
                  else if (language === 'french') targetPhrase = content.french || '';
                }
                title = targetPhrase || lesson.title;
              }
              
              courseItems.push({
                courseId: `course${course.courseNumber}`,
                lessonId: lessonId,
                title: title,
                description: lesson.title,
                courseTitle: course.title,
                targetPhrase: targetPhrase,
                isReview: false,
                isIRLLesson: isIRLLesson,
                sortOrder: lesson.lessonNumber >= 1000 ? 
                  // IRL lessons come after specific reviews: lesson_irl1 after review1, lesson_irl2 after review2, lesson_irl3 after final review
                  (lesson.lessonNumber === 1001 ? 46 :      // lesson_irl1 comes after review1 (sortOrder 45)
                   lesson.lessonNumber === 1002 ? 86 :      // lesson_irl2 comes after review2 (sortOrder 85) 
                   lesson.lessonNumber === 1003 ? 126 : 999) : // lesson_irl3 comes after final review (sortOrder 125)
                  lesson.lessonNumber * 10 // Regular lessons (e.g., 10, 20, 30, 40)
              });
              
              // Check if there's a review that should come after this lesson
              const reviewAfterThisLesson = checkpoints.find(cp => {
                if (cp.checkpointNumber === 999) return false; // Final review goes at end
                // Regular reviews (1, 2, 3) come after lessons 4, 8, 12
                const triggerLessonNumber = cp.checkpointNumber * 4;
                return lesson.lessonNumber === triggerLessonNumber;
              });
              
              if (reviewAfterThisLesson) {
                courseItems.push({
                  courseId: `course${course.courseNumber}`,
                  lessonId: `review${reviewAfterThisLesson.checkpointNumber}`,
                  title: reviewAfterThisLesson.title || `Review ${reviewAfterThisLesson.checkpointNumber}`,
                  description: reviewAfterThisLesson.title || `Review section`,
                  courseTitle: course.title,
                  isReview: true,
                  sortOrder: lesson.lessonNumber * 10 + 5 // Reviews come after lessons
                });
              }
            }
            
            // Add final review at the end if it exists
            const finalReview = checkpoints.find(cp => cp.checkpointNumber === 999);
            if (finalReview) {
              courseItems.push({
                courseId: `course${course.courseNumber}`,
                lessonId: `review${finalReview.checkpointNumber}`,
                title: finalReview.title || 'Final Review',
                description: finalReview.title || 'Final review section',
                courseTitle: course.title,
                isReview: true,
                sortOrder: lessons.length * 10 + 10 // Final review at end
              });
            }
            
            // Sort items by their order and add to allLessons
            courseItems.sort((a, b) => a.sortOrder - b.sortOrder);
            allLessons.push(...courseItems);
          }

          // Filter out completed lessons
          const completedLessonIds = new Set(
            userProgress.map((p: any) => `${p.courseId}-${p.lessonId}`)
          );

          upcomingLessons = allLessons
            .filter(lesson => !completedLessonIds.has(`${lesson.courseId}-${lesson.lessonId}`))
            .slice(0, 5);
        }
      }

      res.json({ 
        lessons: upcomingLessons,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error("Error fetching upcoming lessons:", error);
      res.status(500).json({ message: "Failed to fetch upcoming lessons" });
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
        const lessonsCompleted = (stats?.lessonsCompleted || 0) + 1;
        
        // Calculate words learned from this lesson using database
        let newWordsLearned = stats?.wordsLearned || 0;
        try {
          // Extract course and lesson numbers
          const courseNumber = parseInt(progressData.courseId.replace('course', ''));
          const lessonNumber = parseInt(progressData.lessonId.replace('lesson', ''));
          
          if (!isNaN(courseNumber) && !isNaN(lessonNumber)) {
            // Get language code for database query
            let languageCode = progressData.language;
            if (progressData.language === 'italian') languageCode = 'it';
            else if (progressData.language === 'spanish') languageCode = 'es';
            else if (progressData.language === 'german') languageCode = 'de';
            else if (progressData.language === 'french') languageCode = 'fr';
            
            // Get lesson data from database
            const lessonWithSteps = await storage.getLessonByCourseAndNumber(languageCode, courseNumber, lessonNumber);
            
            if (lessonWithSteps && lessonWithSteps.steps) {
              // Find word review step for target phrase
              const wordReviewStep = lessonWithSteps.steps.find(step => step.stepType === 'word_review');
              
              if (wordReviewStep && wordReviewStep.content) {
                const content = wordReviewStep.content as any;
                let targetPhrase: string | undefined;
                
                // Get the appropriate language phrase from database content
                if (progressData.language === 'italian') {
                  targetPhrase = content.italian;
                } else if (progressData.language === 'spanish') {
                  targetPhrase = content.spanish;
                } else if (progressData.language === 'german') {
                  targetPhrase = content.german;
                } else if (progressData.language === 'french') {
                  targetPhrase = content.french;
                }
                
                if (targetPhrase) {
                  // Count unique words (split by spaces and punctuation)
                  const words = targetPhrase.toLowerCase()
                    .replace(/[!?.,:;"'¡¿]/g, '') // Remove punctuation (include Spanish)
                    .split(/\s+/) // Split by whitespace
                    .filter((word: string) => word.length > 0); // Remove empty strings
                  
                  newWordsLearned += words.length;
                }
              }
            }
          }
        } catch (error) {
          console.error(`Error counting words for ${progressData.courseId}/${progressData.lessonId}:`, error);
        }
        
        // Calculate streak with proper date handling
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to start of day
        const lastLessonDate = stats?.lastLessonDate;
        let streak = stats?.streak || 0;
        
        if (lastLessonDate) {
          const lastDate = new Date(lastLessonDate);
          lastDate.setHours(0, 0, 0, 0); // Normalize to start of day
          const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === 1) {
            streak += 1; // Consecutive day
          } else if (daysDiff > 1) {
            streak = 1; // Broke streak, reset to 1
          }
          // If daysDiff === 0, keep current streak (same day)
        } else {
          streak = 1; // First lesson
        }
        
        await storage.upsertUserStats({
          userId,
          language: progressData.language,
          streak,
          lessonsCompleted,
          wordsLearned: newWordsLearned,
          lastLessonDate: new Date(), // Use actual current date/time
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
          lessonsCompleted: 0,
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

  // Database-driven course management API
  
  // Language routes
  app.get('/api/languages', async (req, res) => {
    try {
      const languages = await storage.getLanguages();
      res.json(languages);
    } catch (error) {
      console.error("Error fetching languages:", error);
      res.status(500).json({ message: "Failed to fetch languages" });
    }
  });

  app.get('/api/languages/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const language = await storage.getLanguage(id);
      if (!language) {
        return res.status(404).json({ message: "Language not found" });
      }
      res.json(language);
    } catch (error) {
      console.error("Error fetching language:", error);
      res.status(500).json({ message: "Failed to fetch language" });
    }
  });

  // Skill level routes
  app.get('/api/skill-levels', async (req, res) => {
    try {
      const skillLevels = await storage.getSkillLevels();
      res.json(skillLevels);
    } catch (error) {
      console.error("Error fetching skill levels:", error);
      res.status(500).json({ message: "Failed to fetch skill levels" });
    }
  });

  // Get course statistics
  app.get('/api/course-stats', async (req, res) => {
    try {
      let languageId: number | undefined;
      let skillLevelId: number | undefined;
      
      // Handle both ID and code parameters for backward compatibility
      if (req.query.languageId) {
        languageId = parseInt(req.query.languageId as string);
      } else if (req.query.languageCode) {
        const languageCode = req.query.languageCode as string;
        // First try by code
        let language = await storage.getLanguageByCode(languageCode);
        
        // If not found, try mapping common language names to codes
        if (!language) {
          const languageCodeMap: { [key: string]: string } = {
            'italian': 'it',
            'spanish': 'es',
            'french': 'fr',
            'german': 'de'
          };
          
          const mappedCode = languageCodeMap[languageCode.toLowerCase()];
          if (mappedCode) {
            language = await storage.getLanguageByCode(mappedCode);
          }
        }
        
        languageId = language?.id;
      }
      
      if (req.query.skillLevelId) {
        skillLevelId = parseInt(req.query.skillLevelId as string);
      } else if (req.query.skillLevelCode) {
        const skillLevel = await storage.getSkillLevelByCode(req.query.skillLevelCode as string);
        skillLevelId = skillLevel?.id;
      }
      
      // Get all courses for the specified language/skill level
      const courses = await storage.getCourses(languageId, skillLevelId);
      
      let totalLessons = 0;
      
      // Count lessons across all courses
      for (const course of courses) {
        const lessons = await storage.getLessons(course.id);
        totalLessons += lessons.length;
      }
      
      res.json({
        totalCourses: courses.length,
        totalLessons: totalLessons
      });
    } catch (error) {
      console.error("Error fetching course statistics:", error);
      res.status(500).json({ message: "Failed to fetch course statistics" });
    }
  });

  // Database course routes
  app.get('/api/db/courses', async (req, res) => {
    try {
      const languageId = req.query.languageId ? parseInt(req.query.languageId as string) : undefined;
      const skillLevelId = req.query.skillLevelId ? parseInt(req.query.skillLevelId as string) : undefined;
      const withRelations = req.query.withRelations === 'true';

      let courses;
      if (withRelations) {
        courses = await storage.getCoursesWithRelations(languageId, skillLevelId);
      } else {
        courses = await storage.getCourses(languageId, skillLevelId);
      }
      
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Failed to fetch courses" });
    }
  });

  app.get('/api/db/courses/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const withRelations = req.query.withRelations === 'true';

      let course;
      if (withRelations) {
        course = await storage.getCourseWithRelations(id);
      } else {
        course = await storage.getCourse(id);
      }

      if (!course) {
        return res.status(404).json({ message: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      console.error("Error fetching course:", error);
      res.status(500).json({ message: "Failed to fetch course" });
    }
  });

  app.post('/api/db/courses', isAuthenticated, async (req, res) => {
    try {
      const courseData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      console.error("Error creating course:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data provided",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create course" });
    }
  });

  app.put('/api/db/courses/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const courseData = insertCourseSchema.partial().parse(req.body);
      const course = await storage.updateCourse(id, courseData);
      res.json(course);
    } catch (error) {
      console.error("Error updating course:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data provided",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to update course" });
    }
  });

  app.delete('/api/db/courses/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCourse(id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ message: "Failed to delete course" });
    }
  });

  // Database lesson routes
  app.get('/api/db/courses/:courseId/lessons', async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const lessons = await storage.getLessons(courseId);
      res.json(lessons);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  app.get('/api/db/lessons/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const withSteps = req.query.withSteps === 'true';

      let lesson;
      if (withSteps) {
        lesson = await storage.getLessonWithSteps(id);
        
        // Apply comprehensive security sanitization for pro content
        if (lesson && lesson.steps) {
          const userId = (req as any).user?.claims?.sub || (req as any).user?.id;
          let userTier = 'free';
          if (userId) {
            const user = await storage.getUser(userId);
            userTier = user?.priceTier || 'free';
          }
          
          // Apply comprehensive sanitization to protect pro content
          lesson = sanitizeResponse(userTier, lesson);
        }
      } else {
        lesson = await storage.getLesson(id);
      }

      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      console.error("Error fetching lesson:", error);
      res.status(500).json({ message: "Failed to fetch lesson" });
    }
  });

  app.post('/api/db/lessons', isAuthenticated, async (req, res) => {
    try {
      const lessonData = insertLessonSchema.parse(req.body);
      const lesson = await storage.createLesson(lessonData);
      res.status(201).json(lesson);
    } catch (error) {
      console.error("Error creating lesson:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data provided",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create lesson" });
    }
  });

  // Database lesson step routes
  app.get('/api/db/lessons/:lessonId/steps', async (req, res) => {
    try {
      const lessonId = parseInt(req.params.lessonId);
      const steps = await storage.getLessonSteps(lessonId);
      
      // Apply comprehensive security sanitization to protect pro content
      const userId = (req as any).user?.claims?.sub || (req as any).user?.id;
      let userTier = 'free';
      if (userId) {
        const user = await storage.getUser(userId);
        userTier = user?.priceTier || 'free';
      }
      
      // Apply comprehensive sanitization to protect pro content
      const sanitizedSteps = sanitizeResponse(userTier, steps);
      res.json(sanitizedSteps);
    } catch (error) {
      console.error("Error fetching lesson steps:", error);
      res.status(500).json({ message: "Failed to fetch lesson steps" });
    }
  });

  app.post('/api/db/lesson-steps', isAuthenticated, async (req, res) => {
    try {
      const stepData = insertLessonStepSchema.parse(req.body);
      const step = await storage.createLessonStep(stepData);
      res.status(201).json(step);
    } catch (error) {
      console.error("Error creating lesson step:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data provided",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create lesson step" });
    }
  });

  // Import course from JSON
  app.post('/api/import-course', isAuthenticated, async (req, res) => {
    try {
      const { languageCode, skillLevelCode, courseData } = req.body;
      
      if (!languageCode || !skillLevelCode || !courseData) {
        return res.status(400).json({ 
          message: "languageCode, skillLevelCode, and courseData are required" 
        });
      }

      const course = await storage.importCourseFromJSON(languageCode, skillLevelCode, courseData);
      res.status(201).json({ 
        message: "Course imported successfully",
        course 
      });
    } catch (error) {
      console.error("Error importing course:", error);
      res.status(500).json({ message: error.message || "Failed to import course" });
    }
  });

  // Legacy Italian courses routes (for backward compatibility)
  app.get('/api/courses/:language', async (req, res) => {
    try {
      const { language } = req.params;
      
      // For Italian and Spanish, use database
      if (language === 'italian' || language === 'spanish') {
        const languageCode = language === 'italian' ? 'it' : 'es';
        const dbLanguage = await storage.getLanguageByCode(languageCode);
        const beginnerLevel = await storage.getSkillLevelByCode('beginner');
        
        if (!dbLanguage || !beginnerLevel) {
          return res.status(404).json({ message: `Language ${language} not found in database` });
        }
        
        const courses = await storage.getCoursesWithRelations(dbLanguage.id, beginnerLevel.id);
        
        if (courses.length === 0) {
          return res.status(404).json({ message: `No courses found for ${language}` });
        }
        
        // Convert database structure to the expected format
        const coursesData: Record<string, any> = {};
        
        courses.forEach(course => {
          const courseKey = `course${course.courseNumber}`;
          coursesData[courseKey] = {
            title: course.title,
            description: course.description,
            lessons: {}
          };
          
          course.lessons.forEach(lesson => {
            const lessonKey = `lesson${lesson.lessonNumber}`;
            const lessonData: any = {
              title: lesson.title
            };
            
            // Add step data if available
            lesson.steps.forEach(step => {
              lessonData[`step${step.stepNumber}`] = step.content;
            });
            
            coursesData[courseKey].lessons[lessonKey] = lessonData;
          });
        });
        
        res.json(coursesData);
      } else {
        // Fallback: if language not in database yet, return empty courses
        res.json({});
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
      
      // Handle review lessons for Italian and Spanish (fetch from database checkpoints)
      if ((['italian', 'spanish'].includes(language)) && lessonId.startsWith('review')) {
        const languageCode = language === 'italian' ? 'it' : 'es';
        
        // Get language and course from database
        const languageRecord = await storage.getLanguageByCode(languageCode);
        if (!languageRecord) {
          return res.status(404).json({ message: `Language not found: ${languageCode}` });
        }
        
        const courseNumber = parseInt(courseId.replace('course', ''));
        
        // Get beginner skill level ID
        const skillLevel = await storage.getSkillLevelByCode('beginner');
        if (!skillLevel) {
          return res.status(404).json({ message: 'Beginner skill level not found' });
        }
        
        const courses = await storage.getCoursesWithRelations(languageRecord.id, skillLevel.id);
        const course = courses.find(c => c.courseNumber === courseNumber);
        
        if (!course) {
          return res.status(404).json({ message: `Course not found: ${courseId}` });
        }
        
        // Find the checkpoint based on lessonId (review1 -> checkpoint 1, review_final -> checkpoint 0)
        let checkpointNumber;
        if (lessonId === 'review_final') {
          checkpointNumber = 0;
        } else {
          checkpointNumber = parseInt(lessonId.replace('review', ''));
        }
        
        const checkpoint = course.checkpoints.find(cp => cp.checkpointNumber === checkpointNumber);
        
        if (!checkpoint) {
          return res.status(404).json({ message: `Review checkpoint not found: ${lessonId} in ${courseId}` });
        }
        
        // Format checkpoint data as a lesson
        res.json({
          courseId,
          courseTitle: course.title,
          courseDescription: course.description,
          lessonId,
          lesson: {
            title: checkpoint.title,
            mode: 'mcq',
            questions: checkpoint.questions
          }
        });
        return;
      }
      
      if (['italian', 'spanish'].includes(language)) {
        // Use database for Italian and Spanish lessons (which have the new 4-step structure)
        const languageCode = language === 'italian' ? 'it' : 'es';
        const courseNumber = parseInt(courseId.replace('course', ''));
        
        // Handle IRL lessons (lesson_irl1 -> 1001, lesson_irl2 -> 1002, etc.)
        let lessonNumber: number;
        if (lessonId.startsWith('lesson_irl')) {
          const irlNumber = parseInt(lessonId.replace('lesson_irl', ''));
          lessonNumber = 1000 + irlNumber; // Convert to database lesson number
        } else {
          lessonNumber = parseInt(lessonId.replace('lesson', ''));
        }
        
        const lessonWithSteps = await storage.getLessonByCourseAndNumber(languageCode, courseNumber, lessonNumber);
        
        if (!lessonWithSteps) {
          return res.status(404).json({ message: `Lesson not found in database: ${courseId}/${lessonId}` });
        }

        // Get course information for response
        const dbLanguage = await storage.getLanguageByCode(languageCode);
        const beginnerLevel = await storage.getSkillLevelByCode('beginner');
        const courseInfo = await storage.getCourse(dbLanguage?.id || 0, beginnerLevel?.id || 0, courseNumber);

        // Check if this is an IRL lesson
        const isIRLLesson = lessonNumber >= 1000;
        
        if (isIRLLesson) {
          // Handle IRL video lesson
          const irlStep = lessonWithSteps.steps.find(step => step.stepType === 'irl_video');
          if (irlStep) {
            const content = irlStep.content as any;
            
            // Fix video URL by adding /attached_assets/ prefix
            const fixedContent = {
              ...content,
              videoUrl: content.videoUrl && !content.videoUrl.startsWith('/attached_assets/') 
                ? `/attached_assets/${content.videoUrl}` 
                : content.videoUrl
            };
            
            const fixedSteps = lessonWithSteps.steps.map(step => {
              if (step.stepType === 'irl_video') {
                const stepContent = step.content as any;
                return {
                  ...step,
                  content: {
                    ...stepContent,
                    videoUrl: stepContent.videoUrl && !stepContent.videoUrl.startsWith('/attached_assets/') 
                      ? `/attached_assets/${stepContent.videoUrl}` 
                      : stepContent.videoUrl
                  }
                };
              }
              return step;
            });
            
            return res.json({
              courseId,
              courseTitle: courseInfo?.title || 'Course',
              courseDescription: courseInfo?.description || 'Course description',
              lessonId,
              lesson: {
                title: lessonWithSteps.title,
                steps: fixedSteps,
                isIRLLesson: true,
                content: fixedContent
              }
            });
          }
        }

        // Get user tier for access control
        const userId = (req as any).user?.claims?.sub || (req as any).user?.id;
        let userTier = 'free';
        if (userId) {
          const user = await storage.getUser(userId);
          
          // Check live Stripe subscription status for pro access
          if (user?.stripeSubscriptionId) {
            try {
              const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
              if (subscription.status === 'active') {
                userTier = 'pro-monthly';
                // Update stored price tier if needed
                if (user.priceTier !== 'pro-monthly') {
                  await storage.updateUserPriceTier(userId, 'pro-monthly');
                }
              } else {
                // Subscription is not active, ensure price tier reflects this
                if (user.priceTier.startsWith('pro-')) {
                  await storage.updateUserPriceTier(userId, 'n/a');
                }
              }
            } catch (error) {
              console.error('Error checking subscription status:', error);
              // Fall back to stored price tier
              userTier = user?.priceTier || 'free';
            }
          } else {
            userTier = user?.priceTier || 'free';
          }
        }
        
        // Convert the database steps to the expected frontend format
        const lesson = {
          title: lessonWithSteps.title,
          content: {
            word: '',
            translation: '',
            audio: '',
            note: ''
          },
          quiz: null as any
        };

        // Process the steps to build the lesson data
        const allSteps: any = {};
        for (const step of lessonWithSteps.steps) {
          if (step.stepType === 'word_review') {
            // New 4-step structure: word review step
            const content = step.content as any;
            lesson.content.word = content.italian;
            lesson.content.translation = content.english;
            lesson.content.audio = content.audio;
            lesson.content.note = content.note;
            allSteps.word_review = {
              type: 'word_review',
              stepType: step.stepType,
              requiredTier: step.requiredTier,
              word: content.italian,
              translation: content.english,
              audio: content.audio,
              note: content.note
            };
          } else if (step.stepType === 'quick_check') {
            // New 4-step structure: quick check step
            const content = step.content as any;
            const mcq = content.mcq;
            lesson.quiz = {
              question: mcq.question,
              options: mcq.options,
              correct: mcq.options.indexOf(mcq.answer)
            };
            allSteps.quick_check = {
              type: 'quick_check',
              stepType: step.stepType,
              requiredTier: step.requiredTier,
              question: mcq.question,
              options: mcq.options,
              answer: mcq.answer
            };
          } else if (step.stepType === 'typing') {
            // Typing step from JSON (step 3)
            const content = step.content as any;
            allSteps.typing = {
              type: 'type',
              stepType: step.stepType,
              requiredTier: step.requiredTier,
              prompt: content.type_prompt,
              expected: content.expected_answer,
              alternatives: content.alt_answers || []
            };
          } else if (step.stepType === 'typing_practice') {
            // New 4-step structure: typing practice step
            const content = step.content as any;
            
            // Generate proper fill-in-the-blank format
            const generateFillInText = (word: string) => {
              // For phrases with spaces, show the first word and blank out the rest
              if (word.includes(' ')) {
                const parts = word.split(' ');
                return parts[0] + "_".repeat(word.length - parts[0].length);
              }
              // For single words
              if (word.length <= 3) return word.charAt(0) + "_".repeat(word.length - 1);
              return word.substring(0, 2) + "_".repeat(word.length - 2);
            };
            
            const getMissingLetters = (word: string) => {
              // For phrases with spaces, return everything after the first word (excluding the space)
              if (word.includes(' ')) {
                const firstSpaceIndex = word.indexOf(' ');
                return word.substring(firstSpaceIndex + 1); // +1 to skip the space
              }
              // For single words
              if (word.length <= 3) return word.substring(1);
              return word.substring(2);
            };
            
            // Get the target word from the expected answer or extract from content
            const targetWord = content.expected || content.italian || '';
            const fillInPrompt = `${generateFillInText(targetWord)} = ${content.english || content.translation || ''}`;
            const missingLetters = getMissingLetters(targetWord);
            
            allSteps.typing_practice = {
              type: 'type',
              stepType: step.stepType,
              requiredTier: step.requiredTier,
              prompt: fillInPrompt,
              expected: missingLetters,
              alternatives: content.alternatives || []
            };
          } else if (step.stepType === 'listening_comprehension') {
            // New 4-step structure: listening comprehension step
            const content = step.content as any;
            allSteps.listening_comprehension = {
              type: 'audio',
              stepType: step.stepType,
              requiredTier: step.requiredTier,
              audioSentence: content.audioSentence,
              options: content.options,
              answer: content.answer
            };
          } else if (step.stepType === 'video_choice') {
            // New video step: gender-based video selection
            const content = step.content as any;
            allSteps.video_choice = {
              type: 'video_choice',
              stepType: step.stepType,
              requiredTier: step.requiredTier,
              prompt: content.prompt,
              options: content.options
            };
          } else if (step.stepType === 'pro_video') {
            // New video step: pro-tier restricted video
            const content = step.content as any;
            allSteps.pro_video = {
              type: 'pro_video',
              stepType: step.stepType,
              requiredTier: step.requiredTier || content.requiredTier,
              video_url: content.video_url,
              prompt: content.prompt,
              answer_prompt: content.answer_prompt || content.answerPrompt || '',
              expected_answers: content.expected_answers || content.expectedAnswers || [],
              isRestricted: content.isRestricted || false
            };
          } else if (step.stepType === 'text_tip') {
            // Step 5: Educational text tip (cultural notes, challenges, etc.)
            const content = step.content as any;
            allSteps.text_tip = {
              type: 'text_tip',
              stepType: step.stepType,
              stepNumber: 5,
              prompt: content.prompt,
              answer_prompt: content.answer_prompt || 'Press continue to move on.',
              ui_action: content.ui_action || 'continue'
            };
          } else if (step.stepType === 'introduction') {
            // Old 3-step structure: introduction step (contains both word review and MCQ)
            const content = step.content as any;
            lesson.content.word = content.italian;
            lesson.content.translation = content.english;
            lesson.content.audio = content.audio;
            lesson.content.note = content.note;
            const mcq = content.mcq;
            lesson.quiz = {
              question: mcq.question,
              options: mcq.options,
              correct: mcq.options.indexOf(mcq.answer)
            };
          }
        }

        // Add the steps to the lesson for the new 4-step structure
        if (Object.keys(allSteps).length > 0) {
          lesson.steps = allSteps;
        }

        // Step3 audio data is already included in database lesson steps

        // Get course info
        const languageRecord = await storage.getLanguageByCode(languageCode);
        const skillLevelRec = await storage.getSkillLevelByCode('beginner');
        const courses = await storage.getCoursesWithRelations(languageRecord?.id, skillLevelRec?.id);
        const course = courses.find(c => c.courseNumber === courseNumber);

        // Apply comprehensive security sanitization
        const responsePayload = {
          courseId,
          courseTitle: course?.title || 'Course',
          courseDescription: course?.description || '',
          lessonId,
          lesson
        };
        const sanitizedResponse = sanitizeResponse(userTier, responsePayload);

        res.json(sanitizedResponse);
      } else {
        // Try to use database for other languages too
        let languageCode = language;
        if (language === 'french') languageCode = 'fr';
        else if (language === 'german') languageCode = 'de';
        
        const courseNumber = parseInt(courseId.replace('course', ''));
        const lessonNumber = parseInt(lessonId.replace('lesson', ''));
        
        if (!isNaN(courseNumber) && !isNaN(lessonNumber)) {
          const dbLesson = await storage.getLessonByCourseAndNumber(languageCode, courseNumber, lessonNumber);
          
          if (dbLesson) {
            // Convert database lesson to expected format
            const lesson: any = {
              title: dbLesson.title,
              content: {},
              quiz: {}
            };
            
            // Convert steps to old format with proper access control
            const allSteps: any = {};
            
            // Get user tier for sanitization
            const userId = (req as any).user?.claims?.sub || (req as any).user?.id;
            let userTier = 'free';
            if (userId) {
              const user = await storage.getUser(userId);
              userTier = user?.priceTier || 'free';
            }
            
            // Convert steps to lesson format
            dbLesson.steps?.forEach(step => {
              allSteps[`step${step.stepNumber}`] = step.content;
            });
            
            if (Object.keys(allSteps).length > 0) {
              lesson.steps = allSteps;
            }
            
            // Get course info
            const languageRecord = await storage.getLanguageByCode(languageCode);
            const skillLevel = await storage.getSkillLevelByCode('beginner');
            const courses = await storage.getCoursesWithRelations(languageRecord?.id, skillLevel?.id);
            const course = courses.find(c => c.courseNumber === courseNumber);
            
            // Apply comprehensive security sanitization
            const responsePayload = {
              courseId,
              courseTitle: course?.title || 'Course',
              courseDescription: course?.description || '',
              lessonId,
              lesson
            };
            const sanitizedResponse = sanitizeResponse(userTier, responsePayload);
            
            return res.json(sanitizedResponse);
          }
        }
        
        return res.status(404).json({ message: "Course structure not found in database" });
      }
    } catch (error) {
      console.error("Error fetching specific course lesson:", error);
      res.status(500).json({ message: "Failed to fetch course lesson" });
    }
  });

  // Lessons routes (backward compatibility) - now uses database
  app.get('/api/lessons/:language', async (req, res) => {
    try {
      const { language } = req.params;
      
      // Get language code for database query
      let languageCode = language;
      if (language === 'italian') languageCode = 'it';
      else if (language === 'spanish') languageCode = 'es';
      else if (language === 'german') languageCode = 'de';
      else if (language === 'french') languageCode = 'fr';
      
      // Get lessons from database
      const dbLanguage = await storage.getLanguageByCode(languageCode);
      const skillLevel = await storage.getSkillLevelByCode('beginner');
      
      if (!dbLanguage || !skillLevel) {
        return res.status(404).json({ message: `Language not found in database: ${language}` });
      }
      
      const coursesWithRelations = await storage.getCoursesWithRelations(dbLanguage.id, skillLevel.id);
      
      // Convert to old lessons structure for backward compatibility
      const lessonsData: any = {};
      
      for (const course of coursesWithRelations) {
        const courseKey = `course${course.courseNumber}`;
        lessonsData[courseKey] = {
          title: course.title,
          description: course.description,
          lessons: {}
        };
        
        // Add lessons
        for (const lesson of course.lessons) {
          const lessonKey = `lesson${lesson.lessonNumber}`;
          const lessonData: any = {
            title: lesson.title
          };
          
          // Add step data
          lesson.steps?.forEach(step => {
            lessonData[`step${step.stepNumber}`] = step.content;
          });
          
          lessonsData[courseKey].lessons[lessonKey] = lessonData;
        }
      }
      
      res.json(lessonsData);
    } catch (error) {
      console.error("Error fetching lessons:", error);
      res.status(500).json({ message: "Failed to fetch lessons" });
    }
  });

  // Get specific lesson by week and day (maps to category-based structure) - now uses database
  app.get('/api/lessons/:language/:week/:day', async (req, res) => {
    try {
      const { language, week, day } = req.params;
      
      // Get language code for database query
      let languageCode = language;
      if (language === 'italian') languageCode = 'it';
      else if (language === 'spanish') languageCode = 'es';
      else if (language === 'german') languageCode = 'de';
      else if (language === 'french') languageCode = 'fr';
      
      // Get lessons from database
      const dbLanguage = await storage.getLanguageByCode(languageCode);
      const skillLevel = await storage.getSkillLevelByCode('beginner');
      
      if (!dbLanguage || !skillLevel) {
        return res.status(404).json({ message: `Language not found in database: ${language}` });
      }
      
      const coursesWithRelations = await storage.getCoursesWithRelations(dbLanguage.id, skillLevel.id);
      
      if (coursesWithRelations.length === 0) {
        return res.status(404).json({ message: `No courses found for language: ${language}` });
      }
      
      // Map week/day to course/lesson structure
      // Week corresponds to course number, Day corresponds to lesson number within course
      const targetCourseNumber = parseInt(week);
      const targetLessonNumber = parseInt(day);
      
      console.log(`Mapping week ${week}, day ${day} to course ${targetCourseNumber}, lesson ${targetLessonNumber}`);
      
      // Find the specific course and lesson
      const targetCourse = coursesWithRelations.find(c => c.courseNumber === targetCourseNumber);
      if (!targetCourse) {
        return res.status(404).json({ 
          message: `Course ${targetCourseNumber} not found for ${language}` 
        });
      }
      
      const targetLesson = targetCourse.lessons.find(l => l.lessonNumber === targetLessonNumber);
      if (!targetLesson) {
        return res.status(404).json({ 
          message: `Lesson ${targetLessonNumber} not found in course ${targetCourseNumber} for ${language}` 
        });
      }
      
      // Convert to old lesson format for backward compatibility
      const lessonData: any = {
        title: targetLesson.title
      };
      
      // Add step data
      targetLesson.steps?.forEach(step => {
        lessonData[`step${step.stepNumber}`] = step.content;
      });
      
      console.log(`Found lesson: ${targetCourse.title} - ${targetLesson.title}`);
      res.json(lessonData);
    } catch (error) {
      console.error("Error fetching specific lesson:", error);
      res.status(500).json({ message: "Failed to fetch lesson" });
    }
  });

  // Notification lesson route - gets a random lesson question for notifications
  app.get('/api/notification-lesson/:language', async (req, res) => {
    try {
      const { language } = req.params;
      
      // For Italian and Spanish, use database
      if (language === 'italian' || language === 'spanish') {
        const languageCode = language === 'italian' ? 'it' : 'es';
        const dbLanguage = await storage.getLanguageByCode(languageCode);
        const beginnerLevel = await storage.getSkillLevelByCode('beginner');
        
        if (!dbLanguage || !beginnerLevel) {
          return res.status(404).json({ message: `Language ${language} not found in database` });
        }
        
        const courses = await storage.getCoursesWithRelations(dbLanguage.id, beginnerLevel.id);
        
        if (courses.length === 0) {
          return res.status(404).json({ message: `No courses found for ${language}` });
        }
        
        // Collect all lessons
        const allLessons: Array<{
          lesson: any;
          courseId: string;
          lessonId: string;
          courseTitle: string;
        }> = [];
        
        courses.forEach(course => {
          course.lessons.forEach(lesson => {
            // Create lesson data in expected format
            const lessonData: any = {
              title: lesson.title
            };
            
            lesson.steps.forEach(step => {
              lessonData[`step${step.stepNumber}`] = step.content;
            });
            
            // Create a basic quiz question from first step
            const firstStep = lesson.steps[0]?.content;
            let question = `What does "${firstStep?.spanish || firstStep?.italian || ''}" mean?`;
            if (firstStep?.mcq?.question) {
              question = firstStep.mcq.question;
            }
            
            allLessons.push({
              lesson: {
                ...lessonData,
                quiz: {
                  question
                }
              },
              courseId: `course${course.courseNumber}`,
              lessonId: `lesson${lesson.lessonNumber}`,
              courseTitle: course.title
            });
          });
        });
        
        if (allLessons.length === 0) {
          return res.status(404).json({ message: `No lessons found for ${language}` });
        }
        
        // Pick a random lesson
        const randomIndex = Math.floor(Math.random() * allLessons.length);
        const { lesson, courseId, lessonId, courseTitle } = allLessons[randomIndex];
        
        res.json({
          question: lesson.quiz.question,
          lessonPath: `/lesson/${language}/course/${courseId}/${lessonId}`,
          courseId,
          lessonId,
          category: courseTitle,
          title: lesson.title
        });
      } else {
        // Language not available in database yet
        return res.status(404).json({ message: `Language not available in database: ${language}` });
      }
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
      const [user, settings] = await Promise.all([
        storage.getUser(userId),
        storage.getUserSettings(userId)
      ]);
      
      if (!settings) {
        return res.status(400).json({ message: "User settings not found. Please complete setup." });
      }
      
      const [stats, progress, latestProgress] = await Promise.all([
        storage.getUserStats(userId, settings.language),
        storage.getUserProgress(userId, settings.language),
        storage.getLatestProgress(userId, settings.language),
      ]);
      
      res.json({
        user: {
          id: user?.id,
          email: user?.email,
          firstName: user?.firstName,
          lastName: user?.lastName,
          selectedLanguage: user?.selectedLanguage,
          selectedLevel: user?.selectedLevel,
          hasSeenNotificationSetup: user?.hasSeenNotificationSetup || false,
        },
        settings,
        stats: stats || {
          streak: 0,
          lessonsCompleted: 0,
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

  // Update notification setup status
  app.put('/api/notification-setup-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { hasSeenNotificationSetup } = req.body;
      
      if (typeof hasSeenNotificationSetup !== 'boolean') {
        return res.status(400).json({ message: "hasSeenNotificationSetup must be a boolean" });
      }
      
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.upsertUser({
        id: userId,
        email: currentUser.email,
        hasSeenNotificationSetup
      });
      
      res.json({ success: true, hasSeenNotificationSetup: updatedUser.hasSeenNotificationSetup });
    } catch (error) {
      console.error("Error updating notification setup status:", error);
      res.status(500).json({ message: "Failed to update notification setup status" });
    }
  });

  // Checkpoint routes
  app.get('/api/checkpoints/:courseId', async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
      
      const checkpoints = await storage.getCheckpoints(courseId);
      res.json(checkpoints);
    } catch (error) {
      console.error("Error fetching checkpoints:", error);
      res.status(500).json({ message: "Failed to fetch checkpoints" });
    }
  });

  // Get individual checkpoint by checkpoint number (not database ID)
  app.get('/api/checkpoint/number/:checkpointNumber', async (req, res) => {
    try {
      const checkpointNumber = parseInt(req.params.checkpointNumber);
      if (isNaN(checkpointNumber)) {
        return res.status(400).json({ message: "Invalid checkpoint number" });
      }
      
      // Find checkpoint by checkpoint number
      const allCheckpoints = await storage.getAllCheckpoints();
      const checkpoint = allCheckpoints.find(c => c.checkpointNumber === checkpointNumber);
      
      if (!checkpoint) {
        return res.status(404).json({ message: "Checkpoint not found" });
      }
      
      res.json(checkpoint);
    } catch (error) {
      console.error("Error fetching checkpoint:", error);
      res.status(500).json({ message: "Failed to fetch checkpoint" });
    }
  });

  // Get checkpoints that are part of the actual course structure (JSON imported)
  app.get('/api/available-checkpoints', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      const language = user?.selectedLanguage || 'italian';
      
      // Map language names to language codes
      const languageCodeMap: { [key: string]: string } = {
        'italian': 'it',
        'spanish': 'es', 
        'german': 'de',
        'french': 'fr'
      };
      
      const languageCode = languageCodeMap[language] || language;
      
      // Get language record
      const languageRecord = await storage.getLanguageByCode(languageCode);
      if (!languageRecord) {
        return res.json({ availableCheckpoints: [], totalCompletedLessons: 0 });
      }
      
      // Get user progress for this language
      const userProgress = await storage.getUserProgress(userId, language);
      const completedLessons = userProgress.filter((p: any) => p.completed).length;
      
      // Get user's next lesson to determine their current course progress
      const nextLesson = await storage.getNextLesson(userId, language);
      
      // If user has completed all lessons, don't show any checkpoints
      if (!nextLesson) {
        return res.json({ availableCheckpoints: [], totalCompletedLessons: completedLessons });
      }
      
      // Extract current course number from next lesson
      const currentCourseNumber = parseInt(nextLesson.courseId.replace('course', ''));
      
      // Get all courses for this language
      const skillLevel = await storage.getSkillLevelByCode('beginner');
      if (!skillLevel) {
        return res.json({ availableCheckpoints: [], totalCompletedLessons: completedLessons });
      }
      
      // Get all courses for this language and skill level
      const courses = await storage.getCourses(languageRecord.id, skillLevel.id);
      
      const availableCheckpoints = [];
      
      // Only check courses at or before the user's current progress
      // Don't show checkpoints from courses the user has already progressed beyond
      for (const course of courses) {
        // Skip courses that the user has already progressed beyond
        if (course.courseNumber > currentCourseNumber) {
          continue;
        }
        
        // For the current course, only show checkpoints if the user is still working on lessons in that course
        // If user is on a different course, skip checkpoints from previous courses entirely
        if (course.courseNumber < currentCourseNumber) {
          continue;
        }
        
        // Get checkpoints for this course (these are JSON imported)
        const courseCheckpoints = await storage.getCheckpoints(course.id);
        
        // Get completed lessons for this specific course
        const courseLessons = await storage.getLessons(course.id);
        const completedCourseLessons = userProgress.filter((p: any) => 
          p.completed && courseLessons.some((lesson: any) => 
            `lesson${lesson.lessonNumber}` === p.lessonId && 
            `course${course.courseNumber}` === p.courseId
          )
        );
        
        // Check each checkpoint in this course
        for (const checkpoint of courseCheckpoints) {
          // Calculate how many lessons should be completed before this checkpoint
          const requiredLessons = checkpoint.checkpointNumber * 4;
          
          // Check if user has completed enough lessons to unlock this checkpoint
          if (completedCourseLessons.length >= requiredLessons) {
            // Check if this checkpoint is already completed
            const checkpointProgress = await storage.getCheckpointProgress(userId, checkpoint.id);
            const isCompleted = checkpointProgress.length > 0 && checkpointProgress[0].completed;
            
            if (!isCompleted) {
              availableCheckpoints.push({
                ...checkpoint,
                isAvailable: true,
                isCompleted: false,
                requiredLessons: requiredLessons,
                userCompletedLessons: completedCourseLessons.length,
                courseTitle: course.title,
                courseNumber: course.courseNumber
              });
            }
          }
        }
      }
      
      // Sort by course number and checkpoint number to show earliest available checkpoint first
      availableCheckpoints.sort((a, b) => {
        if (a.courseNumber !== b.courseNumber) {
          return a.courseNumber - b.courseNumber;
        }
        return a.checkpointNumber - b.checkpointNumber;
      });
      
      // Only return the first available checkpoint to avoid overwhelming the user
      const nextCheckpoint = availableCheckpoints.length > 0 ? [availableCheckpoints[0]] : [];
      
      res.json({
        availableCheckpoints: nextCheckpoint,
        totalCompletedLessons: completedLessons
      });
    } catch (error) {
      console.error("Error fetching available checkpoints:", error);
      res.status(500).json({ message: "Failed to fetch available checkpoints" });
    }
  });

  app.get('/api/checkpoint/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid checkpoint ID" });
      }
      
      const checkpoint = await storage.getCheckpoint(id);
      if (!checkpoint) {
        return res.status(404).json({ message: "Checkpoint not found" });
      }
      
      res.json(checkpoint);
    } catch (error) {
      console.error("Error fetching checkpoint:", error);
      res.status(500).json({ message: "Failed to fetch checkpoint" });
    }
  });

  app.post('/api/checkpoints', isAuthenticated, async (req: any, res) => {
    try {
      const checkpointData = insertCheckpointSchema.parse(req.body);
      const checkpoint = await storage.createCheckpoint(checkpointData);
      res.status(201).json(checkpoint);
    } catch (error) {
      console.error("Error creating checkpoint:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data provided",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to create checkpoint" });
    }
  });

  // Checkpoint progress routes
  app.get('/api/checkpoint-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const checkpointId = req.query.checkpointId ? parseInt(req.query.checkpointId as string) : undefined;
      
      const progress = await storage.getCheckpointProgress(userId, checkpointId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching checkpoint progress:", error);
      res.status(500).json({ message: "Failed to fetch checkpoint progress" });
    }
  });

  app.get('/api/checkpoint-progress/course/:courseId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const courseId = parseInt(req.params.courseId);
      
      if (isNaN(courseId)) {
        return res.status(400).json({ message: "Invalid course ID" });
      }
      
      const progress = await storage.getUserCheckpointProgress(userId, courseId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching user checkpoint progress:", error);
      res.status(500).json({ message: "Failed to fetch user checkpoint progress" });
    }
  });

  app.post('/api/checkpoint-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progressData = insertCheckpointProgressSchema.parse({
        ...req.body,
        userId
      });
      
      const progress = await storage.upsertCheckpointProgress(progressData);
      res.json(progress);
    } catch (error) {
      console.error("Error saving checkpoint progress:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data provided",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to save checkpoint progress" });
    }
  });

  // Analytics routes
  
  // Track page view
  app.post('/api/analytics/track', async (req, res) => {
    try {
      const pageViewData = insertPageViewSchema.parse({
        ...req.body,
        userId: req.user?.claims?.sub || req.user?.id || null, // Allow anonymous tracking
      });
      
      const pageView = await storage.trackPageView(pageViewData);
      res.json(pageView);
    } catch (error) {
      console.error("Error tracking page view:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid data provided",
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Failed to track page view" });
    }
  });

  // Get analytics data
  app.get('/api/analytics', async (req, res) => {
    try {
      const { period, page, startDate, endDate } = req.query;
      
      let start: Date | undefined;
      let end: Date | undefined;
      
      // Handle different time periods
      if (period === 'day') {
        start = new Date();
        start.setHours(0, 0, 0, 0);
        end = new Date();
        end.setHours(23, 59, 59, 999);
      } else if (period === 'week') {
        start = new Date();
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end = new Date();
      } else if (period === 'month') {
        start = new Date();
        start.setDate(start.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        end = new Date();
      } else if (startDate && endDate) {
        start = new Date(startDate as string);
        end = new Date(endDate as string);
      }
      
      const pageFilter = page as string || undefined;
      const pageViewsData = await storage.getPageViewsCount(start, end, pageFilter);
      const pageBreakdown = await storage.getPageViewsByPage(start, end);
      
      res.json({
        pageViews: pageViewsData,
        pageBreakdown: pageBreakdown,
        period: period || 'custom',
        filters: {
          page: pageFilter,
          startDate: start?.toISOString(),
          endDate: end?.toISOString()
        }
      });
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      res.status(500).json({ message: "Failed to fetch analytics data" });
    }
  });

  // Simple course structure viewer - shows lessons and reviews in sequence
  app.get('/api/admin/simple-course/:language/:courseNumber', async (req, res) => {
    try {
      const { language, courseNumber } = req.params;
      
      // Only support Italian for now
      if (language !== 'it') {
        return res.json({ items: [], message: `Simple viewer only supports Italian courses` });
      }

      // Get course from database instead of attached_assets
      const dbLanguage = await storage.getLanguageByCode('it'); // For Italian
      const skillLevel = await storage.getSkillLevelByCode('beginner');
      
      if (!dbLanguage || !skillLevel) {
        return res.json({ items: [], message: `Language or skill level not found in database` });
      }
      
      const coursesWithRelations = await storage.getCoursesWithRelations(dbLanguage.id, skillLevel.id);
      const course = coursesWithRelations.find(c => c.courseNumber === parseInt(courseNumber));
      
      if (!course) {
        return res.json({ items: [], message: `Course ${courseNumber} not found in database` });
      }
      
      // Get all lessons and checkpoints
      const items: Array<{
        id: string;
        type: 'lesson' | 'review';
        title: string;
        questions?: number;
      }> = [];
      
      // Add lessons
      course.lessons.forEach(lesson => {
        items.push({
          id: `lesson${lesson.lessonNumber}`,
          type: 'lesson',
          title: lesson.title
        });
      });
      
      // Add checkpoints/reviews
      course.checkpoints.forEach(checkpoint => {
        items.push({
          id: `review${checkpoint.checkpointNumber}`,
          type: 'review',
          title: checkpoint.title || `Review ${checkpoint.checkpointNumber}`,
          questions: checkpoint.questions?.length || 0
        });
      });
      
      // Sort to show lessons and reviews in natural order
      items.sort((a, b) => {
        // Extract numbers for proper sorting
        const numA = parseInt(a.id.replace(/[^0-9]/g, '')) || 999;
        const numB = parseInt(b.id.replace(/[^0-9]/g, '')) || 999;
        return numA - numB;
      });
      
      res.json({
        courseTitle: course.title,
        items: items
      });
    } catch (error) {
      console.error('Error fetching simple course structure:', error);
      res.json({ items: [], message: 'Error loading course' });
    }
  });

  // Auto-sync endpoint - synchronizes all JSON files from attached_assets to database (no auth required)
  app.post('/api/admin/sync-courses', async (req: any, res) => {
    try {
      
      const attachedAssetsPath = path.join(process.cwd(), 'attached_assets');
      
      if (!fs.existsSync(attachedAssetsPath)) {
        return res.status(404).json({ message: 'attached_assets directory not found' });
      }
      
      const jsonFiles = fs.readdirSync(attachedAssetsPath)
        .filter((file: string) => file.endsWith('.json'))
        .sort(); // Process in alphabetical order for consistency
      
      const syncResults: any[] = [];
      
      console.log(`🔄 Starting course sync from attached_assets. Found ${jsonFiles.length} JSON files.`);
      
      for (const fileName of jsonFiles) {
        try {
          const filePath = path.join(attachedAssetsPath, fileName);
          const courseData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
          
          // Determine language from filename patterns
          let languageCode = 'it'; // Default to Italian
          if (fileName.toLowerCase().includes('spanish')) {
            languageCode = 'es';
          } else if (fileName.toLowerCase().includes('german')) {
            languageCode = 'de';
          } else if (fileName.toLowerCase().includes('french')) {
            languageCode = 'fr';
          }
          
          // Import each course in the JSON file
          for (const courseKey of Object.keys(courseData)) {
            if (courseKey.startsWith('course')) {
              console.log(`📚 Syncing ${fileName} -> ${courseKey} (${languageCode})`);
              
              const singleCourseData = { [courseKey]: courseData[courseKey] };
              const importedCourse = await storage.importCourseFromJSON(languageCode, 'beginner', singleCourseData);
              
              syncResults.push({
                fileName,
                courseKey,
                languageCode,
                courseTitle: importedCourse.title,
                status: 'synced',
                lessons: courseData[courseKey].lessons ? Object.keys(courseData[courseKey].lessons).length : 0
              });
            }
          }
        } catch (error) {
          console.error(`❌ Error syncing ${fileName}:`, error);
          syncResults.push({
            fileName,
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      const successCount = syncResults.filter(r => r.status === 'synced').length;
      const errorCount = syncResults.filter(r => r.status === 'error').length;
      
      console.log(`✅ Course sync complete! ${successCount} courses synced, ${errorCount} errors.`);
      
      res.json({
        message: `Course sync complete! ${successCount} courses synced, ${errorCount} errors.`,
        results: syncResults,
        summary: {
          totalFiles: jsonFiles.length,
          coursesProcessed: successCount,
          errors: errorCount
        }
      });
    } catch (error) {
      console.error('Error in course sync:', error);
      res.status(500).json({ 
        message: 'Course sync failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Auto-sync endpoint - specific course sync from attached_assets (no auth required)
  app.post('/api/admin/sync-course/:fileName', async (req: any, res) => {
    try {
      const { fileName } = req.params;
      
      const filePath = path.join(process.cwd(), 'attached_assets', fileName);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: `File not found: ${fileName}` });
      }
      
      const courseData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      // Determine language from filename patterns
      let languageCode = 'it'; // Default to Italian
      if (fileName.toLowerCase().includes('spanish')) {
        languageCode = 'es';
      } else if (fileName.toLowerCase().includes('german')) {
        languageCode = 'de';
      } else if (fileName.toLowerCase().includes('french')) {
        languageCode = 'fr';
      }
      
      const syncResults: any[] = [];
      
      // Import each course in the JSON file
      for (const courseKey of Object.keys(courseData)) {
        if (courseKey.startsWith('course')) {
          console.log(`📚 Syncing ${fileName} -> ${courseKey} (${languageCode})`);
          
          const singleCourseData = { [courseKey]: courseData[courseKey] };
          const importedCourse = await storage.importCourseFromJSON(languageCode, 'beginner', singleCourseData);
          
          syncResults.push({
            courseKey,
            languageCode,
            courseTitle: importedCourse.title,
            status: 'synced',
            lessons: courseData[courseKey].lessons ? Object.keys(courseData[courseKey].lessons).length : 0
          });
        }
      }
      
      console.log(`✅ File ${fileName} synced successfully!`);
      
      res.json({
        message: `File ${fileName} synced successfully!`,
        fileName,
        results: syncResults
      });
    } catch (error) {
      console.error(`Error syncing file ${req.params.fileName}:`, error);
      res.status(500).json({ 
        message: 'File sync failed', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Admin route - get all courses organized by language and skill level
  app.get('/api/admin/courses', async (req: any, res) => {
    try {
      // Get all languages
      const languages = await storage.getLanguages();
      
      // Get all skill levels
      const skillLevels = await storage.getSkillLevels();
      
      // Get all courses with relations
      const courses = await storage.getCoursesWithRelations();
      
      // Organize courses by language and skill level
      const organizedData = languages.map(language => ({
        language: language,
        skillLevels: skillLevels.map(skillLevel => ({
          skillLevel: skillLevel,
          courses: courses.filter(course => 
            course.languageId === language.id && 
            course.skillLevelId === skillLevel.id
          ).sort((a, b) => a.courseNumber - b.courseNumber)
        })).filter(sl => sl.courses.length > 0) // Only include skill levels that have courses
      })).filter(lang => lang.skillLevels.length > 0); // Only include languages that have courses
      
      res.json(organizedData);
    } catch (error) {
      console.error("Error fetching admin courses data:", error);
      res.status(500).json({ message: "Failed to fetch admin courses data" });
    }
  });

  // Get course mapping for progress component - provides correct lesson counts including IRL and reviews
  app.get('/api/course-mapping/:languageCode', async (req, res) => {
    try {
      const { languageCode } = req.params;
      
      // Get language by code
      const language = await storage.getLanguageByCode(languageCode);
      if (!language) {
        return res.status(404).json({ message: `Language '${languageCode}' not found` });
      }
      
      // Get beginner skill level (assuming that's what we need for the learning path)
      const beginnerLevel = await storage.getSkillLevelByCode('beginner');
      if (!beginnerLevel) {
        return res.status(404).json({ message: "Beginner skill level not found" });
      }
      
      // Get courses with relations for this language and skill level
      const courses = await storage.getCoursesWithRelations(language.id, beginnerLevel.id);
      
      // Create the mapping in the format expected by the frontend
      const courseMapping = courses.map(course => {
        const lessonCount = course.lessons.length;
        const checkpointCount = course.checkpoints.length;
        const totalLessons = lessonCount + checkpointCount;
        
        // Define emojis for each course based on common patterns
        const emojiMap: { [key: string]: string } = {
          'Greetings': '👋',
          'Introducing Yourself': '🙋',
          'Essential Courtesy Phrases': '🙏',
          'Numbers': '🔢',
          'Time and Date': '⏰',
          'Days, Months, Seasons': '⏰',
          'Telling Time': '⏰',
          'Family and People': '👨‍👩‍👧‍👦',
          'Colors & Adjectives': '🎨',
          'Describing Things – Colors & Adjectives': '🎨',
          'Weather and Seasons': '🌤️',
          'Weather': '🌤️',
          'Food and Drinks': '🍝',
          'Food & Drink': '🍝',
          'Food and Drink': '🍝',
          'Directions and Places': '📍',
          'Shopping': '🛒',
          'Likes and Dislikes': '❤️',
          'Expressing Likes and Dislikes': '❤️',
          'Basic Grammar': '📚',
          'Basic Grammar Essentials': '📚',
          'Travel Basics': '✈️',
          'At a Restaurant': '🍽️',
          'Noun Gender & Articles': '📖',
          'Courtesy Phrases': '🙏'
        };
        
        return {
          courseId: `course${course.courseNumber}`,
          name: course.title,
          emoji: (emojiMap as any)[course.title] || '📚',
          level: 'A1',
          totalLessons,
          order: course.courseNumber
        };
      }).sort((a, b) => a.order - b.order);
      
      res.json(courseMapping);
    } catch (error) {
      console.error("Error fetching course mapping:", error);
      res.status(500).json({ message: "Failed to fetch course mapping" });
    }
  });

  // Admin route - get user metrics data
  app.get('/api/admin/user-metrics', async (req, res) => {
    try {
      // Get all users with their basic info
      const allUsers = await storage.getAllUsers();
      
      // For each user, get their progress data across all languages
      const userMetrics = await Promise.all(
        allUsers.map(async (user) => {
          const languages = ['italian', 'spanish', 'french', 'german'];
          const userProgressData = {};
          
          for (const language of languages) {
            const progress = await storage.getUserProgress(user.id, language);
            const stats = await storage.getUserStats(user.id, language);
            
            if (progress.length > 0 || stats) {
              const completedLessons = progress.filter(p => p.completed && p.completedAt);
              const latestProgress = completedLessons.length > 0 
                ? completedLessons[completedLessons.length - 1] 
                : null;
              
              userProgressData[language] = {
                lessonsCompleted: completedLessons.length,
                totalProgress: progress.length,
                currentCourse: latestProgress?.courseId || 'course1',
                currentLesson: latestProgress?.lessonId || 'lesson1',
                lastActivity: latestProgress?.completedAt || null,
                streak: stats?.streak || 0,
                wordsLearned: stats?.wordsLearned || 0
              };
            }
          }
          
          // Only include users who have some progress
          if (Object.keys(userProgressData).length > 0) {
            return {
              userId: user.id,
              email: user.email,
              firstName: user.firstName || 'Unknown',
              lastName: user.lastName || '',
              selectedLanguage: user.selectedLanguage || 'italian',
              progress: userProgressData,
              totalLanguagesStarted: Object.keys(userProgressData).length,
              overallLessonsCompleted: Object.values(userProgressData).reduce((sum: number, lang: any) => sum + lang.lessonsCompleted, 0),
              lastActivity: Math.max(...Object.values(userProgressData).map((lang: any) => lang.lastActivity ? new Date(lang.lastActivity).getTime() : 0)) || null
            };
          }
          return null;
        })
      );
      
      // Filter out null values and sort by last activity
      const activeUsers = userMetrics
        .filter(user => user !== null)
        .sort((a, b) => {
          if (!a.lastActivity && !b.lastActivity) return 0;
          if (!a.lastActivity) return 1;
          if (!b.lastActivity) return -1;
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
        });
      
      res.json({
        totalUsers: allUsers.length,
        activeUsers: activeUsers.length,
        users: activeUsers
      });
    } catch (error) {
      console.error("Error fetching user metrics:", error);
      res.status(500).json({ message: "Failed to fetch user metrics" });
    }
  });

  // Stripe webhook endpoint - Use raw body parser for webhook signature verification
  app.post('/api/webhooks/stripe', 
    (req, res, next) => {
      if (req.headers['content-type'] === 'application/json') {
        // Parse raw body for webhook signature verification
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', () => {
          (req as any).rawBody = body;
          next();
        });
      } else {
        next();
      }
    },
    async (req, res) => {
      const sig = req.headers['stripe-signature'];
      const rawBody = (req as any).rawBody;

      try {
        // Verify webhook signature - critical for security
        let event;
        try {
          if (!process.env.STRIPE_WEBHOOK_SECRET) {
            console.warn('⚠️ STRIPE_WEBHOOK_SECRET not configured - webhook verification disabled');
            event = JSON.parse(rawBody);
          } else {
            event = stripe.webhooks.constructEvent(rawBody, sig as string, process.env.STRIPE_WEBHOOK_SECRET);
          }
        } catch (err: any) {
          console.error('❌ Webhook signature verification failed:', err.message);
          return res.status(400).send(`Webhook Error: ${err.message}`);
        }

        console.log(`🎣 Received verified Stripe webhook: ${event.type}`);

        // Helper function to find user by customer ID efficiently
        const findUserByCustomerId = async (customerId: string) => {
          try {
            const allUsers = await storage.getAllUsers();
            return allUsers.find(u => u.stripeCustomerId === customerId);
          } catch (error) {
            console.error('Error finding user by customer ID:', error);
            return null;
          }
        };

        // Helper function to update user subscription status
        const updateUserTier = async (user: any, subscription: any) => {
          try {
            // Update user's subscription ID if needed
            if (subscription.id && user.stripeSubscriptionId !== subscription.id) {
              await storage.updateUserStripeSubscriptionId(user.id, subscription.id);
              console.log(`📝 Updated subscription ID for user ${user.id}: ${subscription.id}`);
            }
            
            // Determine tier based on subscription status
            const activeStatuses = ['active', 'trialing'];
            const inactiveStatuses = ['canceled', 'cancelled', 'unpaid', 'past_due', 'incomplete_expired'];
            
            if (activeStatuses.includes(subscription.status)) {
              await storage.updateUserPriceTier(user.id, 'pro-monthly');
              console.log(`✅ User ${user.id} upgraded to pro-monthly (status: ${subscription.status})`);
            } else if (inactiveStatuses.includes(subscription.status)) {
              await storage.updateUserPriceTier(user.id, 'n/a');
              console.log(`❌ User ${user.id} downgraded to free tier (status: ${subscription.status})`);
            } else {
              console.log(`ℹ️ No tier change for user ${user.id} with status: ${subscription.status}`);
            }
          } catch (error) {
            console.error(`Error updating user ${user.id} tier:`, error);
          }
        };

        switch (event.type) {
          case 'checkout.session.completed': {
            const session = event.data.object;
            console.log(`💳 Checkout session completed: ${session.id}`);
            
            // Handle subscription checkouts
            if (session.mode === 'subscription' && session.customer && session.subscription) {
              const user = await findUserByCustomerId(session.customer as string);
              
              if (user) {
                // Retrieve the full subscription object from Stripe
                try {
                  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
                  await updateUserTier(user, subscription);
                  console.log(`✅ Processed checkout.session.completed for user ${user.id}`);
                } catch (error) {
                  console.error('Error retrieving subscription from checkout session:', error);
                }
              } else {
                console.warn(`⚠️ No user found for customer ${session.customer} in checkout.session.completed`);
              }
            }
            break;
          }

          case 'customer.subscription.created':
          case 'customer.subscription.updated': {
            const subscription = event.data.object;
            console.log(`🔄 Subscription ${event.type}: ${subscription.id} (status: ${subscription.status})`);
            
            const user = await findUserByCustomerId(subscription.customer as string);
            
            if (user) {
              await updateUserTier(user, subscription);
              console.log(`✅ Processed ${event.type} for user ${user.id}`);
            } else {
              console.warn(`⚠️ No user found for customer ${subscription.customer} in ${event.type}`);
            }
            break;
          }

          case 'customer.subscription.deleted': {
            const subscription = event.data.object;
            console.log(`❌ Subscription deleted: ${subscription.id}`);
            
            const user = await findUserByCustomerId(subscription.customer as string);
            
            if (user) {
              await storage.updateUserPriceTier(user.id, 'n/a');
              console.log(`✅ User ${user.id} downgraded to free tier (subscription deleted)`);
            } else {
              console.warn(`⚠️ No user found for customer ${subscription.customer} in subscription.deleted`);
            }
            break;
          }

          case 'invoice.payment_succeeded': {
            const invoice = event.data.object;
            console.log(`💰 Invoice payment succeeded: ${invoice.id}`);
            
            // Handle subscription invoice payments
            if (invoice.subscription && invoice.customer) {
              const user = await findUserByCustomerId(invoice.customer as string);
              
              if (user) {
                try {
                  // Retrieve the subscription to get current status
                  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
                  await updateUserTier(user, subscription);
                  console.log(`✅ Processed invoice.payment_succeeded for user ${user.id}`);
                } catch (error) {
                  console.error('Error retrieving subscription from invoice:', error);
                }
              } else {
                console.warn(`⚠️ No user found for customer ${invoice.customer} in invoice.payment_succeeded`);
              }
            }
            break;
          }

          case 'invoice.payment_failed': {
            const invoice = event.data.object;
            console.log(`💸 Invoice payment failed: ${invoice.id}`);
            
            if (invoice.subscription && invoice.customer) {
              const user = await findUserByCustomerId(invoice.customer as string);
              
              if (user) {
                try {
                  // Retrieve subscription to check if it's past due
                  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
                  if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
                    await storage.updateUserPriceTier(user.id, 'n/a');
                    console.log(`❌ User ${user.id} downgraded due to payment failure`);
                  }
                } catch (error) {
                  console.error('Error handling failed payment:', error);
                }
              }
            }
            break;
          }

          default:
            console.log(`🤷 Unhandled webhook event type: ${event.type}`);
        }

        // Always respond with 200 for successful processing
        res.status(200).json({ received: true });
      } catch (error: any) {
        console.error('❌ Webhook processing error:', error);
        // Return 400 for processing errors so Stripe retries
        return res.status(400).send(`Webhook Error: ${error.message}`);
      }
    }
  );

  // Stripe subscription routes
  app.post('/api/create-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user already has an active subscription
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        if (subscription.status === 'active') {
          const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string, {
            expand: ['payment_intent']
          });
          
          return res.json({
            subscriptionId: subscription.id,
            clientSecret: (invoice.payment_intent as any)?.client_secret,
            status: subscription.status
          });
        }
      }
      
      if (!user.email) {
        return res.status(400).json({ message: 'No user email on file' });
      }

      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
        });
        customerId = customer.id;
        await storage.updateUserStripeCustomerId(userId, customerId);
      }

      // Create subscription with Pro Learner pricing
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price_data: {
            currency: 'gbp',
            product: process.env.PRODUCT_ID, // 'prod_T3gAKNxpv7izg3', // Your existing product ID
            unit_amount: 249, // £2.49 per month in pence
            recurring: {
              interval: 'month'
            }
          }
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with subscription ID
      await storage.updateUserStripeSubscriptionId(userId, subscription.id);

      const invoice = subscription.latest_invoice as any;
      res.json({
        subscriptionId: subscription.id,
        clientSecret: invoice.payment_intent?.client_secret,
        status: subscription.status
      });
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ message: 'Error creating subscription: ' + error.message });
    }
  });

  // Check subscription status
  app.get('/api/subscription-status', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeSubscriptionId) {
        console.log(`⚠️ User ${userId} has no subscription ID`);
        return res.json({ isProUser: false, status: 'no_subscription' });
      }

      console.log(`🔍 Checking subscription ${user.stripeSubscriptionId} for user ${userId}`);
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      const isProUser = subscription.status === 'active';
      
      console.log(`📊 Subscription status: ${subscription.status}, isProUser: ${isProUser}`);
      
      // Update user's price tier based on subscription status
      if (isProUser && (user.priceTier === 'n/a' || !user.priceTier)) {
        await storage.updateUserPriceTier(userId, 'pro-monthly');
        console.log(`✅ Updated user ${userId} to pro-monthly tier`);
      } else if (!isProUser && user.priceTier && user.priceTier.startsWith('pro-')) {
        await storage.updateUserPriceTier(userId, 'n/a');
        console.log(`❌ Downgraded user ${userId} to free tier`);
      }

      res.json({
        isProUser,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        subscriptionId: subscription.id
      });
    } catch (error: any) {
      console.error('❌ Error checking subscription status:', error);
      res.json({ isProUser: false, status: 'error', error: error.message });
    }
  });

  // Manual subscription refresh endpoint for debugging
  app.post('/api/refresh-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.stripeSubscriptionId) {
        return res.json({ 
          success: false, 
          message: 'No subscription found',
          user: { hasSubscriptionId: !!user?.stripeSubscriptionId }
        });
      }

      console.log(`🔄 Manual refresh for user ${userId}, subscription ${user.stripeSubscriptionId}`);
      
      // Force fetch from Stripe
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      console.log(`📊 Current subscription status: ${subscription.status}`);
      
      // Force update based on current status
      if (subscription.status === 'active') {
        await storage.updateUserPriceTier(userId, 'pro-monthly');
        console.log(`✅ Force updated user ${userId} to pro-monthly`);
      }
      
      res.json({ 
        success: true, 
        subscriptionStatus: subscription.status,
        isActive: subscription.status === 'active',
        updated: subscription.status === 'active'
      });
    } catch (error: any) {
      console.error('❌ Error refreshing subscription:', error);
      res.json({ success: false, error: error.message });
    }
  });

  // ===== ADMIN UPLOAD ROUTES (from blueprint:javascript_object_storage) =====
  // Admin check middleware
  const isAdmin = async (req: any, res: any, next: any) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    // Add your admin check logic here if needed
    next();
  };

  // Get presigned URL for video upload
  app.post('/api/admin/videos/upload-url', isAdmin, async (req: any, res) => {
    try {
      const { filename } = req.body;
      if (!filename) {
        return res.status(400).json({ error: 'Filename is required' });
      }

      const objectStorageService = new ObjectStorageService();
      const result = await objectStorageService.getVideoUploadURL(filename);
      
      // Return both the upload URL and the object path for later reference
      const objectPath = objectStorageService.normalizeObjectPath(result);
      res.json({ uploadURL: result, objectPath });
    } catch (error: any) {
      console.error('Error generating video upload URL:', error);
      res.status(500).json({ error: 'Failed to generate upload URL: ' + error.message });
    }
  });

  // Save video upload metadata as draft
  app.post('/api/admin/videos/draft', isAdmin, async (req: any, res) => {
    try {
      const { fileName, objectPath, fileSize, languageId, courseId, lessonNumber, stepNumber } = req.body;
      const userId = req.user.claims.sub;

      if (!objectPath) {
        return res.status(400).json({ error: 'Object path is required' });
      }

      const draft = await storage.createDraftUpload({
        uploadType: 'video',
        fileName,
        fileUrl: objectPath, // Store the object path, not the presigned URL
        fileSize,
        metadata: { languageId, courseId, lessonNumber, stepNumber },
        uploadedBy: userId,
        status: 'draft',
      });

      res.json(draft);
    } catch (error: any) {
      console.error('Error saving video draft:', error);
      res.status(500).json({ error: 'Failed to save video draft: ' + error.message });
    }
  });

  // Get presigned URL for JSON upload
  app.post('/api/admin/json/upload-url', isAdmin, async (req: any, res) => {
    try {
      const { filename } = req.body;
      if (!filename) {
        return res.status(400).json({ error: 'Filename is required' });
      }

      const objectStorageService = new ObjectStorageService();
      const result = await objectStorageService.getJSONUploadURL(filename);
      
      // Return both the upload URL and the object path for later reference
      const objectPath = objectStorageService.normalizeObjectPath(result);
      res.json({ uploadURL: result, objectPath });
    } catch (error: any) {
      console.error('Error generating JSON upload URL:', error);
      res.status(500).json({ error: 'Failed to generate upload URL: ' + error.message });
    }
  });

  // Parse and save JSON upload as draft
  app.post('/api/admin/json/draft', isAdmin, async (req: any, res) => {
    try {
      const { fileName, objectPath, jsonContent } = req.body;
      const userId = req.user.claims.sub;

      if (!objectPath) {
        return res.status(400).json({ error: 'Object path is required' });
      }

      // Extract metadata from new JSON format
      const languageCode = jsonContent.language_code;
      const skillLevelCode = jsonContent.skill_level_code;
      
      // Find course key (course1, course2, etc.)
      const courseKey = Object.keys(jsonContent).find(k => k.startsWith('course'));
      if (!courseKey) {
        return res.status(400).json({ error: 'No course found in JSON (expected course1, course2, etc.)' });
      }
      
      const courseNumber = parseInt(courseKey.replace('course', ''));
      const courseData = jsonContent[courseKey];
      const lessons = courseData.lessons || {};
      
      // Count lessons and identify video requirements
      const lessonKeys = Object.keys(lessons).filter(k => k.startsWith('lesson'));
      const videoRequirements = [];
      
      for (const lessonKey of lessonKeys) {
        const lesson = lessons[lessonKey];
        const lessonNumber = parseInt(lessonKey.replace('lesson', ''));
        
        if (lesson.step4) {
          const step4 = lesson.step4;
          const videoType = step4.type === 'video_choice' ? 'video_choice' : 'video';
          
          if (videoType === 'video_choice' && step4.options) {
            // Multiple videos needed for video_choice
            videoRequirements.push({
              lessonNumber,
              lessonTitle: lesson.title,
              stepNumber: 4,
              videoType: 'video_choice',
              videosNeeded: step4.options.map((opt: any) => ({
                label: opt.label,
                videoUrl: opt.video_url
              }))
            });
          } else if (videoType === 'video' && step4.video_url) {
            // Single video needed
            videoRequirements.push({
              lessonNumber,
              lessonTitle: lesson.title,
              stepNumber: 4,
              videoType: 'video',
              videosNeeded: [{ videoUrl: step4.video_url }]
            });
          }
        }
      }

      const metadata = {
        languageCode,
        skillLevelCode,
        courseNumber,
        courseKey,
        courseTitle: courseData.title,
        courseDescription: courseData.description,
        lessonCount: lessonKeys.length,
        videoRequirements,
        videosUploaded: 0,
        videosRequired: videoRequirements.reduce((sum, req) => sum + req.videosNeeded.length, 0),
        preview: {
          title: courseData.title,
          description: courseData.description,
          totalLessons: lessonKeys.length,
          language: languageCode,
          skillLevel: skillLevelCode,
          courseNumber,
          videosRequired: videoRequirements.reduce((sum, req) => sum + req.videosNeeded.length, 0),
        }
      };

      const draft = await storage.createDraftUpload({
        uploadType: 'json',
        fileName,
        fileUrl: objectPath,
        fileSize: JSON.stringify(jsonContent).length,
        metadata,
        uploadedBy: userId,
        status: 'draft',
      });

      res.json({ draft, preview: metadata.preview });
    } catch (error: any) {
      console.error('Error saving JSON draft:', error);
      res.status(500).json({ error: 'Failed to save JSON draft: ' + error.message });
    }
  });

  // Get all draft uploads
  app.get('/api/admin/drafts', isAdmin, async (req: any, res) => {
    try {
      const { type } = req.query;
      const drafts = await storage.getDraftUploads(type as 'video' | 'json' | undefined);
      res.json(drafts);
    } catch (error: any) {
      console.error('Error fetching drafts:', error);
      res.status(500).json({ error: 'Failed to fetch drafts: ' + error.message });
    }
  });

  // Publish a video draft
  app.post('/api/admin/videos/:id/publish', isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const draft = await storage.getDraftUpload(parseInt(id));

      if (!draft || draft.uploadType !== 'video') {
        return res.status(404).json({ error: 'Video draft not found' });
      }

      const metadata = draft.metadata as any;
      const { languageId, courseId, lessonNumber, stepNumber } = metadata;

      // Find the lesson and step
      const lessons = await storage.getLessons(courseId);
      const lesson = lessons.find(l => l.lessonNumber === lessonNumber);
      
      if (!lesson) {
        return res.status(404).json({ error: 'Lesson not found' });
      }

      const steps = await storage.getLessonSteps(lesson.id);
      const step = steps.find(s => s.stepNumber === stepNumber);

      if (!step) {
        return res.status(404).json({ error: 'Step not found' });
      }

      // Get public URL for the video
      const objectStorageService = new ObjectStorageService();
      const videoUrl = await objectStorageService.getPublicVideoURL(draft.fileUrl);

      // Update the step content with the video URL
      const updatedContent = {
        ...(step.content as any),
        video_url: videoUrl,
      };

      await storage.updateLessonStep(step.id, {
        content: updatedContent,
      });

      // Mark draft as published
      await storage.updateDraftUpload(parseInt(id), {
        status: 'published',
        publishedAt: new Date(),
      });

      res.json({ success: true, message: 'Video published successfully', videoUrl });
    } catch (error: any) {
      console.error('Error publishing video:', error);
      
      // Mark draft as failed with error message
      try {
        await storage.updateDraftUpload(parseInt(req.params.id), {
          status: 'failed',
          errorMessage: error.message,
        });
      } catch (updateError) {
        console.error('Error updating draft status:', updateError);
      }

      res.status(500).json({ error: 'Failed to publish video: ' + error.message });
    }
  });

  // Publish a JSON draft
  app.post('/api/admin/json/:id/publish', isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { languageCode, skillLevelCode } = req.body;

      if (!languageCode || !skillLevelCode) {
        return res.status(400).json({ error: 'languageCode and skillLevelCode are required' });
      }

      const draft = await storage.getDraftUpload(parseInt(id));

      if (!draft || draft.uploadType !== 'json') {
        return res.status(404).json({ error: 'JSON draft not found' });
      }

      // Fetch the JSON content from the stored URL
      // For now, we expect it to be passed in the request
      const { jsonContent } = req.body;
      
      if (!jsonContent) {
        return res.status(400).json({ error: 'jsonContent is required in request body' });
      }

      // Import the course from JSON
      const course = await storage.importCourseFromJSON(languageCode, skillLevelCode, jsonContent);

      // Mark draft as published
      await storage.updateDraftUpload(parseInt(id), {
        status: 'published',
        publishedAt: new Date(),
      });

      res.json({ 
        success: true, 
        message: 'Course imported successfully', 
        course 
      });
    } catch (error: any) {
      console.error('Error publishing JSON:', error);
      
      // Mark draft as failed with error message
      try {
        await storage.updateDraftUpload(parseInt(req.params.id), {
          status: 'failed',
          errorMessage: error.message,
        });
      } catch (updateError) {
        console.error('Error updating draft status:', updateError);
      }

      res.status(500).json({ error: 'Failed to publish JSON: ' + error.message });
    }
  });

  // Delete a draft
  app.delete('/api/admin/drafts/:id', isAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteDraftUpload(parseInt(id));
      res.json({ success: true, message: 'Draft deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting draft:', error);
      res.status(500).json({ error: 'Failed to delete draft: ' + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
