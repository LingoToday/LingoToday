import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { Audio } from 'expo-av';
import * as SecureStore from 'expo-secure-store';

import { theme } from '../lib/theme';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Progress } from '../components/ui/Progress';
import { Badge } from '../components/ui/Badge';
import { RadioGroup, RadioGroupItem } from '../components/ui/RadioGroup';
import { Input } from '../components/ui/Input';
import LessonModal from '../components/LessonModal';

const { width: screenWidth } = Dimensions.get('window');

type RootStackParamList = {
  Lesson: {
    language: string;
    courseId: string;
    lessonId: string;
    from?: string;
    id?: string;
  };
};

type LessonScreenRouteProp = RouteProp<RootStackParamList, 'Lesson'>;

// Type definitions - matching web exactly
interface Lesson {
  id: string;
  title: string;
  emoji: string;
  description: string;
  lesson: {
    title: string;
    mode?: string;
    content?: {
      word: string;
      translation: string;
      pronunciation?: string;
      example?: string;
      exampleTranslation?: string;
      audio?: string;
      note?: string;
      videoUrl?: string;
      answerPrompt?: string;
      expectedAnswers?: string[];
    };
    quiz?: {
      question: string;
      options: string[];
      correct: number;
      answer?: string;
    };
    questions?: Array<{
      prompt: string;
      options: string[];
      answer: string;
    }>;
    steps?: Array<{
      stepNumber: number;
      stepType: string;
      content: any;
    }> | {
      word_review?: any;
      typing?: any;
      comprehension?: any;
      pro_video?: any;
      video_choice?: any;
    };
    step1?: any;
    step2?: any;
    step3?: any;
    step4?: any;
  };
  content?: any;
  isIRLLesson?: boolean;
  step4?: {
    options?: Array<{
      expected_answers?: string[];
    }>;
  };
}

interface UserProgress {
  courseId: string;
  lessonId: string;
  completed: boolean;
  completedAt?: string;
}

export default function LessonScreen() {
  const navigation = useNavigation();
  const route = useRoute<LessonScreenRouteProp>();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  
  const { language, courseId, lessonId, from, id } = route.params;
  
  // States - matching web exactly
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [fromNotification, setFromNotification] = useState(false);
  const [stepResults, setStepResults] = useState<{[key: number]: boolean}>({});
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showVideoControls, setShowVideoControls] = useState(true);
  const [notificationLessonId, setNotificationLessonId] = useState<string | null>(null);
  const [fallbackLesson, setFallbackLesson] = useState<Lesson | null>(null);

  // Check if user came from notification
  useEffect(() => {
    if (from === 'notification') {
      setFromNotification(true);
      if (id) {
        console.log('Notification with lesson ID:', id);
        setNotificationLessonId(id);
      }
    }
  }, [from, id]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      console.log("User not authenticated on lesson page, redirecting to login");
      
      Alert.alert(
        "Please log in",
        "Redirecting to login page...",
        [{ text: "OK", onPress: () => navigation.navigate('Login' as never) }]
      );
    }
  }, [user, navigation]);

  // Convert language code to full name for API
  const getFullLanguageName = (lang: string) => {
    const langMap: { [key: string]: string } = {
      'it': 'italian',
      'es': 'spanish', 
      'de': 'german',
      'fr': 'french'
    };
    return langMap[lang] || lang;
  };

  // Fetch lesson data - with proper queryFn
  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useQuery<Lesson>({
    queryKey: ["/api/courses", getFullLanguageName(language || ''), courseId, lessonId],
    queryFn: async () => {
      const response = await apiClient.getLesson(getFullLanguageName(language || ''), courseId!, lessonId!);
      return (response as any).data || response;
    },
    enabled: !!user && !!language && !!courseId && !!lessonId,
    retry: 2,
  });

  // Fetch user progress
  const { data: userProgress = [] } = useQuery<UserProgress[]>({
    queryKey: ['/api/progress', language],
    queryFn: async () => {
      const response = await apiClient.getUserProgress(language!);
      return (response as any).data || response || [];
    },
    enabled: !!user && !!language,
  });

  // Fetch user data for gender detection and tier access
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const response = await apiClient.getCurrentUser();
      return (response as any).data || response;
    },
    enabled: !!user,
  });

  // Fetch subscription status
  const { data: subscriptionStatus } = useQuery({
    queryKey: ['/api/subscription-status'],
    queryFn: async () => {
      const response = await apiClient.getSubscriptionStatus();
      return (response as any).data || response;
    },
    enabled: !!user,
    staleTime: 30000,
  });

  // Check if this is Italian course lesson1 and if intro video should be shown
  useEffect(() => {
    if (language === 'italian' && lessonId === 'lesson1' && 
        (courseId === 'course1' || courseId === 'course2' || courseId === 'course3') && 
        userProgress !== undefined) {
      
      const storageKey = `italian_${courseId}_intro_shown`;
      
      // Check if user has completed any Italian lessons for this specific course
      const hasCompletedCourseProgress = userProgress.some(p => p.courseId === courseId && p.completed);
      
      SecureStore.getItemAsync(storageKey).then(hasSeenIntroVideo => {
        if (!hasCompletedCourseProgress) {
          // For new learners to this course, always show the video
          if (hasSeenIntroVideo) {
            SecureStore.deleteItemAsync(storageKey);
            console.log(`🎬 Clearing storage for new ${courseId} learner - video will show`);
          }
          setShowIntroVideo(true);
          console.log(`🎬 Showing intro video for new Italian ${courseId} learner`);
        } else if (!hasSeenIntroVideo) {
          // For returning learners who somehow don't have the storage flag
          setShowIntroVideo(true);
          console.log(`🎬 Showing intro video for Italian ${courseId}`);
        } else {
          console.log(`🎬 Video already seen by experienced ${courseId} learner, skipping`);
        }
      });
    }
  }, [language, courseId, lessonId, userProgress]);

  const handleContinueFromIntro = () => {
    const storageKey = `italian_${courseId}_intro_shown`;
    SecureStore.setItemAsync(storageKey, 'true');
    setShowIntroVideo(false);
  };

  // Use fallback lesson if API lesson is not available
  const currentLesson = lesson || fallbackLesson;

  // Helper to normalize asset URLs consistently
  const normalizeAssetUrl = (url: string): string => {
    if (!url) return '';
    
    // Already correct format
    if (url.startsWith('/attached_assets/')) return url;
    
    // Missing leading slash
    if (url.startsWith('attached_assets/')) return '/' + url;
    
    // Fix /videos/ paths to use attached_assets
    if (url.startsWith('/videos/')) return '/attached_assets' + url;
    
    // Other absolute paths (leave as-is)
    if (url.startsWith('/')) return url;
    
    // Relative asset filename
    return '/attached_assets/' + url;
  };

  // Gender detection function - matching web exactly
  const detectGender = (firstName: string): 'male' | 'female' | 'neutral' => {
    if (!firstName) return 'neutral';
    
    const name = firstName.toLowerCase().trim();
    
    // Common male names
    const maleNames = ['ahmed', 'john', 'michael', 'david', 'james', 'robert', 'william', 'richard', 'thomas', 'mark', 'daniel', 'matthew', 'anthony', 'donald', 'steven', 'paul', 'andrew', 'joshua', 'kenneth', 'kevin'];
    
    // Common female names
    const femaleNames = ['mary', 'patricia', 'jennifer', 'linda', 'elizabeth', 'barbara', 'susan', 'jessica', 'sarah', 'karen', 'nancy', 'lisa', 'betty', 'helen', 'sandra', 'donna', 'carol', 'ruth', 'sharon', 'michelle'];
    
    if (maleNames.includes(name)) return 'male';
    if (femaleNames.includes(name)) return 'female';
    
    // Name ending patterns (simplified)
    if (name.endsWith('a') || name.endsWith('e')) return 'female';
    if (name.endsWith('o') || name.endsWith('r') || name.endsWith('n')) return 'male';
    
    return 'neutral';
  };

  // Get current step data - matching web logic exactly
  const getCurrentStepData = () => {
    if (!currentLesson?.lesson) return null;
    
    // Handle IRL video lessons
    const firstStep = Array.isArray(currentLesson.lesson?.steps) ? currentLesson.lesson?.steps?.[0] : null;
    if (firstStep?.stepType === 'irl_video' || firstStep?.content?.isIRLLesson) {
      return {
        type: 'irl_video',
        videoUrl: firstStep.content.videoUrl || '',
        prompt: firstStep.content.word || '',
        answerPrompt: firstStep.content.answerPrompt || '',
        expectedAnswers: firstStep.content.expectedAnswers || []
      };
    }
    
    // Handle locally stored IRL lessons
    if (currentLesson.isIRLLesson) {
      return {
        type: 'irl_video',
        videoUrl: currentLesson.content?.videoUrl || '',
        prompt: currentLesson.content?.word || '',
        answerPrompt: currentLesson.content?.answerPrompt || '',
        expectedAnswers: currentLesson.content?.expectedAnswers || []
      };
    }

    // Normalize legacy lesson format (step1, step2, step3, step4) to steps[] array
    if (!currentLesson.lesson?.steps && currentLesson.lesson?.step1) {
      console.log('🔄 Normalizing legacy 4-step format to steps[]');
      const normalizedSteps = [];
      
      for (let i = 1; i <= 4; i++) {
        const stepKey = `step${i}` as keyof typeof currentLesson.lesson;
        const stepData = currentLesson.lesson[stepKey];
        if (stepData) {
          let stepType = 'unknown';
          let content = stepData;
          
          if (stepData.type) {
            if (stepData.type === 'video_choice') {
              stepType = 'video_choice';
            } else if (stepData.type === 'video') {
              stepType = 'pro_video';
              content = {
                video_url: stepData.video_url || '',
                prompt: stepData.prompt || '',
                answer_prompt: stepData.answer_prompt || '',
                expected_answers: stepData.expected_answers || [],
                requiredTier: stepData.requiredTier || ['pro']
              };
            }
          } else {
            if (stepData.italian && stepData.english) {
              stepType = 'word_review';
            } else if (stepData.type_prompt || stepData.expectedAnswer) {
              stepType = 'typing';
            } else if (stepData.audio_sentence || stepData.options) {
              stepType = 'comprehension';
            }
          }
          
          normalizedSteps.push({
            stepNumber: i,
            stepType: stepType,
            content: content
          });
        }
      }
      
      currentLesson.lesson.steps = normalizedSteps;
    }

    // Handle API lessons with steps object (object with named keys)
    if (currentLesson.lesson?.steps && !Array.isArray(currentLesson.lesson.steps)) {
      const stepMapping = {
        1: 'word_review',
        2: 'typing', 
        3: 'comprehension',
        4: 'pro_video'
      };
      const stepName = stepMapping[currentStep as keyof typeof stepMapping];
      
      if (stepName && currentLesson.lesson.steps[stepName as keyof typeof currentLesson.lesson.steps]) {
        const stepData = currentLesson.lesson.steps[stepName as keyof typeof currentLesson.lesson.steps];
        
        if (stepData.stepType === 'pro_video' || stepData.type === 'pro_video') {
          const requiredTier = stepData.content?.requiredTier || stepData.requiredTier || ['pro'];
          const userTier = userData?.priceTier || 'free';
          
          const hasAccess = userTier === 'pro' || userTier === 'pro-monthly' || userTier === 'pro-yearly';
          
          const videoUrl = stepData.content?.video_url || stepData.video_url || '';
          const fallbackVideoUrl = videoUrl.includes('lesson2.mp4') ? '/attached_assets/videos/lesson1_hi_neutral.mp4' : videoUrl;
          
          return {
            type: 'pro_video',
            videoUrl: normalizeAssetUrl(fallbackVideoUrl),
            prompt: stepData.content?.prompt || stepData.prompt || '',
            answerPrompt: stepData.content?.answer_prompt || stepData.answer_prompt || '',
            expectedAnswers: stepData.content?.expected_answers || stepData.expected_answers || [],
            hasAccess,
            requiredTier
          };
        }
      }
    }

    // Handle API lessons with steps array (new structure from database)
    if (currentLesson.lesson?.steps && Array.isArray(currentLesson.lesson.steps)) {
      const currentStepData = currentLesson.lesson.steps.find((step: any) => step.stepNumber === currentStep);
      
      if (currentStepData) {
        // Handle video_choice step type (gender-based videos)
        if (currentStepData.stepType === 'video_choice') {
          const userFirstName = userData?.firstName || '';
          const detectedGender = detectGender(userFirstName);
          
          const options = currentStepData.content.options || [];
          let selectedOption: any = null;
          
          if (detectedGender === 'male') {
            selectedOption = options.find((opt: any) => opt.label?.toLowerCase() === 'male');
          } else if (detectedGender === 'female') {
            selectedOption = options.find((opt: any) => opt.label?.toLowerCase() === 'female');
          }
          
          if (!selectedOption) {
            selectedOption = options.find((opt: any) => opt.label?.toLowerCase() === 'neutral') || options[0];
          }
          
          const videoUrl = normalizeAssetUrl(selectedOption?.video_url || '');
          
          return {
            type: 'video_choice',
            videoUrl: videoUrl,
            prompt: currentStepData.content.prompt || '',
            answerPrompt: selectedOption?.answer_prompt || "Reply: 'Hi!'",
            expectedAnswers: selectedOption?.expected_answers || ["Ciao!", "Ciao"],
            tier: 'free',
            selectedGender: detectedGender
          };
        }
        
        // Handle pro_video step type
        if (currentStepData.stepType === 'pro_video') {
          const requiredTier = currentStepData.content.requiredTier || [];
          const userTier = userData?.priceTier || 'free';
          
          const hasAccess = userTier === 'pro' || userTier === 'pro-monthly' || userTier === 'pro-yearly';
          
          return {
            type: 'pro_video',
            videoUrl: normalizeAssetUrl(currentStepData.content.video_url || ''),
            prompt: currentStepData.content.prompt || '',
            answerPrompt: currentStepData.content.answer_prompt || '',
            expectedAnswers: currentStepData.content.expected_answers || [],
            hasAccess,
            requiredTier
          };
        }
        
        // Handle other API step types
        if (currentStepData.stepType === 'word_review') {
          return {
            type: 'word_review',
            word: currentStepData.content.italian || '',
            translation: currentStepData.content.english || '',
            audio: currentStepData.content.audio || '',
            note: currentStepData.content.note || ''
          };
        }
        
        if (currentStepData.stepType === 'quick_check') {
          return {
            type: 'quick_check',
            question: currentStepData.content.mcq?.question || '',
            options: currentStepData.content.mcq?.options || [],
            answer: currentStepData.content.mcq?.answer || ''
          };
        }
        
        if (currentStepData.stepType === 'typing') {
          return {
            type: 'type',
            prompt: currentStepData.content.type_prompt || '',
            expected: currentStepData.content.expected_answer || '',
            alternatives: currentStepData.content.alt_answers || []
          };
        }
        
        if (currentStepData.stepType === 'comprehension') {
          return {
            type: 'audio',
            audioSentence: currentStepData.content.audio_sentence || '',
            options: currentStepData.content.options || [],
            answer: currentStepData.content.answer || ''
          };
        }
      }
    }
    
    // Handle review lessons (MCQ format)
    if (currentLesson.lesson.mode === 'mcq' && currentLesson.lesson.questions) {
      const questions = currentLesson.lesson.questions;
      if (currentStep <= questions.length) {
        const currentQuestion = questions[currentStep - 1];
        return {
          type: 'review_mcq',
          question: currentQuestion.prompt,
          options: currentQuestion.options || [],
          answer: currentQuestion.answer,
          isReview: true,
          totalQuestions: questions.length,
          currentQuestion: currentStep
        };
      }
      return null;
    }
    
    // Handle new lesson format (with content and quiz properties) - 4 steps
    if (currentLesson.lesson.content && currentLesson.lesson.quiz) {
      if (currentStep === 1) {
        return {
          type: 'word_review',
          word: currentLesson.lesson.content.word || '',
          translation: currentLesson.lesson.content.translation || '',
          audio: currentLesson.lesson.content.audio || '',
          note: currentLesson.lesson.content.note || ''
        };
      } else if (currentStep === 2) {
        return {
          type: 'quick_check',
          question: currentLesson.lesson.quiz.question || '',
          options: currentLesson.lesson.quiz.options || [],
          answer: currentLesson.lesson.quiz.options?.[currentLesson.lesson.quiz.correct] || ''
        };
      } else if (currentStep === 3) {
        const word = currentLesson.lesson.content.word || '';
        const translation = currentLesson.lesson.content.translation || '';
        
        const generateFillInText = (word: string) => {
          if (word.includes(' ')) {
            const parts = word.split(' ');
            return parts[0] + "_".repeat(word.length - parts[0].length);
          }
          if (word.length <= 3) return word.charAt(0) + "_".repeat(word.length - 1);
          return word.substring(0, 2) + "_".repeat(word.length - 2);
        };
        
        const getMissingLetters = (word: string) => {
          if (word.includes(' ')) {
            const firstSpaceIndex = word.indexOf(' ');
            return word.substring(firstSpaceIndex + 1);
          }
          if (word.length <= 3) return word.substring(1);
          return word.substring(2);
        };
        
        const fillInPrompt = generateFillInText(word);
        const missingLetters = getMissingLetters(word);
        
        return {
          type: 'type',
          prompt: `${fillInPrompt} = ${translation}`,
          expected: missingLetters,
          alternatives: [missingLetters.toLowerCase(), missingLetters.toUpperCase()]
        };
      } else if (currentStep === 4) {
        const step3Data = currentLesson.lesson.step3;
        if (step3Data) {
          return {
            type: 'audio',
            audioSentence: step3Data.audio_sentence || '',
            options: step3Data.options || [],
            answer: step3Data.answer || (step3Data.options && step3Data.options[0]) || ''
          };
        }
        
        const word = currentLesson.lesson.content.word || '';
        const translation = currentLesson.lesson.content.translation || '';
        return {
          type: 'audio',
          audioSentence: word,
          options: [translation, 'Hello!', 'Goodbye!', 'Good night!'],
          answer: translation
        };
      }
      return null;
    }
    
    return null;
  };

  const stepData = getCurrentStepData();

  // Complete lesson mutation - matching web exactly
  const completeLessonMutation = useMutation({
    mutationFn: async (score: number) => {
      await apiClient.updateProgress({
        language,
        courseId: courseId || "course1",
        lessonId: lessonId || currentLesson!.id,
        stepNumber: 4,
        completed: true,
        score,
        completedAt: new Date(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress", language] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats", language] });
      
      Alert.alert(
        "Lesson completed!",
        "Great job! Returning to dashboard...",
        [{ text: "OK", onPress: () => navigation.navigate('Dashboard' as never) }]
      );
    },
    onError: (error) => {
      Alert.alert(
        "Error",
        "Failed to save lesson progress. Please try again.",
        [{ text: "OK" }]
      );
    },
  });

  // Helper function to normalize text for comparison
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Handle step submission - matching web logic exactly
  const handleStepSubmit = () => {
    let correct = false;
    
    // Special case for Step 4 Video (lesson1 course1)
    if (currentStep === 4 && lessonId === 'lesson1' && courseId === 'course1' && lesson) {
      const userAnswer = normalizeText(selectedAnswer);
      let expectedAnswers = [];
      
      if (lesson?.lesson?.step4?.options?.[0]?.expected_answers) {
        expectedAnswers = lesson.lesson.step4.options[0].expected_answers;
      } else if (lesson?.step4?.options?.[0]?.expected_answers) {
        expectedAnswers = lesson.step4.options[0].expected_answers;
      } else {
        expectedAnswers = ["Ciao!", "Ciao"];
      }
      
      correct = expectedAnswers.some((expected: string) => {
        const normalizedExpected = normalizeText(expected);
        return userAnswer === normalizedExpected || 
               normalizedExpected.includes(userAnswer) ||
               userAnswer.includes(normalizedExpected.split(' ')[0]);
      });
    }
    else if (!stepData) {
      return;
    }
    else if (stepData.type === 'irl_video') {
      const userAnswer = normalizeText(selectedAnswer);
      const expectedAnswers = stepData.expectedAnswers || [];
      
      correct = expectedAnswers.some((expected: string) => {
        const normalizedExpected = normalizeText(expected);
        return userAnswer === normalizedExpected || 
               normalizedExpected.includes(userAnswer) ||
               userAnswer.includes(normalizedExpected.split(' ')[0]);
      });
    } else if (stepData.type === 'video_choice') {
      const userAnswer = normalizeText(selectedAnswer);
      const expectedAnswers = stepData.expectedAnswers || [];
      
      correct = expectedAnswers.some((expected: string) => {
        const normalizedExpected = normalizeText(expected);
        return userAnswer === normalizedExpected || 
               normalizedExpected.includes(userAnswer) ||
               userAnswer.includes(normalizedExpected.split(' ')[0]);
      });
    } else if (stepData.type === 'pro_video') {
      if (selectedAnswer === 'skip') {
        correct = true;
      } else {
        const userAnswer = normalizeText(selectedAnswer);
        const expectedAnswers = stepData.expectedAnswers || [];
        
        correct = expectedAnswers.some((expected: string) => {
          const normalizedExpected = normalizeText(expected);
          return userAnswer === normalizedExpected || 
                 normalizedExpected.includes(userAnswer) ||
                 userAnswer.includes(normalizedExpected.split(' ')[0]);
        });
      }
    } else if (stepData.type === 'review_mcq') {
      correct = selectedAnswer === stepData.answer;
    } else if (stepData.type === 'word_review') {
      handleNextStep();
      return;
    } else if (stepData.type === 'quick_check') {
      correct = selectedAnswer === stepData.answer;
    } else if (stepData.type === 'type') {
      const userAnswer = normalizeText(selectedAnswer);
      const expected = normalizeText(stepData.expected || '');
      const alternatives = (stepData.alternatives || []).map((alt: string) => normalizeText(alt));
      
      if (stepData.prompt.includes('_')) {
        // Fill-in-the-blank validation logic (same as web)
        const isExactMatch = userAnswer === expected || alternatives.includes(userAnswer);
        const isFuzzyMatch = !isExactMatch && (
          expected.includes(userAnswer) || userAnswer.includes(expected) ||
          alternatives.some((altMissing: string) => 
            altMissing.includes(userAnswer) || userAnswer.includes(altMissing)
          )
        );
        correct = isExactMatch || isFuzzyMatch;
      } else {
        const isExactMatch = userAnswer === expected || alternatives.includes(userAnswer);
        const isFuzzyMatch = !isExactMatch && (
          expected.includes(userAnswer) ||
          alternatives.some((alt: string) => alt.includes(userAnswer))
        );
        correct = isExactMatch || isFuzzyMatch;
      }
    } else if (stepData.type === 'audio') {
      correct = selectedAnswer === stepData.answer;
    }

    setIsCorrect(correct);
    setShowResult(true);
    setStepResults(prev => ({ ...prev, [currentStep]: correct }));
  };

  // Handle next step - matching web logic exactly
  const handleNextStep = () => {
    if (stepData?.type === 'irl_video') {
      const score = isCorrect ? 100 : 50;
      completeLessonMutation.mutate(score);
      return;
    }
    
    if (stepData?.isReview) {
      if (currentStep < stepData.totalQuestions) {
        setCurrentStep(currentStep + 1);
        setSelectedAnswer("");
        setShowResult(false);
        setIsCorrect(false);
      } else {
        const correctAnswers = Object.values(stepResults).filter(Boolean).length;
        const totalQuestions = stepData.totalQuestions;
        const score = Math.round((correctAnswers / totalQuestions) * 100);
        completeLessonMutation.mutate(score);
      }
    } else {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
        setSelectedAnswer("");
        setShowResult(false);
        setIsCorrect(false);
      } else {
        const correctSteps = Object.values(stepResults).filter(Boolean).length;
        const totalSteps = 3;
        const score = Math.round((correctSteps / totalSteps) * 100);
        completeLessonMutation.mutate(score);
      }
    }
  };

  // Text-to-speech function
  const speakText = async (text: string) => {
    try {
      // For now, we'll use a simple alert to indicate TTS would work
      // In a production app, you'd use expo-speech
      console.log('Speaking:', text);
    } catch (error) {
      console.error('TTS error:', error);
    }
  };

  // Loading state
  if (lessonLoading || (!currentLesson && !lessonError)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading lesson...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Lesson not found
  if (!currentLesson) {
    return (
      <SafeAreaView style={styles.container}>
        <Card style={styles.errorCard}>
          <CardContent style={styles.errorContent}>
            <Text style={styles.errorTitle}>Lesson Not Found</Text>
            <Text style={styles.errorText}>
              The requested lesson could not be found.
            </Text>
            <Button title="Back to Dashboard" onPress={() => navigation.navigate('Dashboard' as never)} />
          </CardContent>
        </Card>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Italian Course Intro Video */}
      {showIntroVideo && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.introVideoCard}>
            <CardContent style={styles.introVideoContent}>
              <Text style={styles.introVideoTitle}>
                {courseId === 'course1' ? 'Welcome to Italian Beginners Course!' :
                 courseId === 'course2' ? 'Welcome to Italian Beginners Course 2!' :
                 courseId === 'course3' ? 'Welcome to Italian Beginners Course 3!' : 'Welcome to Italian Beginners Course!'}
              </Text>
              
              <View style={styles.videoContainer}>
                <Video
                  style={styles.video}
                  source={{
                    uri: courseId === 'course1' ? '/attached_assets/Italian_beginner_course1_intro_1757082612339.MP4' :
                         courseId === 'course2' ? '/attached_assets/Italian beginners cours 2 introduction video_1757602127178.MOV' :
                         courseId === 'course3' ? '/attached_assets/Italian beginners cours 3 introduction video_1757602127174.MOV' :
                         '/attached_assets/Italian_beginner_course1_intro_1757082612339.MP4'
                  }}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay={true}
                  isMuted={true}
                />
              </View>
              
              <Button 
                title="Continue to Lesson"
                onPress={handleContinueFromIntro}
                style={styles.continueButton}
              />
            </CardContent>
          </Card>
        </ScrollView>
      )}
      
      {/* Header - Hide when showing intro video */}
      {!showIntroVideo && (
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{currentLesson?.lesson?.title || 'Lesson'}</Text>
            <Text style={styles.headerSubtitle}>
              {courseId?.replace('course', 'Course ')} - {lessonId?.replace('lesson', 'Lesson ').replace('review', 'Review ')}
            </Text>
            {stepData?.isReview ? (
              <Text style={styles.headerProgress}>Question {currentStep} of {stepData.totalQuestions}</Text>
            ) : stepData?.type === 'irl_video' ? null : (
              <Text style={styles.headerProgress}>Step {currentStep} of 4</Text>
            )}
          </View>
        </View>
      )}

      {/* Lesson Content - Hide when showing intro video */}
      {!showIntroVideo && (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Notification Banner */}
          {fromNotification && (
            <View style={styles.notificationBanner}>
              <View style={styles.notificationContent}>
                <Ionicons name="notifications" size={20} color="#2563EB" />
                <View style={styles.notificationText}>
                  <Text style={styles.notificationTitle}>Welcome back!</Text>
                  <Text style={styles.notificationSubtitle}>You clicked on a notification. Let's answer this question!</Text>
                </View>
              </View>
            </View>
          )}

          <Card style={styles.lessonCard}>
            <CardContent style={styles.lessonContent}>
              
              {/* IRL Video Lesson */}
              {stepData && stepData.type === 'irl_video' && (
                <>
                  <View style={styles.stepHeader}>
                    <Text style={styles.stepPrompt}>{stepData.prompt}</Text>
                  </View>

                  <View style={styles.videoContainer}>
                    <Video
                      style={styles.video}
                      source={{ uri: stepData.videoUrl }}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay={false}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>{stepData.answerPrompt}</Text>
                    <TextInput
                      style={styles.textInput}
                      value={selectedAnswer}
                      onChangeText={setSelectedAnswer}
                      placeholder="Type your response here..."
                    />
                  </View>
                </>
              )}

              {/* Video Choice Step */}
              {stepData && stepData.type === 'video_choice' && (
                <>
                  <View style={styles.stepHeader}>
                    <Text style={styles.stepPrompt}>{stepData.prompt}</Text>
                  </View>

                  <View style={styles.videoContainer}>
                    <Video
                      style={styles.video}
                      source={{ uri: stepData.videoUrl }}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay={false}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>{stepData.answerPrompt}</Text>
                    <TextInput
                      style={styles.textInput}
                      value={selectedAnswer}
                      onChangeText={setSelectedAnswer}
                      placeholder="Type your response..."
                    />
                  </View>
                </>
              )}

              {/* Pro Video Step */}
              {stepData && stepData.type === 'pro_video' && (
                <>
                  <View style={styles.stepHeader}>
                    <Text style={styles.stepPrompt}>{stepData.prompt}</Text>
                  </View>

                  {stepData.hasAccess ? (
                    <>
                      <View style={styles.videoContainer}>
                        <Video
                          style={styles.video}
                          source={{ uri: stepData.videoUrl }}
                          useNativeControls
                          resizeMode={ResizeMode.CONTAIN}
                          shouldPlay={false}
                        />
                      </View>

                      <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>{stepData.answerPrompt}</Text>
                        <TextInput
                          style={styles.textInput}
                          value={selectedAnswer}
                          onChangeText={setSelectedAnswer}
                          placeholder="Type your response..."
                        />
                      </View>
                    </>
                  ) : (
                    <View style={styles.upgradeContainer}>
                      <Ionicons name="diamond" size={48} color="#F59E0B" />
                      <Text style={styles.upgradeTitle}>Upgrade to Pro</Text>
                      <Text style={styles.upgradeText}>
                        Access video lessons and advanced features with our Pro subscription.
                      </Text>
                      <Button
                        title="Skip for now"
                        onPress={() => {
                          setSelectedAnswer('skip');
                          handleStepSubmit();
                        }}
                        style={styles.skipButton}
                      />
                    </View>
                  )}
                </>
              )}

              {/* Word Review Step */}
              {stepData && stepData.type === 'word_review' && (
                <>
                  <View style={styles.wordReviewContainer}>
                    <TouchableOpacity 
                      style={styles.speakButton}
                      onPress={() => speakText(stepData.word)}
                    >
                      <Ionicons name="volume-high" size={32} color={theme.colors.primary} />
                    </TouchableOpacity>
                    
                    <Text style={styles.wordText}>{stepData.word}</Text>
                    <Text style={styles.translationText}>{stepData.translation}</Text>
                  </View>
                  
                  {stepData.note && (
                    <View style={styles.noteContainer}>
                      <Text style={styles.noteText}>{stepData.note}</Text>
                    </View>
                  )}
                </>
              )}

              {/* Quick Check Step */}
              {stepData && stepData.type === 'quick_check' && (
                <>
                  <View style={styles.stepHeader}>
                    <Text style={styles.questionText}>{stepData.question}</Text>
                  </View>

                  <View style={styles.optionsContainer}>
                    {stepData.options.map((option: string, index: number) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.optionButton,
                          selectedAnswer === option && styles.selectedOption,
                        ]}
                        onPress={() => !showResult && setSelectedAnswer(option)}
                        disabled={showResult}
                      >
                        <Text style={[
                          styles.optionText,
                          selectedAnswer === option && styles.selectedOptionText,
                        ]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Review MCQ Step */}
              {stepData && stepData.type === 'review_mcq' && (
                <>
                  <View style={styles.stepHeader}>
                    <Text style={styles.questionText}>{stepData.question}</Text>
                  </View>

                  <View style={styles.optionsContainer}>
                    {stepData.options.map((option: string, index: number) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.optionButton,
                          selectedAnswer === option && styles.selectedOption,
                        ]}
                        onPress={() => !showResult && setSelectedAnswer(option)}
                        disabled={showResult}
                      >
                        <Text style={[
                          styles.optionText,
                          selectedAnswer === option && styles.selectedOptionText,
                        ]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Typing Step */}
              {stepData && stepData.type === 'type' && (
                <>
                  <View style={styles.stepHeader}>
                    <Text style={styles.questionText}>Complete the word:</Text>
                    <Text style={styles.promptText}>{stepData.prompt}</Text>
                  </View>

                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.textInput}
                      value={selectedAnswer}
                      onChangeText={setSelectedAnswer}
                      placeholder="Type your answer..."
                    />
                  </View>
                </>
              )}

              {/* Audio Step */}
              {stepData && stepData.type === 'audio' && (
                <>
                  <View style={styles.stepHeader}>
                    <Text style={styles.questionText}>What do you hear?</Text>
                    
                    <TouchableOpacity 
                      style={styles.listenButton}
                      onPress={() => speakText(stepData.audioSentence)}
                    >
                      <Ionicons name="volume-high" size={32} color={theme.colors.primary} />
                      <Text style={styles.listenText}>Tap to listen</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.optionsContainer}>
                    {stepData.options.map((option: string, index: number) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.optionButton,
                          selectedAnswer === option && styles.selectedOption,
                        ]}
                        onPress={() => !showResult && setSelectedAnswer(option)}
                        disabled={showResult}
                      >
                        <Text style={[
                          styles.optionText,
                          selectedAnswer === option && styles.selectedOptionText,
                        ]}>
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}
              
              {/* Quiz Section */}
              {stepData && (
                <View style={styles.quizSection}>
                  {showResult && (
                    <View style={styles.resultContainer}>
                      <View style={[
                        styles.resultBadge,
                        isCorrect ? styles.correctBadge : styles.incorrectBadge
                      ]}>
                        <Ionicons 
                          name={isCorrect ? "checkmark" : "close"} 
                          size={20} 
                          color="white" 
                        />
                        <Text style={styles.resultText}>
                          {isCorrect ? 'Correct!' : 'Try again!'}
                        </Text>
                      </View>
                      
                      {!isCorrect && stepData.type !== 'word_review' && (
                        <Text style={styles.correctAnswerText}>
                          {stepData.type === 'quick_check' || stepData.type === 'review_mcq' || stepData.type === 'audio' 
                            ? `Correct answer: ${stepData.answer}`
                            : stepData.type === 'type' 
                            ? `Correct answer: ${stepData.expected}`
                            : ''}
                        </Text>
                      )}
                    </View>
                  )}
                  
                  {!showResult ? (
                    <Button
                      title={stepData.type === 'word_review' ? "Continue" : "Check Answer"}
                      onPress={stepData.type === 'word_review' ? handleNextStep : handleStepSubmit}
                      disabled={stepData.type !== 'word_review' && !selectedAnswer.trim()}
                      style={styles.submitButton}
                    />
                  ) : (
                    <Button
                      title={currentStep < 4 || stepData.isReview ? "Next" : "Complete Lesson"}
                      onPress={handleNextStep}
                      style={styles.nextButton}
                    />
                  )}
                </View>
              )}
            </CardContent>
          </Card>
        </ScrollView>
      )}
    </SafeAreaView>
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
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerContent: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600' as any,
    color: theme.colors.foreground,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  headerProgress: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },

  // Content
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },

  // Intro Video
  introVideoCard: {
    marginBottom: theme.spacing.lg,
  },
  introVideoContent: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  introVideoTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700' as any,
    color: theme.colors.foreground,
    textAlign: 'center',
  },

  // Notification Banner
  notificationBanner: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  notificationText: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: '500' as any,
    color: '#1E40AF',
  },
  notificationSubtitle: {
    fontSize: theme.fontSize.sm,
    color: '#2563EB',
  },

  // Lesson Card
  lessonCard: {
    flex: 1,
  },
  lessonContent: {
    gap: theme.spacing.lg,
  },

  // Step Header
  stepHeader: {
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.muted + '50',
    borderRadius: theme.borderRadius.lg,
  },
  stepPrompt: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600' as any,
    color: theme.colors.foreground,
    textAlign: 'center',
  },

  // Video Container
  videoContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  video: {
    width: screenWidth - (theme.spacing.md * 4),
    height: ((screenWidth - (theme.spacing.md * 4)) * 9) / 16, // 16:9 aspect ratio
    borderRadius: theme.borderRadius.lg,
  },

  // Word Review
  wordReviewContainer: {
    alignItems: 'center',
    gap: theme.spacing.lg,
    padding: theme.spacing.xl,
  },
  speakButton: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primary + '20',
  },
  wordText: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: '700' as any,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  translationText: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  noteContainer: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  noteText: {
    fontSize: theme.fontSize.sm,
    color: '#1E40AF',
    lineHeight: theme.fontSize.sm * 1.4,
  },

  // Questions and Options
  questionText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600' as any,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  promptText: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.primary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  optionsContainer: {
    gap: theme.spacing.md,
  },
  optionButton: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  optionText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  selectedOptionText: {
    color: theme.colors.primary,
    fontWeight: '600' as any,
  },

  // Input
  inputContainer: {
    gap: theme.spacing.sm,
  },
  inputLabel: {
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    fontSize: theme.fontSize.base,
    backgroundColor: theme.colors.background,
    textAlign: 'center',
  },

  // Listen Button
  listenButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.primary + '10',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary + '30',
    borderStyle: 'dashed',
    gap: theme.spacing.md,
    marginVertical: theme.spacing.lg,
  },
  listenText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.primary,
    fontWeight: '500' as any,
  },

  // Upgrade Container
  upgradeContainer: {
    alignItems: 'center',
    gap: theme.spacing.lg,
    padding: theme.spacing.xl,
    backgroundColor: '#FFF7ED',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  upgradeTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700' as any,
    color: '#9A3412',
  },
  upgradeText: {
    fontSize: theme.fontSize.base,
    color: '#9A3412',
    textAlign: 'center',
    lineHeight: theme.fontSize.base * 1.4,
  },
  skipButton: {
    backgroundColor: theme.colors.mutedForeground,
  },

  // Quiz Section
  quizSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },

  // Result
  resultContainer: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  correctBadge: {
    backgroundColor: theme.colors.success500,
  },
  incorrectBadge: {
    backgroundColor: theme.colors.destructive,
  },
  resultText: {
    color: 'white',
    fontSize: theme.fontSize.base,
    fontWeight: '600' as any,
  },
  correctAnswerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },

  // Buttons
  submitButton: {
    marginTop: theme.spacing.md,
  },
  nextButton: {
    backgroundColor: theme.colors.success500,
    marginTop: theme.spacing.md,
  },
  continueButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },

  // Error
  errorCard: {
    margin: theme.spacing.md,
  },
  errorContent: {
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  errorTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '600' as any,
    color: theme.colors.foreground,
  },
  errorText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
});