import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  ScrollView,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/apiClient';

interface LessonScreenProps {
  navigation: any;
  route: {
    params: {
      courseId: string;
      lessonId: string;
      stepNumber?: number;
    };
  };
}

interface LessonStep {
  id: number;
  stepNumber: number;
  stepType: string;
  content: any;
}

interface Lesson {
  id: number;
  title: string;
  courseId: string;
  steps: LessonStep[];
}

export default function LessonScreen({ navigation, route }: LessonScreenProps) {
  const { courseId, lessonId, stepNumber = 1 } = route.params;
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState(stepNumber);
  const [userAnswer, setUserAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Fetch lesson data
  const { data: lesson, isLoading, error } = useQuery<Lesson>({
    queryKey: ['/api/lesson', courseId, lessonId],
    queryFn: () => apiClient.getLesson(courseId, lessonId),
  });

  // Submit lesson step mutation
  const submitStepMutation = useMutation({
    mutationFn: (stepData: any) => apiClient.submitLessonStep(stepData),
    onSuccess: () => {
      // Invalidate progress queries to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
    },
  });

  useEffect(() => {
    setCurrentStep(stepNumber);
  }, [stepNumber]);

  const handleAnswerSubmit = async () => {
    if (!lesson) return;

    const step = lesson.steps.find(s => s.stepNumber === currentStep);
    if (!step) return;

    let answer = '';
    let correct = false;

    // Determine correct answer based on step type
    switch (step.stepType) {
      case 'quick_check':
        answer = selectedOption;
        correct = answer === step.content.mcq.answer;
        break;
      case 'typing':
        answer = userAnswer.trim().toLowerCase();
        const expectedAnswer = step.content.expected_answer.toLowerCase();
        const altAnswers = step.content.alt_answers?.map((a: string) => a.toLowerCase()) || [];
        correct = answer === expectedAnswer || altAnswers.includes(answer);
        break;
      case 'comprehension':
        answer = selectedOption;
        correct = answer === step.content.answer;
        break;
      default:
        correct = true; // For word_review steps, just mark as completed
    }

    setIsCorrect(correct);
    setIsAnswerSubmitted(true);

    // Submit progress to backend
    try {
      await submitStepMutation.mutateAsync({
        courseId,
        lessonId,
        stepNumber: currentStep,
        answer,
        correct,
        timeSpent: 30, // Could track actual time spent
      });
    } catch (error) {
      console.error('Failed to submit step:', error);
    }
  };

  const handleNextStep = () => {
    if (!lesson) return;

    if (currentStep < lesson.steps.length) {
      setCurrentStep(currentStep + 1);
      resetStepState();
    } else {
      // Lesson complete
      Alert.alert(
        'Lesson Complete! 🎉',
        'Great job! You\'ve finished this lesson.',
        [
          {
            text: 'Continue Learning',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  };

  const handleTryAgain = () => {
    setIsAnswerSubmitted(false);
    setUserAnswer('');
    setSelectedOption('');
  };

  const resetStepState = () => {
    setUserAnswer('');
    setSelectedOption('');
    setIsAnswerSubmitted(false);
    setIsCorrect(false);
  };

  const renderStepContent = (step: LessonStep) => {
    switch (step.stepType) {
      case 'word_review':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Word Review</Text>
            <View style={styles.wordCard}>
              <Text style={styles.italianText}>{step.content.italian}</Text>
              <Text style={styles.englishText}>{step.content.english}</Text>
              {step.content.note && (
                <Text style={styles.noteText}>💡 {step.content.note}</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleNextStep}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        );

      case 'quick_check':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Quick Check</Text>
            <Text style={styles.questionText}>{step.content.mcq.question}</Text>
            <View style={styles.optionsContainer}>
              {step.content.mcq.options.map((option: string, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    selectedOption === option && styles.selectedOption,
                    isAnswerSubmitted && option === step.content.mcq.answer && styles.correctOption,
                    isAnswerSubmitted && selectedOption === option && selectedOption !== step.content.mcq.answer && styles.wrongOption,
                  ]}
                  onPress={() => !isAnswerSubmitted && setSelectedOption(option)}
                  disabled={isAnswerSubmitted}
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
            {renderAnswerButton()}
          </View>
        );

      case 'typing':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Type the Translation</Text>
            <Text style={styles.promptText}>{step.content.type_prompt}</Text>
            <TextInput
              style={[
                styles.textInput,
                isAnswerSubmitted && (isCorrect ? styles.correctInput : styles.wrongInput)
              ]}
              value={userAnswer}
              onChangeText={setUserAnswer}
              placeholder="Type your answer..."
              editable={!isAnswerSubmitted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {isAnswerSubmitted && !isCorrect && (
              <Text style={styles.correctAnswerText}>
                Correct answer: {step.content.expected_answer}
              </Text>
            )}
            {renderAnswerButton()}
          </View>
        );

      case 'comprehension':
        return (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Listening Comprehension</Text>
            <View style={styles.audioContainer}>
              <Text style={styles.audioEmoji}>🔊</Text>
              <Text style={styles.audioText}>Audio: {step.content.audio_sentence}</Text>
            </View>
            <Text style={styles.questionText}>What did you hear?</Text>
            <View style={styles.optionsContainer}>
              {step.content.options.map((option: string, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.optionButton,
                    selectedOption === option && styles.selectedOption,
                    isAnswerSubmitted && option === step.content.answer && styles.correctOption,
                    isAnswerSubmitted && selectedOption === option && selectedOption !== step.content.answer && styles.wrongOption,
                  ]}
                  onPress={() => !isAnswerSubmitted && setSelectedOption(option)}
                  disabled={isAnswerSubmitted}
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
            {renderAnswerButton()}
          </View>
        );

      default:
        return (
          <View style={styles.stepContent}>
            <Text style={styles.errorText}>Unknown step type: {step.stepType}</Text>
          </View>
        );
    }
  };

  const renderAnswerButton = () => {
    if (isAnswerSubmitted) {
      return (
        <View style={styles.resultContainer}>
          <Text style={[styles.resultText, isCorrect ? styles.correctText : styles.wrongText]}>
            {isCorrect ? '✅ Correct!' : '❌ Try again'}
          </Text>
          <View style={styles.actionButtons}>
            {!isCorrect && (
              <TouchableOpacity style={styles.tryAgainButton} onPress={handleTryAgain}>
                <Text style={styles.tryAgainButtonText}>Try Again</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.nextButton} onPress={handleNextStep}>
              <Text style={styles.nextButtonText}>
                {currentStep < (lesson?.steps.length || 0) ? 'Next' : 'Complete'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const canSubmit = selectedOption || userAnswer.trim();
    return (
      <TouchableOpacity
        style={[styles.submitButton, !canSubmit && styles.disabledButton]}
        onPress={handleAnswerSubmit}
        disabled={!canSubmit || submitStepMutation.isPending}
      >
        {submitStepMutation.isPending ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.submitButtonText}>Submit</Text>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Could not load lesson</Text>
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

  const currentStepData = lesson.steps.find(s => s.stepNumber === currentStep);
  
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
        <Text style={styles.headerTitle}>{lesson.title}</Text>
        <Text style={styles.stepIndicator}>
          {currentStep}/{lesson.steps.length}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${(currentStep / lesson.steps.length) * 100}%` }
          ]}
        />
      </View>

      {/* Step Content */}
      <ScrollView style={styles.contentContainer}>
        {currentStepData && renderStepContent(currentStepData)}
      </ScrollView>
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
  stepIndicator: {
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
    backgroundColor: '#3b82f6',
  },
  contentContainer: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 24,
    textAlign: 'center',
  },
  wordCard: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  italianText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  englishText: {
    fontSize: 20,
    color: '#64748b',
    marginBottom: 16,
    textAlign: 'center',
  },
  noteText: {
    fontSize: 14,
    color: '#f59e0b',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  questionText: {
    fontSize: 18,
    color: '#1e293b',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  promptText: {
    fontSize: 18,
    color: '#1e293b',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  optionButton: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  selectedOption: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f7ff',
  },
  correctOption: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  wrongOption: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  optionText: {
    fontSize: 16,
    color: '#1e293b',
    textAlign: 'center',
  },
  selectedOptionText: {
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  correctInput: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  wrongInput: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  correctAnswerText: {
    fontSize: 14,
    color: '#10b981',
    textAlign: 'center',
    marginBottom: 16,
  },
  audioContainer: {
    backgroundColor: 'white',
    padding: 20,
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
    fontSize: 32,
    marginBottom: 8,
  },
  audioText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#94a3b8',
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  correctText: {
    color: '#10b981',
  },
  wrongText: {
    color: '#ef4444',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  tryAgainButton: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  tryAgainButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
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