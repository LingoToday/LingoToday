import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
  TouchableOpacity,
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
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

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

  const styles = useMemo(() => createStyles(isTablet), [isTablet]);

  const INITIAL_DISPLAY_COUNT = 3;
  const displayedProgress = isExpanded 
    ? categoryProgress 
    : categoryProgress.slice(0, INITIAL_DISPLAY_COUNT);
  const showMoreButton = categoryProgress.length > INITIAL_DISPLAY_COUNT;

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
          {displayedProgress.map((category, index) => (
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
                    <Ionicons name="checkmark" size={16} color={theme.colors.primary} />
                  ) : category.isUnlocked ? (
                    <Text style={styles.progressEmoji}>{category.emoji}</Text>
                  ) : (
                    <Ionicons name="lock-closed" size={12} color={theme.colors.textSecondary} />
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
                        ? theme.colors.checkmarkGreen
                        : theme.colors.primary
                    }
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {showMoreButton && (
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={() => setIsExpanded(!isExpanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.moreButtonText}>
              {isExpanded ? 'Show Less' : 'More'}
            </Text>
          </TouchableOpacity>
        )}

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

const createStyles = (isTablet: boolean) => StyleSheet.create({
  // Card
  card: {
    backgroundColor: theme.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    shadowColor: theme.colors.shadow,
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
    color: theme.colors.textSecondary,
  },

  // Content
  cardContent: {
    padding: isTablet ? theme.spacing.xl : theme.spacing.lg,
  },
  cardTitle: {
    fontSize: isTablet ? 20 : theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: theme.spacing.lg,
  },

  // Progress List
  progressList: {
    gap: isTablet ? theme.spacing.md : theme.spacing.sm,
  },
  progressItem: {
    marginBottom: isTablet ? theme.spacing.md : theme.spacing.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: isTablet ? theme.spacing.md : theme.spacing.sm,
  },

  // Progress Icon
  progressIcon: {
    width: isTablet ? 40 : 32,
    height: isTablet ? 40 : 32,
    borderRadius: isTablet ? 20 : 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressIconCompleted: {
    backgroundColor: theme.colors.toggleActive,
  },
  progressIconUnlocked: {
    backgroundColor: theme.colors.surfaceVariant,
  },
  progressIconLocked: {
    backgroundColor: theme.colors.surfaceDark,
  },
  progressEmoji: {
    fontSize: isTablet ? 18 : theme.fontSize.sm,
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
    fontSize: isTablet ? 15 : theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.onSurface,
    flex: 1,
    flexWrap: 'wrap',
  },
  progressNameLocked: {
    color: theme.colors.textSecondary,
  },
  progressCount: {
    fontSize: isTablet ? 15 : theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.sm,
    minWidth: isTablet ? 45 : 40,
    textAlign: 'right',
  },
  progressCountCompleted: {
    color: theme.colors.primary,
  },
  progressCountActive: {
    color: theme.colors.primary,
  },

  // Progress Bar
  progressBar: {
    height: isTablet ? 10 : 8,
  },

  // More Button
  moreButton: {
    alignSelf: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  moreButtonText: {
    fontSize: isTablet ? 14 : theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.primary,
  },

  // Course Summary
  courseSummary: {
    marginTop: theme.spacing.lg,
    padding: isTablet ? theme.spacing.lg : theme.spacing.md,
    backgroundColor: theme.colors.surfaceDark,
    borderRadius: theme.borderRadius.lg,
  },
  courseSummaryContent: {
    gap: theme.spacing.xs,
  },
  courseSummaryTitle: {
    fontSize: isTablet ? 15 : theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  courseSummarySubtitle: {
    fontSize: isTablet ? 14 : theme.fontSize.sm,
    color: theme.colors.primary,
  },
});