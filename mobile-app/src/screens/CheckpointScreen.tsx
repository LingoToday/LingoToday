import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';
import { CheckpointQuestion } from '../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParamListBase, RouteProp } from '@react-navigation/native';

type CheckpointScreenProps = {
  navigation: NativeStackNavigationProp<ParamListBase, 'Checkpoint'>;
  route: RouteProp<{ Checkpoint: { checkpointId: number } }, 'Checkpoint'>;
};

interface Checkpoint {
  id: number;
  title: string;
  description: string;
  questions: CheckpointQuestion[];
}

export default function CheckpointScreen({ navigation, route }: CheckpointScreenProps) {
  const { checkpointId } = route.params;
  const queryClient = useQueryClient();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [selectedOption, setSelectedOption] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState(0);

  // Fetch checkpoint data
  const { data: checkpoint, isLoading, error } = useQuery<Checkpoint>({
    queryKey: ['/api/checkpoint', checkpointId],
    queryFn: () => apiClient.getCheckpoint(checkpointId) as Promise<Checkpoint>,
  });

  // Submit checkpoint answers mutation
  const submitCheckpointMutation = useMutation({
    mutationFn: (answersData: any) => apiClient.submitCheckpointAnswers(checkpointId, answersData),
    onSuccess: (result) => {
      setScore((result as any).score || 0);
      setIsCompleted(true);
      // Invalidate queries to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/available-checkpoints'] });
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to submit checkpoint. Please try again.');
      console.error('Checkpoint submission error:', error);
    },
  });

  useEffect(() => {
    // Set selected option if we have a saved answer for this question
    const savedAnswer = answers[currentQuestionIndex];
    setSelectedOption(savedAnswer || '');
  }, [currentQuestionIndex, answers]);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

  const handleNextQuestion = () => {
    if (!checkpoint) return;

    // Save current answer
    const newAnswers = {
      ...answers,
      [currentQuestionIndex]: selectedOption,
    };
    setAnswers(newAnswers);

    if (currentQuestionIndex < checkpoint.questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Submit checkpoint
      handleSubmitCheckpoint(newAnswers);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      // Save current answer
      const newAnswers = {
        ...answers,
        [currentQuestionIndex]: selectedOption,
      };
      setAnswers(newAnswers);
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitCheckpoint = async (finalAnswers: { [key: number]: string }) => {
    if (!checkpoint) return;

    // Convert answers to format expected by backend
    const formattedAnswers = checkpoint.questions.map((question, index) => ({
      questionId: question.id,
      selectedAnswer: finalAnswers[index] || '',
    }));

    try {
      await submitCheckpointMutation.mutateAsync(formattedAnswers);
    } catch (error) {
      console.error('Failed to submit checkpoint:', error);
    }
  };

  const handleReturnToDashboard = () => {
    navigation.navigate('Main', { screen: 'Dashboard' });
  };

  const calculatePassingStatus = () => {
    if (!checkpoint) return false;
    const passingScore = Math.ceil(checkpoint.questions.length * 0.7); // 70% to pass
    return score >= passingScore;
  };

  const getScoreColor = (passed: boolean) => {
    return passed ? '#10b981' : '#ef4444';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading checkpoint...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !checkpoint) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Could not load checkpoint</Text>
          <Text style={styles.errorText}>Please try again later</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isCompleted) {
    const passed = calculatePassingStatus();
    const percentage = Math.round((score / checkpoint.questions.length) * 100);

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.resultsContainer}>
          <View style={styles.resultsCard}>
            <Text style={styles.resultsEmoji}>
              {passed ? '🎉' : '💪'}
            </Text>
            <Text style={styles.resultsTitle}>
              {passed ? 'Checkpoint Passed!' : 'Keep Practicing!'}
            </Text>
            <Text style={[styles.scoreText, { color: getScoreColor(passed) }]}>
              {score}/{checkpoint.questions.length} ({percentage}%)
            </Text>
            
            <View style={styles.scoreBreakdown}>
              <Text style={styles.breakdownTitle}>Results:</Text>
              <Text style={styles.breakdownText}>
                • Correct answers: {score}
              </Text>
              <Text style={styles.breakdownText}>
                • Total questions: {checkpoint.questions.length}
              </Text>
              <Text style={styles.breakdownText}>
                • Accuracy: {percentage}%
              </Text>
              {passed ? (
                <Text style={styles.passedText}>
                  ✅ Great job! You've mastered this material.
                </Text>
              ) : (
                <Text style={styles.failedText}>
                  📚 Review the lessons and try again when you're ready.
                </Text>
              )}
            </View>

            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleReturnToDashboard}
              >
                <Text style={styles.primaryButtonText}>Return to Dashboard</Text>
              </TouchableOpacity>
              
              {!passed && (
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => navigation.navigate('Courses')}
                >
                  <Text style={styles.secondaryButtonText}>Review Lessons</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const currentQuestion = checkpoint.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / checkpoint.questions.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{checkpoint.title}</Text>
        <Text style={styles.questionIndicator}>
          {currentQuestionIndex + 1}/{checkpoint.questions.length}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[styles.progressBar, { width: `${progress}%` }]}
        />
      </View>

      {/* Question Content */}
      <ScrollView style={styles.contentContainer}>
        <View style={styles.questionContainer}>
          <Text style={styles.questionTitle}>
            Question {currentQuestionIndex + 1}
          </Text>
          
          <Text style={styles.questionText}>
            {currentQuestion.question}
          </Text>

          {/* Audio indicator if available */}
          {currentQuestion.audioUrl && (
            <View style={styles.audioContainer}>
              <Text style={styles.audioEmoji}>🔊</Text>
              <Text style={styles.audioText}>Audio available</Text>
            </View>
          )}

          {/* Answer Options */}
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionButton,
                  selectedOption === option && styles.selectedOption,
                ]}
                onPress={() => handleOptionSelect(option)}
              >
                <Text style={[
                  styles.optionText,
                  selectedOption === option && styles.selectedOptionText,
                ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Explanation if available */}
          {currentQuestion.explanation && (
            <View style={styles.explanationContainer}>
              <Text style={styles.explanationTitle}>💡 Tip:</Text>
              <Text style={styles.explanationText}>
                {currentQuestion.explanation}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigationContainer}>
        {currentQuestionIndex > 0 && (
          <TouchableOpacity
            style={styles.prevButton}
            onPress={handlePreviousQuestion}
          >
            <Text style={styles.prevButtonText}>← Previous</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={[
            styles.nextButton,
            !selectedOption && styles.disabledButton,
          ]}
          onPress={handleNextQuestion}
          disabled={!selectedOption || submitCheckpointMutation.isPending}
        >
          {submitCheckpointMutation.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.nextButtonText}>
              {currentQuestionIndex === checkpoint.questions.length - 1 ? 'Submit' : 'Next'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#64748b',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    textAlign: 'center',
  },
  questionIndicator: {
    fontSize: 14,
    color: '#64748b',
    minWidth: 40,
    textAlign: 'right',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#f1f5f9',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f59e0b', // Orange for checkpoint
  },
  contentContainer: {
    flex: 1,
  },
  questionContainer: {
    padding: 20,
  },
  questionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 16,
    textAlign: 'center',
  },
  questionText: {
    fontSize: 20,
    color: '#1e293b',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 28,
  },
  audioContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  audioEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  audioText: {
    fontSize: 14,
    color: '#64748b',
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    backgroundColor: 'white',
    padding: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedOption: {
    borderColor: '#f59e0b',
    backgroundColor: '#fef7ed',
  },
  optionText: {
    fontSize: 16,
    color: '#1e293b',
    textAlign: 'center',
  },
  selectedOptionText: {
    fontWeight: '600',
    color: '#f59e0b',
  },
  explanationContainer: {
    backgroundColor: '#fef7ed',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  explanationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 4,
  },
  explanationText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 18,
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  prevButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  prevButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#f59e0b',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#94a3b8',
  },
  resultsContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  resultsCard: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  resultsEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  resultsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  scoreBreakdown: {
    width: '100%',
    marginBottom: 32,
  },
  breakdownTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  breakdownText: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 4,
  },
  passedText: {
    fontSize: 16,
    color: '#10b981',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  failedText: {
    fontSize: 16,
    color: '#ef4444',
    marginTop: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  secondaryButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});