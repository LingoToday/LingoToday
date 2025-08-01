import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle, Clock, ArrowRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { UserProgress } from "@shared/schema";

export default function Courses() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedLanguage, setSelectedLanguage] = useState("italian");

  // Fetch courses data
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['/api/courses', selectedLanguage],
    enabled: isAuthenticated,
  });

  // Fetch user progress
  const { data: progress = [] } = useQuery({
    queryKey: ['/api/progress', selectedLanguage],
    enabled: isAuthenticated,
  }) as { data: UserProgress[] };

  // Fetch next lesson
  const { data: nextLesson } = useQuery({
    queryKey: ['/api/next-lesson', selectedLanguage],
    enabled: isAuthenticated,
  }) as { data: any };

  // Progress mutation
  const progressMutation = useMutation({
    mutationFn: async (progressData: any) => {
      return await apiRequest('/api/progress', 'POST', {
        ...progressData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress', selectedLanguage] });
      queryClient.invalidateQueries({ queryKey: ['/api/next-lesson', selectedLanguage] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats', selectedLanguage] });
    },
  });

  const markLessonComplete = async (courseId: string, lessonId: string) => {
    await progressMutation.mutateAsync({
      language: selectedLanguage,
      courseId,
      lessonId,
      completed: true,
      score: 100,
      completedAt: new Date().toISOString(),
    });
  };

  const isLessonCompleted = (courseId: string, lessonId: string) => {
    return progress.some(p => 
      p.courseId === courseId && 
      p.lessonId === lessonId && 
      p.completed
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Please sign in to access courses</h2>
            <Button onClick={() => window.location.href = "/api/login"}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (coursesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Italian Language Courses</h1>
          <p className="text-gray-600">
            Learn Italian through structured courses. Complete lessons in order to track your progress.
          </p>
        </div>

        {/* Next Lesson Card */}
        {nextLesson && !nextLesson.completed && (
          <Card className="mb-8 border-2 border-primary bg-primary/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <ArrowRight className="w-5 h-5 text-primary" />
                <CardTitle className="text-primary">Continue Learning</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {nextLesson.courseTitle}: {nextLesson.lesson.title}
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {nextLesson.lesson.items.length} items to learn
                  </p>
                </div>
                <Button 
                  onClick={() => markLessonComplete(nextLesson.courseId, nextLesson.lessonId)}
                  disabled={progressMutation.isPending}
                >
                  {progressMutation.isPending ? "Completing..." : "Mark Complete"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completion Message */}
        {nextLesson?.completed && (
          <Card className="mb-8 border-2 border-green-500 bg-green-50">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                Congratulations!
              </h3>
              <p className="text-green-700">
                You've completed all available Italian lessons!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Courses Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {courses && (Object.entries(courses) as [string, any][]).map(([courseId, course]) => (
            <Card key={courseId} className="border border-gray-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    {course.title}
                  </CardTitle>
                  <Badge variant="outline">
                    {Object.keys(course.lessons).length} lessons
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{course.description}</p>
                
                {/* Lessons List */}
                <div className="space-y-3">
                  {Object.entries(course.lessons as Record<string, any>).map(([lessonId, lesson]) => {
                    const completed = isLessonCompleted(courseId, lessonId);
                    
                    return (
                      <div 
                        key={lessonId}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          completed 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {completed ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {lesson.title}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {lesson.items.length} items
                            </p>
                          </div>
                        </div>
                        
                        {!completed && (
                          <Button 
                            size="sm"
                            onClick={() => markLessonComplete(courseId, lessonId)}
                            disabled={progressMutation.isPending}
                          >
                            {progressMutation.isPending ? "..." : "Complete"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Study Materials Preview */}
        {nextLesson && !nextLesson.completed && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Current Lesson: {nextLesson.lesson.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nextLesson.lesson.items.slice(0, 6).map((item: any, index: number) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="text-lg font-semibold text-gray-900 mb-1">
                      {item.italian}
                    </div>
                    <div className="text-gray-600 mb-2">
                      {item.english}
                    </div>
                    {item.note && (
                      <div className="text-sm text-gray-500 italic">
                        {item.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {nextLesson.lesson.items.length > 6 && (
                <p className="text-center text-gray-500 mt-4">
                  And {nextLesson.lesson.items.length - 6} more items...
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}