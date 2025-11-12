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
import NotificationSettings from '../components/NotificationSettings';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { useSheetManager } from '../contexts/SheetManagerContext';
import { useResponsiveBreakpoints } from '../hooks/useResponsiveBreakpoints';

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
    
    if (data?.action === 'openLesson' && data?.courseId && data?.lessonId && data?.language) {
      console.log('🎯 Navigating to lesson:', {
        language: data.language,
        courseId: data.courseId,
        lessonId: data.lessonId
      });
      
      // Dismiss any open sheets before navigating
      await sheetManager.dismissAllSheets();
      
      // Navigate to the lesson
      navigation.navigate('Lesson', {
        language: data.language,
        courseId: data.courseId,
        lessonId: data.lessonId
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
      queryClient.invalidateQueries({ queryKey: ["/api/upcoming-lessons"] });
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

  // REMOVED: Local notification scheduling (now handled by backend push notifications)
  // Backend reads user preferences and sends push notifications via Expo Push Service

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
  const recentProgress = allProgress.slice(0, 8);

  console.log('🎨 Rendering Dashboard:', {
    userName: effectiveDashboardData.user.firstName,
    statsData: stats,
    progressCount: allProgress.length,
    upcomingCount: upcomingLessons.length,
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
                        <Text style={[styles.statValue, { color: theme.colors.primary, fontSize: isSmallHandset ? 20 : 24 }]}>{stats.streak}</Text>
                        <Text style={[styles.statLabel, { color: theme.colors.primary }]}>Day Streak</Text>
                      </View>
                      
                      <View style={[styles.statCard, styles.statCardGreen, { 
                        padding: isSmallHandset ? 12 : 16,
                        paddingVertical: Platform.OS === 'android' ? (isSmallHandset ? 10 : 14) : (isSmallHandset ? 12 : 16)
                      }]}>
                        <Text style={[styles.statValue, { color: theme.colors.success500, fontSize: isSmallHandset ? 20 : 24 }]}>{stats.lessonsCompleted}</Text>
                        <Text style={[styles.statLabel, { color: theme.colors.success600 }]}>Lessons Done</Text>
                      </View>
                      
                      <View style={[styles.statCard, styles.statCardPurple, { 
                        padding: isSmallHandset ? 12 : 16,
                        paddingVertical: Platform.OS === 'android' ? (isSmallHandset ? 10 : 14) : (isSmallHandset ? 12 : 16)
                      }]}>
                        <Text style={[styles.statValue, { color: theme.colors.primary, fontSize: isSmallHandset ? 20 : 24 }]}>{stats.wordsLearned}</Text>
                        <Text style={[styles.statLabel, { color: theme.colors.primary }]}>Words Learned</Text>
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
                          { backgroundColor: upcomingLessons[0]?.isReview ? theme.colors.warning500 : theme.colors.primary }
                        ]}>
                          <View style={styles.nextLessonInfo}>
                            <View style={styles.nextLessonHeader}>
                              {upcomingLessons[0]?.isReview && (
                                <Ionicons name="trophy" size={20} color={theme.colors.warning50} />
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
                        <Ionicons name="checkmark-circle" size={48} color={theme.colors.success500} />
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
                  </CardContent>
                </Card>
              </View>

              {/* Right Sidebar - matching web exactly */}
              <View style={isTablet ? styles.rightSidebar : styles.mobileSidebar}>
                {/* Notifications - Use updated NotificationSettings component */}
                <NotificationSettings />
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
    backgroundColor: '#F9FAFB',
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

  // Loading Card
  loadingCard: {
    backgroundColor: theme.colors.primary50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary100,
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
    color: theme.colors.primary,
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
    borderWidth: 1,
  },
  statCardBlue: {
    backgroundColor: theme.colors.primary50,
    borderColor: theme.colors.primary100,
  },
  statCardGreen: {
    backgroundColor: theme.colors.success50,
    borderColor: theme.colors.success50,
  },
  statCardPurple: {
    backgroundColor: theme.colors.primary50,
    borderColor: theme.colors.primary100,
  },
  statValue: {
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '500',
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
    backgroundColor: theme.colors.primary50,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
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
    color: 'rgba(255, 255, 255, 0.9)',
  },
  nextLessonButton: {
    backgroundColor: theme.colors.background,
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
    backgroundColor: '#F9FAFB',
  },
  upcomingItemReview: {
    backgroundColor: theme.colors.warning50,
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
    color: theme.colors.warning600,
  },
  upcomingItemDescription: {
    fontSize: 12,
    color: theme.colors.mutedForeground,
  },
  upcomingItemDescriptionReview: {
    color: theme.colors.warning600,
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
    backgroundColor: '#F9FAFB',
  },
  recentIcon: {
    width: 32,
    height: 32,
    backgroundColor: theme.colors.success50,
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
    borderColor: theme.colors.border,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  viewAllButtonText: {
    fontSize: 14,
    color: theme.colors.foreground,
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
    borderWidth: 2,
    borderColor: theme.colors.warning500,
    backgroundColor: theme.colors.warning50,
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
    backgroundColor: theme.colors.warning50,
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
    color: theme.colors.warning600,
  },
  disabledNotificationSubtitle: {
    fontSize: 12,
    color: theme.colors.warning600,
  },
});
