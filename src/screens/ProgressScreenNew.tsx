import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../hooks/useAuth';
import { apiClient, DashboardData} from '../lib/apiClient';
import { theme } from '../lib/theme';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Progress } from '../components/ui/Progress';
import LessonProgress from '../components/LessonProgress';
import ProgressOverview from '../components/ProgressOverview';

interface CategoryProgress {
  name: string;
  emoji: string;
  level: string;
  totalLessons: number;
  completedLessons: number;
  isUnlocked: boolean;
  order: number;
}

export default function ProgressScreenNew() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleGoBack = () => {
    navigation.navigate('Dashboard' as never);
  };

  // Fetch dashboard data - matching web exactly
  const { data: dashboardData, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    queryFn: async () => {
      try {
        return await apiClient.getDashboardData();
      } catch (error) {
        console.error('Dashboard query error:', error);
        // Return fallback data to prevent UI breaking
        const fallbackData: DashboardData = {
          user: {
            id: user?.id || '',
            email: user?.email || '',
            firstName: user?.firstName || 'User',
          } as DashboardData['user'],
          settings: {
            notificationsEnabled: false,
            notificationFrequency: 15,
            notificationStartTime: '08:00',
            notificationEndTime: '22:00',
            selectedLanguage: user?.selectedLanguage || 'italian',
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
    enabled: !!user,
    retry: 1, // Only retry once
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Get completed lesson IDs from dashboard data - matching web exactly
  const completedLessonIds = React.useMemo(() => {
    if (!dashboardData?.progress) return [];
    
    return dashboardData.progress
      .filter((p: any) => p.completed === true)
      .map((p: any) => p.lessonId);
  }, [dashboardData?.progress]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Progress</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading your progress...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Progress</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.errorContainer}>
          <Card style={styles.errorCard}>
            <CardContent style={styles.errorContent}>
              <Ionicons name="warning" size={48} color="#ef4444" />
              <Text style={styles.errorTitle}>Error</Text>
              <Text style={styles.errorText}>Failed to load progress data</Text>
              <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </CardContent>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - matching web layout */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="book" size={16} color="#ffffff" />
            </View>
            <Text style={styles.logoText}>LingoToday</Text>
          </View>
        </View>
        
        <TouchableOpacity
          onPress={() => navigation.navigate('Account' as never)}
          style={styles.accountButton}
        >
          <Ionicons name="person" size={16} color={theme.colors.foreground} />
          <Text style={styles.accountButtonText}>{user?.firstName || 'Account'}</Text>
          <Ionicons name="chevron-down" size={12} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Main Content Grid - matching web exactly */}
        <View style={styles.mainGrid}>
          {/* Left Column - Progress Overview */}
          <View style={styles.leftColumn}>
            <ProgressOverview />
          </View>

          {/* Right Column - Learning Path */}
          <View style={styles.rightColumn}>
            <LessonProgress completedLessonIds={completedLessonIds} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },

  // Header - matching web exactly
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#3b82f6',
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  logoText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.foreground,
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  accountButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  headerRight: {
    width: 40,
  },

  // Loading/Error
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
  errorContainer: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  errorCard: {
    borderColor: '#fee2e2',
  },
  errorContent: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  errorTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '600',
    color: '#dc2626',
  },
  errorText: {
    fontSize: theme.fontSize.base,
    color: '#dc2626',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },

  // Content - matching web grid layout
  content: {
    flex: 1,
  },
  mainGrid: {
    flexDirection: 'column',
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  leftColumn: {
    flex: 1,
  },
  rightColumn: {
    flex: 1,
  },
});