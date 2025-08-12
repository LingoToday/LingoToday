import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  MessageSquare
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
  title?: string;
  type?: string;
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
  const recentProgress = dashboardData?.progress?.slice(0, 8) || [];

  // Mock recent lessons data matching the screenshot
  const recentLessons = [
    {
      id: 1,
      title: "Apologies and Excuse Me",
      subtitle: "Essential Courtesy Phrases",
      date: "17/08/2024",
      score: "90%",
      status: "completed"
    },
    {
      id: 2,
      title: "Mi dispiace",
      subtitle: "I'm sorry",
      date: "17/08/2024",
      questions: [
        { text: "What does 'Mi dispiace' mean?", answer: "I'm sorry" }
      ],
      status: "completed"
    },
    {
      id: 3,
      title: "Yes, No, Please, Thank You",
      subtitle: "Essential Courtesy Phrases",
      date: "16/08/2024",
      score: "100%",
      status: "completed"
    },
    {
      id: 4,
      title: "Origin and Nationality",
      subtitle: "Introducing Yourself",
      date: "15/08/2024",
      score: "80%",
      status: "completed"
    },
    {
      id: 5,
      title: "Di dove sei?",
      subtitle: "Where are you from?",
      date: "15/08/2024",
      questions: [
        { text: "What does 'Di dove sei?' mean?", answer: "Where are you from?" }
      ],
      status: "completed"
    },
    {
      id: 6,
      title: "Buonasera",
      subtitle: "Good evening",
      date: "14/08/2024",
      score: "90%",
      status: "completed"
    }
  ];

  // Mock learning path data
  const learningPath = [
    { name: "Greetings", progress: "8/8", completion: 100, status: "completed" },
    { name: "Introducing Yourself", progress: "5/8", completion: 62.5, status: "current" },
    { name: "Essential Courtesy Phrases", progress: "4/8", completion: 50, status: "current" },
    { name: "Numbers", progress: "0/8", completion: 0, status: "locked" },
    { name: "Days and Dates", progress: "0/10", completion: 0, status: "locked" },
    { name: "Family and Friends", progress: "0/12", completion: 0, status: "locked" },
    { name: "At the Restaurant", progress: "0/15", completion: 0, status: "locked" },
    { name: "Weather and Seasons", progress: "0/10", completion: 0, status: "locked" },
    { name: "Time and Schedule", progress: "0/12", completion: 0, status: "locked" },
    { name: "Directions and Places", progress: "0/14", completion: 0, status: "locked" },
    { name: "Shopping", progress: "0/16", completion: 0, status: "locked" },
    { name: "Likes and Dislikes", progress: "0/10", completion: 0, status: "locked" }
  ];

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
                <h1 className="text-xl font-bold text-gray-900">DeepLingo</h1>
              </div>
              
              <nav className="flex space-x-8 ml-8">
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-blue-600 border-b-2 border-blue-600">
                    Dashboard
                  </Button>
                </Link>
                <Link href="/courses">
                  <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                    Courses
                  </Button>
                </Link>
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  Progress
                </Button>
                <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                  Settings
                </Button>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.firstName || 'Marcus'}</span>
              <Button variant="ghost" size="sm">
                Logout
              </Button>
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
                Welcome back, {user.firstName || 'Marcus'}!
              </h1>
              <p className="text-gray-600 mb-4">
                Continue your Italian learning journey
              </p>
              <div className="flex items-center space-x-4">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Continue
                </Button>
                <div className="text-sm text-gray-500">
                  Go Intermediate
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-gray-900">1</div>
                  <div className="text-sm text-gray-600">Days</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-gray-900">4</div>
                  <div className="text-sm text-gray-600">Streak</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-2xl font-bold text-gray-900">0</div>
                  <div className="text-sm text-gray-600">XP</div>
                </CardContent>
              </Card>
            </div>

            {/* Daily Session Active */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">Daily session active • notifications every 15 minutes</span>
            </div>

            {/* Coming Up Next */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Coming Up Next</CardTitle>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  Grammar
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Gender</h3>
                      <p className="text-purple-100">Nouns and Articles</p>
                    </div>
                    <Button variant="secondary" size="sm" className="bg-white text-purple-600 hover:bg-gray-100">
                      Start Now
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Nouns</div>
                      <div className="text-sm text-gray-500">Nouns and Articles</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Pronunciation</div>
                      <div className="text-sm text-gray-500">Nouns and Articles</div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Target className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">Names and Introductions</div>
                      <div className="text-sm text-gray-500">Introducing Yourself</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Lessons */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Lessons</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentLessons.map((lesson) => (
                  <div key={lesson.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{lesson.title}</div>
                      <div className="text-sm text-gray-500">{lesson.subtitle}</div>
                      {lesson.questions && lesson.questions.map((q, idx) => (
                        <div key={idx} className="text-xs text-gray-400 mt-1">
                          Quiz: What does "{q.text.includes("'") ? q.text.split("'")[1].split("'")[0] : lesson.title}" mean? → {q.answer}
                        </div>
                      ))}
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">{lesson.score || '100%'}</div>
                      <div className="text-xs text-gray-500">{lesson.date}</div>
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
                       'LOCKED'}
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t">
                  <div className="text-center">
                    <div className="text-sm font-medium text-blue-600 mb-1">Complete Italian Course</div>
                    <div className="text-xs text-gray-500 mb-2">600 lessons • 15 courses</div>
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
            <Card>
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
                    <span className="text-sm text-gray-600">Italian</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Frequency</span>
                    <Select defaultValue="15">
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">Every 5 minutes</SelectItem>
                        <SelectItem value="15">Every 15 minutes</SelectItem>
                        <SelectItem value="30">Every 30 minutes</SelectItem>
                        <SelectItem value="60">Every hour</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Notifications Enabled</span>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Volume2 className="w-4 h-4 mr-2" />
                    Speak Test
                  </Button>
                  
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Bell className="w-4 h-4 mr-2" />
                    Test Now
                  </Button>
                </div>

                <div className="pt-4 border-t space-y-2 text-xs text-gray-600">
                  <div>Debug Info</div>
                  <div>Permission: granted</div>
                  <div>Frequency: 15 min</div>
                  <div>Language: italian</div>
                  <div>Notifications: 15 done</div>
                  <div>Focus Schedule (Deferred)</div>
                  <div>Deep Timing Module</div>
                  <div>Google Notification API</div>
                </div>
              </CardContent>
            </Card>

            {/* This Week's Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">This Week's Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-sm font-medium">Week 2 Progress</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{width: '60%'}}></div>
                  </div>
                  <span className="text-sm text-gray-600">3/5 days</span>
                </div>
                
                <div className="flex justify-between mb-4">
                  {['M', 'T', 'W', 'T', 'F'].map((day, index) => (
                    <div key={day} className="text-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs mb-1 ${
                        index < 3 ? 'bg-green-600 text-white' :
                        index === 3 ? 'bg-blue-600 text-white' :
                        'bg-gray-200 text-gray-400'
                      }`}>
                        {index < 3 ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                      </div>
                      <div className="text-xs text-gray-500">{day}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days studied</span>
                    <span className="font-medium">3 of 5 days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current streak</span>
                    <span className="font-medium text-green-600">4 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Learning Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Learning Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-600">Days studied</span>
                    <span className="font-medium text-green-600">On the streak</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current streak</span>
                    <span className="font-medium">4 days</span>
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
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Random Practice
                </Button>
                
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Trophy className="w-4 h-4 mr-2" />
                  Review Words
                </Button>
                
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Eye className="w-4 h-4 mr-2" />
                  View Statistics
                </Button>
                
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
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