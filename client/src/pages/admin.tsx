import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Clock, FileText, ChevronDown, CheckCircle, Lock, BarChart3 } from "lucide-react";
import { useState } from "react";
import Analytics from "@/pages/analytics";

interface Course {
  id: number;
  languageId: number;
  skillLevelId: number;
  courseNumber: number;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  language: {
    id: number;
    code: string;
    name: string;
  };
  skillLevel: {
    id: number;
    code: string;
    name: string;
    description?: string;
    sortOrder: number;
  };
  lessons: Array<{
    id: number;
    courseId: number;
    lessonNumber: number;
    title: string;
    isActive: boolean;
  }>;
}

interface SkillLevelData {
  skillLevel: {
    id: number;
    code: string;
    name: string;
    description?: string;
    sortOrder: number;
  };
  courses: Course[];
}

interface LanguageData {
  language: {
    id: number;
    code: string;
    name: string;
  };
  skillLevels: SkillLevelData[];
}

interface CourseItem {
  id: string;
  type: 'lesson' | 'review';
  title: string;
  questions?: number;
  data: any;
}

interface CourseJsonData {
  courseTitle: string;
  courseDescription: string;
  items: CourseItem[];
  summary: {
    totalLessons: number;
    totalReviews: number;
    totalItems: number;
  };
}

function JsonCourseViewer({ 
  language,
  courseNumber 
}: { 
  language: string;
  courseNumber: number; 
}) {
  const { data: courseData, isLoading, error } = useQuery({
    queryKey: ['/api/admin/simple-course', language, courseNumber],
    queryFn: async () => {
      const response = await fetch(`/api/admin/simple-course/${language}/${courseNumber}`, {
        credentials: 'same-origin'
      });
      return response.json();
    },
    retry: 1
  });

  if (isLoading) {
    return (
      <div className="flex items-center py-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
        <span className="text-sm text-gray-600 dark:text-gray-300">Loading JSON content...</span>
      </div>
    );
  }

  if (error || !courseData?.items?.length) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 py-2">
        {courseData?.message || 'No JSON course content available'}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
        JSON Course Content: {courseData.courseTitle}
      </div>
      
      <div className="max-h-60 overflow-y-auto space-y-1">
        {courseData.items.map((item: any) => (
          <div 
            key={item.id} 
            className={`flex items-center justify-between py-1.5 px-2 rounded text-xs ${
              item.type === 'lesson' 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-l-blue-400' 
                : 'bg-orange-50 dark:bg-orange-900/20 border-l-2 border-l-orange-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-gray-500 dark:text-gray-400 min-w-[4rem]">
                {item.id}
              </span>
              <span className={item.type === 'lesson' ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300'}>
                {item.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {item.questions && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {item.questions} questions
                </span>
              )}
              <Badge 
                variant={item.type === 'lesson' ? "default" : "secondary"}
                className="text-xs"
              >
                {item.type === 'lesson' ? 'Lesson' : 'Review'}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CourseStructurePage() {
  const { data: adminData, isLoading, error } = useQuery<LanguageData[]>({
    queryKey: ['/api/admin/courses'],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading admin data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">Error</h2>
            <p className="text-gray-600 dark:text-gray-300">Failed to load admin data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!adminData || adminData.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">No Data</h2>
            <p className="text-gray-600 dark:text-gray-300">No courses found in the system</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Course Structure
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            View all uploaded courses organized by language and skill level
          </p>
        </div>

        {/* Language Tabs */}
        <Tabs defaultValue={adminData[0]?.language.code} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6" data-testid="language-tabs">
            {adminData.map((languageData) => (
              <TabsTrigger 
                key={languageData.language.code} 
                value={languageData.language.code}
                data-testid={`tab-${languageData.language.code}`}
              >
                {languageData.language.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {adminData.map((languageData) => (
            <TabsContent key={languageData.language.code} value={languageData.language.code}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    {languageData.language.name} Courses
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {languageData.skillLevels.map((skillLevelData, index) => (
                    <div key={skillLevelData.skillLevel.id}>
                      <div className="mb-4">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          {skillLevelData.skillLevel.name}
                        </h3>
                        {skillLevelData.skillLevel.description && (
                          <p className="text-gray-600 dark:text-gray-300 mb-4">
                            {skillLevelData.skillLevel.description}
                          </p>
                        )}
                        
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {skillLevelData.courses.map((course) => (
                            <Card key={course.id} className="border-l-4 border-l-primary">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-lg">
                                    Course {course.courseNumber}
                                  </CardTitle>
                                  <Badge variant={course.isActive ? "default" : "secondary"}>
                                    {course.isActive ? "Active" : "Inactive"}
                                  </Badge>
                                </div>
                                <h4 className="font-medium text-gray-900 dark:text-white">
                                  {course.title}
                                </h4>
                              </CardHeader>
                              <CardContent className="pt-0">
                                {course.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                                    {course.description}
                                  </p>
                                )}
                                
                                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <Users className="w-4 h-4" />
                                    {course.lessons.length} lessons
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    Course {course.courseNumber}
                                  </div>
                                </div>
                                
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    <div>Created: {new Date(course.createdAt).toLocaleDateString()}</div>
                                    <div>Updated: {new Date(course.updatedAt).toLocaleDateString()}</div>
                                  </div>
                                </div>
                                
                                <div className="mt-3">
                                  <details className="text-sm">
                                    <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                                      View JSON Course Content (Lessons & Reviews)
                                    </summary>
                                    <div className="mt-3">
                                      <JsonCourseViewer 
                                        language={languageData.language.code}
                                        courseNumber={course.courseNumber} 
                                      />
                                    </div>
                                  </details>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                      
                      {index < languageData.skillLevels.length - 1 && (
                        <Separator className="my-6" />
                      )}
                    </div>
                  ))}
                  
                  {languageData.skillLevels.length === 0 && (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        No courses found for {languageData.language.name}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

interface UserMetric {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  selectedLanguage: string;
  progress: {
    [language: string]: {
      lessonsCompleted: number;
      totalProgress: number;
      currentCourse: string;
      currentLesson: string;
      lastActivity: string | null;
      streak: number;
      wordsLearned: number;
    };
  };
  totalLanguagesStarted: number;
  overallLessonsCompleted: number;
  lastActivity: string | null;
}

interface UserMetricsData {
  totalUsers: number;
  activeUsers: number;
  users: UserMetric[];
}

function UserMetrics() {
  const { data: userMetrics, isLoading, error } = useQuery<UserMetricsData>({
    queryKey: ['/api/admin/user-metrics'],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading user metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">Error</h2>
          <p className="text-gray-600 dark:text-gray-300">Failed to load user metrics</p>
        </CardContent>
      </Card>
    );
  }

  if (!userMetrics) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">No Data</h2>
          <p className="text-gray-600 dark:text-gray-300">No user metrics found</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for charts
  const languageDistribution = userMetrics.users.reduce((acc, user) => {
    const lang = user.selectedLanguage || 'unknown';
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const progressDistribution = userMetrics.users.map(user => ({
    name: `${user.firstName} ${user.lastName}`.trim() || user.email,
    lessons: user.overallLessonsCompleted,
    languages: user.totalLanguagesStarted
  }));

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          User Metrics
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Overview of user progress and engagement across all languages
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="total-users">
                  {userMetrics.totalUsers}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Active Users</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="active-users">
                  {userMetrics.activeUsers}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Lessons Completed</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white" data-testid="total-lessons">
                  {userMetrics.users.reduce((sum, user) => sum + user.overallLessonsCompleted, 0)}
                </p>
              </div>
              <BookOpen className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Progress Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Progress Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">User</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Primary Language</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Languages Started</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900 dark:text-white">Lessons Completed</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Current Position</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900 dark:text-white">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {userMetrics.users.map((user, index) => {
                  const primaryLanguageProgress = user.progress[user.selectedLanguage];
                  return (
                    <tr key={user.userId} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800" data-testid={`user-row-${index}`}>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">
                          {user.selectedLanguage}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {user.totalLanguagesStarted}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {user.overallLessonsCompleted}
                      </td>
                      <td className="py-3 px-4">
                        {primaryLanguageProgress ? (
                          <div className="text-sm">
                            <div className="font-medium">
                              {primaryLanguageProgress.currentCourse} / {primaryLanguageProgress.currentLesson}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">
                              {primaryLanguageProgress.lessonsCompleted} lessons completed
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">No progress</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        {formatDate(user.lastActivity)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {userMetrics.users.length === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No active users found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AccessCodeForm({ onAccessGranted }: { onAccessGranted: () => void }) {
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode === "crazy00") {
      onAccessGranted();
    } else {
      setError("Invalid access code");
      setAccessCode("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <Card className="w-96">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Lock className="w-5 h-5" />
            Admin Access Required
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter Access Code
              </label>
              <Input
                id="accessCode"
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Access code"
                data-testid="access-code-input"
                className={error ? "border-red-500" : ""}
              />
              {error && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400" data-testid="access-error">
                  {error}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" data-testid="access-submit">
              Access Admin
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPage() {
  const [hasAccess, setHasAccess] = useState(false);
  const [activeTab, setActiveTab] = useState("course-structure");

  if (!hasAccess) {
    return <AccessCodeForm onAccessGranted={() => setHasAccess(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage and monitor the language learning platform
          </p>
        </div>

        {/* Sub Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6" data-testid="admin-nav-tabs">
            <TabsTrigger value="course-structure" data-testid="tab-course-structure" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Course Structure
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="user-metrics" data-testid="tab-user-metrics" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Metrics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="course-structure">
            <CourseStructurePage />
          </TabsContent>

          <TabsContent value="analytics">
            <Analytics />
          </TabsContent>

          <TabsContent value="user-metrics">
            <UserMetrics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}