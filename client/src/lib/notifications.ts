// Notification system for language learning reminders

let notificationInterval: NodeJS.Timeout | null = null;
let healthCheckInterval: NodeJS.Timeout | null = null;

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.error("Notifications not supported by browser");
    return "denied";
  }

  if (Notification.permission === "default") {
    const permission = await Notification.requestPermission();
    console.log("Notification permission result:", permission);
    return permission;
  }

  return Notification.permission;
}

// Start daily learning session 
export function startDailySession(language: string, intervalMinutes: number = 15) {
  console.log(`🌅 Starting daily learning session for ${language}`);
  
  // Stop any existing notifications first
  stopNotifications();
  
  const intervalMs = intervalMinutes * 60 * 1000;
  
  // Mark session as started for today
  const today = new Date().toDateString();
  localStorage.setItem('sessionStartedToday', today);
  localStorage.setItem('sessionLanguage', language);
  localStorage.setItem('sessionInterval', intervalMinutes.toString());
  
  // First notification after 10 seconds to start the session
  setTimeout(() => {
    console.log(`🚀 Starting daily session with first lesson for ${language}`);
    showLearningNotification(language);
  }, 10000); // 10 seconds initial delay
  
  // Then set up regular interval for the rest of the day
  notificationInterval = setInterval(() => {
    console.log(`⏰ Daily session interval triggered - firing notification for ${language}`);
    showLearningNotification(language);
  }, intervalMs);
  
  // Start health check to ensure notifications keep running
  startNotificationHealthCheck();
  
  console.log(`✅ Daily session started: first lesson in 10 seconds, then every ${intervalMinutes} minutes`);
}

// Check if session is already started today
export function isSessionStartedToday(): boolean {
  const today = new Date().toDateString();
  const sessionStarted = localStorage.getItem('sessionStartedToday');
  return sessionStarted === today;
}

// Legacy function for backwards compatibility - now does nothing unless session started
export function scheduleNotification(language: string, intervalMinutes: number) {
  console.log(`⚠️ Legacy notification schedule called - session must be started manually`);
  
  // Check actual notification permission
  if ('Notification' in window) {
    console.log(`🔍 Browser notification permission: ${Notification.permission}`);
  } else {
    console.log(`❌ Notifications not supported in this browser`);
  }
  
  // Only auto-start if session was already started today (for page refreshes)
  if (isSessionStartedToday()) {
    console.log(`📱 Recovering session from page refresh...`);
    const sessionLanguage = localStorage.getItem('sessionLanguage') || language;
    const sessionInterval = parseInt(localStorage.getItem('sessionInterval') || intervalMinutes.toString());
    startDailySession(sessionLanguage, sessionInterval);
  } else {
    console.log(`🛑 No session active - user must click 'Start today's lessons'`);
  }
}

// Stop all scheduled notifications
export function stopNotifications() {
  console.log("🛑 Stopping all notifications and intervals");
  
  if (notificationInterval) {
    console.log("🛑 Clearing main notification interval");
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
  
  if (healthCheckInterval) {
    console.log("🛑 Clearing health check interval");
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
  }
  
  // Force clear any lingering intervals (browser-specific cleanup)
  try {
    // Clear a range of possible interval IDs
    for (let i = 1; i <= 1000; i++) {
      clearTimeout(i);
      clearInterval(i);
    }
    console.log(`🧹 Aggressively cleared timeout/interval IDs 1-1000`);
  } catch (error) {
    console.log("⚠️ Interval cleanup completed with minor issues");
  }
  
  // Clear recovery data when explicitly stopping
  localStorage.removeItem('lastScheduleTime');
  localStorage.removeItem('scheduledLanguage');
  localStorage.removeItem('scheduledInterval');
}

// Start health check to ensure notifications stay running
function startNotificationHealthCheck() {
  // Clear any existing health check
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
  }
  
  console.log("🩺 Starting notification health check (every 10 minutes)");
  
  // Check every 10 minutes (less aggressive)
  healthCheckInterval = setInterval(() => {
    const settings = loadNotificationSettings();
    const lastScheduleTime = localStorage.getItem('lastScheduleTime');
    const timeSinceSchedule = lastScheduleTime ? Date.now() - parseInt(lastScheduleTime) : 0;
    
    console.log("🩺 Health check running:", {
      hasSettings: !!settings,
      enabled: settings?.enabled,
      permission: Notification.permission,
      hasInterval: !!notificationInterval,
      timeSinceSchedule: Math.round(timeSinceSchedule / 1000 / 60) + " minutes"
    });
    
    if (settings && settings.enabled && Notification.permission === "granted" && !notificationInterval) {
      console.log("🩺 Health check: notifications should be running but aren't - recovering");
      scheduleNotification(settings.language, settings.frequency);
    } else if (notificationInterval) {
      console.log("🩺 Health check: notifications are running correctly");
    }
  }, 10 * 60 * 1000); // 10 minutes
}

// Reset notification cooldown (call this when user completes a lesson)
export function resetNotificationCooldown() {
  console.log("🔄 Resetting notification cooldown");
  localStorage.setItem('lastNotificationTime', Date.now().toString());
}

export async function showLearningNotification(language: string) {
  const now = new Date().toLocaleTimeString();
  const timestamp = Date.now();
  
  console.log(`📢 [${now}] showLearningNotification called with language:`, language, typeof language);
  
  if (!("Notification" in window)) {
    console.error(`❌ [${now}] Notifications not supported by browser`);
    return;
  }
  
  if (Notification.permission !== "granted") {
    console.error(`❌ [${now}] Notification permission not granted:`, Notification.permission);
    return;
  }

  // Record this notification time
  localStorage.setItem('lastNotificationTime', timestamp.toString());
  
  // Log detailed timing information
  const lastNotificationTime = localStorage.getItem('lastNotificationTime');
  const lastScheduleTime = localStorage.getItem('lastScheduleTime');
  const scheduledInterval = localStorage.getItem('scheduledInterval');
  
  console.log(`⏰ Notification timing:`, {
    currentTime: new Date(timestamp).toLocaleTimeString(),
    lastNotification: lastNotificationTime ? new Date(parseInt(lastNotificationTime)).toLocaleTimeString() : 'none',
    lastSchedule: lastScheduleTime ? new Date(parseInt(lastScheduleTime)).toLocaleTimeString() : 'none',
    scheduledInterval: scheduledInterval + ' minutes',
    timeSinceLastNotification: lastNotificationTime ? Math.round((timestamp - parseInt(lastNotificationTime)) / 1000 / 60) + ' minutes' : 'N/A'
  });
  
  // Clean the language parameter to ensure it's just the language name
  const cleanLanguage = String(language).trim().toLowerCase().split(':')[0];
  console.log(`🧹 Cleaned language from "${language}" to "${cleanLanguage}"`);

  try {
    console.log(`📚 Using stored lesson data (offline-first approach)`);
    
    // Get user's completed lessons from progress data
    let completedLessonIds: string[] = [];
    
    try {
      // Fetch user progress to filter out completed lessons
      const progressResponse = await fetch(`/api/progress/${cleanLanguage}`, { credentials: 'same-origin' });
      
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        completedLessonIds = progressData.map((p: any) => `${p.language}_w${p.week}_d${p.day}`);
        console.log(`📊 Found ${completedLessonIds.length} completed lessons`);
      } else {
        console.log("⚠️ Could not fetch progress, using empty progress");
      }
    } catch (error) {
      console.log("⚠️ Error fetching progress:", error);
    }
    
    // Get lesson from stored data using lesson store
    const { getRandomLesson, getLessonById, loadStoredLessons } = await import("@/lib/lessonStore");
    
    // Debug: Check stored lessons before trying to get random one
    const storedData = loadStoredLessons();
    console.log(`🔍 Debug stored lessons before getRandomLesson:`, { 
      hasData: !!storedData, 
      language: storedData?.language, 
      count: storedData?.lessons?.length || 0,
      storageKeys: Object.keys(localStorage).filter(key => key.includes('lesson'))
    });
    
    // Fetch lesson data from the correct endpoint with proper A1 progression
    console.log('🔄 Fetching lesson data with A1 progression order...');
    
    let selectedLesson = null;
    try {
      const lessonsResponse = await fetch(`/api/lessons/${cleanLanguage}`, {
        credentials: 'same-origin'
      });
      
      if (lessonsResponse.ok) {
        const lessonsData = await lessonsResponse.json();
        console.log(`📚 Fetched lesson categories:`, Object.keys(lessonsData));
        
        // Convert lessons to flat array with proper ordering
        const lessons: any[] = [];
        
        // Process each category
        Object.keys(lessonsData).forEach(categoryKey => {
          const categoryData = lessonsData[categoryKey];
          
          // Process each lesson in the category
          Object.keys(categoryData).forEach(lessonKey => {
            const lesson = categoryData[lessonKey];
            
            lessons.push({
              ...lesson,
              categoryKey,
              lessonKey,
              // Ensure we have proper ID format
              id: lesson.id || `${cleanLanguage}_${categoryKey}_${lessonKey.replace('lesson_', '')}`
            });
          });
        });
        
        // Sort lessons by categoryOrder (A1 progression) and then by lesson order
        lessons.sort((a, b) => {
          // First sort by categoryOrder (1 = Greetings, 2 = Introducing, etc.)
          const categoryOrderA = a.categoryOrder || 999;
          const categoryOrderB = b.categoryOrder || 999;
          
          if (categoryOrderA !== categoryOrderB) {
            return categoryOrderA - categoryOrderB;
          }
          
          // Within same category, maintain lesson order
          return a.lessonKey.localeCompare(b.lessonKey);
        });
        
        console.log(`🔢 Processed ${lessons.length} lessons in A1 progression order`);
        console.log(`📋 First few lessons:`, lessons.slice(0, 5).map(l => `${l.category}: ${l.title}`));
        
        // Filter A1 lessons only and remove completed ones
        const a1Lessons = lessons.filter(lesson => lesson.level === 'A1');
        const availableLessons = a1Lessons.filter(lesson => 
          !completedLessonIds.includes(lesson.id)
        );
        
        console.log(`🎯 ${availableLessons.length} A1 lessons available (${a1Lessons.length - availableLessons.length} completed)`);
        
        if (availableLessons.length > 0) {
          // Get the last shown lesson to avoid repetition
          const lastShownLessonId = localStorage.getItem('lastShownLessonId');
          
          if (lastShownLessonId && availableLessons.length > 1) {
            // Find a different lesson than the last one shown
            const differentLessons = availableLessons.filter(lesson => lesson.id !== lastShownLessonId);
            if (differentLessons.length > 0) {
              selectedLesson = differentLessons[0];
              console.log(`✅ Selected NEXT available A1 lesson (avoiding repeat): ${selectedLesson.category} - "${selectedLesson.title}"`);
            } else {
              // If we only have one lesson, still select it
              selectedLesson = availableLessons[0];
              console.log(`✅ Selected only available A1 lesson: ${selectedLesson.category} - "${selectedLesson.title}"`);
            }
          } else {
            // First time or only one lesson available
            selectedLesson = availableLessons[0];
            console.log(`✅ Selected FIRST available A1 lesson: ${selectedLesson.category} - "${selectedLesson.title}"`);
          }
          
          // Store this lesson ID to avoid repeating it next time
          localStorage.setItem('lastShownLessonId', selectedLesson.id);
        } else if (a1Lessons.length > 0) {
          // If all A1 lessons completed, rotate through them for review
          const lastShownLessonId = localStorage.getItem('lastShownLessonId');
          
          if (lastShownLessonId && a1Lessons.length > 1) {
            const currentIndex = a1Lessons.findIndex(lesson => lesson.id === lastShownLessonId);
            const nextIndex = (currentIndex + 1) % a1Lessons.length;
            selectedLesson = a1Lessons[nextIndex];
            console.log(`🔄 All A1 lessons completed, rotating to next for review: ${selectedLesson.category} - "${selectedLesson.title}"`);
          } else {
            selectedLesson = a1Lessons[0];
            console.log(`🔄 All A1 lessons completed, selecting first for review: ${selectedLesson.category} - "${selectedLesson.title}"`);
          }
          
          // Store this lesson ID for rotation
          localStorage.setItem('lastShownLessonId', selectedLesson.id);
        }
      } else {
        console.error(`❌ Failed to fetch lessons from API: ${lessonsResponse.status}`);
      }
    } catch (error) {
      console.error('❌ Error fetching lessons from API:', error);
    }
    
    if (!selectedLesson) {
      console.log("💪 No lessons available, showing motivational notification");
      
      const motivationalMessages = [
        "Keep up your language learning streak!",
        "Ready for more language practice?",
        "Time to strengthen your language skills!",
        "Your daily language learning awaits!"
      ];
      
      const motivationalNotification = new Notification("Language Learning", {
        body: motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)],
        icon: "/favicon.ico",
        tag: "desklingo-motivational-" + Date.now(),
        requireInteraction: false,
        silent: false
      });
      
      motivationalNotification.onclick = function() {
        console.log("Motivational notification clicked, opening dashboard");
        window.focus();
        window.location.href = "/dashboard";
        motivationalNotification.close();
      };
      
      console.log("✅ Motivational notification created");
      return;
    }
    
    // Determine if this is a review or new lesson
    const isReview = completedLessonIds.includes(selectedLesson.id);
    const lessonType = isReview ? "review" : "new";
    
    // Create a week/day mapping based on categoryOrder and lesson order
    // Category order 1 = Week 1, Category order 2 = Week 2, etc.
    const week = selectedLesson.categoryOrder || 1;
    const day = parseInt(selectedLesson.lessonKey?.replace('lesson_', '') || '1');
    
    console.log(`🗺️ Mapping lesson to URL: categoryOrder=${selectedLesson.categoryOrder} -> week=${week}, lessonKey=${selectedLesson.lessonKey} -> day=${day}`);
    
    // Modify the question based on lesson type
    let questionText = selectedLesson.quiz.question;
    let notificationTitle = `${cleanLanguage.charAt(0).toUpperCase() + cleanLanguage.slice(1)} Learning`;
    
    if (isReview) {
      questionText = `Review: ${selectedLesson.quiz.question}`;
      notificationTitle = `${cleanLanguage.charAt(0).toUpperCase() + cleanLanguage.slice(1)} Review`;
    }
    
    const lessonData = {
      question: questionText,
      lessonPath: `/lesson/${cleanLanguage}/${week}/${day}`,
      lessonId: selectedLesson.id,
      week: week,
      day: day,
      category: selectedLesson.category,
      title: selectedLesson.title,
      isReview
    };
    
    console.log(`📝 Selected lesson details:`, {
      id: selectedLesson.id,
      week: week,
      day: day,
      lessonPath: lessonData.lessonPath,
      title: selectedLesson.title,
      category: selectedLesson.category,
      type: lessonType
    });
    
    console.log("Creating notification with content:", {
      title: notificationTitle,
      body: lessonData.question,
      icon: "/favicon.ico",
      type: lessonType
    });

    // Create notification with lesson data
    const notification = new Notification(notificationTitle, {
      body: lessonData.question,
      icon: "/favicon.ico",
      tag: "desklingo-lesson-" + Date.now(),
      requireInteraction: false,
      silent: false
    });

    console.log("✅ Notification object created:", {
      title: notification.title,
      body: notification.body,
      tag: notification.tag
    });

    // Handle notification click - redirect to specific lesson using lesson ID
    notification.onclick = function() {
      console.log("Notification clicked, redirecting to:", lessonData.lessonPath);
      console.log("Lesson ID:", lessonData.lessonId);
      
      try {
        window.focus();
        
        // Navigate using lesson ID approach for guaranteed data availability
        const urlParams = lessonData.isReview ? "?from=notification&mode=review&id=" + lessonData.lessonId : "?from=notification&id=" + lessonData.lessonId;
        const fullUrl = lessonData.lessonPath + urlParams;
        
        // Use direct navigation for same origin
        window.location.href = fullUrl;
        notification.close();
        
        console.log("✅ Navigation initiated successfully with lesson ID:", lessonData.lessonId);
      } catch (error) {
        console.error("❌ Error during notification click navigation:", error);
        // Fallback - try to open dashboard
        window.location.href = "/dashboard";
        notification.close();
      }
    };

    // Handle notification events
    notification.onshow = function() {
      console.log("✅ Notification displayed successfully");
    };

    notification.onerror = function(error) {
      console.error("❌ Notification error:", error);
    };

    notification.onclose = function() {
      console.log("Notification was closed");
    };

    // Auto close after 15 seconds
    setTimeout(() => {
      console.log("Auto-closing notification");
      notification.close();
    }, 15000);
    
  } catch (error) {
    console.error("Failed to create notification:", error);
    throw error;
  }
}

// Store notification settings in localStorage
export function saveNotificationSettings(settings: {
  enabled: boolean;
  language: string;
  frequency: number;
}) {
  localStorage.setItem("desklingo-notifications", JSON.stringify(settings));
  
  if (settings.enabled) {
    scheduleNotification(settings.language, settings.frequency);
  } else {
    stopNotifications();
  }
}

export function loadNotificationSettings() {
  const stored = localStorage.getItem("desklingo-notifications");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse notification settings:", e);
    }
  }
  return null;
}

// Check for notification recovery after page reload
export function checkNotificationRecovery() {
  const lastScheduleTime = localStorage.getItem('lastScheduleTime');
  const scheduledLanguage = localStorage.getItem('scheduledLanguage');
  const scheduledInterval = localStorage.getItem('scheduledInterval');
  
  if (lastScheduleTime && scheduledLanguage && scheduledInterval) {
    const timeSinceSchedule = Date.now() - parseInt(lastScheduleTime);
    const maxRecoveryTime = 24 * 60 * 60 * 1000; // 24 hours
    
    if (timeSinceSchedule < maxRecoveryTime) {
      console.log(`🔄 Notification recovery: scheduled ${Math.round(timeSinceSchedule/1000/60)} minutes ago`);
      return {
        language: scheduledLanguage,
        interval: parseInt(scheduledInterval)
      };
    } else {
      console.log("🗑️ Clearing old schedule data (> 24 hours)");
      localStorage.removeItem('lastScheduleTime');
      localStorage.removeItem('scheduledLanguage');
      localStorage.removeItem('scheduledInterval');
    }
  }
  
  return null;
}

// Initialize notifications on page load
export function initializeNotifications() {
  console.log("🔄 Initializing notifications on page load");
  
  // First check if we need to recover notifications
  const recoveryData = checkNotificationRecovery();
  
  const settings = loadNotificationSettings();
  console.log("📋 Loaded notification settings:", {
    hasSettings: !!settings,
    enabled: settings?.enabled,
    language: settings?.language,
    frequency: settings?.frequency,
    permission: Notification.permission,
    hasRecoveryData: !!recoveryData
  });
  
  if (settings && settings.enabled && Notification.permission === "granted") {
    console.log("✅ Starting notifications from initialization");
    scheduleNotification(settings.language, settings.frequency);
  } else if (recoveryData && Notification.permission === "granted") {
    console.log("🔄 Recovering notifications from previous session");
    scheduleNotification(recoveryData.language, recoveryData.interval);
  } else if (settings && settings.enabled && Notification.permission !== "granted") {
    console.warn("⚠️  Notifications enabled but permission not granted. Current permission:", Notification.permission);
  } else if (!settings) {
    console.log("ℹ️  No notification settings found");
  } else {
    console.log("ℹ️  Notifications disabled in settings");
  }
  
  // Always start health check if we have settings (for recovery scenarios)
  if ((settings && settings.enabled) || recoveryData) {
    startNotificationHealthCheck();
  }
}

// Setup notifications based on user settings (async version for compatibility)
export async function setupNotifications(settings?: any): Promise<NotificationPermission> {
  console.log("Setting up notifications with settings:", settings);
  
  // If no settings provided, request permission first
  if (!settings) {
    return await requestNotificationPermission();
  }
  
  if (settings.enabled && Notification.permission === "granted") {
    scheduleNotification(settings.language, settings.frequency);
  } else {
    stopNotifications();
  }
  
  return Notification.permission;
}

// Clean up on page unload
window.addEventListener("beforeunload", () => {
  stopNotifications();
});