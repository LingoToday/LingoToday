import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { RootStackParamList } from '../navigation/AppNavigator';

type LessonCompleteRouteProp = RouteProp<RootStackParamList, 'LessonComplete'>;
type LessonCompleteNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LessonComplete'>;

export default function LessonCompleteScreen() {
  const navigation = useNavigation<LessonCompleteNavigationProp>();
  const route = useRoute<LessonCompleteRouteProp>();
  
  const { lessonTitle, lessonId, courseId, score, language } = route.params;

  // Get comment based on score
  const getScoreComment = (score: number): string => {
    if (score >= 76) {
      return "Are you secretly Italian? 🇮🇹🔥";
    } else if (score >= 51) {
      return "You'd survive in Rome, as long as you don't order pineapple pizza 🍍😏";
    } else if (score >= 26) {
      return "A solid effort — the locals might still switch to English though 😅";
    } else {
      return "Let's call that… a warm-up round 💀💬";
    }
  };

  const handleContinue = () => {
    navigation.navigate('MainTabs' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Lesson Complete</Text>
          <Text style={styles.subtitle}>Fantastico! You crushed it 💪</Text>
        </View>

        {/* Main Card */}
        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            {/* Lesson Title */}
            <View style={styles.lessonInfo}>
              <Text style={styles.lessonTitle}>{lessonTitle} — Complete, Bravo!</Text>
            </View>

            {/* Score Display */}
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Overall Score:</Text>
              <Text style={styles.scoreValue}>{score}%</Text>
            </View>

            {/* Dynamic Comment */}
            <View style={styles.commentContainer}>
              <Text style={styles.comment}>{getScoreComment(score)}</Text>
            </View>

            {/* Progress Message */}
            <View style={styles.progressMessage}>
              <Ionicons name="rocket-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.progressText}>You're getting fluent fast!</Text>
            </View>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Button
            title="Continue to Dashboard"
            onPress={handleContinue}
            style={styles.primaryButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: '700' as any,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  card: {
    marginBottom: theme.spacing.xl,
  },
  cardContent: {
    padding: theme.spacing.xl,
  },
  lessonInfo: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  lessonTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600' as any,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  scoreLabel: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.xs,
  },
  scoreValue: {
    fontSize: 64,
    fontWeight: '800' as any,
    color: theme.colors.primary,
  },
  commentContainer: {
    backgroundColor: '#F3E8FF',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  comment: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600' as any,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  progressMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  progressText: {
    fontSize: theme.fontSize.base,
    fontWeight: '600' as any,
    color: theme.colors.foreground,
  },
  actions: {
    gap: theme.spacing.md,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
});
