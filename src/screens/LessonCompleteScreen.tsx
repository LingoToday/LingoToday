import React, { useMemo } from 'react';
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
import funnyItalianComments from '../data/funny_italian_comments.json';
import italianResultMessages from '../data/italian_result_messages.json';
import funnyGermanComments from '../data/funny_german_comments.json';
import germanResultMessages from '../data/german_result_messages.json';
import funnyFrenchComments from '../data/funny_french_comments.json';
import frenchResultMessages from '../data/french_result_messages.json';
import funnySpanishComments from '../data/funny_spanish_comments.json';
import spanishResultMessages from '../data/spanish_result_messages.json';

type LessonCompleteRouteProp = RouteProp<RootStackParamList, 'LessonComplete'>;
type LessonCompleteNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LessonComplete'>;

export default function LessonCompleteScreen() {
  const navigation = useNavigation<LessonCompleteNavigationProp>();
  const route = useRoute<LessonCompleteRouteProp>();
  
  const { lessonTitle, lessonId, courseId, score, language } = route.params;

  // Select message sets based on language
  const { funnyComments, resultMessages } = useMemo(() => {
    const lang = language?.toLowerCase();
    
    switch (lang) {
      case 'german':
        return { funnyComments: funnyGermanComments, resultMessages: germanResultMessages };
      case 'french':
        return { funnyComments: funnyFrenchComments, resultMessages: frenchResultMessages };
      case 'spanish':
        return { funnyComments: funnySpanishComments, resultMessages: spanishResultMessages };
      case 'italian':
      default:
        return { funnyComments: funnyItalianComments, resultMessages: italianResultMessages };
    }
  }, [language]);

  // Get random comment based on score range
  const scoreComment = useMemo(() => {
    let commentArray: string[];
    
    if (score >= 76) {
      commentArray = funnyComments["76-100%"];
    } else if (score >= 51) {
      commentArray = funnyComments["51-75%"];
    } else if (score >= 26) {
      commentArray = funnyComments["26-50%"];
    } else {
      commentArray = funnyComments["0-25%"];
    }
    
    // Return a random comment from the appropriate array
    const randomIndex = Math.floor(Math.random() * commentArray.length);
    return commentArray[randomIndex];
  }, [score, funnyComments]);

  // Get random header based on score range
  const headerMessage = useMemo(() => {
    let headerArray: string[];
    
    if (score >= 76) {
      headerArray = resultMessages["76-100%"].header;
    } else if (score >= 51) {
      headerArray = resultMessages["51-75%"].header;
    } else if (score >= 26) {
      headerArray = resultMessages["26-50%"].header;
    } else {
      headerArray = resultMessages["0-25%"].header;
    }
    
    const randomIndex = Math.floor(Math.random() * headerArray.length);
    return headerArray[randomIndex];
  }, [score, resultMessages]);

  // Get random subtext based on score range
  const subtextMessage = useMemo(() => {
    let subtextArray: string[];
    
    if (score >= 76) {
      subtextArray = resultMessages["76-100%"].subtext;
    } else if (score >= 51) {
      subtextArray = resultMessages["51-75%"].subtext;
    } else if (score >= 26) {
      subtextArray = resultMessages["26-50%"].subtext;
    } else {
      subtextArray = resultMessages["0-25%"].subtext;
    }
    
    const randomIndex = Math.floor(Math.random() * subtextArray.length);
    return subtextArray[randomIndex];
  }, [score, resultMessages]);

  const handleContinue = () => {
    navigation.navigate('MainTabs' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Lesson Complete</Text>
          <Text style={styles.subtitle}>{headerMessage}</Text>
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
              <Text style={styles.comment}>{scoreComment}</Text>
            </View>

            {/* Progress Message */}
            <View style={styles.progressMessage}>
              <Ionicons name="rocket-outline" size={24} color={theme.colors.primary} />
              <Text style={styles.progressText}>{subtextMessage}</Text>
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
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  card: {
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.card,
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
    marginBottom: theme.spacing.sm,
  },
  scoreValue: {
    fontSize: 80,
    fontWeight: '800' as any,
    color: theme.colors.primary,
    letterSpacing: -2,
  },
  commentContainer: {
    backgroundColor: theme.colors.feedbackOlive,
    padding: theme.spacing.xl,
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
