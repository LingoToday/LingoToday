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

  // Set up new interval
  notificationInterval = setInterval(() => {
    showLearningNotification(language);
  }, intervalMinutes * 60 * 1000);

  // Show first notification immediately
  setTimeout(() => {
    showLearningNotification(language);
  }, 1000);
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
    const { getRandomLesson, getLessonById } = await import("@/lib/lessonStore");
    const selectedLesson = getRandomLesson(completedLessonIds);
    
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