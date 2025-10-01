import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../lib/theme';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import LessonModal from '../components/LessonModal';

const { width } = Dimensions.get('window');

// Sample lesson data - matching web exactly
const sampleLessons = [
  {
    id: "course1_lesson2",
    title: "Salve! (Hello - Polite)",
    category: "Greetings",
    emoji: "👋",
    content: {
      word: "Salve",
      translation: "Hello",
      example: "Salve, come sta?",
      exampleTranslation: "Hello, how are you?",
      note: "Polite but still friendly. Good for strangers or when you want to be respectful without being too formal."
    },
    quiz: {
      question: "Which phrase means 'Hello' (polite)?",
      options: ["Ciao", "Salve", "Buongiorno", "Buonanotte"],
      correct: 1
    }
  },
  {
    id: "course1_lesson3",
    title: "Buongiorno (Good Morning)",
    category: "Greetings",
    emoji: "🌅",
    content: {
      word: "Buongiorno",
      translation: "Good morning",
      example: "Buongiorno, signora!",
      exampleTranslation: "Good morning, madam!",
      note: "Formal greeting used from morning until early afternoon. Shows respect and politeness."
    },
    quiz: {
      question: "When would you use 'Buongiorno'?",
      options: ["Evening", "Morning/Early afternoon", "Night", "Anytime"],
      correct: 1
    }
  },
  {
    id: "course2_lesson1",
    title: "Mi chiamo... (My name is...)",
    category: "Introducing Yourself",
    emoji: "🙋‍♂️",
    content: {
      word: "Mi chiamo",
      translation: "My name is",
      example: "Mi chiamo Marco, piacere!",
      exampleTranslation: "My name is Marco, nice to meet you!",
      note: "Standard way to introduce yourself. Very common and universally understood."
    },
    quiz: {
      question: "How do you say 'My name is' in Italian?",
      options: ["Io sono", "Mi chiamo", "Il mio nome", "Sono"],
      correct: 1
    }
  }
];

export default function LessonExampleScreen() {
  const navigation = useNavigation();
  const [selectedLesson, setSelectedLesson] = useState<any>(null);

  const handleGoBack = () => {
    navigation.navigate('Dashboard' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - matching web exactly */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={theme.colors.foreground} />
          <Text style={styles.backButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>4-Phase Lesson Preview</Text>
          <Text style={styles.headerSubtitle}>Try out the new lesson structure</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Introduction Card - matching web exactly */}
        <Card style={styles.introCard}>
          <CardContent style={styles.introContent}>
            <View style={styles.introIcon}>
              <Ionicons name="play" size={48} color="#ffffff" />
            </View>
            <Text style={styles.introTitle}>Interactive 4-Phase Lesson System</Text>
            <Text style={styles.introDescription}>
              Experience our new learning methodology with four progressive phases:
            </Text>
            
            {/* Phase Grid - matching web exactly */}
            <View style={styles.phaseGrid}>
              <View style={styles.phaseItem}>
                <Text style={styles.phaseTitle}>Phase 1: Word Review</Text>
                <Text style={styles.phaseDescription}>Learn the word with audio and context</Text>
              </View>
              <View style={styles.phaseItem}>
                <Text style={styles.phaseTitle}>Phase 2: Quick Check</Text>
                <Text style={styles.phaseDescription}>Multiple choice comprehension test</Text>
              </View>
              <View style={styles.phaseItem}>
                <Text style={styles.phaseTitle}>Phase 3: Typing Practice</Text>
                <Text style={styles.phaseDescription}>Fill-in-the-blank typing exercises</Text>
              </View>
              <View style={styles.phaseItem}>
                <Text style={styles.phaseTitle}>Phase 4: Listening & Context</Text>
                <Text style={styles.phaseDescription}>Apply knowledge in real conversations</Text>
              </View>
            </View>
          </CardContent>
        </Card>

        {/* Sample Lessons Section - matching web exactly */}
        <View style={styles.lessonsSection}>
          <Text style={styles.lessonsTitle}>Try These Sample Lessons</Text>
          
          <View style={styles.lessonsGrid}>
            {sampleLessons.map((lesson) => (
              <Card key={lesson.id} style={styles.lessonCard}>
                <CardContent style={styles.lessonContent}>
                  <View style={styles.lessonHeader}>
                    <Text style={styles.lessonEmoji}>{lesson.emoji}</Text>
                    <Text style={styles.lessonTitle}>{lesson.title}</Text>
                    <Text style={styles.lessonCategory}>{lesson.category}</Text>
                    
                    <View style={styles.lessonPreview}>
                      <Text style={styles.lessonWord}>{lesson.content.word}</Text>
                      <Text style={styles.lessonTranslation}>{lesson.content.translation}</Text>
                    </View>

                    <Button 
                      onPress={() => setSelectedLesson(lesson)}
                      style={styles.startLessonButton}
                    >
                      <Ionicons name="play" size={16} color="#ffffff" />
                      <Text style={styles.startLessonButtonText}>Start 4-Phase Lesson</Text>
                    </Button>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        </View>

        {/* Features Info - matching web exactly */}
        <Card style={styles.featuresCard}>
          <CardContent style={styles.featuresContent}>
            <Text style={styles.featuresTitle}>What You'll Experience</Text>
            <View style={styles.featuresGrid}>
              <View style={styles.featureColumn}>
                <Text style={styles.featureColumnTitle}>Progressive Learning</Text>
                <View style={styles.featureList}>
                  <Text style={styles.featureItem}>• Must complete each phase to advance</Text>
                  <Text style={styles.featureItem}>• Navigate back to review completed phases</Text>
                  <Text style={styles.featureItem}>• Visual progress indicators with checkmarks</Text>
                  <Text style={styles.featureItem}>• Color-coded phases for easy recognition</Text>
                </View>
              </View>
              <View style={styles.featureColumn}>
                <Text style={styles.featureColumnTitle}>Interactive Features</Text>
                <View style={styles.featureList}>
                  <Text style={styles.featureItem}>• Audio pronunciation with text-to-speech</Text>
                  <Text style={styles.featureItem}>• Fill-in-the-blank typing exercises</Text>
                  <Text style={styles.featureItem}>• Multiple choice with immediate feedback</Text>
                  <Text style={styles.featureItem}>• Contextual listening comprehension</Text>
                </View>
              </View>
            </View>
          </CardContent>
        </Card>
      </ScrollView>

      {/* Lesson Modal - matching web exactly */}
      {selectedLesson && (
        <LessonModal 
          lesson={selectedLesson}
          language="italian"
          visible={!!selectedLesson}
          onClose={() => setSelectedLesson(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },

  // Header - matching web header
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    backgroundColor: 'transparent',
    marginBottom: theme.spacing.md,
  },
  backButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    marginLeft: theme.spacing.sm,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },

  // Content
  content: {
    flex: 1,
  },

  // Introduction Card - matching web gradient
  introCard: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    backgroundColor: '#3b82f6', // Blue gradient start
    borderWidth: 0,
  },
  introContent: {
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  introIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  introTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  introDescription: {
    fontSize: theme.fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 22,
  },

  // Phase Grid - matching web layout
  phaseGrid: {
    width: '100%',
    gap: theme.spacing.md,
  },
  phaseItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  phaseTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: theme.spacing.xs,
  },
  phaseDescription: {
    fontSize: theme.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },

  // Sample Lessons Section
  lessonsSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  lessonsTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.lg,
  },
  lessonsGrid: {
    gap: theme.spacing.lg,
  },

  // Lesson Cards - matching web design
  lessonCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  lessonContent: {
    paddingVertical: theme.spacing.xl,
  },
  lessonHeader: {
    alignItems: 'center',
  },
  lessonEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.md,
  },
  lessonTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.foreground,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  lessonCategory: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.lg,
  },
  lessonPreview: {
    backgroundColor: '#f9fafb',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    width: '100%',
  },
  lessonWord: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  lessonTranslation: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
  startLessonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  startLessonButtonText: {
    color: '#ffffff',
    fontSize: theme.fontSize.base,
    fontWeight: '500',
  },

  // Features Card - matching web exactly
  featuresCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  featuresContent: {
    paddingVertical: theme.spacing.xl,
  },
  featuresTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.lg,
  },
  featuresGrid: {
    gap: theme.spacing.lg,
  },
  featureColumn: {
    flex: 1,
  },
  featureColumnTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  featureList: {
    gap: theme.spacing.xs,
  },
  featureItem: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    lineHeight: 18,
  },
});