// Notification system for language learning reminders

let notificationInterval: NodeJS.Timeout | null = null;
let healthCheckInterval: NodeJS.Timeout | null = null;
let isNotificationSystemActive = false; // Global flag to prevent duplicate systems
let lastNotificationId: string | null = null; // Track last notification to prevent duplicates

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
  
  // Prevent duplicate sessions
  if (isNotificationSystemActive) {
    console.log(`⚠️ Notification system already active, stopping duplicates first`);
  }
  
  // Stop any existing notifications first
  stopNotifications();
  
  const intervalMs = intervalMinutes * 60 * 1000;
  
  // Mark session as started for today
  const today = new Date().toDateString();
  localStorage.setItem('sessionStartedToday', today);
  localStorage.setItem('sessionLanguage', language);
  localStorage.setItem('sessionInterval', intervalMinutes.toString());
  
  // Check if there's a recent notification cooldown (from lesson completion)
  const lastNotificationTime = localStorage.getItem('lastNotificationTime');
  const now = Date.now();
  let initialDelay = 10000; // Default 10 seconds for new sessions
  
  if (lastNotificationTime) {
    const timeSinceLastNotification = now - parseInt(lastNotificationTime);
    const cooldownRemaining = intervalMs - timeSinceLastNotification;
    
    if (cooldownRemaining > 0) {
      // If there's still cooldown time remaining, wait for it
      initialDelay = cooldownRemaining;
      console.log(`⏰ Respecting existing cooldown: next notification in ${Math.round(cooldownRemaining/1000/60)} minutes`);
    } else {
      console.log(`✅ Cooldown expired, starting with normal delay`);
    }
  }
  
  // Schedule first notification with appropriate delay
  setTimeout(() => {
    console.log(`🚀 Daily session notification triggered for ${language}`);
    showLearningNotification(language);
  }, initialDelay);
  
  // Then set up regular interval for the rest of the day
  notificationInterval = setInterval(() => {
    console.log(`⏰ Daily session interval triggered - firing notification for ${language}`);
    showLearningNotification(language);
  }, intervalMs);
  
  // Mark notification system as active
  isNotificationSystemActive = true;
  
  // Start health check to ensure notifications keep running
  startNotificationHealthCheck();
  
  const delayMinutes = Math.round(initialDelay / 1000 / 60);
  console.log(`✅ Daily session started: next lesson in ${delayMinutes} minutes, then every ${intervalMinutes} minutes`);
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
  
  // Mark notification system as inactive and clear deduplication
  isNotificationSystemActive = false;
  lastNotificationId = null;
  
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
    const sessionLanguage = localStorage.getItem('sessionLanguage');
    const sessionInterval = localStorage.getItem('sessionInterval');
    const isSessionActive = isSessionStartedToday();
    
    console.log("🩺 Health check running:", {
      sessionActive: isSessionActive,
      language: sessionLanguage,
      interval: sessionInterval,
      permission: Notification.permission,
      hasInterval: !!notificationInterval
    });
    
    if (isSessionActive && sessionLanguage && sessionInterval && Notification.permission === "granted" && !notificationInterval) {
      console.log("🩺 Health check: session active but notifications stopped - recovering");
      startDailySession(sessionLanguage, parseInt(sessionInterval));
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
  
  // Prevent duplicate notifications within a short time frame (30 seconds)
  const currentNotificationId = `${language}_${Math.floor(timestamp / 30000)}`;
  if (lastNotificationId === currentNotificationId) {
    console.log(`⚠️ Duplicate notification prevented for ${language} within 30 seconds`);
    return;
  }
  lastNotificationId = currentNotificationId;
  
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
        completedLessonIds = progressData.map((p: any) => p.lessonId);
        console.log(`📊 Found ${completedLessonIds.length} completed lessons:`, completedLessonIds.slice(0, 3));
      } else {
        console.log("⚠️ Could not fetch progress (status " + progressResponse.status + "), showing all lessons");
        // Don't filter out any lessons if we can't get progress data
        completedLessonIds = [];
      }
    } catch (error) {
      console.log("⚠️ Error fetching progress:", error);
      completedLessonIds = [];
    }
    
    // Get lesson from stored data using new lesson store
    const { getNextLessonToLearn, initializeLessonStore } = await import("@/lib/lessonStore");
    
    // Initialize lesson store for this language (uses cache if available)
    await initializeLessonStore(cleanLanguage, completedLessonIds);
    
    // Get the next lesson that should be learned
    const selectedLesson = getNextLessonToLearn(completedLessonIds);
    
    if (!selectedLesson) {
      console.log("❌ No lessons available or all lessons completed");
      return;
    }
    
    console.log(`✅ Selected next lesson: ${selectedLesson.category} - "${selectedLesson.title}"`);
    
    // Store this lesson as the last shown for tracking
    localStorage.setItem('lastShownLessonId', selectedLesson.id);

    
    // Determine if this is a review or new lesson
    const isReview = completedLessonIds.includes(selectedLesson.id);
    const lessonType = isReview ? "review" : "new";
    
    // Create a week/day mapping based on lesson properties
    const week = selectedLesson.week || 1;
    const day = selectedLesson.day || 1;
    
    console.log(`🗺️ Mapping lesson to URL: week=${week}, day=${day}`);
    
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
      tag: "lingotoday-lesson-" + Date.now(),
      requireInteraction: true,
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
        // First try to focus the current window
        if (window.focus) {
          window.focus();
        }
        
        // Check if the current page is already the app (same origin)
        const currentUrl = window.location.href;
        const appDomain = window.location.origin;
        
        console.log("Current URL:", currentUrl);
        console.log("App domain:", appDomain);
        
        // Navigate using lesson ID approach for guaranteed data availability
        const urlParams = lessonData.isReview ? "?from=notification&mode=review&id=" + lessonData.lessonId : "?from=notification&id=" + lessonData.lessonId;
        const fullUrl = lessonData.lessonPath + urlParams;
        
        // Always use same-window navigation to preserve session
        console.log("Navigating to:", fullUrl);
        window.location.href = fullUrl;
        notification.close();
        
        console.log("✅ Navigation initiated successfully with lesson ID:", lessonData.lessonId);
      } catch (error) {
        console.error("❌ Error during notification click navigation:", error);
        // Fallback - try to open dashboard
        try {
          window.location.href = "/dashboard";
          notification.close();
        } catch (fallbackError) {
          console.error("❌ Fallback navigation also failed:", fallbackError);
          notification.close();
        }
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

    // Keep notification open until user interacts with it
    console.log("📌 Notification will stay open until user clicks or dismisses it");
    
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
  localStorage.setItem("lingotoday-notifications", JSON.stringify(settings));
  
  if (settings.enabled) {
    scheduleNotification(settings.language, settings.frequency);
  } else {
    stopNotifications();
  }
}

// Legacy function removed - now using session-based approach only

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
  
  // Prevent multiple initialization
  if (isNotificationSystemActive) {
    console.log("⚠️ Notification system already initialized, skipping");
    return;
  }
  
  // Check if there's an active session that needs to be recovered
  const isSessionActive = isSessionStartedToday();
  const sessionLanguage = localStorage.getItem('sessionLanguage');
  const sessionInterval = localStorage.getItem('sessionInterval');
  
  console.log("📋 Session status check:", {
    sessionActive: isSessionActive,
    language: sessionLanguage,
    interval: sessionInterval,
    permission: Notification.permission
  });
  
  if (isSessionActive && sessionLanguage && sessionInterval && Notification.permission === "granted") {
    console.log("🔄 Recovering active session from page refresh");
    startDailySession(sessionLanguage, parseInt(sessionInterval));
  } else if (isSessionActive && Notification.permission !== "granted") {
    console.warn("⚠️ Session active but notification permission not granted:", Notification.permission);
  } else if (!isSessionActive) {
    console.log("ℹ️ No active session - user must click 'Start Today's Lessons'");
  } else {
    console.log("ℹ️ Session recovery not needed or not possible");
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