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
    // Fetch a random lesson question from the API
    const apiUrl = `/api/notification-lesson/${cleanLanguage}`;
    console.log(`🔗 Fetching lesson from: ${apiUrl}`);
    const response = await fetch(apiUrl);
    if (!response.ok) {
      console.error(`Failed to fetch notification lesson: ${response.status} ${response.statusText}`);
      console.error("Response URL was:", response.url);
      return;
    }
    
    const lessonData = await response.json();
    
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
