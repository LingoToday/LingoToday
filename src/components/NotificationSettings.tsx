import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../lib/theme';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Switch } from './ui/Switch';
import { Select } from './ui/Select';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

interface UserSettings {
  userId: string;
  language: string;
  theme: string;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  notificationFrequency: number;
  notificationStartTime: string;
  notificationEndTime: string;
  difficultyLevel: string;
}

// Helper function to get language display name
function getLanguageDisplayName(code: string): string {
  const languages: { [key: string]: string } = {
    italian: 'Italian',
    spanish: 'Spanish',
    french: 'French',
    german: 'German',
    portuguese: 'Portuguese',
    mandarin: 'Mandarin',
    japanese: 'Japanese',
    korean: 'Korean',
  };
  return languages[code?.toLowerCase()] || code?.charAt(0).toUpperCase() + code?.slice(1) || 'Language';
}

export default function NotificationSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // REMOVED: All device permission checking - we'll use DB only
  const [devicePermissionStatus, setDevicePermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  // FIXED: Use only the /api/settings route for all notification data
  const { data: settings, isLoading, error } = useQuery<UserSettings>({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      try {
        console.log('📊 Fetching settings from /api/settings');
        const result = await apiClient.getUserSettings();
        console.log('✅ Settings fetched:', result);
        return result;
      } catch (error) {
        console.error('❌ Settings fetch error:', error);
        // Return default settings instead of throwing
        return {
          userId: user?.id || '',
          language: user?.selectedLanguage || 'italian',
          theme: 'light',
          soundEnabled: true,
          notificationsEnabled: false,
          notificationFrequency: 15,
          notificationStartTime: '09:00',
          notificationEndTime: '18:00',
          difficultyLevel: 'beginner',
        } as UserSettings;
      }
    },
    enabled: !!user,
    retry: 1,
    staleTime: 30000, // 30 seconds
  });

  // Check device permission only once on mount (for display purposes only)
  useEffect(() => {
    const checkDevicePermission = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        setDevicePermissionStatus(status);
      } catch (error) {
        console.warn('Could not check device notification permission:', error);
      }
    };
    
    checkDevicePermission();
  }, []);

  // FIXED: Update settings mutation - uses /api/settings route
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<UserSettings>) => {
      try {
        console.log('💾 Updating settings:', updatedSettings);
        
        // FIXED: Clean the settings object before sending
        const cleanedSettings = { ...updatedSettings };
        
        // Remove timestamp fields and other metadata that shouldn't be sent
        delete (cleanedSettings as any).createdAt;
        delete (cleanedSettings as any).updatedAt;
        delete (cleanedSettings as any).userId; // Server will set this
        
        console.log('💾 Cleaned settings for API:', cleanedSettings);
        
        const result = await apiClient.updateUserSettings(cleanedSettings);
        console.log('✅ Settings updated successfully:', result);
        return result;
      } catch (error) {
        console.error('❌ Settings update failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      
      console.log('🔄 Settings cache invalidated');
      
      Alert.alert(
        'Settings Updated',
        'Your notification preferences have been saved.',
        [{ text: 'OK' }]
      );
    },
    onError: (error) => {
      console.error('❌ Settings update error:', error);
      Alert.alert(
        'Update Failed',
        'Failed to save settings. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  // Generate time options for dropdowns (24-hour format)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        options.push({ label: displayTime, value: time });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  // FIXED: Handle notification toggle - uses DB state as source of truth
  const handleNotificationToggle = async (enabled: boolean) => {
    try {
      // If enabling notifications, check device permission first
      if (enabled && devicePermissionStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        setDevicePermissionStatus(status);
        
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please allow notifications in your device settings to enable this feature.',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Open Settings', 
                onPress: () => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                }
              }
            ]
          );
          return; // Don't update DB if permission denied
        }
      }

      // FIXED: Only send the fields that should be updated
      const updateData = {
        language: settings?.language || 'italian',
        theme: settings?.theme || 'light',
        soundEnabled: settings?.soundEnabled ?? true,
        notificationsEnabled: enabled, // This is the main change
        notificationFrequency: settings?.notificationFrequency || 15,
        notificationStartTime: settings?.notificationStartTime || '09:00',
        notificationEndTime: settings?.notificationEndTime || '18:00',
        difficultyLevel: settings?.difficultyLevel || 'beginner',
      };

      console.log('🔄 Sending clean settings update:', updateData);

      await updateSettingsMutation.mutateAsync(updateData);

      // Handle notification scheduling based on database state
      if (!enabled) {
        console.log('🛑 Notifications disabled in DB - canceling scheduled notifications');
        await Notifications.cancelAllScheduledNotificationsAsync();
      } else {
        console.log('✅ Notifications enabled in DB - ready for daily session scheduling');
      }
    } catch (error) {
      console.error('❌ Error toggling notifications:', error);
      Alert.alert(
        'Error',
        'Failed to update notification settings. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // FIXED: Handle language change - uses DB route
  const handleLanguageChange = (language: string) => {
    updateSettingsMutation.mutate({
      ...settings,
      language: language, // Note: API expects 'language' not 'selectedLanguage'
    });
  };

  // FIXED: Handle frequency change - uses DB route
  const handleFrequencyChange = (frequency: string) => {
    const newFrequency = parseInt(frequency);
    updateSettingsMutation.mutate({
      ...settings,
      notificationFrequency: newFrequency,
    });
  };

  // FIXED: Handle time changes - uses DB route
  const handleStartTimeChange = (startTime: string) => {
    updateSettingsMutation.mutate({
      ...settings,
      notificationStartTime: startTime,
    });
  };

  const handleEndTimeChange = (endTime: string) => {
    updateSettingsMutation.mutate({
      ...settings,
      notificationEndTime: endTime,
    });
  };

  // FIXED: Test notification functions - check both DB and device state
  const handleSimpleTest = async () => {
    try {
      // Check database state first
      if (!settings?.notificationsEnabled) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in settings first.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Check device permission
      if (devicePermissionStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow notifications in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 LingoToday Test',
          body: 'This is a test notification. If you see this, notifications are working!',
          sound: true,
        },
        trigger: null, // Show immediately
      });
      
      Alert.alert(
        'Test Sent',
        'Check if you received the notification.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Test notification error:', error);
      Alert.alert(
        'Test Failed',
        'Failed to send test notification.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleFullTest = async () => {
    try {
      if (!settings?.notificationsEnabled) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in settings first.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (devicePermissionStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow notifications in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      const language = getLanguageDisplayName(settings.language || 'italian');
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${language} Learning Reminder`,
          body: `Time for your ${language} lesson! Keep your streak going! 🔥`,
          sound: true,
        },
        trigger: null, // Show immediately
      });
      
      Alert.alert(
        'Full Test Sent',
        'This simulates a real learning notification.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Full test error:', error);
      Alert.alert(
        'Test Failed',
        'Failed to send test notification.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleScheduleTest = async () => {
    try {
      if (!settings?.notificationsEnabled) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in settings first.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (devicePermissionStatus !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow notifications in your device settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Scheduled Test',
          body: 'This notification was scheduled 1 minute ago for testing.',
          sound: true,
        },
        trigger: { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 60 },
      });
      
      Alert.alert(
        'Test Scheduled',
        'You should receive a notification in 1 minute.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Schedule Failed',
        'Failed to schedule test notification.',
        [{ text: 'OK' }]
      );
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Card style={styles.card}>
        <CardContent style={styles.loadingContent}>
          <View style={styles.loadingContainer}>
            <View style={styles.loadingSkeleton} />
            <View style={styles.loadingSkeleton} />
            <View style={styles.loadingSkeleton} />
          </View>
        </CardContent>
      </Card>
    );
  }

  // Error state (shouldn't happen with fallback)
  if (!settings) {
    return (
      <Card style={styles.card}>
        <CardContent style={styles.errorContent}>
          <Text style={styles.errorText}>Unable to load notification settings</Text>
        </CardContent>
      </Card>
    );
  }

  // FIXED: Determine notification status based on DB state
  const isNotificationsEnabled = settings.notificationsEnabled;
  const needsDevicePermission = isNotificationsEnabled && devicePermissionStatus !== 'granted';
  const isFullyEnabled = isNotificationsEnabled && devicePermissionStatus === 'granted';

  return (
    <Card style={styles.card}>
      <CardHeader>
        <CardTitle style={styles.cardTitle}>
          <View style={styles.titleContainer}>
            <Ionicons name="notifications" size={20} color={theme.colors.foreground} />
            <Text style={styles.titleText}>Notifications</Text>
          </View>
          <Switch
            checked={isNotificationsEnabled}
            onCheckedChange={handleNotificationToggle}
          />
        </CardTitle>
      </CardHeader>
      
      <CardContent style={styles.cardContent}>
        {/* Language Setting */}
        <View style={styles.settingSection}>
          <Text style={styles.sectionLabel}>Language</Text>
          <View style={styles.selectWrapper}>
            <Select
              value={settings.language || 'italian'}
              onValueChange={handleLanguageChange}
              options={[
                { label: 'Spanish', value: 'spanish' },
                { label: 'Italian', value: 'italian' },
                { label: 'French', value: 'french' },
                { label: 'German', value: 'german' },
              ]}
              style={styles.select}
            />
          </View>
        </View>

        {/* Frequency Setting */}
        <View style={styles.settingSection}>
          <Text style={styles.sectionLabel}>Frequency</Text>
          <View style={styles.selectWrapper}>
            <Select
              value={settings.notificationFrequency?.toString() || "15"}
              onValueChange={handleFrequencyChange}
              options={[
                { label: 'Every 15 minutes', value: '15' },
                { label: 'Every 30 minutes', value: '30' },
                { label: 'Every 60 minutes', value: '60' },
              ]}
              style={styles.select}
            />
          </View>
        </View>

        {/* Start Time Setting */}
        <View style={styles.settingSection}>
          <Text style={styles.sectionLabel}>Start Time</Text>
          <View style={styles.selectWrapper}>
            <Select
              value={settings.notificationStartTime || "09:00"}
              onValueChange={handleStartTimeChange}
              options={timeOptions}
              style={styles.select}
            />
          </View>
        </View>

        {/* End Time Setting */}
        <View style={styles.settingSection}>
          <Text style={styles.sectionLabel}>End Time</Text>
          <View style={styles.selectWrapper}>
            <Select
              value={settings.notificationEndTime || "18:00"}
              onValueChange={handleEndTimeChange}
              options={timeOptions}
            />
          </View>
        </View>

        {/* Status Section - FIXED: Based on DB state */}
        <View style={styles.statusSection}>
          {!isNotificationsEnabled ? (
            // Disabled in database
            <View style={styles.disabledContainer}>
              <View style={styles.disabledIcon}>
                <Ionicons name="notifications-off" size={20} color="#9CA3AF" />
              </View>
              <View style={styles.disabledText}>
                <Text style={styles.disabledTitle}>Notifications Disabled</Text>
                <Text style={styles.disabledDescription}>
                  Enable the toggle above to start receiving learning reminders
                </Text>
              </View>
            </View>
          ) : needsDevicePermission ? (
            // Enabled in DB but needs device permission
            <View style={styles.warningContainer}>
              <View style={styles.warningContent}>
                <Ionicons name="warning" size={16} color="#D97706" style={styles.warningIcon} />
                <View style={styles.warningText}>
                  <Text style={styles.warningTitle}>Device Permission Required</Text>
                  <Text style={styles.warningDescription}>
                    Notifications are enabled in your LingoToday settings, but your device hasn't granted permission yet.
                  </Text>
                  <View style={styles.warningSteps}>
                    <Text style={styles.warningStep}>1. Toggle notifications off and on again</Text>
                    <Text style={styles.warningStep}>2. Tap "Allow" when prompted</Text>
                    <Text style={styles.warningStep}>3. Or go to device Settings → LingoToday → Notifications</Text>
                  </View>
                </View>
              </View>
            </View>
          ) : (
            // Fully enabled
            <View style={styles.enabledContainer}>
              <View style={styles.enabledIcon}>
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
              </View>
              <View style={styles.enabledText}>
                <Text style={styles.enabledTitle}>Notifications Active</Text>
                <Text style={styles.enabledDescription}>
                  You'll receive {getLanguageDisplayName(settings.language || 'italian')} reminders every {settings.notificationFrequency} minutes
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Test Section - only show when fully enabled */}
        {isFullyEnabled && (
          <View style={styles.testSection}>
            <Text style={styles.testTitle}>Test Notifications</Text>
            <View style={styles.testButtons}>
              <Button 
                variant="outline" 
                onPress={handleSimpleTest}
                style={styles.testButton}
              >
                <Ionicons name="notifications" size={16} color="#374151" />
                <Text style={styles.testButtonText}>Test Now</Text>
              </Button>
{/*               
              <Button 
                variant="outline" 
                onPress={handleFullTest}
                style={styles.testButton}
              >
                <Text style={styles.testButtonText}>Full Test</Text>
              </Button> */}
            </View>
{/*             
            <Button 
              variant="outline" 
              onPress={handleScheduleTest}
              style={styles.fullWidthButton}
            >
              <Text style={styles.testButtonText}>Schedule Test (1 min)</Text>
            </Button> */}
          </View>
        )}

        {/* Debug Section */}
        <View style={styles.debugSection}>
          <Text style={styles.debugTitle}>Settings</Text>
          <View style={styles.debugInfo}>
            <View style={styles.debugItem}>
              <Text style={styles.debugLabel}>Language</Text>
              <Text style={styles.debugValue}>{settings.language || 'italian'}</Text>
            </View>
            <View style={styles.debugItem}>
              <Text style={styles.debugLabel}>Level</Text>
              <Text style={styles.debugValue}>{settings.difficultyLevel || 'beginner'}</Text>
            </View>
            <View style={styles.debugItem}>
              <Text style={styles.debugLabel}>Notifications</Text>
              <Text style={styles.debugValue}>{isNotificationsEnabled ? 'Enabled' : 'Disabled'}</Text>
            </View>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  // Card styles
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  
  // Header styles
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  
  // Content styles
  cardContent: {
    gap: 20,
  },
  
  // Loading styles
  loadingContent: {
    padding: 24,
  },
  loadingContainer: {
    gap: 16,
  },
  loadingSkeleton: {
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    width: '100%',
  },
  
  // Error styles
  errorContent: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
  },
  
  // Setting section styles
  settingSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  selectWrapper: {
    flex: 1,
  },
  select: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  
  // Status section styles
  statusSection: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  
  // Disabled state
  disabledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  disabledIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledText: {
    flex: 1,
  },
  disabledTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  disabledDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  
  // Warning state
  warningContainer: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 12,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  warningIcon: {
    marginTop: 2,
  },
  warningText: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E',
  },
  warningDescription: {
    fontSize: 12,
    color: '#A16207',
    marginTop: 4,
  },
  warningSteps: {
    marginTop: 8,
    gap: 4,
  },
  warningStep: {
    fontSize: 12,
    color: '#A16207',
  },
  
  // Enabled state
  enabledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  enabledIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#DCFCE7',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enabledText: {
    flex: 1,
  },
  enabledTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#047857',
  },
  enabledDescription: {
    fontSize: 12,
    color: '#059669',
    marginTop: 2,
  },
  
  // Test section styles
  testSection: {
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  testTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  testButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  testButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 8,
    borderRadius: 6,
  },
  fullWidthButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 8,
    borderRadius: 6,
  },
  testButtonText: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    fontWeight: '500',
  },
  
  // Debug section styles
  debugSection: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  debugInfo: {
    gap: 4,
  },
  debugItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debugLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  debugValue: {
    fontSize: 12,
    color: '#374151',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '500',
  },
});