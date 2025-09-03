import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { 
  BookOpen, 
  Target, 
  Clock, 
  Trophy, 
  Play,
  Settings,
  Bell,
  CheckCircle2,
  Circle,
  User,
  BarChart3,
  Languages,
  Home,
  Volume2,
  RotateCcw,
  Eye,
  MessageSquare,
  ChevronDown,
  LogOut
} from "lucide-react";
import { Link } from "wouter";
import { requestNotificationPermission, setupNotifications, startDailySession, isSessionStartedToday } from "@/lib/notifications";
import { queryClient, apiRequest } from "@/lib/queryClient";
import NotificationSetupOverlay from "@/components/notification-setup-overlay";
import Footer from "@/components/ui/footer";
import { getLanguageDisplayName } from "@/lib/lessons";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  selectedLanguage?: string;
  selectedLevel?: string;
  completedOnboarding?: boolean;
}

interface ProgressData {
  courseId: string;
  lessonId: string;
  stepNumber: number;
  completed: boolean;
  score: number;
  completedAt: string | null;
  lessonTitle?: string;
  italianPhrase?: string;
  englishTranslation?: string;
  courseTitle?: string;
}

interface NextLessonData {
  courseId: string;
  lessonId: string;
  title: string;
  description: string;
  courseTitle?: string;
}

interface DashboardData {
  user: User & {
    hasSeenNotificationSetup?: boolean;
  };
  settings: {
    notificationsEnabled: boolean;
    notificationFrequency: number;
    notificationStartTime: string;
    notificationEndTime: string;
    selectedLanguage: string;
  };
  stats: {
    streak: number;
    totalLessons: number;
    wordsLearned: number;
    lessonsCompleted: number;
  };
  progress: ProgressData[];
}

export default function Dashboard() {
  const { user } = useAuth() as { user: User | null };
  const { toast } = useToast();
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
  const [showNotificationSetup, setShowNotificationSetup] = useState(false);
  const [isDailySessionActive, setIsDailySessionActive] = useState(false);

  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    enabled: !!user,
  });

  // Fetch course statistics - only for the user's selected language
  const { data: courseStats } = useQuery<{ totalCourses: number; totalLessons: number }>({
    queryKey: ["/api/course-stats", user?.selectedLanguage],
    queryFn: async () => {
      if (!user?.selectedLanguage) return { totalCourses: 0, totalLessons: 0 };
      
      const url = new URL('/api/course-stats', window.location.origin);
      url.searchParams.append('languageCode', user.selectedLanguage);
      if (user.selectedLevel) {
        url.searchParams.append('skillLevelCode', user.selectedLevel);
      }
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error('Failed to fetch course stats');
      return response.json();
    },
    enabled: !!user?.selectedLanguage,
  });



  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: { 
      notificationsEnabled?: boolean; 
      notificationFrequency?: number;
      notificationStartTime?: string;
      notificationEndTime?: string;
    }) => {
      await apiRequest("PUT", "/api/settings", updatedSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error", 
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mark notification setup as seen mutation
  const markNotificationSetupSeenMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PUT", "/api/notification-setup-status", { hasSeenNotificationSetup: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard"] });
      setShowNotificationSetup(false);
    },
    onError: (error) => {
      console.error("Failed to update notification setup status:", error);
    },
  });

  // Show notification setup overlay for first-time users
  useEffect(() => {
    if (dashboardData?.user && !dashboardData.user.hasSeenNotificationSetup) {
      // Small delay to ensure dashboard is fully loaded
      setTimeout(() => {
        setShowNotificationSetup(true);
      }, 1000);
    }
  }, [dashboardData]);

  // Check notification permission and daily session status on mount
  useEffect(() => {
    if ("Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
    
    // Check if daily session is already active
    setIsDailySessionActive(isSessionStartedToday());
  }, []);

  // Handle starting daily notification session
  const handleStartDailySession = async () => {
    try {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      
      if (permission === "granted" && user?.selectedLanguage) {
        const frequency = dashboardData?.settings?.notificationFrequency || 15;
        await startDailySession(user.selectedLanguage, frequency);
        setIsDailySessionActive(true);
        
        toast({
          title: "Daily session started!",
          description: `You'll receive ${user.selectedLanguage} lesson reminders every ${frequency} minutes.`,
        });
      } else if (permission !== "granted") {
        toast({
          title: "Permission required",
          description: "Please allow notifications to start your daily learning session.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start daily session. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Test notification function
  const handleTestNotification = async () => {
    try {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      
      if (permission === "granted") {
        const language = user?.selectedLanguage || "Italian";
        const notification = new Notification("Test Notification", {
          body: `This is a test notification for your ${language} lessons!`,
          icon: "/favicon.ico",
          tag: "lingotoday-test"
        });
        
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
        
        toast({
          title: "Test notification sent",
          description: "Check if you received the notification.",
        });
      } else {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send test notification.",
        variant: "destructive",
      });
    }
  };

  // Handle notification settings change
  const handleNotificationToggle = async (enabled: boolean) => {
    try {
      if (enabled) {
        const permission = await requestNotificationPermission();
        setNotificationPermission(permission);
        
        if (permission !== "granted") {
          toast({
            title: "Permission required",
            description: "Please allow notifications in your browser to enable this feature.",
            variant: "destructive",
          });
          return;
        }
      }

      updateSettingsMutation.mutate({ notificationsEnabled: enabled });
      
      // Setup or stop notifications based on the setting
      if (enabled && user?.selectedLanguage) {
        setupNotifications({
          enabled: true,
          language: user.selectedLanguage,
          frequency: dashboardData?.settings?.notificationFrequency || 15,
          startTime: dashboardData?.settings?.notificationStartTime || "09:00",
          endTime: dashboardData?.settings?.notificationEndTime || "18:00"
        });
        
        // Also start the daily session if not already active
        if (!isSessionStartedToday()) {
          await startDailySession(user.selectedLanguage, dashboardData?.settings?.notificationFrequency || 15);
          setIsDailySessionActive(true);
        }
      } else if (!enabled) {
        // If notifications are disabled, reset the daily session status
        setIsDailySessionActive(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive",
      });
    }
  };

  // Handle frequency change
  const handleFrequencyChange = (frequency: string) => {
    updateSettingsMutation.mutate({ notificationFrequency: parseInt(frequency) });
  };

  // Handle start time change
  const handleStartTimeChange = (startTime: string) => {
    updateSettingsMutation.mutate({ notificationStartTime: startTime });
  };

  // Handle end time change
  const handleEndTimeChange = (endTime: string) => {
    updateSettingsMutation.mutate({ notificationEndTime: endTime });
  };

  // Generate time options for dropdowns (24-hour format)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
        options.push({ value: time, label: displayTime });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  const { data: nextLesson } = useQuery<NextLessonData | null>({
    queryKey: ["/api/next-lesson"],
    enabled: !!user,
  });

  const { data: upcomingLessons = [] } = useQuery<any[]>({
    queryKey: ["/api/upcoming-lessons"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const stats = dashboardData?.stats;
  const settings = dashboardData?.settings;
  const allProgress = dashboardData?.progress || [];
  const recentProgress = allProgress.slice(0, 8);

  // Use actual recent lessons data from progress with enriched content and inject checkpoint reviews
  interface RecentLesson {
    id: string;
    title: string;
    subtitle: string;
    date: string;
    score: string;
    status: string;
    type: 'lesson' | 'checkpoint';
  }

  const recentLessonsWithCheckpoints: RecentLesson[] = recentProgress.reduce<RecentLesson[]>((acc, progress, index) => {
    // Get the appropriate language phrase based on user's selected language
    const getLanguagePhrase = (progress: any) => {
      const language = user.selectedLanguage || 'italian';
      switch (language) {
        case 'spanish':
          return progress.spanishPhrase || progress.targetPhrase;
        case 'french':
          return progress.frenchPhrase || progress.targetPhrase;
        case 'german':
          return progress.germanPhrase || progress.targetPhrase;
        case 'italian':
        default:
          return progress.italianPhrase || progress.targetPhrase;
      }
    };

    // Get lesson title from lesson ID for better display
    const getLessonTitle = (lessonId: string, courseId: string) => {
      if (lessonId?.startsWith('review')) {
        const reviewNumber = lessonId.replace('review', '');
        return `Review ${reviewNumber}`;
      }
      const lessonNumber = lessonId?.replace('lesson', '') || '';
      const courseNumber = courseId?.replace('course', '') || '';
      return `Lesson ${lessonNumber}`;
    };

    // Add the regular lesson
    const targetPhrase = getLanguagePhrase(progress);
    const lesson: RecentLesson = {
      id: `lesson-${index + 1}`,
      title: targetPhrase || getLessonTitle(progress.lessonId, progress.courseId),
      subtitle: progress.englishTranslation || progress.courseTitle || `${progress.courseId} - ${progress.lessonId}`,
      date: progress.completedAt ? new Date(progress.completedAt).toLocaleDateString('en-GB') : 'In Progress',
      score: progress.score ? `${progress.score}%` : 'N/A',
      status: progress.completedAt ? 'completed' : 'in_progress',
      type: 'lesson'
    };
    
    acc.push(lesson);
    
    // Add checkpoint review after every 4 completed lessons
    if (progress.completedAt && (index + 1) % 4 === 0) {
      const checkpointReview: RecentLesson = {
        id: `checkpoint-${Math.floor(index / 4) + 1}`,
        title: `Checkpoint Review ${Math.floor(index / 4) + 1}`,
        subtitle: `Review of lessons ${Math.max(1, index - 2)}-${index + 1}`,
        date: new Date(progress.completedAt).toLocaleDateString('en-GB'),
        score: '95%', // Simulated checkpoint score
        status: 'completed',
        type: 'checkpoint'
      };
      acc.push(checkpointReview);
    }
    
    return acc;
  }, []);
  
  const recentLessons = recentLessonsWithCheckpoints;

  // Generate learning path with accurate lesson counts from JSON files
  const courseData = [
    { name: 'Greetings', totalLessons: 13 },
    { name: 'Introducing Yourself', totalLessons: 13 },
    { name: 'Essential Courtesy Phrases', totalLessons: 13 },
    { name: 'Numbers', totalLessons: 29 },
    { name: 'Days and Dates', totalLessons: 10 }
  ];
  
  const learningPath = courseData.map((course, index) => {
    // Use ALL progress data to count completed lessons, not just recent 8
    const courseProgress = allProgress.filter(p => p.courseId === `course${index + 1}`);
    const completed = courseProgress.filter(p => p.completedAt && p.completed).length;
    const total = course.totalLessons;
    const completion = total > 0 ? (completed / total) * 100 : 0;
    
    // Debug logging for course1 to understand the data
    if (index === 0) {
      console.log('🔍 Course1 Debug:', {
        courseName: course.name,
        totalProgress: allProgress.length,
        courseProgress: courseProgress.length,
        completedCount: completed,
        courseProgressData: courseProgress.map(p => ({
          lessonId: p.lessonId,
          completed: p.completed,
          completedAt: p.completedAt
        }))
      });
    }
    
    // Determine status based on progress and availability rules
    let status = 'locked';
    if (completion === 100) {
      status = 'completed';
    } else if (completion > 0) {
      status = 'current';
    } else if (index === 0) {
      // First course is always available for new users
      status = 'available';
    } else {
      // Check if previous course is completed
      const prevCourse = courseData[index - 1];
      const prevProgress = allProgress.filter(p => p.courseId === `course${index}`);
      const prevCompleted = prevProgress.filter(p => p.completedAt && p.completed).length;
      if (prevCompleted === prevCourse.totalLessons) {
        status = 'available';
      }
    }
    
    return {
      name: course.name,
      progress: `${completed}/${total}`,
      completion,
      status
    };
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <BookOpen className="text-white text-sm" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">LingoToday</h1>
              </div>
              
              <nav className="flex space-x-8 ml-8">
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-blue-600">
                    Dashboard
                  </Button>
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2" data-testid="account-dropdown">
                    <User className="w-4 h-4" />
                    <span className="text-sm">{user.firstName || 'Account'}</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.firstName || 'User'}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <Link href="/account">
                    <DropdownMenuItem data-testid="account-menu-item">
                      <User className="w-4 h-4 mr-2" />
                      Account Settings
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => window.location.href = "/api/logout"}
                    className="text-red-600 focus:text-red-600"
                    data-testid="logout-menu-item"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Welcome Section */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {user.firstName || 'User'}!
              </h1>
              <p className="text-gray-600 mb-4">
                Continue your <span className="text-blue-600 font-medium">{getLanguageDisplayName(user.selectedLanguage || 'italian')}</span> learning journey
              </p>
              
              {/* Level and Progress */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Badge className="bg-blue-600 text-white px-3 py-1">
                    {user.selectedLevel ? user.selectedLevel.charAt(0).toUpperCase() + user.selectedLevel.slice(1).toLowerCase() : 'Beginner'}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">
                    {(() => {
                      const currentLevel = user.selectedLevel || 'beginner';
                      const lessonsCompleted = stats?.lessonsCompleted || 0;
                      
                      // Define lessons required for each level
                      const levelThresholds = {
                        beginner: { min: 0, max: 25, next: 'Intermediate' },
                        intermediate: { min: 25, max: 75, next: 'Advanced' },
                        advanced: { min: 75, max: 150, next: 'Expert' }
                      };
                      
                      const currentThreshold = levelThresholds[currentLevel as keyof typeof levelThresholds] || levelThresholds.beginner;
                      const progressInLevel = Math.max(0, lessonsCompleted - currentThreshold.min);
                      const lessonsInLevel = currentThreshold.max - currentThreshold.min;
                      const percentage = Math.min(100, Math.round((progressInLevel / lessonsInLevel) * 100));
                      
                      if (percentage >= 100) {
                        return 'Ready to advance!';
                      }
                      
                      return `${percentage}% to ${currentThreshold.next}`;
                    })()}
                  </div>
                </div>
              </div>

              {/* Stats Cards - Mobile/Desktop Responsive */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Day Streak */}
                <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-100">
                  <div className="text-2xl font-bold text-blue-600 mb-1">{stats?.streak || 0}</div>
                  <div className="text-sm text-blue-800 font-medium">Day Streak</div>
                </div>
                
                {/* Lessons Done */}
                <div className="bg-green-50 rounded-lg p-4 text-center border border-green-100">
                  <div className="text-2xl font-bold text-green-600 mb-1">{stats?.lessonsCompleted || 0}</div>
                  <div className="text-sm text-green-800 font-medium">Lessons Done</div>
                </div>
                
                {/* Words Learned */}
                <div className="bg-purple-50 rounded-lg p-4 text-center border border-purple-100">
                  <div className="text-2xl font-bold text-purple-600 mb-1">{stats?.wordsLearned || 0}</div>
                  <div className="text-sm text-purple-800 font-medium">Words Learned</div>
                </div>
              </div>
            </div>

            {/* Learning Status */}
            {stats?.lessonsCompleted === 0 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-2">
                <Circle className="w-5 h-5 text-blue-600" />
                <span className="text-blue-800 font-medium">Ready to start your {getLanguageDisplayName(user.selectedLanguage || 'italian')} learning journey</span>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">Learning in progress • {stats?.lessonsCompleted} lessons completed</span>
              </div>
            )}



            {/* Daily Session Start Button - Always show for new users or when no session is active */}
            {(!isDailySessionActive || ((stats?.lessonsCompleted || 0) === 0)) && (
              <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        Start Today's Learning Session
                      </h3>
                      <p className="text-sm text-blue-700">
                        Get personalized {getLanguageDisplayName(user.selectedLanguage || 'italian')} lesson reminders throughout the day
                      </p>
                    </div>
                    <Button 
                      onClick={handleStartDailySession}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3"
                      data-testid="start-daily-session-button"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Today's Lessons
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Daily Session Status - Only show for users with progress and active session */}
            {isDailySessionActive && ((stats?.lessonsCompleted || 0) > 0) && (
              <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-green-900">
                        Daily learning session is active
                      </div>
                      <div className="text-xs text-green-700">
                        You'll receive lesson reminders every {dashboardData?.settings?.notificationFrequency || 15} minutes
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Coming Up Next */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Coming Up Next</CardTitle>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  {upcomingLessons[0]?.category || 'Greetings'}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingLessons.length > 0 ? (
                  <>
                    {/* Next lesson - prominent display */}
                    <div className={`rounded-lg p-3 text-white ${
                      upcomingLessons[0].isReview 
                        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' 
                        : 'bg-gradient-to-r from-purple-500 to-purple-600'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            {upcomingLessons[0].isReview && (
                              <Trophy className="w-5 h-5 text-yellow-100" />
                            )}
                            <div className="text-lg font-bold">{upcomingLessons[0].title}</div>
                          </div>
                          <div className={`text-sm ${
                            upcomingLessons[0].isReview ? 'text-yellow-100' : 'text-purple-100'
                          }`}>{upcomingLessons[0].description}</div>
                        </div>
                        <Link href={
                          upcomingLessons[0].courseId === 'checkpoint' 
                            ? `/checkpoint/${upcomingLessons[0].lessonId.replace('checkpoint', '')}`
                            : upcomingLessons[0].isReview
                            ? `/checkpoint/${upcomingLessons[0].lessonId.replace('review', '')}`
                            : `/lesson/${user.selectedLanguage || 'italian'}/${upcomingLessons[0].courseId}/${upcomingLessons[0].lessonId}`
                        }>
                          <Button variant="secondary" size="sm" className={`font-medium ${
                            upcomingLessons[0].isReview 
                              ? 'bg-white text-yellow-600 hover:bg-gray-100'
                              : 'bg-white text-purple-600 hover:bg-gray-100'
                          }`}>
                            {upcomingLessons[0].isReview ? 'Review Now' : 'Start Now'}
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Upcoming lessons - compact list */}
                    <div className="space-y-2">
                      {upcomingLessons.slice(1, 5).map((lesson, index) => (
                        <div key={`${lesson.courseId}-${lesson.lessonId}`} className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                          lesson.isReview 
                            ? 'hover:bg-yellow-50 border-l-2 border-yellow-400' 
                            : 'hover:bg-gray-50'
                        }`}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            lesson.isReview 
                              ? 'bg-yellow-100 text-yellow-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {lesson.isReview ? (
                              <Trophy className="w-3 h-3" />
                            ) : (
                              index + 2
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className={`font-medium text-sm truncate ${
                              lesson.isReview ? 'text-yellow-800' : ''
                            }`}>{lesson.title}</div>
                            <div className={`text-xs truncate ${
                              lesson.isReview ? 'text-yellow-600' : 'text-gray-500'
                            }`}>{lesson.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-gray-900 mb-1">All lessons completed!</h3>
                    <p className="text-sm text-gray-600">Check back later for new content.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Lessons */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Lessons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentLessons.map((item) => (
                  <div key={item.id} className={`flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 ${
                    item.type === 'checkpoint' ? 'border-l-4 border-yellow-400 bg-yellow-50' : ''
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      item.type === 'checkpoint' 
                        ? 'bg-yellow-100' 
                        : 'bg-green-100'
                    }`}>
                      {item.type === 'checkpoint' ? (
                        <Trophy className="w-5 h-5 text-yellow-600" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        item.type === 'checkpoint' ? 'text-yellow-800' : ''
                      }`}>
                        {item.title}
                      </div>
                      <div className={`text-sm ${
                        item.type === 'checkpoint' ? 'text-yellow-700' : 'text-gray-500'
                      }`}>
                        {item.subtitle}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${
                        item.type === 'checkpoint' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {item.score || '100%'}
                      </div>
                      <div className="text-xs text-gray-500">{item.date}</div>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" className="w-full mt-4">
                  View all lessons
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Learning Path */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Learning Path</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {learningPath.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      item.status === 'completed' ? 'bg-green-600 text-white' :
                      item.status === 'current' ? 'bg-blue-600 text-white' :
                      item.status === 'available' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-200 text-gray-400'
                    }`}>
                      {item.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.progress}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.completion === 100 ? 'DONE' : 
                       item.status === 'current' ? `${Math.round(item.completion)}%` :
                       item.status === 'available' ? 'START' :
                       'LOCKED'}
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t">
                  <div className="text-center">
                    <div className="text-sm font-medium text-blue-600 mb-1">Complete {getLanguageDisplayName(user.selectedLanguage || 'italian')} Course</div>
                    <div className="text-xs text-gray-500 mb-2">
                      {courseStats ? `${courseStats.totalLessons} lessons • ${courseStats.totalCourses} courses` : 'Loading course data...'}
                    </div>
                    <Link href="/courses">
                      <Button variant="outline" size="sm" className="text-blue-600">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card data-testid="notification-settings-card">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Language</span>
                    <span className="text-sm text-gray-600">{user.selectedLanguage ? getLanguageDisplayName(user.selectedLanguage) : 'Not selected'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Frequency</span>
                    <Select 
                      value={dashboardData?.settings?.notificationFrequency?.toString() || "15"}
                      onValueChange={handleFrequencyChange}
                    >
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 min</SelectItem>
                        <SelectItem value="15">15 min</SelectItem>
                        <SelectItem value="30">30 min</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notifications Enabled</span>
                    <Switch 
                      checked={dashboardData?.settings?.notificationsEnabled || false}
                      onCheckedChange={handleNotificationToggle}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Start Time</span>
                    <Select 
                      value={dashboardData?.settings?.notificationStartTime || "09:00"}
                      onValueChange={handleStartTimeChange}
                    >
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">End Time</span>
                    <Select 
                      value={dashboardData?.settings?.notificationEndTime || "18:00"}
                      onValueChange={handleEndTimeChange}
                    >
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {notificationPermission !== "granted" && (
                    <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      Browser notifications are blocked. Click "Test Now" to enable them.
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={handleTestNotification}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Test Now
                  </Button>
                </div>

                <div className="pt-4 border-t space-y-2 text-xs text-gray-600">
                  <div>Settings</div>
                  <div>Language: {user.selectedLanguage ? getLanguageDisplayName(user.selectedLanguage) : 'Not selected'}</div>
                  <div>Level: {user.selectedLevel ? user.selectedLevel.charAt(0).toUpperCase() + user.selectedLevel.slice(1).toLowerCase() : 'Not selected'}</div>
                  <div>Notifications: {settings?.notificationsEnabled ? 'Enabled' : 'Disabled'}</div>
                </div>
              </CardContent>
            </Card>

            {/* Learning Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Learning Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Lessons Completed</span>
                    <span className="font-medium">{stats?.lessonsCompleted || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Streak</span>
                    <span className="font-medium">{stats?.streak || 0} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Words Learned</span>
                    <span className="font-medium">{stats?.wordsLearned || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Learning Language</span>
                    <span className="font-medium">{user.selectedLanguage ? getLanguageDisplayName(user.selectedLanguage) : 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Level</span>
                    <span className="font-medium">{user.selectedLevel ? user.selectedLevel.charAt(0).toUpperCase() + user.selectedLevel.slice(1).toLowerCase() : 'Not selected'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>


          </div>
        </div>
      </div>
      
      {/* Notification Setup Overlay for First-time Users */}
      <NotificationSetupOverlay 
        isVisible={showNotificationSetup} 
        onClose={() => markNotificationSetupSeenMutation.mutate()} 
      />
      
      <Footer />
    </div>
  );
}