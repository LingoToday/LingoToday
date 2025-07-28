let notificationInterval: NodeJS.Timeout | null = null;

export async function setupNotifications(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    throw new Error("This browser does not support notifications");
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    return "denied";
  }

  // Request permission
  const permission = await Notification.requestPermission();
  return permission;
}

export function scheduleNotification(language: string, frequencyMinutes: number) {
  // Clear existing interval
  if (notificationInterval) {
    console.log("Clearing existing notification interval");
    clearInterval(notificationInterval);
  }

  // Don't schedule if notifications aren't granted
  if (!("Notification" in window) || Notification.permission !== "granted") {
    console.log("Notifications not available or not granted:", Notification.permission);
    return;
  }

  console.log(`🔔 Scheduling notifications for ${language} every ${frequencyMinutes} minutes`);
  
  // For testing: Use much shorter intervals to debug
  const intervalMs = Math.min(frequencyMinutes * 60 * 1000, 30000); // Max 30 seconds for testing
  console.log(`⏰ Notification interval set to: ${intervalMs}ms (${frequencyMinutes} minutes requested, using ${intervalMs/1000}s for testing)`);

  // Set up recurring notifications using function reference
  const triggerScheduledNotification = () => {
    const now = new Date().toLocaleTimeString();
    console.log(`🚀 [${now}] Triggering scheduled notification for ${language}`);
    showLearningNotification(language);
  };
  
  notificationInterval = setInterval(triggerScheduledNotification, intervalMs);
  console.log("✅ Notification interval created with ID:", notificationInterval);

  // Show first notification after a short delay using function reference
  const showInitialNotification = () => {
    const now = new Date().toLocaleTimeString();
    console.log(`🎯 [${now}] Showing initial notification for ${language}`);
    showLearningNotification(language);
  };
  
  // Shorter delay for testing
  setTimeout(showInitialNotification, 3000); // 3 seconds delay
  console.log("⏲️ Initial notification scheduled in 3 seconds");
}

export function stopNotifications() {
  if (notificationInterval) {
    console.log("🛑 Stopping notification scheduling");
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
    console.log(`🔗 Using local lessons data (no API call needed)`);
    
    // Import lessons data directly (defined at top of file)
    const lessonsData = {
      "italian": {
        "week_1": {
          "day_1": {
            "id": "italian_w1_d1",
            "title": "Basic Greetings",
            "quiz": {
              "question": "How do you say 'Hello' in Italian?",
              "correct_answer": "Ciao",
              "options": ["Ciao", "Grazie", "Prego", "Arrivederci"]
            }
          },
          "day_2": {
            "id": "italian_w1_d2",
            "title": "Numbers 1–10",
            "quiz": {
              "question": "How do you say 'five' in Italian?",
              "correct_answer": "cinque",
              "options": ["quattro", "cinque", "sei", "sette"]
            }
          }
        },
        "week_2": {
          "day_1": {
            "id": "italian_w2_d1",
            "title": "Family Members",
            "quiz": {
              "question": "How do you say 'mother' in Italian?",
              "correct_answer": "madre",
              "options": ["padre", "madre", "fratello", "sorella"]
            }
          },
          "day_2": {
            "id": "italian_w2_d2",
            "title": "Numbers 11–20",
            "quiz": {
              "question": "How do you say 'fifteen' in Italian?",
              "correct_answer": "quindici",
              "options": ["dodici", "tredici", "quattordici", "quindici"]
            }
          },
          "day_3": {
            "id": "italian_w2_d3",
            "title": "Days of the Week",
            "quiz": {
              "question": "How do you say 'Monday' in Italian?",
              "correct_answer": "lunedì",
              "options": ["lunedì", "martedì", "mercoledì", "giovedì"]
            }
          },
          "day_4": {
            "id": "italian_w2_d4",
            "title": "Yes/No Questions",
            "quiz": {
              "question": "How do you ask 'Do you speak English?' in Italian?",
              "correct_answer": "Parli inglese?",
              "options": ["Come stai?", "Parli inglese?", "Dove sei?", "Quanto costa?"]
            }
          }
        }
      }
    };
    
    // Get lessons from local data
    const languageLessons = lessonsData[cleanLanguage];
    
    if (!languageLessons) {
      console.error(`No lessons found for language: ${cleanLanguage}`);
      return;
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
      console.error(`No lessons found for ${cleanLanguage}`);
      return;
    }
    
    // Pick a random lesson
    const randomIndex = Math.floor(Math.random() * allLessons.length);
    const { lesson, week, day } = allLessons[randomIndex];
    
    const lessonData = {
      question: lesson.quiz.question,
      lessonPath: `/lesson/${cleanLanguage}/${week}/${day}`,
      week,
      day,
      title: lesson.title
    };
    
    console.log("Creating notification with content:", {
      title: `${language.charAt(0).toUpperCase() + language.slice(1)} Learning`,
      body: lessonData.question,
      icon: "/favicon.ico"
    });

    // More compatible notification options for macOS
    const languageTitle = cleanLanguage.charAt(0).toUpperCase() + cleanLanguage.slice(1);
    const notification = new Notification(`${languageTitle} Learning`, {
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
      window.focus();
      // Navigate to the specific lesson with a notification flag
      window.location.href = lessonData.lessonPath + "?from=notification";
      notification.close();
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

// Clean up on page unload
window.addEventListener("beforeunload", () => {
  stopNotifications();
});
