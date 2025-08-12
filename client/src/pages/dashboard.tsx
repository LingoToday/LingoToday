import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Target, 
  Clock, 
  Trophy, 
  Play,
  Settings,
  Bell,
  CheckCircle2,
  Circle
} from "lucide-react";
import { Link } from "wouter";

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
  score: number;
  completedAt: string;
}

interface NextLessonData {
  courseId: string;
  lessonId: string;
  title: string;
  description: string;
  courseTitle?: string;
}

interface DashboardData {
  user: User;
  settings: {
    notificationsEnabled: boolean;
    notificationFrequency: number;
    selectedLanguage: string;
  };
  stats: {
    streak: number;
    totalLessons: number;
    wordsLearned: number;
  };
  progress: ProgressData[];
}

export default function Dashboard() {
  const { user } = useAuth() as { user: User | null };

  const { data: dashboardData, isLoading } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    enabled: !!user,
  });

  const { data: nextLesson } = useQuery<NextLessonData | null>({
    queryKey: ["/api/next-lesson"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
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
  const recentProgress = dashboardData?.progress?.slice(0, 5) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.firstName || 'Student'}!
              </h1>
              <p className="text-gray-600">
                Continue your {user.selectedLanguage || 'Italian'} journey at {user.selectedLevel || 'A1'} level
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Stats and Progress */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Trophy className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Streak</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats?.streak || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <BookOpen className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Lessons</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats?.totalLessons || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Target className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Words</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats?.wordsLearned || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Level</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {user.selectedLevel || 'A1'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Continue Learning */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Play className="h-5 w-5 mr-2" />
                  Continue Learning
                </CardTitle>
                <CardDescription>
                  {nextLesson 
                    ? `Ready for your next lesson: ${nextLesson.title}`
                    : "Great job! You're all caught up with your current lessons."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {nextLesson ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-900">{nextLesson.title}</h3>
                        <p className="text-sm text-gray-600">{nextLesson.description}</p>
                        <div className="flex items-center mt-2">
                          <Badge variant="secondary" className="mr-2">
                            {nextLesson.courseId}
                          </Badge>
                          <Badge variant="outline">
                            {nextLesson.lessonId}
                          </Badge>
                        </div>
                      </div>
                      <Link href={`/lessons/${user?.selectedLanguage}/${nextLesson.courseId}/${nextLesson.lessonId}`}>
                        <Button>
                          <Play className="h-4 w-4 mr-2" />
                          Start Lesson
                        </Button>
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">All lessons completed!</h3>
                    <p className="text-gray-600">Check back later for new content.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Progress</CardTitle>
                <CardDescription>Your latest completed lessons</CardDescription>
              </CardHeader>
              <CardContent>
                {recentProgress.length > 0 ? (
                  <div className="space-y-3">
                    {recentProgress.map((progress: ProgressData, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <CheckCircle2 className="h-5 w-5 text-green-500 mr-3" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {progress.courseId} - {progress.lessonId}
                            </p>
                            <p className="text-sm text-gray-600">
                              Completed {new Date(progress.completedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={progress.score >= 80 ? "default" : "secondary"}>
                          {progress.score}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Circle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600">No lessons completed yet. Start your first lesson!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Learning Goal */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today's Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Daily lessons</span>
                    <span>1 / 2</span>
                  </div>
                  <Progress value={50} className="h-2" />
                  <p className="text-xs text-gray-600">
                    Complete 1 more lesson to reach your daily goal!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-4 w-4 mr-2" />
                  Learning Reminders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Desktop notifications</span>
                    <Badge variant={settings?.notificationsEnabled ? "default" : "secondary"}>
                      {settings?.notificationsEnabled ? "ON" : "OFF"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Frequency</span>
                    <span className="text-sm text-gray-600">
                      Every {settings?.notificationFrequency || 30} minutes
                    </span>
                  </div>
                  <Link href="/settings">
                    <Button variant="outline" size="sm" className="w-full">
                      Manage Notifications
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/lessons">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse All Lessons
                  </Button>
                </Link>
                <Link href="/progress">
                  <Button variant="outline" className="w-full justify-start">
                    <Trophy className="h-4 w-4 mr-2" />
                    View Progress
                  </Button>
                </Link>
                <Link href="/settings">
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}