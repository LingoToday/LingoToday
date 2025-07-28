// Notification system for language learning reminders

let notificationInterval: NodeJS.Timeout | null = null;

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

// Schedule notifications at specified intervals
export function scheduleNotification(language: string, intervalMinutes: number) {
  console.log(`📅 Scheduling notifications for ${language} every ${intervalMinutes} minutes`);
  
  // Clear any existing notification interval
  stopNotifications();

  // Check if we should respect a cooldown period
  const lastNotificationTime = localStorage.getItem('lastNotificationTime');
  const now = Date.now();
  const cooldownMs = intervalMinutes * 60 * 1000;
  
  let delayMs = cooldownMs; // Default to full interval
  
  if (lastNotificationTime) {
    const timeSinceLastNotification = now - parseInt(lastNotificationTime);
    if (timeSinceLastNotification < cooldownMs) {
      // Still in cooldown period, delay the first notification
      delayMs = cooldownMs - timeSinceLastNotification;
      console.log(`⏰ Respecting cooldown: ${Math.round(delayMs / 1000 / 60)} minutes until next notification`);
    } else {
      // Cooldown has passed, can send notification soon
      delayMs = 1000; // 1 second delay
    }
  }

  // Set up new interval
  notificationInterval = setInterval(() => {
    showLearningNotification(language);
  }, cooldownMs);

  // Schedule first notification with appropriate delay
  setTimeout(() => {
    showLearningNotification(language);
  }, delayMs);
}

// Stop all scheduled notifications
export function stopNotifications() {
  if (notificationInterval) {
    console.log("🛑 Stopping notifications");
    clearInterval(notificationInterval);
    notificationInterval = null;
  } else {
    console.log("ℹ️ No notification interval to stop");
  }
}

// Reset notification cooldown (call this when user completes a lesson)
export function resetNotificationCooldown() {
  console.log("🔄 Resetting notification cooldown");
  localStorage.setItem('lastNotificationTime', Date.now().toString());
}

export async function showLearningNotification(language: string) {
  const now = new Date().toLocaleTimeString();
  
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
  localStorage.setItem('lastNotificationTime', Date.now().toString());
  
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
    
    // Instead of relying on localStorage, fetch lesson data directly from API
    console.log('🔄 Fetching lesson data directly from API for notification...');
    
    let selectedLesson = null;
    try {
      const lessonsResponse = await fetch(`/api/lessons/${cleanLanguage}`, {
        credentials: 'same-origin'
      });
      
      if (lessonsResponse.ok) {
        const lessonsData = await lessonsResponse.json();
        console.log(`📚 Fetched lesson data from API:`, Object.keys(lessonsData));
        
        // Convert API data to flat array (same logic as lessonStore)
        const lessons: any[] = [];
        Object.keys(lessonsData).forEach(weekKey => {
          const week = parseInt(weekKey.replace('week_', ''));
          const weekData = lessonsData[weekKey];
          
          Object.keys(weekData).forEach(dayKey => {
            const day = parseInt(dayKey.replace('day_', ''));
            const lesson = weekData[dayKey];
            
            lessons.push({
              ...lesson,
              week,
              day
            });
          });
        });
        
        console.log(`🔢 Processed ${lessons.length} lessons from API`);
        
        // Filter out completed lessons
        const availableLessons = lessons.filter(lesson => 
          !completedLessonIds.includes(lesson.id)
        );
        
        console.log(`🎯 ${availableLessons.length} lessons available (${lessons.length - availableLessons.length} completed)`);
        
        if (availableLessons.length > 0) {
          selectedLesson = availableLessons[Math.floor(Math.random() * availableLessons.length)];
          console.log(`✅ Selected lesson: ${selectedLesson.id} - "${selectedLesson.title}"`);
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
    
    // Modify the question based on lesson type
    let questionText = selectedLesson.quiz.question;
    let notificationTitle = `${cleanLanguage.charAt(0).toUpperCase() + cleanLanguage.slice(1)} Learning`;
    
    if (isReview) {
      questionText = `Review: ${selectedLesson.quiz.question}`;
      notificationTitle = `${cleanLanguage.charAt(0).toUpperCase() + cleanLanguage.slice(1)} Review`;
    }
    
    const lessonData = {
      question: questionText,
      lessonPath: `/lesson/${cleanLanguage}/${selectedLesson.week}/${selectedLesson.day}`,
      lessonId: selectedLesson.id,
      week: selectedLesson.week,
      day: selectedLesson.day,
      title: selectedLesson.title,
      isReview
    };
    
    console.log(`📝 Selected lesson details:`, {
      id: selectedLesson.id,
      week: selectedLesson.week,
      day: selectedLesson.day,
      lessonPath: lessonData.lessonPath,
      title: selectedLesson.title,
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

// Initialize notifications on page load
export function initializeNotifications() {
  const settings = loadNotificationSettings();
  if (settings && settings.enabled && Notification.permission === "granted") {
    scheduleNotification(settings.language, settings.frequency);
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