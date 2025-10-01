import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  SafeAreaView,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Speech from 'expo-speech';

import { theme } from '../lib/theme';
import { apiClient } from '../lib/apiClient';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

const { width: screenWidth } = Dimensions.get('window');

interface LessonModalProps {
  lesson: any;
  language: string;
  visible: boolean;
  onClose: () => void;
}

type Phase = 1 | 2 | 3 | 4;

export default function LessonModal({ 
  lesson, 
  language, 
  visible,
  onClose 
}: LessonModalProps) {
  const queryClient = useQueryClient();
  const [currentPhase, setCurrentPhase] = useState<Phase>(1);
  const [completedPhases, setCompletedPhases] = useState<Set<Phase>>(new Set());
  
  // Phase 2 state (Quick Check MCQ)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showPhase2Result, setShowPhase2Result] = useState(false);
  const [phase2Correct, setPhase2Correct] = useState(false);
  
  // Phase 3 state (Typing Practice)
  const [fillInAnswer, setFillInAnswer] = useState<string>('');
  const [showPhase3Result, setShowPhase3Result] = useState(false);
  const [phase3Correct, setPhase3Correct] = useState(false);
  
  // Phase 4 state (Listening Comprehension)
  const [phase4Answer, setPhase4Answer] = useState<string>('');
  const [showPhase4Result, setShowPhase4Result] = useState(false);
  const [phase4Correct, setPhase4Correct] = useState(false);

  const completeLessonMutation = useMutation({
    mutationFn: async (score: number) => {
      await apiClient.updateProgress({
        language,
        courseId: "course1", // Default course ID
        lessonId: lesson.id,
        completed: true,
        score,
        completedAt: new Date(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress', language] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats', language] });
      
      Alert.alert(
        'Lesson completed!',
        'Great job! Keep up the learning streak.',
        [{ text: 'OK', onPress: onClose }]
      );
    },
    onError: (error) => {
      Alert.alert(
        'Error',
        'Failed to save lesson progress. Please try again.',
        [{ text: 'OK' }]
      );
    },
  });

  // Text-to-speech function - matching web exactly
  const speakText = (text: string) => {
    const languageCode = language === 'spanish' ? 'es' : 
                        language === 'french' ? 'fr' :
                        language === 'italian' ? 'it' :
                        language === 'german' ? 'de' : 'en';
    
    Speech.speak(text, {
      language: languageCode,
      pitch: 1,
      rate: 0.8,
    });
  };

  // Phase handlers - matching web logic exactly
  const handlePhase1Complete = () => {
    // Phase 1 is just word review, automatically mark as complete
    setCompletedPhases(prev => new Set([...Array.from(prev), 1 as Phase]));
    setCurrentPhase(2);
  };

  const handlePhase2Submit = () => {
    if (!selectedAnswer || !lesson?.quiz) return;
    
    const answerIndex = parseInt(selectedAnswer);
    const correct = answerIndex === lesson.quiz.correct;
    setPhase2Correct(correct);
    setShowPhase2Result(true);
    
    if (correct) {
      setCompletedPhases(prev => new Set([...Array.from(prev), 2 as Phase]));
    }
  };

  const handlePhase3Submit = () => {
    if (!fillInAnswer.trim()) return;
    
    // Check if the answer matches only the missing letters (case insensitive)
    const expectedLetters = getMissingLetters(lesson.content.word);
    const correct = fillInAnswer.toLowerCase().trim() === expectedLetters.toLowerCase();
    setPhase3Correct(correct);
    setShowPhase3Result(true);
    
    if (correct) {
      setCompletedPhases(prev => new Set([...Array.from(prev), 3 as Phase]));
    }
  };

  const handlePhase4Submit = () => {
    if (!phase4Answer) return;
    
    const answerIndex = parseInt(phase4Answer);
    // The first option is always correct for Phase 4 listening comprehension
    const correct = answerIndex === 0;
    setPhase4Correct(correct);
    setShowPhase4Result(true);
    
    if (correct) {
      setCompletedPhases(prev => new Set([...Array.from(prev), 4 as Phase]));
    }
  };

  const handleCompleteLesson = () => {
    const completedCount = completedPhases.size;
    const score = Math.round((completedCount / 4) * 100);
    completeLessonMutation.mutate(score);
  };

  const canNavigateToPhase = (phase: Phase) => {
    if (phase === 1) return true;
    if (phase === 2) return completedPhases.has(1);
    if (phase === 3) return completedPhases.has(1) && completedPhases.has(2);
    if (phase === 4) return completedPhases.has(1) && completedPhases.has(2) && completedPhases.has(3);
    return false;
  };

  // Generate fill-in text for Phase 3 and get missing letters - matching web exactly
  const generateFillInText = (word: string) => {
    // For phrases with spaces, show the first word and blank out the rest
    if (word.includes(' ')) {
      const parts = word.split(' ');
      return parts[0] + "_".repeat(word.length - parts[0].length);
    }
    // For single words
    if (word.length <= 3) return word.charAt(0) + "_".repeat(word.length - 1);
    return word.substring(0, 2) + "_".repeat(word.length - 2);
  };

  const getMissingLetters = (word: string) => {
    // For phrases with spaces, return everything after the first word (excluding the space)
    if (word.includes(' ')) {
      const firstSpaceIndex = word.indexOf(' ');
      return word.substring(firstSpaceIndex + 1); // +1 to skip the space
    }
    // For single words
    if (word.length <= 3) return word.substring(1);
    return word.substring(2);
  };

  // Render phases - matching web structure exactly
  const renderPhase1 = () => (
    <View style={styles.phaseContainer}>
      <Text style={styles.phaseTitle}>Phase 1 — Word Review</Text>
      
      {/* Word Introduction */}
      <View style={styles.wordIntroCard}>
        <Text style={styles.wordEmoji}>{lesson.emoji}</Text>
        <Text style={styles.wordText}>{lesson.content.word}</Text>
        <Text style={styles.translationText}>{lesson.content.translation}</Text>
        <TouchableOpacity
          style={styles.speakButton}
          onPress={() => speakText(lesson.content.word)}
        >
          <Ionicons name="volume-high" size={20} color="#ffffff" />
          <Text style={styles.speakButtonText}>Listen</Text>
        </TouchableOpacity>
      </View>

      {/* Usage Note */}
      <View style={styles.usageNoteCard}>
        <Text style={styles.usageNoteTitle}>Usage Note</Text>
        <Text style={styles.usageNoteText}>
          {lesson.content.note || 'Polite but still friendly. Good for strangers or when you want to be respectful without being too formal.'}
        </Text>
      </View>

      <Button style={styles.continueButton} onPress={handlePhase1Complete}>
        <Text style={styles.continueButtonText}>Continue to Quick Check</Text>
        <Ionicons name="arrow-forward" size={16} color="#ffffff" />
      </Button>
    </View>
  );

  const renderPhase2 = () => (
    <View style={styles.phaseContainer}>
      <Text style={styles.phaseTitle}>Phase 2 — Quick Check</Text>
      
      <Text style={styles.questionText}>
        {lesson.quiz?.question || `Which phrase means "${lesson.content.translation}"?`}
      </Text>
      
      <View style={styles.optionsContainer}>
        {(lesson.quiz?.options || [lesson.content.word, 'Ciao', 'Buongiorno', 'Buonanotte']).map((option: string, index: number) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              selectedAnswer === index.toString() && styles.optionButtonSelected,
              showPhase2Result && index === (lesson.quiz?.correct || 0) && styles.optionButtonCorrect,
              showPhase2Result && selectedAnswer === index.toString() && index !== (lesson.quiz?.correct || 0) && styles.optionButtonIncorrect,
            ]}
            onPress={() => !showPhase2Result && setSelectedAnswer(index.toString())}
            disabled={showPhase2Result}
          >
            <Text style={[
              styles.optionText,
              selectedAnswer === index.toString() && styles.optionTextSelected,
              showPhase2Result && index === (lesson.quiz?.correct || 0) && styles.optionTextCorrect,
              showPhase2Result && selectedAnswer === index.toString() && index !== (lesson.quiz?.correct || 0) && styles.optionTextIncorrect,
            ]}>
              {option} {index === (lesson.quiz?.correct || 0) && showPhase2Result && '✅'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {showPhase2Result && (
        <View style={[
          styles.resultCard,
          phase2Correct ? styles.resultCardCorrect : styles.resultCardIncorrect
        ]}>
          <Ionicons 
            name={phase2Correct ? "checkmark" : "close"} 
            size={20} 
            color={phase2Correct ? "#10b981" : "#ef4444"} 
          />
          <Text style={[
            styles.resultText,
            phase2Correct ? styles.resultTextCorrect : styles.resultTextIncorrect
          ]}>
            {phase2Correct ? 'Correct! Well done!' : `Incorrect. The correct answer is: ${(lesson.quiz?.options || [lesson.content.word])[lesson.quiz?.correct || 0]}`}
          </Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <Button
          style={styles.backButton}
          onPress={() => setCurrentPhase(1)}
        >
          <Ionicons name="arrow-back" size={16} color={theme.colors.foreground} />
          <Text style={styles.backButtonText}>Back to Word Review</Text>
        </Button>
        
        {!showPhase2Result ? (
          <Button
            style={[styles.submitButton, !selectedAnswer && styles.submitButtonDisabled]}
            onPress={handlePhase2Submit}
            disabled={!selectedAnswer}
          >
            <Text style={styles.submitButtonText}>Submit Answer</Text>
          </Button>
        ) : (
          <Button
            style={[styles.continueButton, !phase2Correct && styles.continueButtonDisabled]}
            onPress={() => phase2Correct && setCurrentPhase(3)}
            disabled={!phase2Correct}
          >
            <Text style={styles.continueButtonText}>Continue to Typing Practice</Text>
            <Ionicons name="arrow-forward" size={16} color="#ffffff" />
          </Button>
        )}
      </View>
    </View>
  );

  const renderPhase3 = () => (
    <View style={styles.phaseContainer}>
      <Text style={styles.phaseTitle}>Phase 3 — Typing Practice</Text>
      
      {/* Fill in Exercise */}
      <View style={styles.typingCard}>
        <Text style={styles.typingTitle}>Fill in the missing letters:</Text>
        <Text style={styles.fillInText}>
          "{generateFillInText(lesson.content.word)}" = {lesson.content.translation}
        </Text>
        <Text style={styles.typingHint}>Type only the missing letters</Text>
        <TextInput
          style={styles.typingInput}
          value={fillInAnswer}
          onChangeText={setFillInAnswer}
          placeholder="Type the missing letters only"
          placeholderTextColor={theme.colors.mutedForeground}
          editable={!showPhase3Result}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {showPhase3Result && (
        <View style={[
          styles.resultCard,
          phase3Correct ? styles.resultCardCorrect : styles.resultCardIncorrect
        ]}>
          <Ionicons 
            name={phase3Correct ? "checkmark" : "close"} 
            size={20} 
            color={phase3Correct ? "#10b981" : "#ef4444"} 
          />
          <Text style={[
            styles.resultText,
            phase3Correct ? styles.resultTextCorrect : styles.resultTextIncorrect
          ]}>
            {phase3Correct ? 'Excellent! You got it right!' : `Not quite. The missing letters are: ${getMissingLetters(lesson.content.word)}`}
          </Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <Button
          style={styles.backButton}
          onPress={() => setCurrentPhase(2)}
        >
          <Ionicons name="arrow-back" size={16} color={theme.colors.foreground} />
          <Text style={styles.backButtonText}>Back to Quick Check</Text>
        </Button>
        
        {!showPhase3Result ? (
          <Button
            style={[styles.submitButton, !fillInAnswer.trim() && styles.submitButtonDisabled]}
            onPress={handlePhase3Submit}
            disabled={!fillInAnswer.trim()}
          >
            <Text style={styles.submitButtonText}>Check Answer</Text>
          </Button>
        ) : (
          <Button
            style={[styles.continueButton, !phase3Correct && styles.continueButtonDisabled]}
            onPress={() => phase3Correct && setCurrentPhase(4)}
            disabled={!phase3Correct}
          >
            <Text style={styles.continueButtonText}>Continue to Listening</Text>
            <Ionicons name="arrow-forward" size={16} color="#ffffff" />
          </Button>
        )}
      </View>
    </View>
  );

  const renderPhase4 = () => (
    <View style={styles.phaseContainer}>
      <Text style={styles.phaseTitle}>Phase 4 — Listening & Contextual Application</Text>
      
      {/* Audio Context */}
      <View style={styles.listeningCard}>
        <Text style={styles.listeningTitle}>Listen and Choose:</Text>
        <TouchableOpacity
          style={styles.playButton}
          onPress={() => speakText(`${lesson.content.word}, ciao!`)}
        >
          <Ionicons name="volume-high" size={24} color="#ffffff" />
          <Text style={styles.playButtonText}>Play: "{lesson.content.word}, ciao!"</Text>
        </TouchableOpacity>
        <Text style={styles.listeningHint}>What did you hear?</Text>
      </View>

      <Text style={styles.questionText}>Choose the correct translation:</Text>
      
      <View style={styles.optionsContainer}>
        {[
          `${lesson.content.translation}, hi!`,
          `${lesson.content.translation}, good evening!`,
          `Goodbye, ${lesson.content.translation.toLowerCase()}!`,
          `Good morning, hi!`
        ].map((option: string, index: number) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.optionButton,
              phase4Answer === index.toString() && styles.optionButtonSelected,
              showPhase4Result && index === 0 && styles.optionButtonCorrect,
              showPhase4Result && phase4Answer === index.toString() && index !== 0 && styles.optionButtonIncorrect,
            ]}
            onPress={() => !showPhase4Result && setPhase4Answer(index.toString())}
            disabled={showPhase4Result}
          >
            <Text style={[
              styles.optionText,
              phase4Answer === index.toString() && styles.optionTextSelected,
              showPhase4Result && index === 0 && styles.optionTextCorrect,
              showPhase4Result && phase4Answer === index.toString() && index !== 0 && styles.optionTextIncorrect,
            ]}>
              {String.fromCharCode(97 + index)}) {option} {index === 0 && showPhase4Result && '✅'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {showPhase4Result && (
        <View style={[
          styles.resultCard,
          phase4Correct ? styles.resultCardCorrect : styles.resultCardIncorrect
        ]}>
          <Ionicons 
            name={phase4Correct ? "checkmark" : "close"} 
            size={20} 
            color={phase4Correct ? "#10b981" : "#ef4444"} 
          />
          <Text style={[
            styles.resultText,
            phase4Correct ? styles.resultTextCorrect : styles.resultTextIncorrect
          ]}>
            {phase4Correct ? 'Perfect! You completed all phases!' : `Not quite. The correct answer is: ${lesson.content.translation}, hi!`}
          </Text>
        </View>
      )}

      <View style={styles.buttonRow}>
        <Button
          style={styles.backButton}
          onPress={() => setCurrentPhase(3)}
        >
          <Ionicons name="arrow-back" size={16} color={theme.colors.foreground} />
          <Text style={styles.backButtonText}>Back to Typing Practice</Text>
        </Button>
        
        {!showPhase4Result ? (
          <Button
            style={[styles.submitButton, !phase4Answer && styles.submitButtonDisabled]}
            onPress={handlePhase4Submit}
            disabled={!phase4Answer}
          >
            <Text style={styles.submitButtonText}>Submit Answer</Text>
          </Button>
        ) : (
          <Button
            style={styles.completeButton}
            onPress={handleCompleteLesson}
            disabled={completeLessonMutation.isPending}
          >
            <Text style={styles.completeButtonText}>
              {completeLessonMutation.isPending ? 'Saving...' : 'Complete Lesson'}
            </Text>
          </Button>
        )}
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{lesson.title}</Text>
            <Text style={styles.headerSubtitle}>{lesson.category}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Phase Navigation - matching web exactly */}
        <View style={styles.phaseNavigation}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.phaseNavigationContent}
          >
            {[1, 2, 3, 4].map((phase) => (
              <TouchableOpacity
                key={phase}
                onPress={() => canNavigateToPhase(phase as Phase) && setCurrentPhase(phase as Phase)}
                disabled={!canNavigateToPhase(phase as Phase)}
                style={[
                  styles.phaseNavButton,
                  currentPhase === phase && styles.phaseNavButtonActive,
                  completedPhases.has(phase as Phase) && styles.phaseNavButtonCompleted,
                  !canNavigateToPhase(phase as Phase) && styles.phaseNavButtonDisabled,
                ]}
              >
                <View style={styles.phaseNavContent}>
                  {completedPhases.has(phase as Phase) ? (
                    <Ionicons name="checkmark" size={16} color="#ffffff" />
                  ) : (
                    <Text style={[
                      styles.phaseNavNumber,
                      currentPhase === phase && styles.phaseNavNumberActive,
                      !canNavigateToPhase(phase as Phase) && styles.phaseNavNumberDisabled,
                    ]}>
                      {phase}
                    </Text>
                  )}
                  <Text style={[
                    styles.phaseNavLabel,
                    currentPhase === phase && styles.phaseNavLabelActive,
                    completedPhases.has(phase as Phase) && styles.phaseNavLabelCompleted,
                    !canNavigateToPhase(phase as Phase) && styles.phaseNavLabelDisabled,
                  ]}>
                    {phase === 1 && 'Word Review'}
                    {phase === 2 && 'Quick Check'}
                    {phase === 3 && 'Typing Practice'}
                    {phase === 4 && 'Listening & Context'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {currentPhase === 1 && renderPhase1()}
          {currentPhase === 2 && renderPhase2()}
          {currentPhase === 3 && renderPhase3()}
          {currentPhase === 4 && renderPhase4()}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },

  // Phase Navigation
  phaseNavigation: {
    backgroundColor: '#f9fafb',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  phaseNavigationContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  phaseNavButton: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: '#f3f4f6',
    minWidth: 100,
  },
  phaseNavButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  phaseNavButtonCompleted: {
    backgroundColor: '#10b981',
  },
  phaseNavButtonDisabled: {
    backgroundColor: '#f9fafb',
    opacity: 0.6,
  },
  phaseNavContent: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  phaseNavNumber: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.mutedForeground,
  },
  phaseNavNumberActive: {
    color: '#ffffff',
  },
  phaseNavNumberDisabled: {
    color: theme.colors.mutedForeground,
    opacity: 0.5,
  },
  phaseNavLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: '500',
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  phaseNavLabelActive: {
    color: '#ffffff',
  },
  phaseNavLabelCompleted: {
    color: '#ffffff',
  },
  phaseNavLabelDisabled: {
    opacity: 0.5,
  },

  // Content
  content: {
    flex: 1,
  },
  phaseContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },
  phaseTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.foreground,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },

  // Phase 1 - Word Review
  wordIntroCard: {
    backgroundColor: '#eff6ff',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  wordEmoji: {
    fontSize: 48,
  },
  wordText: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: '700',
    color: '#1d4ed8',
  },
  translationText: {
    fontSize: theme.fontSize.xl,
    color: '#1e40af',
  },
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  speakButtonText: {
    color: '#ffffff',
    fontSize: theme.fontSize.base,
    fontWeight: '500',
  },
  usageNoteCard: {
    backgroundColor: '#f9fafb',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  usageNoteTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  usageNoteText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    lineHeight: 22,
  },

  // Phase 2 & 4 - Questions and Options
  questionText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  optionsContainer: {
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  optionButton: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  optionButtonSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#f8f9ff',
  },
  optionButtonCorrect: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  optionButtonIncorrect: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  optionText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  optionTextSelected: {
    color: theme.colors.primary,
    fontWeight: '500',
  },
  optionTextCorrect: {
    color: '#10b981',
    fontWeight: '500',
  },
  optionTextIncorrect: {
    color: '#ef4444',
    fontWeight: '500',
  },

  // Phase 3 - Typing Practice
  typingCard: {
    backgroundColor: '#faf5ff',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  typingTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: '#7c3aed',
    textAlign: 'center',
  },
  fillInText: {
    fontSize: theme.fontSize['2xl'],
    fontFamily: 'monospace',
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  typingHint: {
    fontSize: theme.fontSize.sm,
    color: '#7c3aed',
    textAlign: 'center',
  },
  typingInput: {
    fontSize: theme.fontSize.lg,
    textAlign: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#ffffff',
    minWidth: 200,
  },

  // Phase 4 - Listening
  listeningCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  listeningTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: '#059669',
    textAlign: 'center',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: theme.fontSize.base,
    fontWeight: '500',
  },
  listeningHint: {
    fontSize: theme.fontSize.base,
    color: '#059669',
    textAlign: 'center',
  },

  // Results
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  resultCardCorrect: {
    backgroundColor: '#f0fdf4',
  },
  resultCardIncorrect: {
    backgroundColor: '#fef2f2',
  },
  resultText: {
    flex: 1,
    fontSize: theme.fontSize.base,
    fontWeight: '500',
  },
  resultTextCorrect: {
    color: '#10b981',
  },
  resultTextIncorrect: {
    color: '#ef4444',
  },

  // Buttons
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  continueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: theme.fontSize.base,
    fontWeight: '500',
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.sm,
  },
  backButtonText: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    fontWeight: '500',
  },
  submitButton: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: theme.fontSize.base,
    fontWeight: '500',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: theme.fontSize.base,
    fontWeight: '600',
  },
});