import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Volume2, Check, Bell } from "lucide-react";
import { Link } from "wouter";
import { getLessonById } from "@/lib/lessonStore";
import { resetNotificationCooldown } from "@/lib/notifications";
import type { Lesson, UserProgress } from "@shared/schema";
import Footer from "@/components/ui/footer";

export default function Lesson() {
  const { language, courseId, lessonId } = useParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [fromNotification, setFromNotification] = useState(false);
  const [stepResults, setStepResults] = useState<{[key: number]: boolean}>({});
  const [showIntroVideo, setShowIntroVideo] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showVideoControls, setShowVideoControls] = useState(true);

  // Check if user came from notification and handle lesson ID
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('from') === 'notification') {
      setFromNotification(true);
      const lessonId = urlParams.get('id');
      if (lessonId) {
        console.log('Notification with lesson ID:', lessonId);
        // Store lesson ID for fallback data loading
        sessionStorage.setItem('notification-lesson-id', lessonId);
      }
      // Clean the URL to remove notification parameters but preserve other params
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("User not authenticated on lesson page, redirecting to login");
      
      // If coming from notification, preserve the lesson URL for after login
      if (fromNotification && language && courseId && lessonId) {
        const currentUrl = window.location.pathname + window.location.search;
        sessionStorage.setItem('redirect-after-login', currentUrl);
        console.log("Stored redirect URL for after login:", currentUrl);
      }
      
      toast({
        title: "Please log in",
        description: "Redirecting to login page...",
        variant: "default",
      });
      
      const redirectToLogin = () => {
        window.location.href = "/api/login";
      };
      setTimeout(redirectToLogin, 1000);
      return;
    }
  }, [isAuthenticated, isLoading, toast, fromNotification, language, courseId, lessonId]);

  // Check for notification lesson ID first
  const [notificationLessonId, setNotificationLessonId] = useState<string | null>(null);
  
  useEffect(() => {
    if (fromNotification) {
      const storedLessonId = sessionStorage.getItem('notification-lesson-id');
      if (storedLessonId) {
        setNotificationLessonId(storedLessonId);
        console.log('Found notification lesson ID:', storedLessonId);
      }
    }
  }, [fromNotification]);

  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useQuery<Lesson>({
    queryKey: ["/api/courses", language, courseId, lessonId],
    enabled: isAuthenticated && !!language && !!courseId && !!lessonId, // Always enable API query, we'll decide later which to use
    retry: 2, // Allow retries for better reliability
  });

  // Fetch user progress to determine if they should see intro video
  const { data: userProgress = [] } = useQuery({
    queryKey: ['/api/progress', language],
    enabled: isAuthenticated && !!language,
  }) as { data: UserProgress[] };

  // Fallback: try to get lesson from stored data if API fails or if we have a notification lesson
  const [fallbackLesson, setFallbackLesson] = useState<Lesson | null>(null);
  
  useEffect(() => {
    // If coming from notification, prioritize the notification lesson
    if (notificationLessonId) {
      const notificationLesson = getLessonById(notificationLessonId);
      if (notificationLesson) {
        console.log('Using lesson from notification ID:', notificationLessonId);
        setFallbackLesson(notificationLesson as Lesson);
        return;
      }
    }
    
    // Fallback to URL-based lesson if API fails
    if (lessonError && !lesson) {
      const expectedLessonId = `${language}_${courseId}_${lessonId}`;
      const storedLesson = getLessonById(expectedLessonId);
      
      if (storedLesson) {
        console.log('Using fallback lesson from stored data:', expectedLessonId);
        setFallbackLesson(storedLesson as Lesson);
      }
    }
  }, [notificationLessonId, lessonError, lesson, language, courseId, lessonId]);

  // Check if this is Italian course1 lesson1 and if intro video should be shown
  useEffect(() => {
    if (language === 'italian' && courseId === 'course1' && lessonId === 'lesson1' && userProgress !== undefined) {
      // Check for reset parameter to clear localStorage
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('reset') === 'video') {
        localStorage.removeItem('italian_course1_intro_shown');
        console.log('🎬 Video localStorage cleared - video will show');
        // Clean the URL
        window.history.replaceState({}, '', window.location.pathname);
      }
      
      // Check if user has completed any Italian lessons
      const hasCompletedItalianLessons = userProgress.some(p => p.completed);
      const hasSeenIntroVideo = localStorage.getItem('italian_course1_intro_shown');
      
      // Show video if: user has no completed lessons OR if explicitly reset OR if localStorage flag not set
      if (!hasCompletedItalianLessons) {
        // For new learners, always show the video (clear localStorage if it exists)
        if (hasSeenIntroVideo) {
          localStorage.removeItem('italian_course1_intro_shown');
          console.log('🎬 Clearing localStorage for new learner - video will show');
        }
        setShowIntroVideo(true);
        console.log('🎬 Showing intro video for new Italian learner');
      } else if (!hasSeenIntroVideo) {
        // For returning learners who somehow don't have the localStorage flag
        setShowIntroVideo(true);
        console.log('🎬 Showing intro video for Italian Course 1');
      } else {
        console.log('🎬 Video already seen by experienced learner, skipping');
      }
    }
  }, [language, courseId, lessonId, userProgress]);

  const handleContinueFromIntro = () => {
    localStorage.setItem('italian_course1_intro_shown', 'true');
    setShowIntroVideo(false);
  };

  // Use fallback lesson if API lesson is not available, or notification lesson if coming from notification
  const apiLessonData = lesson as any; // API returns different structure
  
  // Priority: 1. API lesson (if available), 2. Fallback lesson (from cached data)
  const currentLesson = apiLessonData || fallbackLesson;
  
  console.log('🎯 Lesson selection:', {
    hasApiLesson: !!apiLessonData,
    hasFallbackLesson: !!fallbackLesson,
    fromNotification,
    selectedLesson: currentLesson ? 'found' : 'none',
    apiLessonKeys: apiLessonData ? Object.keys(apiLessonData) : 'none',
    showIntroVideo
  });

  // Get current step data
  const getCurrentStepData = () => {
    if (!currentLesson?.lesson) return null;
    
    // Handle IRL video lessons (check both lesson content and step content)
    const firstStep = currentLesson.lesson?.steps?.[0];
    if (firstStep?.stepType === 'irl_video' || firstStep?.content?.isIRLLesson) {
      return {
        type: 'irl_video',
        videoUrl: firstStep.content.videoUrl || '',
        prompt: firstStep.content.word || '',
        expectedAnswers: firstStep.content.expectedAnswers || []
      };
    }
    
    // Handle review lessons (MCQ format)
    if (currentLesson.lesson.mode === 'mcq' && currentLesson.lesson.questions) {
      // For review lessons, treat each question as a "step"
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
        // Step 1: Word Review ONLY (no quiz)
        return {
          type: 'word_review',
          word: currentLesson.lesson.content.word || '',
          translation: currentLesson.lesson.content.translation || '',
          audio: currentLesson.lesson.content.audio || '',
          note: currentLesson.lesson.content.note || ''
        };
      } else if (currentStep === 2) {
        // Step 2: Quick Check ONLY (multiple choice quiz)
        return {
          type: 'quick_check',
          question: currentLesson.lesson.quiz.question || '',
          options: currentLesson.lesson.quiz.options || [],
          answer: currentLesson.lesson.quiz.options?.[currentLesson.lesson.quiz.correct] || ''
        };
      } else if (currentStep === 3) {
        // Step 3: Typing practice (fill in the blank with the word)
        const word = currentLesson.lesson.content.word || '';
        const translation = currentLesson.lesson.content.translation || '';
        
        // Generate proper fill-in-the-blank format
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
        
        const fillInPrompt = generateFillInText(word);
        const missingLetters = getMissingLetters(word);
        
        return {
          type: 'type',
          prompt: `${fillInPrompt} = ${translation}`,
          expected: missingLetters,
          alternatives: [missingLetters.toLowerCase(), missingLetters.toUpperCase()]
        };
      } else if (currentStep === 4) {
        // Step 4: Audio comprehension - use JSON step3 data
        const step3Data = currentLesson.lesson.step3;
        if (step3Data) {
          return {
            type: 'audio',
            audioSentence: step3Data.audio_sentence || '',
            options: step3Data.options || [],
            answer: step3Data.answer || (step3Data.options && step3Data.options[0]) || ''
          };
        }
        
        // Fallback if no step3 data
        const word = currentLesson.lesson.content.word || '';
        const translation = currentLesson.lesson.content.translation || '';
        return {
          type: 'audio',
          audioSentence: word,
          options: [
            translation,
            'Hello!',
            'Goodbye!',
            'Good night!'
          ],
          answer: translation
        };
      }
      return null;
    }
    
    // Handle old lesson format (with step1, step2, step3 properties) - fallback for compatibility
    const stepKey = `step${currentStep}`;
    const stepData = currentLesson.lesson[stepKey];
    
    if (!stepData) return null;

    if (currentStep === 1) {
      return {
        type: 'learn',
        word: stepData.italian || stepData.spanish || stepData.french || stepData.german || '',
        translation: stepData.english || '',
        audio: stepData.audio || '',
        note: stepData.note || '',
        quiz: {
          question: stepData.mcq?.question || '',
          options: stepData.mcq?.options || [],
          answer: stepData.mcq?.answer || ''
        }
      };
    } else if (currentStep === 2) {
      return {
        type: 'type',
        prompt: stepData.type_prompt || '',
        expected: stepData.expected_answer || '',
        alternatives: stepData.alt_answers || []
      };
    } else if (currentStep === 3) {
      return {
        type: 'audio',
        audioSentence: stepData.audio_sentence || '',
        options: stepData.options || [],
        answer: stepData.answer || ''
      };
    }
    return null;
  };

  const stepData = getCurrentStepData();

  const completeLessonMutation = useMutation({
    mutationFn: async (score: number) => {
      await apiRequest("POST", "/api/progress", {
        language,
        courseId: courseId || "course1", // Use URL courseId or default
        lessonId: lessonId || currentLesson!.id,
        stepNumber: 4, // All 4 steps completed
        completed: true,
        score,
        completedAt: new Date(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress", language] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats", language] });
      
      // Refresh notification progress so next notification shows correct lesson
      import("@/lib/notifications").then(({ refreshNotificationProgress }) => {
        refreshNotificationProgress();
      });
      
      toast({
        title: "Lesson completed!",
        description: "Great job! Returning to dashboard...",
      });
      
      // Auto-redirect to dashboard after lesson completion and restart timer from there
      setTimeout(() => {
        window.location.href = "/?completed=true";
      }, 2000);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        const redirectToLogin = () => {
          window.location.href = "/api/login";
        };
        setTimeout(redirectToLogin, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save lesson progress. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Helper function to normalize text for comparison (remove accents, extra spaces, etc.)
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .normalize('NFD') // Decompose accented characters
      .replace(/[\u0300-\u036f]/g, ''); // Remove accent marks
  };

  const handleStepSubmit = () => {
    if (!stepData) return;

    let correct = false;
    
    if (stepData.type === 'irl_video') {
      // Handle IRL video lesson text input validation
      const userAnswer = normalizeText(selectedAnswer);
      const expectedAnswers = stepData.expectedAnswers || [];
      
      // Check if user answer matches any expected answer
      correct = expectedAnswers.some((expected: string) => {
        const normalizedExpected = normalizeText(expected);
        // Exact match or partial match (for flexibility)
        return userAnswer === normalizedExpected || 
               normalizedExpected.includes(userAnswer) ||
               userAnswer.includes(normalizedExpected.split(' ')[0]); // Match first word
      });
    } else if (stepData.type === 'review_mcq') {
      // Handle review MCQ questions
      correct = selectedAnswer === stepData.answer;
    } else if (stepData.type === 'word_review') {
      // Step 1: Word review - go directly to next step without showing result
      handleNextStep();
      return;
    } else if (stepData.type === 'quick_check') {
      // Step 2: Quick check MCQ
      correct = selectedAnswer === stepData.answer;
    } else if (currentStep === 1 && stepData.type === 'learn') {
      const answerIndex = parseInt(selectedAnswer);
      correct = stepData.quiz?.options[answerIndex] === stepData.quiz?.answer;
    } else if (stepData.type === 'type') {
      const userAnswer = normalizeText(selectedAnswer);
      const expected = normalizeText(stepData.expected || '');
      const alternatives = (stepData.alternatives || []).map((alt: string) => normalizeText(alt));
      
      // If prompt contains underscores, validate just the missing letters
      if (stepData.prompt.includes('_')) {
        const getMissingLetters = (word: string, prompt: string) => {
          const normalizedWord = normalizeText(word);
          const normalizedPrompt = normalizeText(prompt.split('=')[0].trim());
          
          // Find all underscore positions
          const underscorePositions = [];
          for (let i = 0; i < normalizedPrompt.length; i++) {
            if (normalizedPrompt[i] === '_') {
              underscorePositions.push(i);
            }
          }
          
          if (underscorePositions.length === 0) return normalizedWord;
          
          // Extract characters that correspond to underscore positions
          let missingLetters = '';
          
          // For consecutive underscores, find the missing segment
          const firstUnderscore = underscorePositions[0];
          const lastUnderscore = underscorePositions[underscorePositions.length - 1];
          
          // Get prefix (everything before first underscore)
          const prefix = normalizedPrompt.substring(0, firstUnderscore);
          // Get suffix (everything after last underscore) 
          const suffix = normalizedPrompt.substring(lastUnderscore + 1);
          
          // Find where prefix ends in word and suffix starts
          let startIndex = 0;
          let endIndex = normalizedWord.length;
          
          if (prefix && normalizedWord.includes(prefix)) {
            const prefixIndex = normalizedWord.indexOf(prefix);
            startIndex = prefixIndex + prefix.length;
          }
          
          if (suffix && normalizedWord.includes(suffix)) {
            const suffixIndex = normalizedWord.indexOf(suffix);
            if (suffixIndex > startIndex) {
              endIndex = suffixIndex;
            }
          }
          
          missingLetters = normalizedWord.substring(startIndex, endIndex);
          
          return missingLetters;
        };
        
        const expectedMissing = getMissingLetters(stepData.expected, stepData.prompt);
        const alternativesMissing = (stepData.alternatives || []).map((alt: string) => getMissingLetters(alt, stepData.prompt));
        
        // More flexible matching for missing letters
        const isExactMatch = userAnswer === expectedMissing || alternativesMissing.includes(userAnswer);
        
        // Add fuzzy matching for fill-in-the-blank exercises
        const isFuzzyMatch = !isExactMatch && (
          // Check if user answer contains the expected missing letters (for partial credit)
          expectedMissing.includes(userAnswer) || userAnswer.includes(expectedMissing) ||
          // Check if any alternative missing parts match partially
          alternativesMissing.some((altMissing: string) => 
            altMissing.includes(userAnswer) || userAnswer.includes(altMissing)
          ) ||
          // Check for minor character differences (1-2 character difference)
          alternativesMissing.some((altMissing: string) => 
            Math.abs(userAnswer.length - altMissing.length) <= 2 && 
            Array.from(userAnswer).filter((char, i) => char !== altMissing[i]).length <= 2
          ) ||
          (Math.abs(userAnswer.length - expectedMissing.length) <= 2 && 
           Array.from(userAnswer).filter((char, i) => char !== expectedMissing[i]).length <= 2)
        );
        
        correct = isExactMatch || isFuzzyMatch;
        
        // Debug logging to help troubleshoot
        console.log('🔍 Fill-in-blank validation:', {
          prompt: stepData.prompt,
          userAnswer,
          expected: stepData.expected,
          expectedMissing,
          alternatives: stepData.alternatives,
          alternativesMissing,
          isExactMatch,
          isFuzzyMatch,
          correct
        });
      } else {
        // For complete word/phrase exercises - also check for partial matches and common variations
        const isExactMatch = userAnswer === expected || alternatives.includes(userAnswer);
        
        // Additional fuzzy matching for common typos and variations
        const isFuzzyMatch = !isExactMatch && (
          // Check if the user's answer is contained within the expected answer
          expected.includes(userAnswer) ||
          // Check if any alternative contains the user's answer
          alternatives.some((alt: string) => alt.includes(userAnswer)) ||
          // Check for minor character differences (1-2 character difference)
          (Math.abs(userAnswer.length - expected.length) <= 2 && 
           Array.from(userAnswer).filter((char, i) => char !== expected[i]).length <= 2)
        );
        
        correct = isExactMatch || isFuzzyMatch;
        
        // Debug logging
        console.log('🔍 Complete word validation:', {
          userAnswer,
          expected,
          alternatives,
          isExactMatch,
          isFuzzyMatch,
          correct
        });
      }
    } else if (stepData.type === 'audio') {
      correct = selectedAnswer === stepData.answer;
    }

    setIsCorrect(correct);
    setShowResult(true);
    setStepResults(prev => ({ ...prev, [currentStep]: correct }));
  };

  const handleNextStep = () => {
    // Handle IRL video lessons (single step completion)
    if (stepData?.type === 'irl_video') {
      const score = isCorrect ? 100 : 50; // Give partial credit even for incorrect answers
      completeLessonMutation.mutate(score);
      return;
    }
    
    // Handle review lessons differently
    if (stepData?.isReview) {
      if (currentStep < stepData.totalQuestions) {
        setCurrentStep(currentStep + 1);
        setSelectedAnswer("");
        setShowResult(false);
        setIsCorrect(false);
      } else {
        // Calculate final score based on all questions for review
        const correctAnswers = Object.values(stepResults).filter(Boolean).length;
        const totalQuestions = stepData.totalQuestions;
        const score = Math.round((correctAnswers / totalQuestions) * 100);
        completeLessonMutation.mutate(score);
      }
    } else {
      // Handle regular lessons
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
        setSelectedAnswer("");
        setShowResult(false);
        setIsCorrect(false);
      } else {
        // Calculate final score based on all steps
        const correctSteps = Object.values(stepResults).filter(Boolean).length;
        const totalSteps = 3;
        const score = Math.round((correctSteps / totalSteps) * 100);
        completeLessonMutation.mutate(score);
      }
    }
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'spanish' ? 'es-ES' : 
                     language === 'french' ? 'fr-FR' :
                     language === 'italian' ? 'it-IT' :
                     language === 'german' ? 'de-DE' : 'en-US';
      speechSynthesis.speak(utterance);
    }
  };

  if (isLoading || lessonLoading || (!currentLesson && !lessonError)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  // For debugging, let's show the lesson even if stepData is null temporarily
  if (!currentLesson) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Lesson Not Found</h2>
            <p className="text-gray-600 mb-4">
              The requested lesson could not be found.
            </p>
            <Link href="/">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Debug logging to understand why stepData is null
  if (!stepData) {
    console.log('❌ Step data is null. Debugging info:', {
      currentLesson: currentLesson ? 'present' : 'null',
      currentStep,
      lessonKeys: currentLesson ? Object.keys(currentLesson) : 'no lesson',
      lessonLessonKeys: currentLesson?.lesson ? Object.keys(currentLesson.lesson) : 'no lesson.lesson',
      fromNotification,
      notificationLessonId,
      lessonId,
      courseId,
      language
    });

    // If we're coming from notification and don't have any lesson data, try to get the next lesson
    if (fromNotification && !fallbackLesson && !apiLessonData) {
      console.log('🔄 Notification lesson failed and API lesson not found, trying to find a working lesson...');
      
      // Try to get the next available lesson from the API
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Lesson...</h2>
              <p className="text-gray-600 mb-4">
                The lesson from the notification couldn't be found. Redirecting to available lessons...
              </p>
              <Link href="/dashboard">
                <Button>Go to Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Lesson Structure Issue</h2>
            <p className="text-gray-600 mb-4">
              Unable to load lesson content. The lesson data may have an unexpected format.
            </p>
            <Link href="/">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        
        {/* Notification Banner */}
        {fromNotification && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <Bell className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-blue-800 font-medium">Welcome back!</p>
                <p className="text-blue-600 text-sm">You clicked on a notification. Let's answer this question!</p>
              </div>
            </div>
          </div>
        )}

        {/* Italian Course 1 Intro Video */}
        {showIntroVideo && (
          <div className="mb-6">
            <Card className="shadow-lg">
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Welcome to Italian Beginners Course!
                </h2>
                <div className="flex justify-center mb-6">
                  <video 
                    controls 
                    autoPlay
                    muted
                    className="w-96 h-[28rem] rounded-lg shadow-lg"
                    data-testid="italian-course-intro-video"
                  >
                    <source src="/attached_assets/Italian_beginner_course1_intro_1757082612339.MP4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <Button 
                  onClick={handleContinueFromIntro}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
                  data-testid="continue-from-intro-button"
                >
                  Continue to Lesson
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Header - Hide when showing intro video */}
        {!showIntroVideo && (
          <div className="flex items-center mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{currentLesson?.lesson?.title || 'Lesson'}</h1>
              <p className="text-gray-600">{courseId?.replace('course', 'Course ')} - {lessonId?.replace('lesson', 'Lesson ').replace('review', 'Review ')}</p>
              {stepData?.isReview ? (
                <p className="text-sm text-gray-500">Question {currentStep} of {stepData.totalQuestions}</p>
              ) : stepData?.type === 'irl_video' ? (
                null
              ) : (
                <p className="text-sm text-gray-500">Step {currentStep} of 4</p>
              )}
            </div>
          </div>
        )}

        {/* Lesson Content - Hide when showing intro video */}
        {!showIntroVideo && (
          <Card className="shadow-material-lg">
            <CardContent className="p-6">
            
            {/* Step Content */}
            {stepData && stepData.type === 'irl_video' && (
              <>
                {/* IRL Video Lesson */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 mb-6">
                  <div className="text-center">
                    <p className="text-purple-600 text-lg mb-6">{stepData.prompt}</p>
                  </div>
                </div>

                {/* Video Player */}
                <div className="flex justify-center mb-6">
                  <video 
                    controls={showVideoControls}
                    className="w-80 h-[28rem] rounded-lg shadow-lg object-cover"
                    style={{ 
                      aspectRatio: '9/16',
                      backgroundColor: 'transparent',
                      WebkitAppearance: 'none',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    data-testid="irl-video-player"
                    playsInline
                    webkit-playsinline="true"
                    preload="metadata"
                    onPlay={() => {
                      setIsVideoPlaying(true);
                      setShowVideoControls(true);
                    }}
                    onPause={() => {
                      setIsVideoPlaying(false);
                    }}
                    onEnded={() => {
                      setIsVideoPlaying(false);
                    }}
                    onClick={() => {
                      // Toggle controls visibility on tap (mobile)
                      setShowVideoControls(!showVideoControls);
                    }}
                    onLoadedMetadata={(e) => {
                      // Ensure video is ready and remove any default overlays
                      const video = e.target as HTMLVideoElement;
                      video.style.backgroundColor = 'transparent';
                    }}
                  >
                    <source src={stepData.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>

                {/* Text Input for Response */}
                <div className="mb-6">
                  <label htmlFor="irl-response" className="block text-sm font-medium text-gray-700 mb-2">
                    Your response in Italian:
                  </label>
                  <input
                    id="irl-response"
                    type="text"
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    placeholder="Type your response here..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    data-testid="irl-response-input"
                  />
                  <details className="mt-2">
                    <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 select-none">
                      💡 Hints (click to reveal)
                    </summary>
                    <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                      {stepData.expectedAnswers.join(', ')}
                    </div>
                  </details>
                </div>
              </>
            )}

            {stepData && stepData.type === 'review_mcq' && (
              <>
                {/* Review MCQ Question */}
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl mb-4">🔄</div>
                    <h2 className="text-2xl font-bold text-orange-700 mb-4">Review Question</h2>
                    <p className="text-orange-600 text-lg mb-2">{stepData.question}</p>
                  </div>
                </div>
              </>
            )}

            {stepData && stepData.type === 'word_review' && (
              <>
                {/* Word Review Step - Display word and translation with note */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl mb-4">👋</div>
                    <h2 className="text-3xl font-bold text-blue-700 mb-2">{stepData.word}</h2>
                    <p className="text-blue-600 text-xl mb-4">{stepData.translation}</p>
                    <Button 
                      onClick={() => speakText(stepData.word)}
                      className="bg-blue-500 text-white hover:bg-blue-600"
                    >
                      <Volume2 className="h-4 w-4 mr-2" />
                      Listen
                    </Button>
                  </div>
                </div>
                
                {/* Usage Note */}
                {stepData.note && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4 mb-6">
                    <div className="text-blue-800">
                      <p className="font-medium mb-1">Usage Note</p>
                      <p className="text-sm">{stepData.note}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {stepData && stepData.type === 'quick_check' && (
              <>
                {/* Quick Check Step - Multiple choice quiz */}
                <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg p-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl mb-4">🎯</div>
                    <h2 className="text-2xl font-bold text-indigo-700 mb-4">Quick Check</h2>
                    <p className="text-indigo-600 text-lg mb-2">{stepData.question}</p>
                  </div>
                </div>

                {/* Multiple Choice Options */}
                <RadioGroup 
                  value={selectedAnswer} 
                  onValueChange={setSelectedAnswer}
                  disabled={showResult}
                  className="space-y-2 mb-4"
                >
                  {stepData.options?.map((option: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={option} 
                        id={`quick-check-option-${index}`}
                      />
                      <Label 
                        htmlFor={`quick-check-option-${index}`}
                        className={`flex-1 p-3 rounded-lg cursor-pointer transition-colors ${
                          showResult ? (
                            option === stepData.answer ? 'bg-green-50 text-green-700 border border-green-200' :
                            selectedAnswer === option ? 'bg-red-50 text-red-700 border border-red-200' :
                            'bg-gray-50 text-gray-500 border border-gray-200'
                          ) : (
                            selectedAnswer === option ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                          )
                        }`}
                      >
                        {option} {option === stepData.answer && showResult && '✅'}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </>
            )}

            {stepData && stepData.type === 'learn' && (
              <>
                {/* Learn Step - Display word and translation */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl mb-4">👋</div>
                    <h2 className="text-3xl font-bold text-blue-700 mb-2">{stepData.word}</h2>
                    <p className="text-blue-600 text-xl mb-4">{stepData.translation}</p>
                    <Button 
                      onClick={() => speakText(stepData.word)}
                      className="bg-blue-500 text-white hover:bg-blue-600"
                    >
                      <Volume2 className="h-4 w-4 mr-2" />
                      Listen
                    </Button>
                  </div>
                </div>
                
                {/* Usage Note */}
                {stepData.note && (
                  <div className="bg-blue-50 border-l-4 border-blue-400 rounded-lg p-4 mb-6">
                    <div className="text-blue-800">
                      <p className="font-medium mb-1">Usage Note</p>
                      <p className="text-sm">{stepData.note}</p>
                    </div>
                  </div>
                )}
              </>
            )}

            {stepData && stepData.type === 'type' && (
              <>
                {/* Type Step - Fill in the blank */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl mb-4">✏️</div>
                    <h2 className="text-2xl font-bold text-green-700 mb-4">Type Practice</h2>
                    <p className="text-green-600 text-lg mb-2">{stepData.prompt}</p>
                    <div className="text-sm text-green-600 mb-4 font-medium">
                      {stepData.prompt.includes('_') ? 
                        'Complete the word by filling in the missing letters' : 
                        'Type the complete word or phrase'}
                    </div>
                    <input
                      type="text"
                      value={selectedAnswer}
                      onChange={(e) => setSelectedAnswer(e.target.value)}
                      className="w-full max-w-xs p-2 border border-gray-300 rounded-lg text-center text-lg"
                      placeholder={stepData.prompt.includes('_') ? 'Enter missing letters...' : 'Type your answer...'}
                      disabled={showResult}
                    />
                  </div>
                </div>
              </>
            )}

            {stepData && stepData.type === 'audio' && (
              <>
                {/* Audio Step - Listen and choose */}
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl mb-4">🎧</div>
                    <h2 className="text-2xl font-bold text-purple-700 mb-4">Listen and choose</h2>
                    <Button 
                      onClick={() => speakText(stepData.audioSentence)}
                      className="bg-purple-500 text-white hover:bg-purple-600 mb-4"
                    >
                      <Volume2 className="h-4 w-4 mr-2" />
                      Play Audio
                    </Button>
                  </div>
                </div>
              </>
            )}
            
            {/* Quiz Section */}
            {stepData && (
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  {stepData.type === 'review_mcq' ? 'Choose the correct answer' :
                   stepData.type === 'word_review' ? '' :
                   stepData.type === 'quick_check' ? '' :
                   stepData.type === 'irl_video' ? '' :
                   stepData.type === 'learn' ? 'Quick Check' :
                   stepData.type === 'type' ? 'Fill in the Blank' :
                   'Listen and Choose'}
                </h3>

                {stepData.type === 'review_mcq' && (
                  <RadioGroup 
                    value={selectedAnswer} 
                    onValueChange={setSelectedAnswer}
                    disabled={showResult}
                    className="space-y-2 mb-4"
                  >
                    {stepData.options.map((option: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value={option} 
                          id={`review-option-${index}`}
                        />
                        <Label 
                          htmlFor={`review-option-${index}`}
                          className={`flex-1 p-3 rounded-lg cursor-pointer transition-colors ${
                            showResult ? (
                              option === stepData.answer ? 'bg-green-50 text-green-700 border border-green-200' :
                              option === selectedAnswer ? 'bg-red-50 text-red-700 border border-red-200' :
                              'bg-gray-50'
                            ) : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
                
                {stepData.type === 'learn' && stepData.quiz && (
                  <>
                    <p className="text-gray-700 mb-4">{stepData.quiz.question}</p>
                    
                    <RadioGroup 
                      value={selectedAnswer} 
                      onValueChange={setSelectedAnswer}
                      disabled={showResult}
                      className="space-y-2 mb-4"
                    >
                      {stepData.quiz.options?.map((option: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value={index.toString()} 
                            id={`option-${index}`}
                          />
                          <Label 
                            htmlFor={`option-${index}`}
                            className={`flex-1 p-3 rounded-lg cursor-pointer transition-colors ${
                              showResult ? (
                                option === stepData.quiz?.answer ? 'bg-green-50 text-green-700 border border-green-200' :
                                index.toString() === selectedAnswer ? 'bg-red-50 text-red-700 border border-red-200' :
                                'bg-gray-50'
                              ) : 'bg-gray-50 hover:bg-gray-100'
                            }`}
                          >
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </>
                )}

                {stepData.type === 'audio' && (
                  <RadioGroup 
                    value={selectedAnswer} 
                    onValueChange={setSelectedAnswer}
                    disabled={showResult}
                    className="space-y-2 mb-4"
                  >
                    {stepData.options.map((option: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value={option} 
                          id={`audio-option-${index}`}
                        />
                        <Label 
                          htmlFor={`audio-option-${index}`}
                          className={`flex-1 p-3 rounded-lg cursor-pointer transition-colors ${
                            showResult ? (
                              option === stepData.answer ? 'bg-green-50 text-green-700 border border-green-200' :
                              option === selectedAnswer ? 'bg-red-50 text-red-700 border border-red-200' :
                              'bg-gray-50'
                            ) : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {showResult && (
                  <div className={`p-4 rounded-lg mb-4 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center">
                      <Check className={`h-5 w-5 mr-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`} />
                      <span className={`font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                        {isCorrect ? 'Correct! Well done!' : 'Incorrect'}
                      </span>
                    </div>
                    {!isCorrect && stepData && (
                      <p className="mt-2 text-sm text-red-700">
                        The correct answer is: <strong>
                          {stepData.type === 'review_mcq' ? stepData.answer :
                           stepData.type === 'word_review' ? 'N/A' :
                           stepData.type === 'quick_check' ? stepData.answer :
                           stepData.type === 'learn' ? stepData.quiz.answer :
                           stepData.type === 'type' ? (
                             stepData.prompt.includes('_') ? (
                               // Show just the missing letters for fill-in-the-blank
                               (() => {
                                 const promptParts = stepData.prompt.split('_');
                                 if (promptParts.length >= 2) {
                                   const prefix = promptParts[0];
                                   const suffix = promptParts[promptParts.length - 1].split('=')[0].trim();
                                   let missingPart = stepData.expected.toLowerCase();
                                   if (prefix) missingPart = missingPart.replace(prefix.toLowerCase(), '');
                                   if (suffix) missingPart = missingPart.replace(suffix.toLowerCase(), '');
                                   return missingPart;
                                 }
                                 return stepData.expected;
                               })()
                             ) : stepData.expected
                           ) :
                           stepData.type === 'audio' ? stepData.answer : ''}
                        </strong>
                      </p>
                    )}
                  </div>
                )}
                
                {!showResult ? (
                  <Button 
                    onClick={handleStepSubmit}
                    disabled={stepData?.type === 'word_review' ? false : (!selectedAnswer || (stepData?.type === 'type' && !selectedAnswer.trim()))}
                    className="w-full"
                  >
                    {stepData?.type === 'word_review' ? 'Continue' : 'Submit Answer'}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleNextStep}
                    disabled={completeLessonMutation.isPending}
                    className={`w-full text-white ${isCorrect ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {completeLessonMutation.isPending ? 'Saving Progress...' : 
                     stepData?.isReview ? (
                       currentStep < stepData.totalQuestions ? `Next Question (${currentStep + 1}/${stepData.totalQuestions})` : 'Complete Review'
                     ) : stepData?.type === 'irl_video' ? (
                       'Complete Challenge'
                     ) : (
                       currentStep < 4 ? `Next Step (${currentStep + 1}/4)` : 'Complete Lesson'
                     )}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
        )}
      </div>
      
      <Footer />
    </div>
  );
}
