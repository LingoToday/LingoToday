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

function showLearningNotification(language: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    console.log("Cannot show notification - permission not granted");
    return;
  }
  
  console.log(`Showing notification for ${language}`);

  // Sample lesson prompts
  const prompts = {
    spanish: [
      { question: "What does 'gracias' mean?", answer: "Thank you" },
      { question: "How do you say 'Hello' in Spanish?", answer: "¡Hola!" },
      { question: "What does 'adiós' mean?", answer: "Goodbye" },
      { question: "How do you say 'Please' in Spanish?", answer: "Por favor" },
      { question: "What does 'buenos días' mean?", answer: "Good morning" },
    ],
    italian: [
      { question: "What does 'ciao' mean?", answer: "Hello/Goodbye" },
      { question: "How do you say 'Thank you' in Italian?", answer: "Grazie" },
      { question: "What does 'buongiorno' mean?", answer: "Good morning" },
    ],
    french: [
      { question: "What does 'bonjour' mean?", answer: "Hello/Good morning" },
      { question: "How do you say 'Thank you' in French?", answer: "Merci" },
      { question: "What does 'au revoir' mean?", answer: "Goodbye" },
    ],
    german: [
      { question: "What does 'hallo' mean?", answer: "Hello" },
      { question: "How do you say 'Thank you' in German?", answer: "Danke" },
      { question: "What does 'auf wiedersehen' mean?", answer: "Goodbye" },
    ],
  };

  const languagePrompts = prompts[language as keyof typeof prompts] || prompts.spanish;
  const randomPrompt = languagePrompts[Math.floor(Math.random() * languagePrompts.length)];

  console.log("Creating notification with content:", {
    title: `${language.charAt(0).toUpperCase() + language.slice(1)} Learning`,
    body: randomPrompt.question,
    icon: "/favicon.ico"
  });

  try {
    const notification = new Notification(`${language.charAt(0).toUpperCase() + language.slice(1)} Learning`, {
      body: randomPrompt.question,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "desklingo-lesson",
      requireInteraction: false, // Changed to false for better browser compatibility
      silent: false
    });

    console.log("Notification created successfully:", notification);

    // Handle notification click
    notification.onclick = function() {
      console.log("Notification clicked");
      window.focus();
      // Navigate to the app
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
      notification.close();
    };

    // Handle notification show event
    notification.onshow = function() {
      console.log("Notification displayed successfully");
    };

    // Handle notification error
    notification.onerror = function(error) {
      console.error("Notification error:", error);
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
