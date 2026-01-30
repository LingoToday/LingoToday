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
import { VideoPlayer } from '../components/VideoPlayer';
import { SpeakBackComponent } from '../components/SpeakBackComponent';
import { purchaseService } from '../services/purchaseService';
import { videoPreloadService } from '../services/videoPreloadService';
import { generateEnhancedContent } from '../services/lessonEnhancementService';
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
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(null);
  const [isLoadingIntroVideo, setIsLoadingIntroVideo] = useState(false);
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
  const [tokenStatus, setTokenStatus] = useState<'pending' | 'resolved'>('pending');
  const [useSpeakBackMode, setUseSpeakBackMode] = useState(true);
  const [speakBackResult, setSpeakBackResult] = useState<{ isCorrect: boolean; transcription: string } | null>(null);
  
  // Phase 1 sub-step state: 'word' for word intro, 'usage' for when to use
  const [phase1SubStep, setPhase1SubStep] = useState<'word' | 'usage'>('word');

  // Enhanced content state for "How to use" screen
  const [enhancedContent, setEnhancedContent] = useState<{
    pronunciation: string;
    genderNote: string;
    dailyLifeUsage: string;
    originalNote: string;
  } | null>(null);
  const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(false);
  
  // Debug info state for troubleshooting enhancement API
  const [debugInfo, setDebugInfo] = useState<{
    status: string;
    apiCalled: boolean;
    response: string;
    error: string;
    lessonId: string;
    word: string;
    hasNote: boolean;
    apiUrl: string;
  }>({
    status: 'Not started',
    apiCalled: false,
    response: '',
    error: '',
    lessonId: '',
    word: '',
    hasNote: false,
    apiUrl: '',
  });

  // Video refs for controlling playback
  const videoChoiceRef = useRef<Video>(null);
  const proVideoRef = useRef<Video>(null);
  const irlVideoRef = useRef<Video>(null);

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

  // Reset phase1SubStep when step changes to ensure word intro always shows first
  useEffect(() => {
    setPhase1SubStep('word');
  }, [currentStep]);

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

  // Fetch auth token for authenticated video requests - IMMEDIATELY on mount
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
        } else {
          console.log('⚠️ No auth token found in storage');
        }
      } catch (error) {
        console.error('⚠️ Error fetching auth token:', error);
      } finally {
        // Always mark token as resolved, whether found or not
        setTokenStatus('resolved');
        console.log('✅ Auth token status: resolved');
      }
    };
    
    // Load auth token immediately on mount, don't wait for user object
    getAuthToken();
  }, []);

  // Shared language code mapping - single source of truth
  const LANGUAGE_CODES: { [key: string]: string } = {
    'it': 'italian',
    'es': 'spanish', 
    'de': 'german',
    'fr': 'french'
  };

  // Convert language code to full name for API
  const getFullLanguageName = (lang: string) => {
    return LANGUAGE_CODES[lang] || lang;
  };

  // Convert full language name to two-letter code for external API
  const getLanguageCode = (languageName: string): string => {
    const normalized = languageName?.toLowerCase();
    const entry = Object.entries(LANGUAGE_CODES).find(([_, name]) => name === normalized);
    return entry ? entry[0] : 'it';
  };

  // Fetch user data for gender detection and tier access (must be before lesson query)
  const { data: userData } = useQuery({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const response = await apiClient.getCurrentUser();
      return (response as any).data || response;
    },
    enabled: !!user,
  });

  // Fetch lesson data - with proper queryFn
  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useQuery<Lesson>({
    queryKey: ["/api/courses", getFullLanguageName(language || ''), courseId, lessonId, userData?.selectedLevel],
    queryFn: async () => {
      const fullLanguageName = getFullLanguageName(language || '');
      const userLevel = userData?.selectedLevel || 'beginner';
      
      console.log(`🌍 Fetching lesson data for: ${fullLanguageName}/${courseId}/${lessonId} with skillLevel: ${userLevel}`);
      const response = await apiClient.getLesson(fullLanguageName, courseId!, lessonId!, userLevel);
      const lessonData = (response as any).data || response;
      
      // Enhanced logging for debugging courses and video URLs
      const step1VideoUrl = lessonData?.lesson?.steps?.[0]?.content?.video?.url || 
                           lessonData?.lesson?.steps?.[0]?.video_url || 
                           lessonData?.lesson?.step1?.content?.videoUrl || '';
      
      console.log(`📚 Lesson data received for ${fullLanguageName}:`, JSON.stringify({
        lessonId: lessonData?.id || lessonData?.lessonId,
        title: lessonData?.lesson?.title || lessonData?.title,
        requestedSkillLevel: userLevel,
        step1VideoUrl: step1VideoUrl,
        hasStepsArray: Array.isArray(lessonData?.lesson?.steps),
        stepsCount: Array.isArray(lessonData?.lesson?.steps) ? lessonData?.lesson?.steps?.length : 0,
        hasStep1: !!lessonData?.lesson?.step1,
        hasStep4: !!lessonData?.lesson?.step4,
        hasStep5: !!lessonData?.lesson?.step5,
        stepTypes: Array.isArray(lessonData?.lesson?.steps) 
          ? lessonData?.lesson?.steps.map((s: any) => s.stepType) 
          : 'legacy format'
      }, null, 2));
      
      console.log(`🎥 Step 1 raw video URL from backend: "${step1VideoUrl}"`);
      
      return lessonData;
    },
    enabled: !!user && !!language && !!courseId && !!lessonId && !!userData,
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

  // Fallback video sources (used if API call fails)
  const getFallbackVideoSource = (courseId: string, languageCode: string) => {
    // Only return fallback videos for Italian - other languages should not show intro until proper videos are added
    if (languageCode !== 'italian') {
      console.warn(`⚠️ No fallback intro video available for ${languageCode}. Intro video will be skipped.`);
      return null;
    }
    
    switch (courseId) {
      case 'course1':
        return require('../attached_assets/italian beginners course 1 introduction_1763387065863.mp4');
      case 'course2':
        return require('../attached_assets/Italian beginners cours 2 introduction video_1757602127178.MOV');
      case 'course3':
        return require('../attached_assets/Italian beginners cours 3 introduction video_1757602127174.MOV');
      default:
        return require('../attached_assets/italian beginners course 1 introduction_1763387065863.mp4');
    }
  };

  // Function to fetch course intro data from API
  const fetchCourseIntro = async (languageCode: string, courseNumber: number, userLevel: string = 'beginner') => {
    try {
      const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 
                         (process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined) ||
                         '';
      
      if (!apiBaseUrl) {
        console.error('⚠️ API base URL is missing, using fallback video');
        return null;
      }

      const response = await fetch(
        `${apiBaseUrl}/api/external/courses/${languageCode}/${userLevel}/${courseNumber}`
      );

      if (!response.ok) {
        console.warn(`Failed to fetch course intro (${response.status}), will use fallback`);
        return null;
      }

      const courseData = await response.json();
      return courseData;
    } catch (error) {
      console.warn('Error fetching course intro, will use fallback:', error);
      return null;
    }
  };

  // Check if this is course lesson1 and if intro video should be shown (works for all languages)
  useEffect(() => {
    // Wait for userData to load before showing intro to ensure we have the correct level
    if (lessonId === 'lesson1' && 
        (courseId === 'course1' || courseId === 'course2' || courseId === 'course3') && 
        userProgress !== undefined && language && userData !== undefined) {
      
      const storageKey = `${language}_${courseId}_intro_shown`;
      
      // Check if user has completed any lessons for this specific course
      const hasCompletedCourseProgress = userProgress.some(p => p.courseId === courseId && p.completed);
      
      SecureStore.getItemAsync(storageKey).then(async hasSeenIntroVideo => {
        let shouldShowVideo = false;
        
        if (!hasCompletedCourseProgress) {
          // For new learners to this course, always show the video
          if (hasSeenIntroVideo) {
            SecureStore.deleteItemAsync(storageKey);
            console.log(`🎬 Clearing storage for new ${language} ${courseId} learner - video will show`);
          }
          shouldShowVideo = true;
          console.log(`🎬 Showing intro video for new ${language} ${courseId} learner`);
        } else if (!hasSeenIntroVideo) {
          // For returning learners who somehow don't have the storage flag
          shouldShowVideo = true;
          console.log(`🎬 Showing intro video for ${language} ${courseId}`);
        } else {
          console.log(`🎬 Video already seen by experienced ${language} ${courseId} learner, skipping`);
        }

        if (shouldShowVideo) {
          // Extract course number from courseId (e.g., 'course1' -> 1)
          const courseNumber = parseInt(courseId.replace('course', ''), 10);
          
          // Convert language name to two-letter code for external API (spanish -> es, italian -> it, etc.)
          const languageCode = getLanguageCode(language);
          
          // Get user's selected level - userData is guaranteed to be loaded at this point
          const userLevel = (userData?.selectedLevel || 'beginner').toLowerCase();
          
          console.log(`🎯 Fetching intro for ${languageCode}/${userLevel}/course${courseNumber}`);
          
          // Fetch intro video URL from API with user's level
          const courseData = await fetchCourseIntro(languageCode, courseNumber, userLevel);
          
          if (courseData && courseData.introVideoUrl) {
            console.log(`🎬 ===== INTRO VIDEO DEBUG =====`);
            console.log(`🎬 Raw intro video URL from backend: "${courseData.introVideoUrl}"`);
            console.log(`🎬 User level: ${userLevel}`);
            console.log(`🎬 Language: ${languageCode}`);
            console.log(`🎬 Course: ${courseNumber}`);
            setIntroVideoUrl(courseData.introVideoUrl);
            setShowIntroVideo(true);
            setIsLoadingIntroVideo(false);
          } else {
            // Check if fallback video exists for this language
            const fallbackVideo = getFallbackVideoSource(courseId, language);
            
            if (fallbackVideo) {
              console.log('⚠️ No intro video URL from API, will use fallback local video');
              setIntroVideoUrl(null);
              setShowIntroVideo(true);
              setIsLoadingIntroVideo(false);
            } else {
              console.log(`⚠️ No intro video available for ${language}/${courseId}. Skipping intro and starting lesson.`);
              setShowIntroVideo(false);
              setIsLoadingIntroVideo(false);
              // Mark as seen so we don't keep trying to show it
              SecureStore.setItemAsync(storageKey, 'true');
            }
          }
        }
      });
    }
  }, [language, courseId, lessonId, userProgress, userData]);

  const handleContinueFromIntro = () => {
    const storageKey = `${language}_${courseId}_intro_shown`;
    SecureStore.setItemAsync(storageKey, 'true');
    setShowIntroVideo(false);
  };

  // Use fallback lesson if API lesson is not available
  const currentLesson = lesson || fallbackLesson;

  // Pre-fetch enhanced content when lesson loads for "How to use" screen
  useEffect(() => {
    const fetchEnhancedContent = async () => {
      console.log('[Enhancement] === Starting enhancement check ===');
      setDebugInfo(prev => ({ ...prev, status: 'Starting check...' }));
      
      // Get step1 data from currentLesson (lesson structure uses step1, step2, etc. as direct properties)
      if (!currentLesson?.lesson) {
        setDebugInfo(prev => ({ ...prev, status: 'SKIP: No lesson', error: 'currentLesson.lesson is empty' }));
        return;
      }
      
      // Try step1 first (word_review step), then check steps array as fallback
      const lessonData = currentLesson.lesson as any;
      let step1Data = lessonData.step1 || lessonData.steps?.step1;
      
      // Fallback to steps array if step1 not found
      if (!step1Data && lessonData.steps) {
        const stepsArr = Array.isArray(lessonData.steps) ? lessonData.steps : Object.values(lessonData.steps);
        step1Data = stepsArr[0];
      }
      
      if (!step1Data) {
        setDebugInfo(prev => ({ ...prev, status: 'SKIP: No step1', error: 'lesson.step1 not found' }));
        return;
      }
      
      const note = step1Data?.content?.note || step1Data?.note;
      const word = step1Data?.content?.word || step1Data?.word;
      const translation = step1Data?.content?.translation || step1Data?.content?.english || step1Data?.translation || step1Data?.english;
      
      const currentLessonId = lessonId || `lesson_${Date.now()}`;
      setDebugInfo(prev => ({ 
        ...prev, 
        lessonId: currentLessonId,
        word: word || '(none)',
        hasNote: !!note && note.trim().length > 0,
      }));
      
      if (!note || note.trim().length === 0 || !word) {
        setDebugInfo(prev => ({ 
          ...prev, 
          status: 'SKIP: Missing data', 
          error: `note: ${!!note}, word: ${!!word}` 
        }));
        return;
      }

      if (!language) {
        setDebugInfo(prev => ({ ...prev, status: 'SKIP: No language', error: 'language param missing' }));
        return;
      }
      
      const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || 'https://lingotoday.replit.app';
      setDebugInfo(prev => ({ ...prev, status: 'Calling API...', apiCalled: true, apiUrl: apiBaseUrl }));
      setIsLoadingEnhanced(true);
      
      try {
        const result = await generateEnhancedContent(
          language,
          currentLessonId,
          {
            word: word,
            translation: translation || '',
            example: step1Data?.content?.example || step1Data?.example,
            exampleTranslation: step1Data?.content?.exampleTranslation || step1Data?.exampleTranslation,
            note: note,
          }
        );
        
        if (result.content) {
          setDebugInfo(prev => ({ 
            ...prev, 
            status: result.fromCache ? 'CACHED' : 'SUCCESS', 
            response: JSON.stringify(result.content).substring(0, 200),
            error: '',
          }));
          setEnhancedContent(result.content);
        } else {
          setDebugInfo(prev => ({ 
            ...prev, 
            status: result.fromCache ? 'CACHED (empty)' : 'API returned null', 
            error: result.error || 'No content returned',
          }));
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        setDebugInfo(prev => ({ 
          ...prev, 
          status: 'ERROR', 
          error: errorMsg,
        }));
      } finally {
        setIsLoadingEnhanced(false);
      }
    };

    fetchEnhancedContent();
  }, [currentLesson, language, lessonId]);

  // Helper to normalize asset URLs consistently
  const normalizeAssetUrl = (url: string, stepNumber?: number): string => {
    console.log(`🔍 normalizeAssetUrl called with: "${url}" (step ${stepNumber || 'N/A'})`);
    
    if (!url) {
      console.log(`⚠️ normalizeAssetUrl: Empty URL provided`);
      return '';
    }
    
    // Check if this video was preloaded (optimization for faster loading)
    if (stepNumber && language && courseId && lessonId) {
      const preloadedUrl = videoPreloadService.getPreloadedVideo(
        language,
        courseId,
        lessonId,
        stepNumber
      );
      
      if (preloadedUrl) {
        console.log(`⚡ Using preloaded video for ${language}/${courseId}/${lessonId}/step${stepNumber}`);
        return preloadedUrl;
      }
    }
    
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
    
    // Already a full HTTP/HTTPS URL - return as-is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.log(`✅ URL already absolute: ${url}`);
      return url;
    }
    
    // Handle object storage URLs - route through video streaming endpoint
    if (url.startsWith('/replit-objstore-') || url.startsWith('replit-objstore-')) {
      const normalizedPath = url.startsWith('/') ? url : '/' + url;
      const fullUrl = apiBaseUrl + '/api/videos' + normalizedPath;
      console.log(`🎥 ===== OBJECT STORAGE VIDEO =====`);
      console.log(`🎥 Input: "${url}"`);
      console.log(`🎥 Output: "${fullUrl}"`);
      console.log(`🎥 Note: This URL requires authentication!`);
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
      if (!currentLesson?.lesson) {
        console.log(`⚠️ No lesson data available for step ${currentStep}`);
        return null;
      }
      
      // Enhanced debugging for Spanish courses
      if (language === 'spanish') {
        console.log(`🔍 [SPANISH DEBUG] Processing step ${currentStep} for ${language}/${courseId}/${lessonId}`);
        console.log(`🔍 [SPANISH DEBUG] Lesson structure:`, {
          hasStepsArray: Array.isArray(currentLesson.lesson?.steps),
          stepsCount: Array.isArray(currentLesson.lesson?.steps) ? currentLesson.lesson.steps.length : 0,
          hasStep1: !!currentLesson.lesson?.step1,
          hasStep4: !!currentLesson.lesson?.step4,
          currentStepIndex: currentStep - 1
        });
        
        if (Array.isArray(currentLesson.lesson?.steps) && currentLesson.lesson.steps.length > 0) {
          const currentStepData = currentLesson.lesson.steps[currentStep - 1];
          console.log(`🔍 [SPANISH DEBUG] Step ${currentStep} raw data:`, JSON.stringify(currentStepData, null, 2));
        }
      }
      
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
                  video_url: normalizeAssetUrl(videoUrl, currentStep)
                };
              });
              
              // Get answer data from first option for backward compatibility
              const firstOption = normalizedOptions[0] || {};
              
              return {
                type: 'video_choice',
                videoUrl: normalizeAssetUrl(stepLevelVideoUrl, currentStep),
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
                video_url: normalizeAssetUrl(videoUrl, currentStep)
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
                finalVideoUrl = normalizeAssetUrl(stepLevelVideoUrl, currentStep);
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
                  video_url: normalizeAssetUrl(videoUrl, currentStep)
                };
              });
              
              // Get answer data from first option for backward compatibility
              const firstOption = normalizedOptions[0] || {};
              
              return {
                type: 'video_choice',
                videoUrl: normalizeAssetUrl(stepLevelVideoUrl, currentStep),
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
                video_url: normalizeAssetUrl(videoUrl, currentStep)
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
                finalVideoUrl = normalizeAssetUrl(stepLevelVideoUrl, currentStep);
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
              videoUrl: normalizeAssetUrl(videoUrl, currentStep),
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

  // Reset speak-back mode to true when arriving at a video_choice, pro_video, or review_mcq step
  useEffect(() => {
    if (stepData?.type === 'video_choice' || stepData?.type === 'pro_video' || stepData?.type === 'review_mcq') {
      setUseSpeakBackMode(true);
      setSpeakBackResult(null);
      setSelectedAnswer('');
      setShowResult(false);
      setIsCorrect(false);
    }
  }, [currentStep, stepData?.type]);

  // Memoize video choice options from step 2's quick check data
  const videoChoiceOptions = useMemo(() => {
    if (stepData?.type === 'video_choice') {
      const quizData = getQuickCheckData();
      if (quizData?.options && quizData.options.length > 0) {
        const normalizedOptions = quizData.options.map((opt: any) => {
          if (typeof opt === 'string') return opt;
          if (opt && typeof opt === 'object' && ('value' in opt || 'label' in opt)) {
            return (opt as any).value || (opt as any).label;
          }
          return String(opt);
        });
        
        let normalizedAnswer: string;
        if (typeof quizData.answer === 'string') {
          normalizedAnswer = quizData.answer;
        } else if (quizData.answer && typeof quizData.answer === 'object' && ('value' in quizData.answer || 'label' in quizData.answer)) {
          normalizedAnswer = (quizData.answer as any).value || (quizData.answer as any).label;
        } else {
          normalizedAnswer = normalizedOptions[0];
        }
        
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

  // Get preloaded video URI or fallback to remote URL
  const getVideoSource = (videoUrl: string) => {
    if (!language || !courseId || !lessonId || !videoUrl) {
      return videoUrl;
    }

    const preloadedUri = videoPreloadService.getPreloadedVideo(
      language,
      courseId,
      lessonId,
      currentStep
    );

    if (preloadedUri) {
      console.log(`✅ Using preloaded video for step ${currentStep}:`, preloadedUri);
      return preloadedUri;
    }

    console.log(`📡 Using remote video for step ${currentStep}:`, videoUrl);
    
    if (Platform.OS === 'web') {
      videoPreloadService.eagerPreloadCurrentVideo(
        language,
        courseId,
        lessonId,
        currentStep,
        videoUrl
      );
    }
    
    return videoUrl;
  };

  // Check if a video URL requires authentication
  // All videos from the same origin as our API require authentication
  const isAuthenticatedVideo = (videoUrl: string): boolean => {
    if (!videoUrl) return false;
    
    try {
      // Get the API base URL
      const apiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl || '';
      if (!apiBaseUrl) {
        // Fallback to old pattern-based detection if no API URL
        return videoUrl.includes('replit-objstore-') || 
               videoUrl.includes('replit_objstore_') ||
               videoUrl.includes('/api/videos/');
      }
      
      // Extract the origin from API base URL (e.g., "https://lingotoday.replit.app")
      const apiOrigin = new URL(apiBaseUrl).origin;
      
      // Check the original URL
      if (videoUrl.startsWith('http://') || videoUrl.startsWith('https://')) {
        const videoOrigin = new URL(videoUrl).origin;
        if (videoOrigin === apiOrigin) {
          console.log(`🔐 Video from same origin as API, requires auth: ${videoUrl.substring(0, 80)}...`);
          return true;
        }
      }
      
      // Check if it's a relative URL (starts with /) - these are same-origin by definition
      if (videoUrl.startsWith('/')) {
        console.log(`🔐 Relative URL video, requires auth: ${videoUrl.substring(0, 80)}...`);
        return true;
      }
      
      // Check the final URL after getVideoSource (which may return preloaded URL)
      const finalUri = getVideoSource(videoUrl);
      if (finalUri.startsWith('http://') || finalUri.startsWith('https://')) {
        const finalOrigin = new URL(finalUri).origin;
        if (finalOrigin === apiOrigin) {
          console.log(`🔐 Preloaded video from same origin, requires auth: ${finalUri.substring(0, 80)}...`);
          return true;
        }
      }
      
      // Not from our API origin, public video
      return false;
    } catch (error) {
      console.error('Error checking video authentication:', error);
      // On error, fall back to conservative approach: require auth for any backend-looking URL
      return videoUrl.includes('replit') || 
             videoUrl.includes('/api/') || 
             videoUrl.includes('/attached_assets/');
    }
  };

  // Get video source with authentication headers for same-origin videos
  const getVideoSourceWithAuth = (videoUrl: string): { uri: string; headers?: { [key: string]: string } } => {
    const uri = getVideoSource(videoUrl);
    
    // Check if this video needs authentication
    const needsAuth = isAuthenticatedVideo(videoUrl);
    
    if (needsAuth && authToken) {
      console.log(`🔐 Adding auth header to video: ${uri.substring(0, 80)}...`);
      return {
        uri,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      };
    } else if (needsAuth && !authToken) {
      console.warn(`⚠️ Video requires auth but no token available yet: ${uri}`);
    }
    
    return { uri };
  };

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

  // Handle video playback status updates - auto-restart when video ends
  const handleVideoPlaybackStatusUpdate = async (status: any) => {
    if (status.didJustFinish && !status.isLooping) {
      if (videoChoiceRef.current) {
        await videoChoiceRef.current.replayAsync();
      }
      if (proVideoRef.current) {
        await proVideoRef.current.replayAsync();
      }
      if (irlVideoRef.current) {
        await irlVideoRef.current.replayAsync();
      }
    }
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
        setSpeakBackResult(null);
        setUseSpeakBackMode(true);
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
        setSpeakBackResult(null);
        setUseSpeakBackMode(true);
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

  // State for OpenAI TTS pronunciation
  const [isPlayingPronunciation, setIsPlayingPronunciation] = useState(false);
  const pronunciationSoundRef = useRef<Audio.Sound | null>(null);

  // OpenAI TTS pronunciation function - more natural sounding
  const playOpenAIPronunciation = async (text: string) => {
    if (isPlayingPronunciation) return;
    
    setIsPlayingPronunciation(true);
    
    try {
      // Clean up any existing sound
      if (pronunciationSoundRef.current) {
        await pronunciationSoundRef.current.unloadAsync();
        pronunciationSoundRef.current = null;
      }
      
      // Backend expects full language names (italian, french, etc.) not codes (it, fr, etc.)
      const languageName = (language || 'english').toLowerCase();
      
      const result = await apiClient.pronounceText(text, languageName);
      
      if (!result.success || !result.audioBase64) {
        console.error('Pronunciation failed:', result.error);
        // Fallback to expo-speech if OpenAI TTS fails
        await speakTextFallback(text);
        setIsPlayingPronunciation(false);
        return;
      }
      
      // Create and play audio from base64
      const { sound } = await Audio.Sound.createAsync(
        { uri: `data:audio/mp3;base64,${result.audioBase64}` },
        { shouldPlay: true }
      );
      
      pronunciationSoundRef.current = sound;
      
      // Listen for playback completion and cleanup
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlayingPronunciation(false);
          // Cleanup sound after playback
          try {
            await sound.unloadAsync();
            if (pronunciationSoundRef.current === sound) {
              pronunciationSoundRef.current = null;
            }
          } catch (e) {
            // Ignore cleanup errors
          }
        }
      });
      
      console.log('🔊 Playing OpenAI TTS for:', text);
    } catch (error) {
      console.error('❌ OpenAI TTS error:', error);
      // Fallback to expo-speech
      await speakTextFallback(text);
      setIsPlayingPronunciation(false);
    }
  };

  // Fallback text-to-speech function using expo-speech
  const speakTextFallback = async (text: string) => {
    try {
      await Speech.stop();
      
      const languageCode = language === 'spanish' ? 'es' : 
                          language === 'french' ? 'fr' :
                          language === 'italian' ? 'it' :
                          language === 'german' ? 'de' : 'en';
      
      await Speech.speak(text, {
        language: languageCode,
        pitch: 1.0,
        rate: 0.8,
        volume: 1.0,
      });
      
      console.log('🔊 Speaking (fallback):', text, 'in language:', languageCode);
    } catch (error) {
      console.error('❌ TTS fallback error:', error);
    }
  };

  // Legacy speakText function for backward compatibility (listening steps, etc.)
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

  // Cleanup pronunciation sound on unmount
  useEffect(() => {
    return () => {
      if (pronunciationSoundRef.current) {
        pronunciationSoundRef.current.unloadAsync();
      }
    };
  }, []);

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
      {/* Course Intro Video */}
      {showIntroVideo && (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Card style={styles.introVideoCard}>
            <CardContent style={styles.introVideoContent}>
              <Text style={styles.introVideoTitle}>
                {`Welcome to Course ${courseId?.replace('course', '') || '1'}`}
              </Text>
              
              <View style={styles.videoContainer}>
                {isLoadingIntroVideo || tokenStatus === 'pending' ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>
                      {isLoadingIntroVideo ? 'Loading intro video...' : 'Preparing video...'}
                    </Text>
                  </View>
                ) : tokenStatus === 'resolved' && introVideoUrl && isAuthenticatedVideo(normalizeAssetUrl(introVideoUrl)) && !authToken ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.errorMessage}>⚠️ Authentication required</Text>
                    <Text style={styles.errorHint}>Please log in again to view this video</Text>
                  </View>
                ) : (
                  <VideoPlayer
                    key={authToken ? 'authenticated' : 'public'}
                    style={styles.video}
                    source={
                      introVideoUrl 
                        ? getVideoSourceWithAuth(normalizeAssetUrl(introVideoUrl))
                        : getFallbackVideoSource(courseId || 'course1', language || 'italian')
                    }
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay={true}
                    isMuted={false}
                  />
                )}
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
                    {tokenStatus === 'pending' ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.loadingText}>Preparing video...</Text>
                      </View>
                    ) : tokenStatus === 'resolved' && isAuthenticatedVideo(stepData.videoUrl) && !authToken ? (
                      <View style={styles.loadingContainer}>
                        <Text style={styles.errorMessage}>⚠️ Authentication required</Text>
                        <Text style={styles.errorHint}>Please log in again to view this video</Text>
                      </View>
                    ) : (
                      <VideoPlayer
                        key={authToken ? 'authenticated' : 'public'}
                        videoRef={irlVideoRef}
                        style={styles.video}
                        source={getVideoSourceWithAuth(stepData.videoUrl)}
                        useNativeControls
                        resizeMode={ResizeMode.CONTAIN}
                        shouldPlay={true}
                        onPlaybackStatusUpdate={handleVideoPlaybackStatusUpdate}
                      />
                    )}
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
                    {tokenStatus === 'pending' ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.loadingText}>Preparing video...</Text>
                      </View>
                    ) : tokenStatus === 'resolved' && isAuthenticatedVideo(stepData.videoUrl) && !authToken ? (
                      <View style={styles.loadingContainer}>
                        <Text style={styles.errorMessage}>⚠️ Authentication required</Text>
                        <Text style={styles.errorHint}>Please log in again to view this video</Text>
                      </View>
                    ) : (
                      <VideoPlayer
                        key={authToken ? 'authenticated' : 'public'}
                        videoRef={videoChoiceRef}
                        style={styles.video}
                        source={getVideoSourceWithAuth(stepData.videoUrl)}
                        useNativeControls
                        resizeMode={ResizeMode.CONTAIN}
                        shouldPlay={true}
                        onPlaybackStatusUpdate={handleVideoPlaybackStatusUpdate}
                      />
                    )}
                  </View>

                  {/* Speak-back mode for video choice */}
                  {useSpeakBackMode && !speakBackResult && (
                    <View style={styles.speakBackSection}>
                      <SpeakBackComponent
                        expectedAnswer={stepData.expectedAnswers?.[0] || videoChoiceOptions?.answer || ''}
                        alternativeAnswers={stepData.expectedAnswers?.slice(1) || []}
                        language={language || 'italian'}
                        onResult={(correct, transcription) => {
                          setSpeakBackResult({ isCorrect: correct, transcription });
                          setIsCorrect(correct);
                          setShowResult(true);
                          setStepResults(prev => ({ ...prev, [currentStep]: correct }));
                        }}
                        onSwitchToText={() => {
                          setUseSpeakBackMode(false);
                        }}
                        showPronunciationButton={true}
                      />
                    </View>
                  )}

                  {/* Speak-back result for video choice */}
                  {useSpeakBackMode && speakBackResult && (
                    <View style={styles.speakBackResultSection}>
                      <View style={[styles.resultBadgeInline, speakBackResult.isCorrect ? styles.correctBadgeInline : styles.incorrectBadgeInline]}>
                        <Ionicons 
                          name={speakBackResult.isCorrect ? "checkmark-circle" : "close-circle"} 
                          size={24} 
                          color="#fff" 
                        />
                        <Text style={styles.resultBadgeTextInline}>
                          {speakBackResult.isCorrect ? 'Correct!' : 'Not quite right'}
                        </Text>
                      </View>
                      <Text style={styles.transcriptionDisplay}>You said: "{speakBackResult.transcription}"</Text>
                      {!speakBackResult.isCorrect && (
                        <>
                          <Text style={styles.expectedAnswerHint}>Expected: "{stepData.expectedAnswers?.[0] || videoChoiceOptions?.answer || ''}"</Text>
                          <TouchableOpacity 
                            style={styles.tryAgainButtonInline}
                            onPress={() => {
                              setSpeakBackResult(null);
                              setShowResult(false);
                            }}
                          >
                            <Ionicons name="refresh" size={18} color={theme.colors.primary} />
                            <Text style={styles.tryAgainTextInline}>Try Again</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}

                  {/* Text input mode (when speak-back is off) */}
                  {!useSpeakBackMode && (
                    <View style={styles.inputContainer}>
                      <Text style={styles.inputLabel}>{stepData.answerPrompt}</Text>
                      <TextInput
                        style={styles.textInput}
                        value={selectedAnswer}
                        onChangeText={setSelectedAnswer}
                        placeholder="Type your response..."
                      />
                    </View>
                  )}
                  
                  {!useSpeakBackMode && videoChoiceOptions && videoChoiceOptions.options.length > 0 && (
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

                  {!useSpeakBackMode && !showResult && (
                    <TouchableOpacity 
                      style={styles.switchToSpeakButton}
                      onPress={() => setUseSpeakBackMode(true)}
                    >
                      <Ionicons name="mic-outline" size={18} color={theme.colors.primary} />
                      <Text style={styles.switchToSpeakText}>Use the speech option</Text>
                    </TouchableOpacity>
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
                    {tokenStatus === 'pending' ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.loadingText}>Preparing video...</Text>
                      </View>
                    ) : tokenStatus === 'resolved' && isAuthenticatedVideo(stepData.videoUrl) && !authToken ? (
                      <View style={styles.loadingContainer}>
                        <Text style={styles.errorMessage}>⚠️ Authentication required</Text>
                        <Text style={styles.errorHint}>Please log in again to view this video</Text>
                      </View>
                    ) : (
                      <VideoPlayer
                        key={authToken ? 'authenticated' : 'public'}
                        videoRef={proVideoRef}
                        style={styles.video}
                        source={getVideoSourceWithAuth(stepData.videoUrl)}
                        useNativeControls={stepData.hasAccess}
                        resizeMode={ResizeMode.CONTAIN}
                        shouldPlay={true}
                        isLooping={!stepData.hasAccess}
                        isMuted={!stepData.hasAccess}
                        onPlaybackStatusUpdate={stepData.hasAccess ? handleVideoPlaybackStatusUpdate : undefined}
                      />
                    )}
                    
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
                      {/* Speak-back mode for pro_video */}
                      {useSpeakBackMode && !speakBackResult && (
                        <View style={styles.speakBackSection}>
                          <SpeakBackComponent
                            expectedAnswer={stepData.expectedAnswers?.[0] || stepData.answer || ''}
                            alternativeAnswers={stepData.expectedAnswers?.slice(1) || []}
                            language={language || 'italian'}
                            onResult={(correct, transcription) => {
                              setSpeakBackResult({ isCorrect: correct, transcription });
                              setIsCorrect(correct);
                              setShowResult(true);
                              setStepResults(prev => ({ ...prev, [currentStep]: correct }));
                            }}
                            onSwitchToText={() => {
                              setUseSpeakBackMode(false);
                            }}
                            showPronunciationButton={true}
                          />
                        </View>
                      )}

                      {/* Speak-back result for pro_video */}
                      {useSpeakBackMode && speakBackResult && (
                        <View style={styles.speakBackResultSection}>
                          <View style={[styles.resultBadgeInline, speakBackResult.isCorrect ? styles.correctBadgeInline : styles.incorrectBadgeInline]}>
                            <Ionicons 
                              name={speakBackResult.isCorrect ? "checkmark-circle" : "close-circle"} 
                              size={24} 
                              color="#fff" 
                            />
                            <Text style={styles.resultBadgeTextInline}>
                              {speakBackResult.isCorrect ? 'Correct!' : 'Not quite right'}
                            </Text>
                          </View>
                          <Text style={styles.transcriptionDisplay}>You said: "{speakBackResult.transcription}"</Text>
                          {!speakBackResult.isCorrect && (
                            <>
                              <Text style={styles.expectedAnswerHint}>Expected: "{stepData.expectedAnswers?.[0] || stepData.answer || ''}"</Text>
                              <TouchableOpacity 
                                style={styles.tryAgainButtonInline}
                                onPress={() => {
                                  setSpeakBackResult(null);
                                  setShowResult(false);
                                }}
                              >
                                <Ionicons name="refresh" size={18} color={theme.colors.primary} />
                                <Text style={styles.tryAgainTextInline}>Try Again</Text>
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      )}

                      {/* Text input mode (when speak-back is off) */}
                      {!useSpeakBackMode && (
                        <View style={styles.inputContainer}>
                          <Text style={styles.inputLabel}>{stepData.answerPrompt}</Text>
                        </View>
                      )}
                      
                      {!useSpeakBackMode && stepData.options && stepData.options.length > 0 && (
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

                      {!useSpeakBackMode && !showResult && (
                        <TouchableOpacity 
                          style={styles.switchToSpeakButton}
                          onPress={() => setUseSpeakBackMode(true)}
                        >
                          <Ionicons name="mic-outline" size={18} color={theme.colors.primary} />
                          <Text style={styles.switchToSpeakText}>Use the speech option</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Word Review Step - Split into word intro and when to use screens */}
              {stepData && stepData.type === 'word_review' && (
                <>
                  {/* Screen 1: Word/Phrase Introduction (also shows if usage selected but no note) */}
                  {(phase1SubStep === 'word' || (phase1SubStep === 'usage' && !stepData.note)) && (
                    <View style={styles.wordReviewContainer}>
                      <Text style={styles.wordText}>{stepData.word}</Text>
                      <Text style={styles.translationLabel}>TRANSLATION</Text>
                      <Text style={styles.translationText}>{stepData.translation}</Text>
                      
                      <TouchableOpacity 
                        style={[styles.speakButton, isPlayingPronunciation && styles.speakButtonPlaying]}
                        onPress={() => playOpenAIPronunciation(stepData.word)}
                        disabled={isPlayingPronunciation}
                        activeOpacity={0.7}
                      >
                        <Ionicons name={isPlayingPronunciation ? "volume-high" : "volume-medium"} size={20} color={theme.colors.foreground} />
                        <Text style={styles.speakButtonText}>{isPlayingPronunciation ? 'Playing...' : 'Pronunciation'}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {/* Screen 2: How to Use (only shown if note exists and on usage sub-step) */}
                  {phase1SubStep === 'usage' && stepData.note && (
                    <View style={styles.whenToUseContainer}>
                      <View style={styles.whenToUseCard}>
                        <Text style={styles.whenToUseTitleCentered}>How to use</Text>
                        <View style={styles.whenToUseDivider} />
                        
                        {isLoadingEnhanced ? (
                          <View style={styles.enhancedLoadingContainer}>
                            <ActivityIndicator size="small" color={theme.colors.primary} />
                            <Text style={styles.enhancedLoadingText}>Generating tips...</Text>
                          </View>
                        ) : enhancedContent ? (
                          <View style={styles.enhancedContentContainer}>
                            {enhancedContent.pronunciation && (
                              <View style={styles.enhancedSection}>
                                <Text style={styles.enhancedSectionLabel}>Pronunciation</Text>
                                <Text style={styles.whenToUseTextCentered}>{enhancedContent.pronunciation}</Text>
                              </View>
                            )}
                            
                            {enhancedContent.genderNote && (
                              <View style={styles.enhancedSection}>
                                <Text style={styles.enhancedSectionLabel}>Male / Female</Text>
                                <Text style={styles.whenToUseTextCentered}>{enhancedContent.genderNote}</Text>
                              </View>
                            )}
                            
                            {enhancedContent.dailyLifeUsage && (
                              <View style={styles.enhancedSection}>
                                <Text style={styles.enhancedSectionLabel}>Daily Life Usage</Text>
                                <Text style={styles.whenToUseTextCentered}>{enhancedContent.dailyLifeUsage}</Text>
                              </View>
                            )}
                          </View>
                        ) : (
                          <Text style={styles.whenToUseTextCentered}>{stepData.note}</Text>
                        )}
                      </View>
                      
                      {/* DEBUG PANEL - Remove after troubleshooting */}
                      <View style={styles.debugPanel}>
                        <Text style={styles.debugTitle}>DEBUG INFO</Text>
                        <Text style={styles.debugText}>Status: {debugInfo.status}</Text>
                        <Text style={styles.debugText}>API Called: {debugInfo.apiCalled ? 'YES' : 'NO'}</Text>
                        <Text style={styles.debugText}>API URL: {debugInfo.apiUrl || '(not set)'}</Text>
                        <Text style={styles.debugText}>LessonId: {debugInfo.lessonId || '(none)'}</Text>
                        <Text style={styles.debugText}>Word: {debugInfo.word || '(none)'}</Text>
                        <Text style={styles.debugText}>Has Note: {debugInfo.hasNote ? 'YES' : 'NO'}</Text>
                        {debugInfo.error ? (
                          <Text style={styles.debugError}>Error: {debugInfo.error}</Text>
                        ) : null}
                        {debugInfo.response ? (
                          <Text style={styles.debugSuccess}>Response: {debugInfo.response.substring(0, 100)}...</Text>
                        ) : null}
                      </View>
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

                  {/* Speak-back mode for review MCQ */}
                  {useSpeakBackMode && !speakBackResult && (
                    <View style={styles.speakBackSection}>
                      <SpeakBackComponent
                        expectedAnswer={stepData.answer || ''}
                        alternativeAnswers={[]}
                        language={language || 'italian'}
                        showPronunciationButton={true}
                        onResult={(correct, transcription) => {
                          setSpeakBackResult({ isCorrect: correct, transcription });
                          setIsCorrect(correct);
                          setShowResult(true);
                          setStepResults(prev => ({ ...prev, [currentStep]: correct }));
                        }}
                        onSwitchToText={() => {
                          setUseSpeakBackMode(false);
                        }}
                      />
                    </View>
                  )}

                  {/* Speak-back result for review MCQ */}
                  {useSpeakBackMode && speakBackResult && (
                    <View style={styles.speakBackResultSection}>
                      <View style={[styles.resultBadgeInline, speakBackResult.isCorrect ? styles.correctBadgeInline : styles.incorrectBadgeInline]}>
                        <Ionicons 
                          name={speakBackResult.isCorrect ? "checkmark-circle" : "close-circle"} 
                          size={24} 
                          color="#fff" 
                        />
                        <Text style={styles.resultBadgeTextInline}>
                          {speakBackResult.isCorrect ? 'Correct!' : 'Not quite right'}
                        </Text>
                      </View>
                      <Text style={styles.transcriptionDisplay}>You said: "{speakBackResult.transcription}"</Text>
                      {!speakBackResult.isCorrect && (
                        <>
                          <Text style={styles.expectedAnswerHint}>Expected: "{stepData.answer}"</Text>
                          <TouchableOpacity 
                            style={styles.tryAgainButtonInline}
                            onPress={() => {
                              setSpeakBackResult(null);
                              setShowResult(false);
                            }}
                          >
                            <Ionicons name="refresh" size={18} color={theme.colors.primary} />
                            <Text style={styles.tryAgainTextInline}>Try Again</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  )}

                  {/* Text mode (multiple choice) for review MCQ */}
                  {!useSpeakBackMode && (
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
                  )}

                  {/* Switch to speech option button in text mode */}
                  {!useSpeakBackMode && !showResult && (
                    <TouchableOpacity 
                      style={styles.switchToSpeakButton}
                      onPress={() => setUseSpeakBackMode(true)}
                    >
                      <Ionicons name="mic-outline" size={18} color={theme.colors.primary} />
                      <Text style={styles.switchToSpeakText}>Use the speech option</Text>
                    </TouchableOpacity>
                  )}
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
                    <>
                      {stepData.type === 'text_tip' ? (
                        <Button
                          title="Continue"
                          onPress={handleNextStep}
                          style={styles.submitButton}
                        />
                      ) : stepData.type === 'word_review' ? (
                        <Button
                          title="Continue"
                          onPress={() => {
                            if (phase1SubStep === 'word' && stepData.note) {
                              setPhase1SubStep('usage');
                            } else {
                              setPhase1SubStep('word');
                              handleNextStep();
                            }
                          }}
                          style={styles.submitButton}
                        />
                      ) : (stepData.type === 'video_choice' || stepData.type === 'pro_video' || stepData.type === 'review_mcq') && useSpeakBackMode && !speakBackResult ? (
                        null
                      ) : (
                        <Button
                          title="Check Answer"
                          onPress={handleStepSubmit}
                          disabled={!selectedAnswer.trim()}
                          style={styles.submitButton}
                        />
                      )}
                    </>
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
  errorMessage: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600' as const,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
    textAlign: 'center' as const,
  },
  errorHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center' as const,
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
    width: '100%',
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    maxHeight: 500,
    borderRadius: theme.borderRadius.lg,
  },

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
  speakButtonPlaying: {
    opacity: 0.7,
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
  
  // When to Use Card Styles (Phase 1 Sub-step 2)
  whenToUseContainer: {
    gap: theme.spacing.lg,
  },
  whenToUseCard: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  whenToUseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  whenToUseTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600' as any,
    color: theme.colors.foreground,
  },
  whenToUseTitleCentered: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600' as any,
    color: theme.colors.foreground,
    textAlign: 'center' as any,
  },
  whenToUseDivider: {
    height: 1,
    backgroundColor: theme.colors.outline,
    marginVertical: theme.spacing.sm,
  },
  whenToUseText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.onSurfaceVariant,
    lineHeight: theme.fontSize.base * 1.6,
  },
  whenToUseTextCentered: {
    fontSize: theme.fontSize.base,
    color: theme.colors.onSurfaceVariant,
    lineHeight: theme.fontSize.base * 1.6,
    textAlign: 'center' as any,
  },
  enhancedLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  enhancedLoadingText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.onSurfaceVariant,
  },
  enhancedContentContainer: {
    gap: theme.spacing.md,
  },
  enhancedSection: {
    gap: theme.spacing.xs,
  },
  enhancedSectionLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600' as any,
    color: theme.colors.primary,
    textAlign: 'center' as any,
    textTransform: 'uppercase' as any,
    letterSpacing: 0.5,
  },
  backToWordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.borderRadius.lg,
    alignSelf: 'flex-start',
  },
  backToWordButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    fontWeight: '500' as any,
  },
  
  // Debug panel styles - temporary for troubleshooting
  debugPanel: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: 'rgba(255, 100, 100, 0.1)',
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 100, 100, 0.3)',
  },
  debugTitle: {
    fontSize: theme.fontSize.sm,
    fontWeight: '700' as any,
    color: '#ff6b6b',
    marginBottom: theme.spacing.sm,
    textAlign: 'center' as any,
  },
  debugText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    marginBottom: 2,
  },
  debugError: {
    fontSize: theme.fontSize.xs,
    color: '#ff6b6b',
    marginTop: theme.spacing.xs,
  },
  debugSuccess: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
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
    fontSize: theme.fontSize.lg,
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
    backgroundColor: theme.colors.primary,
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

  // Speak-back styles
  speakBackSection: {
    marginTop: theme.spacing.lg,
  },
  speakBackDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    fontWeight: '600' as any,
  },
  speakBackResultSection: {
    marginTop: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  resultBadgeInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
  },
  correctBadgeInline: {
    backgroundColor: theme.colors.checkmarkGreen,
  },
  incorrectBadgeInline: {
    backgroundColor: theme.colors.error,
  },
  resultBadgeTextInline: {
    fontSize: theme.fontSize.base,
    fontWeight: '700' as any,
    color: '#fff',
  },
  transcriptionDisplay: {
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    fontStyle: 'italic',
  },
  tryAgainButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  tryAgainTextInline: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600' as any,
    color: theme.colors.primary,
  },
  switchToSpeakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  switchToSpeakText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600' as any,
  },
  expectedAnswerHint: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  switchToSpeakButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  switchToSpeakTextSmall: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.primary,
    fontWeight: '600' as any,
  },
});