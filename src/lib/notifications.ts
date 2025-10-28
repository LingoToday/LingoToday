// Notification system for React Native using Expo Notifications
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getLanguageSpecificNotification } from '../screens/DashboardScreenNew';

// Configure notifications behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let notificationScheduleId: string | null = null;

// Register for push notifications
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('language-reminders', {
      name: 'Language Learning Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return null;
    }
    
    try {
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token:', token);
    } catch (error) {
      console.log('Error getting push token:', error);
    }
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  return token;
}

// Check if current time is within user's notification window
function isWithinNotificationWindow(startTime: string = "09:00", endTime: string = "18:00"): boolean {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  const startTimeMinutes = startHour * 60 + startMin;
  const endTimeMinutes = endHour * 60 + endMin;
  
  if (endTimeMinutes <= startTimeMinutes) {
    return currentTime >= startTimeMinutes || currentTime <= endTimeMinutes;
  } else {
    return currentTime >= startTimeMinutes && currentTime <= endTimeMinutes;
  }
}

// // Schedule language learning reminder notifications
// export async function scheduleLanguageLearningReminders(
//   startTime: string = "09:00",
//   endTime: string = "18:00",
//   frequency: number = 4 // times per day
// ): Promise<boolean> {
//   try {
//     // Cancel existing notifications
//     if (notificationScheduleId) {
//       await Notifications.cancelScheduledNotificationAsync(notificationScheduleId);
//     }

//     // Clear all scheduled notifications
//     await Notifications.cancelAllScheduledNotificationsAsync();

//     if (!isWithinNotificationWindow(startTime, endTime)) {
//       console.log('Outside notification window, not scheduling reminders');
//       return false;
//     }

//     const [startHour, startMin] = startTime.split(':').map(Number);
//     const [endHour, endMin] = endTime.split(':').map(Number);
    
//     const startMinutes = startHour * 60 + startMin;
//     const endMinutes = endHour * 60 + endMin;
//     const windowDuration = endMinutes - startMinutes;
//     const interval = Math.floor(windowDuration / frequency);

//     const encouragingMessages = [
//       "Time for a quick language lesson! 🌟",
//       "Ready to practice your new language? 📚",
//       "Your language skills are waiting! ⚡",
//       "Quick lesson break? Your brain will thank you! 🧠",
//       "Language learning time! Let's go! 🚀",
//       "Practice makes perfect! Time for a lesson 💪",
//       "Your daily dose of language learning awaits! 🎯",
//       "Ready to unlock new words today? 🔑"
//     ];

//     // Schedule multiple notifications throughout the day
//     for (let i = 0; i < frequency; i++) {
//       const notificationTime = startMinutes + (interval * i) + Math.random() * 30; // Add some randomness
//       const hour = Math.floor(notificationTime / 60);
//       const minute = Math.floor(notificationTime % 60);

//       const message = encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)];

//       await Notifications.scheduleNotificationAsync({
//         content: {
//           title: "LingoToday Reminder",
//           body: message,
//           sound: 'default',
//           data: { 
//             type: 'language_reminder',
//             timestamp: Date.now()
//           },
//         },
//         trigger: {
//           hour,
//           minute,
//           repeats: true,
//         } as Notifications.CalendarTriggerInput,
//       });
//     }

//     console.log(`Scheduled ${frequency} language learning reminders between ${startTime} and ${endTime}`);
//     return true;
//   } catch (error) {
//     console.error('Error scheduling notifications:', error);
//     return false;
//   }
// }

type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

// Convert Day to weekday number (1=Monday, 7=Sunday) for expo-notifications
function dayToWeekday(day: Day): number {
  const dayMap: Record<Day, number> = {
    'Mon': 2,
    'Tue': 3,
    'Wed': 4,
    'Thu': 5,
    'Fri': 6,
    'Sat': 7,
    'Sun': 1,
  };
  return dayMap[day];
}

// Schedule language learning reminders with custom content, navigation data, and specific days
// frequencyMinutes: minutes between each notification (e.g., 15, 30, 60)
export async function scheduleLanguageLearningReminders(
  startTime: string = "09:00",
  endTime: string = "18:00", 
  frequencyMinutes: number = 60,
  language: string = "italian",
  nextLessonData?: { courseId: string; lessonId: string },
  selectedDays?: Day[]
): Promise<boolean> {
  try {
    // Clear any existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Get language-specific notification content
    const notificationContent = getLanguageSpecificNotification(language);
    
    // Default lesson data if none provided
    const lessonData = nextLessonData || {
      courseId: 'course1',
      lessonId: 'lesson1'
    };

    // Default to all days if not specified
    const daysToSchedule: Day[] = selectedDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Parse start and end times
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    const windowDurationMinutes = endMinutes - startMinutes;
    
    // Calculate how many notifications fit in the window based on frequency
    const notificationsPerDay = Math.max(1, Math.floor(windowDurationMinutes / frequencyMinutes));

    // Schedule notifications for each selected day
    for (const day of daysToSchedule) {
      const weekday = dayToWeekday(day);
      
      // Schedule multiple notifications throughout the day for this weekday
      for (let i = 0; i < notificationsPerDay; i++) {
        const offsetMinutes = (i * frequencyMinutes) + Math.floor(Math.random() * 10);
        const notificationTime = startMinutes + offsetMinutes;
        const hour = Math.floor(notificationTime / 60) % 24;
        const minute = Math.floor(notificationTime % 60);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: notificationContent.title,
            body: notificationContent.body,
            sound: 'default',
            data: {
              type: 'language_reminder',
              language: language,
              action: 'openLesson',
              courseId: lessonData.courseId,
              lessonId: lessonData.lessonId,
              timestamp: Date.now()
            },
          },
          trigger: {
            weekday,
            hour,
            minute,
            repeats: true,
          } as Notifications.CalendarTriggerInput,
        });
      }
    }
    
    console.log(`✅ Scheduled ${notificationsPerDay} notifications per day (every ${frequencyMinutes} min) for ${language} on ${daysToSchedule.join(', ')} between ${startTime} and ${endTime}`);
    return true;
  } catch (error) {
    console.error('Error scheduling notifications:', error);
    return false;
  }
}

// Stop all language learning reminders
export async function stopLanguageLearningReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    notificationScheduleId = null;
    console.log('All language learning reminders stopped');
  } catch (error) {
    console.error('Error stopping notifications:', error);
  }
}

// Get scheduled notifications count
export async function getScheduledNotificationCount(): Promise<number> {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    return notifications.length;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return 0;
  }
}

// Test notification (for debugging)
export async function sendTestNotification(): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "LingoToday Test",
        body: "This is a test notification! 🎉",
        sound: 'default',
      },
      trigger: { seconds: 2 } as Notifications.TimeIntervalTriggerInput,
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
}

// Handle notification received while app is in foreground
export function addNotificationReceivedListener(listener: (notification: Notifications.Notification) => void) {
  return Notifications.addNotificationReceivedListener(listener);
}

// Handle notification tapped
export function addNotificationResponseReceivedListener(listener: (response: Notifications.NotificationResponse) => void) {
  return Notifications.addNotificationResponseReceivedListener(listener);
}

// Get user's notification settings (placeholder - implement with your backend)
export async function getUserNotificationSettings(): Promise<{ 
  startTime: string; 
  endTime: string; 
  frequency: number;
  enabled: boolean;
} | null> {
  // This would typically fetch from your backend API
  // For now, return default settings
  return {
    startTime: "09:00",
    endTime: "18:00", 
    frequency: 4,
    enabled: true,
  };
}

// Save user's notification settings (placeholder - implement with your backend)
export async function saveUserNotificationSettings(settings: {
  startTime: string;
  endTime: string;
  frequency: number;
  enabled: boolean;
}): Promise<boolean> {
  try {
    // This would typically save to your backend API
    console.log('Saving notification settings:', settings);
    
    if (settings.enabled) {
      return await scheduleLanguageLearningReminders(
        settings.startTime,
        settings.endTime,
        settings.frequency
      );
    } else {
      await stopLanguageLearningReminders();
      return true;
    }
  } catch (error) {
    console.error('Error saving notification settings:', error);
    return false;
  }
}