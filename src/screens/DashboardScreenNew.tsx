import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Dimensions,
  Linking,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/apiClient';
import { theme } from '../lib/theme';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import NotificationSettings from '../components/NotificationSettings';
import NotificationSetupOverlay from '../components/NotificationSetupOverlay';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Footer } from '../components/ui/Footer';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

// Type definitions - matching web exactly
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  selectedLanguage?: string;
  selectedLevel?: string;
  completedOnboarding?: boolean;
  hasSeenNotificationSetup?: boolean;
}

interface ProgressData {
  courseId: string;
  lessonId: string;
  stepNumber: number;
  completed: boolean;
  score: number;
  completedAt: string | null;
  lessonTitle?: string;
  italianPhrase?: string;
  englishTranslation?: string;
  courseTitle?: string;
}

interface DashboardData {
  user: User;
  settings: {
    notificationsEnabled: boolean;
    notificationFrequency: number;
    notificationStartTime: string;
    notificationEndTime: string;
    selectedLanguage: string;
  };
  stats: {
    streak: number;
    totalLessons: number;
    wordsLearned: number;
    lessonsCompleted: number;
  };
  progress: ProgressData[];
}

// Helper function to get language display name - matching web
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

export default function DashboardScreenNew() {
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [showNotificationSetup, setShowNotificationSetup] = useState(false);
  
  // REMOVED: const [isDailySessionActive, setIsDailySessionActive] = useState(false);
  // We'll calculate this dynamically instead

  // Consolidated fallback data - ALWAYS available
  const getFallbackData = (): DashboardData => ({
    user: {
      id: user?.id || 'demo-user',
      email: user?.email || 'demo@example.com',
      firstName: user?.firstName || 'Demo',
      lastName: user?.lastName || 'User',
      selectedLanguage: user?.selectedLanguage || 'italian',
      selectedLevel: user?.selectedLevel || 'beginner',
      completedOnboarding: true,
      hasSeenNotificationSetup: true, // Default to true to prevent overlay spam
    },
    settings: {
      notificationsEnabled: false,
      notificationFrequency: 15,
      notificationStartTime: '09:00',
      notificationEndTime: '18:00',
      selectedLanguage: user?.selectedLanguage || 'italian',
    },
    stats: {
      streak: 7,
      totalLessons: 78,
      wordsLearned: 45,
      lessonsCompleted: 12,
    },
    progress: [],
  });

  const fallbackUpcomingLessons = [
    {
      courseId: 'course1',
      lessonId: 'lesson1',
      title: 'Basic Greetings',
      description: 'Learn how to say hello and goodbye',
      category: 'Greetings',
      isReview: false,
      isIRLLesson: false,
    },
    {
      courseId: 'course1',
      lessonId: 'lesson2',
      title: 'Polite Expressions',
      description: 'Please, thank you, and excuse me',
      category: 'Greetings',
      isReview: false,
      isIRLLesson: false,
    },
  ];

  // Fetch dashboard data with proper error handling and fallback
  const { data: dashboardData, isLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    queryFn: async () => {
      try {
        console.log('📊 Fetching dashboard data...');
        const result = await apiClient.getDashboardData();
        console.log('✅ Dashboard data fetched successfully:', result);
        return result;
      } catch (error) {
        console.warn('⚠️ Dashboard API failed, using fallback:', error);
        // Return fallback data instead of throwing
        return getFallbackData();
      }
    },
    enabled: !!user,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch course statistics with fallback
  const { data: courseStats } = useQuery<{ totalCourses: number; totalLessons: number }>({
    queryKey: ["/api/course-stats", user?.selectedLanguage],
    queryFn: async () => {
      try {
        if (!user?.selectedLanguage) throw new Error('No language selected');
        return await apiClient.getCourseStats(user.selectedLanguage, user.selectedLevel ?? undefined);
      } catch (error) {
        console.warn('⚠️ Course stats API failed, using fallback:', error);
        return { totalCourses: 5, totalLessons: 78 };
      }
    },
    enabled: !!user?.selectedLanguage,
    retry: 1,
  });

  // Fetch upcoming lessons with fallback
  const { data: upcomingLessonsResponse } = useQuery<{ lessons: any[], timestamp: number }>({
    queryKey: ["/api/upcoming-lessons"],
    queryFn: async () => {
      try {
        return await apiClient.getUpcomingLessons();
      } catch (error) {
        console.warn('⚠️ Upcoming lessons API failed, using fallback:', error);
        return {
          lessons: fallbackUpcomingLessons,
          timestamp: Date.now(),
        };
      }
    },
    enabled: !!user,
    retry: 1,
  });

  // Use effective data (API or fallback)
  const effectiveDashboardData = dashboardData || getFallbackData();
  const effectiveCourseStats = courseStats || { totalCourses: 5, totalLessons: 78 };
  const upcomingLessons = upcomingLessonsResponse?.lessons || fallbackUpcomingLessons;

  // Mark notification setup as seen mutation
  const markNotificationSetupSeenMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiClient.updateNotificationSetupStatus(true);
        return { success: true };
      } catch (error) {
        console.warn('⚠️ Failed to update notification status, proceeding locally:', error);
        return { success: true }; // Proceed anyway
      }
    },
    onSuccess: () => {
      setShowNotificationSetup(false);
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
    },
    onError: () => {
      setShowNotificationSetup(false); // Hide anyway
    },
  });

  // SINGLE useEffect for overlay logic - only show for truly new users
  useEffect(() => {
    if (effectiveDashboardData?.user) {
      const hasSeenSetup = effectiveDashboardData.user.hasSeenNotificationSetup;
      console.log('🔍 Overlay check:', { 
        hasSeenSetup, 
        userId: effectiveDashboardData.user.id 
      });

      // Only show for genuinely new users who haven't seen it
      if (hasSeenSetup === false) {
        console.log('📱 New user - showing notification setup overlay');
        const timer = setTimeout(() => {
          setShowNotificationSetup(true);
        }, 2000);
        return () => clearTimeout(timer);
      } else {
        console.log('🔇 User has seen setup - not showing overlay');
        setShowNotificationSetup(false);
      }
    }
  }, [effectiveDashboardData?.user?.hasSeenNotificationSetup]);

  // Close notification overlay handler
  const handleCloseNotificationOverlay = () => {
    console.log('🚫 User closed notification overlay');
    setShowNotificationSetup(false);
    markNotificationSetupSeenMutation.mutate();
  };

  // ADDED: Dynamic calculation of daily session status
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  
  // Calculate if daily session is active dynamically
  const isDailySessionActive = React.useMemo(() => {
    const notificationsEnabled = effectiveDashboardData?.settings?.notificationsEnabled;
    const hasSessionTime = sessionStartTime !== null;
    const isWithinSessionWindow = hasSessionTime && sessionStartTime && 
      (Date.now() - sessionStartTime) < (8 * 60 * 60 * 1000); // 8 hours window
    
    return notificationsEnabled && hasSessionTime && isWithinSessionWindow;
  }, [
    effectiveDashboardData?.settings?.notificationsEnabled, 
    sessionStartTime
  ]);

  // ADDED: Effect to clear session when notifications are disabled
  useEffect(() => {
    const notificationsEnabled = effectiveDashboardData?.settings?.notificationsEnabled;
    
    if (!notificationsEnabled && sessionStartTime) {
      console.log('🔕 Notifications disabled - clearing daily session');
      setSessionStartTime(null);
      // Cancel any scheduled notifications
      Notifications.cancelAllScheduledNotificationsAsync();
    }
  }, [effectiveDashboardData?.settings?.notificationsEnabled, sessionStartTime]);

  // UPDATED: Handle starting daily notification session
  const handleStartDailySession = async () => {
    try {
      // Check current permission status
      const { status: currentStatus } = await Notifications.getPermissionsAsync();
      
      console.log('🔍 Checking daily session start:', {
        currentPermission: currentStatus,
        settingsEnabled: effectiveDashboardData?.settings?.notificationsEnabled,
        userLanguage: user?.selectedLanguage,
        currentSessionTime: sessionStartTime
      });

      // Check if notifications are enabled in settings AND permission is granted
      const notificationsEnabled = effectiveDashboardData?.settings?.notificationsEnabled;
      
      if (currentStatus !== "granted") {
        // Request permission if not granted
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        
        if (newStatus !== "granted") {
          Alert.alert(
            "Permission required",
            "Please allow notifications to start your daily learning session.",
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

      // Check if notifications are enabled in user settings
      if (!notificationsEnabled) {
        Alert.alert(
          "Enable notifications first",
          "Please enable notifications in the settings below, then try starting your daily session again.",
          [{ text: 'OK' }]
        );
        return;
      }

      if (user?.selectedLanguage) {
        const frequency = effectiveDashboardData?.settings?.notificationFrequency || 15;
        
        // FIXED: Set session start time
        setSessionStartTime(Date.now());
        
        // Schedule actual notifications
        await scheduleNotificationSession(user.selectedLanguage, frequency);
        
        Alert.alert(
          "Daily session started!",
          `You'll receive ${getLanguageDisplayName(user.selectedLanguage)} lesson reminders every ${frequency} minutes.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          "Language not selected",
          "Please select a learning language first.",
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error starting daily session:', error);
      Alert.alert(
        "Error",
        "Failed to start daily session. Please try again.",
        [{ text: 'OK' }]
      );
    }
  };

  // ADDED: Handle stopping daily session
  const handleStopDailySession = async () => {
    try {
      console.log('🛑 Stopping daily session');
      
      // Cancel all scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // Clear session time
      setSessionStartTime(null);
      
      Alert.alert(
        "Daily session stopped",
        "All scheduled lesson reminders have been cancelled.",
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error stopping daily session:', error);
      Alert.alert(
        "Error",
        "Failed to stop daily session properly.",
        [{ text: 'OK' }]
      );
    }
  };

  // UPDATED: Helper function to schedule notification session
  const scheduleNotificationSession = async (language: string, frequency: number) => {
    try {
      // Cancel any existing notifications first
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // Schedule notifications for the next 8 hours
      const notifications = [];
      const now = new Date();
      const endTime = new Date(now.getTime() + (8 * 60 * 60 * 1000)); // 8 hours from now
      
      let nextTime = new Date(now.getTime() + (frequency * 60 * 1000)); // First notification after frequency minutes
      
      while (nextTime <= endTime) {
        notifications.push(
          Notifications.scheduleNotificationAsync({
            content: {
              title: `${getLanguageDisplayName(language)} Learning Reminder`,
              body: `Time for your ${getLanguageDisplayName(language)} lesson! Keep your streak going! 🔥`,
              sound: true,
              data: { 
                language, 
                sessionId: sessionStartTime || Date.now(),
                frequency 
              },
            },
            trigger: { type: SchedulableTriggerInputTypes.DATE, date: nextTime },
          })
        );
        
        // Schedule next notification
        nextTime = new Date(nextTime.getTime() + (frequency * 60 * 1000));
      }
      
      await Promise.all(notifications);
      console.log(`📅 Scheduled ${notifications.length} notifications for ${language} session`);
    } catch (error) {
      console.error('Error scheduling notifications:', error);
      throw error;
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.refetchQueries({ queryKey: ["/api/dashboard"] });
      await queryClient.refetchQueries({ queryKey: ["/api/upcoming-lessons"] });
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              queryClient.clear();
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        },
      ]
    );
  };

  // Handle menu navigation
  const handleMenuPress = () => {
    navigation.navigate('Account');
  };

  // Handle navigation to Courses
  const handleNavigateToCourses = () => {
    navigation.navigate('Courses');
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>No user data available</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Extract data - ALWAYS available due to fallback
  const stats = effectiveDashboardData.stats;
  const settings = effectiveDashboardData.settings;
  const allProgress = effectiveDashboardData.progress || [];
  const recentProgress = allProgress.slice(0, 8);

  console.log('🎨 Rendering Dashboard:', {
    userName: effectiveDashboardData.user.firstName,
    statsData: stats,
    progressCount: allProgress.length,
    upcomingCount: upcomingLessons.length,
    hasSeenSetup: effectiveDashboardData.user.hasSeenNotificationSetup,
  });

  // Generate recent lessons - matching web logic exactly
  interface RecentLesson {
    id: string;
    title: string;
    subtitle: string;
    date: string;
    score: string;
    status: string;
    type: 'lesson' | 'checkpoint';
  }

  const recentLessons: RecentLesson[] = recentProgress.length > 0 
    ? recentProgress.map((progress, index) => ({
        id: `lesson-${index + 1}`,
        title: progress.italianPhrase || `Lesson ${index + 1}`,
        subtitle: progress.englishTranslation || `Course ${progress.courseId}`,
        date: progress.completedAt ? new Date(progress.completedAt).toLocaleDateString('en-GB') : 'In Progress',
        score: progress.score ? `${progress.score}%` : '100%',
        status: progress.completedAt ? 'completed' : 'in_progress',
        type: 'lesson' as const
      }))
    : [
        {
          id: 'demo-1',
          title: 'Ciao! Come stai?',
          subtitle: 'Hello! How are you?',
          date: new Date().toLocaleDateString('en-GB'),
          score: '95%',
          status: 'completed',
          type: 'lesson' as const
        },
        {
          id: 'demo-2',
          title: 'Buongiorno',
          subtitle: 'Good morning',
          date: new Date().toLocaleDateString('en-GB'),
          score: '100%',
          status: 'completed',
          type: 'lesson' as const
        }
      ];

  // Generate learning path - matching web logic exactly
  const courseData = [
    { name: 'Greetings', totalLessons: 13 },
    { name: 'Introducing Yourself', totalLessons: 13 },
    { name: 'Essential Courtesy Phrases', totalLessons: 13 },
    { name: 'Numbers', totalLessons: 29 },
    { name: 'Days and Dates', totalLessons: 10 }
  ];

  const totalPossibleLessons = courseData.reduce((sum, course) => sum + course.totalLessons, 0);
  
  const learningPath = courseData.map((course, index) => {
    const courseProgress = allProgress.filter(p => p.courseId === `course${index + 1}`);
    const completed = courseProgress.filter(p => p.completedAt && p.completed).length;
    const total = course.totalLessons;
    const completion = total > 0 ? (completed / total) * 100 : 0;
    
    let status = 'locked';
    if (index === 0) {
      status = completion === 100 ? 'completed' : completion > 0 ? 'current' : 'available';
    } else if (completion === 100) {
      status = 'completed';
    } else if (completion > 0) {
      status = 'current';
    }
    
    return {
      name: course.name,
      progress: `${completed}/${total}`,
      completion,
      status
    };
  });

  // FIXED: Update the condition for showing daily session button
  const shouldShowDailySessionButton = !isDailySessionActive && 
    effectiveDashboardData?.settings?.notificationsEnabled;
  
  const shouldShowActiveSession = isDailySessionActive && 
    effectiveDashboardData?.settings?.notificationsEnabled;

  // ADDED: Get session remaining time for display
  const getSessionRemainingTime = (): string => {
    if (!sessionStartTime) return '';
    
    const elapsed = Date.now() - sessionStartTime;
    const remaining = (8 * 60 * 60 * 1000) - elapsed; // 8 hours total
    
    if (remaining <= 0) return 'Session expired';
    
    const hours = Math.floor(remaining / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    } else {
      return `${minutes}m remaining`;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.logoContainer}>
                <View style={styles.logoIcon}>
                  <Ionicons name="book" size={16} color="#ffffff" />
                </View>
                <Text style={styles.logoText}>LingoToday</Text>
              </View>
              
              <TouchableOpacity style={styles.dashboardButton}>
                <Text style={styles.dashboardButtonText}>Dashboard</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.accountButton}
                onPress={handleMenuPress}
              >
                <Ionicons name="person" size={16} color={theme.colors.foreground} />
                <Text style={styles.accountButtonText}>
                  {effectiveDashboardData.user.firstName || 'Account'}
                </Text>
                <Ionicons name="chevron-down" size={12} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.mainContainer}>
            <View style={isTablet ? styles.gridContainerTablet : styles.gridContainerMobile}>
              {/* Left Column - Main Content */}
              <View style={isTablet ? styles.leftColumn : styles.mobileColumn}>
                {/* Loading indicator */}
                {isLoading && (
                  <Card style={styles.loadingCard}>
                    <CardContent style={styles.loadingContent}>
                      <ActivityIndicator size="small" color={theme.colors.primary} />
                      <Text style={styles.loadingText}>Loading dashboard data...</Text>
                    </CardContent>
                  </Card>
                )}

                {/* Welcome Section */}
                <Card style={styles.welcomeCard}>
                  <CardContent style={styles.welcomeContent}>
                    <Text style={styles.welcomeTitle}>
                      Welcome back, {effectiveDashboardData.user.firstName}!
                    </Text>
                    <Text style={styles.welcomeSubtitle}>
                      Continue your <Text style={styles.languageText}>
                        {getLanguageDisplayName(effectiveDashboardData.user.selectedLanguage || 'italian')}
                      </Text> learning journey
                    </Text>
                    
                    {/* Level and Progress */}
                    <View style={styles.levelContainer}>
                      <Badge style={styles.levelBadge}>
                        <Text style={styles.levelBadgeText}>
                          {effectiveDashboardData.user.selectedLevel ? 
                            effectiveDashboardData.user.selectedLevel.charAt(0).toUpperCase() + 
                            effectiveDashboardData.user.selectedLevel.slice(1).toLowerCase() : 'Beginner'}
                        </Text>
                      </Badge>
                      <View style={styles.progressInfo}>
                        <Text style={styles.progressText}>
                          {stats.lessonsCompleted > 0
                            ? `${Math.round(learningPath.reduce((acc, course) => acc + course.completion, 0) / learningPath.length)}% complete`
                            : '0% to Introducing Yourself'}
                        </Text>
                      </View>
                    </View>

                    {/* Stats Cards */}
                    <View style={styles.statsGrid}>
                      <View style={[styles.statCard, styles.statCardBlue]}>
                        <Text style={[styles.statValue, { color: '#2563eb' }]}>{stats.streak}</Text>
                        <Text style={[styles.statLabel, { color: '#1e40af' }]}>Day Streak</Text>
                      </View>
                      
                      <View style={[styles.statCard, styles.statCardGreen]}>
                        <Text style={[styles.statValue, { color: '#059669' }]}>{stats.lessonsCompleted}</Text>
                        <Text style={[styles.statLabel, { color: '#047857' }]}>Lessons Done</Text>
                      </View>
                      
                      <View style={[styles.statCard, styles.statCardPurple]}>
                        <Text style={[styles.statValue, { color: '#7c3aed' }]}>{stats.wordsLearned}</Text>
                        <Text style={[styles.statLabel, { color: '#6b21a8' }]}>Words Learned</Text>
                      </View>
                    </View>
                  </CardContent>
                </Card>

                {/* Learning Status */}
                <Card style={StyleSheet.flatten([
                  styles.statusCard,
                  stats.lessonsCompleted === 0 ? styles.statusCardBlueBackground : styles.statusCardGreenBackground
                ])}>
                  <CardContent style={styles.statusContent}>
                    <Ionicons 
                      name={stats.lessonsCompleted === 0 ? "ellipse-outline" : "checkmark-circle"} 
                      size={20} 
                      color={stats.lessonsCompleted === 0 ? "#2563eb" : "#059669"} 
                    />
                    <Text style={[
                      styles.statusText,
                      { color: stats.lessonsCompleted === 0 ? "#1e40af" : "#047857" }
                    ]}>
                      {stats.lessonsCompleted === 0 
                        ? `Ready to start your ${getLanguageDisplayName(effectiveDashboardData.user.selectedLanguage || 'italian')} learning journey`
                        : `Learning in progress • ${stats.lessonsCompleted} lessons completed`
                      }
                    </Text>
                  </CardContent>
                </Card>

                {/* FIXED: Daily Session Button with proper condition */}
                {shouldShowDailySessionButton && (
                  <Card style={styles.sessionCard}>
                    <CardContent style={styles.sessionContent}>
                      <View style={styles.sessionInfo}>
                        <Text style={styles.sessionTitle}>
                          Start Today's Learning Session
                        </Text>
                        <Text style={styles.sessionSubtitle}>
                          Get personalized {getLanguageDisplayName(effectiveDashboardData.user.selectedLanguage || 'italian')} lesson reminders throughout the day
                        </Text>
                        <Text style={styles.sessionNote}>
                          ✅ Notifications enabled - ready to start!
                        </Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.sessionButton}
                        onPress={handleStartDailySession}
                      >
                        <Ionicons name="play" size={16} color="#ffffff" style={styles.buttonIcon} />
                        <Text style={styles.sessionButtonText}>Start Today's Lessons</Text>
                      </TouchableOpacity>
                    </CardContent>
                  </Card>
                )}

                {/* UPDATED: Daily Session Status - only show when truly active */}
                {shouldShowActiveSession && (
                  <Card style={styles.activeSessionCard}>
                    <CardContent style={styles.activeSessionContent}>
                      <View style={styles.activeSessionIcon}>
                        <Ionicons name="checkmark-circle" size={20} color="#059669" />
                      </View>
                      <View style={styles.activeSessionInfo}>
                        <Text style={styles.activeSessionTitle}>
                          Daily learning session is active
                        </Text>
                        <Text style={styles.activeSessionSubtitle}>
                          Reminders every {settings?.notificationFrequency || 15} minutes • {getSessionRemainingTime()}
                        </Text>
                      </View>
                      <TouchableOpacity 
                        style={styles.stopSessionButton}
                        onPress={handleStopDailySession}
                      >
                        <Ionicons name="stop" size={16} color="#dc2626" />
                      </TouchableOpacity>
                    </CardContent>
                  </Card>
                )}

                {/* ADDED: Show info when notifications are disabled */}
                {!effectiveDashboardData?.settings?.notificationsEnabled && (
                  <Card style={styles.disabledNotificationCard}>
                    <CardContent style={styles.disabledNotificationContent}>
                      <View style={styles.disabledNotificationIcon}>
                        <Ionicons name="notifications-off" size={20} color="#f59e0b" />
                      </View>
                      <View style={styles.disabledNotificationInfo}>
                        <Text style={styles.disabledNotificationTitle}>
                          Notifications are disabled
                        </Text>
                        <Text style={styles.disabledNotificationSubtitle}>
                          Enable notifications below to start receiving lesson reminders
                        </Text>
                      </View>
                    </CardContent>
                  </Card>
                )}

                {/* Coming Up Next - matching web exactly */}
                <Card style={styles.upcomingCard}>
                  <CardHeader style={styles.upcomingHeader}>
                    <Text style={styles.upcomingTitle}>Coming Up Next</Text>
                    <Badge style={styles.upcomingBadge}>
                      <Text style={styles.upcomingBadgeText}>
                        {upcomingLessons[0]?.category || 'Greetings'}
                      </Text>
                    </Badge>
                  </CardHeader>
                  <CardContent style={styles.upcomingContent}>
                    {upcomingLessons.length > 0 ? (
                      <>
                        {/* Next lesson - prominent display */}
                        <View style={[
                          styles.nextLessonCard,
                          { backgroundColor: upcomingLessons[0]?.isReview ? '#eab308' : '#7c3aed' }
                        ]}>
                          <View style={styles.nextLessonInfo}>
                            <View style={styles.nextLessonHeader}>
                              {upcomingLessons[0]?.isReview && (
                                <Ionicons name="trophy" size={20} color="#fef3c7" />
                              )}
                              <Text style={styles.nextLessonTitle}>
                                {upcomingLessons[0]?.title || 'Basic Greetings'}
                              </Text>
                            </View>
                            <Text style={styles.nextLessonDescription}>
                              {upcomingLessons[0]?.description || 'Learn how to say hello and goodbye'}
                            </Text>
                          </View>
                          <TouchableOpacity 
                            style={styles.nextLessonButton}
                            onPress={() => navigation.navigate('Lesson', {
                              language: effectiveDashboardData.user.selectedLanguage || 'italian',
                              courseId: upcomingLessons[0]?.courseId || 'course1',
                              lessonId: upcomingLessons[0]?.lessonId || 'lesson1'
                            })}
                          >
                            <Text style={styles.nextLessonButtonText}>
                              {upcomingLessons[0]?.isReview ? 'Review Now' : 'Start Now'}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* Upcoming lessons - compact list */}
                        <View style={styles.upcomingList}>
                          {upcomingLessons.slice(1, 4).map((lesson, index) => (
                            <TouchableOpacity 
                              key={`${lesson.courseId}-${lesson.lessonId}-${index}`} 
                              style={[
                                styles.upcomingItem,
                                lesson.isReview && styles.upcomingItemReview
                              ]}
                              onPress={() => navigation.navigate('Lesson', {
                                language: effectiveDashboardData.user.selectedLanguage || 'italian',
                                courseId: lesson.courseId,
                                lessonId: lesson.lessonId
                              })}
                            >
                              <View style={styles.upcomingItemContent}>
                                <Text style={[
                                  styles.upcomingItemTitle,
                                  lesson.isReview && styles.upcomingItemTitleReview
                                ]}>
                                  {lesson.title}
                                </Text>
                                <Text style={[
                                  styles.upcomingItemDescription,
                                  lesson.isReview && styles.upcomingItemDescriptionReview
                                ]}>
                                  {lesson.description}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </>
                    ) : (
                      <View style={styles.noLessonsContainer}>
                        <Ionicons name="checkmark-circle" size={48} color="#10b981" />
                        <Text style={styles.noLessonsTitle}>All lessons completed!</Text>
                        <Text style={styles.noLessonsSubtitle}>Check back later for new content.</Text>
                      </View>
                    )}
                  </CardContent>
                </Card>

                {/* Recent Lessons - matching web exactly */}
                <Card style={styles.recentCard}>
                  <CardHeader>
                    <Text style={styles.recentTitle}>Recent Lessons</Text>
                  </CardHeader>
                  <CardContent style={styles.recentContent}>
                    {recentLessons.map((item) => (
                      <View key={item.id} style={styles.recentItem}>
                        <View style={styles.recentIcon}>
                          <Ionicons 
                            name="checkmark-circle" 
                            size={20} 
                            color="#10b981" 
                          />
                        </View>
                        <View style={styles.recentInfo}>
                          <Text style={styles.recentItemTitle}>{item.title}</Text>
                          <Text style={styles.recentItemSubtitle}>{item.subtitle}</Text>
                        </View>
                        <View style={styles.recentScore}>
                          <Text style={styles.recentScoreText}>{item.score}</Text>
                          <Text style={styles.recentDate}>{item.date}</Text>
                        </View>
                      </View>
                    ))}
                    
                    <TouchableOpacity style={styles.viewAllButton}>
                      <Text style={styles.viewAllButtonText}>View all lessons</Text>
                    </TouchableOpacity>
                  </CardContent>
                </Card>
              </View>

              {/* Right Sidebar - matching web exactly */}
              <View style={isTablet ? styles.rightSidebar : styles.mobileSidebar}>
                {/* Learning Path */}
                <Card style={styles.pathCard}>
                  <CardHeader>
                    <Text style={styles.pathTitle}>Learning Path</Text>
                  </CardHeader>
                  <CardContent style={styles.pathContent}>
                    {learningPath.map((item, index) => (
                      <View key={index} style={styles.pathItem}>
                        <View style={[
                          styles.pathIcon,
                          item.status === 'completed' && styles.pathIconCompleted,
                          item.status === 'current' && styles.pathIconCurrent,
                          item.status === 'available' && styles.pathIconAvailable,
                          item.status === 'locked' && styles.pathIconLocked
                        ]}>
                          {item.status === 'completed' ? (
                            <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                          ) : (
                            <Text style={[
                              styles.pathIconText,
                              item.status === 'completed' && { color: '#ffffff' },
                              item.status === 'current' && { color: '#ffffff' },
                              item.status === 'available' && { color: '#2563eb' },
                              item.status === 'locked' && { color: '#9ca3af' }
                            ]}>
                              {index + 1}
                            </Text>
                          )}
                        </View>
                        <View style={styles.pathInfo}>
                          <Text style={styles.pathName}>{item.name}</Text>
                          <Text style={styles.pathProgress}>{item.progress}</Text>
                        </View>
                        <Text style={styles.pathStatus}>
                          {item.completion === 100 ? 'DONE' : 
                          item.status === 'current' ? `${Math.round(item.completion)}%` :
                          item.status === 'available' ? 'START' :
                          'LOCKED'}
                        </Text>
                      </View>
                    ))}
                    
                    <View style={styles.pathFooter}>
                      <Text style={styles.pathFooterTitle}>
                        Complete {getLanguageDisplayName(effectiveDashboardData.user.selectedLanguage || 'italian')} Course
                      </Text>
                      <Text style={styles.pathFooterSubtitle}>
                        {effectiveCourseStats.totalLessons} lessons • {effectiveCourseStats.totalCourses} courses
                      </Text>
                      <TouchableOpacity 
                        style={styles.pathFooterButton}
                        onPress={handleNavigateToCourses}
                      >
                        <Text style={styles.pathFooterButtonText}>View</Text>
                      </TouchableOpacity>
                    </View>
                  </CardContent>
                </Card>

                {/* Notifications - Use updated NotificationSettings component */}
                <NotificationSettings />

                {/* Learning Progress Card - matching web exactly */}
                <Card style={styles.progressCard}>
                  <CardHeader>
                    <Text style={styles.progressTitle}>Learning Progress</Text>
                  </CardHeader>
                  <CardContent style={styles.progressCardContent}>
                    <View style={styles.progressStats}>
                      <View style={styles.progressStat}>
                        <Text style={styles.progressStatLabel}>Lessons Completed</Text>
                        <Text style={styles.progressStatValue}>{stats.lessonsCompleted}</Text>
                      </View>
                      <View style={styles.progressStat}>
                        <Text style={styles.progressStatLabel}>Current Streak</Text>
                        <Text style={styles.progressStatValue}>{stats.streak} days</Text>
                      </View>
                      <View style={styles.progressStat}>
                        <Text style={styles.progressStatLabel}>Words Learned</Text>
                        <Text style={styles.progressStatValue}>{stats.wordsLearned}</Text>
                      </View>
                      <View style={styles.progressStat}>
                        <Text style={styles.progressStatLabel}>Learning Language</Text>
                        <Text style={styles.progressStatValue}>
                          {getLanguageDisplayName(effectiveDashboardData.user.selectedLanguage || 'italian')}
                        </Text>
                      </View>
                      <View style={styles.progressStat}>
                        <Text style={styles.progressStatLabel}>Level</Text>
                        <Text style={styles.progressStatValue}>
                          {effectiveDashboardData.user.selectedLevel ? 
                            effectiveDashboardData.user.selectedLevel.charAt(0).toUpperCase() + 
                            effectiveDashboardData.user.selectedLevel.slice(1).toLowerCase() : 'Beginner'}
                        </Text>
                      </View>
                    </View>
                  </CardContent>
                </Card>
              </View>
            </View>
            <Footer />
          </View>
        </ScrollView>
        
        {/* Notification Setup Overlay */}
        <NotificationSetupOverlay 
          isVisible={showNotificationSetup} 
          onClose={handleCloseNotificationOverlay}
        />
      </SafeAreaView>
    </View>
  );
}

// ADDED: New styles for the additional components
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  safeArea: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
  },

  // Header - matching web exactly
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginTop: 10,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    maxWidth: 1280,
    alignSelf: 'center',
    width: '100%',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  dashboardButton: {
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  dashboardButtonText: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '500',
    paddingRight: 5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  accountButtonText: {
    fontSize: 14,
    color: theme.colors.foreground,
  },

  // Content - matching web layout exactly
  content: {
    flex: 1,
  },
  mainContainer: {
    maxWidth: 1280,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
    width: '100%',
  },
  gridContainerTablet: {
    flexDirection: 'row',
    gap: 24,
  },
  gridContainerMobile: {
    flexDirection: 'column',
    gap: 24,
  },
  leftColumn: {
    flex: 3,
    gap: 24,
  },
  mobileColumn: {
    flex: 1,
    gap: 24,
  },
  rightSidebar: {
    flex: 1,
    gap: 24,
  },
  mobileSidebar: {
    flex: 1,
    gap: 24,
  },

  // Loading Card
  loadingCard: {
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#2563eb',
  },

  // Welcome Card - matching web exactly
  welcomeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  welcomeContent: {
    padding: 24,
    gap: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  languageText: {
    color: '#2563eb',
    fontWeight: '500',
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  levelBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  progressInfo: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
  },

  // Stats Grid - Mobile/Desktop Responsive (matching web exactly)
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  statCardBlue: {
    backgroundColor: '#eff6ff',
    borderColor: '#dbeafe',
  },
  statCardGreen: {
    backgroundColor: '#f0fdf4',
    borderColor: '#dcfce7',
  },
  statCardPurple: {
    backgroundColor: '#faf5ff',
    borderColor: '#e9d5ff',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
  },

  // Status Card (matching web exactly)
  statusCard: {
    borderRadius: 8,
    borderWidth: 1,
  },
  statusCardBlueBackground: {
    backgroundColor: '#eff6ff',
    borderColor: '#dbeafe',
  },
  statusCardGreenBackground: {
    backgroundColor: '#f0fdf4',
    borderColor: '#dcfce7',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },

  // Session Card (matching web exactly)
  sessionCard: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#bfdbfe',
    backgroundColor: '#f0f9ff',
  },
  sessionContent: {
    padding: 24,
    gap: 16,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  sessionSubtitle: {
    fontSize: 14,
    color: '#3b82f6',
  },
  sessionNote: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '500',
    marginTop: 8,
  },
  sessionButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6,
    gap: 8,
  },
  buttonIcon: {
    marginRight: 4,
  },
  sessionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },

  // Active Session Card (matching web exactly)
  activeSessionCard: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  activeSessionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  activeSessionIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#dcfce7',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeSessionInfo: {
    flex: 1,
  },
  activeSessionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#14532d',
  },
  activeSessionSubtitle: {
    fontSize: 12,
    color: '#166534',
  },

  // Upcoming Card (matching web exactly)
  upcomingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 0,
  },
  upcomingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  upcomingBadge: {
    backgroundColor: '#f3e8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upcomingBadgeText: {
    color: '#7c3aed',
    fontSize: 12,
    fontWeight: '500',
  },
  upcomingContent: {
    padding: 16,
    gap: 12,
  },

  // Next Lesson Card (matching web exactly)
  nextLessonCard: {
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nextLessonInfo: {
    flex: 1,
  },
  nextLessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  nextLessonTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  nextLessonDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  nextLessonButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  nextLessonButtonText: {
    color: '#7c3aed',
    fontSize: 14,
    fontWeight: '500',
  },

  // Upcoming List (matching web exactly)
  upcomingList: {
    gap: 8,
  },
  upcomingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  upcomingItemReview: {
    backgroundColor: '#fefce8',
    borderLeftWidth: 2,
    borderLeftColor: '#eab308',
  },
  upcomingItemContent: {
    flex: 1,
  },
  upcomingItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  upcomingItemTitleReview: {
    color: '#92400e',
  },
  upcomingItemDescription: {
    fontSize: 12,
    color: '#6b7280',
  },
  upcomingItemDescriptionReview: {
    color: '#a16207',
  },

  // No Lessons (matching web exactly)
  noLessonsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  noLessonsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  noLessonsSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },

  // Recent Card (matching web exactly)
  recentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    padding: 16,
    paddingBottom: 0,
  },
  recentContent: {
    padding: 16,
    gap: 16,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  recentIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#dcfce7',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentInfo: {
    flex: 1,
  },
  recentItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  recentItemSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  recentScore: {
    alignItems: 'flex-end',
  },
  recentScoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10b981',
  },
  recentDate: {
    fontSize: 12,
    color: '#6b7280',
  },
  viewAllButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllButtonText: {
    fontSize: 14,
    color: '#374151',
  },

  // Learning Path (matching web exactly)
  pathCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  pathTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    padding: 16,
    paddingBottom: 0,
  },
  pathContent: {
    padding: 16,
    gap: 12,
  },
  pathItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pathIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pathIconCompleted: {
    backgroundColor: '#059669',
  },
  pathIconCurrent: {
    backgroundColor: '#2563eb',
  },
  pathIconAvailable: {
    backgroundColor: '#dbeafe',
  },
  pathIconLocked: {
    backgroundColor: '#e5e7eb',
  },
  pathIconText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pathInfo: {
    flex: 1,
  },
  pathName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  pathProgress: {
    fontSize: 12,
    color: '#6b7280',
  },
  pathStatus: {
    fontSize: 12,
    color: '#6b7280',
  },
  pathFooter: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  pathFooterTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563eb',
  },
  pathFooterSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  pathFooterButton: {
    borderWidth: 1,
    borderColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
  },
  pathFooterButtonText: {
    fontSize: 14,
    color: '#2563eb',
  },

  // Learning Progress Card - matching web exactly
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    padding: 16,
    paddingBottom: 0,
  },
  progressCardContent: {
    padding: 16,
  },
  progressStats: {
    gap: 16,
  },
  progressStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressStatLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  progressStatValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },

  // Add these new styles:
  stopSessionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  disabledNotificationCard: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
  },
  disabledNotificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  disabledNotificationIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledNotificationInfo: {
    flex: 1,
  },
  disabledNotificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400e',
  },
  disabledNotificationSubtitle: {
    fontSize: 12,
    color: '#a16207',
  },
});