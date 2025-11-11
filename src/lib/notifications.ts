// Notification system for React Native using Expo Notifications
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { getLanguageSpecificNotification } from '../screens/DashboardScreenNew';
import { apiClient } from './apiClient';

// Scheduling lock to prevent concurrent scheduling operations
let isScheduling = false;
let schedulingPromise: Promise<boolean> | null = null;

// Storage keys
const LAST_SCHEDULE_TIME_KEY = '@notifications_last_schedule_time';
const SCHEDULE_PARAMS_KEY = '@notifications_schedule_params';
const PUSH_TOKEN_CACHE_KEY = '@push_token_cache';
const PUSH_TOKEN_REGISTERED_KEY = '@push_token_registered_at';

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

// Register for push notifications and obtain Expo push token
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
      // allowTimeSensitive enables Time Sensitive interruption level for reliable delivery
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

// Register push token with backend for server-side notification delivery
export async function registerPushTokenWithBackend(): Promise<boolean> {
  try {
    // Check if we're on web (no push notifications on web)
    if (Platform.OS === 'web') {
      logNotification('ℹ️', 'Push notifications not supported on web platform');
      return false;
    }

    // Get Expo push token
    const token = await registerForPushNotificationsAsync();
    
    if (!token) {
      logNotification('⚠️', 'Cannot register with backend - no push token available');
      return false;
    }

    // Check cache to avoid redundant uploads
    const cachedToken = await AsyncStorage.getItem(PUSH_TOKEN_CACHE_KEY);
    const lastRegisteredAt = await AsyncStorage.getItem(PUSH_TOKEN_REGISTERED_KEY);
    
    // If token unchanged and registered recently (within 24 hours), skip
    if (cachedToken === token && lastRegisteredAt) {
      const timeSinceRegistration = Date.now() - parseInt(lastRegisteredAt, 10);
      const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
      
      if (timeSinceRegistration < CACHE_DURATION) {
        logNotification('✅', 'Push token already registered (cached)');
        return true;
      }
    }

    // Get device info
    const deviceId = Constants.sessionId || Device.modelName || 'unknown';
    const appVersion = Constants.expoConfig?.version || 'unknown';
    
    // Register with backend
    logNotification('🚀', 'Registering push token with backend...', {
      platform: Platform.OS,
      deviceId,
      appVersion,
    });

    await apiClient.registerPushToken({
      token,
      platform: Platform.OS as 'ios' | 'android',
      deviceId,
      appVersion,
    });

    // Cache token and registration time
    await AsyncStorage.setItem(PUSH_TOKEN_CACHE_KEY, token);
    await AsyncStorage.setItem(PUSH_TOKEN_REGISTERED_KEY, Date.now().toString());
    
    logNotification('✅', 'Push token successfully registered with backend');
    return true;
  } catch (error) {
    logNotification('❌', 'Failed to register push token with backend', error);
    // Don't throw - this is a non-blocking operation
    return false;
  }
}

// Unregister push token from backend
export async function unregisterPushToken(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return false;
    }

    // Get cached token and device ID
    const token = await AsyncStorage.getItem(PUSH_TOKEN_CACHE_KEY);
    const deviceId = Constants.sessionId || Device.modelName || undefined;

    if (!token) {
      logNotification('ℹ️', 'No cached push token to unregister');
      return false;
    }

    logNotification('🚀', 'Unregistering push token from backend...');

    await apiClient.unregisterPushToken({
      token,
      deviceId,
    });

    // Clear cache
    await AsyncStorage.removeItem(PUSH_TOKEN_CACHE_KEY);
    await AsyncStorage.removeItem(PUSH_TOKEN_REGISTERED_KEY);

    logNotification('✅', 'Push token unregistered from backend');
    return true;
  } catch (error) {
    logNotification('❌', 'Failed to unregister push token', error);
    // Still clear cache even if API call fails
    try {
      await AsyncStorage.removeItem(PUSH_TOKEN_CACHE_KEY);
      await AsyncStorage.removeItem(PUSH_TOKEN_REGISTERED_KEY);
    } catch (cacheError) {
      logNotification('⚠️', 'Failed to clear token cache', cacheError);
    }
    return false;
  }
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

// DEPRECATED: Local notification scheduling replaced with backend push notifications
// This function is no longer used - backend now handles all notification scheduling
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
  let endMinutes = endHour * 60 + endMinute;
  
  // Handle cross-midnight windows (e.g., 18:00 to 09:00)
  // If end is before start, add 24 hours to end
  let windowDurationMinutes = endMinutes - startMinutes;
  if (windowDurationMinutes <= 0) {
    windowDurationMinutes += 24 * 60; // Add 24 hours
    logNotification('🌙', `iOS: Detected cross-midnight window (${startTime} to ${endTime})`);
  }
  
  // Calculate time slots within the window, tracking which day offset they belong to
  const timeSlots: { hour: number; minute: number; dayOffset: number }[] = [];
  for (let offsetMinutes = 0; offsetMinutes < windowDurationMinutes; offsetMinutes += frequencyMinutes) {
    const totalMinutes = startMinutes + offsetMinutes;
    const hour = Math.floor(totalMinutes / 60) % 24;
    const minute = totalMinutes % 60;
    // Calculate day offset: if total minutes >= 24*60, it's the next day
    const dayOffset = Math.floor(totalMinutes / (24 * 60));
    timeSlots.push({ hour, minute, dayOffset });
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
      const dayOffset = Math.floor(totalMinutes / (24 * 60));
      adjustedTimeSlots.push({ hour, minute, dayOffset });
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
    const baseWeekday = dayToWeekdayMap[day];
    
    for (const slot of adjustedTimeSlots) {
      // If slot is for the next day (dayOffset > 0), increment weekday
      let targetWeekday = baseWeekday + slot.dayOffset;
      // Wrap weekday: 1-7 range, where 8 becomes 1
      if (targetWeekday > 7) {
        targetWeekday = targetWeekday % 7;
        if (targetWeekday === 0) targetWeekday = 7;
      }
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationContent.title,
          body: notificationContent.body,
          sound: 'default',
          categoryIdentifier: 'language_reminder',
          interruptionLevel: 'timeSensitive' as any,
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
          weekday: targetWeekday,
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

// DEPRECATED: Local notification scheduling replaced with backend push notifications
// This function is no longer used - backend now handles all notification scheduling
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
  let endMinutes = endHour * 60 + endMinute;
  
  // Handle cross-midnight windows (e.g., 18:00 to 09:00)
  // If end is before start, add 24 hours to end
  let windowDurationMinutes = endMinutes - startMinutes;
  if (windowDurationMinutes <= 0) {
    windowDurationMinutes += 24 * 60; // Add 24 hours
    logNotification('🌙', `Android: Detected cross-midnight window (${startTime} to ${endTime})`);
  }
  
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
      const totalNotificationMinutes = startMinutes + offsetMinutes;
      const hour = Math.floor(totalNotificationMinutes / 60) % 24;
      const minute = totalNotificationMinutes % 60;
      
      // Calculate day offset: if total minutes >= 24*60, it's the next day
      const dayOffset = Math.floor(totalNotificationMinutes / (24 * 60));
      
      // Create the exact trigger date/time
      const triggerDate = new Date(targetDate);
      // Add day offset if the time wrapped past midnight
      if (dayOffset > 0) {
        triggerDate.setDate(triggerDate.getDate() + dayOffset);
      }
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

// DEPRECATED: Local notification scheduling replaced with backend push notifications
// This function is no longer used - backend now handles all notification scheduling via push notifications
// Kept for backward compatibility but does nothing
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

// DEPRECATED: Local notification scheduling replaced with backend push notifications
// This function is no longer used - backend controls notification delivery
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

// DEPRECATED: Local notification scheduling replaced with backend push notifications
// This function is no longer needed - backend handles scheduling
// Check if we need to reschedule notifications (if running low)
// Platform-specific logic:
// - iOS: Reschedule if 0 (weekly repeaters should persist, but recreate if missing)
// - Android: Reschedule if below threshold (horizon needs refilling)
export async function checkAndRescheduleIfNeeded(
  startTime: string = "09:00",
  endTime: string = "18:00", 
  frequencyMinutes: number = 60,
  language: string = "italian",
  nextLessonData?: { courseId: string; lessonId: string },
  selectedDays?: Day[]
): Promise<boolean> {
  try {
    logNotification('🔍', `${Platform.OS.toUpperCase()}: Checking if rescheduling is needed`);
    
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
    const count = scheduledNotifications.length;
    
    let shouldReschedule = false;
    
    if (Platform.OS === 'ios') {
      // iOS: Weekly repeaters should persist, but recreate if completely missing
      if (count === 0) {
        logNotification('📅', `iOS: No notifications scheduled, recreating weekly repeaters...`);
        shouldReschedule = true;
      } else {
        logNotification('✅', `iOS: ${count} weekly repeating notifications active`);
      }
    } else {
      // Android: Refill horizon if below threshold
      const ANDROID_MINIMUM_THRESHOLD = 10;
      if (count < ANDROID_MINIMUM_THRESHOLD) {
        logNotification('📅', `Android: Low notification count (${count}), refilling 14-day horizon...`);
        shouldReschedule = true;
      } else {
        logNotification('✅', `Android: ${count} notifications scheduled for horizon`);
      }
    }
    
    if (shouldReschedule) {
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