import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
  BarChart3,
  Calendar,
  Star,
  Zap
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

// Mock data for comprehensive dashboard (matching the original design)
const mockRecentLessons = [
  {
    id: 1,
    title: "Apologies and Excuse Me",
    subtitle: "Essential Courtesy Phrases",
    timeAgo: "17 MINUTES",
    score: 100,
    quiz: "Quiz: What does \"Mi dispiace\" mean?",
    answer: "I'm sorry"
  },
  {
    id: 2,
    title: "Yes, No, Please, Thank You",
    subtitle: "Essential Courtesy Phrases",
    timeAgo: "40 MINUTES",
    score: 90,
    quiz: "Quiz: What does \"Si\" mean?",
    answer: "Yes"
  },
  {
    id: 3,
    title: "Polite Social Phrases",
    subtitle: "Essential Courtesy",
    timeAgo: "YESTERDAY",
    score: 100,
    quiz: "Quiz: What does \"Piacere di conoscerti\" mean?",
    answer: "Pleased to meet you"
  },
  {
    id: 4,
    title: "Origin and Nationality",
    subtitle: "Introducing Yourself",
    timeAgo: "2 DAYS AGO",
    score: 100,
    quiz: "Quiz: What does \"Di dove sei?\" mean?",
    answer: "Where are you from?"
  },
  {
    id: 5,
    title: "Di dove sei?",
    subtitle: "Introducing Yourself",
    timeAgo: "2 DAYS AGO",
    score: 100,
    quiz: "Quiz: What does \"Buonasera\" mean?",
    answer: "Good evening"
  }
];

const mockLearningPath = [
  { course: "Greetings", progress: 100, lessons: "5/5" },
  { course: "Introducing Yourself", progress: 100, lessons: "5/5" },
  { course: "Essential Courtesy Phrases", progress: 80, lessons: "4/5" },
  { course: "Numbers", progress: 0, lessons: "0/6" },
  { course: "Family and Relatives", progress: 0, lessons: "0/7" },
  { course: "Age and Personal Info", progress: 0, lessons: "0/4" },
  { course: "Weather and Seasons", progress: 0, lessons: "0/5" },
  { course: "Time and Dates", progress: 0, lessons: "0/6" },
  { course: "Locations and Places", progress: 0, lessons: "0/8" },
  { course: "Food and Dining", progress: 0, lessons: "0/10" },
  { course: "Jobs and Professions", progress: 0, lessons: "0/8" }
];

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

  const stats = dashboardData?.stats || { streak: 1, totalLessons: 4, wordsLearned: 0 };
  const settings = dashboardData?.settings || { notificationsEnabled: true, notificationFrequency: 15, selectedLanguage: "Italian" };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">D</span>
              </div>
              <span className="font-semibold text-gray-900">DeskLingo</span>
            </div>
            
            <nav className="flex space-x-8">
              <Link href="/dashboard" className="text-blue-600 font-medium">Dashboard</Link>
              <Link href="/courses" className="text-gray-600 hover:text-gray-900">Courses</Link>
              <Link href="/progress" className="text-gray-600 hover:text-gray-900">Progress</Link>
              <Link href="/settings" className="text-gray-600 hover:text-gray-900">Settings</Link>
            </nav>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.streak}</div>
                  <div className="text-xs text-gray-500">Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.totalLessons}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.wordsLearned}</div>
                  <div className="text-xs text-gray-500">Words</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <span className="text-sm text-gray-600">Marcus</span>
                <Button variant="ghost" size="sm">Logout</Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName || 'Marcus'}!
          </h1>
          <p className="text-gray-600 mb-4">
            Continue your {settings.selectedLanguage} learning journey
          </p>
          
          <div className="flex items-center space-x-2 mb-4">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Start Today's Lessons
            </Button>
            <span className="text-sm text-gray-500">Try Intermediate</span>
          </div>

          {settings.notificationsEnabled && (
            <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg inline-flex">
              <CheckCircle2 className="h-4 w-4" />
              <span>Daily session active - notifications every {settings.notificationFrequency} minutes</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Coming Up Next */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Coming Up Next</CardTitle>
                <Badge variant="secondary" className="bg-purple-100 text-purple-800">Continue</Badge>
              </CardHeader>
              <CardContent>
                {nextLesson ? (
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg text-white">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{nextLesson.title}</h3>
                        <p className="text-blue-100">{nextLesson.description}</p>
                      </div>
                    </div>
                    <Link href={`/lessons/${user?.selectedLanguage}/${nextLesson.courseId}/${nextLesson.lessonId}`}>
                      <Button variant="secondary" size="sm">
                        Start Now
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Sample upcoming lessons */}
                    <div className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">Numbers</h4>
                        <p className="text-sm text-gray-600">Learn numbers 1-20</p>
                      </div>
                      <Badge variant="outline">Next</Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Target className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">Pronunciation</h4>
                        <p className="text-sm text-gray-600">Speaking Tutorial</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 p-3 border rounded-lg">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <Zap className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">Names and Introductions</h4>
                        <p className="text-sm text-gray-600">Introducing Yourself</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Lessons */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl">Recent Lessons</CardTitle>
                <Button variant="outline" size="sm">View all lessons</Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRecentLessons.map((lesson) => (
                    <div key={lesson.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                            <p className="text-sm text-gray-600">{lesson.subtitle} • {lesson.timeAgo}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={lesson.score === 100 ? "default" : "secondary"} className="bg-yellow-100 text-yellow-800">
                            {lesson.score}%
                          </Badge>
                          <Star className="h-4 w-4 text-yellow-500" />
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 rounded p-3 text-sm">
                        <p className="text-gray-700 mb-1">{lesson.quiz}</p>
                        <p className="text-green-600 font-medium">✓ {lesson.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Learning Path */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Learning Path
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockLearningPath.slice(0, 8).map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${item.progress === 100 ? 'bg-green-500' : item.progress > 0 ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm text-gray-700">{item.course}</span>
                      </div>
                      <span className="text-xs text-gray-500">{item.lessons}</span>
                    </div>
                  ))}
                  <div className="pt-2">
                    <Link href="/courses">
                      <Button variant="link" size="sm" className="text-blue-600 p-0">
                        Complete Italian Course
                        <br />
                        <span className="text-xs text-gray-500">100 lessons • 16 Courses</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Language</span>
                    <span className="text-sm text-gray-600">Italian</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Level</span>
                    <span className="text-sm text-gray-600">Beginner</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Frequency</span>
                    <span className="text-sm text-gray-600">Every {settings.notificationFrequency} minutes</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Notifications Enabled</span>
                  </div>

                  <div className="space-y-2 text-xs text-gray-600">
                    <div>Sample Text</div>
                    <div>Test Example</div>
                    <div>Debug Info</div>
                    <div>Permission: granted</div>
                    <div>Frequency: 15 min</div>
                    <div>Language: Italian</div>
                    <div>Status: Active</div>
                    <div>Force Schedule (Dev Use)</div>
                    <div>Check Timing (Now)</div>
                    <div>Sample Notification Text</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* This Week's Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">This Week's Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Week 2 Progress</span>
                    <span>35 days</span>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                    <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                    <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Learning Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Learning Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Daily Lessons</span>
                      <span className="text-green-600">2/2 daily streak</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Current streak</span>
                      <span>1 day</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Random Practice
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Trophy className="h-4 w-4 mr-2" />
                  Review Words
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Statistics
                </Button>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}