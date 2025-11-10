// Notification system for React Native using Expo Notifications
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getLanguageSpecificNotification } from '../screens/DashboardScreenNew';

// Configure notification categories for iOS background notifications
async function setupNotificationCategories() {
  if (Platform.OS === 'ios') {
    await Notifications.setNotificationCategoryAsync('language_reminder', [
      {
        identifier: 'open_lesson',
        buttonTitle: 'Start Lesson',
        options: {
          opensAppToForeground: true,
        },
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Dismiss',
        options: {
          opensAppToForeground: false,
        },
      },
    ]);
  }
}

// Initialize notification categories on module load
setupNotificationCategories();

// Configure notifications behavior
// This determines how notifications are presented when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    priority: Notifications.AndroidNotificationPriority.MAX,
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
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus, ios } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // Log detailed iOS permission status for debugging
    if (Platform.OS === 'ios' && ios) {
      console.log('📱 iOS Notification Permissions:', {
        status: ios.status,
        allowsAlert: ios.allowsAlert,
        allowsBadge: ios.allowsBadge,
        allowsSound: ios.allowsSound,
      });
    }
    
    if (existingStatus !== 'granted') {
      // Request permissions with iOS-specific options for background notifications
      // Note: allowAlert enables both lock screen and notification center display
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowCriticalAlerts: false, // Set to false unless app qualifies for critical alerts
          provideAppNotificationSettings: true,
        },
      });
      finalStatus = status;
      
      console.log('🔔 Notification permission request result:', finalStatus);
    }
    
    if (finalStatus !== 'granted') {
      console.log('⚠️ Failed to get push token - permission not granted!');
      console.log('📲 User must enable notifications in iOS Settings > LingoToday > Notifications');
      return null;
    }
    
    try {
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('✅ Push token obtained:', token);
    } catch (error) {
      console.log('❌ Error getting push token:', error);
    }
  } else {
    console.log('⚠️ Must use physical device for Push Notifications');
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
// This schedules notifications for the next 14 days only (not repeating) to prevent accumulation
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
    
    // Safety limit: max 50 notifications total
    const MAX_NOTIFICATIONS = 50;
    let scheduledCount = 0;

    // Get day name mapping (0 = Sunday, 1 = Monday, etc.)
    const dayNameToNumber: Record<Day, number> = {
      'Sun': 0,
      'Mon': 1,
      'Tue': 2,
      'Wed': 3,
      'Thu': 4,
      'Fri': 5,
      'Sat': 6,
    };

    // Schedule notifications for the next 14 days
    const now = new Date();
    const daysToScheduleAhead = 14;
    
    for (let dayOffset = 0; dayOffset < daysToScheduleAhead; dayOffset++) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + dayOffset);
      
      // Get day name for this date
      const dayNumber = targetDate.getDay(); // 0-6
      const dayName = Object.keys(dayNameToNumber).find(
        key => dayNameToNumber[key as Day] === dayNumber
      ) as Day;
      
      // Skip if this day is not in the selected days
      if (!daysToSchedule.includes(dayName)) {
        continue;
      }
      
      // Schedule notifications for this day
      for (let i = 0; i < notificationsPerDay; i++) {
        if (scheduledCount >= MAX_NOTIFICATIONS) {
          console.log(`⚠️ Reached max notification limit (${MAX_NOTIFICATIONS})`);
          break;
        }
        
        const offsetMinutes = (i * frequencyMinutes) + Math.floor(Math.random() * 5); // Smaller random offset
        const notificationTime = startMinutes + offsetMinutes;
        const hour = Math.floor(notificationTime / 60) % 24;
        const minute = Math.floor(notificationTime % 60);

        // Create the exact trigger date/time
        const triggerDate = new Date(targetDate);
        triggerDate.setHours(hour, minute, 0, 0);
        
        // Only schedule if the notification is in the future
        if (triggerDate > now) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: notificationContent.title,
              body: notificationContent.body,
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.MAX,
              ...(Platform.OS === 'android' ? { channelId: 'language-reminders' } : {}),
              ...(Platform.OS === 'ios' ? { 
                categoryIdentifier: 'language_reminder',
                interruptionLevel: 'timeSensitive' as any,
              } : {}),
              data: {
                type: 'language_reminder',
                language: language,
                action: 'openLesson',
                courseId: lessonData.courseId,
                lessonId: lessonData.lessonId,
                timestamp: Date.now(),
                scheduledFor: triggerDate.toISOString()
              },
            },
            trigger: {
              date: triggerDate,
            } as Notifications.DateTriggerInput,
          });
          
          scheduledCount++;
        }
      }
      
      if (scheduledCount >= MAX_NOTIFICATIONS) {
        break;
      }
    }
    
    console.log(`✅ Scheduled ${scheduledCount} notifications for next ${daysToScheduleAhead} days (${frequencyMinutes} min frequency) for ${language} on ${daysToSchedule.join(', ')} between ${startTime} and ${endTime}`);
    
    // Log all scheduled notifications for debugging
    const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`📅 Total scheduled notifications: ${allScheduled.length}`);
    if (Platform.OS === 'ios') {
      console.log('⚠️ iOS IMPORTANT: If notifications don\'t appear when locked/backgrounded:');
      console.log('   1. Check Settings > Focus - ensure LingoToday is allowed in active Focus modes');
      console.log('   2. Check Settings > Notifications > LingoToday - ensure all options are enabled');
      console.log('   3. Time Sensitive notifications may be blocked by Focus modes');
    }
    
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

// Check if we need to reschedule notifications (if running low)
// Returns true if rescheduling was performed
export async function checkAndRescheduleIfNeeded(
  startTime: string = "09:00",
  endTime: string = "18:00", 
  frequencyMinutes: number = 60,
  language: string = "italian",
  nextLessonData?: { courseId: string; lessonId: string },
  selectedDays?: Day[]
): Promise<boolean> {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    // If we have less than 10 notifications scheduled, reschedule
    const MINIMUM_THRESHOLD = 10;
    
    if (scheduledNotifications.length < MINIMUM_THRESHOLD) {
      console.log(`📅 Low notification count (${scheduledNotifications.length}), rescheduling...`);
      await scheduleLanguageLearningReminders(
        startTime,
        endTime,
        frequencyMinutes,
        language,
        nextLessonData,
        selectedDays
      );
      return true;
    }
    
    console.log(`✅ Sufficient notifications scheduled (${scheduledNotifications.length}), no rescheduling needed`);
    return false;
  } catch (error) {
    console.error('Error checking/rescheduling notifications:', error);
    return false;
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
        ...(Platform.OS === 'android' ? { 
          channelId: 'language-reminders',
          priority: Notifications.AndroidNotificationPriority.MAX,
        } : {}),
        ...(Platform.OS === 'ios' ? { 
          categoryIdentifier: 'language_reminder',
          interruptionLevel: 'timeSensitive' as any,
        } : {}),
        data: {
          type: 'test_notification',
          action: 'openLesson',
          courseId: 'test',
          lessonId: 'test',
          timestamp: Date.now()
        },
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
// NOTE: This function is deprecated - use the API client and NotificationSettings component instead
export async function saveUserNotificationSettings(settings: {
  startTime: string;
  endTime: string;
  frequencyMinutes: number; // Minutes between each notification
  enabled: boolean;
}): Promise<boolean> {
  try {
    // This would typically save to your backend API
    console.log('Saving notification settings:', settings);
    
    if (settings.enabled) {
      return await scheduleLanguageLearningReminders(
        settings.startTime,
        settings.endTime,
        settings.frequencyMinutes
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