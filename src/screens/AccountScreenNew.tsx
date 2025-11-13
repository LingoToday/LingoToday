import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

import { theme } from '../lib/theme';
import { useAuth } from '../hooks/useAuth';
import { apiClient, DashboardData } from '../lib/apiClient';
import { Card } from '../components/ui/Card';
import LessonProgress from '../components/LessonProgress';

// Type definitions - matching web exactly
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  selectedLanguage?: string;
  selectedLevel?: string;
  completedOnboarding?: boolean;
  authProvider?: string;
  priceTier?: string;
  createdAt?: string;
}


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
  return languages[code.toLowerCase()] || code.charAt(0).toUpperCase() + code.slice(1);
}

function getLanguageFlag(code: string): string {
  const flags: { [key: string]: string } = {
    italian: '🇮🇹',
    spanish: '🇪🇸',
    french: '🇫🇷',
    german: '🇩🇪',
    portuguese: '🇵🇹',
    mandarin: '🇨🇳',
    japanese: '🇯🇵',
    korean: '🇰🇷',
  };
  return flags[code.toLowerCase()] || '🌍';
}

function getLearningTier(priceTier?: string): string {
  if (!priceTier || priceTier === 'n/a' || priceTier === 'free-trial') {
    return 'Free';
  }
  if (priceTier.startsWith('pro-')) {
    return 'Pro';
  }
  if (priceTier.startsWith('plus-')) {
    return 'Plus';
  }
  return 'Free';
}

export default function AccountScreen() {
  const navigation = useNavigation();
  const { user: authUser, logout } = useAuth();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const response = await apiClient.getCurrentUser();
      return (response as any).data || response;
    },
    enabled: !!authUser,
  });

  // Fetch dashboard data for progress tracking
  const { data: dashboardData } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard'],
    queryFn: async () => {
      try {
        return await apiClient.getDashboardData();
      } catch (error) {
        console.error('Dashboard query error:', error);
        // Return fallback data to prevent UI breaking
        const fallbackData: DashboardData = {
          user: {
            id: authUser?.id || '',
            email: authUser?.email || '',
            firstName: authUser?.firstName || 'User',
          } as DashboardData['user'],
          settings: {
            notificationsEnabled: false,
            mobileNotificationsEnabled: false,
            mobileNotificationFrequency: 15,
            mobileNotificationStartTime: '08:00',
            mobileNotificationEndTime: '22:00',
            selectedLanguage: authUser?.selectedLanguage || 'italian',
          },
          stats: {
            streak: 0,
            totalLessons: 0,
            wordsLearned: 0,
            lessonsCompleted: 0,
          },
          progress: []
        };
        return fallbackData;
      }
    },
    enabled: !!authUser,
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  // Calculate completed lesson IDs from dashboard data
  const completedLessonIds = React.useMemo(() => {
    if (!dashboardData?.progress) return [];
    
    return dashboardData.progress
      .filter((p: any) => p.completed === true)
      .map((p: any) => p.lessonId);
  }, [dashboardData?.progress]);

  const handleLogout = () => {
    Alert.alert(
      'Are you sure you want to log out?',
      '',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        },
      ]
    );
  };

  const handleNavigateToSubscription = () => {
    navigation.navigate('Subscription' as never);
  };

  const handleNavigateToNotificationSettings = () => {
    navigation.navigate('NotificationSettings' as never);
  };

  if (userLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading account information...</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>Please log in to view your account.</Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login' as never)}
          >
            <Text style={styles.loginButtonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const memberSince = user.createdAt ? new Date(user.createdAt) : null;
  const userName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user.firstName || user.email?.split('@')[0] || 'User';

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gridContainer}>
            <Text style={styles.pageTitle}>Profile</Text>
            <Text style={styles.userName} testID="user-name">
              Hey {userName}, your language journey continues!
            </Text>

            <Card>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Email</Text>
                  <Text style={styles.infoValue} testID="user-email">{user.email}</Text>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Member Since</Text>
                  <Text style={styles.infoValue} testID="member-since">
                    {memberSince 
                      ? format(memberSince, 'MMMM d, yyyy')
                      : 'Unknown'
                    }
                  </Text>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Learning Tier</Text>
                  <Text style={styles.infoValue} testID="learning-tier">
                    {getLearningTier(user.priceTier)}
                  </Text>
                </View>
              </View>
            </Card>

            <Card style={styles.cardSpacing}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Learning</Text>
                
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Language</Text>
                  {user.selectedLanguage ? (
                    <View>
                      <Text style={styles.languageWithFlag} testID="learning-language">
                        {getLanguageDisplayName(user.selectedLanguage)} {getLanguageFlag(user.selectedLanguage)}
                      </Text>
                      <Text style={styles.motivationalText}>
                        Stay consistent and keep showing up! You'll be chatting like a local in no time!
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.infoValue}>Not selected</Text>
                  )}
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Level</Text>
                  <Text style={styles.infoValue} testID="current-level">
                    {user.selectedLevel 
                      ? user.selectedLevel.charAt(0).toUpperCase() + user.selectedLevel.slice(1).toLowerCase()
                      : 'Not selected'
                    }
                  </Text>
                </View>
              </View>
            </Card>

            {/* Learning Path - moved from dashboard */}
            <View style={styles.learningPathContainer}>
              <LessonProgress completedLessonIds={completedLessonIds} />
            </View>

            <TouchableOpacity 
              style={styles.subscriptionButton}
              onPress={handleNavigateToSubscription}
              testID="subscription-details"
            >
              <Text style={styles.subscriptionButtonText}>Subscription Details</Text>
              <Text style={styles.subscriptionBadge}>
                {getLearningTier(user.priceTier)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={handleNavigateToNotificationSettings}
              testID="notification-settings"
            >
              <Text style={styles.notificationButtonText}>Notification Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.signOutButton}
              onPress={handleLogout}
              testID="logout-button"
            >
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.mutedForeground,
    marginTop: 16,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 16,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: theme.colors.primaryForeground,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  gridContainer: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.foreground,
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '400',
    color: theme.colors.mutedForeground,
    marginBottom: 24,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 24,
  },
  section: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: 8,
  },
  infoItem: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '400',
    color: theme.colors.mutedForeground,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.colors.foreground,
  },
  languageWithFlag: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.colors.foreground,
    marginBottom: 8,
  },
  motivationalText: {
    fontSize: 13,
    fontWeight: '400',
    color: theme.colors.mutedForeground,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  subscriptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.card,
    marginTop: 8,
  },
  subscriptionButtonText: {
    fontSize: 15,
    color: theme.colors.foreground,
    fontWeight: '400',
  },
  subscriptionBadge: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  notificationButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.card,
    marginTop: 8,
  },
  notificationButtonText: {
    fontSize: 15,
    color: theme.colors.foreground,
    fontWeight: '400',
  },
  signOutButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    marginTop: 16,
  },
  signOutButtonText: {
    fontSize: 15,
    color: theme.colors.destructive,
    fontWeight: '400',
  },
  cardSpacing: {
    marginTop: 16,
  },
  learningPathContainer: {
    marginTop: 16,
  },
});