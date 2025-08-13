import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Globe, Star, Clock, Users, Award, CheckCircle, ArrowLeft } from "lucide-react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import type { UserProgress } from "@shared/schema";
import Footer from "@/components/ui/footer";

export default function Courses() {
  const { language: urlLanguage } = useParams<{ language?: string }>();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedLanguage, setSelectedLanguage] = useState("italian");

  // If we have a URL language parameter, this is a specific language course page
  const isLanguageSpecific = !!urlLanguage;

  // Fetch courses data for specific language
  const { data: courses, isLoading: coursesLoading } = useQuery({
    queryKey: ['/api/courses', urlLanguage || selectedLanguage],
    enabled: isAuthenticated && isLanguageSpecific,
  });

  // Fetch user progress for specific language
  const { data: progress = [] } = useQuery({
    queryKey: ['/api/progress', urlLanguage || selectedLanguage],
    enabled: isAuthenticated && isLanguageSpecific,
  }) as { data: UserProgress[] };

  // Fetch next lesson for specific language
  const { data: nextLesson } = useQuery({
    queryKey: ['/api/next-lesson', urlLanguage || selectedLanguage],
    enabled: isAuthenticated && isLanguageSpecific,
  }) as { data: any };

  // Progress mutation
  const progressMutation = useMutation({
    mutationFn: async (progressData: any) => {
      return await apiRequest('/api/progress', 'POST', {
        ...progressData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress', urlLanguage || selectedLanguage] });
      queryClient.invalidateQueries({ queryKey: ['/api/next-lesson', urlLanguage || selectedLanguage] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats', urlLanguage || selectedLanguage] });
      
      // Refresh notification progress so next notification shows correct lesson
      import("@/lib/notifications").then(({ refreshNotificationProgress }) => {
        refreshNotificationProgress();
      });
    },
  });

  const markLessonComplete = async (courseId: string, lessonId: string) => {
    await progressMutation.mutateAsync({
      language: urlLanguage || selectedLanguage,
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

  const languages = [
    {
      id: "italian",
      name: "Italian",
      flag: "🇮🇹",
      description: "Learn the beautiful language of Italy with our comprehensive beginner course.",
      available: true,
      courses: {
        beginner: {
          title: "Italian for Beginners",
          description: "Perfect for complete beginners. Learn essential vocabulary, basic grammar, and everyday conversations.",
          duration: "8 weeks",
          lessons: 24,
          level: "Beginner",
          outline: [
            "Basic greetings and introductions",
            "Essential vocabulary (numbers, colors, family)",
            "Present tense verbs and common expressions",
            "Food and dining vocabulary",
            "Travel and transportation phrases",
            "Past and future tense basics"
          ]
        }
      }
    },
    {
      id: "spanish",
      name: "Spanish",
      flag: "🇪🇸",
      description: "Master Spanish, one of the world's most spoken languages.",
      available: true,
      courses: {
        beginner: {
          title: "Spanish for Beginners",
          description: "Start your Spanish journey with essential vocabulary, pronunciation, and basic conversations through structured micro-lessons.",
          duration: "9 weeks",
          lessons: 150,
          level: "Beginner",
          outline: [
            "Greetings and farewells (¡Hola!, Buenos días, Adiós)",
            "Introducing yourself (Me llamo, Soy de...)",
            "Essential courtesy phrases (Por favor, Gracias, Lo siento)",
            "Numbers from 0 to 100",
            "Days, months, and dates",
            "Family and people vocabulary",
            "Colors and descriptive adjectives",
            "Food and drink vocabulary",
            "Restaurant phrases and ordering"
          ]
        }
      }
    },
    {
      id: "german",
      name: "German",
      flag: "🇩🇪",
      description: "Discover the logical structure of German with our beginner-friendly approach.",
      available: true,
      courses: {
        beginner: {
          title: "German for Beginners",
          description: "Learn German fundamentals including der, die, das, basic grammar, and essential vocabulary.",
          duration: "12 weeks",
          lessons: 36,
          level: "Beginner",
          outline: [
            "German pronunciation and sounds",
            "Articles (der, die, das) and noun gender",
            "Basic sentence structure and word order",
            "Present tense regular verbs",
            "Personal pronouns and basic cases",
            "Numbers, time, and calendar",
            "Family, professions, and hobbies",
            "Modal verbs (können, müssen, wollen)"
          ]
        }
      }
    },
    {
      id: "french",
      name: "French",
      flag: "🇫🇷",
      description: "Learn the language of love and culture with our structured French course.",
      available: true,
      courses: {
        beginner: {
          title: "French for Beginners",
          description: "Master essential French through practical micro-lessons covering everyday vocabulary, proper pronunciation, and basic conversation skills.",
          duration: "9 weeks",
          lessons: 186,
          level: "Beginner",
          outline: [
            "Greetings and farewells (Salut, Bonjour, Au revoir)",
            "Introducing yourself (Je m'appelle, Je viens de...)",
            "Essential courtesy phrases (S'il vous plaît, Merci, Pardon)",
            "Numbers from 0 to 100 and asking age",
            "Days, months, telling time, and dates",
            "Family members and relationships",
            "Colors and descriptive adjectives",
            "Weather expressions and conditions",
            "Food, drinks, and dining vocabulary"
          ]
        }
      }
    }
  ];

  // Handle authentication for specific language courses
  if (isLanguageSpecific && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Please sign in to access courses</h2>
            <Button onClick={() => window.location.href = "/api/login"}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle loading state for specific language courses
  if (isLanguageSpecific && coursesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading courses...</p>
        </div>
      </div>
    );
  }

  // Find current language data
  const currentLanguage = languages.find(lang => lang.id === urlLanguage);

  // If this is a specific language page, render the detailed course view
  if (isLanguageSpecific && currentLanguage) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back to Courses */}
          <div className="mb-6">
            <Link href="/courses">
              <Button variant="ghost" className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                <ArrowLeft className="w-4 h-4" />
                Back to All Courses
              </Button>
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-4xl">{currentLanguage.flag}</span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {currentLanguage.name} Language Courses
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Learn {currentLanguage.name} through structured courses. Complete lessons in order to track your progress.
                </p>
              </div>
            </div>
          </div>

          {/* Next Lesson Card */}
          {nextLesson && !nextLesson.completed && (
            <Card className="mb-8 border-2 border-primary bg-primary/5" data-testid="card-next-lesson">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <CardTitle className="text-primary">Continue Learning</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {nextLesson.courseTitle}: {nextLesson.lesson.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">
                      {nextLesson.lesson.items.length} items to learn
                    </p>
                  </div>
                  <Button 
                    onClick={() => markLessonComplete(nextLesson.courseId, nextLesson.lessonId)}
                    disabled={progressMutation.isPending}
                    data-testid="button-mark-complete"
                  >
                    {progressMutation.isPending ? "Completing..." : "Mark Complete"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completion Message */}
          {nextLesson?.completed && (
            <Card className="mb-8 border-2 border-green-500 bg-green-50 dark:bg-green-900/20" data-testid="card-completion">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-800 dark:text-green-300 mb-2">
                  Congratulations!
                </h3>
                <p className="text-green-700 dark:text-green-300">
                  You've completed all available {currentLanguage.name} lessons!
                </p>
              </CardContent>
            </Card>
          )}

          {/* Courses Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courses && (Object.entries(courses) as [string, any][]).map(([courseId, course]) => (
              <Card key={courseId} className="border border-gray-200 dark:border-gray-700" data-testid={`card-course-${courseId}`}>
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
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{course.description}</p>
                  
                  {/* Lessons List */}
                  <div className="space-y-3">
                    {Object.entries(course.lessons as Record<string, any>).map(([lessonId, lesson]) => {
                      const completed = isLessonCompleted(courseId, lessonId);
                      
                      return (
                        <div 
                          key={lessonId}
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            completed 
                              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700' 
                              : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                          }`}
                          data-testid={`lesson-${lessonId}`}
                        >
                          <div className="flex items-center gap-3">
                            {completed ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <Clock className="w-5 h-5 text-gray-400" />
                            )}
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-white">
                                {lesson.title}
                              </h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {lesson.items.length} items
                              </p>
                            </div>
                          </div>
                          
                          {!completed && (
                            <Button 
                              size="sm"
                              onClick={() => markLessonComplete(courseId, lessonId)}
                              disabled={progressMutation.isPending}
                              data-testid={`button-complete-${lessonId}`}
                            >
                              {progressMutation.isPending ? "..." : "Complete"}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Checkpoint Access - Show after every 4 lessons */}
                  {Object.keys(course.lessons).length >= 4 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              Checkpoint Review
                            </h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Test your progress with 4 quiz questions
                            </p>
                          </div>
                        </div>
                        <Link href="/checkpoint/1">
                          <Button size="sm" variant="outline" data-testid="button-checkpoint">
                            Start Review
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Study Materials Preview */}
          {nextLesson && !nextLesson.completed && (
            <Card className="mt-8" data-testid="card-study-preview">
              <CardHeader>
                <CardTitle>Current Lesson: {nextLesson.lesson.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {nextLesson.lesson.items.slice(0, 6).map((item: any, index: number) => (
                    <div key={index} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {item.italian}
                      </div>
                      <div className="text-gray-600 dark:text-gray-300 mb-2">
                        {item.english}
                      </div>
                      {item.note && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                          {item.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {nextLesson.lesson.items.length > 6 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 mt-4">
                    And {nextLesson.lesson.items.length - 6} more items...
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
        
        <Footer />
      </div>
    );
  }

  // Default: render the general courses listing page
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Globe className="w-8 h-8 text-primary mr-3" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Language Courses</h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Choose from our selection of language courses designed for busy professionals. 
            Start with our beginner courses and build a strong foundation.
          </p>
        </div>

        {/* Languages Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {languages.map((language) => (
            <Card key={language.id} className="border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow" data-testid={`card-language-${language.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{language.flag}</span>
                    <div>
                      <CardTitle className="text-2xl text-gray-900 dark:text-white">
                        {language.name}
                      </CardTitle>
                      <p className="text-gray-600 dark:text-gray-300 mt-1">
                        {language.description}
                      </p>
                    </div>
                  </div>
                  {language.available && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Available
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* Beginner Course */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {language.courses.beginner.title}
                      </h3>
                      <Badge variant="outline" className="ml-2">
                        {language.courses.beginner.level}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {language.courses.beginner.description}
                  </p>
                  
                  {/* Course Stats */}
                  <div className="flex items-center gap-6 mb-4 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{language.courses.beginner.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{language.courses.beginner.lessons} lessons</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>Beginner level</span>
                    </div>
                  </div>

                  {/* Course Outline Accordion */}
                  <Accordion type="single" collapsible className="mb-4" data-testid={`accordion-outline-${language.id}`}>
                    <AccordionItem value="outline">
                      <AccordionTrigger className="text-left">
                        <span className="flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          Course Outline
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {language.courses.beginner.outline.map((topic, index) => (
                            <li key={index} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              <span className="text-gray-700 dark:text-gray-300">{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* Action Button */}
                  {language.available ? (
                    <Link href={`/courses/${language.id}`}>
                      <Button className="w-full" data-testid={`button-start-${language.id}`}>
                        Start Learning {language.name}
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled className="w-full">
                      Coming Soon
                    </Button>
                  )}
                </div>

                {/* Other Levels Coming Soon */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Other Levels</h4>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Intermediate - Coming Soon
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Advanced - Coming Soon
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Why Choose Our Language Courses?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Micro-Learning</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Short, focused lessons that fit into your busy schedule. Learn effectively in just 10-15 minutes a day.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Personalized Learning</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Adaptive courses that adjust to your pace and learning style for optimal progress.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Professional Focus</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Designed for working professionals with practical vocabulary and real-world scenarios.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}