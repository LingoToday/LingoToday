import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupOAuthStrategies, setupOAuthRoutes } from './googleAuth';
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
          let courseFileName: string;
          
          if (language === 'italian') {
            courseFileName = `${progressItem.courseId}.json`;
          } else if (language === 'spanish') {
            courseFileName = `spanish_${progressItem.courseId}.json`;
          } else if (language === 'german') {
            courseFileName = `german_${progressItem.courseId}.json`;
          } else if (language === 'french') {
            courseFileName = `french_${progressItem.courseId}.json`;
          } else {
            continue; // Skip unsupported languages
          }
          
          const coursePath = path.join(process.cwd(), 'server', courseFileName);
          
          if (fs.existsSync(coursePath)) {
            const courseData = JSON.parse(fs.readFileSync(coursePath, 'utf-8'));
            const course = courseData[progressItem.courseId];
            
            if (course && course.lessons[progressItem.lessonId]) {
              const lesson = course.lessons[progressItem.lessonId];
              let targetPhrase: string | undefined;
              
              // Get the appropriate language phrase
              if (language === 'italian') {
                targetPhrase = lesson.step1?.italian;
              } else if (language === 'spanish') {
                targetPhrase = lesson.step1?.spanish;
              } else if (language === 'german') {
                targetPhrase = lesson.step1?.german;
              } else if (language === 'french') {
                targetPhrase = lesson.step1?.french;
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
      
      // Enrich progress data with actual lesson content
      const enrichedProgress = await Promise.all(
        progress.map(async (progressItem) => {
          try {
            let courseFileName: string;
            let languagePhrase: string | undefined;
            
            if (language === 'italian') {
              courseFileName = `${progressItem.courseId}.json`;
            } else if (language === 'spanish') {
              courseFileName = `spanish_${progressItem.courseId}.json`;
            } else if (language === 'german') {
              courseFileName = `german_${progressItem.courseId}.json`;
            } else if (language === 'french') {
              courseFileName = `french_${progressItem.courseId}.json`;
            } else {
              return progressItem; // Unsupported language
            }
            
            const coursePath = path.join(process.cwd(), 'server', courseFileName);
            
            if (fs.existsSync(coursePath)) {
              const courseData = JSON.parse(fs.readFileSync(coursePath, 'utf-8'));
              const course = courseData[progressItem.courseId];
              
              if (course && course.lessons[progressItem.lessonId]) {
                const lesson = course.lessons[progressItem.lessonId];
                
                // Get the appropriate language phrase
                if (language === 'italian') {
                  languagePhrase = lesson.step1?.italian;
                } else if (language === 'spanish') {
                  languagePhrase = lesson.step1?.spanish;
                } else if (language === 'german') {
                  languagePhrase = lesson.step1?.german;
                } else if (language === 'french') {
                  languagePhrase = lesson.step1?.french;
                }
                
                return {
                  ...progressItem,
                  lessonTitle: lesson.title,
                  targetPhrase: languagePhrase, // Generic field for target language phrase
                  spanishPhrase: lesson.step1?.spanish, // Specific field for Spanish
                  italianPhrase: lesson.step1?.italian, // Specific field for Italian
                  germanPhrase: lesson.step1?.german,   // Specific field for German
                  frenchPhrase: lesson.step1?.french,   // Specific field for French
                  englishTranslation: lesson.step1?.english,
                  courseTitle: course.title
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

      // Get the actual lesson data
      let courseFileName: string;
      
      if (language === 'italian') {
        courseFileName = `${nextLesson.courseId}.json`;
      } else if (language === 'spanish') {
        courseFileName = `spanish_${nextLesson.courseId}.json`;
      } else if (language === 'german') {
        courseFileName = `german_${nextLesson.courseId}.json`;
      } else if (language === 'french') {
        courseFileName = `french_${nextLesson.courseId}.json`;
      } else {
        // Fallback for unsupported languages
        return res.json({
          courseId: nextLesson.courseId,
          lessonId: nextLesson.lessonId,
          title: `${nextLesson.courseId} - ${nextLesson.lessonId}`,
          description: "Continue your language learning journey"
        });
      }

      const coursePath = path.join(process.cwd(), 'server', courseFileName);
      if (fs.existsSync(coursePath)) {
        const courseData = JSON.parse(fs.readFileSync(coursePath, 'utf-8'));
        const course = courseData[nextLesson.courseId];
        
        if (course && course.lessons[nextLesson.lessonId]) {
          const lesson = course.lessons[nextLesson.lessonId];
          
          // Get the appropriate language phrase for notification
          let targetPhrase: string | undefined;
          if (language === 'italian') {
            targetPhrase = lesson.step1?.italian;
          } else if (language === 'spanish') {
            targetPhrase = lesson.step1?.spanish;
          } else if (language === 'german') {
            targetPhrase = lesson.step1?.german;
          } else if (language === 'french') {
            targetPhrase = lesson.step1?.french;
          }
          
          return res.json({
            courseId: nextLesson.courseId,
            lessonId: nextLesson.lessonId,
            title: lesson.title,
            targetPhrase: targetPhrase, // The actual phrase in the target language
            notificationText: targetPhrase || lesson.title, // Phrase to use in notifications
            description: lesson.description || course.description,
            courseTitle: course.title,
          });
        }
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
      const userId = req.user.claims?.sub || req.user.id;
      const existingSettings = await storage.getUserSettings(userId);
      
      const settingsData = {
        userId,
        language: existingSettings?.language || "italian",
        theme: existingSettings?.theme || "light",
        soundEnabled: existingSettings?.soundEnabled ?? true,
        notificationsEnabled: req.body.notificationsEnabled ?? (existingSettings?.notificationsEnabled ?? false),
        notificationFrequency: req.body.notificationFrequency ?? (existingSettings?.notificationFrequency ?? 15),
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
        
        // Convert to expected format
        const lessonData: any = {
          title: lesson.title
        };
        
        lesson.steps.forEach(step => {
          lessonData[`step${step.stepNumber}`] = step.content;
        });
        
        res.json({
          courseId: nextLesson.courseId,
          courseTitle: course.title,
          courseDescription: course.description,
          lessonId: nextLesson.lessonId,
          lesson: lessonData
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
        // Use course structure from server course*.json files for all supported languages
        const courseOrder = ['course1', 'course2', 'course3', 'course4', 'course5', 'course6', 'course7', 'course8', 'course9', 'course10', 'course11', 'course12', 'course13'];
        const allLessons: any[] = [];
        
        for (const courseId of courseOrder) {
          // Use language-specific course files
          let coursePath;
          if (language === 'spanish') {
            coursePath = path.join(process.cwd(), 'server', `spanish_${courseId}.json`);
          } else {
            coursePath = path.join(process.cwd(), 'server', `${courseId}.json`);
          }
          
          if (fs.existsSync(coursePath)) {
            const courseData = JSON.parse(fs.readFileSync(coursePath, 'utf-8'));
            const course = courseData[courseId];
            
            if (course && course.lessons) {
              // Properly order lessons and reviews for all languages
              const allKeys = Object.keys(course.lessons);
              const lessons = allKeys.filter(key => key.startsWith('lesson')).sort((a, b) => {
                const numA = parseInt(a.replace('lesson', ''));
                const numB = parseInt(b.replace('lesson', ''));
                return numA - numB;
              });
              const reviews = allKeys.filter(key => key.startsWith('review')).sort((a, b) => {
                const numA = parseInt(a.replace('review', '')) || 999;
                const numB = parseInt(b.replace('review', '')) || 999;
                return numA - numB;
              });
              
              // Interleave lessons and reviews: lesson1-4, review1, lesson5-8, review2, etc.
              let lessonIds = [];
              let lessonIndex = 0;
              let reviewIndex = 0;
              
              while (lessonIndex < lessons.length || reviewIndex < reviews.length) {
                // Add up to 4 lessons
                for (let i = 0; i < 4 && lessonIndex < lessons.length; i++) {
                  lessonIds.push(lessons[lessonIndex++]);
                }
                
                // Add review if available
                if (reviewIndex < reviews.length && lessonIndex % 4 === 0) {
                  lessonIds.push(reviews[reviewIndex++]);
                }
              }
              
              // Add each lesson/review to the list
              lessonIds.forEach(lessonId => {
                const lesson = course.lessons[lessonId];
                
                // Handle review sections differently
                if (lessonId.startsWith('review')) {
                  allLessons.push({
                    courseId: courseId,
                    lessonId: lessonId,
                    title: lesson.title || `Review ${lessonId.replace('review', '')}`,
                    description: lesson.title || `Review section`,
                    courseTitle: course.title,
                    category: course.title,
                    englishTitle: lesson.title || `Review ${lessonId.replace('review', '')}`,
                    targetPhrase: lesson.title,
                    englishTranslation: lesson.title,
                    isReview: true
                  });
                } else {
                  // Regular lesson
                  allLessons.push({
                    courseId: courseId,
                    lessonId: lessonId,
                    title: lesson.step1?.[language] || lesson.title, // Use target language phrase as title, fallback to English
                    description: lesson.title, // Use English title as description
                    courseTitle: course.title,
                    category: course.title,
                    englishTitle: lesson.title,
                    targetPhrase: lesson.step1?.[language],
                    englishTranslation: lesson.step1?.english,
                    isReview: false
                  });
                }
              });
            }
          }
        }

        // Filter out completed lessons
        const completedLessonIds = new Set(
          userProgress.map((p: any) => `${p.courseId}-${p.lessonId}`)
        );

        upcomingLessons = allLessons
          .filter(lesson => !completedLessonIds.has(`${lesson.courseId}-${lesson.lessonId}`))
          .slice(0, 5);
      } else {
        // Fallback to lessons.json structure
        const lessonsPath = path.join(process.cwd(), 'server', 'lessons.json');
        
        if (fs.existsSync(lessonsPath)) {
          const lessonsData = JSON.parse(fs.readFileSync(lessonsPath, 'utf-8'));
          const languageLessons = lessonsData[language];

          if (languageLessons) {
            const allLessons: any[] = [];
            
            Object.keys(languageLessons).sort().forEach(weekKey => {
              const weekData = languageLessons[weekKey];
              Object.keys(weekData).sort().forEach(dayKey => {
                const lesson = weekData[dayKey];
                allLessons.push({
                  courseId: weekKey,
                  lessonId: dayKey,
                  title: lesson.title,
                  description: `Week ${weekKey.replace('week_', '')}, Day ${dayKey.replace('day_', '')}`,
                  courseTitle: lesson.title,
                  category: 'General',
                  vocabulary: lesson.vocabulary
                });
              });
            });

            // Filter completed lessons and get next 5
            const completedLessonIds = new Set(
              userProgress.map((p: any) => `${p.courseId}-${p.lessonId}`)
            );

            upcomingLessons = allLessons
              .filter(lesson => !completedLessonIds.has(`${lesson.courseId}-${lesson.lessonId}`))
              .slice(0, 5);
          }
        }
      }

      res.json(upcomingLessons);
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
        
        // Calculate words learned from this lesson
        let newWordsLearned = stats?.wordsLearned || 0;
        if (progressData.language === 'italian') {
          try {
            const courseFileName = `${progressData.courseId}.json`;
            const coursePath = path.join(process.cwd(), 'server', courseFileName);
            
            if (fs.existsSync(coursePath)) {
              const courseData = JSON.parse(fs.readFileSync(coursePath, 'utf-8'));
              const course = courseData[progressData.courseId];
              
              if (course && course.lessons[progressData.lessonId]) {
                const lesson = course.lessons[progressData.lessonId];
                const italianPhrase = lesson.step1?.italian;
                
                if (italianPhrase) {
                  // Count unique words (split by spaces and punctuation)
                  const words = italianPhrase.toLowerCase()
                    .replace(/[!?.,:;"']/g, '') // Remove punctuation
                    .split(/\s+/) // Split by whitespace
                    .filter((word: string) => word.length > 0); // Remove empty strings
                  
                  newWordsLearned += words.length;
                }
              }
            }
          } catch (error) {
            console.error(`Error counting words for ${progressData.courseId}/${progressData.lessonId}:`, error);
          }
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
      res.json(steps);
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
        // Fallback to old lessons structure for other languages
        const coursesPath = path.join(process.cwd(), 'server', 'lessons.json');
        
        if (!fs.existsSync(coursesPath)) {
          return res.status(404).json({ message: "Courses file not found" });
        }
        
        const coursesData = JSON.parse(fs.readFileSync(coursesPath, 'utf-8'));
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
      
      if (['italian', 'spanish', 'french', 'german'].includes(language)) {
        // Use language-specific course files or fallback to generic files
        let courseFileName = language === 'italian' ? `${courseId}.json` : `${language}_${courseId}.json`;
        let coursePath = path.join(process.cwd(), 'server', courseFileName);
        
        // Fallback to generic course file if language-specific doesn't exist
        if (!fs.existsSync(coursePath)) {
          courseFileName = `${courseId}.json`;
          coursePath = path.join(process.cwd(), 'server', courseFileName);
        }
        
        if (!fs.existsSync(coursePath)) {
          return res.status(404).json({ message: `Course file not found: ${courseFileName}` });
        }
        
        const courseData = JSON.parse(fs.readFileSync(coursePath, 'utf-8'));
        const course = courseData[courseId];
        
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
        // Fallback to file-based system for other languages
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
        storage.getUserStats(userId, settings.selectedLanguage),
        storage.getUserProgress(userId, settings.selectedLanguage),
        storage.getLatestProgress(userId, settings.selectedLanguage),
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
      
      const updatedUser = await storage.upsertUser({
        id: userId,
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
  app.get('/api/checkpoint/:checkpointNumber', async (req, res) => {
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

  // Check if user should see checkpoint reviews based on completed lessons
  app.get('/api/available-checkpoints', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims?.sub || req.user.id;
      const user = await storage.getUser(userId);
      const language = user?.selectedLanguage || 'italian';
      
      // Get user progress
      const userProgress = await storage.getUserProgress(userId, language);
      const completedLessons = userProgress.filter((p: any) => p.completed).length;
      
      // Get all checkpoints
      const allCheckpoints = await storage.getAllCheckpoints();
      
      // Determine which checkpoints should be available
      const availableCheckpoints = [];
      
      // Show checkpoint after every 4 lessons completed
      const checkpointIntervals = [4, 8, 12, 16, 20]; // Add more as needed
      
      // Only show the NEXT checkpoint that the user is eligible for but hasn't completed yet
      // This prevents showing all past checkpoints repeatedly
      for (const interval of checkpointIntervals) {
        if (completedLessons >= interval) {
          // Find the appropriate checkpoint for this interval
          const checkpointNumber = Math.ceil(interval / 4);
          const checkpoint = allCheckpoints.find(c => c.checkpointNumber === checkpointNumber);
          
          // Only proceed if the checkpoint actually exists in the database
          if (checkpoint) {
            // Check if user has already completed this checkpoint
            const checkpointProgressList = await storage.getCheckpointProgress(userId, checkpoint.id);
            const isCompleted = checkpointProgressList.length > 0 && checkpointProgressList[0].completed;
            
            // Only add this checkpoint if it's not completed
            if (!isCompleted) {
              availableCheckpoints.push({
                ...checkpoint,
                isAvailable: true,
                isCompleted: false,
                requiredLessons: interval,
                userCompletedLessons: completedLessons
              });
              
              // Only show ONE checkpoint at a time - the earliest incomplete one
              break;
            }
          } else {
            console.log(`⚠️ Checkpoint ${checkpointNumber} doesn't exist for interval ${interval}, skipping`);
          }
        }
      }
      
      res.json({
        availableCheckpoints,
        totalCompletedLessons: completedLessons,
        nextCheckpointAt: checkpointIntervals.find(interval => completedLessons < interval) || null
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
  app.get('/api/analytics', isAuthenticated, async (req, res) => {
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
  app.get('/api/admin/simple-course/:language/:courseNumber', isAuthenticated, async (req, res) => {
    try {
      const { language, courseNumber } = req.params;
      
      // Only support Italian for now
      if (language !== 'it') {
        return res.json({ items: [], message: `Simple viewer only supports Italian courses` });
      }

      // Map Italian course numbers to filenames
      const italianCourseFiles: { [key: string]: string } = {
        '1': 'Italian_course1_greetings_with_inline_reviews_1756914297318.json',
        '2': 'italian_course2_introductions_with_inline_reviews_1756914297319.json',
        '3': 'italian_course3_essential_courtesy_with_inline_reviews_q4_1756914955271.json',
        '4': 'italian_course4_numbers_with_inline_reviews_full_cleaned_v2_1756914955272.json',
        '5': 'italian_course5_time_date_with_inline_reviews_q4_1756924425578.json',
        '6': 'italian_course6_travel_basics_with_inline_reviews_q4_1756895270936.json',
        '7': 'italian_course7_describing_things_with_inline_reviews_q4_1756896700949.json',
        '8': 'italian_course8_weather_and_seasons_with_inline_reviews_q4_1756898173198.json',
        '9': 'italian_course9_food_and_drinks_with_inline_reviews_q4_v2_1756898433747.json',
        '10': 'italian_course10_directions_and_places_with_inline_reviews_q4_1756899105692.json',
        '11': 'Italian_beginner_course11_shopping_full_1755080022546.json',
        '12': 'Italian_beginner_course12_expressing_likes_dislikes_full_1755080022546.json',
        '13': 'Italian_beginner_course13_basic_grammar_essentials_full_1755080022546.json'
      };
      
      const courseFileName = italianCourseFiles[courseNumber];
      if (!courseFileName) {
        return res.json({ items: [], message: `Course ${courseNumber} not found` });
      }
      
      const coursePath = path.join(process.cwd(), 'attached_assets', courseFileName);
      if (!fs.existsSync(coursePath)) {
        return res.json({ items: [], message: `Course file not found` });
      }
      
      const courseData = JSON.parse(fs.readFileSync(coursePath, 'utf-8'));
      const courseKey = `course${courseNumber}`;
      const course = courseData[courseKey];
      
      if (!course?.lessons) {
        return res.json({ items: [], message: `Course structure not found` });
      }
      
      // Get all lesson and review keys
      const allKeys = Object.keys(course.lessons);
      const items = allKeys.map(key => ({
        id: key,
        type: key.startsWith('lesson') ? 'lesson' : 'review',
        title: course.lessons[key].title || key,
        questions: key.startsWith('review') ? (course.lessons[key].questions?.length || 0) : undefined
      }));
      
      // Sort to show lessons and reviews in natural order
      items.sort((a, b) => {
        if (a.type !== b.type) {
          // If mixing lessons and reviews, sort by their natural order in the course
          return a.id.localeCompare(b.id);
        }
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

  // Admin route - get all courses organized by language and skill level
  app.get('/api/admin/courses', isAuthenticated, async (req: any, res) => {
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

  const httpServer = createServer(app);
  return httpServer;
}
