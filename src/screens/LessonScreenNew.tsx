import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Animated,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech'; // FIXED: Added proper speech import
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

import { theme } from '../lib/theme';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Progress } from '../components/ui/Progress';
import { Badge } from '../components/ui/Badge';
import { RadioGroup, RadioGroupItem } from '../components/ui/RadioGroup';
import { Input } from '../components/ui/Input';
import { purchaseService } from '../services/purchaseService';
import { RootStackParamList } from '../navigation/AppNavigator';
import { PRO_PRICING } from '../constants/pricing';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768;

type LessonScreenRouteProp = RouteProp<RootStackParamList, 'Lesson'>;
type LessonScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Lesson'>;

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
  const navigation = useNavigation<LessonScreenNavigationProp>();
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
  
  // Cache for Type Practice options to prevent reshuffling - use ref for synchronous updates
  const typeOptionsCache = useRef<{[key: string]: string[]}>({});
  
  // Purchase flow states
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  
  // Auth token for authenticated video requests
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Animation for correct answer
  const correctAnswerScale = useRef(new Animated.Value(1)).current;
  const correctAnswerBorder = useRef(new Animated.Value(0)).current;

  // Trigger animation when answer is correct
  useEffect(() => {
    if (showResult && isCorrect) {
      // Reset animation values
      correctAnswerScale.setValue(1);
      correctAnswerBorder.setValue(0);
      
      // Create sequence: scale up slightly, then back, with border pulse
      Animated.parallel([
        Animated.sequence([
          Animated.spring(correctAnswerScale, {
            toValue: 1.05,
            friction: 3,
            tension: 40,
            useNativeDriver: false,
          }),
          Animated.spring(correctAnswerScale, {
            toValue: 1,
            friction: 5,
            tension: 40,
            useNativeDriver: false,
          }),
        ]),
        Animated.sequence([
          Animated.timing(correctAnswerBorder, {
            toValue: 1,
            duration: 400,
            useNativeDriver: false,
          }),
          Animated.timing(correctAnswerBorder, {
            toValue: 0.7,
            duration: 200,
            useNativeDriver: false,
          }),
        ]),
      ]).start();
    }
  }, [showResult, isCorrect]);

  // Clear type options cache when lesson changes
  useEffect(() => {
    typeOptionsCache.current = {};
  }, [lessonId]);

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

  // Fetch auth token for authenticated video requests
  useEffect(() => {
    const getAuthToken = async () => {
      try {
        let token: string | null = null;
        
        if (Platform.OS === 'web') {
          token = localStorage.getItem('authToken');
        } else {
          token = await SecureStore.getItemAsync('authToken');
        }
        
        if (token) {
          setAuthToken(token);
          console.log('✅ Auth token loaded for video streaming');
        }
      } catch (error) {
        console.error('⚠️ Error fetching auth token:', error);
      }
    };
    
    if (user) {
      getAuthToken();
    }
  }, [user]);

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
    
    // Get API base URL from config in order of priority (Expo SDK 54):
    // 1. Expo Go / development: Constants.expoConfig.extra.apiBaseUrl
    // 2. Build-time environment variable (fallback): process.env.EXPO_PUBLIC_API_BASE_URL
    const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 
                       (process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined) ||
                       '';
    
    // Fail fast with clear error if API base URL is missing
    if (!apiBaseUrl) {
      console.error('⚠️ CRITICAL: API base URL is missing! Videos and assets will not load.');
      console.error('Please define apiBaseUrl in app.json under expo.extra');
      console.error('Current Constants.expoConfig:', Constants.expoConfig);
      // Return the URL as-is and let it fail visibly
      return url;
    }
    
    console.log('✅ Using API base URL:', apiBaseUrl);
    
    // Already a full HTTP/HTTPS URL - return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // Handle object storage URLs - route through video streaming endpoint
    if (url.startsWith('/replit-objstore-') || url.startsWith('replit-objstore-')) {
      const normalizedPath = url.startsWith('/') ? url : '/' + url;
      const fullUrl = apiBaseUrl + '/api/videos' + normalizedPath;
      console.log('🎥 Routing object storage video through streaming endpoint:', fullUrl);
      return fullUrl;
    }
    
    // Path starting with /attached_assets - prepend API base URL for backend-hosted files
    if (url.startsWith('/attached_assets/')) {
      const fullUrl = apiBaseUrl + url;
      console.log('🔗 Constructing full video URL:', fullUrl);
      return fullUrl;
    }
    
    // Missing leading slash - add it and prepend API base URL
    if (url.startsWith('attached_assets/')) {
      const fullUrl = apiBaseUrl + '/' + url;
      console.log('🔗 Constructing full video URL:', fullUrl);
      return fullUrl;
    }
    
    // Fix /videos/ paths to use attached_assets
    if (url.startsWith('/videos/')) {
      const fullUrl = apiBaseUrl + '/attached_assets' + url;
      console.log('🔗 Constructing full video URL:', fullUrl);
      return fullUrl;
    }
    
    // Other absolute paths - prepend API base URL
    if (url.startsWith('/')) {
      return apiBaseUrl + url;
    }
    
    // Relative asset filename - prepend API base URL and path
    return apiBaseUrl + '/attached_assets/' + url;
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

  // Dynamically calculate total steps from lesson data
  const getTotalSteps = (): number => {
    if (!currentLesson?.lesson) return 4; // Default fallback
    
    // IRL video lessons are single-step
    const firstStep = Array.isArray(currentLesson.lesson?.steps) ? currentLesson.lesson?.steps?.[0] : null;
    if (firstStep?.stepType === 'irl_video' || firstStep?.content?.isIRLLesson || currentLesson.isIRLLesson) {
      return 1;
    }
    
    // Handle steps array format (new database structure)
    if (currentLesson.lesson?.steps && Array.isArray(currentLesson.lesson.steps)) {
      return currentLesson.lesson.steps.length;
    }
    
    // Handle steps object format (named keys like word_review, typing, etc.)
    if (currentLesson.lesson?.steps && !Array.isArray(currentLesson.lesson.steps)) {
      const stepKeys = Object.keys(currentLesson.lesson.steps);
      return stepKeys.length;
    }
    
    // Handle legacy format (step1, step2, step3, step4, step5, etc.)
    if (currentLesson.lesson) {
      let count = 0;
      for (let i = 1; i <= 10; i++) { // Check up to 10 steps
        const stepKey = `step${i}` as keyof typeof currentLesson.lesson;
        if (currentLesson.lesson[stepKey]) {
          count++;
        } else {
          break; // Stop counting when we hit a missing step
        }
      }
      if (count > 0) return count;
    }
    
    // Default to 4 for backward compatibility
    return 4;
  };

  // Helper function to extract step 2's quiz data (quick_check) for all lesson formats
  const getQuickCheckData = (): { options: string[], answer: string } | null => {
    if (!currentLesson?.lesson) return null;
    
    try {
      // Handle steps array format - find step with stepType === 'quick_check'
      if (currentLesson.lesson?.steps && Array.isArray(currentLesson.lesson.steps)) {
        const quickCheckStep = currentLesson.lesson.steps.find((step: any) => step.stepType === 'quick_check');
        if (quickCheckStep) {
          const options = (quickCheckStep as any).options || quickCheckStep.content?.options || quickCheckStep.content?.mcq?.options || [];
          let answer = (quickCheckStep as any).answer || quickCheckStep.content?.answer || quickCheckStep.content?.mcq?.answer;
          
          // If answer is a number (index), map it to the corresponding option string
          if (typeof answer === 'number' && options[answer]) {
            answer = options[answer];
          }
          
          if (options.length > 0 && answer) {
            return { options, answer: String(answer) };
          }
        }
      }
      
      // Handle steps object format - find the entry with stepType === 'quick_check'
      if (currentLesson.lesson?.steps && !Array.isArray(currentLesson.lesson.steps)) {
        const stepKeys = Object.keys(currentLesson.lesson.steps);
        
        for (const stepKey of stepKeys) {
          const stepData = currentLesson.lesson.steps[stepKey as keyof typeof currentLesson.lesson.steps];
          if (stepData && (stepData as any).stepType === 'quick_check') {
            const options = (stepData as any).options || (stepData as any).content?.options || (stepData as any).content?.mcq?.options || [];
            let answer = (stepData as any).answer || (stepData as any).content?.answer || (stepData as any).content?.mcq?.answer;
            
            // If answer is a number (index), map it to the corresponding option string
            if (typeof answer === 'number' && options[answer]) {
              answer = options[answer];
            }
            
            if (options.length > 0 && answer) {
              return { options, answer: String(answer) };
            }
          }
        }
      }
      
      // Handle legacy format - check lesson.quiz (which corresponds to step 2)
      if (currentLesson.lesson.quiz) {
        const options = currentLesson.lesson.quiz.options || [];
        const correctIndex = currentLesson.lesson.quiz.correct;
        const answer = options[correctIndex] || '';
        if (options.length > 0 && answer) {
          return { options, answer };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting quick check data:', error);
      return null;
    }
  };

  // Helper function to extract missing letters from a prompt with underscores
  const extractMissingLetters = (prompt: string, fullWord: string): string => {
    if (!prompt || !fullWord) {
      console.warn('extractMissingLetters: missing prompt or fullWord', { prompt, fullWord });
      return '';
    }
    
    // Extract the word part before the "=" (e.g., "Buon__orno" from "Buon__orno = Good morning")
    const wordWithGap = prompt.split('=')[0]?.trim() || '';
    
    // Find all underscore patterns - if there are multiple gaps, trigger fallback
    const allUnderscores = wordWithGap.match(/_+/g);
    if (!allUnderscores || allUnderscores.length === 0) {
      // No underscores found, log warning and return empty string
      console.warn('extractMissingLetters: no underscores found in prompt', { prompt, wordWithGap });
      return '';
    }
    
    if (allUnderscores.length > 1) {
      // Multiple gaps detected - too complex for extraction, trigger fallback
      console.warn('extractMissingLetters: multiple gaps detected, triggering fallback', { prompt, wordWithGap, gaps: allUnderscores.length });
      return '';
    }
    
    const underscoreMatch = allUnderscores[0];
    const underscoreIndex = wordWithGap.indexOf(underscoreMatch);
    const underscoreLength = underscoreMatch.length;
    
    // Validate that the fullWord is long enough
    if (fullWord.length < underscoreIndex + underscoreLength) {
      console.warn('extractMissingLetters: fullWord too short, triggering fallback', { fullWord, underscoreIndex, underscoreLength });
      return '';
    }
    
    // Extract the missing letters from the full word at the underscore position
    const missingLetters = fullWord.substring(underscoreIndex, underscoreIndex + underscoreLength);
    
    // Validate extraction looks reasonable (not empty, only letters)
    if (!missingLetters || missingLetters.length === 0) {
      console.warn('extractMissingLetters: extraction produced empty result, triggering fallback', { prompt, fullWord });
      return '';
    }
    
    console.log('extractMissingLetters:', { prompt, fullWord, wordWithGap, underscoreIndex, underscoreLength, missingLetters });
    
    return missingLetters;
  };

  // Helper function to generate multiple choice options for Type Practice steps
  const generateTypeOptions = (correctAnswer: string, wordContext: string, cacheKey: string): string[] => {
    // Check cache first - return a copy to avoid mutation
    if (typeOptionsCache.current[cacheKey]) {
      return [...typeOptionsCache.current[cacheKey]];
    }
    
    const incorrect: string[] = [];
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    const consonants = ['b', 'c', 'd', 'f', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'q', 'r', 's', 't', 'v', 'w', 'x', 'y', 'z'];
    
    // Strategy 1: Swap vowels
    if (correctAnswer.length > 0) {
      let swappedVowel = correctAnswer;
      for (let i = 0; i < correctAnswer.length; i++) {
        if (vowels.includes(correctAnswer[i].toLowerCase())) {
          const randomVowel = vowels[Math.floor(Math.random() * vowels.length)];
          swappedVowel = correctAnswer.substring(0, i) + randomVowel + correctAnswer.substring(i + 1);
          break;
        }
      }
      if (swappedVowel !== correctAnswer) {
        incorrect.push(swappedVowel);
      }
    }
    
    // Strategy 2: Replace consonant
    if (correctAnswer.length > 0 && incorrect.length < 2) {
      let swappedConsonant = correctAnswer;
      for (let i = 0; i < correctAnswer.length; i++) {
        if (consonants.includes(correctAnswer[i].toLowerCase())) {
          const randomConsonant = consonants[Math.floor(Math.random() * consonants.length)];
          swappedConsonant = correctAnswer.substring(0, i) + randomConsonant + correctAnswer.substring(i + 1);
          break;
        }
      }
      if (swappedConsonant !== correctAnswer && !incorrect.includes(swappedConsonant)) {
        incorrect.push(swappedConsonant);
      }
    }
    
    // Strategy 3: Reverse characters
    if (incorrect.length < 2 && correctAnswer.length > 1) {
      const reversed = correctAnswer.split('').reverse().join('');
      if (reversed !== correctAnswer && !incorrect.includes(reversed)) {
        incorrect.push(reversed);
      }
    }
    
    // Fallback: Add random letter combinations if we don't have 2 options yet
    while (incorrect.length < 2) {
      const randomOption = Array.from({ length: correctAnswer.length }, () => 
        Math.random() > 0.5 
          ? vowels[Math.floor(Math.random() * vowels.length)]
          : consonants[Math.floor(Math.random() * consonants.length)]
      ).join('');
      
      if (randomOption !== correctAnswer && !incorrect.includes(randomOption)) {
        incorrect.push(randomOption);
      }
    }
    
    // Shuffle all options
    const allOptions = [correctAnswer, ...incorrect.slice(0, 2)].sort(() => Math.random() - 0.5);
    
    // Cache the result synchronously
    typeOptionsCache.current[cacheKey] = allOptions;
    
    return allOptions;
  };

  // Get current step data - matching web logic exactly
  const getCurrentStepData = () => {
    try {
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

      // Normalize legacy lesson format (step1, step2, step3, step4, step5, etc.) to steps[] array
      if (!currentLesson.lesson?.steps && currentLesson.lesson?.step1) {
        console.log('🔄 Normalizing legacy step format to steps[]');
        const normalizedSteps = [];
        
        // Check up to 10 steps dynamically
        for (let i = 1; i <= 10; i++) {
          const stepKey = `step${i}` as keyof typeof currentLesson.lesson;
          const stepData = currentLesson.lesson[stepKey];
          if (stepData) {
            let stepType = 'unknown';
            let content = stepData;
            
            if (stepData.type) {
              if (stepData.type === 'video_choice') {
                // Preserve video_choice type and pass all options to the renderer
                stepType = 'video_choice';
                content = {
                  prompt: stepData.prompt || '',
                  options: stepData.options || [],
                  requiredTier: stepData.requiredTier || []
                };
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
          } else {
            break; // Stop when we hit a missing step
          }
        }
        
        console.log(`🔄 Normalized ${normalizedSteps.length} steps`);
        currentLesson.lesson.steps = normalizedSteps;
      }

      // Handle API lessons with steps object (object with named keys)
      if (currentLesson.lesson?.steps && !Array.isArray(currentLesson.lesson.steps)) {
        console.log('📋 Steps object detected:', {
          stepKeys: Object.keys(currentLesson.lesson.steps),
          currentStep,
          totalSteps: getTotalSteps()
        });
        
        // Get all step keys and match them to step numbers dynamically
        const stepKeys = Object.keys(currentLesson.lesson.steps);
        const stepKey = stepKeys[currentStep - 1]; // Array is 0-indexed, steps are 1-indexed
        
        console.log(`🔍 Looking for step ${currentStep}, found key: ${stepKey}`);
        
        if (stepKey && currentLesson.lesson.steps[stepKey as keyof typeof currentLesson.lesson.steps]) {
          const stepData = currentLesson.lesson.steps[stepKey as keyof typeof currentLesson.lesson.steps];
          
          console.log('📦 Step data:', { stepKey, stepData });
          
          if (stepData.stepType === 'video_choice' || stepData.type === 'video_choice') {
            const options = stepData.content?.options || stepData.options || [];
            
            // Check if step-level video is from object storage (always prefer object storage)
            const stepLevelVideoUrl = stepData.video_url || stepData.content?.video?.url || stepData.content?.video_url || '';
            const isObjectStorage = stepLevelVideoUrl.startsWith('/replit-objstore-') || stepLevelVideoUrl.startsWith('replit-objstore-');
            
            // If step has object storage video, use it (special case like lesson 1)
            if (isObjectStorage && stepLevelVideoUrl) {
              console.log('🎯 [OBJECT video_choice] Object storage video detected at step level, using it:', stepLevelVideoUrl);
              
              // Still normalize options for potential future use
              const normalizedOptions = options.map((opt: any) => {
                const videoUrl = opt.video?.url || opt.videoUrl || opt.video_url || '';
                return {
                  ...opt,
                  video_url: normalizeAssetUrl(videoUrl)
                };
              });
              
              // Get answer data from first option for backward compatibility
              const firstOption = normalizedOptions[0] || {};
              
              return {
                type: 'video_choice',
                videoUrl: normalizeAssetUrl(stepLevelVideoUrl),
                prompt: stepData.content?.prompt || stepData.prompt || '',
                answerPrompt: firstOption?.answer_prompt || "Reply: 'Hi!'",
                expectedAnswers: firstOption?.expected_answers || ["Ciao!", "Ciao"],
                options: normalizedOptions
              };
            }
            
            // Normal case: use option-level videos
            const normalizedOptions = options.map((opt: any) => {
              const videoUrl = opt.video?.url || opt.videoUrl || opt.video_url || '';
              console.log('🎥 [OBJECT video_choice] Extracting option video URL:', { label: opt.label, videoUrl });
              return {
                ...opt,
                video_url: normalizeAssetUrl(videoUrl)
              };
            });
            
            // Select default video based on user gender preference or fallback to female
            let selectedOption = normalizedOptions.find((opt: any) => opt.label?.toLowerCase() === 'female');
            
            // Fallback to neutral or first option if female not found
            if (!selectedOption) {
              selectedOption = normalizedOptions.find((opt: any) => opt.label?.toLowerCase() === 'neutral') || normalizedOptions[0];
            }
            
            // Determine final video URL: use option video if available, otherwise fallback to step-level video
            let finalVideoUrl = selectedOption?.video_url || '';
            
            // If selected option has no video URL, fallback to step-level video
            if (!finalVideoUrl || finalVideoUrl === normalizeAssetUrl('')) {
              if (stepLevelVideoUrl) {
                finalVideoUrl = normalizeAssetUrl(stepLevelVideoUrl);
                console.log('✅ [OBJECT video_choice] Using step-level video URL (fallback):', stepLevelVideoUrl);
              }
            } else {
              console.log('✅ [OBJECT video_choice] Using option-level video URL (normal case):', selectedOption?.video_url);
            }
            
            return {
              type: 'video_choice',
              videoUrl: finalVideoUrl,
              prompt: stepData.content?.prompt || stepData.prompt || '',
              answerPrompt: selectedOption?.answer_prompt || "Reply: 'Hi!'",
              expectedAnswers: selectedOption?.expected_answers || ["Ciao!", "Ciao"],
              options: normalizedOptions
            };
          }
          
          if (stepData.stepType === 'pro_video' || stepData.type === 'pro_video') {
            const requiredTier = stepData.content?.requiredTier || stepData.requiredTier || ['pro'];
            const userTier = userData?.priceTier || 'free';
            
            // If requiredTier is empty array, content is free - grant access to everyone
            const hasAccess = requiredTier.length === 0 || userTier === 'pro' || userTier === 'pro-monthly' || userTier === 'pro-yearly';
            
            // Extract video URL from new API structure (content.video.url) or legacy formats
            const videoUrl = stepData.content?.video?.url || stepData.content?.video_url || stepData.video_url || stepData.content?.videoUrl || '';
            console.log('🎥 [OBJECT pro_video] Extracted video URL:', videoUrl);
            const fallbackVideoUrl = videoUrl.includes('lesson2.mp4') ? '/attached_assets/videos/lesson1_hi_neutral.mp4' : videoUrl;
            
            const quizData = getQuickCheckData();
            
            return {
              type: 'pro_video',
              videoUrl: normalizeAssetUrl(fallbackVideoUrl),
              prompt: stepData.content?.prompt || stepData.prompt || '',
              answerPrompt: stepData.content?.answer_prompt || stepData.answer_prompt || '',
              expectedAnswers: stepData.content?.expected_answers || stepData.expected_answers || [],
              options: quizData?.options,
              answer: quizData?.answer,
              hasAccess,
              requiredTier
            };
          }
          
          // Handle other step types that might come from the steps object
          if (stepData.stepType === 'word_review') {
            console.log('🔍 Word Review Step Data:', stepData);
            return {
              type: 'word_review',
              word: stepData.word || stepData.italian || stepData.content?.word || stepData.content?.italian || '',
              translation: stepData.translation || stepData.english || stepData.content?.translation || stepData.content?.english || '',
              audio: stepData.audio || stepData.content?.audio || '',
              note: stepData.note || stepData.content?.note || ''
            };
          }
          
          if (stepData.stepType === 'quick_check') {
            return {
              type: 'quick_check',
              question: stepData.question || stepData.content?.question || stepData.content?.mcq?.question || '',
              options: stepData.options || stepData.content?.options || stepData.content?.mcq?.options || [],
              answer: stepData.answer || stepData.content?.answer || stepData.content?.mcq?.answer || ''
            };
          }
          
          if (stepData.stepType === 'typing') {
            console.log('✏️ [OBJECT] Typing Step Data:', stepData);
            const fullWord = stepData.expected || stepData.expectedAnswer || stepData.content?.expected || stepData.content?.expected_answer || '';
            const prompt = stepData.prompt || stepData.type_prompt || stepData.content?.prompt || stepData.content?.type_prompt || '';
            
            // Try to extract just the missing letters from the prompt (e.g., "gi" from "Buon__orno")
            let missingLetters = extractMissingLetters(prompt, fullWord);
            
            // FALLBACK: If extraction fails, use full word to ensure lesson remains solvable
            if (!missingLetters && fullWord) {
              console.warn('✏️ [OBJECT] Extraction failed, falling back to full word:', { prompt, fullWord });
              missingLetters = fullWord;
            }
            
            console.log('✏️ Extracted missing letters:', { prompt, fullWord, missingLetters });
            
            // Generate options if not provided by database or if empty array
            let options = stepData.options || stepData.content?.options || null;
            if ((!options || options.length === 0) && missingLetters) {
              // Extract word context from prompt for better option generation
              const wordContext = prompt.split('=')[0]?.trim() || '';
              const cacheKey = `${lessonId}-${currentStep}-${missingLetters}`;
              options = generateTypeOptions(missingLetters, wordContext, cacheKey);
              console.log('✏️ [OBJECT] Generated options for typing step:', { missingLetters, options, fromCache: typeOptionsCache.current[cacheKey] !== undefined });
            }
            
            return {
              type: 'type',
              prompt,
              expected: missingLetters,
              fullWord: fullWord,
              options: options,
              alternatives: stepData.alternatives || stepData.alt_answers || stepData.content?.alternatives || stepData.content?.alt_answers || []
            };
          }
          
          if (stepData.stepType === 'comprehension') {
            return {
              type: 'audio',
              audioSentence: stepData.audioSentence || stepData.audio_sentence || stepData.content?.audioSentence || stepData.content?.audio_sentence || '',
              options: stepData.options || stepData.content?.options || [],
              answer: stepData.answer || stepData.content?.answer || ''
            };
          }
          
          if (stepData.stepType === 'text_tip') {
            console.log('💡 [OBJECT] Text Tip Step Data:', stepData);
            
            // Database uses 'prompt' field - parse it to get title and text
            const promptText = stepData.prompt || stepData.content?.prompt || stepData.text || stepData.content?.text || '';
            const titleText = stepData.title || stepData.content?.title || '';
            
            // If prompt contains ":", split it into title and text
            let finalTitle = titleText;
            let finalText = promptText;
            
            if (promptText && !titleText && promptText.includes(':')) {
              const colonIndex = promptText.indexOf(':');
              finalTitle = promptText.substring(0, colonIndex).trim();
              finalText = promptText.substring(colonIndex + 1).trim();
            } else if (promptText && !titleText) {
              // No colon, use a default title
              finalTitle = 'Tip';
              finalText = promptText;
            }
            
            return {
              type: 'text_tip',
              title: finalTitle,
              text: finalText,
              icon: stepData.icon || stepData.content?.icon || '💡'
            };
          }
        }
      }

      // Handle API lessons with steps array (new structure from database)
      if (currentLesson.lesson?.steps && Array.isArray(currentLesson.lesson.steps)) {
        const currentStepData: any = currentLesson.lesson.steps.find((step: any) => step.stepNumber === currentStep);
        
        if (currentStepData) {
          // Handle video_choice step type - preserve all options for the renderer
          if (currentStepData.stepType === 'video_choice') {
            const options = currentStepData.content.options || [];
            
            // Check if step-level video is from object storage (always prefer object storage)
            const stepLevelVideoUrl = currentStepData.video_url || currentStepData.content?.video?.url || currentStepData.content?.video_url || '';
            const isObjectStorage = stepLevelVideoUrl.startsWith('/replit-objstore-') || stepLevelVideoUrl.startsWith('replit-objstore-');
            
            // If step has object storage video, use it (special case like lesson 1)
            if (isObjectStorage && stepLevelVideoUrl) {
              console.log('🎯 [ARRAY video_choice] Object storage video detected at step level, using it:', stepLevelVideoUrl);
              
              // Still normalize options for potential future use
              const normalizedOptions = options.map((opt: any) => {
                const videoUrl = opt.video?.url || opt.videoUrl || opt.video_url || '';
                return {
                  ...opt,
                  video_url: normalizeAssetUrl(videoUrl)
                };
              });
              
              // Get answer data from first option for backward compatibility
              const firstOption = normalizedOptions[0] || {};
              
              return {
                type: 'video_choice',
                videoUrl: normalizeAssetUrl(stepLevelVideoUrl),
                prompt: currentStepData.content.prompt || '',
                answerPrompt: firstOption?.answer_prompt || "Reply: 'Hi!'",
                expectedAnswers: firstOption?.expected_answers || ["Ciao!", "Ciao"],
                options: normalizedOptions
              };
            }
            
            // Normal case: use option-level videos
            const normalizedOptions = options.map((opt: any) => {
              const videoUrl = opt.video?.url || opt.videoUrl || opt.video_url || '';
              console.log('🎥 [ARRAY video_choice] Extracting option video URL:', { label: opt.label, videoUrl });
              return {
                ...opt,
                video_url: normalizeAssetUrl(videoUrl)
              };
            });
            
            // Select default video based on user gender preference or fallback to female
            let selectedOption = normalizedOptions.find((opt: any) => opt.label?.toLowerCase() === 'female');
            
            // Fallback to neutral or first option if female not found
            if (!selectedOption) {
              selectedOption = normalizedOptions.find((opt: any) => opt.label?.toLowerCase() === 'neutral') || normalizedOptions[0];
            }
            
            // Determine final video URL: use option video if available, otherwise fallback to step-level video
            let finalVideoUrl = selectedOption?.video_url || '';
            
            // If selected option has no video URL, fallback to step-level video
            if (!finalVideoUrl || finalVideoUrl === normalizeAssetUrl('')) {
              if (stepLevelVideoUrl) {
                finalVideoUrl = normalizeAssetUrl(stepLevelVideoUrl);
                console.log('✅ [ARRAY video_choice] Using step-level video URL (fallback):', stepLevelVideoUrl);
              }
            } else {
              console.log('✅ [ARRAY video_choice] Using option-level video URL (normal case):', selectedOption?.video_url);
            }
            
            return {
              type: 'video_choice',
              videoUrl: finalVideoUrl,
              prompt: currentStepData.content.prompt || '',
              answerPrompt: selectedOption?.answer_prompt || "Reply: 'Hi!'",
              expectedAnswers: selectedOption?.expected_answers || ["Ciao!", "Ciao"],
              options: normalizedOptions
            };
          }
          
          // Handle pro_video step type
          if (currentStepData.stepType === 'pro_video') {
            console.log('🎬 [ARRAY] PRO VIDEO Step Data - Full Object:', JSON.stringify(currentStepData, null, 2));
            const requiredTier = currentStepData.content?.requiredTier || currentStepData.requiredTier || [];
            const userTier = userData?.priceTier || 'free';
            
            // If requiredTier is empty array, content is free - grant access to everyone
            const hasAccess = requiredTier.length === 0 || userTier === 'pro' || userTier === 'pro-monthly' || userTier === 'pro-yearly';
            
            // Extract video URL from new API structure (content.video.url) or legacy formats
            const videoUrl = currentStepData.content?.video?.url || currentStepData.content?.video_url || currentStepData.video_url || currentStepData.content?.videoUrl || '';
            console.log('🎥 [ARRAY pro_video] Extracted video URL:', videoUrl);
            const prompt = currentStepData.content?.prompt || currentStepData.prompt || '';
            const answerPrompt = currentStepData.content?.answer_prompt || currentStepData.answer_prompt || '';
            const expectedAnswers = currentStepData.content?.expected_answers || currentStepData.expected_answers || [];
            
            const quizData = getQuickCheckData();
            
            console.log('🎬 PRO VIDEO HANDLER:', { 
              stepType: currentStepData.stepType,
              hasAccess, 
              userTier, 
              requiredTier,
              videoUrl,
              prompt,
              answerPrompt,
              expectedAnswers,
              quizOptions: quizData?.options,
              quizAnswer: quizData?.answer
            });
            
            return {
              type: 'pro_video',
              videoUrl: normalizeAssetUrl(videoUrl),
              prompt,
              answerPrompt,
              expectedAnswers,
              options: quizData?.options,
              answer: quizData?.answer,
              hasAccess,
              requiredTier
            };
          }
          
          // Handle other API step types
          if (currentStepData.stepType === 'word_review') {
            console.log('🔍 [ARRAY] Word Review Step Data - Full Object:', JSON.stringify(currentStepData, null, 2));
            return {
              type: 'word_review',
              word: currentStepData.word || currentStepData.italian || currentStepData.content?.word || currentStepData.content?.italian || '',
              translation: currentStepData.translation || currentStepData.english || currentStepData.content?.translation || currentStepData.content?.english || '',
              audio: currentStepData.audio || currentStepData.content?.audio || '',
              note: currentStepData.note || currentStepData.content?.note || ''
            };
          }
          
          if (currentStepData.stepType === 'quick_check') {
            console.log('🎯 [ARRAY] Quick Check Step Data:', JSON.stringify(currentStepData, null, 2));
            return {
              type: 'quick_check',
              question: currentStepData.question || currentStepData.content?.question || currentStepData.content?.mcq?.question || '',
              options: currentStepData.options || currentStepData.content?.options || currentStepData.content?.mcq?.options || [],
              answer: currentStepData.answer || currentStepData.content?.answer || currentStepData.content?.mcq?.answer || ''
            };
          }
          
          if (currentStepData.stepType === 'typing') {
            console.log('✏️ [ARRAY] Typing Step Data:', JSON.stringify(currentStepData, null, 2));
            const fullWord = currentStepData.expected || currentStepData.expectedAnswer || currentStepData.content?.expected || currentStepData.content?.expected_answer || '';
            const prompt = currentStepData.prompt || currentStepData.type_prompt || currentStepData.content?.prompt || currentStepData.content?.type_prompt || '';
            
            // Try to extract just the missing letters from the prompt (e.g., "gi" from "Buon__orno")
            let missingLetters = extractMissingLetters(prompt, fullWord);
            
            // FALLBACK: If extraction fails, use full word to ensure lesson remains solvable
            if (!missingLetters && fullWord) {
              console.warn('✏️ [ARRAY] Extraction failed, falling back to full word:', { prompt, fullWord });
              missingLetters = fullWord;
            }
            
            console.log('✏️ [ARRAY] Extracted missing letters:', { prompt, fullWord, missingLetters });
            
            // Generate options if not provided by database or if empty array
            let options = currentStepData.options || currentStepData.content?.options || null;
            if ((!options || options.length === 0) && missingLetters) {
              // Extract word context from prompt for better option generation
              const wordContext = prompt.split('=')[0]?.trim() || '';
              const cacheKey = `${lessonId}-${currentStep}-${missingLetters}`;
              options = generateTypeOptions(missingLetters, wordContext, cacheKey);
              console.log('✏️ [ARRAY] Generated options for typing step:', { missingLetters, options, fromCache: typeOptionsCache.current[cacheKey] !== undefined });
            }
            
            return {
              type: 'type',
              prompt,
              expected: missingLetters,
              fullWord: fullWord,
              options: options,
              alternatives: currentStepData.alternatives || currentStepData.alt_answers || currentStepData.content?.alternatives || currentStepData.content?.alt_answers || []
            };
          }
          
          if (currentStepData.stepType === 'comprehension') {
            console.log('🎧 [ARRAY] Comprehension/Audio Step Data - Full Object:', JSON.stringify(currentStepData, null, 2));
            return {
              type: 'audio',
              audioSentence: currentStepData.audioSentence || currentStepData.audio_sentence || currentStepData.content?.audioSentence || currentStepData.content?.audio_sentence || '',
              options: currentStepData.options || currentStepData.content?.options || [],
              answer: currentStepData.answer || currentStepData.content?.answer || ''
            };
          }
          
          if (currentStepData.stepType === 'text_tip') {
            console.log('💡 [ARRAY] Text Tip Step Data - Full Object:', JSON.stringify(currentStepData, null, 2));
            
            // Database uses 'prompt' field - parse it to get title and text
            const promptText = currentStepData.prompt || currentStepData.content?.prompt || currentStepData.text || currentStepData.content?.text || '';
            const titleText = currentStepData.title || currentStepData.content?.title || '';
            
            // If prompt contains ":", split it into title and text
            let finalTitle = titleText;
            let finalText = promptText;
            
            if (promptText && !titleText && promptText.includes(':')) {
              const colonIndex = promptText.indexOf(':');
              finalTitle = promptText.substring(0, colonIndex).trim();
              finalText = promptText.substring(colonIndex + 1).trim();
            } else if (promptText && !titleText) {
              // No colon, use a default title
              finalTitle = 'Tip';
              finalText = promptText;
            }
            
            return {
              type: 'text_tip',
              title: finalTitle,
              text: finalText,
              icon: currentStepData.icon || currentStepData.content?.icon || '💡'
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
          
          // FIXED: Safer generateFillInText function with bounds checking
          const generateFillInText = (word: string) => {
            if (!word || word.length === 0) return '___'; // Handle empty words
            
            if (word.includes(' ')) {
              const parts = word.split(' ');
              const firstPart = parts[0] || '';
              const remainingLength = Math.max(0, word.length - firstPart.length); // Ensure non-negative
              return firstPart + "_".repeat(remainingLength);
            }
            
            if (word.length <= 3) {
              const repeatCount = Math.max(0, word.length - 1); // Ensure non-negative
              return word.charAt(0) + "_".repeat(repeatCount);
            }
            
            const repeatCount = Math.max(0, word.length - 2); // Ensure non-negative
            return word.substring(0, 2) + "_".repeat(repeatCount);
          };
          
          // FIXED: Safer getMissingLetters function with bounds checking
          const getMissingLetters = (word: string) => {
            if (!word || word.length === 0) return ''; // Handle empty words
            
            if (word.includes(' ')) {
              const firstSpaceIndex = word.indexOf(' ');
              if (firstSpaceIndex === -1 || firstSpaceIndex >= word.length - 1) {
                return ''; // Handle edge cases
              }
              return word.substring(firstSpaceIndex + 1);
            }
            
            if (word.length <= 3) {
              return word.length > 1 ? word.substring(1) : ''; // Ensure we have characters to return
            }
            
            return word.length > 2 ? word.substring(2) : ''; // Ensure we have characters to return
          };
          
          // FIXED: Add validation before using the functions
          const fillInPrompt = generateFillInText(word);
          const missingLetters = getMissingLetters(word);
          
          // Generate options using the helper function
          const cacheKey = `${lessonId}-step3-${missingLetters}`;
          const allOptions = generateTypeOptions(missingLetters, word, cacheKey);
          
          // Add debug logging to help identify issues
          console.log('Step 3 Debug:', {
            word,
            translation,
            wordLength: word.length,
            fillInPrompt,
            missingLetters,
            missingLettersLength: missingLetters.length,
            allOptions,
            fromCache: !!typeOptionsCache.current[cacheKey]
          });
          
          return {
            type: 'type',
            prompt: `${fillInPrompt} = ${translation}`,
            expected: missingLetters,
            options: allOptions,
            alternatives: [
              missingLetters.toLowerCase(), 
              missingLetters.toUpperCase(),
              missingLetters.trim() // Add trimmed version as alternative
            ].filter(alt => alt.length > 0) // Remove empty alternatives
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
    } catch (error) {
      console.error('❌ Error in getCurrentStepData:', error);
      console.error('Current lesson data:', currentLesson);
      console.error('Current step:', currentStep);
      
      // Return a fallback step data to prevent crashes
      return {
        type: 'error',
        prompt: 'An error occurred loading this step.',
        expected: '',
        alternatives: []
      };
    }
  };

  // Memoize stepData to prevent regeneration of options on every render
  // This is critical for Type Practice step where options are randomly generated
  const stepData = useMemo(() => {
    return getCurrentStepData();
  }, [currentStep, currentLesson, language, courseId, lessonId, userData]);

  // Memoize video choice options from step 2's quick check data
  const videoChoiceOptions = useMemo(() => {
    if (stepData?.type === 'video_choice') {
      const quizData = getQuickCheckData();
      if (quizData?.options && quizData.options.length > 0) {
        const normalizedOptions = quizData.options.map((opt: any) => {
          if (typeof opt === 'string') return opt;
          if (opt && typeof opt === 'object' && (opt.value || opt.label)) return opt.value || opt.label;
          return String(opt);
        });
        const normalizedAnswer = typeof quizData.answer === 'string' 
          ? quizData.answer 
          : (quizData.answer && typeof quizData.answer === 'object' && (quizData.answer.value || quizData.answer.label))
            ? (quizData.answer.value || quizData.answer.label)
            : normalizedOptions[0];
        
        return { options: normalizedOptions, answer: normalizedAnswer };
      }
      const fallbackOptions = stepData.expectedAnswers 
        ? [stepData.expectedAnswers[0], 'Buongiorno', 'Arrivederci', 'Grazie'].filter((opt, idx, arr) => arr.indexOf(opt) === idx).slice(0, 3)
        : ['Ciao!', 'Buongiorno', 'Arrivederci'];
      
      return { 
        options: fallbackOptions, 
        answer: stepData.expectedAnswers?.[0] || fallbackOptions[0] 
      };
    }
    return null;
  }, [currentStep, currentLesson, stepData?.type, lessonId, courseId]);

  // Complete lesson mutation - matching web exactly
  const completeLessonMutation = useMutation({
    mutationFn: async (score: number) => {
      await apiClient.updateProgress({
        language,
        courseId: courseId || "course1",
        lessonId: lessonId || currentLesson!.id,
        stepNumber: getTotalSteps(),
        completed: true,
        score,
        completedAt: new Date(),
      });
      return score;
    },
    onSuccess: (score) => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress", language] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats", language] });
      
      // Navigate to LessonComplete screen instead of showing alert
      // Use route params to ensure correct data flow across all courses and languages
      if (score !== undefined && currentLesson && language && courseId) {
        navigation.navigate('LessonComplete', {
          lessonTitle: currentLesson?.lesson?.title || currentLesson?.title || 'Lesson',
          lessonId: lessonId || currentLesson.id,
          courseId: courseId,
          score: score,
          language: language
        });
      } else {
        // Fallback to alert if data is missing
        Alert.alert(
          "Lesson completed!",
          "Great job! Returning to dashboard...",
          [{ text: "OK", onPress: () => navigation.navigate('MainTabs' as never) }]
        );
      }
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
      
      if (videoChoiceOptions?.answer) {
        const normalizedExpected = normalizeText(videoChoiceOptions.answer);
        correct = userAnswer === normalizedExpected || 
                 normalizedExpected.includes(userAnswer) ||
                 userAnswer.includes(normalizedExpected.split(' ')[0]);
      } else {
        const expectedAnswers = stepData.expectedAnswers || [];
        correct = expectedAnswers.some((expected: string) => {
          const normalizedExpected = normalizeText(expected);
          return userAnswer === normalizedExpected || 
                 normalizedExpected.includes(userAnswer) ||
                 userAnswer.includes(normalizedExpected.split(' ')[0]);
        });
      }
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
    } else if (stepData.type === 'word_review' || stepData.type === 'text_tip') {
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
      const totalSteps = getTotalSteps();
      
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        setSelectedAnswer("");
        setShowResult(false);
        setIsCorrect(false);
      } else {
        const correctSteps = Object.values(stepResults).filter(Boolean).length;
        // Only count steps that actually have questions (exclude word_review which is step 1)
        // Guard against division by zero for single-step or edge case lessons
        const stepsWithQuestions = Math.max(1, totalSteps - 1);
        const score = Math.round((correctSteps / stepsWithQuestions) * 100);
        completeLessonMutation.mutate(score);
      }
    }
  };

  // FIXED: Text-to-speech function using expo-speech
  const speakText = async (text: string) => {
    try {
      // Stop any current speech
      await Speech.stop();
      
      // Determine language for TTS
      const languageCode = language === 'spanish' ? 'es' : 
                          language === 'french' ? 'fr' :
                          language === 'italian' ? 'it' :
                          language === 'german' ? 'de' : 'en';
      
      // Speak the text
      await Speech.speak(text, {
        language: languageCode,
        pitch: 1.0,
        rate: 0.8, // Slightly slower for learning
        volume: 1.0,
      });
      
      console.log('🔊 Speaking:', text, 'in language:', languageCode);
    } catch (error) {
      console.error('❌ TTS error:', error);
      // Fallback alert for debugging
      Alert.alert('Audio', `Would speak: "${text}"`);
    }
  };

  // Handle upgrade button press - trigger RevenueCat purchase flow
  const handleUpgrade = async () => {
    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      // Initialize RevenueCat if needed
      await purchaseService.initialize(user?.id);

      // Fetch available offerings
      const packages = await purchaseService.getOfferings();
      
      if (packages.length === 0) {
        throw new Error('No subscription packages available');
      }

      // Get the first package (typically monthly subscription)
      const packageToPurchase = packages[0];

      // Trigger the purchase
      const result = await purchaseService.purchasePackage(packageToPurchase);

      if (result.success) {
        // Purchase successful - refresh user data to update subscription status
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] }),
          queryClient.invalidateQueries({ queryKey: ['/api/subscription-status'] })
        ]);
        
        Alert.alert(
          'Success!',
          'You now have access to all Pro Learner video lessons!',
          [{ text: 'OK' }]
        );
      } else if (result.error !== 'Purchase cancelled') {
        throw new Error(result.error || 'Purchase failed');
      }
    } catch (error: any) {
      console.error('❌ Purchase error:', error);
      setPurchaseError(error.message || 'Something went wrong');
      Alert.alert(
        'Purchase Failed',
        error.message || 'Unable to complete purchase. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsPurchasing(false);
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
            <Button title="Back to Dashboard" onPress={() => navigation.navigate('MainTabs' as never)} />
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
                  source={require('../../attached_assets/italian_beginners_course_1_introduction_1763386750161.mp4')}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  shouldPlay={true}
                  isMuted={false}
                  onError={(error) => {
                    console.error('🎥 Video playback error:', error);
                  }}
                  onLoad={() => {
                    console.log('✅ Video loaded successfully');
                  }}
                />
              </View>
              
              <Button 
                title="Continue to Lesson"
                onPress={handleContinueFromIntro}
                variant="default"
                style={styles.continueButton}
              />
            </CardContent>
          </Card>
        </ScrollView>
      )}
      
      {/* FIXED: Improved Header - Hide when showing intro video */}
      {!showIntroVideo && (
        <>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={20} color={theme.colors.foreground} />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle} numberOfLines={1} adjustsFontSizeToFit>
                {currentLesson?.lesson?.title || 'Lesson'}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {courseId?.replace('course', 'Course ')} - {lessonId?.replace('lesson', 'Lesson ').replace('review', 'Review ')} - {stepData?.isReview ? `Question ${currentStep} of ${stepData.totalQuestions}` : `Step ${currentStep} of ${getTotalSteps()}`}
              </Text>
            </View>
            
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {/* Progress Bar */}
          {stepData?.type !== 'irl_video' && (
            <View style={styles.progressBarContainer}>
              <View
                style={[styles.progressBar, { 
                  width: `${stepData?.isReview 
                    ? (currentStep / (stepData.totalQuestions || 1)) * 100 
                    : (currentStep / getTotalSteps()) * 100}%` 
                }]}
              />
            </View>
          )}
        </>
      )}

      {/* Lesson Content - Hide when showing intro video */}
      {!showIntroVideo && (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Notification Banner */}
          {fromNotification && (
            <View style={styles.notificationBanner}>
              <View style={styles.notificationContent}>
                <Ionicons name="notifications" size={20} color={theme.colors.primary} />
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
                      source={{
                        uri: stepData.videoUrl,
                        headers: authToken ? {
                          'Authorization': `Bearer ${authToken}`
                        } : undefined
                      }}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay={false}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, currentStep === 4 && { color: theme.colors.primary }]}>{stepData.answerPrompt}</Text>
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
                      source={{
                        uri: stepData.videoUrl,
                        headers: authToken ? {
                          'Authorization': `Bearer ${authToken}`
                        } : undefined
                      }}
                      useNativeControls
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay={false}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={[styles.inputLabel, currentStep === 4 && { color: theme.colors.primary }]}>{stepData.answerPrompt}</Text>
                    <TextInput
                      style={styles.textInput}
                      value={selectedAnswer}
                      onChangeText={setSelectedAnswer}
                      placeholder="Type your response..."
                    />
                  </View>
                  
                  {videoChoiceOptions && videoChoiceOptions.options.length > 0 && (
                    <View style={styles.optionsContainer}>
                      {videoChoiceOptions.options.map((option: string, index: number) => {
                        const letters = ['A', 'B', 'C', 'D'];
                        const isCorrectAnswer = showResult && videoChoiceOptions.answer === option;
                        const shouldAnimate = isCorrectAnswer && isCorrect;
                        
                        return (
                          <Animated.View
                            key={index}
                            style={[
                              shouldAnimate && {
                                transform: [{ scale: correctAnswerScale }],
                                shadowColor: theme.colors.checkmarkGreen,
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: correctAnswerBorder,
                                shadowRadius: correctAnswerBorder.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, 12]
                                }),
                                elevation: 8,
                              }
                            ]}
                          >
                            <TouchableOpacity
                              style={[
                                styles.optionButton,
                                selectedAnswer === option && styles.selectedOption,
                                showResult && isCorrectAnswer && styles.correctOption,
                                showResult && selectedAnswer === option && !isCorrectAnswer && styles.incorrectOption,
                              ]}
                              onPress={() => !showResult && setSelectedAnswer(option)}
                              disabled={showResult}
                            >
                              <View style={styles.optionLabelContainer}>
                                <View style={[
                                  styles.optionLabel,
                                  selectedAnswer === option && styles.selectedOptionLabel
                                ]}>
                                  <Text style={[
                                    styles.optionLabelText,
                                    selectedAnswer === option && styles.selectedOptionLabelText
                                  ]}>
                                    {letters[index]}
                                  </Text>
                                </View>
                              </View>
                              <Text style={[
                                styles.optionText,
                                selectedAnswer === option && styles.selectedOptionText,
                                showResult && isCorrectAnswer && styles.correctOptionText,
                                showResult && selectedAnswer === option && !isCorrectAnswer && styles.incorrectOptionText,
                              ]}>
                                {option}
                              </Text>
                              {showResult && isCorrectAnswer && (
                                <Text style={styles.checkmark}>✓</Text>
                              )}
                            </TouchableOpacity>
                          </Animated.View>
                        );
                      })}
                    </View>
                  )}
                </>
              )}

              {/* Pro Video Step */}
              {stepData && stepData.type === 'pro_video' && (
                <>
                  <View style={styles.quickCheckHeader}>
                    <Text style={styles.quickCheckQuestion}>{stepData.prompt}</Text>
                  </View>

                  <View style={styles.videoContainer}>
                    <Video
                      style={styles.video}
                      source={{
                        uri: stepData.videoUrl,
                        headers: authToken ? {
                          'Authorization': `Bearer ${authToken}`
                        } : undefined
                      }}
                      useNativeControls={stepData.hasAccess}
                      resizeMode={ResizeMode.CONTAIN}
                      shouldPlay={!stepData.hasAccess}
                      isLooping={!stepData.hasAccess}
                      isMuted={!stepData.hasAccess}
                    />
                    
                    {!stepData.hasAccess && (
                      <View style={styles.videoOverlay}>
                        <View style={styles.upgradeOverlayCard}>
                          <Text style={styles.upgradeOverlayTitle}>Unlock Pro Learner video lessons</Text>
                          <Text style={styles.upgradeOverlaySubtitle}>to accelerate your learning!</Text>
                          <Text style={styles.upgradePrice}>{PRO_PRICING.GBP.monthly}/month</Text>
                          <Button
                            title={isPurchasing ? "Processing..." : "Upgrade & Unlock All Videos"}
                            onPress={handleUpgrade}
                            disabled={isPurchasing}
                            style={styles.upgradeButton}
                          />
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedAnswer('skip');
                              handleStepSubmit();
                            }}
                            style={styles.skipLinkButton}
                          >
                            <Text style={styles.skipLinkText}>Skip this step and continue with free lessons</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>

                  {stepData.hasAccess && (
                    <>
                      <View style={styles.inputContainer}>
                        <Text style={[styles.inputLabel, currentStep === 4 && { color: theme.colors.primary }]}>{stepData.answerPrompt}</Text>
                        <TextInput
                          style={styles.textInput}
                          value={selectedAnswer}
                          onChangeText={setSelectedAnswer}
                          placeholder="Type your response..."
                        />
                      </View>
                      
                      {stepData.options && stepData.options.length > 0 && (
                        <View style={styles.optionsContainer}>
                          {stepData.options.map((option: string, index: number) => {
                            const letters = ['A', 'B', 'C', 'D'];
                            const isCorrectAnswer = showResult && option === stepData.answer;
                            const shouldAnimate = isCorrectAnswer && isCorrect;
                            
                            return (
                              <Animated.View
                                key={index}
                                style={[
                                  shouldAnimate && {
                                    transform: [{ scale: correctAnswerScale }],
                                    shadowColor: theme.colors.checkmarkGreen,
                                    shadowOffset: { width: 0, height: 0 },
                                    shadowOpacity: correctAnswerBorder,
                                    shadowRadius: correctAnswerBorder.interpolate({
                                      inputRange: [0, 1],
                                      outputRange: [0, 12]
                                    }),
                                    elevation: 8,
                                  }
                                ]}
                              >
                                <TouchableOpacity
                                  style={[
                                    styles.optionButton,
                                    selectedAnswer === option && styles.selectedOption,
                                    showResult && option === stepData.answer && styles.correctOption,
                                    showResult && selectedAnswer === option && option !== stepData.answer && styles.incorrectOption,
                                  ]}
                                  onPress={() => !showResult && setSelectedAnswer(option)}
                                  disabled={showResult}
                                >
                                  <View style={styles.optionLabelContainer}>
                                    <View style={[
                                      styles.optionLabel,
                                      selectedAnswer === option && styles.selectedOptionLabel
                                    ]}>
                                      <Text style={[
                                        styles.optionLabelText,
                                        selectedAnswer === option && styles.selectedOptionLabelText
                                      ]}>
                                        {letters[index]}
                                      </Text>
                                    </View>
                                  </View>
                                  <Text style={[
                                    styles.optionText,
                                    selectedAnswer === option && styles.selectedOptionText,
                                    showResult && option === stepData.answer && styles.correctOptionText,
                                    showResult && selectedAnswer === option && option !== stepData.answer && styles.incorrectOptionText,
                                  ]}>
                                    {option}
                                  </Text>
                                  {showResult && option === stepData.answer && (
                                    <Text style={styles.checkmark}>✓</Text>
                                  )}
                                </TouchableOpacity>
                              </Animated.View>
                            );
                          })}
                        </View>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Word Review Step - Updated to match screenshot */}
              {stepData && stepData.type === 'word_review' && (
                <>
                  <View style={styles.wordReviewContainer}>
                    <Text style={styles.translationLabel}>TRANSLATION</Text>
                    <Text style={styles.translationText}>{stepData.translation}</Text>
                    <Text style={styles.wordText}>{stepData.word}</Text>
                    
                    <TouchableOpacity 
                      style={styles.speakButton}
                      onPress={() => speakText(stepData.word)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="volume-high" size={20} color={theme.colors.foreground} />
                      <Text style={styles.speakButtonText}>Pronunciation</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {stepData.note && (
                    <View style={styles.noteContainer}>
                      <View style={styles.noteTitleRow}>
                        <Ionicons name="information-circle-outline" size={20} color={theme.colors.gradientBlue} />
                        <Text style={styles.noteTitle}>When to use</Text>
                      </View>
                      <Text style={styles.noteText}>{stepData.note}</Text>
                    </View>
                  )}
                </>
              )}

              {/* Quick Check Step */}
              {stepData && stepData.type === 'quick_check' && (
                <>
                  <View style={styles.quickCheckHeader}>
                    <Text style={styles.quickCheckTitle}>{currentStep}. Quick Check</Text>
                    <Text style={styles.quickCheckQuestion}>{stepData.question}</Text>
                  </View>

                  <View style={styles.optionsContainer}>
                    {stepData.options.map((option: string, index: number) => {
                      const letters = ['A', 'B', 'C', 'D'];
                      const isCorrectAnswer = showResult && option === stepData.answer;
                      const shouldAnimate = isCorrectAnswer && isCorrect;
                      
                      return (
                        <Animated.View
                          key={index}
                          style={[
                            shouldAnimate && {
                              transform: [{ scale: correctAnswerScale }],
                              shadowColor: theme.colors.checkmarkGreen,
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: correctAnswerBorder,
                              shadowRadius: correctAnswerBorder.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 12]
                              }),
                              elevation: 8,
                            }
                          ]}
                        >
                          <TouchableOpacity
                            style={[
                              styles.optionButton,
                              selectedAnswer === option && styles.selectedOption,
                              showResult && option === stepData.answer && styles.correctOption,
                              showResult && selectedAnswer === option && option !== stepData.answer && styles.incorrectOption,
                            ]}
                            onPress={() => !showResult && setSelectedAnswer(option)}
                            disabled={showResult}
                          >
                            <View style={styles.optionLabelContainer}>
                              <View style={[
                                styles.optionLabel,
                                selectedAnswer === option && styles.selectedOptionLabel
                              ]}>
                                <Text style={[
                                  styles.optionLabelText,
                                  selectedAnswer === option && styles.selectedOptionLabelText
                                ]}>
                                  {letters[index]}
                                </Text>
                              </View>
                            </View>
                          <Text style={[
                            styles.optionText,
                            selectedAnswer === option && styles.selectedOptionText,
                            showResult && option === stepData.answer && styles.correctOptionText,
                            showResult && selectedAnswer === option && option !== stepData.answer && styles.incorrectOptionText,
                          ]}>
                            {option}
                          </Text>
                          {showResult && option === stepData.answer && (
                            <Text style={styles.checkmark}>✓</Text>
                          )}
                        </TouchableOpacity>
                        </Animated.View>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Review MCQ Step */}
              {stepData && stepData.type === 'review_mcq' && (
                <>
                  <View style={styles.stepHeader}>
                    <Text style={styles.stepTitle}>🔄 Review Question</Text>
                    <Text style={styles.questionText}>{stepData.question}</Text>
                  </View>

                  <View style={styles.optionsContainer}>
                    {stepData.options.map((option: string, index: number) => {
                      const isCorrectAnswer = showResult && option === stepData.answer;
                      const shouldAnimate = isCorrectAnswer && isCorrect;
                      
                      return (
                        <Animated.View
                          key={index}
                          style={[
                            shouldAnimate && {
                              transform: [{ scale: correctAnswerScale }],
                              shadowColor: theme.colors.checkmarkGreen,
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: correctAnswerBorder,
                              shadowRadius: correctAnswerBorder.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 12]
                              }),
                              elevation: 8,
                            }
                          ]}
                        >
                          <TouchableOpacity
                            style={[
                              styles.optionButton,
                              selectedAnswer === option && styles.selectedOption,
                              showResult && option === stepData.answer && styles.correctOption,
                              showResult && selectedAnswer === option && option !== stepData.answer && styles.incorrectOption,
                            ]}
                            onPress={() => !showResult && setSelectedAnswer(option)}
                            disabled={showResult}
                          >
                            <Text style={[
                              styles.optionText,
                              selectedAnswer === option && styles.selectedOptionText,
                              showResult && option === stepData.answer && styles.correctOptionText,
                              showResult && selectedAnswer === option && option !== stepData.answer && styles.incorrectOptionText,
                            ]}>
                              {option} {showResult && option === stepData.answer && '✅'}
                            </Text>
                          </TouchableOpacity>
                        </Animated.View>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Typing Step */}
              {stepData && stepData.type === 'type' && (
                <>
                  <View style={styles.quickCheckHeader}>
                    <Text style={styles.quickCheckQuestion}>Complete the word:</Text>
                    
                    {/* Show word with selected letters inline in green */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: theme.spacing.sm }}>
                      {(() => {
                        const wordPart = stepData.prompt.split('=')[0]?.trim() || '';
                        const translation = stepData.prompt.split('=')[1]?.trim() || '';
                        const underscoreMatch = wordPart.match(/_+/);
                        
                        if (!underscoreMatch) {
                          return <Text style={styles.promptText}>{stepData.prompt}</Text>;
                        }
                        
                        const underscoreIndex = wordPart.indexOf(underscoreMatch[0]);
                        const beforeGap = wordPart.substring(0, underscoreIndex);
                        const afterGap = wordPart.substring(underscoreIndex + underscoreMatch[0].length);
                        
                        return (
                          <>
                            <Text style={styles.promptText}>{beforeGap}</Text>
                            {selectedAnswer ? (
                              <Text style={[styles.promptText, { color: theme.colors.primary }]}>{selectedAnswer}</Text>
                            ) : (
                              <Text style={styles.promptText}>{underscoreMatch[0]}</Text>
                            )}
                            <Text style={styles.promptText}>{afterGap} = {translation}</Text>
                          </>
                        );
                      })()}
                    </View>
                  </View>

                  {/* Multiple choice options if available */}
                  {stepData.options && stepData.options.length > 0 ? (
                    <View style={styles.optionsContainer}>
                      {stepData.options.map((option: string, index: number) => {
                        const isCorrectAnswer = showResult && option === stepData.expected;
                        const shouldAnimate = isCorrectAnswer && isCorrect;
                        
                        return (
                          <Animated.View
                            key={index}
                            style={[
                              shouldAnimate && {
                                transform: [{ scale: correctAnswerScale }],
                                shadowColor: theme.colors.checkmarkGreen,
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: correctAnswerBorder,
                                shadowRadius: correctAnswerBorder.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, 12]
                                }),
                                elevation: 8,
                              }
                            ]}
                          >
                            <TouchableOpacity
                              style={[
                                styles.optionButton,
                                selectedAnswer === option && styles.selectedOption,
                                showResult && option === stepData.expected && styles.correctOption,
                                showResult && selectedAnswer === option && option !== stepData.expected && styles.incorrectOption,
                              ]}
                              onPress={() => !showResult && setSelectedAnswer(option)}
                              disabled={showResult}
                            >
                              <Text style={[
                                styles.optionText,
                                selectedAnswer === option && styles.selectedOptionText,
                                showResult && option === stepData.expected && styles.correctOptionText,
                                showResult && selectedAnswer === option && option !== stepData.expected && styles.incorrectOptionText,
                              ]}>
                                {option}
                              </Text>
                              {showResult && option === stepData.expected && (
                                <Text style={styles.checkmark}>✓</Text>
                              )}
                            </TouchableOpacity>
                          </Animated.View>
                        );
                      })}
                    </View>
                  ) : (
                    // Fallback to text input if no options provided
                    <Animated.View 
                      style={[
                        styles.inputContainer,
                        showResult && isCorrect && {
                          transform: [{ scale: correctAnswerScale }],
                          shadowColor: theme.colors.checkmarkGreen,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: correctAnswerBorder,
                          shadowRadius: correctAnswerBorder.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 12]
                          }),
                          elevation: 8,
                        }
                      ]}
                    >
                      <TextInput
                        style={[
                          styles.textInput,
                          showResult && isCorrect && styles.correctInput,
                          showResult && !isCorrect && styles.incorrectInput,
                        ]}
                        value={selectedAnswer}
                        onChangeText={setSelectedAnswer}
                        placeholder="Type your answer..."
                        editable={!showResult}
                      />
                      {showResult && !isCorrect && (
                        <Text style={styles.correctAnswerHint}>
                          Correct answer: {stepData.expected}
                        </Text>
                      )}
                    </Animated.View>
                  )}
                </>
              )}

              {/* FIXED: Audio Step with improved audio button */}
              {stepData && stepData.type === 'audio' && (
                <>
                  <View style={styles.quickCheckHeader}>
                    <Text style={styles.quickCheckTitle}>{currentStep}. Listen and Choose</Text>
                    <Text style={styles.quickCheckQuestion}>What do you hear?</Text>
                    
                    <TouchableOpacity 
                      style={styles.listenButton}
                      onPress={() => speakText(stepData.audioSentence)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="volume-high" size={32} color={theme.colors.primary} />
                      <Text style={styles.listenText}>Tap to listen</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.optionsContainer}>
                    {stepData.options.map((option: string, index: number) => {
                      const isCorrectAnswer = showResult && option === stepData.answer;
                      const shouldAnimate = isCorrectAnswer && isCorrect;
                      
                      return (
                        <Animated.View
                          key={index}
                          style={[
                            shouldAnimate && {
                              transform: [{ scale: correctAnswerScale }],
                              shadowColor: theme.colors.checkmarkGreen,
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: correctAnswerBorder,
                              shadowRadius: correctAnswerBorder.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0, 12]
                              }),
                              elevation: 8,
                            }
                          ]}
                        >
                          <TouchableOpacity
                            style={[
                              styles.optionButton,
                              selectedAnswer === option && styles.selectedOption,
                              showResult && option === stepData.answer && styles.correctOption,
                              showResult && selectedAnswer === option && option !== stepData.answer && styles.incorrectOption,
                            ]}
                            onPress={() => !showResult && setSelectedAnswer(option)}
                            disabled={showResult}
                          >
                            <Text style={[
                              styles.optionText,
                              selectedAnswer === option && styles.selectedOptionText,
                              showResult && option === stepData.answer && styles.correctOptionText,
                              showResult && selectedAnswer === option && option !== stepData.answer && styles.incorrectOptionText,
                            ]}>
                              {option} {showResult && option === stepData.answer && '✅'}
                            </Text>
                          </TouchableOpacity>
                        </Animated.View>
                      );
                    })}
                  </View>
                </>
              )}
              
              {/* Text Tip Step */}
              {stepData && stepData.type === 'text_tip' && (
                <>
                  <View style={styles.tipContainer}>
                    <Text style={styles.tipIcon}>{stepData.icon}</Text>
                    <Text style={styles.tipTitle}>{stepData.title}</Text>
                    <Text style={styles.tipText}>{stepData.text}</Text>
                  </View>
                </>
              )}
              
              {/* Error Step - Fallback */}
              {stepData && stepData.type === 'error' && (
                <>
                  <View style={styles.stepHeader}>
                    <Text style={styles.stepTitle}>⚠️ Error</Text>
                    <Text style={styles.questionText}>{stepData.prompt}</Text>
                  </View>

                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>
                      There was an issue loading this lesson step. Please try refreshing or contact support.
                    </Text>
                    <Button
                      title="Skip This Step"
                      onPress={handleNextStep}
                      style={styles.skipButton}
                    />
                  </View>
                </>
              )}
              
              {/* Quiz Section */}
              {stepData && (
                <View style={styles.quizSection}>
                  {!showResult ? (
                    <Button
                      title={(stepData.type === 'word_review' || stepData.type === 'text_tip') ? "Continue" : "Check Answer"}
                      onPress={(stepData.type === 'word_review' || stepData.type === 'text_tip') ? handleNextStep : handleStepSubmit}
                      disabled={stepData.type !== 'word_review' && stepData.type !== 'text_tip' && !selectedAnswer.trim()}
                      style={styles.submitButton}
                    />
                  ) : (
                    <Button
                      title={currentStep < getTotalSteps() || stepData.isReview ? "Next" : "Complete Lesson"}
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

  // FIXED: Improved Header - Mobile responsive with dark theme
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    minHeight: 60, // Ensure minimum height
    marginTop: theme.spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
    paddingRight: theme.spacing.sm,
    minWidth: 40,
  },
  backButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    marginLeft: theme.spacing.xs,
  },
  closeButton: {
    padding: theme.spacing.xs,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: theme.colors.foreground,
    fontWeight: '300' as any,
  },
  headerContent: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    alignItems: 'center',
    paddingRight: theme.spacing.sm, // Prevent text from touching edge
  },
  headerTitle: {
    fontSize: isTablet ? theme.fontSize.lg : theme.fontSize.base, // Responsive font size
    fontWeight: '600' as any,
    color: theme.colors.foreground,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: isTablet ? theme.fontSize.sm : theme.fontSize.xs, // Responsive font size
    color: theme.colors.mutedForeground,
    marginBottom: 2,
  },
  headerProgress: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  
  // Progress Bar - Dark theme with lime green
  progressBarContainer: {
    height: 6,
    backgroundColor: theme.colors.progressBarBg,
    width: '100%',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
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
    marginTop: theme.spacing.lg,
    // marginBottom: theme.spacing.lg,
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
    backgroundColor: theme.colors.secondary50,
    borderColor: theme.colors.secondary100,
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
    color: theme.colors.secondary700,
  },
  notificationSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.secondary600,
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
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.muted + '50',
    borderRadius: theme.borderRadius.lg,
  },
  stepTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700' as any,
    color: theme.colors.foreground,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
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
    marginVertical: theme.spacing.sm,
    backgroundColor: 'transparent',
  },
  video: (() => {
    const videoWidth = Math.min(screenWidth - (theme.spacing.md * 4), 280);
    const videoHeight = Math.min((videoWidth * 16) / 9, 500);
    return {
      width: videoWidth,
      height: videoHeight,
      borderRadius: theme.borderRadius.lg,
    };
  })(),

  // Word Review - Updated styling to match screenshot
  wordReviewContainer: {
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.borderRadius.lg,
  },
  translationLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600' as any,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.xs,
  },
  lessonEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  translationText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  wordText: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: '700' as any,
    color: theme.colors.gradientBlue,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  // Updated speak button to match screenshot
  speakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceContainer,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  speakButtonText: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.sm,
    fontWeight: '500' as any,
  },
  noteContainer: {
    backgroundColor: theme.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.lg,
  },
  noteTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  noteTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600' as any,
    color: theme.colors.foreground,
  },
  noteText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.onSurfaceVariant,
    lineHeight: theme.fontSize.sm * 1.5,
  },

  // Quick Check Specific Styles - Dark theme
  quickCheckHeader: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  quickCheckTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600' as any,
    color: theme.colors.secondary,
    textAlign: 'left',
    letterSpacing: 0.5,
  },
  quickCheckQuestion: {
    fontSize: theme.fontSize.xl,
    fontWeight: '500' as any,
    color: theme.colors.foreground,
    textAlign: 'left',
    marginTop: theme.spacing.xs,
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
    backgroundColor: theme.colors.muted,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  optionLabelContainer: {
    marginRight: theme.spacing.xs,
  },
  optionLabel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.border,
    borderWidth: 1,
    borderColor: theme.colors.textTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedOptionLabel: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  optionLabelText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600' as any,
    color: theme.colors.foreground,
  },
  selectedOptionLabelText: {
    color: theme.colors.primaryForeground,
  },
  checkmark: {
    fontSize: 18,
    color: theme.colors.checkmarkGreen,
    marginLeft: 'auto',
  },
  selectedOption: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.muted,
  },
  correctOption: {
    borderColor: theme.colors.checkmarkGreen,
    backgroundColor: theme.colors.success50,
  },
  incorrectOption: {
    borderColor: theme.colors.destructive,
    backgroundColor: theme.colors.errorContainer,
  },
  optionText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    textAlign: 'left',
    flex: 1,
  },
  selectedOptionText: {
    color: theme.colors.foreground,
    fontWeight: '600' as any,
  },
  correctOptionText: {
    color: theme.colors.checkmarkGreen,
    fontWeight: '600' as any,
  },
  incorrectOptionText: {
    color: theme.colors.destructive,
    fontWeight: '600' as any,
  },

  // Input - Dark theme for pro_video step
  inputContainer: {
    gap: theme.spacing.sm,
  },
  inputLabel: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700' as any,
    color: theme.colors.foreground,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  textInput: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    fontSize: theme.fontSize.base,
    backgroundColor: theme.colors.muted,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  correctInput: {
    borderColor: theme.colors.checkmarkGreen,
    backgroundColor: theme.colors.success50,
    color: theme.colors.primaryForeground,
  },
  incorrectInput: {
    borderColor: theme.colors.destructive,
    backgroundColor: theme.colors.errorContainer,
  },
  correctAnswerHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.destructive,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },

  // FIXED: Improved Listen Button
  listenButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.secondary50,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.gradientPurple,
    borderStyle: 'dashed',
    gap: theme.spacing.md,
    marginVertical: theme.spacing.lg,
    shadowColor: theme.colors.gradientPurple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  listenText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.gradientPurple,
    fontWeight: '600' as any,
  },

  // Upgrade Container
  upgradeContainer: {
    alignItems: 'center',
    gap: theme.spacing.lg,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.warning50,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.warning500,
  },
  upgradeTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700' as any,
    color: theme.colors.warning600,
  },
  upgradeText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.warning600,
    textAlign: 'center',
    lineHeight: theme.fontSize.base * 1.4,
  },
  skipButton: {
    backgroundColor: theme.colors.mutedForeground,
  },

  // Video Overlay (for pro video paywall)
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  upgradeOverlayCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.md,
    maxWidth: '90%',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  upgradeOverlayTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700' as any,
    color: theme.colors.primaryForeground,
    textAlign: 'center',
  },
  upgradeOverlaySubtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.primaryForeground,
    textAlign: 'center',
  },
  upgradePrice: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700' as any,
    color: theme.colors.primaryForeground,
    textAlign: 'center',
  },
  oldPrice: {
    textDecorationLine: 'line-through',
    color: theme.colors.mutedForeground,
    marginRight: theme.spacing.xs,
  },
  upgradeButton: {
    backgroundColor: theme.colors.gradientPurple,
    width: '100%',
  },
  skipLinkButton: {
    padding: theme.spacing.sm,
  },
  skipLinkText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },

  // Quiz Section
  quizSection: {
    paddingTop: theme.spacing.sm,
    gap: theme.spacing.md,
  },

  // Buttons - Dark theme with lime green
  submitButton: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.primary,
  },
  nextButton: {
    backgroundColor: theme.colors.checkmarkGreen,
    marginTop: theme.spacing.md,
  },
  continueButton: {
    backgroundColor: theme.colors.secondary600,
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

  // Error handling styles
  errorContainer: {
    alignItems: 'center',
    gap: theme.spacing.lg,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.onErrorContainer,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },

  // Text Tip Styles - Dark background with green and white text
  tipContainer: {
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tipIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  tipTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700' as any,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  tipText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    textAlign: 'center',
    lineHeight: theme.fontSize.base * 1.5,
  },

  // Preview Container for Type Practice
  previewContainer: {
    backgroundColor: theme.colors.muted,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  previewLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.xs,
    fontWeight: '600' as any,
  },
  previewText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.primary,
    fontWeight: '700' as any,
    textAlign: 'center',
  },
});