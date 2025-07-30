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
  const { language, week, day } = useParams();
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [fromNotification, setFromNotification] = useState(false);

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
      if (fromNotification && language && week && day) {
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
  }, [isAuthenticated, isLoading, toast, fromNotification, language, week, day]);

  const { data: lesson, isLoading: lessonLoading, error: lessonError } = useQuery<Lesson>({
    queryKey: ["/api/lessons", language, week, day],
    enabled: isAuthenticated && !!language && !!week && !!day,
    retry: false,
  });

  // Fallback: try to get lesson from stored data if API fails
  const [fallbackLesson, setFallbackLesson] = useState<Lesson | null>(null);
  
  useEffect(() => {
    if (lessonError && !lesson) {
      // Try to get lesson from stored data
      const expectedLessonId = `${language}_w${week}_d${day}`;
      const storedLesson = getLessonById(expectedLessonId);
      
      if (storedLesson) {
        console.log('Using fallback lesson from stored data:', expectedLessonId);
        setFallbackLesson(storedLesson as Lesson);
      } else {
        // Try session storage lesson ID from notification
        const notificationLessonId = sessionStorage.getItem('notification-lesson-id');
        if (notificationLessonId) {
          const notificationLesson = getLessonById(notificationLessonId);
          if (notificationLesson) {
            console.log('Using lesson from notification ID:', notificationLessonId);
            setFallbackLesson(notificationLesson as Lesson);
          }
        }
      }
    }
  }, [lessonError, lesson, language, week, day]);

  // Use fallback lesson if API lesson is not available
  const currentLesson = lesson || fallbackLesson;

  const completeLessonMutation = useMutation({
    mutationFn: async (score: number) => {
      await apiRequest("POST", "/api/progress", {
        language,
        week: parseInt(week!),
        day: parseInt(day!),
        lessonId: currentLesson!.id,
        completed: true,
        score,
        completedAt: new Date(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress", language] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats", language] });
      
      toast({
        title: "Lesson completed!",
        description: "Great job! Returning to dashboard...",
      });
      
      // Auto-redirect to dashboard after lesson completion and restart timer from there
      setTimeout(() => {
        window.location.href = "/dashboard?completed=true";
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

  const handleQuizSubmit = () => {
    if (!selectedAnswer || !currentLesson?.quiz) return;
    
    const answerIndex = parseInt(selectedAnswer);
    const correct = answerIndex === currentLesson.quiz.correct;
    setIsCorrect(correct);
    setShowResult(true);
  };

  const handleCompleteLesson = () => {
    const score = isCorrect ? 100 : 0;
    completeLessonMutation.mutate(score);
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

  if (isLoading || (lessonLoading && !fallbackLesson)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-semibold text-gray-900">{currentLesson.title}</h1>
            <p className="text-gray-600">Week {week}, Day {day}</p>
          </div>
        </div>

        <Card className="shadow-material-lg">
          <CardContent className="p-6">
            
            {/* Lesson Content */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-6 mb-6">
              <div className="text-center">
                <div className="text-3xl mb-4">{currentLesson.emoji}</div>
                <h2 className="text-3xl font-bold text-primary-700 mb-2">{currentLesson.content.word}</h2>
                <p className="text-primary-600 text-xl mb-4">{currentLesson.content.translation}</p>
                <p className="text-primary-500 text-sm mb-4">{currentLesson.content.pronunciation}</p>
                <Button 
                  onClick={() => speakText(currentLesson.content.word)}
                  className="bg-primary-500 text-white hover:bg-primary-600"
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Listen
                </Button>
              </div>
            </div>
            
            {/* Example Usage */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Example Usage</h3>
              <div className="space-y-2 text-gray-700">
                <p><strong>{language ? language.charAt(0).toUpperCase() + language.slice(1) : 'Language'}:</strong> {currentLesson.content.example}</p>
                <p><strong>English:</strong> {currentLesson.content.exampleTranslation}</p>
              </div>
            </div>
            
            {/* Quiz */}
            {currentLesson.quiz && (
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Check</h3>
                <p className="text-gray-700 mb-4">{currentLesson.quiz.question}</p>
                
                <RadioGroup 
                  value={selectedAnswer} 
                  onValueChange={setSelectedAnswer}
                  disabled={showResult}
                  className="space-y-2 mb-4"
                >
                  {currentLesson.quiz.options.map((option: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem 
                        value={index.toString()} 
                        id={`option-${index}`}
                        className={showResult ? (
                          index === currentLesson.quiz.correct ? 'border-success-500 text-success-500' :
                          index.toString() === selectedAnswer ? 'border-red-500 text-red-500' :
                          'border-gray-300'
                        ) : ''}
                      />
                      <Label 
                        htmlFor={`option-${index}`}
                        className={`flex-1 p-3 rounded-lg cursor-pointer transition-colors ${
                          showResult ? (
                            index === currentLesson.quiz.correct ? 'bg-success-50 text-success-700' :
                            index.toString() === selectedAnswer ? 'bg-red-50 text-red-700' :
                            'bg-gray-50'
                          ) : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {showResult && (
                  <div className={`p-4 rounded-lg mb-4 ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center">
                      <Check className={`h-5 w-5 mr-2 ${isCorrect ? 'text-green-600' : 'text-red-600'}`} />
                      <span className={`font-medium ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                        {isCorrect ? 'Correct! Well done!' : 'Incorrect'}
                      </span>
                    </div>
                    {!isCorrect && (
                      <p className="mt-2 text-sm text-red-700">
                        The correct answer is: <strong>{currentLesson.quiz.options[currentLesson.quiz.correct]}</strong>
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
                    onClick={handleQuizSubmit}
                    disabled={!selectedAnswer}
                    className="w-full"
                  >
                    Submit Answer
                  </Button>
                ) : (
                  <Button 
                    onClick={handleCompleteLesson}
                    disabled={completeLessonMutation.isPending}
                    className={`w-full text-white ${isCorrect ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {completeLessonMutation.isPending ? 'Saving Progress...' : 'Complete Lesson'}
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
