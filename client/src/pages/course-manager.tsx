import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, BookOpen, Users, Globe, ChevronRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import Footer from "@/components/ui/footer";

interface Language {
  id: number;
  code: string;
  name: string;
  createdAt: string;
}

interface SkillLevel {
  id: number;
  code: string;
  name: string;
  description: string;
  sortOrder: number;
  createdAt: string;
}

interface Course {
  id: number;
  languageId: number;
  skillLevelId: number;
  courseNumber: number;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CourseWithRelations extends Course {
  language: Language;
  skillLevel: SkillLevel;
  lessons: LessonWithSteps[];
}

interface Lesson {
  id: number;
  courseId: number;
  lessonNumber: number;
  title: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LessonStep {
  id: number;
  lessonId: number;
  stepNumber: number;
  stepType: string;
  content: any;
  createdAt: string;
  updatedAt: string;
}

interface LessonWithSteps extends Lesson {
  steps: LessonStep[];
}

export default function CourseManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedLanguage, setSelectedLanguage] = useState<number | null>(null);
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<number | null>(null);

  // Fetch languages
  const { data: languages, isLoading: languagesLoading } = useQuery<Language[]>({
    queryKey: ['/api/languages'],
  });

  // Fetch skill levels
  const { data: skillLevels, isLoading: skillLevelsLoading } = useQuery<SkillLevel[]>({
    queryKey: ['/api/skill-levels'],
  });

  // Fetch courses with relations
  const { data: courses, isLoading: coursesLoading } = useQuery<CourseWithRelations[]>({
    queryKey: ['/api/db/courses', { languageId: selectedLanguage, skillLevelId: selectedSkillLevel, withRelations: true }],
    queryFn: ({ queryKey }) => {
      const params = new URLSearchParams();
      const options = queryKey[1] as any;
      if (options.languageId) params.append('languageId', options.languageId.toString());
      if (options.skillLevelId) params.append('skillLevelId', options.skillLevelId.toString());
      if (options.withRelations) params.append('withRelations', 'true');
      
      return fetch(`/api/db/courses?${params}`).then(res => res.json());
    },
  });

  const handleLanguageSelect = (languageId: number) => {
    setSelectedLanguage(languageId === selectedLanguage ? null : languageId);
  };

  const handleSkillLevelSelect = (skillLevelId: number) => {
    setSelectedSkillLevel(skillLevelId === selectedSkillLevel ? null : skillLevelId);
  };

  if (languagesLoading || skillLevelsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const filteredCourses = courses?.filter(course => {
    if (selectedLanguage && course.languageId !== selectedLanguage) return false;
    if (selectedSkillLevel && course.skillLevelId !== selectedSkillLevel) return false;
    return true;
  }) || [];

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Manager</h1>
          <p className="text-muted-foreground">
            Manage language courses, lessons, and content from your database
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Course
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Languages</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{languages?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Available languages
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{courses?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Across all languages
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {courses?.reduce((total, course) => total + (course.lessons?.length || 0), 0) || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  All lessons combined
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Skill Levels</CardTitle>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{skillLevels?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Available levels
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Languages</CardTitle>
                <CardDescription>Available languages in the system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {languages?.map((language) => (
                  <div
                    key={language.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedLanguage === language.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => handleLanguageSelect(language.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{language.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Code: {language.code}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {courses?.filter(c => c.languageId === language.id).length || 0} courses
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skill Levels</CardTitle>
                <CardDescription>Available difficulty levels</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {skillLevels?.map((level) => (
                  <div
                    key={level.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSkillLevel === level.id 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted'
                    }`}
                    onClick={() => handleSkillLevelSelect(level.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{level.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {level.description}
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {courses?.filter(c => c.skillLevelId === level.id).length || 0} courses
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="courses" className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Filter:</span>
              {selectedLanguage && (
                <Badge variant="outline">
                  {languages?.find(l => l.id === selectedLanguage)?.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setSelectedLanguage(null)}
                  >
                    ×
                  </Button>
                </Badge>
              )}
              {selectedSkillLevel && (
                <Badge variant="outline">
                  {skillLevels?.find(l => l.id === selectedSkillLevel)?.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setSelectedSkillLevel(null)}
                  >
                    ×
                  </Button>
                </Badge>
              )}
            </div>
          </div>

          {coursesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCourses.map((course) => (
                <Card key={course.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        <CardDescription>{course.description}</CardDescription>
                      </div>
                      <Badge variant={course.isActive ? "default" : "secondary"}>
                        {course.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4" />
                        <span>{course.language.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {course.skillLevel.name}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <BookOpen className="h-4 w-4" />
                        <span>Course {course.courseNumber}</span>
                        <span className="text-muted-foreground">•</span>
                        <span>{course.lessons?.length || 0} lessons</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total steps: {course.lessons?.reduce((total, lesson) => total + (lesson.steps?.length || 0), 0) || 0}
                      </div>
                    </div>
                    <Button className="w-full mt-4" variant="outline">
                      Manage Course
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!coursesLoading && filteredCourses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No courses found</h3>
              <p className="text-muted-foreground">
                {selectedLanguage || selectedSkillLevel 
                  ? "Try adjusting your filters or create a new course."
                  : "Get started by creating your first course."
                }
              </p>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Course
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="languages" className="space-y-6">
          <div className="grid gap-4">
            {languages?.map((language) => (
              <Card key={language.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{language.name}</CardTitle>
                      <CardDescription>Language code: {language.code}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>
                        {courses?.filter(c => c.languageId === language.id).length || 0} courses
                      </Badge>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(language.createdAt).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      <Footer />
    </div>
  );
}