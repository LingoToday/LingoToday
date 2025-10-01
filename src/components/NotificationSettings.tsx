import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../lib/theme';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Switch } from './ui/Switch';
import { Select } from './ui/Select';
import { apiClient, DashboardData } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';

interface UserSettings {
  notificationsEnabled: boolean;
  notificationFrequency: number;
  notificationStartTime: string;
  notificationEndTime: string;
  selectedLanguage: string;
}

// Helper function to get language display name - matching web exactly
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
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  // Get settings from dashboard data - matching web exactly
  const { data: dashboardData, isLoading, error: dashboardError } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    queryFn: async () => {
      try {
        return await apiClient.getDashboardData();
      } catch (error) {
        console.error('Dashboard query error:', error);
        // Return fallback data to prevent UI breaking
        const fallbackUser = user ? {
          ...user,
          firstName: user.firstName ?? undefined, // Convert null to undefined
          lastName: user.lastName ?? undefined,
          avatarUrl: user.avatarUrl ?? undefined,
          password: user.password ?? undefined,
          selectedLanguage: user.selectedLanguage ?? undefined
        } : { id: '', email: '', firstName: 'User' };
        
        return {
          user: fallbackUser,
          settings: {
            notificationsEnabled: false,
            notificationFrequency: 15,
            notificationStartTime: '09:00',
            notificationEndTime: '18:00',
            selectedLanguage: user?.selectedLanguage || 'italian',
          },
          stats: {
            streak: 0,
            totalLessons: 0,
            wordsLearned: 0,
            lessonsCompleted: 0,
          },
          progress: []
        } as DashboardData;
      }
    },
    enabled: !!user,
    retry: 1, // Only retry once
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  

  const settings = dashboardData?.settings || {
    notificationsEnabled: false,
    notificationFrequency: 15,
    notificationStartTime: '09:00',
    notificationEndTime: '18:00',
    selectedLanguage: user?.selectedLanguage || 'italian',
  };

  // Update settings mutation - matching web exactly
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<UserSettings>) => {
      try {
        return await apiClient.updateUserSettings(updatedSettings);
      } catch (error) {
        console.warn('Settings update failed:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      Alert.alert(
        'Settings updated',
        'Your notification preferences have been saved.',
        [{ text: 'OK' }]
      );
    },
    onError: (error) => {
      Alert.alert(
        'Error',
        'Failed to update settings. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  useEffect(() => {
    checkNotificationPermission();
    
    // Check permission periodically in case user changed it - matching web exactly
    const permissionCheck = setInterval(() => {
      checkNotificationPermission();
    }, 1000);
    
    return () => clearInterval(permissionCheck);
  }, []);

  const checkNotificationPermission = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== notificationPermission) {
        console.log('Permission changed from', notificationPermission, 'to', status);
        setNotificationPermission(status);
      }
    } catch (error) {
      console.error('Error checking notification permission:', error);
    }
  };

  // Generate time options for dropdowns (24-hour format) - matching web exactly
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

  // Handle notification settings change - matching web exactly
  const handleNotificationToggle = async (enabled: boolean) => {
    try {
      if (enabled && notificationPermission !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        setNotificationPermission(status);
        
        if (status !== 'granted') {
          Alert.alert(
            'Permission required',
            'Please allow notifications in your device settings to enable this feature.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      updateSettingsMutation.mutate({
        ...settings,
        notificationsEnabled: enabled,
      });

      // Stop notifications if disabled - matching web exactly
      if (!enabled) {
        console.log('🛑 Stopping notifications - disabled by user');
        // Stop any scheduled notifications
        await Notifications.cancelAllScheduledNotificationsAsync();
      } else {
        console.log('✅ Notifications enabled - user must start daily session on dashboard');
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to update notification settings.',
        [{ text: 'OK' }]
      );
    }
  };

  // Handle language change - matching web exactly
  const handleLanguageChange = (language: string) => {
    updateSettingsMutation.mutate({
      ...settings,
      selectedLanguage: language,
    });
  };

  // Handle frequency change - matching web exactly
  const handleFrequencyChange = (frequency: string) => {
    const newFrequency = parseInt(frequency);
    updateSettingsMutation.mutate({
      ...settings,
      notificationFrequency: newFrequency,
    });

    console.log('✅ Notification frequency updated - will apply to next daily session');
  };

  // Handle start time change - matching web exactly
  const handleStartTimeChange = (startTime: string) => {
    updateSettingsMutation.mutate({
      ...settings,
      notificationStartTime: startTime,
    });
  };

  // Handle end time change - matching web exactly
  const handleEndTimeChange = (endTime: string) => {
    updateSettingsMutation.mutate({
      ...settings,
      notificationEndTime: endTime,
    });
  };

  // Request notification permission - matching web exactly
  const requestNotificationPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationPermission(status);
      
      if (status === 'granted') {
        updateSettingsMutation.mutate({
          ...settings,
          notificationsEnabled: true,
        });
        
        Alert.alert(
          'Notifications enabled!',
          "You'll now receive learning reminders at your chosen frequency.",
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Permission denied',
          'Please enable notifications in your device settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to enable notifications. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Test notification functions - matching web exactly
  const handleSimpleTest = async () => {
    try {
      if (notificationPermission === 'granted') {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: '🔔 LingoToday Test',
            body: 'This is a test notification. If you see this, notifications are working!',
            sound: true,
          },
          trigger: null, // Show immediately
        });
        
        Alert.alert(
          'Simple test sent',
          'Check if you received the notification.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Permission Issue',
          'Notification permission is not granted. Check your device settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to send test notification.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleFullTest = async () => {
    try {
      if (notificationPermission === 'granted') {
        const language = getLanguageDisplayName(settings.selectedLanguage);
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${language} Learning Reminder`,
            body: `Time for your ${language} lesson! Keep your streak going! 🔥`,
            sound: true,
          },
          trigger: null, // Show immediately
        });
        
        Alert.alert(
          'Full test sent',
          'This simulates a real learning notification.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Permission Issue',
          'Notification permission is not granted.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to send test notification.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleForceSchedule = async () => {
    try {
      if (notificationPermission === 'granted') {
        // Schedule a test notification for 1 minute
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Scheduled Test',
            body: 'This notification was scheduled 1 minute ago for testing.',
            sound: true,
          },
          trigger: null
        });
        
        Alert.alert(
          'Scheduled test notification',
          'You should receive a notification in 1 minute.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Cannot schedule',
          'Permission not granted.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to schedule test notification.',
        [{ text: 'OK' }]
      );
    }
  };
  
  const refreshPermission = async () => {
    console.log('🔄 Refreshing permission status');
    await checkNotificationPermission();
    Alert.alert(
      'Permission refreshed',
      `Current permission: ${notificationPermission}`,
      [{ text: 'OK' }]
    );
  };

  if (!dashboardData && !settings) {
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

  return (
    <Card style={styles.card}>
      <CardHeader>
        <CardTitle style={styles.cardTitle}>
          <View style={styles.titleContainer}>
            <Ionicons name="notifications" size={20} color={theme.colors.foreground} />
            <Text style={styles.titleText}>Notifications</Text>
          </View>
          <Switch
            checked={settings.notificationsEnabled}
            onCheckedChange={handleNotificationToggle}
          />
        </CardTitle>
      </CardHeader>
      
      <CardContent style={styles.cardContent}>
        {/* Language Setting - matching web exactly */}
        <View style={styles.settingSection}>
          <Text style={styles.sectionLabel}>Language</Text>
          <View style={styles.selectWrapper}>
            <Select
              value={settings.selectedLanguage}
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

        {/* Frequency Setting - matching web exactly */}
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

        {/* Start Time Setting - matching web exactly */}
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

        {/* End Time Setting - matching web exactly */}
        <View style={styles.settingSection}>
          <Text style={styles.sectionLabel}>End Time</Text>
          <View style={styles.selectWrapper}>
            <Select
              value={settings.notificationEndTime || "18:00"}
              onValueChange={handleEndTimeChange}
              options={timeOptions}
              style={styles.select}
            />
          </View>
        </View>

        {/* Permission Warning - matching web exactly */}
        {notificationPermission !== 'granted' && (
          <View style={styles.warningContainer}>
            <View style={styles.warningContent}>
              <Ionicons 
                name="information-circle" 
                size={16} 
                color="#D97706" 
                style={styles.warningIcon} 
              />
              <View style={styles.warningText}>
                <Text style={styles.warningTitle}>
                  {notificationPermission === 'denied' ? 'Permission Blocked' : 'Permission Required'}
                </Text>
                {notificationPermission === 'denied' ? (
                  <View>
                    <Text style={styles.warningDescription}>
                      Notifications are blocked. To enable:
                    </Text>
                    <View style={styles.warningSteps}>
                      <Text style={styles.warningStep}>1. Go to device Settings</Text>
                      <Text style={styles.warningStep}>2. Find LingoToday app</Text>
                      <Text style={styles.warningStep}>3. Enable Notifications</Text>
                      <Text style={styles.warningStep}>4. Return to this screen</Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.warningDescription}>
                    Tap "Allow" when prompted for notification permission.
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons - matching web exactly */}
        {notificationPermission !== 'granted' ? (
          <View style={styles.actionSection}>
            <Button
              onPress={requestNotificationPermission}
              disabled={notificationPermission === 'denied'}
              style={[
                styles.primaryButton,
                notificationPermission === 'denied' && styles.disabledButton
              ]}
            >
              <Ionicons 
                name="notifications" 
                size={16} 
                color="#ffffff" 
                style={styles.buttonIcon} 
              />
              <Text style={styles.primaryButtonText}>
                {notificationPermission === 'denied' ? 'Permission Blocked - See Instructions Above' : 'Enable Notifications'}
              </Text>
            </Button>

            {/* Debug info when permission not granted - matching web exactly */}
            <View style={styles.debugSection}>
              <Text style={styles.debugTitle}>Debug Info</Text>
              <View style={styles.debugInfo}>
                <View style={styles.debugItem}>
                  <Text style={styles.debugLabel}>Permission:</Text>
                  <Text style={styles.debugValue}>{notificationPermission}</Text>
                </View>
                <View style={styles.debugItem}>
                  <Text style={styles.debugLabel}>API Support:</Text>
                  <Text style={styles.debugValue}>React Native Expo</Text>
                </View>
                <View style={styles.debugItem}>
                  <Text style={styles.debugLabel}>Platform:</Text>
                  <Text style={styles.debugValue}>{Platform.OS}</Text>
                </View>
              </View>
              
              <Button 
                variant="outline"
                onPress={refreshPermission}
                style={styles.debugButton}
              >
                <Text style={styles.debugButtonText}>Refresh Permission</Text>
              </Button>
            </View>
          </View>
        ) : (
          <View style={styles.actionSection}>
            {/* Enabled State - matching web exactly */}
            <View style={styles.enabledContainer}>
              <View style={styles.enabledIcon}>
                <Ionicons name="checkmark-circle" size={20} color="#059669" />
              </View>
              <Text style={styles.enabledText}>
                Notifications {settings.notificationsEnabled ? 'Enabled' : 'Available'}
              </Text>
            </View>

            {/* Test Buttons - matching web exactly */}
            {settings.notificationsEnabled && (
              <View style={styles.testSection}>
                <View style={styles.testButtons}>
                  <Button 
                    variant="outline" 
                    onPress={handleSimpleTest}
                    style={styles.testButton}
                  >
                    <Text style={styles.testButtonText}>Simple Test</Text>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onPress={handleFullTest}
                    style={styles.testButton}
                  >
                    <Text style={styles.testButtonText}>Full Test</Text>
                  </Button>
                </View>

                {/* Debug Panel for notifications - matching web exactly */}
                <View style={styles.debugSection}>
                  <Text style={styles.debugTitle}>Debug Info</Text>
                  <View style={styles.debugInfo}>
                    <View style={styles.debugItem}>
                      <Text style={styles.debugLabel}>Permission:</Text>
                      <Text style={styles.debugValue}>{notificationPermission}</Text>
                    </View>
                    <View style={styles.debugItem}>
                      <Text style={styles.debugLabel}>Enabled:</Text>
                      <Text style={styles.debugValue}>{settings.notificationsEnabled ? 'true' : 'false'}</Text>
                    </View>
                    <View style={styles.debugItem}>
                      <Text style={styles.debugLabel}>Language:</Text>
                      <Text style={styles.debugValue}>{settings.selectedLanguage}</Text>
                    </View>
                    <View style={styles.debugItem}>
                      <Text style={styles.debugLabel}>Frequency:</Text>
                      <Text style={styles.debugValue}>{settings.notificationFrequency} min</Text>
                    </View>
                    <View style={styles.debugItem}>
                      <Text style={styles.debugLabel}>Start Time:</Text>
                      <Text style={styles.debugValue}>{settings.notificationStartTime}</Text>
                    </View>
                    <View style={styles.debugItem}>
                      <Text style={styles.debugLabel}>End Time:</Text>
                      <Text style={styles.debugValue}>{settings.notificationEndTime}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.debugButtons}>
                    <Button 
                      variant="outline"
                      onPress={handleForceSchedule}
                      style={styles.debugButton}
                    >
                      <Text style={styles.debugButtonText}>Force Schedule (1min test)</Text>
                    </Button>
                    
                    <Button 
                      variant="outline"
                      onPress={refreshPermission}
                      style={styles.debugButton}
                    >
                      <Text style={styles.debugButtonText}>Refresh Permission</Text>
                    </Button>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  // Card - enhanced design matching web
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
  
  // Header - matching web exactly
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingRight: 6,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  
  // Content - matching web exactly
  cardContent: {
    gap: 16,
  },
  
  // Loading
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
  
  // Setting Sections - matching web exactly
  settingSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
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
    paddingVertical: 8,
    fontSize: 14,
  },
  
  // Warning - matching web exactly
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
    gap: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E',
  },
  warningDescription: {
    fontSize: 12,
    color: '#A16207',
  },
  warningSteps: {
    gap: 4,
    marginTop: 8,
  },
  warningStep: {
    fontSize: 12,
    color: '#A16207',
  },
  
  // Action Section
  actionSection: {
    gap: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  
  // Primary Button
  primaryButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 6,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  buttonIcon: {
    marginRight: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Enabled State
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
    width: 24,
    height: 24,
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enabledText: {
    fontSize: 14,
    color: '#047857',
    fontWeight: '500',
  },
  
  // Test Section
  testSection: {
    gap: 12,
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
  testButtonText: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
  
  // Debug Section - matching web exactly
  debugSection: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  debugInfo: {
    gap: 6,
  },
  debugItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  debugLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  debugValue: {
    fontSize: 12,
    color: '#374151',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  debugButtons: {
    gap: 8,
  },
  debugButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    paddingVertical: 6,
    borderRadius: 4,
  },
  debugButtonText: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
  },
});