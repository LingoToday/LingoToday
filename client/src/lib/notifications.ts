// Notification system for language learning reminders

let notificationInterval: NodeJS.Timeout | null = null;
let healthCheckInterval: NodeJS.Timeout | null = null;
let isNotificationSystemActive = false; // Global flag to prevent duplicate systems
let lastNotificationId: string | null = null; // Track last notification to prevent duplicates

// Check if current time is within user's notification window
function isWithinNotificationWindow(startTime: string = "09:00", endTime: string = "18:00"): boolean {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startTimeMinutes = startHour * 60 + startMin;
  const endTimeMinutes = endHour * 60 + endMin;
  
  // Handle cases where end time is on the next day
  if (endTimeMinutes <= startTimeMinutes) {
    // Notification window spans midnight (e.g., 22:00 to 06:00)
    return currentTime >= startTimeMinutes || currentTime <= endTimeMinutes;
  } else {
    // Normal case (e.g., 09:00 to 18:00)
    return currentTime >= startTimeMinutes && currentTime <= endTimeMinutes;
  }
}

// Get user's notification settings from the API
async function getUserNotificationSettings(): Promise<{ startTime: string; endTime: string; frequency: number } | null> {
  try {
    const response = await fetch('/api/dashboard', { credentials: 'same-origin' });
    if (response.ok) {
      const data = await response.json();
      return {
        startTime: data.settings?.notificationStartTime || "09:00",
        endTime: data.settings?.notificationEndTime || "18:00",
        frequency: data.settings?.notificationFrequency || 15
      };
    }
  } catch (error) {
    console.log("⚠️ Could not fetch notification settings, using defaults");
  }
  return null;
}

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
export async function startDailySession(language: string, intervalMinutes: number = 15) {
  console.log(`🌅 Starting daily learning session for ${language}`);
  
  // Prevent duplicate sessions
  if (isNotificationSystemActive) {
    console.log(`⚠️ Notification system already active, stopping duplicates first`);
  }
  
  // Stop any existing notifications first
  stopNotifications();
  
  // Get user's notification settings to respect time window
  const notificationSettings = await getUserNotificationSettings();
  if (notificationSettings) {
    intervalMinutes = notificationSettings.frequency;
    console.log(`⚙️ Using user's notification frequency: ${intervalMinutes} minutes`);
    console.log(`⏰ User's notification window: ${notificationSettings.startTime} - ${notificationSettings.endTime}`);
  }
  
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

// Clear checkpoint notification tracking (call this when user completes a checkpoint)
export function clearCheckpointNotificationTracking() {
  console.log("🔄 Clearing checkpoint notification tracking - user completed a checkpoint");
  localStorage.removeItem('lastCheckpointNotificationDate');
  localStorage.removeItem('lastShownCheckpointId');
  console.log("✅ Checkpoint notification tracking cleared - next checkpoint can be shown");
}

// Refresh notification progress (call this when user completes a lesson)
export function refreshNotificationProgress() {
  console.log("🔄 Refreshing notification progress - clearing cached lesson data");
  
  // Clear the lesson store cache so next notification fetches fresh data
  const STORAGE_KEY = 'lingotoday-lesson-store';
  localStorage.removeItem(STORAGE_KEY);
  
  // Clear last shown lesson tracking
  localStorage.removeItem('lastShownLessonId');
  
  // Reset cooldown to allow immediate notification if session is active
  resetNotificationCooldown();
  
  // NOTE: We do NOT clear checkpoint tracking here since that should persist
  // across lesson completions to prevent the same review appearing repeatedly
  
  console.log("✅ Notification progress refreshed - next notification will use current progress");
}

// Check for available checkpoint reviews
async function getAvailableCheckpoints(): Promise<any[]> {
  try {
    const response = await fetch('/api/available-checkpoints', { credentials: 'same-origin' });
    if (response.ok) {
      const data = await response.json();
      return data.availableCheckpoints.filter((checkpoint: any) => !checkpoint.isCompleted);
    }
  } catch (error) {
    console.log("⚠️ Could not fetch checkpoint data for notifications");
  }
  return [];
}

// Show checkpoint review notification
async function showCheckpointNotification(checkpoint: any): Promise<boolean> {
  try {
    const notification = new Notification("Checkpoint Review Available!", {
      body: `Test your knowledge: ${checkpoint.title}`,
      icon: "/favicon.ico",
      tag: "lingotoday-checkpoint-" + checkpoint.id,
      requireInteraction: true,
      silent: false
    });

    notification.onclick = function() {
      console.log("Checkpoint notification clicked, navigating to checkpoint");
      try {
        if (window.focus) window.focus();
        const checkpointUrl = `/checkpoint/${checkpoint.id}?from=notification`;
        console.log("Navigating to:", checkpointUrl);
        window.location.href = checkpointUrl;
        notification.close();
      } catch (error) {
        console.error("Navigation error:", error);
        window.location.href = "/dashboard";
        notification.close();
      }
    };

    notification.onshow = () => console.log("✅ Checkpoint notification displayed successfully");
    notification.onerror = (error) => console.error("❌ Checkpoint notification error:", error);
    
    return true;
  } catch (error) {
    console.error("Error showing checkpoint notification:", error);
    return false;
  }
}

export async function showLearningNotification(language: string) {
  const now = new Date().toLocaleTimeString();
  const timestamp = Date.now();
  
  console.log(`📢 [${now}] showLearningNotification called with language:`, language, typeof language);
  
  // Get user's notification settings
  const notificationSettings = await getUserNotificationSettings();
  
  // Check if we're within the user's notification window
  if (notificationSettings) {
    const isWithinWindow = isWithinNotificationWindow(
      notificationSettings.startTime, 
      notificationSettings.endTime
    );
    
    if (!isWithinWindow) {
      console.log(`⏰ Current time (${now}) is outside notification window (${notificationSettings.startTime} - ${notificationSettings.endTime})`);
      return;
    }
    
    console.log(`✅ Current time (${now}) is within notification window (${notificationSettings.startTime} - ${notificationSettings.endTime})`);
  }
  
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

  // Check for available checkpoints - but only show once per day per checkpoint
  try {
    const availableCheckpoints = await getAvailableCheckpoints();
    if (availableCheckpoints.length > 0) {
      console.log(`📊 Found ${availableCheckpoints.length} available checkpoints`);
      
      // Check if we've already shown a checkpoint notification today
      const today = new Date().toDateString();
      const lastCheckpointNotificationDate = localStorage.getItem('lastCheckpointNotificationDate');
      const lastShownCheckpointId = localStorage.getItem('lastShownCheckpointId');
      
      // Get the first available checkpoint (they're now ordered by priority)
      const checkpoint = availableCheckpoints[0];
      
      // Only show if we haven't shown THIS specific checkpoint today
      const shouldShowCheckpoint = lastCheckpointNotificationDate !== today || 
                                   lastShownCheckpointId !== checkpoint.id.toString();
      
      console.log(`📊 Checkpoint notification logic:`, {
        today,
        lastCheckpointNotificationDate,
        lastShownCheckpointId,
        currentCheckpointId: checkpoint.id,
        shouldShow: shouldShowCheckpoint
      });
      
      if (shouldShowCheckpoint) {
        const checkpointShown = await showCheckpointNotification(checkpoint);
        
        if (checkpointShown) {
          console.log(`✅ Checkpoint notification shown: ${checkpoint.title}`);
          
          // Record that we've shown this checkpoint today
          localStorage.setItem('lastCheckpointNotificationDate', today);
          localStorage.setItem('lastShownCheckpointId', checkpoint.id.toString());
          
          return; // Exit early, don't show lesson notification
        }
      } else {
        console.log(`⏰ Checkpoint notification skipped - already shown today or same checkpoint`);
      }
    }
  } catch (error) {
    console.log("⚠️ Error checking checkpoints for notifications:", error);
  }

  try {
    console.log(`📚 Using stored lesson data (offline-first approach)`);
    
    // Get user's completed lessons from progress data
    let completedLessonIds: string[] = [];
    
    try {
      // Fetch user progress to get ACTUAL current progress from database
      const progressResponse = await fetch(`/api/progress/${cleanLanguage}`, { credentials: 'same-origin' });
      
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        completedLessonIds = progressData.map((p: any) => p.lessonId);
        console.log(`📊 Found ${completedLessonIds.length} completed lessons:`, completedLessonIds.slice(0, 3));
        
        // Also get the next lesson from the API for accurate selection
        const nextLessonResponse = await fetch('/api/next-lesson', { credentials: 'same-origin' });
        if (nextLessonResponse.ok) {
          const nextLessonData = await nextLessonResponse.json();
          console.log(`🎯 API suggests next lesson:`, nextLessonData);
          
          // If we have a next lesson from API, prefer it for notifications
          if (nextLessonData && !nextLessonData.completed) {
            console.log(`✅ Using API-suggested lesson: ${nextLessonData.lessonId}`);
            
            // Create notification for the API-suggested lesson
            const notificationBody = nextLessonData.notificationText 
              ? `Ready to learn: ${nextLessonData.notificationText}` 
              : `Ready for your next lesson: ${nextLessonData.title}`;
              
            const notification = new Notification(`${cleanLanguage.charAt(0).toUpperCase() + cleanLanguage.slice(1)} Learning`, {
              body: notificationBody,
              icon: "/favicon.ico",
              tag: "lingotoday-lesson-" + Date.now(),
              requireInteraction: true,
              silent: false
            });

            notification.onclick = function() {
              console.log("Notification clicked, navigating to next lesson");
              try {
                if (window.focus) window.focus();
                // Navigate to the lesson using the correct URL structure
                const lessonUrl = `/lesson/${cleanLanguage}/${nextLessonData.courseId}/${nextLessonData.lessonId}?from=notification`;
                console.log("Navigating to:", lessonUrl);
                window.location.href = lessonUrl;
                notification.close();
              } catch (error) {
                console.error("Navigation error:", error);
                window.location.href = "/dashboard";
                notification.close();
              }
            };

            notification.onshow = () => console.log("✅ Notification displayed successfully");
            notification.onerror = (error) => console.error("❌ Notification error:", error);
            
            return; // Exit early since we used the API lesson
          }
        }
      } else {
        console.log("⚠️ Could not fetch progress (status " + progressResponse.status + "), using fallback");
        completedLessonIds = [];
      }
    } catch (error) {
      console.log("⚠️ Error fetching progress:", error);
      completedLessonIds = [];
    }
    
    // Get lesson from stored data using new lesson store
    const { getNextLessonToLearn, initializeLessonStore } = await import("@/lib/lessonStore");
    
    // Clear any cached lesson data to ensure fresh mapping
    localStorage.removeItem('lingotoday-lesson-store');
    
    // Initialize lesson store for this language (force refresh without cache)
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
    
    // Create a week/day mapping based on lesson properties, but ensure we use valid course numbers
    const week = selectedLesson.week || 1;
    const day = selectedLesson.day || 1;
    
    // Map to valid course numbers immediately to prevent invalid URLs
    const availableCourses = [1, 2, 4]; // These are the actual course files that exist
    const courseIndex = ((week - 1) % availableCourses.length);
    const validCourseNumber = availableCourses[courseIndex];
    
    console.log(`🗺️ Mapping lesson to URL: week=${week}, day=${day}, validCourse=${validCourseNumber}`);
    
    // Modify the question based on lesson type
    let questionText = selectedLesson.quiz.question;
    let notificationTitle = `${cleanLanguage.charAt(0).toUpperCase() + cleanLanguage.slice(1)} Learning`;
    
    if (isReview) {
      questionText = `Review: ${selectedLesson.quiz.question}`;
      notificationTitle = `${cleanLanguage.charAt(0).toUpperCase() + cleanLanguage.slice(1)} Review`;
    }
    
    const lessonData = {
      question: questionText,
      lessonPath: `/lesson/${cleanLanguage}/course${validCourseNumber}/lesson${day}`,
      lessonId: selectedLesson.id,
      week: validCourseNumber, // Use the valid course number instead of original week
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
        
        // Use the lessonPath that was already constructed with valid course numbers
        const fullUrl = lessonData.lessonPath + (lessonData.isReview ? `?from=notification&mode=review&id=${lessonData.lessonId}` : `?from=notification&id=${lessonData.lessonId}`);
        
        console.log("🔗 Notification URL:", {
          lessonPath: lessonData.lessonPath,
          finalUrl: fullUrl
        });
        
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