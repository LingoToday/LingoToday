import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Globe, Users } from "lucide-react";
import Footer from "@/components/ui/footer";

interface Language {
  id: number;
  code: string;
  name: string;
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
  language?: Language;
  lessons?: any[];
}

export default function CourseTest() {
  // Test API endpoints
  const { data: languages, isLoading: languagesLoading, error: languagesError } = useQuery<Language[]>({
    queryKey: ['/api/languages'],
  });

  const { data: courses, isLoading: coursesLoading, error: coursesError } = useQuery<Course[]>({
    queryKey: ['/api/db/courses'],
    queryFn: () => 
      fetch('/api/db/courses?withRelations=true').then(res => res.json()),
  });

  if (languagesLoading || coursesLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading course data...</span>
        </div>
      </div>
    );
  }

  if (languagesError || coursesError) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Error Loading Data</CardTitle>
            <CardDescription>
              {languagesError ? `Languages Error: ${languagesError.message}` : ''}
              {coursesError ? `Courses Error: ${coursesError.message}` : ''}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Course Database Test</h1>
        <p className="text-muted-foreground">
          Testing the database-driven course management system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Languages</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{languages?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Available in database
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Imported from JSON
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
              Across all courses
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Available Languages</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {languages?.map((language) => (
            <Card key={language.id}>
              <CardHeader>
                <CardTitle className="text-lg">{language.name}</CardTitle>
                <CardDescription>Code: {language.code}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">
                    {courses?.filter(c => c.language?.code === language.code).length || 0} courses
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ID: {language.id}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Imported Courses</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses?.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Course {course.courseNumber}</CardTitle>
                    <CardTitle className="text-base">{course.title}</CardTitle>
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
                    <span>{course.language?.name || 'Unknown'}</span>
                    <span className="text-muted-foreground">•</span>
                    <span>Lang ID: {course.languageId}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4" />
                    <span>{course.lessons?.length || 0} lessons</span>
                    <span className="text-muted-foreground">•</span>
                    <span>DB ID: {course.id}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Skill Level ID: {course.skillLevelId}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">API Response Debug</h2>
        <Card>
          <CardHeader>
            <CardTitle>Raw Data</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Languages Response:</h4>
                <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(languages, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-medium">Courses Response (first course):</h4>
                <pre className="bg-muted p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(courses?.[0], null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}