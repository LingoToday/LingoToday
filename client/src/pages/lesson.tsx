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
import type { Lesson } from "@shared/schema";

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
      // Clean the URL
      window.history.replaceState({}, '', window.location.pathname);
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
    enabled: isAuthenticated && !!language && !!courseId && !!lessonId && !notificationLessonId, // Disable if we have a notification lesson
    retry: false,
  });

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

  // Use fallback lesson if API lesson is not available, or notification lesson if coming from notification
  const apiLessonData = lesson as any; // API returns different structure
  const currentLesson = (notificationLessonId && fallbackLesson) ? fallbackLesson : apiLessonData;

  // Get current step data
  const getCurrentStepData = () => {
    if (!currentLesson?.lesson) return null;
    
    const stepKey = `step${currentStep}`;
    const stepData = currentLesson.lesson[stepKey];
    
    if (!stepData) return null;

    if (currentStep === 1) {
      return {
        type: 'learn',
        word: stepData.italian || '',
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
        stepNumber: 3, // All 3 steps completed
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

  const handleStepSubmit = () => {
    if (!stepData) return;

    let correct = false;
    
    if (currentStep === 1 && stepData.type === 'learn') {
      const answerIndex = parseInt(selectedAnswer);
      correct = stepData.quiz.options[answerIndex] === stepData.quiz.answer;
    } else if (currentStep === 2 && stepData.type === 'type') {
      const userAnswer = selectedAnswer.toLowerCase().trim();
      const expected = stepData.expected.toLowerCase();
      const alternatives = stepData.alternatives.map(alt => alt.toLowerCase());
      
      // If prompt contains underscores, validate just the missing letters
      if (stepData.prompt.includes('_')) {
        const getMissingLetters = (word: string) => {
          // Extract the missing part from the word based on the prompt pattern
          const promptParts = stepData.prompt.split('_');
          if (promptParts.length >= 2) {
            const prefix = promptParts[0];
            const suffix = promptParts[promptParts.length - 1].split('=')[0].trim();
            // Remove prefix and suffix from the expected word to get missing letters
            let missingPart = expected;
            if (prefix) missingPart = missingPart.replace(prefix.toLowerCase(), '');
            if (suffix) missingPart = missingPart.replace(suffix.toLowerCase(), '');
            return missingPart;
          }
          return expected;
        };
        
        const expectedMissing = getMissingLetters(expected);
        const alternativesMissing = alternatives.map(alt => getMissingLetters(alt));
        correct = userAnswer === expectedMissing || alternativesMissing.includes(userAnswer);
      } else {
        // For complete word/phrase exercises
        correct = userAnswer === expected || alternatives.includes(userAnswer);
      }
    } else if (currentStep === 3 && stepData.type === 'audio') {
      correct = selectedAnswer === stepData.answer;
    }

    setIsCorrect(correct);
    setShowResult(true);
    setStepResults(prev => ({ ...prev, [currentStep]: correct }));
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
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

  if (!stepData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Lesson...</h2>
            <p className="text-gray-600 mb-4">
              Please wait while we load the lesson content.
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
        
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{currentLesson?.lesson?.title || 'Lesson'}</h1>
            <p className="text-gray-600">{courseId?.replace('course', 'Course ')} - {lessonId?.replace('lesson', 'Lesson ')}</p>
            <p className="text-sm text-gray-500">Step {currentStep} of 3</p>
          </div>
        </div>

        <Card className="shadow-material-lg">
          <CardContent className="p-6">
            
            {/* Step Content */}
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
                  {stepData.type === 'learn' ? 'Quick Check' :
                   stepData.type === 'type' ? 'Fill in the Blank' :
                   'Listen and Choose'}
                </h3>
                
                {stepData.type === 'learn' && (
                  <>
                    <p className="text-gray-700 mb-4">{stepData.quiz.question}</p>
                    
                    <RadioGroup 
                      value={selectedAnswer} 
                      onValueChange={setSelectedAnswer}
                      disabled={showResult}
                      className="space-y-2 mb-4"
                    >
                      {stepData.quiz.options.map((option: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem 
                            value={index.toString()} 
                            id={`option-${index}`}
                          />
                          <Label 
                            htmlFor={`option-${index}`}
                            className={`flex-1 p-3 rounded-lg cursor-pointer transition-colors ${
                              showResult ? (
                                option === stepData.quiz.answer ? 'bg-green-50 text-green-700 border border-green-200' :
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
                          {stepData.type === 'learn' ? stepData.quiz.answer :
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
                    {fromNotification && (
                      <p className="mt-2 text-sm text-blue-600">
                        ✨ You successfully answered a notification question!
                      </p>
                    )}
                  </div>
                )}
                
                {!showResult ? (
                  <Button 
                    onClick={handleStepSubmit}
                    disabled={!selectedAnswer || (stepData?.type === 'type' && !selectedAnswer.trim())}
                    className="w-full"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button 
                    onClick={handleNextStep}
                    disabled={completeLessonMutation.isPending}
                    className={`w-full text-white ${isCorrect ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {completeLessonMutation.isPending ? 'Saving Progress...' : 
                     currentStep < 3 ? `Next Step (${currentStep + 1}/3)` : 'Complete Lesson'}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
