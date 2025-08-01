import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Bell, Play, Check, ArrowRight, BarChart3, BookOpen, Settings, Shuffle, Rocket, Volume2, Calendar, Star } from "lucide-react";
import NotificationSettings from "@/components/notification-settings";
import ProgressOverview from "@/components/progress-overview";
import LessonModal from "@/components/lesson-modal";
import LessonProgress from "@/components/lesson-progress";
import { useState } from "react";
import { Link } from "wouter";
import { initializeLessonStore, getNextLessonToLearn, getLessonsInOrder, getNextLessons, getLessonById } from "@/lib/lessonStore";
import { startDailySession, isSessionStartedToday } from "@/lib/notifications";
import type { DashboardData, Lesson, User } from "@shared/schema";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth() as { user: User | null; isAuthenticated: boolean; isLoading: boolean };
  const { toast } = useToast();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [upcomingLessons, setUpcomingLessons] = useState<any[]>([]);
  const [recentLessonsWithDetails, setRecentLessonsWithDetails] = useState<any[]>([]);
  const [sessionStarted, setSessionStarted] = useState(false);

  // Check if session is started today and handle lesson completion
  useEffect(() => {
    const isStarted = isSessionStartedToday();
    setSessionStarted(isStarted);
    console.log('📅 Session started today:', isStarted);
    
    // Check if user just completed a lesson
    const urlParams = new URLSearchParams(window.location.search);
    const justCompleted = urlParams.get('completed') === 'true';
    
    if (justCompleted) {
      console.log('🎉 User just completed a lesson, restarting notification timer');
      // Clean the URL
      window.history.replaceState({}, '', window.location.pathname);
      
      // Show success message
      toast({
        title: "Lesson completed!",
        description: "Great job! Your next notification will arrive soon.",
      });
      
      // Set a new notification cooldown to prevent immediate notification
      // This ensures the next notification comes after the proper interval
      const now = Date.now();
      localStorage.setItem('lastNotificationTime', now.toString());
      console.log('⏰ Set notification cooldown after lesson completion');
    }
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
    
    // Check for post-login redirect (from notifications)
    if (isAuthenticated && !isLoading) {
      const redirectUrl = sessionStorage.getItem('redirect-after-login');
      if (redirectUrl) {
        console.log('Redirecting after login to:', redirectUrl);
        sessionStorage.removeItem('redirect-after-login');
        // Use a slight delay to ensure dashboard is fully loaded
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 500);
      }
    }
  }, [isAuthenticated, isLoading, toast]);

  // Function to reset lesson progression (for testing)
  const resetLessonProgression = () => {
    localStorage.removeItem('lastShownLessonId');
    console.log('🔄 Reset lesson progression - will start from first lesson');
    toast({
      title: "Lesson progression reset",
      description: "Next notification will start from the first lesson",
    });
  };

  // Mutation to reset all user progress from database
  const resetProgressMutation = useMutation({
    mutationFn: async () => {
      const language = dashboardData?.settings?.selectedLanguage || 'italian';
      const response = await fetch(`/api/progress/${language}/reset`, {
        method: 'DELETE',
        credentials: 'same-origin'
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset progress');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Clear local storage
      localStorage.removeItem('deskLingo_lessons');
      localStorage.removeItem('lastShownLessonId');
      localStorage.removeItem('lastNotificationTime');
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      
      toast({
        title: "Progress Reset Successfully",
        description: "All your progress has been cleared. You'll start fresh from italian course1, lesson1.",
      });
      
      console.log('✅ All user progress cleared, starting fresh from course1/lesson1');
    },
    onError: (error) => {
      console.error('❌ Failed to reset progress:', error);
      toast({
        title: "Reset Failed",
        description: "Could not reset your progress. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Function to handle complete progress reset
  const handleResetAllProgress = () => {
    if (window.confirm('Are you sure you want to reset ALL your progress? This will clear all completed lessons and you\'ll start from the beginning. This action cannot be undone.')) {
      resetProgressMutation.mutate();
    }
  };

  // Function to start daily session
  const handleStartDailySession = async () => {
    if (!dashboardData?.settings?.selectedLanguage) {
      toast({
        title: "Setup Required",
        description: "Please configure your language settings first.",
        variant: "destructive",
      });
      return;
    }

    // Check notification permission first
    if (!("Notification" in window)) {
      toast({
        title: "Notifications Not Supported",
        description: "Your browser doesn't support notifications.",
        variant: "destructive",
      });
      return;
    }

    if (Notification.permission === "denied") {
      toast({
        title: "Notifications Blocked",
        description: "Please enable notifications in your browser settings and refresh the page.",
        variant: "destructive",
      });
      return;
    }

    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast({
          title: "Permission Required",
          description: "Please allow notifications to start your daily session.",
          variant: "destructive",
        });
        return;
      }
    }

    const language = dashboardData.settings.selectedLanguage;
    const interval = dashboardData.settings.notificationFrequency || 15;
    
    console.log(`🌅 Starting daily session: ${language} every ${interval} minutes`);
    startDailySession(language, interval);
    setSessionStarted(true);
    
    toast({
      title: "Daily Session Started!",
      description: `Your first lesson will arrive in 10 seconds, then every ${interval} minutes.`,
    });
  };

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Initialize lesson store when dashboard data is loaded
  useEffect(() => {
    if (dashboardData?.settings?.selectedLanguage) {
      // Get completed lesson IDs from progress data (could be empty array if no progress)
      const completedLessonIds = (dashboardData.progress || [])
        .filter(p => p.completed)
        .map(p => p.lessonId);
      
      console.log('🔍 Debug completed lesson IDs:', completedLessonIds);
      console.log('🔍 Debug progress data:', dashboardData.progress);
      
      // Clear any old cached data and force reload from API
      console.log('🔄 Clearing lesson cache and reloading from API...');
      localStorage.removeItem('deskLingo_lessons');
      
      initializeLessonStore(dashboardData.settings.selectedLanguage, completedLessonIds)
        .then(() => {
          console.log('✅ Lesson store initialized successfully with fresh API data');
          
          // Get the next lesson to learn based on progress
          const nextLesson = getNextLessonToLearn(completedLessonIds);
          if (nextLesson) {
            console.log('📚 Next lesson to learn:', nextLesson.title, nextLesson.category);
            console.log('📚 Next lesson ID:', nextLesson.id);
            setCurrentLesson(nextLesson);
          } else {
            console.log('❌ No next lesson found!');
          }
          
          // Get upcoming lessons (next 3-5 lessons)
          const upcomingList = getNextLessons(completedLessonIds, 5);
          console.log('📅 Upcoming lessons:', upcomingList.map(l => l.title));
          setUpcomingLessons(upcomingList);
          
          // Get completed lessons with details for Recent Lessons section
          const completedLessonsWithDetails = dashboardData.progress
            .filter(p => p.completed)
            .sort((a, b) => {
              const dateA = a.completedAt || a.updatedAt;
              const dateB = b.completedAt || b.updatedAt;
              return new Date(dateB || 0).getTime() - new Date(dateA || 0).getTime();
            })
            .slice(0, 5)
            .map(progressItem => {
              const lessonData = getLessonById(progressItem.lessonId);
              return {
                ...progressItem,
                lessonData: lessonData
              };
            })
            .filter(item => item.lessonData); // Only include items where we found lesson data
          
          setRecentLessonsWithDetails(completedLessonsWithDetails);
        })
        .catch(error => {
          console.error('❌ Failed to initialize lesson store:', error);
        });
    }
  }, [dashboardData]);

  // Remove the old query - we now get currentLesson from the lesson store

  if (isLoading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData || !dashboardData.settings) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4 glass-card border-border/40">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow">
              <Globe className="text-primary-foreground text-2xl" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Welcome to DeskLingo!</h2>
            <p className="text-muted-foreground mb-6">
              Let's set up your language learning preferences to get started.
            </p>
            <NotificationSettings />
          </CardContent>
        </Card>
      </div>
    );
  }

  const { settings, stats, progress } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Globe className="text-white text-sm" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">DeskLingo</h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-900 hover:text-primary transition-colors font-medium">Dashboard</Link>
              <Link href="/courses" className="text-gray-600 hover:text-primary transition-colors font-medium">Courses</Link>
              <span className="text-gray-600 hover:text-primary transition-colors font-medium">Progress</span>
              <span className="text-gray-600 hover:text-primary transition-colors font-medium">Settings</span>
            </nav>
            
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4 text-gray-600" />
                {settings.notificationsEnabled && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></span>
                )}
              </Button>
              
              <div className="flex items-center space-x-2">
                {user?.profileImageUrl && (
                  <img 
                    src={user.profileImageUrl} 
                    alt="User profile" 
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-200" 
                  />
                )}
                <span className="text-sm font-medium text-gray-900 hidden sm:block">
                  {user?.firstName || user?.email?.split('@')[0] || 'User'}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-600 hover:text-gray-900" 
                  onClick={() => window.location.href = "/api/logout"}
                >
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome & Status Section */}
        <div className="mb-8">
          <Card className="bg-white border border-gray-200 shadow-card">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-6 lg:mb-0">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome back, {user?.firstName || user?.email?.split('@')[0] || 'there'}!
                  </h2>
                  <p className="text-gray-600">
                    Continue your <span className="text-primary font-semibold">{settings.selectedLanguage.charAt(0).toUpperCase() + settings.selectedLanguage.slice(1)}</span> learning journey
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">{stats.streak}</div>
                    <div className="text-xs text-gray-600 font-medium">Day Streak</div>
                  </div>
                  <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">{stats.totalLessons}</div>
                    <div className="text-xs text-gray-600 font-medium">Lessons Done</div>
                  </div>
                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">{stats.wordsLearned}</div>
                    <div className="text-xs text-gray-600 font-medium">Words Learned</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Dashboard Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Daily Session Start Card */}
            {!sessionStarted && (
              <Card className="bg-gradient-to-r from-blue-500 to-purple-600 border-0 shadow-lg">
                <CardContent className="p-6 text-white text-center">
                  <Rocket className="h-12 w-12 mx-auto mb-4 text-white" />
                  <h3 className="text-2xl font-bold mb-2">Ready to Learn Today?</h3>
                  <p className="text-white/80 mb-6">
                    Start your daily learning session to receive lesson notifications every {dashboardData?.settings?.notificationFrequency || 15} minutes
                  </p>
                  
                  {/* Notification permission warning */}
                  {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied' && (
                    <div className="bg-red-500/20 border border-red-300/30 rounded-lg p-3 mb-4 text-white">
                      <div className="flex items-center justify-center space-x-2">
                        <Bell className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          Notifications are blocked - Enable them in your browser settings first
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={handleStartDailySession}
                      className="bg-white text-blue-600 hover:bg-gray-100 font-bold py-3 px-8 text-lg w-full"
                      size="lg"
                    >
                      Start Today's Lessons
                    </Button>
                    
                    {/* Reset all progress button */}
                    <Button 
                      onClick={handleResetAllProgress}
                      variant="outline"
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30 text-sm"
                      size="sm"
                      disabled={resetProgressMutation.isPending}
                    >
                      {resetProgressMutation.isPending ? '🔄 Resetting...' : '🗑️ Reset All Progress'}
                    </Button>
                    
                    {/* Test notification button */}
                    <Button 
                      onClick={async () => {
                        console.log('🧪 Testing notification manually...');
                        console.log('🔍 Notification permission:', 'Notification' in window ? Notification.permission : 'Not supported');
                        
                        if ('Notification' in window && Notification.permission === 'granted') {
                          try {
                            const notification = new Notification('🎓 DeskLingo Test', {
                              body: 'Test notification working! Click to open lesson.',
                              icon: '/favicon.ico',
                              tag: 'test-' + Date.now()
                            });
                            
                            notification.onclick = () => {
                              console.log('Test notification clicked');
                              window.focus();
                            };
                            
                            console.log('✅ Test notification created successfully');
                          } catch (error) {
                            console.error('❌ Test notification failed:', error);
                          }
                        } else {
                          console.log('❌ Cannot create test notification - permission not granted');
                        }
                      }}
                      variant="outline"
                      className="bg-white/20 border-white/30 text-white hover:bg-white/30 text-sm"
                      size="sm"
                    >
                      Test Notification
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Session Active Status */}
            {sessionStarted && (
              <Card className="bg-green-50 border border-green-200 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-700 font-medium">
                      Daily session active - notifications every {dashboardData?.settings?.notificationFrequency || 15} minutes
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Coming Up Next Card */}
            <Card className="bg-white border border-gray-200 shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Coming Up Next</h3>
                  <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-full text-sm font-medium border border-purple-200">
                    {(currentLesson as any)?.category || 'Greetings & Politeness'}
                  </span>
                </div>
                
                {/* Upcoming Lessons List */}
                <div className="space-y-4">
                  {upcomingLessons.length > 0 ? (
                    upcomingLessons.slice(0, 4).map((lesson, index) => (
                      <div 
                        key={lesson.id} 
                        className={`border rounded-xl p-4 transition-all hover:shadow-md cursor-pointer ${
                          index === 0 
                            ? 'bg-gradient-to-r from-primary to-primary-600 text-white border-primary' 
                            : 'bg-white border-gray-200 hover:border-primary/30'
                        }`}
                        onClick={() => setSelectedLesson(lesson)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="text-2xl">{lesson.emoji}</div>
                              <div>
                                <h4 className={`font-bold text-lg ${index === 0 ? 'text-white' : 'text-gray-900'}`}>
                                  {lesson.title}
                                </h4>
                                <p className={`text-sm ${index === 0 ? 'text-white/80' : 'text-gray-600'}`}>
                                  {lesson.category}
                                </p>
                              </div>
                            </div>
                            
                            {index === 0 && lesson.content && (
                              <div className="bg-white/10 border border-white/20 rounded-lg p-3 mt-3">
                                <div className="text-center">
                                  <div className="text-xl font-bold mb-1">{lesson.content.word}</div>
                                  <div className="text-white/80">{lesson.content.translation}</div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {index === 0 && (
                            <Button 
                              className="ml-4 bg-white text-primary font-bold hover:bg-gray-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedLesson(lesson);
                              }}
                            >
                              Start Now
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : currentLesson ? (
                    <div className="bg-gradient-to-r from-primary to-primary-600 rounded-2xl p-6 text-white">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-bold mb-2">{currentLesson.title}</h4>
                          <p className="text-white/80">{currentLesson.description}</p>
                        </div>
                        <div className="text-3xl">{currentLesson.emoji}</div>
                      </div>
                      
                      <div className="bg-white/10 border border-white/20 rounded-xl p-4 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold mb-2">{currentLesson.content.word}</div>
                          <div className="text-white/80 text-lg">{currentLesson.content.translation}</div>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full bg-white text-primary font-bold py-3 hover:bg-gray-50"
                        onClick={() => setSelectedLesson(currentLesson)}
                      >
                        Start Lesson
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>Loading upcoming lessons...</p>
                    </div>
                  )}
                </div>
                
                {/* Quick Practice */}
                <div className="border-t border-gray-200 pt-6">
                  <h5 className="font-bold text-gray-900 mb-4">Quick Practice</h5>
                  <div className="space-y-3">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg h-auto"
                    >
                      <span className="font-medium text-gray-900">What does "gracias" mean?</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg h-auto"
                    >
                      <span className="font-medium text-gray-900">Translate: "Good morning"</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Recent Lessons */}
            <Card className="shadow-material">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Lessons</h3>
                
                <div className="space-y-4">
                  {recentLessonsWithDetails.length > 0 ? recentLessonsWithDetails.map((item: any, index: number) => (
                    <div key={item.id} className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white">
                            <Check className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{item.lessonData?.title || 'Lesson'}</div>
                            <div className="text-sm text-gray-500 flex items-center space-x-2">
                              <span>{item.lessonData?.category || item.courseId}</span>
                              <span>•</span>
                              <span className="flex items-center space-x-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(item.completedAt || item.updatedAt).toLocaleDateString()}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1 text-yellow-600">
                            <Star className="h-4 w-4 fill-current" />
                            <span className="text-sm font-semibold">{item.score || 0}%</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Lesson Content Preview */}
                      {item.lessonData?.content && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="text-lg font-bold text-gray-900">{item.lessonData.content.word}</div>
                              <div className="text-gray-600">{item.lessonData.content.translation}</div>
                              {item.lessonData.content.example && (
                                <div className="text-sm text-gray-500 mt-1 italic">
                                  "{item.lessonData.content.example}"
                                </div>
                              )}
                            </div>
                            
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="ml-3 text-primary hover:text-primary-600"
                              onClick={() => {
                                if ('speechSynthesis' in window && item.lessonData?.content?.word) {
                                  const utterance = new SpeechSynthesisUtterance(item.lessonData.content.word);
                                  utterance.lang = settings.selectedLanguage === 'spanish' ? 'es-ES' : 
                                                  settings.selectedLanguage === 'italian' ? 'it-IT' : 'en-US';
                                  speechSynthesis.speak(utterance);
                                }
                              }}
                            >
                              <Volume2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {/* Quiz Answer if available */}
                      {item.lessonData?.quiz && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Quiz:</span> {item.lessonData.quiz.question}
                          <div className="text-green-600 font-medium mt-1">
                            ✓ {item.lessonData.quiz.options[item.lessonData.quiz.correct]}
                          </div>
                        </div>
                      )}
                    </div>
                  )) : progress.filter(p => p.completed).length > 0 ? (
                    <div className="space-y-3">
                      {progress.filter(p => p.completed).slice(0, 3).map((lesson: any, index: number) => (
                        <div key={lesson.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white mr-3">
                            <Check className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{lesson.courseId}</div>
                            <div className="text-sm text-gray-500">
                              {lesson.lessonId} • Completed
                            </div>
                          </div>
                          <div className="text-green-600 font-semibold">
                            {lesson.score || 0}%
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>No lessons completed yet. Start your first lesson above!</p>
                    </div>
                  )}
                </div>
                
                <Button variant="outline" className="mt-4 w-full">
                  View All Lessons
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Learning Progress */}
            <LessonProgress completedLessonIds={progress.map(p => p.lessonId)} />
            
            {/* Notification Settings */}
            <NotificationSettings />
            
            {/* Progress Overview */}
            <ProgressOverview />
            
            {/* Quick Actions */}
            <Card className="shadow-material">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                
                <div className="space-y-3">
                  <Button variant="ghost" className="w-full justify-start bg-gray-50 hover:bg-gray-100">
                    <Shuffle className="h-4 w-4 text-primary-500 mr-3" />
                    Random Practice
                  </Button>
                  
                  <Button variant="ghost" className="w-full justify-start bg-gray-50 hover:bg-gray-100">
                    <BookOpen className="h-4 w-4 text-secondary-500 mr-3" />
                    Review Words
                  </Button>
                  
                  <Button variant="ghost" className="w-full justify-start bg-gray-50 hover:bg-gray-100">
                    <BarChart3 className="h-4 w-4 text-success-500 mr-3" />
                    View Statistics
                  </Button>
                  
                  <Button variant="ghost" className="w-full justify-start bg-gray-50 hover:bg-gray-100">
                    <Settings className="h-4 w-4 text-gray-500 mr-3" />
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Lesson Modal */}
      {selectedLesson && (
        <LessonModal 
          lesson={selectedLesson}
          language={settings.selectedLanguage}
          onClose={() => setSelectedLesson(null)}
        />
      )}
    </div>
  );
}
