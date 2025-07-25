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
    clearInterval(notificationInterval);
  }

  // Don't schedule if notifications aren't granted
  if (!("Notification" in window) || Notification.permission !== "granted") {
    console.log("Notifications not available or not granted:", Notification.permission);
    return;
  }

  console.log(`Scheduling notifications for ${language} every ${frequencyMinutes} minutes`);

  // Set up recurring notifications using function reference
  const triggerScheduledNotification = () => {
    console.log("Triggering scheduled notification");
    showLearningNotification(language);
  };
  notificationInterval = setInterval(triggerScheduledNotification, frequencyMinutes * 60 * 1000);

  // Show first notification after a short delay using function reference
  const showInitialNotification = () => {
    console.log("Showing initial notification");
    showLearningNotification(language);
  };
  setTimeout(showInitialNotification, 2000); // 2 seconds delay for quicker testing
}

export function stopNotifications() {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
}

async function showLearningNotification(language: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    console.log("Cannot show notification - permission not granted");
    return;
  }
  
  console.log(`Showing notification for ${language}`);

  try {
    // Fetch a random lesson question from the API
    const response = await fetch(`/api/notification-lesson/${language}`);
    if (!response.ok) {
      console.error("Failed to fetch notification lesson:", response.statusText);
      return;
    }
    
    const lessonData = await response.json();
    
    console.log("Creating notification with content:", {
      title: `${language.charAt(0).toUpperCase() + language.slice(1)} Learning`,
      body: lessonData.question,
      icon: "/favicon.ico"
    });

    // More compatible notification options for macOS
    const notification = new Notification(`${language.charAt(0).toUpperCase() + language.slice(1)} Learning`, {
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
