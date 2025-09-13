import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/apiClient';
import { DashboardData, NextLessonData, CourseStats } from '../types';

interface DashboardScreenProps {
  navigation: any;
}

const { width: screenWidth } = Dimensions.get('window');

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard data
  const { data: dashboardData, isLoading, error, refetch } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard'],
    queryFn: () => apiClient.getDashboardData(),
    enabled: !!user,
  });

  // Fetch course statistics for the user's selected language
  const { data: courseStats } = useQuery<CourseStats>({
    queryKey: ['/api/course-stats', user?.selectedLanguage],
    queryFn: () => apiClient.getCourseStats(user?.selectedLanguage || 'italian', user?.selectedLevel),
    enabled: !!user?.selectedLanguage,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
      await queryClient.invalidateQueries({ queryKey: ['/api/course-stats'] });
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleContinueLearning = () => {
    // Navigate to the next lesson or courses screen
    navigation.navigate('Courses');
  };

  const handleViewProgress = () => {
    navigation.navigate('Progress');
  };

  const handleCheckpoint = async () => {
    try {
      const checkpoints = await apiClient.getAvailableCheckpoints();
      if (checkpoints.length > 0) {
        navigation.navigate('Checkpoint', { checkpointId: checkpoints[0].id });
      } else {
        Alert.alert('No Checkpoints', 'Complete more lessons to unlock checkpoint reviews!');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not load checkpoint information');
    }
  };

  if (isLoading && !dashboardData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>Could not load your dashboard data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = dashboardData?.stats || { streak: 0, totalLessons: 0, wordsLearned: 0, lessonsCompleted: 0 };
  const progress = dashboardData?.progress || [];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.greeting}>
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}!
        </Text>
        <Text style={styles.subGreeting}>Ready to continue your learning journey?</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.streakCard]}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statNumber}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={[styles.statCard, styles.lessonsCard]}>
            <Text style={styles.statEmoji}>📚</Text>
            <Text style={styles.statNumber}>{stats.lessonsCompleted}</Text>
            <Text style={styles.statLabel}>Lessons Done</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.wordsCard]}>
            <Text style={styles.statEmoji}>💬</Text>
            <Text style={styles.statNumber}>{stats.wordsLearned}</Text>
            <Text style={styles.statLabel}>Words Learned</Text>
          </View>
          <View style={[styles.statCard, styles.totalCard]}>
            <Text style={styles.statEmoji}>🎯</Text>
            <Text style={styles.statNumber}>{courseStats?.totalLessons || 0}</Text>
            <Text style={styles.statLabel}>Total Available</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.primaryAction} onPress={handleContinueLearning}>
          <Text style={styles.primaryActionIcon}>▶️</Text>
          <View style={styles.actionContent}>
            <Text style={styles.primaryActionTitle}>Continue Learning</Text>
            <Text style={styles.primaryActionSubtitle}>
              {user?.selectedLanguage ? `Learning ${user.selectedLanguage}` : 'Start your next lesson'}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.secondaryActions}>
          <TouchableOpacity style={styles.secondaryAction} onPress={handleViewProgress}>
            <Text style={styles.secondaryActionIcon}>📊</Text>
            <Text style={styles.secondaryActionText}>View Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction} onPress={handleCheckpoint}>
            <Text style={styles.secondaryActionIcon}>⭐</Text>
            <Text style={styles.secondaryActionText}>Checkpoints</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      {progress.length > 0 && (
        <View style={styles.recentActivity}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {progress.slice(0, 3).map((item, index) => (
              <View key={`${item.courseId}-${item.lessonId}-${index}`} style={styles.activityItem}>
                <View style={styles.activityIcon}>
                  <Text style={styles.activityEmoji}>
                    {item.completed ? '✅' : '⏳'}
                  </Text>
                </View>
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>
                    {item.lessonTitle || `Lesson ${item.lessonId}`}
                  </Text>
                  <Text style={styles.activitySubtitle}>
                    Course {item.courseId} • {item.completed ? 'Completed' : 'In Progress'}
                    {item.score && ` • ${item.score}% score`}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Learning Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.sectionTitle}>💡 Learning Tip</Text>
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            Consistency is key! Try to maintain your streak by practicing a little each day. 
            Even 5-10 minutes can make a big difference in your language learning progress.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingBottom: 100, // Extra space for tab bar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: '#64748b',
  },
  statsContainer: {
    padding: 16,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  lessonsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  wordsCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  totalCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  quickActions: {
    padding: 16,
    gap: 12,
  },
  primaryAction: {
    backgroundColor: '#3b82f6',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryActionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  primaryActionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  primaryActionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryActionIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  recentActivity: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  activityList: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  tipsSection: {
    padding: 16,
    paddingTop: 0,
  },
  tipCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});