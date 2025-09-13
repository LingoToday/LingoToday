import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/apiClient';

interface CoursesScreenProps {
  navigation: any;
}

interface Course {
  id: string;
  title: string;
  description: string;
  courseNumber: number;
  totalLessons: number;
  completedLessons: number;
  isUnlocked: boolean;
  language: string;
  skillLevel: string;
}

export default function CoursesScreen({ navigation }: CoursesScreenProps) {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch courses for the user's selected language and level
  const { data: courses, isLoading, error, refetch } = useQuery<Course[]>({
    queryKey: ['/api/courses', user?.selectedLanguage, user?.selectedLevel],
    queryFn: () => apiClient.getCourses(user?.selectedLanguage || 'italian', user?.selectedLevel),
    enabled: !!user?.selectedLanguage,
  });

  // Fetch user progress for progress calculation
  const { data: userProgress } = useQuery({
    queryKey: ['/api/progress', user?.selectedLanguage],
    queryFn: () => apiClient.getUserProgress(user?.selectedLanguage || 'italian'),
    enabled: !!user?.selectedLanguage,
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

  const handleCoursePress = (course: Course) => {
    if (!course.isUnlocked) {
      Alert.alert(
        'Course Locked',
        'Complete the previous course to unlock this one!',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // Navigate to first incomplete lesson in the course
    // For now, we'll go to lesson 1
    navigation.navigate('Lesson', {
      courseId: course.id,
      lessonId: 'lesson1',
      stepNumber: 1,
    });
  };

  const getProgressPercentage = (course: Course) => {
    if (course.totalLessons === 0) return 0;
    return Math.round((course.completedLessons / course.totalLessons) * 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return '#e2e8f0';
    if (percentage < 50) return '#f59e0b';
    if (percentage < 100) return '#3b82f6';
    return '#10b981';
  };

  const getCourseIcon = (courseNumber: number) => {
    const icons = ['🎯', '📚', '🗣️', '💬', '✍️', '🎧', '🌟', '🚀', '🎨', '🏆', '💡', '🔥', '⭐'];
    return icons[courseNumber - 1] || '📖';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading your courses...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Could not load courses</Text>
        <Text style={styles.errorText}>Please check your connection and try again</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {user?.selectedLanguage ? 
            `${user.selectedLanguage.charAt(0).toUpperCase() + user.selectedLanguage.slice(1)} Courses` : 
            'Your Courses'
          }
        </Text>
        <Text style={styles.subtitle}>
          {user?.selectedLevel ? 
            `${user.selectedLevel.charAt(0).toUpperCase() + user.selectedLevel.slice(1)} Level` : 
            'Select a course to continue learning'
          }
        </Text>
      </View>

      {/* Courses List */}
      {courses && courses.length > 0 ? (
        <View style={styles.coursesContainer}>
          {courses.map((course, index) => {
            const progressPercentage = getProgressPercentage(course);
            const progressColor = getProgressColor(progressPercentage);
            const isCompleted = progressPercentage === 100;
            
            return (
              <TouchableOpacity
                key={course.id}
                style={[
                  styles.courseCard,
                  !course.isUnlocked && styles.lockedCourseCard,
                  isCompleted && styles.completedCourseCard,
                ]}
                onPress={() => handleCoursePress(course)}
                disabled={!course.isUnlocked}
              >
                <View style={styles.courseHeader}>
                  <View style={styles.courseIconContainer}>
                    <Text style={styles.courseIcon}>
                      {getCourseIcon(course.courseNumber)}
                    </Text>
                    {!course.isUnlocked && (
                      <View style={styles.lockOverlay}>
                        <Text style={styles.lockIcon}>🔒</Text>
                      </View>
                    )}
                    {isCompleted && (
                      <View style={styles.completedOverlay}>
                        <Text style={styles.completedIcon}>✅</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.courseInfo}>
                    <Text style={[
                      styles.courseTitle,
                      !course.isUnlocked && styles.lockedText
                    ]}>
                      {course.title}
                    </Text>
                    <Text style={[
                      styles.courseDescription,
                      !course.isUnlocked && styles.lockedText
                    ]}>
                      {course.description}
                    </Text>
                    <Text style={styles.courseMeta}>
                      {course.totalLessons} lessons • Course {course.courseNumber}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBackground}>
                    <View
                      style={[
                        styles.progressBar,
                        { 
                          width: `${progressPercentage}%`,
                          backgroundColor: progressColor,
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {course.completedLessons}/{course.totalLessons} lessons
                    {progressPercentage > 0 && ` (${progressPercentage}%)`}
                  </Text>
                </View>

                {/* Action Indicator */}
                <View style={styles.actionIndicator}>
                  {!course.isUnlocked ? (
                    <Text style={styles.actionText}>🔒 Locked</Text>
                  ) : isCompleted ? (
                    <Text style={styles.actionText}>✨ Completed</Text>
                  ) : course.completedLessons > 0 ? (
                    <Text style={styles.actionText}>▶️ Continue</Text>
                  ) : (
                    <Text style={styles.actionText}>🚀 Start</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📚</Text>
          <Text style={styles.emptyStateTitle}>No courses available</Text>
          <Text style={styles.emptyStateText}>
            Courses for your selected language and level will appear here
          </Text>
        </View>
      )}

      {/* Learning Tips */}
      <View style={styles.tipsSection}>
        <Text style={styles.tipsTitle}>💡 Learning Tips</Text>
        <View style={styles.tipCard}>
          <Text style={styles.tipText}>
            • Complete courses in order to unlock new content{'\n'}
            • Take your time with each lesson - understanding is more important than speed{'\n'}
            • Review previous lessons if you're struggling with new concepts{'\n'}
            • Practice daily for the best results
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
  coursesContainer: {
    padding: 16,
    gap: 16,
  },
  courseCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  lockedCourseCard: {
    opacity: 0.6,
    backgroundColor: '#f8fafc',
  },
  completedCourseCard: {
    borderWidth: 2,
    borderColor: '#10b981',
  },
  courseHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  courseIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  courseIcon: {
    fontSize: 48,
  },
  lockOverlay: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
  lockIcon: {
    fontSize: 16,
  },
  completedOverlay: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 2,
  },
  completedIcon: {
    fontSize: 16,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  courseDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 8,
  },
  courseMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  lockedText: {
    color: '#94a3b8',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBackground: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
  },
  actionIndicator: {
    alignItems: 'flex-end',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
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
  },
  tipsSection: {
    padding: 16,
    paddingTop: 0,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
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