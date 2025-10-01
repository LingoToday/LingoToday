import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../lib/theme';
import { Card, CardContent } from './ui/Card';
import { Progress } from './ui/Progress';
import { apiClient } from '../lib/apiClient';

interface LessonProgressProps {
  completedLessonIds: string[];
}

interface CategoryProgress {
  name: string;
  emoji: string;
  level: string;
  totalLessons: number;
  completedLessons: number;
  isUnlocked: boolean;
  order: number;
}

export default function LessonProgress({ completedLessonIds }: LessonProgressProps) {
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get user progress data and calculate actual progress based on database records - matching web exactly
    const getProgressFromAPI = async () => {
      try {
        setIsLoading(true);
        
        // Fetch dynamic course mapping with correct lesson counts - matching web API calls
        const courseMappingResponse = await apiClient.getCourseMapping('it');
        const courseMapping = courseMappingResponse;
        
        // Fetch user progress data - matching web API calls
        const progressResponse = await apiClient.getUserProgress('italian');
        const progressData = progressResponse;
        
        // Calculate progress for each course based on actual database progress - matching web logic exactly
        const progress: CategoryProgress[] = [];
        let hasUncompletedCategory = false;

        (courseMapping as any[]).forEach((course: any) => {
          // Count completed lessons in this course from the database progress
          const completedInCategory = (progressData as any[]).filter((p: any) => 
            p.courseId === course.courseId && p.completed === true
          ).length;
          
          const isUnlocked = !hasUncompletedCategory || completedInCategory > 0;
          
          progress.push({
            name: course.name,
            emoji: course.emoji,
            level: course.level,
            totalLessons: course.totalLessons,
            completedLessons: completedInCategory,
            isUnlocked,
            order: course.order
          });

          // If this category is not completed, next categories are locked
          if (completedInCategory < course.totalLessons) {
            hasUncompletedCategory = true;
          }
        });

        setCategoryProgress(progress);
      } catch (error) {
        console.error('Error fetching progress:', error);
        
        // Fallback hardcoded mapping - matching web exactly
        const fallbackCourseMapping = [
          { courseId: "course1", name: "Greetings", emoji: "👋", level: "A1", totalLessons: 20, order: 1 },
          { courseId: "course2", name: "Introducing Yourself", emoji: "🙋", level: "A1", totalLessons: 20, order: 2 },
          { courseId: "course3", name: "Essential Courtesy Phrases", emoji: "🙏", level: "A1", totalLessons: 21, order: 3 },
          { courseId: "course4", name: "Numbers", emoji: "🔢", level: "A1", totalLessons: 41, order: 4 },
          { courseId: "course5", name: "Time and Date", emoji: "⏰", level: "A1", totalLessons: 49, order: 5 },
          { courseId: "course6", name: "Family and People", emoji: "👨‍👩‍👧‍👦", level: "A1", totalLessons: 44, order: 6 },
          { courseId: "course7", name: "Colors & Adjectives", emoji: "🎨", level: "A1", totalLessons: 29, order: 7 },
          { courseId: "course8", name: "Weather and Seasons", emoji: "🌤️", level: "A1", totalLessons: 24, order: 8 },
          { courseId: "course9", name: "Food and Drinks", emoji: "🍝", level: "A1", totalLessons: 29, order: 9 },
          { courseId: "course10", name: "Directions and Places", emoji: "📍", level: "A1", totalLessons: 28, order: 10 },
          { courseId: "course11", name: "Shopping", emoji: "🛒", level: "A1", totalLessons: 13, order: 11 },
          { courseId: "course12", name: "Likes and Dislikes", emoji: "❤️", level: "A1", totalLessons: 14, order: 12 },
          { courseId: "course13", name: "Basic Grammar", emoji: "📚", level: "A1", totalLessons: 29, order: 13 }
        ];

        // Calculate progress for each course (fallback method) - matching web exactly
        const progress: CategoryProgress[] = [];
        let hasUncompletedCategory = false;

        fallbackCourseMapping.forEach(course => {
          const completedInCategory = completedLessonIds.filter(id => 
            id.includes(course.courseId.toLowerCase())
          ).length;
          
          const isUnlocked = !hasUncompletedCategory || completedInCategory > 0;
          
          progress.push({
            name: course.name,
            emoji: course.emoji,
            level: course.level,
            totalLessons: course.totalLessons,
            completedLessons: completedInCategory,
            isUnlocked,
            order: course.order
          });

          // If this category is not completed, next categories are locked
          if (completedInCategory < course.totalLessons) {
            hasUncompletedCategory = true;
          }
        });

        setCategoryProgress(progress);
      } finally {
        setIsLoading(false);
      }
    };

    getProgressFromAPI();
  }, [completedLessonIds]);

  if (isLoading) {
    return (
      <Card style={styles.card}>
        <CardContent style={styles.loadingContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading learning path...</Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <CardContent style={styles.cardContent}>
        <Text style={styles.cardTitle}>Learning Path</Text>
        
        <View style={styles.progressList}>
          {categoryProgress.map((category, index) => (
            <View key={category.name} style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <View style={[
                  styles.progressIcon,
                  category.completedLessons === category.totalLessons 
                    ? styles.progressIconCompleted
                    : category.isUnlocked 
                      ? styles.progressIconUnlocked
                      : styles.progressIconLocked
                ]}>
                  {category.completedLessons === category.totalLessons ? (
                    <Ionicons name="checkmark" size={16} color="#10b981" />
                  ) : category.isUnlocked ? (
                    <Text style={styles.progressEmoji}>{category.emoji}</Text>
                  ) : (
                    <Ionicons name="lock-closed" size={12} color="#9ca3af" />
                  )}
                </View>
                
                <View style={styles.progressDetails}>
                  <View style={styles.progressTitleRow}>
                    <Text style={[
                      styles.progressName,
                      !category.isUnlocked && styles.progressNameLocked
                    ]}>
                      {category.name}
                    </Text>
                    <Text style={[
                      styles.progressCount,
                      category.completedLessons === category.totalLessons && styles.progressCountCompleted,
                      category.completedLessons > 0 && category.completedLessons < category.totalLessons && styles.progressCountActive
                    ]}>
                      {category.completedLessons}/{category.totalLessons}
                    </Text>
                  </View>
                  
                  <Progress
                    value={category.totalLessons > 0 ? (category.completedLessons / category.totalLessons) * 100 : 0}
                    style={styles.progressBar}
                    progressColor={
                      category.completedLessons === category.totalLessons 
                        ? '#10b981' // green-500
                        : '#3b82f6'  // primary
                    }
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Course Summary - matching web exactly */}
        <View style={styles.courseSummary}>
          <View style={styles.courseSummaryContent}>
            <Text style={styles.courseSummaryTitle}>Complete Italian Course</Text>
            <Text style={styles.courseSummarySubtitle}>
              {categoryProgress.reduce((sum, cat) => sum + cat.totalLessons, 0)} lessons • {categoryProgress.length} courses
            </Text>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  // Card
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb', // border-gray-200
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Loading
  loadingContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },

  // Content
  cardContent: {
    padding: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: '#111827', // text-gray-900
    marginBottom: theme.spacing.lg,
  },

  // Progress List
  progressList: {
    gap: theme.spacing.sm,
  },
  progressItem: {
    marginBottom: theme.spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },

  // Progress Icon
  progressIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressIconCompleted: {
    backgroundColor: '#dcfce7', // green-100
  },
  progressIconUnlocked: {
    backgroundColor: '#dbeafe', // primary-100
  },
  progressIconLocked: {
    backgroundColor: '#f3f4f6', // gray-100
  },
  progressEmoji: {
    fontSize: theme.fontSize.sm,
  },

  // Progress Details
  progressDetails: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  progressTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  progressName: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: '#111827', // text-gray-900
    flex: 1,
  },
  progressNameLocked: {
    color: '#9ca3af', // text-gray-400
  },
  progressCount: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: '#6b7280', // text-gray-500
    marginLeft: theme.spacing.sm,
  },
  progressCountCompleted: {
    color: '#10b981', // text-green-600
  },
  progressCountActive: {
    color: '#3b82f6', // text-primary-600
  },

  // Progress Bar
  progressBar: {
    height: 8,
  },

  // Course Summary
  courseSummary: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: '#dbeafe', // bg-blue-50
    borderRadius: theme.borderRadius.lg,
  },
  courseSummaryContent: {
    gap: theme.spacing.xs,
  },
  courseSummaryTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: '#1e40af', // text-blue-800
  },
  courseSummarySubtitle: {
    fontSize: theme.fontSize.sm,
    color: '#2563eb', // text-blue-600
  },
});