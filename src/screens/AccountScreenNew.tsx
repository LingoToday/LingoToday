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
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { theme } from '../lib/theme';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/apiClient';

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

interface DashboardData {
  user: User;
  stats: {
    streak: number;
    lessonsCompleted: number;
    wordsLearned: number;
    totalTimeSpent: number;
  };
}

// Helper functions - matching web exactly
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

  // Fetch user data - matching web exactly
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const response = await apiClient.getCurrentUser();
      return (response as any).data || response;
    },
    enabled: !!authUser,
  });

  // Fetch dashboard data to get progress stats - matching web exactly
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard'],
    queryFn: async () => {
      const response = await apiClient.getDashboardData();
      return (response as any).data || response;
    },
    enabled: !!authUser,
  });

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

  const handleNavigateToDashboard = () => {
    navigation.navigate('Dashboard' as never);
  };

  const handleNavigateToCourses = () => {
    navigation.navigate('Courses' as never);
  };

  // Loading state - matching web exactly
  if (userLoading || dashboardLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading account information...</Text>
        </View>
      </View>
    );
  }

  // Not logged in state - matching web exactly
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

  const stats = dashboardData?.stats;
  const memberSince = user.createdAt ? new Date(user.createdAt) : null;

  return (
    <View style={styles.container}>
      {/* Header - matching web exactly */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleNavigateToDashboard}
              testID="back-to-dashboard"
            >
              <Ionicons name="arrow-back" size={16} color={theme.colors.foreground} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Account Settings</Text>
          </View>
          
          <View style={styles.headerRight}>
            <Text style={styles.userName}>{user.firstName || 'User'}</Text>
            <TouchableOpacity 
              style={styles.logoutHeaderButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutHeaderButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridContainer}>
          {/* Personal Information - matching web exactly */}
          <Card style={styles.card} testID="personal-info-card">
            <CardHeader>
              <CardTitle style={styles.cardTitle}>
                <Ionicons name="person" size={20} color={theme.colors.foreground} style={styles.cardIcon} />
                <Text style={styles.cardTitleText}>Personal Information</Text>
              </CardTitle>
            </CardHeader>
            
            <CardContent style={styles.cardContent}>
              <View style={styles.infoSection}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Name</Text>
                  <Text style={styles.infoValue} testID="user-name">
                    {user.firstName && user.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user.firstName || user.email || 'Not provided'
                    }
                  </Text>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Email Address</Text>
                  <View style={styles.infoValueRow}>
                    <Ionicons name="mail" size={16} color="#6B7280" />
                    <Text style={styles.infoValue} testID="user-email">{user.email}</Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Member Since</Text>
                  <View style={styles.infoValueRow}>
                    <Ionicons name="calendar" size={16} color="#6B7280" />
                    <Text style={styles.infoValue} testID="member-since">
                      {memberSince 
                        ? format(memberSince, 'MMMM d, yyyy')
                        : 'Unknown'
                      }
                    </Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Learning Tier</Text>
                  <View style={styles.infoValueRow}>
                    <Ionicons name="diamond" size={16} color="#D97706" />
                    <Badge 
                      variant={getLearningTier(user.priceTier) === 'Free' ? 'secondary' : 'default'}
                      style={StyleSheet.flatten([
                        styles.tierBadge,
                        getLearningTier(user.priceTier) === 'Pro' && styles.proBadge,
                        getLearningTier(user.priceTier) === 'Plus' && styles.plusBadge,
                      ])}
                      testID="learning-tier"
                    >
                      <Text style={[
                        styles.tierBadgeText,
                        getLearningTier(user.priceTier) !== 'Free' && styles.tierBadgeTextWhite,
                      ]}>
                        {getLearningTier(user.priceTier)}
                      </Text>
                    </Badge>
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Learning Profile - matching web exactly */}
          <Card style={styles.card} testID="learning-profile-card">
            <CardHeader>
              <CardTitle style={styles.cardTitle}>
                <Ionicons name="book" size={20} color={theme.colors.foreground} style={styles.cardIcon} />
                <Text style={styles.cardTitleText}>Learning Profile</Text>
              </CardTitle>
            </CardHeader>
            
            <CardContent style={styles.cardContent}>
              <View style={styles.infoSection}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Language Course</Text>
                  <View style={styles.infoValueRow}>
                    <Ionicons name="globe" size={16} color="#2563EB" />
                    <Text style={[styles.infoValue, styles.languageValue]} testID="learning-language">
                      {user.selectedLanguage 
                        ? getLanguageDisplayName(user.selectedLanguage)
                        : 'Not selected'
                      }
                    </Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Current Level</Text>
                  <View style={styles.infoValueRow}>
                    <Ionicons name="trophy" size={16} color="#7C3AED" />
                    <Badge style={styles.levelBadge} testID="current-level">
                      <Text style={styles.levelBadgeText}>
                        {user.selectedLevel 
                          ? user.selectedLevel.charAt(0).toUpperCase() + user.selectedLevel.slice(1).toLowerCase()
                          : 'Not selected'
                        }
                      </Text>
                    </Badge>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Onboarding Status</Text>
                  <Badge 
                    variant={user.completedOnboarding ? "default" : "secondary"}
                    style={user.completedOnboarding ? styles.completedBadge : styles.incompleteBadge}
                  >
                    <Text style={[
                      styles.onboardingBadgeText,
                      user.completedOnboarding && styles.onboardingBadgeTextWhite
                    ]}>
                      {user.completedOnboarding ? 'Completed' : 'Incomplete'}
                    </Text>
                  </Badge>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Learning Progress - matching web exactly */}
          <Card style={styles.card} testID="learning-progress-card">
            <CardHeader>
              <CardTitle style={styles.cardTitle}>
                <Ionicons name="trophy" size={20} color={theme.colors.foreground} style={styles.cardIcon} />
                <Text style={styles.cardTitleText}>Learning Progress</Text>
              </CardTitle>
            </CardHeader>
            
            <CardContent style={styles.cardContent}>
              <View style={styles.statsGrid}>
                <View style={[styles.statItem, styles.blueStat]}>
                  <Text style={[styles.statValue, styles.blueStatText]} testID="lessons-completed">
                    {stats?.lessonsCompleted || 0}
                  </Text>
                  <Text style={[styles.statLabel, styles.blueStatLabel]}>Lessons Completed</Text>
                </View>
                
                <View style={[styles.statItem, styles.greenStat]}>
                  <Text style={[styles.statValue, styles.greenStatText]} testID="current-streak">
                    {stats?.streak || 0}
                  </Text>
                  <Text style={[styles.statLabel, styles.greenStatLabel]}>Day Streak</Text>
                </View>
                
                <View style={[styles.statItem, styles.purpleStat]}>
                  <Text style={[styles.statValue, styles.purpleStatText]} testID="words-learned">
                    {stats?.wordsLearned || 0}
                  </Text>
                  <Text style={[styles.statLabel, styles.purpleStatLabel]}>Words Learned</Text>
                </View>
                
                <View style={[styles.statItem, styles.amberStat]}>
                  <Text style={[styles.statValue, styles.amberStatText]} testID="total-time">
                    {stats?.totalTimeSpent 
                      ? `${Math.round(stats.totalTimeSpent / 60)}m`
                      : '0m'
                    }
                  </Text>
                  <Text style={[styles.statLabel, styles.amberStatLabel]}>Total Time</Text>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Quick Actions - matching web exactly */}
          <Card style={styles.card} testID="quick-actions-card">
            <CardHeader>
              <CardTitle style={styles.cardTitle}>
                <Text style={styles.cardTitleText}>Quick Actions</Text>
              </CardTitle>
            </CardHeader>
            
            <CardContent style={styles.cardContent}>
              <View style={styles.actionsContainer}>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleNavigateToDashboard}
                  testID="go-to-dashboard"
                >
                  <Ionicons name="book" size={16} color={theme.colors.foreground} />
                  <Text style={styles.actionButtonText}>Continue Learning</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleNavigateToCourses}
                  testID="browse-courses"
                >
                  <Ionicons name="globe" size={16} color={theme.colors.foreground} />
                  <Text style={styles.actionButtonText}>Browse Courses</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.actionButton, styles.signOutButton]}
                  onPress={handleLogout}
                  testID="logout-button"
                >
                  <Ionicons name="arrow-back" size={16} color="#DC2626" />
                  <Text style={styles.signOutButtonText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(249, 250, 251, 1)', // min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'rgba(249, 250, 251, 1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Header - matching web exactly
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
    marginTop: 20,
  },
  headerContent: {
    maxWidth: 896, // max-w-7xl
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 16, // px-4 sm:px-6 lg:px-8
    paddingVertical: 12, // py-3 sm:py-4
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.foreground,
    fontWeight: '500',
    // Hide on small screens, show on larger screens
    ...(Platform.OS === 'ios' && {
      display: 'flex', // Always show on iOS for better UX
    }),
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: -1,
  },
  headerTitle: {
    fontSize: 18, // text-lg sm:text-xl
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  userName: {
    fontSize: 12, // text-xs sm:text-sm
    color: '#6B7280',
    // Hide on small screens
    ...(Platform.OS === 'android' && {
      display: 'none',
    }),
  },
  logoutHeaderButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  logoutHeaderButtonText: {
    fontSize: 12, // text-xs sm:text-sm
    color: theme.colors.foreground,
    fontWeight: '500',
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  gridContainer: {
    maxWidth: 896, // max-w-4xl
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 16, // px-4 sm:px-6 lg:px-8
    paddingVertical: 32, // py-8
    gap: 24, // gap-6
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: 8,
  },
  cardTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  cardContent: {
    padding: 0, // Remove default padding since CardContent has its own
  },

  // Info Section
  infoSection: {
    gap: 12, // space-y-3
  },
  infoItem: {
    gap: 4,
  },
  infoLabel: {
    fontSize: 14, // text-sm
    fontWeight: '500',
    color: '#6B7280', // text-gray-600
  },
  infoValue: {
    fontSize: 18, // text-lg
    fontWeight: '500',
    color: '#111827', // text-gray-900
  },
  languageValue: {
    fontSize: 18,
    fontWeight: '500',
    color: '#2563EB', // text-blue-600
  },
  infoValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },

  // Badges - matching web exactly
  tierBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E7EB', // Default secondary
  },
  tierBadgeText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  tierBadgeTextWhite: {
    color: '#FFFFFF',
  },
  proBadge: {
    backgroundColor: '#2563EB', // bg-blue-600
  },
  plusBadge: {
    backgroundColor: '#7C3AED', // bg-purple-600
  },
  levelBadge: {
    backgroundColor: '#7C3AED', // bg-purple-600
    alignSelf: 'flex-start',
  },
  levelBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  completedBadge: {
    backgroundColor: '#059669', // bg-green-600
    alignSelf: 'flex-start',
  },
  incompleteBadge: {
    backgroundColor: '#E5E7EB', // Default secondary
    alignSelf: 'flex-start',
  },
  onboardingBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  onboardingBadgeTextWhite: {
    color: '#FFFFFF',
  },

  // Stats Grid - matching web exactly (grid-cols-2 gap-4)
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16, // gap-4
  },
  statItem: {
    flex: 1,
    minWidth: '45%', // Ensures 2 columns on mobile
    alignItems: 'center',
    padding: 16, // p-4
    borderRadius: 8,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 24, // text-2xl
    fontWeight: '700', // font-bold
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14, // text-sm
    fontWeight: '500',
    textAlign: 'center',
  },

  // Individual stat colors - matching web exactly
  blueStat: {
    backgroundColor: 'rgba(239, 246, 255, 1)', // bg-blue-50
    borderColor: 'rgba(219, 234, 254, 1)', // border-blue-100
  },
  blueStatText: {
    color: '#2563EB', // text-blue-600
  },
  blueStatLabel: {
    color: '#1E40AF', // text-blue-800
  },

  greenStat: {
    backgroundColor: 'rgba(240, 253, 244, 1)', // bg-green-50
    borderColor: 'rgba(220, 252, 231, 1)', // border-green-100
  },
  greenStatText: {
    color: '#059669', // text-green-600
  },
  greenStatLabel: {
    color: '#047857', // text-green-800
  },

  purpleStat: {
    backgroundColor: 'rgba(250, 245, 255, 1)', // bg-purple-50
    borderColor: 'rgba(243, 232, 255, 1)', // border-purple-100
  },
  purpleStatText: {
    color: '#7C3AED', // text-purple-600
  },
  purpleStatLabel: {
    color: '#6B21A8', // text-purple-800
  },

  amberStat: {
    backgroundColor: 'rgba(255, 251, 235, 1)', // bg-amber-50
    borderColor: 'rgba(254, 243, 199, 1)', // border-amber-100
  },
  amberStatText: {
    color: '#D97706', // text-amber-600
  },
  amberStatLabel: {
    color: '#92400E', // text-amber-800
  },

  // Quick Actions - matching web exactly
  actionsContainer: {
    gap: 12, // space-y-3
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: theme.colors.foreground,
    fontWeight: '500',
  },
  signOutButton: {
    borderColor: '#FEE2E2', // hover:bg-red-50 equivalent
    backgroundColor: '#FFFFFF',
  },
  signOutButtonText: {
    fontSize: 14,
    color: '#DC2626', // text-red-600
    fontWeight: '500',
  },
});