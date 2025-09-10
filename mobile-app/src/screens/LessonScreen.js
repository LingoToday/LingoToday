import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';

export default function LessonScreen({ route, navigation }) {
  const { courseId, lessonId, user } = route.params;
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [stepResults, setStepResults] = useState({});
  const [lessonData, setLessonData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const API_BASE_URL = 'http://localhost:5000';

  // Mock lesson data - in real app this would come from API
  const mockLessonData = {
    id: lessonId,
    title: "Greetings - Lesson 1",
    courseId: courseId,
    steps: [
      {
        stepNumber: 1,
        stepType: 'word_review',
        content: {
          word: 'Ciao',
          translation: 'Hello/Goodbye',
          audio: 'ciao_audio.mp3',
          note: 'Informal greeting used with friends and family'
        }
      },
      {
        stepNumber: 2,
        stepType: 'quick_check',
        content: {
          question: 'What does "Ciao" mean?',
          options: ['Hello/Goodbye', 'Good morning', 'Good night', 'Thank you'],
          correctAnswer: 'Hello/Goodbye'
        }
      },
      {
        stepNumber: 3,
        stepType: 'typing',
        content: {
          prompt: 'Complete the word: Ci__ = Hello/Goodbye',
          expectedAnswer: 'ao',
          alternatives: ['AO', 'Ao']
        }
      },
      {
        stepNumber: 4,
        stepType: 'comprehension',
        content: {
          audioSentence: 'Ciao! Come stai?',
          options: ['Hello! How are you?', 'Goodbye! See you later!', 'Good morning! Nice day!', 'Good night! Sleep well!'],
          correctAnswer: 'Hello! How are you?'
        }
      }
    ]
  };

  useEffect(() => {
    loadLessonData();
  }, []);

  const loadLessonData = async () => {
    try {
      // In real app, fetch from API
      // const response = await fetch(`${API_BASE_URL}/api/lessons/${courseId}/${lessonId}`);
      // const data = await response.json();
      
      // For now, use mock data
      setLessonData(mockLessonData);
    } catch (error) {
      console.error('Failed to load lesson data:', error);
      Alert.alert('Error', 'Failed to load lesson. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentStepData = () => {
    if (!lessonData || !lessonData.steps) return null;
    return lessonData.steps.find(step => step.stepNumber === currentStep);
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
  };

  const handleSubmitAnswer = () => {
    const stepData = getCurrentStepData();
    if (!stepData) return;

    let correct = false;
    let userResponse = '';

    switch (stepData.stepType) {
      case 'quick_check':
      case 'comprehension':
        userResponse = selectedAnswer;
        correct = selectedAnswer === stepData.content.correctAnswer;
        break;
      case 'typing':
        userResponse = userAnswer;
        const alternatives = [stepData.content.expectedAnswer, ...stepData.content.alternatives];
        correct = alternatives.includes(userResponse);
        break;
      default:
        correct = true; // Word review doesn't have right/wrong answers
        break;
    }

    setIsCorrect(correct);
    setShowResult(true);
    setStepResults(prev => ({
      ...prev,
      [currentStep]: correct
    }));
  };

  const handleNextStep = () => {
    if (currentStep < lessonData.steps.length) {
      setCurrentStep(currentStep + 1);
      setSelectedAnswer('');
      setUserAnswer('');
      setShowResult(false);
      setIsCorrect(false);
    } else {
      completLesson();
    }
  };

  const completLesson = async () => {
    const correctAnswers = Object.values(stepResults).filter(Boolean).length;
    const totalSteps = lessonData.steps.length;
    const score = Math.round((correctAnswers / totalSteps) * 100);

    try {
      // In real app, submit to API
      // await fetch(`${API_BASE_URL}/api/progress`, { ... });
      
      Alert.alert(
        'Lesson Complete!',
        `Great job! You scored ${score}%`,
        [
          {
            text: 'Continue',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Failed to save progress:', error);
      Alert.alert('Error', 'Failed to save progress. Please try again.');
    }
  };

  const renderWordReviewStep = (stepData) => (
    <View style={styles.stepContainer}>
      <View style={styles.wordCard}>
        <Text style={styles.wordText}>{stepData.content.word}</Text>
        <Text style={styles.translationText}>{stepData.content.translation}</Text>
        
        <TouchableOpacity style={styles.audioButton}>
          <Text style={styles.audioButtonText}>🔊 Listen</Text>
        </TouchableOpacity>
        
        {stepData.content.note && (
          <View style={styles.noteContainer}>
            <Text style={styles.noteLabel}>💡 Note:</Text>
            <Text style={styles.noteText}>{stepData.content.note}</Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity style={styles.continueButton} onPress={handleNextStep}>
        <Text style={styles.continueButtonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );

  const renderMCQStep = (stepData) => (
    <View style={styles.stepContainer}>
      <Text style={styles.questionText}>{stepData.content.question}</Text>
      
      <View style={styles.optionsContainer}>
        {stepData.content.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === stepData.content.correctAnswer;
          
          let optionStyle = styles.optionButton;
          let textStyle = styles.optionText;
          
          if (showResult) {
            if (isCorrect) {
              optionStyle = [styles.optionButton, styles.correctOption];
              textStyle = [styles.optionText, styles.correctOptionText];
            } else if (isSelected && !isCorrect) {
              optionStyle = [styles.optionButton, styles.incorrectOption];
              textStyle = [styles.optionText, styles.incorrectOptionText];
            }
          } else if (isSelected) {
            optionStyle = [styles.optionButton, styles.selectedOption];
            textStyle = [styles.optionText, styles.selectedOptionText];
          }
          
          return (
            <TouchableOpacity
              key={index}
              style={optionStyle}
              onPress={() => handleAnswerSelect(option)}
              disabled={showResult}
            >
              <Text style={textStyle}>{option}</Text>
              {showResult && isCorrect && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      {showResult && (
        <View style={[styles.resultContainer, isCorrect ? styles.correctResult : styles.incorrectResult]}>
          <Text style={styles.resultText}>
            {isCorrect ? '✅ Correct!' : `❌ Incorrect. The answer is: ${stepData.content.correctAnswer}`}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, (!selectedAnswer || showResult) && styles.disabledButton]}
        onPress={showResult ? handleNextStep : handleSubmitAnswer}
        disabled={!selectedAnswer && !showResult}
      >
        <Text style={styles.submitButtonText}>
          {showResult ? 'Continue' : 'Submit'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTypingStep = (stepData) => (
    <View style={styles.stepContainer}>
      <Text style={styles.instructionText}>Complete the word:</Text>
      <Text style={styles.promptText}>{stepData.content.prompt}</Text>
      
      <View style={styles.typingContainer}>
        <Text style={styles.typingLabel}>Your answer:</Text>
        <TextInput
          style={styles.typingInput}
          value={userAnswer}
          onChangeText={setUserAnswer}
          placeholder="Type your answer..."
          autoCapitalize="none"
          autoCorrect={false}
          editable={!showResult}
        />
      </View>

      {showResult && (
        <View style={[styles.resultContainer, isCorrect ? styles.correctResult : styles.incorrectResult]}>
          <Text style={styles.resultText}>
            {isCorrect ? '✅ Correct!' : `❌ Incorrect. The answer is: ${stepData.content.expectedAnswer}`}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, (!userAnswer || showResult) && styles.disabledButton]}
        onPress={showResult ? handleNextStep : handleSubmitAnswer}
        disabled={!userAnswer && !showResult}
      >
        <Text style={styles.submitButtonText}>
          {showResult ? 'Continue' : 'Submit'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderComprehensionStep = (stepData) => (
    <View style={styles.stepContainer}>
      <Text style={styles.instructionText}>Listen and choose the correct translation:</Text>
      
      <View style={styles.audioContainer}>
        <TouchableOpacity style={styles.playButton}>
          <Text style={styles.playButtonText}>▶️ Play Audio</Text>
        </TouchableOpacity>
        <Text style={styles.audioText}>{stepData.content.audioSentence}</Text>
      </View>
      
      <View style={styles.optionsContainer}>
        {stepData.content.options.map((option, index) => {
          const isSelected = selectedAnswer === option;
          const isCorrect = option === stepData.content.correctAnswer;
          
          let optionStyle = styles.optionButton;
          let textStyle = styles.optionText;
          
          if (showResult) {
            if (isCorrect) {
              optionStyle = [styles.optionButton, styles.correctOption];
              textStyle = [styles.optionText, styles.correctOptionText];
            } else if (isSelected && !isCorrect) {
              optionStyle = [styles.optionButton, styles.incorrectOption];
              textStyle = [styles.optionText, styles.incorrectOptionText];
            }
          } else if (isSelected) {
            optionStyle = [styles.optionButton, styles.selectedOption];
            textStyle = [styles.optionText, styles.selectedOptionText];
          }
          
          return (
            <TouchableOpacity
              key={index}
              style={optionStyle}
              onPress={() => handleAnswerSelect(option)}
              disabled={showResult}
            >
              <Text style={textStyle}>{option}</Text>
              {showResult && isCorrect && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          );
        })}
      </View>

      {showResult && (
        <View style={[styles.resultContainer, isCorrect ? styles.correctResult : styles.incorrectResult]}>
          <Text style={styles.resultText}>
            {isCorrect ? '✅ Correct!' : `❌ Incorrect. The answer is: ${stepData.content.correctAnswer}`}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.submitButton, (!selectedAnswer || showResult) && styles.disabledButton]}
        onPress={showResult ? handleNextStep : handleSubmitAnswer}
        disabled={!selectedAnswer && !showResult}
      >
        <Text style={styles.submitButtonText}>
          {showResult ? 'Continue' : 'Submit'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading lesson...</Text>
      </View>
    );
  }

  if (!lessonData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load lesson</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadLessonData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const stepData = getCurrentStepData();
  if (!stepData) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.lessonTitle}>{lessonData.title}</Text>
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Step {currentStep} of {lessonData.steps.length}
          </Text>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${(currentStep / lessonData.steps.length) * 100}%` }
              ]} 
            />
          </View>
        </View>
      </View>

      {/* Step Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>
            {stepData.stepType === 'word_review' && '📖 Learn'}
            {stepData.stepType === 'quick_check' && '❓ Quick Check'}
            {stepData.stepType === 'typing' && '⌨️ Type'}
            {stepData.stepType === 'comprehension' && '🎧 Listen'}
          </Text>
        </View>

        {stepData.stepType === 'word_review' && renderWordReviewStep(stepData)}
        {(stepData.stepType === 'quick_check' || stepData.stepType === 'comprehension') && renderMCQStep(stepData)}
        {stepData.stepType === 'typing' && renderTypingStep(stepData)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '500',
  },
  lessonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stepHeader: {
    paddingVertical: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  stepContainer: {
    paddingBottom: 24,
  },
  wordCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  wordText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 12,
  },
  translationText: {
    fontSize: 24,
    color: '#6b7280',
    marginBottom: 24,
  },
  audioButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  audioButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  noteContainer: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  instructionText: {
    fontSize: 18,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  promptText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  optionsContainer: {
    marginBottom: 24,
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  correctOption: {
    borderColor: '#10b981',
    backgroundColor: '#d1fae5',
  },
  incorrectOption: {
    borderColor: '#ef4444',
    backgroundColor: '#fee2e2',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  selectedOptionText: {
    color: '#1e40af',
    fontWeight: '500',
  },
  correctOptionText: {
    color: '#047857',
    fontWeight: '500',
  },
  incorrectOptionText: {
    color: '#dc2626',
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 20,
    color: '#10b981',
  },
  typingContainer: {
    marginBottom: 24,
  },
  typingLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  typingInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 18,
    textAlign: 'center',
  },
  audioContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  playButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  playButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  audioText: {
    fontSize: 18,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  resultContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  correctResult: {
    backgroundColor: '#d1fae5',
  },
  incorrectResult: {
    backgroundColor: '#fee2e2',
  },
  resultText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
  },
});