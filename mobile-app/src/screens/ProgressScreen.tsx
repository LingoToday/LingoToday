import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/apiClient';

interface ProgressScreenProps {
  navigation: any;
}

const { width: screenWidth } = Dimensions.get('window');

export default function ProgressScreen({ navigation }: ProgressScreenProps) {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user progress data
  const { data: progressData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/progress', user?.selectedLanguage],
    queryFn: () => apiClient.getUserProgress(user?.selectedLanguage || 'italian'),
    enabled: !!user?.selectedLanguage,
  });

  // Fetch dashboard data for stats
  const { data: dashboardData } = useQuery({
    queryKey: ['/api/dashboard'],
    queryFn: () => apiClient.getDashboardData(),
    enabled: !!user,
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

  const getProgressPercentage = (completed: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading your progress...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Could not load progress</Text>
        <Text style={styles.errorText}>Please check your connection and try again</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stats = dashboardData?.stats || { streak: 0, totalLessons: 0, wordsLearned: 0, lessonsCompleted: 0 };
  const progress = progressData || [];

  // Group progress by course
  const progressByCourse = progress.reduce((acc: any, item: any) => {
    if (!acc[item.courseId]) {
      acc[item.courseId] = [];
    }
    acc[item.courseId].push(item);
    return acc;
  }, {});

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return '#10b981'; // Green
    if (streak >= 7) return '#3b82f6';  // Blue
    if (streak >= 3) return '#f59e0b';  // Orange
    return '#94a3b8'; // Gray
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Progress</Text>
        <Text style={styles.subtitle}>
          Learning {user?.selectedLanguage ? 
            `${user.selectedLanguage.charAt(0).toUpperCase() + user.selectedLanguage.slice(1)}` : 
            'Language'
          }
        </Text>
      </View>

      {/* Overall Stats */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>📊 Overall Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: getStreakColor(stats.streak) }]}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statNumber}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#3b82f6' }]}>
            <Text style={styles.statEmoji}>📚</Text>
            <Text style={styles.statNumber}>{stats.lessonsCompleted}</Text>
            <Text style={styles.statLabel}>Lessons</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
            <Text style={styles.statEmoji}>💬</Text>
            <Text style={styles.statNumber}>{stats.wordsLearned}</Text>
            <Text style={styles.statLabel}>Words</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#8b5cf6' }]}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statNumber}>
              {getProgressPercentage(stats.lessonsCompleted, stats.totalLessons)}%
            </Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
        </View>
      </View>

      {/* Streak Visualization */}
      <View style={styles.streakSection}>
        <Text style={styles.sectionTitle}>🔥 Streak Progress</Text>
        <View style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Text style={styles.streakNumber}>{stats.streak}</Text>
            <Text style={styles.streakLabel}>day streak</Text>
          </View>
          <View style={styles.streakBadges}>
            <View style={[styles.streakBadge, stats.streak >= 3 && styles.activeBadge]}>
              <Text style={styles.badgeEmoji}>🌱</Text>
              <Text style={styles.badgeText}>3 Days</Text>
            </View>
            <View style={[styles.streakBadge, stats.streak >= 7 && styles.activeBadge]}>
              <Text style={styles.badgeEmoji}>🌿</Text>
              <Text style={styles.badgeText}>1 Week</Text>
            </View>
            <View style={[styles.streakBadge, stats.streak >= 30 && styles.activeBadge]}>
              <Text style={styles.badgeEmoji}>🌳</Text>
              <Text style={styles.badgeText}>1 Month</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Course Progress */}
      {Object.keys(progressByCourse).length > 0 && (
        <View style={styles.coursesSection}>
          <Text style={styles.sectionTitle}>📖 Course Progress</Text>
          {Object.entries(progressByCourse).map(([courseId, courseProgress]: [string, any]) => {
            const completedLessons = courseProgress.filter((p: any) => p.completed).length;
            const totalLessons = courseProgress.length;
            const progressPercent = getProgressPercentage(completedLessons, totalLessons);
            
            return (
              <View key={courseId} style={styles.courseCard}>
                <View style={styles.courseHeader}>
                  <Text style={styles.courseName}>Course {courseId.replace('course', '')}</Text>
                  <Text style={styles.coursePercent}>{progressPercent}%</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarBackground}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${progressPercent}%` }
                      ]}
                    />
                  </View>
                </View>
                <Text style={styles.courseStats}>
                  {completedLessons}/{totalLessons} lessons completed
                </Text>
                
                {/* Recent lessons from this course */}
                <View style={styles.recentLessons}>
                  {courseProgress.slice(-3).map((lesson: any, index: number) => (
                    <View key={`${lesson.lessonId}-${index}`} style={styles.lessonItem}>
                      <Text style={styles.lessonEmoji}>
                        {lesson.completed ? '✅' : '⏳'}
                      </Text>
                      <Text style={styles.lessonText}>
                        {lesson.lessonTitle || `Lesson ${lesson.lessonId}`}
                        {lesson.score && ` • ${lesson.score}%`}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Achievements Section */}
      <View style={styles.achievementsSection}>
        <Text style={styles.sectionTitle}>🏆 Recent Achievements</Text>
        <View style={styles.achievementsList}>
          {stats.streak >= 7 && (
            <View style={styles.achievementCard}>
              <Text style={styles.achievementEmoji}>🔥</Text>
              <Text style={styles.achievementText}>7-day learning streak!</Text>
            </View>
          )}
          {stats.lessonsCompleted >= 10 && (
            <View style={styles.achievementCard}>
              <Text style={styles.achievementEmoji}>📚</Text>
              <Text style={styles.achievementText}>Completed 10+ lessons</Text>
            </View>
          )}
          {stats.wordsLearned >= 50 && (
            <View style={styles.achievementCard}>
              <Text style={styles.achievementEmoji}>💬</Text>
              <Text style={styles.achievementText}>Learned 50+ words</Text>
            </View>
          )}
          {[7, 30, 90, 365].map(days => 
            stats.streak >= days && (
              <View key={days} style={styles.achievementCard}>
                <Text style={styles.achievementEmoji}>⭐</Text>
                <Text style={styles.achievementText}>{days}-day streak champion!</Text>
              </View>
            )
          )}
        </View>
      </View>

      {/* Empty State */}
      {progress.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📈</Text>
          <Text style={styles.emptyStateTitle}>Start Learning to See Progress</Text>
          <Text style={styles.emptyStateText}>
            Complete your first lesson to begin tracking your progress
          </Text>
          <TouchableOpacity
            style={styles.startLearningButton}
            onPress={() => navigation.navigate('Courses')}
          >
            <Text style={styles.startLearningButtonText}>Start Learning</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingBottom: 100,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  statsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  streakSection: {
    padding: 16,
    paddingTop: 0,
  },
  streakCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  streakHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  streakLabel: {
    fontSize: 16,
    color: '#64748b',
  },
  streakBadges: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  streakBadge: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    opacity: 0.5,
  },
  activeBadge: {
    backgroundColor: '#f0f7ff',
    opacity: 1,
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  badgeEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  badgeText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  coursesSection: {
    padding: 16,
    paddingTop: 0,
  },
  courseCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  courseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  coursePercent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
  },
  progressBarFill: {
    height: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 4,
  },
  courseStats: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  recentLessons: {
    gap: 8,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonEmoji: {
    fontSize: 16,
    marginRight: 8,
    width: 20,
  },
  lessonText: {
    fontSize: 14,
    color: '#374151',
  },
  achievementsSection: {
    padding: 16,
    paddingTop: 0,
  },
  achievementsList: {
    gap: 8,
  },
  achievementCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  achievementEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  achievementText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  startLearningButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  startLearningButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});