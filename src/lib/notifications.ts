// Notification system for React Native using Expo Notifications
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLanguageSpecificNotification } from '../screens/DashboardScreenNew';

// Scheduling lock to prevent concurrent scheduling operations
let isScheduling = false;
let schedulingPromise: Promise<boolean> | null = null;

// Storage keys
const LAST_SCHEDULE_TIME_KEY = '@notifications_last_schedule_time';
const SCHEDULE_PARAMS_KEY = '@notifications_schedule_params';

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
    console.log('📱 iOS notification categories configured');
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

// Logging utility
function logNotification(emoji: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  if (data) {
    console.log(`${emoji} [${timestamp}] ${message}`, data);
  } else {
    console.log(`${emoji} [${timestamp}] ${message}`);
  }
}

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
    logNotification('📱', 'Android notification channel configured');
  }

  if (Device.isDevice) {
    const { status: existingStatus, ios } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // Log detailed iOS permission status for debugging
    if (Platform.OS === 'ios' && ios) {
      logNotification('📱', 'iOS Notification Permissions', {
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
          allowCriticalAlerts: false,
          provideAppNotificationSettings: true,
        },
      });
      finalStatus = status;
      
      logNotification('🔔', `Notification permission request result: ${finalStatus}`);
    }
    
    if (finalStatus !== 'granted') {
      logNotification('⚠️', 'Failed to get push token - permission not granted!');
      logNotification('📲', 'User must enable notifications in iOS Settings > LingoToday > Notifications');
      return null;
    }
    
    try {
      token = (await Notifications.getExpoPushTokenAsync()).data;
      logNotification('✅', `Push token obtained: ${token}`);
    } catch (error) {
      logNotification('❌', 'Error getting push token', error);
    }
  } else {
    logNotification('⚠️', 'Must use physical device for Push Notifications');
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

// iOS-specific: Schedule weekly repeating calendar triggers
async function scheduleIOSRepeatingNotifications(
  startTime: string,
  endTime: string,
  frequencyMinutes: number,
  language: string,
  lessonData: { courseId: string; lessonId: string },
  daysToSchedule: Day[]
): Promise<number> {
  const notificationContent = getLanguageSpecificNotification(language);
  
  // Parse start and end times
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  const windowDurationMinutes = endMinutes - startMinutes;
  
  // Calculate time slots within the window
  const timeSlots: { hour: number; minute: number }[] = [];
  for (let offsetMinutes = 0; offsetMinutes < windowDurationMinutes; offsetMinutes += frequencyMinutes) {
    const totalMinutes = startMinutes + offsetMinutes;
    const hour = Math.floor(totalMinutes / 60) % 24;
    const minute = totalMinutes % 60;
    timeSlots.push({ hour, minute });
  }
  
  // iOS has a limit of 64 total notifications, so we need to cap
  const MAX_IOS_NOTIFICATIONS = 64;
  const totalNeeded = timeSlots.length * daysToSchedule.length;
  
  let adjustedFrequency = frequencyMinutes;
  let adjustedTimeSlots = timeSlots;
  
  // Auto-adjust if we exceed the limit
  if (totalNeeded > MAX_IOS_NOTIFICATIONS) {
    logNotification('⚠️', `iOS: Requested ${totalNeeded} notifications exceeds limit (${MAX_IOS_NOTIFICATIONS}). Auto-adjusting...`);
    
    // Calculate what frequency we need to stay under the limit
    const maxSlotsPerDay = Math.floor(MAX_IOS_NOTIFICATIONS / daysToSchedule.length);
    const adjustedFreq = Math.ceil(windowDurationMinutes / maxSlotsPerDay);
    
    adjustedTimeSlots = [];
    for (let offsetMinutes = 0; offsetMinutes < windowDurationMinutes; offsetMinutes += adjustedFreq) {
      const totalMinutes = startMinutes + offsetMinutes;
      const hour = Math.floor(totalMinutes / 60) % 24;
      const minute = totalMinutes % 60;
      adjustedTimeSlots.push({ hour, minute });
    }
    
    adjustedFrequency = adjustedFreq;
    logNotification('✅', `iOS: Adjusted to ${adjustedTimeSlots.length} slots per day (${adjustedFreq} min frequency)`);
  }
  
  let scheduledCount = 0;
  
  // Day name to weekday number mapping for expo-notifications
  // In expo-notifications: 1=Sunday, 2=Monday, ..., 7=Saturday
  const dayToWeekdayMap: Record<Day, number> = {
    'Sun': 1,
    'Mon': 2,
    'Tue': 3,
    'Wed': 4,
    'Thu': 5,
    'Fri': 6,
    'Sat': 7,
  };
  
  // Schedule repeating notifications for each day and time slot
  for (const day of daysToSchedule) {
    const weekday = dayToWeekdayMap[day];
    
    for (const slot of adjustedTimeSlots) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationContent.title,
          body: notificationContent.body,
          sound: 'default',
          categoryIdentifier: 'language_reminder',
          interruptionLevel: 'active' as any,
          data: {
            type: 'language_reminder',
            language: language,
            action: 'openLesson',
            courseId: lessonData.courseId,
            lessonId: lessonData.lessonId,
            timestamp: Date.now(),
          },
        },
        trigger: {
          weekday: weekday,
          hour: slot.hour,
          minute: slot.minute,
          repeats: true,
        } as Notifications.CalendarTriggerInput,
      });
      
      scheduledCount++;
    }
  }
  
  logNotification('✅', `iOS: Scheduled ${scheduledCount} weekly repeating notifications`, {
    days: daysToSchedule.join(', '),
    slotsPerDay: adjustedTimeSlots.length,
    effectiveFrequency: adjustedFrequency,
  });
  
  return scheduledCount;
}

// Android-specific: Schedule notifications for next N days with specific dates
async function scheduleAndroidHorizonNotifications(
  startTime: string,
  endTime: string,
  frequencyMinutes: number,
  language: string,
  lessonData: { courseId: string; lessonId: string },
  daysToSchedule: Day[]
): Promise<number> {
  const notificationContent = getLanguageSpecificNotification(language);
  
  // Parse start and end times
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  const windowDurationMinutes = endMinutes - startMinutes;
  
  // Calculate how many notifications fit in the window based on frequency
  const notificationsPerDay = Math.max(1, Math.floor(windowDurationMinutes / frequencyMinutes));
  
  // Safety limit for Android
  const MAX_ANDROID_NOTIFICATIONS = 100;
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
      if (scheduledCount >= MAX_ANDROID_NOTIFICATIONS) {
        logNotification('⚠️', `Android: Reached max notification limit (${MAX_ANDROID_NOTIFICATIONS})`);
        break;
      }
      
      const offsetMinutes = i * frequencyMinutes;
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
            data: {
              type: 'language_reminder',
              language: language,
              action: 'openLesson',
              courseId: lessonData.courseId,
              lessonId: lessonData.lessonId,
              timestamp: Date.now(),
              scheduledFor: triggerDate.toISOString(),
            },
          },
          trigger: {
            channelId: 'language-reminders',
            date: triggerDate,
          } as Notifications.NotificationTriggerInput,
        });
        
        scheduledCount++;
      }
    }
    
    if (scheduledCount >= MAX_ANDROID_NOTIFICATIONS) {
      break;
    }
  }
  
  logNotification('✅', `Android: Scheduled ${scheduledCount} horizon-based notifications for next ${daysToScheduleAhead} days`, {
    frequencyMinutes,
    days: daysToSchedule.join(', '),
  });
  
  return scheduledCount;
}

// Schedule language learning reminders with platform-specific strategies
// iOS: Weekly repeating calendar triggers
// Android: Horizon-based scheduling for next 14 days
export async function scheduleLanguageLearningReminders(
  startTime: string = "09:00",
  endTime: string = "18:00", 
  frequencyMinutes: number = 60,
  language: string = "italian",
  nextLessonData?: { courseId: string; lessonId: string },
  selectedDays?: Day[]
): Promise<boolean> {
  // Lock mechanism: if already scheduling, return the existing promise
  if (isScheduling && schedulingPromise) {
    logNotification('🔒', 'Scheduling already in progress, returning existing promise');
    return schedulingPromise;
  }

  // Set the lock
  isScheduling = true;
  
  // Create the scheduling promise
  schedulingPromise = (async () => {
    try {
      logNotification('🚀', `Starting ${Platform.OS.toUpperCase()} notification scheduling`, {
        platform: Platform.OS,
        startTime,
        endTime,
        frequencyMinutes,
        language,
        selectedDays,
      });

      // ALWAYS clear existing notifications first
      await Notifications.cancelAllScheduledNotificationsAsync();
      logNotification('🧹', 'Cleared all existing notifications');
    
      // Default lesson data if none provided
      const lessonData = nextLessonData || {
        courseId: 'course1',
        lessonId: 'lesson1'
      };

      // Default to all days if not specified
      const daysToSchedule: Day[] = selectedDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

      let scheduledCount = 0;
      
      // Platform-specific scheduling
      if (Platform.OS === 'ios') {
        scheduledCount = await scheduleIOSRepeatingNotifications(
          startTime,
          endTime,
          frequencyMinutes,
          language,
          lessonData,
          daysToSchedule
        );
      } else {
        scheduledCount = await scheduleAndroidHorizonNotifications(
          startTime,
          endTime,
          frequencyMinutes,
          language,
          lessonData,
          daysToSchedule
        );
      }
      
      // Log all scheduled notifications for debugging
      const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
      logNotification('📅', `Total scheduled notifications: ${allScheduled.length}`);
      
      if (Platform.OS === 'ios') {
        logNotification('ℹ️', 'iOS: Using weekly repeating calendar triggers');
        logNotification('⚠️', 'iOS: If notifications don\'t appear:');
        logNotification('📲', '1. Check Settings > Focus - ensure LingoToday is allowed');
        logNotification('📲', '2. Check Settings > Notifications > LingoToday - ensure all options enabled');
      } else {
        logNotification('ℹ️', `Android: Scheduled for next 14 days`);
      }
      
      // Store scheduling metadata in AsyncStorage
      const scheduleMetadata = {
        lastScheduleTime: Date.now(),
        params: {
          startTime,
          endTime,
          frequencyMinutes,
          language,
          selectedDays: daysToSchedule,
        },
        scheduledCount,
        platform: Platform.OS,
      };
      await AsyncStorage.setItem(LAST_SCHEDULE_TIME_KEY, scheduleMetadata.lastScheduleTime.toString());
      await AsyncStorage.setItem(SCHEDULE_PARAMS_KEY, JSON.stringify(scheduleMetadata.params));
      
      return true;
    } catch (error) {
      logNotification('❌', 'Error scheduling notifications', error);
      return false;
    } finally {
      // Always release the lock
      isScheduling = false;
      schedulingPromise = null;
      logNotification('🔓', 'Scheduling lock released');
    }
  })();
  
  return schedulingPromise;
}

// Stop all language learning reminders
export async function stopLanguageLearningReminders(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    notificationScheduleId = null;
    
    // Clear scheduling metadata from AsyncStorage
    await AsyncStorage.removeItem(LAST_SCHEDULE_TIME_KEY);
    await AsyncStorage.removeItem(SCHEDULE_PARAMS_KEY);
    
    logNotification('🛑', 'All language learning reminders stopped and metadata cleared');
  } catch (error) {
    logNotification('❌', 'Error stopping notifications', error);
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
// Includes debouncing to prevent multiple rapid calls
export async function checkAndRescheduleIfNeeded(
  startTime: string = "09:00",
  endTime: string = "18:00", 
  frequencyMinutes: number = 60,
  language: string = "italian",
  nextLessonData?: { courseId: string; lessonId: string },
  selectedDays?: Day[]
): Promise<boolean> {
  try {
    logNotification('🔍', 'Checking if rescheduling is needed');
    
    // Debounce: Check last schedule time to prevent rapid rescheduling
    const lastScheduleTimeStr = await AsyncStorage.getItem(LAST_SCHEDULE_TIME_KEY);
    if (lastScheduleTimeStr) {
      const lastScheduleTime = parseInt(lastScheduleTimeStr, 10);
      const timeSinceLastSchedule = Date.now() - lastScheduleTime;
      const DEBOUNCE_INTERVAL = 30000; // 30 seconds
      
      if (timeSinceLastSchedule < DEBOUNCE_INTERVAL) {
        logNotification('⏱️', `Skipping reschedule - last scheduled ${Math.round(timeSinceLastSchedule / 1000)}s ago (debounce: ${DEBOUNCE_INTERVAL / 1000}s)`);
        return false;
      }
    }
    
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    // If we have less than 10 notifications scheduled, reschedule
    const MINIMUM_THRESHOLD = 10;
    
    if (scheduledNotifications.length < MINIMUM_THRESHOLD) {
      logNotification('📅', `Low notification count (${scheduledNotifications.length}), rescheduling...`);
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
    
    logNotification('✅', `Sufficient notifications scheduled (${scheduledNotifications.length}), no rescheduling needed`);
    return false;
  } catch (error) {
    logNotification('❌', 'Error checking/rescheduling notifications', error);
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