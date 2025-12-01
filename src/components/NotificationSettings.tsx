import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Platform,
  Linking,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
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
import { SchedulableTriggerInputTypes } from 'expo-notifications';
// Note: Local notification scheduling removed - backend now handles notification delivery
import { useResponsiveBreakpoints } from '../hooks/useResponsiveBreakpoints';

// Replace local UserSettings shape to match the web version
type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
interface UserSettings {
  userId?: string;
  language: string;

  // Mobile notifications (same fields as web)
  mobileNotificationsEnabled: boolean;
  mobileNotificationDays: Day[];
  mobileNotificationFrequency: number;
  mobileNotificationStartTime: string; // "HH:00"
  mobileNotificationEndTime: string;   // "HH:00"

  // Desktop notifications (same fields as web)
  desktopNotificationsEnabled: boolean;
  desktopNotificationDays: Day[];
  desktopNotificationFrequency: number;
  desktopNotificationStartTime: string; // "HH:00"
  desktopNotificationEndTime: string;   // "HH:00"
}

const DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

function hourOptions(): { label: string; value: string }[] {
  return Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return { label: `${hour}:00`, value: `${hour}:00` };
  });
}

export default function NotificationSettings() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { isSmallHandset, screenWidth } = useResponsiveBreakpoints();
  const queryClient = useQueryClient();
  const [isTesting, setIsTesting] = useState(false);
  const [devicePermissionStatus, setDevicePermissionStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');

  // Calculate day circle size based on available width to ensure 7 buttons fit in one row
  const dayCircleStyle = useMemo(() => {
    // Available width: screenWidth - horizontal padding (20px each side) - card content padding (16px each side)
    const availableWidth = screenWidth - 72;
    const gap = isTablet ? 8 : 5;
    
    // Each button has marginHorizontal: gap/2 on both sides
    // Total space needed: 7 × circleSize + 7 × gap (total horizontal margins)
    const circleSize = Math.floor((availableWidth - 7 * gap) / 7);
    
    // For tablets, use larger size but still respect available width
    const maxSize = isTablet ? 44 : 40;
    const finalSize = Math.min(maxSize, Math.max(28, circleSize));

    return {
      width: finalSize,
      height: finalSize,
      borderRadius: finalSize / 2,
      marginHorizontal: gap / 2,
    };
  }, [screenWidth, isTablet]);

  // Fetch settings (same key as web)
  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      try {
        const res = await apiClient.getUserSettings();
        // Ensure defaults for missing fields
        return {
          language: res.language ?? 'italian',

          mobileNotificationsEnabled: res.mobileNotificationsEnabled ?? false,
          mobileNotificationDays: res.mobileNotificationDays ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          mobileNotificationFrequency: res.mobileNotificationFrequency ?? 60,
          mobileNotificationStartTime: res.mobileNotificationStartTime ?? '09:00',
          mobileNotificationEndTime: res.mobileNotificationEndTime ?? '18:00',

          desktopNotificationsEnabled: res.desktopNotificationsEnabled ?? false,
          desktopNotificationDays: res.desktopNotificationDays ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          desktopNotificationFrequency: res.desktopNotificationFrequency ?? 60,
          desktopNotificationStartTime: res.desktopNotificationStartTime ?? '09:00',
          desktopNotificationEndTime: res.desktopNotificationEndTime ?? '18:00',
        } as UserSettings;
      } catch {
        // Fallback defaults (same shape as web)
        return {
          language: 'italian',
          mobileNotificationsEnabled: false,
          mobileNotificationDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          mobileNotificationFrequency: 60,
          mobileNotificationStartTime: '09:00',
          mobileNotificationEndTime: '18:00',

          desktopNotificationsEnabled: false,
          desktopNotificationDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          desktopNotificationFrequency: 60,
          desktopNotificationStartTime: '09:00',
          desktopNotificationEndTime: '18:00',
        };
      }
    },
    retry: 1,
    staleTime: 30000,
  });

  // Check device permission (for banner + mobile toggle gate)
  useEffect(() => {
    const check = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        setDevicePermissionStatus(status);
      } catch {}
    };
    check();
  }, []);

  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: Partial<UserSettings>) => {
      const cleaned = { ...updatedSettings };
      delete (cleaned as any).createdAt;
      delete (cleaned as any).updatedAt;
      delete (cleaned as any).userId;
      return apiClient.updateUserSettings(cleaned);
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      
      // Backend now handles notification scheduling based on saved preferences
      console.log('✅ Notification preferences synced to backend');
      
      Alert.alert('Settings updated', 'Your notification preferences have been saved.', [{ text: 'OK' }]);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update settings. Please try again.', [{ text: 'OK' }]);
    },
  });

  // const handleLanguageChange = (language: string) => {
  //   if (!settings) return;
  //   updateSettingsMutation.mutate({ ...settings, language });
  // };

  const toggleDay = (type: 'mobile' | 'desktop', day: Day) => {
    if (!settings) return;
    const key = type === 'mobile' ? 'mobileNotificationDays' : 'desktopNotificationDays';
    const current = (settings as any)[key] as Day[];
    const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day];
    updateSettingsMutation.mutate({ ...settings, [key]: next } as Partial<UserSettings>);
  };

  const requestDevicePermissionIfNeeded = async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      setDevicePermissionStatus(status);
      if (status !== 'granted') {
        Alert.alert(
          'Permission required',
          'Please allow notifications in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') Linking.openURL('app-settings:');
                else Linking.openSettings();
              },
            },
          ]
        );
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  // "Test Now" action - mirrors web behaviour but uses Expo notifications
  const handleTestNow = async () => {
    if (isTesting) return;
    if (!settings) {
      Alert.alert('Not ready', 'Settings are not loaded yet.');
      return;
    }

    if (!settings.mobileNotificationsEnabled) {
      Alert.alert('Enable first', 'Please enable mobile notifications to test them.');
      return;
    }

    setIsTesting(true);
    try {
      // Ensure permission
      if (devicePermissionStatus !== 'granted') {
        const ok = await requestDevicePermissionIfNeeded();
        if (!ok) {
          setIsTesting(false);
          return;
        }
      }

      // Schedule a short-delay test notification (works on device / Expo go)
      await Notifications.scheduleNotificationAsync({
        content:
          {
            title: 'LingoToday — Test Notification',
            body: 'This is a test notification. If you see it, push notifications are working.',
            data: { testNotification: true },
          },
        trigger: { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 1 },
      });

      Alert.alert('Test sent', 'A test notification was scheduled. Check your device notifications.');
    } catch (err) {
      console.warn('Test notification failed', err);
      Alert.alert(
        'Failed to send test',
        Platform.OS === 'ios'
          ? 'Simulator may not show notifications. Try on a real device or check Settings.'
          : 'Failed to schedule a notification. Please check app permissions in Settings.'
      );
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggleMobileEnabled = async (enabled: boolean) => {
    if (!settings) return;
    if (enabled && devicePermissionStatus !== 'granted') {
      const ok = await requestDevicePermissionIfNeeded();
      if (!ok) return;
    }
    updateSettingsMutation.mutate({ ...settings, mobileNotificationsEnabled: enabled });
  };

  const handleToggleDesktopEnabled = (enabled: boolean) => {
    if (!settings) return;
    // Desktop settings are server-side only; safe to update directly
    updateSettingsMutation.mutate({ ...settings, desktopNotificationsEnabled: enabled });
  };

  const frequencyOptions = [
    { label: '15 min', value: '15' },
    { label: '30 min', value: '30' },
    { label: '60 min', value: '60' },
    { label: '1.5 hours', value: '90' },
    { label: '2 hours', value: '120' },
    { label: '0.5 days', value: '720' },
  ];
  const timeOptions = hourOptions();

  const styles = useMemo(() => createStyles(isTablet), [isTablet]);

  if (isLoading || !settings) {
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

  const permissionBlocked = !settings.mobileNotificationsEnabled || devicePermissionStatus !== 'granted';

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
        {/* Mobile Section */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeader}>
            <Ionicons name="phone-portrait-outline" size={20} color={theme.colors.primary} />
            <Text style={styles.sectionTitle}>Mobile</Text>
          </View>

          {/* Days */}
          <View style={styles.daysRow}>
            {DAYS.map((d, i) => {
              const selected = (settings.mobileNotificationDays || []).includes(d);
              return (
                <TouchableOpacity
                  key={d}
                  onPress={() => toggleDay('mobile', d)}
                  style={[
                    dayCircleStyle,
                    { backgroundColor: theme.colors.surfaceVariant, alignItems: 'center', justifyContent: 'center' },
                    selected && styles.dayCircleSelected
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Mobile ${d}`}
                >
                  <Text style={[styles.dayCircleText, selected && styles.dayCircleTextSelected]}>
                    {DAY_INITIALS[i]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Controls */}
          <View style={styles.rowBetween}>
            <Text style={styles.rowLabel}>Enable</Text>
            <Switch
              checked={!!settings.mobileNotificationsEnabled}
              onCheckedChange={handleToggleMobileEnabled}
            />
          </View>

          <View style={styles.settingSection}>
            <Text style={styles.sectionLabel}>Frequency</Text>
            <View style={styles.selectWrapper}>
              <Select
                value={(settings.mobileNotificationFrequency ?? 60).toString()}
                onValueChange={(v) =>
                  updateSettingsMutation.mutate({
                    ...settings,
                    mobileNotificationFrequency: parseInt(v, 10),
                  })
                }
                options={frequencyOptions}
                style={styles.select}
              />
            </View>
          </View>

          <View style={styles.timeRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionLabel}>Start Time</Text>
              <Select
                value={settings.mobileNotificationStartTime || '09:00'}
                onValueChange={(v) =>
                  updateSettingsMutation.mutate({
                    ...settings,
                    mobileNotificationStartTime: v,
                  })
                }
                options={timeOptions}
                style={styles.select}
              />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionLabel}>End Time</Text>
              <Select
                value={settings.mobileNotificationEndTime || '18:00'}
                onValueChange={(v) =>
                  updateSettingsMutation.mutate({
                    ...settings,
                    mobileNotificationEndTime: v,
                  })
                }
                options={timeOptions}
                style={styles.select}
              />
            </View>
          </View>
        </View>

        {/* Permission banner */}
        <View style={styles.banner}>
          <View style={styles.bannerTextOnlyRow}>
            {permissionBlocked && (
              <Text style={styles.bannerText}>
                Device notifications are blocked. Toggle "Enable" in the Mobile section to grant permission.
              </Text>
            )}
          </View>
          <View style={styles.testNowCenterRow}>
            <TouchableOpacity
              onPress={handleTestNow}
              disabled={isTesting}
              accessibilityRole="button"
              style={styles.testNowTouchable}
            >
              {isTesting ? (
                <View style={styles.testNowContent}>
                  <ActivityIndicator size="small" color={theme.colors.warning600} />
                  <Text style={[styles.testNowText, { marginLeft: 8 }]}>Testing…</Text>
                </View>
              ) : (
                <View style={styles.testNowContent}>
                  <Ionicons name="notifications" size={16} color={theme.colors.warning600} />
                  <Text style={styles.testNowText}>Test Now</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}

const createStyles = (isTablet: boolean) => StyleSheet.create({
  // Card styles
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 1 },
    }),
  },

  // Header
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titleText: { fontSize: isTablet ? 20 : 18, fontWeight: '600', color: theme.colors.foreground },

  // Content
  cardContent: { gap: isTablet ? 24 : 20, padding: isTablet ? 24 : 16 },

  // Loading
  loadingContent: { padding: isTablet ? 28 : 24 },
  loadingContainer: { gap: 16 },
  loadingSkeleton: {
    height: 40,
    backgroundColor: theme.colors.muted,
    borderRadius: 8,
    width: '100%',
  },

  // Sections
  sectionBlock: { gap: isTablet ? 16 : 12 },
  sectionDivider: { paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: isTablet ? 17 : 16, fontWeight: '600', color: theme.colors.foreground },

  // Generic settings
  settingSection: { gap: isTablet ? 10 : 8 },
  sectionLabel: { fontSize: isTablet ? 15 : 14, fontWeight: '500', color: theme.colors.mutedForeground },
  selectWrapper: { flex: 1 },
  select: {
    backgroundColor: theme.colors.muted,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 6,
    paddingHorizontal: isTablet ? 14 : 12,
    paddingVertical: isTablet ? 12 : 10,
    fontSize: isTablet ? 15 : 14,
  },

  // Days row
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'nowrap',
  },
  dayCircleSelected: {
    backgroundColor: theme.colors.primary,
  },
  dayCircleText: { color: theme.colors.mutedForeground, fontWeight: '600', fontSize: isTablet ? 15 : 14 },
  dayCircleTextSelected: { color: theme.colors.primaryForeground },

  // Rows
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: isTablet ? 4 : 0,
  },
  rowLabel: { fontSize: isTablet ? 15 : 14, fontWeight: '500', color: theme.colors.mutedForeground },

  timeRow: { flexDirection: 'row', alignItems: 'center', gap: isTablet ? 16 : 12 },

  // Banner
  banner: {
    backgroundColor: theme.colors.warning50,
    borderWidth: 1,
    borderColor: theme.colors.warning500,
    borderRadius: 8,
    padding: isTablet ? 16 : 12,
    gap: isTablet ? 12 : 8,
  },
  bannerText: { fontSize: isTablet ? 13 : 12, color: theme.colors.warning600, flex: 1 },

  // layout for banner: text left, inline action right (web-like)
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },

  // inline Test Now touchable (keeps minimal chrome like web)
  testNowTouchable: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: isTablet ? 24 : 20,
    paddingVertical: isTablet ? 12 : 10,
    borderRadius: 8,
  },
  testNowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  testNowText: {
    color: theme.colors.warning600,
    fontSize: isTablet ? 14 : 13,
    fontWeight: '600',
  },

  // New styles for banner refactor
  bannerTextOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  testNowCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: isTablet ? 4 : 0,
  },
});