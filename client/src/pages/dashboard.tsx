import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Bell, Play, Check, ArrowRight, BarChart3, BookOpen, Settings, Shuffle } from "lucide-react";
import NotificationSettings from "@/components/notification-settings";
import ProgressOverview from "@/components/progress-overview";
import LessonModal from "@/components/lesson-modal";
import { useState } from "react";
import { Link } from "wouter";
import { initializeLessonStore } from "@/lib/lessonStore";
import type { DashboardData, Lesson, User } from "@shared/schema";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth() as { user: User | null; isAuthenticated: boolean; isLoading: boolean };
  const { toast } = useToast();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

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
  }, [isAuthenticated, isLoading, toast]);

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    enabled: isAuthenticated,
    retry: false,
  });

  // Initialize lesson store when dashboard data is loaded
  useEffect(() => {
    if (dashboardData?.settings?.selectedLanguage && dashboardData?.progress) {
      const completedLessonIds = dashboardData.progress.map(p => `${p.language}_w${p.week}_d${p.day}`);
      
      // Clear any old cached data and force reload from API
      console.log('🔄 Clearing lesson cache and reloading from API...');
      localStorage.removeItem('deskLingo_lessons');
      
      initializeLessonStore(dashboardData.settings.selectedLanguage, completedLessonIds)
        .then(() => {
          console.log('✅ Lesson store initialized successfully with fresh API data');
        })
        .catch(error => {
          console.error('❌ Failed to initialize lesson store:', error);
        });
    }
  }, [dashboardData]);

  const { data: currentLesson } = useQuery<Lesson>({
    queryKey: ["/api/lessons", dashboardData?.settings?.selectedLanguage, "2", "3"],
    enabled: !!dashboardData?.settings?.selectedLanguage,
    retry: false,
  });

  if (isLoading || dashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData || !dashboardData.settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <Globe className="h-16 w-16 text-primary-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to DeskLingo!</h2>
            <p className="text-gray-600 mb-6">
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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Globe className="text-white text-sm" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">DeskLingo</h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-700 hover:text-primary-500 transition-colors">Dashboard</Link>
              <span className="text-gray-700 hover:text-primary-500 transition-colors">Lessons</span>
              <span className="text-gray-700 hover:text-primary-500 transition-colors">Progress</span>
              <span className="text-gray-700 hover:text-primary-500 transition-colors">Settings</span>
            </nav>
            
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                {settings.notificationsEnabled && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-warning-500 rounded-full"></span>
                )}
              </Button>
              
              <div className="flex items-center space-x-2">
                {user?.profileImageUrl && (
                  <img 
                    src={user.profileImageUrl} 
                    alt="User profile" 
                    className="w-8 h-8 rounded-full object-cover" 
                  />
                )}
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.firstName || user?.email?.split('@')[0] || 'User'}
                </span>
                <Button variant="ghost" size="sm" onClick={() => window.location.href = "/api/logout"}>
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
          <Card className="shadow-material">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-4 lg:mb-0">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                    Welcome back, {user?.firstName || user?.email?.split('@')[0] || 'there'}!
                  </h2>
                  <p className="text-gray-600">
                    Continue your {settings.selectedLanguage.charAt(0).toUpperCase() + settings.selectedLanguage.slice(1)} learning journey
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="bg-primary-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-primary-600">{stats.streak}</div>
                    <div className="text-sm text-gray-600">Day Streak</div>
                  </div>
                  <div className="bg-success-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-success-600">{stats.totalLessons}</div>
                    <div className="text-sm text-gray-600">Lessons Done</div>
                  </div>
                  <div className="bg-secondary-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-secondary-600">{stats.wordsLearned}</div>
                    <div className="text-sm text-gray-600">Words Learned</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Dashboard Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Current Lesson Card */}
            <Card className="shadow-material">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Today's Lesson</h3>
                  <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                    Week 2, Day 3
                  </span>
                </div>
                
                {currentLesson && (
                  <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg p-6 text-white mb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-xl font-semibold mb-2">{currentLesson.title}</h4>
                        <p className="text-primary-100">{currentLesson.description}</p>
                      </div>
                      <div className="text-3xl">{currentLesson.emoji}</div>
                    </div>
                    
                    <div className="bg-white/10 rounded-lg p-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold mb-2">{currentLesson.content.word}</div>
                        <div className="text-primary-100 text-lg">{currentLesson.content.translation}</div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="mt-3 bg-white/20 hover:bg-white/30 text-white"
                        onClick={() => {
                          if ('speechSynthesis' in window) {
                            const utterance = new SpeechSynthesisUtterance(currentLesson.content.word);
                            utterance.lang = settings.selectedLanguage === 'spanish' ? 'es-ES' : 'en-US';
                            speechSynthesis.speak(utterance);
                          }
                        }}
                      >
                        <Bell className="h-4 w-4 mr-2" />
                        Listen
                      </Button>
                    </div>
                    
                    <Button 
                      className="w-full bg-white text-primary-600 font-semibold hover:bg-gray-50"
                      onClick={() => setSelectedLesson(currentLesson)}
                    >
                      Start Lesson
                    </Button>
                  </div>
                )}
                
                {/* Quick Practice */}
                <div className="border-t pt-4">
                  <h5 className="font-medium text-gray-900 mb-3">Quick Practice</h5>
                  <div className="space-y-3">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between p-3 bg-gray-50 hover:bg-gray-100 h-auto"
                    >
                      <span className="font-medium">What does "gracias" mean?</span>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between p-3 bg-gray-50 hover:bg-gray-100 h-auto"
                    >
                      <span className="font-medium">Translate: "Good morning"</span>
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
                
                <div className="space-y-3">
                  {progress.length > 0 ? progress.map((lesson: any, index: number) => (
                    <div key={lesson.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <div className={`w-10 h-10 ${lesson.completed ? 'bg-success-500' : 'bg-warning-500'} rounded-lg flex items-center justify-center text-white mr-3`}>
                        {lesson.completed ? <Check className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">Lesson {lesson.week}-{lesson.day}</div>
                        <div className="text-sm text-gray-500">
                          Week {lesson.week}, Day {lesson.day} • {lesson.completed ? 'Completed' : 'In Progress'}
                        </div>
                      </div>
                      <div className={`${lesson.completed ? 'text-success-600' : 'text-warning-600'} font-semibold`}>
                        {lesson.score || 0}%
                      </div>
                    </div>
                  )) : (
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
