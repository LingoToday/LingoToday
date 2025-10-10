import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  Linking,
  TouchableOpacity,
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
  mobileNotificationsEnabled: boolean;
  mobileNotificationFrequency: number;
  mobileNotificationStartTime: string;
  mobileNotificationEndTime: string;
  mobileNotificationDays: string[];
  desktopNotificationsEnabled: boolean;
  desktopNotificationFrequency: number;
  desktopNotificationStartTime: string;
  desktopNotificationEndTime: string;
  desktopNotificationDays: string[];
  difficultyLevel: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function NotificationSettings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [devicePermissionStatus, setDevicePermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      try {
        const result = await apiClient.getUserSettings() as any;
        // Ensure all mobile/desktop fields exist with defaults
        return {
          userId: result.userId || user?.id || '',
          language: result.language || user?.selectedLanguage || 'italian',
          theme: result.theme || 'light',
          soundEnabled: result.soundEnabled ?? true,
          notificationsEnabled: result.notificationsEnabled ?? false,
          notificationFrequency: result.notificationFrequency ?? 60,
          notificationStartTime: result.notificationStartTime || '09:00',
          notificationEndTime: result.notificationEndTime || '18:00',
          mobileNotificationsEnabled: result.mobileNotificationsEnabled ?? false,
          mobileNotificationFrequency: result.mobileNotificationFrequency ?? 60,
          mobileNotificationStartTime: result.mobileNotificationStartTime || '09:00',
          mobileNotificationEndTime: result.mobileNotificationEndTime || '18:00',
          mobileNotificationDays: result.mobileNotificationDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          desktopNotificationsEnabled: result.desktopNotificationsEnabled ?? false,
          desktopNotificationFrequency: result.desktopNotificationFrequency ?? 60,
          desktopNotificationStartTime: result.desktopNotificationStartTime || '09:00',
          desktopNotificationEndTime: result.desktopNotificationEndTime || '18:00',
          desktopNotificationDays: result.desktopNotificationDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          difficultyLevel: result.difficultyLevel || 'beginner',
        } as UserSettings;
      } catch (error) {
        console.error('Settings fetch error:', error);
        return {
          userId: user?.id || '',
          language: user?.selectedLanguage || 'italian',
          theme: 'light',
          soundEnabled: true,
          notificationsEnabled: false,
          notificationFrequency: 60,
          notificationStartTime: '09:00',
          notificationEndTime: '18:00',
          mobileNotificationsEnabled: false,
          mobileNotificationFrequency: 60,
          mobileNotificationStartTime: '09:00',
          mobileNotificationEndTime: '18:00',
          mobileNotificationDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          desktopNotificationsEnabled: false,
          desktopNotificationFrequency: 60,
          desktopNotificationStartTime: '09:00',
          desktopNotificationEndTime: '18:00',
          desktopNotificationDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          difficultyLevel: 'beginner',
        } as UserSettings;
      }
    },
    enabled: !!user,
    retry: 1,
    staleTime: 30000,
  });

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

  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<UserSettings>) => {
      try {
        const cleanedSettings = { ...updatedSettings };
        delete (cleanedSettings as any).createdAt;
        delete (cleanedSettings as any).updatedAt;
        delete (cleanedSettings as any).userId;
        
        const result = await apiClient.updateUserSettings(cleanedSettings);
        return result;
      } catch (error) {
        console.error('Settings update failed:', error);
        throw error;
      }
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      
      // Schedule or update notifications based on new settings
      try {
        const { scheduleLanguageLearningReminders, stopLanguageLearningReminders } = await import('../lib/notifications');
        
        // If mobile notifications were updated
        if ('mobileNotificationsEnabled' in variables || 
            'mobileNotificationFrequency' in variables ||
            'mobileNotificationStartTime' in variables ||
            'mobileNotificationEndTime' in variables ||
            'mobileNotificationDays' in variables) {
          
          const currentSettings = settings || {} as UserSettings;
          const enabled = variables.mobileNotificationsEnabled ?? currentSettings.mobileNotificationsEnabled;
          
          if (enabled) {
            const startTime = variables.mobileNotificationStartTime ?? currentSettings.mobileNotificationStartTime;
            const endTime = variables.mobileNotificationEndTime ?? currentSettings.mobileNotificationEndTime;
            const frequency = variables.mobileNotificationFrequency ?? currentSettings.mobileNotificationFrequency;
            const days = variables.mobileNotificationDays ?? currentSettings.mobileNotificationDays;
            
            await scheduleLanguageLearningReminders(startTime, endTime, frequency, days);
            console.log('✅ Notifications rescheduled based on new settings');
          } else {
            await stopLanguageLearningReminders();
            console.log('✅ Notifications stopped');
          }
        }
      } catch (error) {
        console.error('Error updating notification schedule:', error);
      }
      
      Alert.alert(
        'Settings Updated',
        'Your notification preferences have been saved.',
        [{ text: 'OK' }]
      );
    },
    onError: (error) => {
      console.error('Settings update error:', error);
      Alert.alert(
        'Update Failed',
        'Failed to save settings. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      options.push({ label: time, value: time });
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const toggleDay = (type: 'mobile' | 'desktop', day: string) => {
    if (!settings) return;
    
    const currentDays = type === 'mobile' 
      ? settings.mobileNotificationDays || []
      : settings.desktopNotificationDays || [];
    
    const newDays = currentDays.includes(day)
      ? currentDays.filter((d: string) => d !== day)
      : [...currentDays, day];
    
    updateSettingsMutation.mutate({
      ...settings,
      [type === 'mobile' ? 'mobileNotificationDays' : 'desktopNotificationDays']: newDays,
    });
  };

  const handleTestNotification = async () => {
    try {
      if (devicePermissionStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        setDevicePermissionStatus(status);
        
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please allow notifications in your device settings.',
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
          return;
        }
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔔 LingoToday Test',
          body: 'This is a test notification. If you see this, notifications are working!',
          sound: true,
        },
        trigger: null,
      });
      
      Alert.alert(
        'Test Sent',
        'Check if you received the notification.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Test notification error:', error);
      Alert.alert(
        'Test Failed',
        'Failed to send test notification.',
        [{ text: 'OK' }]
      );
    }
  };

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

  if (!settings) {
    return (
      <Card style={styles.card}>
        <CardContent style={styles.errorContent}>
          <Text style={styles.errorText}>Unable to load notification settings</Text>
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
        </CardTitle>
      </CardHeader>
      
      <CardContent style={styles.cardContent}>
        {/* Mobile Notifications Section */}
        <View style={styles.notificationSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="phone-portrait" size={16} color="#2563EB" />
            <Text style={styles.sectionTitle}>Mobile</Text>
          </View>

          {/* Days Circles for Mobile */}
          <View style={styles.daysContainer}>
            {DAYS.map((day, index) => {
              const isSelected = (settings.mobileNotificationDays || []).includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => toggleDay('mobile', day)}
                  style={[
                    styles.dayCircle,
                    isSelected ? styles.dayCircleSelected : styles.dayCircleUnselected
                  ]}
                >
                  <Text style={[
                    styles.dayText,
                    isSelected ? styles.dayTextSelected : styles.dayTextUnselected
                  ]}>
                    {DAY_INITIALS[index]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Mobile Controls */}
          <View style={styles.controlsContainer}>
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Enable</Text>
              <Switch
                checked={settings.mobileNotificationsEnabled}
                onCheckedChange={(enabled) => {
                  updateSettingsMutation.mutate({
                    ...settings,
                    mobileNotificationsEnabled: enabled,
                  });
                }}
              />
            </View>

            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Frequency</Text>
              <View style={styles.selectSmall}>
                <Select
                  value={settings.mobileNotificationFrequency?.toString() || "60"}
                  onValueChange={(value) => {
                    updateSettingsMutation.mutate({
                      ...settings,
                      mobileNotificationFrequency: parseInt(value),
                    });
                  }}
                  options={[
                    { label: '15 min', value: '15' },
                    { label: '30 min', value: '30' },
                    { label: '60 min', value: '60' },
                    { label: '90 min', value: '90' },
                    { label: '120 min', value: '120' },
                  ]}
                />
              </View>
            </View>

            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Start Time</Text>
              <View style={styles.selectSmall}>
                <Select
                  value={settings.mobileNotificationStartTime || "09:00"}
                  onValueChange={(value) => {
                    updateSettingsMutation.mutate({
                      ...settings,
                      mobileNotificationStartTime: value,
                    });
                  }}
                  options={timeOptions}
                />
              </View>
            </View>

            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>End Time</Text>
              <View style={styles.selectSmall}>
                <Select
                  value={settings.mobileNotificationEndTime || "18:00"}
                  onValueChange={(value) => {
                    updateSettingsMutation.mutate({
                      ...settings,
                      mobileNotificationEndTime: value,
                    });
                  }}
                  options={timeOptions}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Desktop Notifications Section */}
        <View style={[styles.notificationSection, styles.borderTop]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="desktop" size={16} color="#7C3AED" />
            <Text style={styles.sectionTitle}>Desktop</Text>
          </View>

          {/* Days Circles for Desktop */}
          <View style={styles.daysContainer}>
            {DAYS.map((day, index) => {
              const isSelected = (settings.desktopNotificationDays || []).includes(day);
              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => toggleDay('desktop', day)}
                  style={[
                    styles.dayCircle,
                    isSelected ? styles.dayCircleSelectedDesktop : styles.dayCircleUnselected
                  ]}
                >
                  <Text style={[
                    styles.dayText,
                    isSelected ? styles.dayTextSelected : styles.dayTextUnselected
                  ]}>
                    {DAY_INITIALS[index]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Desktop Controls */}
          <View style={styles.controlsContainer}>
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Enable</Text>
              <Switch
                checked={settings.desktopNotificationsEnabled}
                onCheckedChange={(enabled) => {
                  updateSettingsMutation.mutate({
                    ...settings,
                    desktopNotificationsEnabled: enabled,
                  });
                }}
              />
            </View>

            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Frequency</Text>
              <View style={styles.selectSmall}>
                <Select
                  value={settings.desktopNotificationFrequency?.toString() || "60"}
                  onValueChange={(value) => {
                    updateSettingsMutation.mutate({
                      ...settings,
                      desktopNotificationFrequency: parseInt(value),
                    });
                  }}
                  options={[
                    { label: '15 min', value: '15' },
                    { label: '30 min', value: '30' },
                    { label: '60 min', value: '60' },
                    { label: '90 min', value: '90' },
                    { label: '120 min', value: '120' },
                  ]}
                />
              </View>
            </View>

            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Start Time</Text>
              <View style={styles.selectSmall}>
                <Select
                  value={settings.desktopNotificationStartTime || "09:00"}
                  onValueChange={(value) => {
                    updateSettingsMutation.mutate({
                      ...settings,
                      desktopNotificationStartTime: value,
                    });
                  }}
                  options={timeOptions}
                />
              </View>
            </View>

            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>End Time</Text>
              <View style={styles.selectSmall}>
                <Select
                  value={settings.desktopNotificationEndTime || "18:00"}
                  onValueChange={(value) => {
                    updateSettingsMutation.mutate({
                      ...settings,
                      desktopNotificationEndTime: value,
                    });
                  }}
                  options={timeOptions}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Test Notification Section */}
        {devicePermissionStatus !== 'granted' && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Browser notifications are blocked. Click "Test Now" to enable them.
            </Text>
          </View>
        )}

        <Button 
          variant="outline" 
          onPress={handleTestNotification}
          style={styles.testButton}
        >
          <Ionicons name="notifications" size={16} color="#374151" />
          <Text style={styles.testButtonText}>Test Now</Text>
        </Button>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
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
  
  cardContent: {
    gap: 16,
  },
  
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
  
  errorContent: {
    padding: 24,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
  },
  
  notificationSection: {
    gap: 12,
  },
  borderTop: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleSelected: {
    backgroundColor: '#2563EB',
  },
  dayCircleSelectedDesktop: {
    backgroundColor: '#2563EB',
  },
  dayCircleUnselected: {
    backgroundColor: '#E5E7EB',
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dayTextSelected: {
    color: '#FFFFFF',
  },
  dayTextUnselected: {
    color: '#6B7280',
  },
  
  controlsContainer: {
    gap: 8,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 14,
    color: '#374151',
  },
  selectSmall: {
    width: 96,
  },
  
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    padding: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
  },
  
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
});
