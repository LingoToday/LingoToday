import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Users, Clock, FileText } from "lucide-react";

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

export default function AdminPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Dashboard
          </h1>
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
                                
                                {course.lessons.length > 0 && (
                                  <div className="mt-3">
                                    <details className="text-sm">
                                      <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                                        View Lessons ({course.lessons.length})
                                      </summary>
                                      <div className="mt-2 space-y-1">
                                        {course.lessons
                                          .sort((a, b) => a.lessonNumber - b.lessonNumber)
                                          .map((lesson) => (
                                            <div 
                                              key={lesson.id} 
                                              className="flex items-center justify-between py-1 px-2 bg-gray-50 dark:bg-gray-800 rounded"
                                            >
                                              <span className="text-xs">
                                                Lesson {lesson.lessonNumber}: {lesson.title}
                                              </span>
                                              <Badge 
                                                variant={lesson.isActive ? "default" : "secondary"} 
                                                className="text-xs"
                                              >
                                                {lesson.isActive ? "Active" : "Inactive"}
                                              </Badge>
                                            </div>
                                          ))}
                                      </div>
                                    </details>
                                  </div>
                                )}
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