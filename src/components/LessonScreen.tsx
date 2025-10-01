import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';

import { theme } from '../lib/theme';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Progress } from './ui/Progress';
import LessonModal from './LessonModal';

interface LessonScreenProps {
  language: string;
  courseId: string;
}

interface Lesson {
  id: string;
  title: string;
  targetPhrase: string;
  englishPhrase: string;
  pronunciation?: string;
  options?: string[];
  correctAnswer?: string;
  completed: boolean;
  locked: boolean;
  order: number;
}

interface Course {
  id: string;
  name: string;
  emoji: string;
  level: string;
  description: string;
  totalLessons: number;
  completedLessons: number;
  lessons: Lesson[];
}

export default function LessonScreen({ language, courseId }: LessonScreenProps) {
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonModalVisible, setLessonModalVisible] = useState(false);

  const { data: courseData, isLoading } = useQuery<Course>({
    queryKey: ['/api/courses', language, courseId],
    initialData: {
      id: courseId,
      name: 'Greetings',
      emoji: '👋',
      level: 'Beginner',
      description: 'Learn basic Italian greetings and polite expressions',
      totalLessons: 8,
      completedLessons: 3,
      lessons: [
        {
          id: 'lesson1',
          title: 'Basic Hello',
          targetPhrase: 'Ciao',
          englishPhrase: 'Hello (informal)',
          pronunciation: 'chah-oh',
          options: ['Hello (informal)', 'Goodbye', 'Thank you', 'Please'],
          correctAnswer: 'Hello (informal)',
          completed: true,
          locked: false,
          order: 1,
        },
        {
          id: 'lesson2',
          title: 'Formal Hello',
          targetPhrase: 'Buongiorno',
          englishPhrase: 'Good morning/Good day',
          pronunciation: 'bwohn-jor-noh',
          options: ['Good evening', 'Good morning/Good day', 'Good night', 'Hello'],
          correctAnswer: 'Good morning/Good day',
          completed: true,
          locked: false,
          order: 2,
        },
        {
          id: 'lesson3',
          title: 'Good Evening',
          targetPhrase: 'Buonasera',
          englishPhrase: 'Good evening',
          pronunciation: 'bwoh-nah-seh-rah',
          options: ['Good morning', 'Good afternoon', 'Good evening', 'Good night'],
          correctAnswer: 'Good evening',
          completed: true,
          locked: false,
          order: 3,
        },
        {
          id: 'lesson4',
          title: 'How are you?',
          targetPhrase: 'Come stai?',
          englishPhrase: 'How are you? (informal)',
          pronunciation: 'koh-meh stah-ee',
          options: ['How are you? (informal)', 'How are you? (formal)', 'What\'s your name?', 'Where are you from?'],
          correctAnswer: 'How are you? (informal)',
          completed: false,
          locked: false,
          order: 4,
        },
        {
          id: 'lesson5',
          title: 'Formal How are you?',
          targetPhrase: 'Come sta?',
          englishPhrase: 'How are you? (formal)',
          pronunciation: 'koh-meh stah',
          options: ['How are you? (informal)', 'How are you? (formal)', 'What\'s your name?', 'Nice to meet you'],
          correctAnswer: 'How are you? (formal)',
          completed: false,
          locked: true,
          order: 5,
        },
        {
          id: 'lesson6',
          title: 'I\'m fine',
          targetPhrase: 'Sto bene',
          englishPhrase: 'I\'m fine/well',
          pronunciation: 'stoh beh-neh',
          options: ['I\'m tired', 'I\'m fine/well', 'I\'m busy', 'I\'m happy'],
          correctAnswer: 'I\'m fine/well',
          completed: false,
          locked: true,
          order: 6,
        },
        {
          id: 'lesson7',
          title: 'Thank you',
          targetPhrase: 'Grazie',
          englishPhrase: 'Thank you',
          pronunciation: 'grah-tsee-eh',
          options: ['Please', 'Thank you', 'Excuse me', 'You\'re welcome'],
          correctAnswer: 'Thank you',
          completed: false,
          locked: true,
          order: 7,
        },
        {
          id: 'lesson8',
          title: 'You\'re welcome',
          targetPhrase: 'Prego',
          englishPhrase: 'You\'re welcome/Please',
          pronunciation: 'preh-goh',
          options: ['Thank you', 'You\'re welcome/Please', 'Excuse me', 'Sorry'],
          correctAnswer: 'You\'re welcome/Please',
          completed: false,
          locked: true,
          order: 8,
        },
      ],
    },
  });

  const handleLessonPress = (lesson: Lesson) => {
    if (lesson.locked) return;
    
    setSelectedLesson(lesson);
    setLessonModalVisible(true);
  };

  const handleCloseLessonModal = () => {
    setLessonModalVisible(false);
    setSelectedLesson(null);
  };

  const renderLessonItem = ({ item: lesson }: { item: Lesson }) => (
    <TouchableOpacity
      style={[
        styles.lessonItem,
        lesson.completed && styles.lessonItemCompleted,
        lesson.locked && styles.lessonItemLocked,
      ]}
      onPress={() => handleLessonPress(lesson)}
      disabled={lesson.locked}
    >
      <Card style={
        lesson.locked ? styles.lessonCardLocked :
        lesson.completed ? styles.lessonCardCompleted :
        styles.lessonCard
      }>
        <CardContent style={styles.lessonCardContent}>
          {/* Lesson Status Icon */}
          <View style={styles.lessonStatus}>
            {lesson.locked ? (
              <View style={styles.lockIcon}>
                <Ionicons name="lock-closed" size={20} color={theme.colors.mutedForeground} />
              </View>
            ) : lesson.completed ? (
              <View style={styles.completedIcon}>
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.success500} />
              </View>
            ) : (
              <View style={styles.pendingIcon}>
                <Ionicons name="play-circle" size={24} color={theme.colors.primary} />
              </View>
            )}
          </View>

          {/* Lesson Content */}
          <View style={styles.lessonContent}>
            <Text style={[
              styles.lessonTitle,
              lesson.locked && styles.lessonTitleLocked,
            ]}>
              {lesson.title}
            </Text>
            
            <Text style={[
              styles.lessonPhrase,
              lesson.locked && styles.lessonPhraseLocked,
            ]}>
              {lesson.targetPhrase}
            </Text>
            
            <Text style={styles.lessonTranslation}>
              {lesson.englishPhrase}
            </Text>

            {lesson.pronunciation && !lesson.locked && (
              <Text style={styles.lessonPronunciation}>
                /{lesson.pronunciation}/
              </Text>
            )}
          </View>

          {/* Lesson Number */}
          <View style={styles.lessonNumber}>
            <Text style={[
              styles.lessonNumberText,
              lesson.completed && styles.lessonNumberCompleted,
              lesson.locked && styles.lessonNumberLocked,
            ]}>
              {lesson.order}
            </Text>
          </View>
        </CardContent>
      </Card>
    </TouchableOpacity>
  );

  if (isLoading || !courseData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading lessons...</Text>
      </View>
    );
  }

  const progressPercentage = (courseData.completedLessons / courseData.totalLessons) * 100;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.courseInfo}>
          <Text style={styles.courseEmoji}>{courseData.emoji}</Text>
          <View style={styles.courseDetails}>
            <Text style={styles.courseName}>{courseData.name}</Text>
            <Text style={styles.courseLevel}>{courseData.level}</Text>
          </View>
        </View>
        
        <View style={styles.courseStats}>
          <Text style={styles.courseProgress}>
            {courseData.completedLessons}/{courseData.totalLessons} lessons
          </Text>
          <Progress
            value={progressPercentage}
            style={styles.courseProgressBar}
            progressColor={theme.colors.primary}
          />
        </View>
      </View>

      {/* Course Description */}
      <Card style={styles.descriptionCard}>
        <CardContent style={styles.descriptionContent}>
          <Text style={styles.courseDescription}>{courseData.description}</Text>
        </CardContent>
      </Card>

      {/* Lessons List */}
      <FlatList
        data={courseData.lessons}
        renderItem={renderLessonItem}
        keyExtractor={(item) => item.id}
        style={styles.lessonsList}
        contentContainerStyle={styles.lessonsListContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Lesson Modal */}
      {selectedLesson && (
        <LessonModal
          lesson={selectedLesson}
          language={language}
          visible={lessonModalVisible}
          onClose={handleCloseLessonModal}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },

  // Header
  header: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  courseInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  courseEmoji: {
    fontSize: theme.fontSize['3xl'],
  },
  courseDetails: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  courseName: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700' as any,
    color: theme.colors.foreground,
  },
  courseLevel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  courseStats: {
    gap: theme.spacing.sm,
  },
  courseProgress: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  courseProgressBar: {
    height: 8,
  },

  // Description
  descriptionCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  descriptionContent: {
    paddingVertical: theme.spacing.md,
  },
  courseDescription: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    lineHeight: theme.fontSize.base * 1.4,
    textAlign: 'center',
  },

  // Lessons List
  lessonsList: {
    flex: 1,
  },
  lessonsListContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },

  // Lesson Item
  lessonItem: {
    opacity: 1,
  },
  lessonItemCompleted: {
    opacity: 0.8,
  },
  lessonItemLocked: {
    opacity: 0.5,
  },
  lessonCard: {
    backgroundColor: theme.colors.card,
  },
  lessonCardCompleted: {
    backgroundColor: theme.colors.success500 + '10',
    borderColor: theme.colors.success500 + '30',
    borderWidth: 1,
  },
  lessonCardLocked: {
    backgroundColor: theme.colors.muted,
  },
  lessonCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },

  // Lesson Status
  lessonStatus: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  lockIcon: {
    padding: theme.spacing.sm,
  },
  completedIcon: {
    padding: theme.spacing.sm,
  },
  pendingIcon: {
    padding: theme.spacing.sm,
  },

  // Lesson Content
  lessonContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  lessonTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: '600' as any,
    color: theme.colors.foreground,
  },
  lessonTitleLocked: {
    color: theme.colors.mutedForeground,
  },
  lessonPhrase: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700' as any,
    color: theme.colors.primary,
  },
  lessonPhraseLocked: {
    color: theme.colors.mutedForeground,
  },
  lessonTranslation: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  lessonPronunciation: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontStyle: 'italic',
  },

  // Lesson Number
  lessonNumber: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary,
  },
  lessonNumberText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700' as any,
    color: 'white',
  },
  lessonNumberCompleted: {
    color: 'white',
  },
  lessonNumberLocked: {
    color: theme.colors.mutedForeground,
  },
});