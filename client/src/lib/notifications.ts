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
    console.log(`🔗 Fetching lessons data from backend API`);
    
    // Fetch lessons data from backend API to ensure consistency
    const response = await fetch(`/api/lessons/${cleanLanguage}`, {
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`API response status: ${response.status}`);
    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`);
      throw new Error(`API returned ${response.status}`);
    }
    
    const languageLessons = await response.json();
    console.log(`✅ Fetched lesson data from API for ${cleanLanguage}`);
    
    if (!languageLessons) {
      console.error(`No lessons found for language: ${cleanLanguage}`);
      return;
    }
    
    // Get user's progress to determine which lessons they haven't completed
    let availableLessons: Array<{
      lesson: any;
      week: number;
      day: number;
    }> = [];
    
    try {
      // Fetch user progress to filter out completed lessons
      const progressResponse = await fetch('/api/progress', { credentials: 'same-origin' });
      let completedLessons: string[] = [];
      
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        completedLessons = progressData.map((p: any) => `${p.language}_w${p.week}_d${p.day}`);
        console.log(`📊 Found ${completedLessons.length} completed lessons`);
      } else {
        console.log("⚠️ Could not fetch progress, showing all lessons");
      }
      
      // Get all lessons and filter out completed ones
      Object.keys(languageLessons).forEach(weekKey => {
        const week = parseInt(weekKey.replace('week_', ''));
        const weekData = languageLessons[weekKey];
        Object.keys(weekData).forEach(dayKey => {
          const day = parseInt(dayKey.replace('day_', ''));
          const lesson = weekData[dayKey];
          const lessonId = `${cleanLanguage}_w${week}_d${day}`;
          
          // Only include lessons that haven't been completed
          if (!completedLessons.includes(lessonId)) {
            availableLessons.push({ lesson, week, day });
          }
        });
      });
      
      console.log(`📚 Available lessons after filtering: ${availableLessons.length}`);
      
    } catch (error) {
      console.log("⚠️ Error fetching progress, showing all lessons:", error);
      // Fallback: show all lessons if we can't get progress
      Object.keys(languageLessons).forEach(weekKey => {
        const week = parseInt(weekKey.replace('week_', ''));
        const weekData = languageLessons[weekKey];
        Object.keys(weekData).forEach(dayKey => {
          const day = parseInt(dayKey.replace('day_', ''));
          const lesson = weekData[dayKey];
          availableLessons.push({ lesson, week, day });
        });
      });
    }
    
    let selectedLesson;
    let lessonType: "new" | "review" | "motivational" = "new";
    
    // Three-tier notification strategy
    if (availableLessons.length > 0) {
      // Active lessons - show new lessons to learn
      selectedLesson = availableLessons[Math.floor(Math.random() * availableLessons.length)];
      lessonType = "new";
      console.log(`🆕 Selected new lesson: Week ${selectedLesson.week}, Day ${selectedLesson.day}`);
    } else {
      // No more new lessons - switch to review mode
      console.log(`🔄 No new lessons available, switching to review mode`);
      
      // Get all lessons for review
      const allLessons: Array<{
        lesson: any;
        week: number;
        day: number;
      }> = [];
      
      Object.keys(languageLessons).forEach(weekKey => {
        const week = parseInt(weekKey.replace('week_', ''));
        const weekData = languageLessons[weekKey];
        Object.keys(weekData).forEach(dayKey => {
          const day = parseInt(dayKey.replace('day_', ''));
          const lesson = weekData[dayKey];
          allLessons.push({ lesson, week, day });
        });
      });
      
      if (allLessons.length > 0) {
        selectedLesson = allLessons[Math.floor(Math.random() * allLessons.length)];
        lessonType = "review";
        console.log(`🔄 Selected review lesson: Week ${selectedLesson.week}, Day ${selectedLesson.day}`);
      } else {
        // No lessons at all - show motivational notification
        lessonType = "motivational";
        console.log(`💪 No lessons available, showing motivational notification`);
        
        const motivationalMessages = [
          "Keep up your language learning streak! 🌟",
          "Ready for more language practice? 📚",
          "Time to strengthen your language skills! 💪",
          "Your daily language learning awaits! 🎯"
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
        
        console.log("✅ Motivational notification created for completed course");
        return;
      }
    }
    
    if (!selectedLesson) {
      console.error("No lesson could be selected");
      return;
    }
    
    const { lesson, week, day } = selectedLesson;
    
    // Modify the question based on lesson type
    let questionText = lesson.quiz.question;
    let notificationTitle = `${cleanLanguage.charAt(0).toUpperCase() + cleanLanguage.slice(1)} Learning`;
    
    if (lessonType === "review") {
      questionText = `🔄 Review: ${lesson.quiz.question}`;
      notificationTitle = `${cleanLanguage.charAt(0).toUpperCase() + cleanLanguage.slice(1)} Review`;
    }
    
    const lessonData = {
      question: questionText,
      lessonPath: `/lesson/${cleanLanguage}/${week}/${day}`,
      week,
      day,
      title: lesson.title,
      isReview: lessonType === "review"
    };
    
    console.log(`📝 Selected lesson details:`, {
      week: week,
      day: day,
      lessonPath: lessonData.lessonPath,
      title: lesson.title,
      type: lessonType
    });
    
    console.log("Creating notification with content:", {
      title: notificationTitle,
      body: lessonData.question,
      icon: "/favicon.ico",
      type: lessonType
    });

    // More compatible notification options for macOS
    const notification = new Notification(notificationTitle, {
      body: lessonData.question,
      icon: "/favicon.ico",
      tag: "desklingo-lesson-" + Date.now(), // Unique tag to ensure each notification shows
      requireInteraction: false,
      silent: false
    });

    console.log("✅ Notification object created:", {
      title: notification.title,
      body: notification.body,
      tag: notification.tag
    });

    // Handle notification click - redirect to specific lesson
    notification.onclick = function() {
      console.log("Notification clicked, redirecting to:", lessonData.lessonPath);
      console.log("Full URL will be:", lessonData.lessonPath + (lessonData.isReview ? "?from=notification&mode=review" : "?from=notification"));
      
      try {
        window.focus();
        // Navigate to the specific lesson with a notification flag and review status
        const urlParams = lessonData.isReview ? "?from=notification&mode=review" : "?from=notification";
        const fullUrl = lessonData.lessonPath + urlParams;
        
        // Force navigation by opening a new window/tab or redirecting current window
        if (window.location.origin.includes('languagemate.replit.app') || window.location.origin.includes('localhost')) {
          // Same origin, use direct navigation
          window.location.href = fullUrl;
        } else {
          // Different origin, open new tab
          window.open(fullUrl, '_blank');
        }
        
        notification.close();
        console.log("✅ Navigation initiated successfully");
      } catch (error) {
        console.error("❌ Error during notification click navigation:", error);
        // Fallback - try to open dashboard
        window.location.href = "/dashboard";
        notification.close();
      }
    };

    // Handle notification show event
    notification.onshow = function() {
      console.log("✅ Notification displayed successfully - should be visible in Mac Notification Center");
    };

    // Handle notification error
    notification.onerror = function(error) {
      console.error("❌ Notification error:", error);
    };

    // Handle notification close
    notification.onclose = function() {
      console.log("Notification was closed");
    };

    // Auto close after 15 seconds to give more time to read
    const closeNotification = () => {
      console.log("Auto-closing notification");
      notification.close();
    };
    setTimeout(closeNotification, 15000);
    
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