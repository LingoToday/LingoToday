import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  useWindowDimensions,
  Linking,
  AppState,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/apiClient';
import { theme } from '../lib/theme';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { useSheetManager } from '../contexts/SheetManagerContext';
import { useResponsiveBreakpoints } from '../hooks/useResponsiveBreakpoints';
import { V2UpcomingLesson, V2UpcomingLessonsResponse } from '../types';

// Type definitions - matching web exactly
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  selectedLanguage?: string;
  selectedLevel?: string;
  completedOnboarding?: boolean;
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
    mobileNotificationsEnabled: boolean;
    mobileNotificationFrequency?: number;
    mobileNotificationStartTime?: string;
    mobileNotificationEndTime?: string;
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

// Helper function to get language-specific notification messages
export const getLanguageSpecificNotification = (languageCode: string) => {
  const notifications = {
    italian: {
      title: "LingoToday",
      body: "Ciao! It's time for your next quick lesson. Keep the consistency and you will be fluent in no time. Andiamo! 🇮🇹"
    },
    spanish: {
      title: "LingoToday", 
      body: "¡Hola! Es hora de tu próxima lección rápida. Mantén la consistencia y serás fluente en poco tiempo. ¡Vamos! 🇪🇸"
    },
    french: {
      title: "LingoToday",
      body: "Salut! Il est temps pour votre prochaine leçon rapide. Gardez la consistance et vous serez fluent en un rien de temps. Allons-y! 🇫🇷"
    },
    german: {
      title: "LingoToday",
      body: "Hallo! Es ist Zeit für Ihre nächste schnelle Lektion. Bleiben Sie konsequent und Sie werden in kürzester Zeit fließend sprechen. Los geht's! 🇩🇪"
    },
    portuguese: {
      title: "LingoToday",
      body: "Olá! É hora da sua próxima lição rápida. Mantenha a consistência e você será fluente em pouco tempo. Vamos! 🇵🇹"
    },
    mandarin: {
      title: "LingoToday",
      body: "你好! It's time for your next quick lesson. Keep the consistency and you will be fluent in no time. 加油! 🇨🇳"
    },
    japanese: {
      title: "LingoToday",
      body: "こんにちは! It's time for your next quick lesson. Keep the consistency and you will be fluent in no time. 頑張って! 🇯🇵"
    },
    korean: {
      title: "LingoToday",
      body: "안녕하세요! It's time for your next quick lesson. Keep the consistency and you will be fluent in no time. 화이팅! 🇰🇷"
    }
  };

  const normalizedCode = languageCode?.toLowerCase();
  return notifications[normalizedCode as keyof typeof notifications] || notifications.italian;
}

export default function DashboardScreenNew() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const { isSmallHandset } = useResponsiveBreakpoints();
  const { user, logout } = useAuth();
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const sheetManager = useSheetManager();
  const [refreshing, setRefreshing] = useState(false);
  const hasCheckedNotificationsOnMount = useRef(false);
  const appState = useRef(AppState.currentState);
  
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
    },
    settings: {
      notificationsEnabled: false,
      mobileNotificationsEnabled: false,
      mobileNotificationFrequency: 15,
      mobileNotificationStartTime: '09:00',
      mobileNotificationEndTime: '18:00',
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

  const fallbackV2Tracks: V2UpcomingLesson[] = [
    {
      id: 'it_A1_basics',
      language: 'it',
      level: 'A1',
      track: 'basics',
      title: 'Basics',
      description: 'Essential greetings and introductions',
      phraseCount: 45,
      progress: { attempted: 0, mastered: 0, total: 45, percent: 0 },
      status: 'new',
      sortOrder: 1,
    },
    {
      id: 'it_A1_daily_life',
      language: 'it',
      level: 'A1',
      track: 'daily_life',
      title: 'Daily Life',
      description: 'Everyday conversations and routines',
      phraseCount: 12,
      progress: { attempted: 0, mastered: 0, total: 12, percent: 0 },
      status: 'new',
      sortOrder: 2,
    },
    {
      id: 'it_A1_holiday',
      language: 'it',
      level: 'A1',
      track: 'holiday',
      title: 'Holiday',
      description: 'Travel and vacation phrases',
      phraseCount: 0,
      progress: { attempted: 0, mastered: 0, total: 0, percent: 0 },
      status: 'new',
      sortOrder: 3,
    },
    {
      id: 'it_A1_social',
      language: 'it',
      level: 'A1',
      track: 'social',
      title: 'Social',
      description: 'Making friends and socializing',
      phraseCount: 0,
      progress: { attempted: 0, mastered: 0, total: 0, percent: 0 },
      status: 'new',
      sortOrder: 4,
    },
  ];

  // ADDED: Notification listeners for handling taps
useEffect(() => {
    // Handle notification received while app is in foreground
  const foregroundSubscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('📱 Notification received in foreground:', notification);
  });

  // Handle notification tapped (app in background/closed)
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(async response => {
    console.log('👆 Notification tapped:', response);
    
    const data = response.notification.request.content.data;
    
    if (data?.action === 'openLesson' && data?.language && data?.track) {
      console.log('🎯 Navigating to track:', {
        language: data.language,
        track: data.track,
        level: data.level,
      });
      
      await sheetManager.dismissAllSheets();
      
      navigation.navigate('Lesson', {
        language: data.language,
        track: data.track as string,
        level: (data.level as string) || 'A1',
      });
    }
  });

  // Cleanup subscriptions
  return () => {
    foregroundSubscription.remove();
    responseSubscription.remove();
  };
}, [navigation]);

  // Refetch dashboard data when screen comes into focus (e.g., after completing a lesson)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Dashboard screen focused - refetching data');
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/v2/upcoming-lessons"] });
      queryClient.invalidateQueries({ queryKey: ["/api/course-stats"] });
    }, [queryClient])
  );

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

  const { data: v2TracksResponse } = useQuery<V2UpcomingLessonsResponse>({
    queryKey: ["/api/v2/upcoming-lessons"],
    queryFn: async () => {
      try {
        const rawUserId = user?.id || '1';
        const userId = String(parseInt(rawUserId) || 1);
        const result = await apiClient.getV2UpcomingLessons(userId);
        console.log('[Dashboard] V2 upcoming-lessons response:', JSON.stringify(result?.lessons?.[0], null, 2));
        return result;
      } catch (error) {
        console.warn('⚠️ V2 upcoming lessons API failed, using fallback:', error);
        return {
          language: 'it',
          languageName: 'Italian',
          lessons: fallbackV2Tracks,
        };
      }
    },
    enabled: !!user,
    retry: 1,
  });

  // Use effective data (API or fallback)
  const effectiveDashboardData = dashboardData || getFallbackData();
  const effectiveCourseStats = courseStats || { totalCourses: 5, totalLessons: 78 };
  const v2Tracks = v2TracksResponse?.lessons || fallbackV2Tracks;

  // REMOVED: Local notification scheduling (now handled by backend push notifications)
  // Backend reads user preferences and sends push notifications via Expo Push Service

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await queryClient.refetchQueries({ queryKey: ["/api/dashboard"] });
      await queryClient.refetchQueries({ queryKey: ["/api/v2/upcoming-lessons"] });
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
    navigation.navigate('MainTabs', { screen: 'Profile' } as never);
  };

  // Handle navigation to Courses
  const handleNavigateToCourses = () => {
    navigation.navigate('Courses');
  };

  const styles = useMemo(() => createStyles(isTablet), [isTablet]);

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
  const recentProgress = allProgress.slice(0, 4);

  console.log('🎨 Rendering Dashboard:', {
    userName: effectiveDashboardData.user.firstName,
    statsData: stats,
    progressCount: allProgress.length,
    upcomingCount: v2Tracks.length,
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
    : [];

  // Full-screen loading overlay
  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.fullScreenLoading}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.fullScreenLoadingText}>
              Getting everything ready for you.{'\n'}It'll be just a few seconds
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
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
                            ? `${stats.lessonsCompleted} lessons completed`
                            : 'Start your first lesson'}
                        </Text>
                      </View>
                    </View>

                    {/* Stats Cards */}
                    <View style={styles.statsGrid}>
                      <View style={[styles.statCard, styles.statCardBlue, { 
                        padding: isSmallHandset ? 12 : 16,
                        paddingVertical: Platform.OS === 'android' ? (isSmallHandset ? 10 : 14) : (isSmallHandset ? 12 : 16)
                      }]}>
                        <Text style={[styles.statValue, { fontSize: isSmallHandset ? 20 : 24 }]}>{stats.streak}</Text>
                        <Text style={styles.statLabel}>Day Streak</Text>
                      </View>
                      
                      <View style={[styles.statCard, styles.statCardGreen, { 
                        padding: isSmallHandset ? 12 : 16,
                        paddingVertical: Platform.OS === 'android' ? (isSmallHandset ? 10 : 14) : (isSmallHandset ? 12 : 16)
                      }]}>
                        <Text style={[styles.statValue, { fontSize: isSmallHandset ? 20 : 24 }]}>{stats.lessonsCompleted}</Text>
                        <Text style={styles.statLabel}>Lessons Done</Text>
                      </View>
                      
                      <View style={[styles.statCard, styles.statCardPurple, { 
                        padding: isSmallHandset ? 12 : 16,
                        paddingVertical: Platform.OS === 'android' ? (isSmallHandset ? 10 : 14) : (isSmallHandset ? 12 : 16)
                      }]}>
                        <Text style={[styles.statValue, { fontSize: isSmallHandset ? 20 : 24 }]}>{stats.wordsLearned}</Text>
                        <Text style={styles.statLabel}>Words Learned</Text>
                      </View>
                    </View>
                  </CardContent>
                </Card>


                {/* ADDED: Show info when notifications are disabled */}
                {!effectiveDashboardData?.settings?.mobileNotificationsEnabled && (
                  <Card style={styles.disabledNotificationCard}>
                    <CardContent style={styles.disabledNotificationContent}>
                      <View style={styles.disabledNotificationIcon}>
                        <Ionicons name="notifications-off" size={20} color={theme.colors.warning500} />
                      </View>
                      <View style={styles.disabledNotificationInfo}>
                        <Text style={styles.disabledNotificationTitle}>
                          Notifications are disabled
                        </Text>
                        <Text style={styles.disabledNotificationSubtitle}>
                          Enable notifications in your Profile settings to start receiving lesson reminders
                        </Text>
                      </View>
                    </CardContent>
                  </Card>
                )}

                <Card style={styles.upcomingCard}>
                  <CardHeader style={styles.upcomingHeader}>
                    <Text style={styles.upcomingTitle}>Your Tracks</Text>
                  </CardHeader>
                  <CardContent style={styles.upcomingContent}>
                    {v2Tracks.length > 0 ? (
                      <View style={styles.upcomingList}>
                        {v2Tracks.map((trackItem, index) => {
                          const isFirst = index === 0;
                          
                          return (
                            <TouchableOpacity
                              key={trackItem.id}
                              style={[
                                isFirst ? styles.nextLessonCard : styles.trackItem,
                                isFirst && { backgroundColor: theme.colors.primary },
                              ]}
                              onPress={() => navigation.navigate('Lesson', {
                                language: trackItem.language,
                                track: trackItem.track,
                                level: trackItem.level,
                              })}
                            >
                              {isFirst ? (
                                <>
                                  <View style={styles.nextLessonInfo}>
                                    <View style={styles.nextLessonHeader}>
                                      <Text style={styles.nextLessonTitle}>{trackItem.title}</Text>
                                    </View>
                                    <Text style={styles.nextLessonDescription}>{trackItem.description}</Text>
                                    {trackItem.phraseCount > 0 && (
                                      <View style={styles.trackProgressRow}>
                                        <View style={styles.trackProgressBarBg}>
                                          <View style={[styles.trackProgressBarFill, { width: `${trackItem.progress.percent}%`, backgroundColor: theme.colors.primaryForeground }]} />
                                        </View>
                                        <Text style={[styles.trackProgressText, { color: theme.colors.primaryForeground }]}>
                                          {trackItem.progress.mastered}/{trackItem.progress.total} phrases
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                  <View style={styles.nextLessonButton}>
                                    <Text style={styles.nextLessonButtonText}>
                                      {trackItem.status === 'new' ? 'Start' : trackItem.status === 'in_progress' ? 'Continue' : 'Review'}
                                    </Text>
                                  </View>
                                </>
                              ) : (
                                <>
                                  <View style={styles.trackItemContent}>
                                    <Text style={styles.upcomingItemTitle}>{trackItem.title}</Text>
                                    <Text style={styles.upcomingItemDescription}>{trackItem.description}</Text>
                                    {trackItem.phraseCount > 0 && (
                                      <View style={styles.trackProgressRow}>
                                        <View style={styles.trackProgressBarBg}>
                                          <View style={[styles.trackProgressBarFill, { width: `${trackItem.progress.percent}%` }]} />
                                        </View>
                                        <Text style={styles.trackProgressText}>
                                          {trackItem.progress.mastered}/{trackItem.progress.total}
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                  <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
                                </>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    ) : (
                      <View style={styles.noLessonsContainer}>
                        <Ionicons name="checkmark-circle" size={48} color={theme.colors.success500} />
                        <Text style={styles.noLessonsTitle}>All tracks completed!</Text>
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
                    {recentLessons.length > 0 ? (
                      <>
                        {recentLessons.map((item) => (
                          <View key={item.id} style={styles.recentItem}>
                            <View style={styles.recentIcon}>
                              <Ionicons 
                                name="checkmark-circle" 
                                size={20} 
                                color={theme.colors.success500} 
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
                      </>
                    ) : (
                      <View style={styles.noRecentLessonsContainer}>
                        <Ionicons name="book-outline" size={48} color={theme.colors.mutedForeground} />
                        <Text style={styles.noRecentLessonsTitle}>No lessons completed yet</Text>
                        <Text style={styles.noRecentLessonsSubtitle}>Start your first lesson to see your progress here!</Text>
                      </View>
                    )}
                  </CardContent>
                </Card>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ADDED: New styles for the additional components
const createStyles = (isTablet: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    color: theme.colors.destructive,
    textAlign: 'center',
  },

  // Header - matching web exactly
  header: {
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
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
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.foreground,
  },
  dashboardButton: {
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  dashboardButtonText: {
    fontSize: 16,
    color: theme.colors.primary,
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
    flex: 2,
    gap: 24,
    maxWidth: isTablet ? '60%' : '100%',
  },
  mobileColumn: {
    flex: 1,
    gap: 24,
  },
  rightSidebar: {
    flex: 1,
    gap: 24,
    minWidth: isTablet ? 320 : 0,
  },
  mobileSidebar: {
    flex: 1,
    gap: 24,
  },

  // Full-screen Loading
  fullScreenLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  fullScreenLoadingText: {
    fontSize: 16,
    color: theme.colors.foreground,
    textAlign: 'center' as any,
    marginTop: 24,
    lineHeight: 24,
  },

  // Welcome Card - matching web exactly
  welcomeCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  welcomeContent: {
    padding: 24,
    gap: 24,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.foreground,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: theme.colors.mutedForeground,
  },
  languageText: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  levelBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  levelBadgeText: {
    color: theme.colors.primaryForeground,
    fontSize: 12,
    fontWeight: '500',
  },
  progressInfo: {
    alignItems: 'flex-end',
  },
  progressText: {
    fontSize: 14,
    color: theme.colors.mutedForeground,
  },

  // Stats Grid - Mobile/Desktop Responsive (matching web exactly)
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 0,
  },
  statCardBlue: {
    backgroundColor: theme.colors.primary,
    borderColor: 'transparent',
  },
  statCardGreen: {
    backgroundColor: theme.colors.secondary500,
    borderColor: 'transparent',
  },
  statCardPurple: {
    backgroundColor: theme.colors.gradientPurple,
    borderColor: 'transparent',
  },
  statValue: {
    fontWeight: '700',
    marginBottom: 4,
    color: theme.colors.onSecondary,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.onSecondary,
  },

  // Session Card (matching web exactly)
  sessionCard: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.primary100,
    backgroundColor: theme.colors.primary50,
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
    color: theme.colors.primary,
    marginBottom: 8,
  },
  sessionSubtitle: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  sessionNote: {
    fontSize: 12,
    color: theme.colors.success500,
    fontWeight: '500',
    marginTop: 8,
  },
  sessionButton: {
    backgroundColor: theme.colors.primary,
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
    color: theme.colors.primaryForeground,
    fontSize: 16,
    fontWeight: '500',
  },

  // Active Session Card (matching web exactly)
  activeSessionCard: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.success50,
    backgroundColor: theme.colors.success50,
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
    backgroundColor: theme.colors.success50,
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
    color: theme.colors.success600,
  },
  activeSessionSubtitle: {
    fontSize: 12,
    color: theme.colors.success600,
  },

  // Upcoming Card (matching web exactly)
  upcomingCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  upcomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Platform.OS === 'android' ? 14 : 16,
    paddingBottom: 0,
  },
  upcomingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  upcomingBadge: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  upcomingBadgeText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  upcomingContent: {
    padding: Platform.OS === 'android' ? 14 : 16,
    gap: Platform.OS === 'android' ? 10 : 12,
  },

  // Next Lesson Card (matching web exactly)
  nextLessonCard: {
    borderRadius: 8,
    padding: Platform.OS === 'android' ? 14 : 16,
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
    color: theme.colors.primaryForeground,
  },
  nextLessonDescription: {
    fontSize: 14,
    color: theme.colors.primaryForeground,
  },
  nextLessonButton: {
    backgroundColor: theme.colors.surfaceDark,
    paddingHorizontal: Platform.OS === 'android' ? 14 : 16,
    paddingVertical: Platform.OS === 'android' ? 6 : 8,
    borderRadius: 6,
  },
  nextLessonButtonText: {
    color: theme.colors.primary,
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
    padding: Platform.OS === 'android' ? 10 : 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceDark,
  },
  upcomingItemReview: {
    backgroundColor: theme.colors.surfaceDark,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.warning500,
  },
  upcomingItemContent: {
    flex: 1,
  },
  upcomingItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.foreground,
  },
  upcomingItemTitleReview: {
    color: theme.colors.foreground,
  },
  upcomingItemDescription: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
  },
  upcomingItemDescriptionReview: {
    color: theme.colors.textSecondary,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Platform.OS === 'android' ? 12 : 14,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceDark,
    gap: 12,
  },
  trackIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackItemContent: {
    flex: 1,
    gap: 4,
  },
  trackProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  trackProgressBarBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
    overflow: 'hidden' as const,
  },
  trackProgressBarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
  },
  trackProgressText: {
    fontSize: 11,
    color: theme.colors.mutedForeground,
    minWidth: 45,
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
    color: theme.colors.foreground,
  },
  noLessonsSubtitle: {
    fontSize: 14,
    color: theme.colors.mutedForeground,
  },

  // No Recent Lessons (matching web exactly)
  noRecentLessonsContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  noRecentLessonsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.foreground,
  },
  noRecentLessonsSubtitle: {
    fontSize: 14,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },

  // Recent Card (matching web exactly)
  recentCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  recentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.foreground,
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
    backgroundColor: theme.colors.cardHover,
  },
  recentIcon: {
    width: 32,
    height: 32,
    backgroundColor: 'transparent',
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
    color: theme.colors.foreground,
  },
  recentItemSubtitle: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
  },
  recentScore: {
    alignItems: 'flex-end',
  },
  recentScoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.success500,
  },
  recentDate: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
  },
  viewAllButton: {
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  viewAllButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },

  // Add these new styles:
  stopSessionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  disabledNotificationCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.warning500,
    backgroundColor: theme.colors.card,
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
    backgroundColor: 'transparent',
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
    color: theme.colors.foreground,
  },
  disabledNotificationSubtitle: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
  },
});
