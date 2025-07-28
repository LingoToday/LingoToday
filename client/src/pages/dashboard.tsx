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
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="bg-card/50 backdrop-blur-xl border-b border-border/40 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-700 rounded-xl flex items-center justify-center shadow-glow">
                <Globe className="text-primary-foreground text-sm" />
              </div>
              <h1 className="text-xl font-bold text-foreground">DeskLingo</h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-foreground hover:text-primary transition-colors font-medium">Dashboard</Link>
              <span className="text-muted-foreground hover:text-primary transition-colors font-medium">Lessons</span>
              <span className="text-muted-foreground hover:text-primary transition-colors font-medium">Progress</span>
              <span className="text-muted-foreground hover:text-primary transition-colors font-medium">Settings</span>
            </nav>
            
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" className="relative glass-card hover-lift">
                <Bell className="h-4 w-4 text-foreground" />
                {settings.notificationsEnabled && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-secondary-500 rounded-full shadow-glow"></span>
                )}
              </Button>
              
              <div className="flex items-center space-x-2">
                {user?.profileImageUrl && (
                  <img 
                    src={user.profileImageUrl} 
                    alt="User profile" 
                    className="w-8 h-8 rounded-full object-cover border-2 border-primary/20" 
                  />
                )}
                <span className="text-sm font-medium text-foreground hidden sm:block">
                  {user?.firstName || user?.email?.split('@')[0] || 'User'}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-muted-foreground hover:text-foreground" 
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
          <Card className="glass-card border-border/40 shadow-card hover-lift">
            <CardContent className="p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="mb-6 lg:mb-0">
                  <h2 className="text-3xl font-bold text-foreground mb-3">
                    Welcome back, {user?.firstName || user?.email?.split('@')[0] || 'there'}!
                  </h2>
                  <p className="text-muted-foreground text-lg">
                    Continue your <span className="text-gradient-primary font-semibold">{settings.selectedLanguage.charAt(0).toUpperCase() + settings.selectedLanguage.slice(1)}</span> learning journey
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="glass-card bg-primary/10 border-primary/20 rounded-2xl p-6 text-center hover-lift">
                    <div className="text-3xl font-bold text-primary mb-1">{stats.streak}</div>
                    <div className="text-sm text-muted-foreground font-medium">Day Streak</div>
                  </div>
                  <div className="glass-card bg-success-500/10 border-success-500/20 rounded-2xl p-6 text-center hover-lift">
                    <div className="text-3xl font-bold text-success-500 mb-1">{stats.totalLessons}</div>
                    <div className="text-sm text-muted-foreground font-medium">Lessons Done</div>
                  </div>
                  <div className="glass-card bg-secondary-500/10 border-secondary-500/20 rounded-2xl p-6 text-center hover-lift">
                    <div className="text-3xl font-bold text-secondary-500 mb-1">{stats.wordsLearned}</div>
                    <div className="text-sm text-muted-foreground font-medium">Words Learned</div>
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
            <Card className="glass-card border-border/40 shadow-card hover-lift">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-foreground">Today's Lesson</h3>
                  <span className="bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium border border-primary/20">
                    Week 2, Day 3
                  </span>
                </div>
                
                {currentLesson && (
                  <div className="bg-gradient-to-br from-primary via-primary-600 to-primary-700 rounded-3xl p-8 text-primary-foreground mb-6 shadow-glow">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="text-2xl font-bold mb-3">{currentLesson.title}</h4>
                        <p className="text-primary-foreground/80 text-lg">{currentLesson.description}</p>
                      </div>
                      <div className="text-5xl">{currentLesson.emoji}</div>
                    </div>
                    
                    <div className="glass-card bg-primary-foreground/10 border-primary-foreground/20 rounded-2xl p-6 mb-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold mb-3">{currentLesson.content.word}</div>
                        <div className="text-primary-foreground/80 text-xl">{currentLesson.content.translation}</div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="mt-4 bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-primary-foreground/20"
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
                      className="w-full bg-primary-foreground text-primary font-bold py-4 text-lg hover:bg-primary-foreground/90 hover-lift"
                      onClick={() => setSelectedLesson(currentLesson)}
                    >
                      Start Lesson
                    </Button>
                  </div>
                )}
                
                {/* Quick Practice */}
                <div className="border-t border-border/40 pt-6">
                  <h5 className="font-bold text-foreground mb-4 text-lg">Quick Practice</h5>
                  <div className="space-y-3">
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between p-4 glass-card border-border/40 hover-lift h-auto"
                    >
                      <span className="font-medium text-foreground">What does "gracias" mean?</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full justify-between p-4 glass-card border-border/40 hover-lift h-auto"
                    >
                      <span className="font-medium text-foreground">Translate: "Good morning"</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
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
