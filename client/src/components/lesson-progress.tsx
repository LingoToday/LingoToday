import { Card, CardContent } from "@/components/ui/card";
// import { Progress } from "@/components/ui/progress"; // Component not available, using div instead
import { Check, Lock } from "lucide-react";
import { getLessonsInOrder } from "@/lib/lessonStore";
import { useEffect, useState } from "react";

interface LessonProgressProps {
  completedLessonIds: string[];
}

interface CategoryProgress {
  name: string;
  emoji: string;
  level: string;
  totalLessons: number;
  completedLessons: number;
  isUnlocked: boolean;
  order: number;
}

export default function LessonProgress({ completedLessonIds }: LessonProgressProps) {
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress[]>([]);

  useEffect(() => {
    // Get user progress data and calculate actual progress based on database records
    const getProgressFromAPI = async () => {
      try {
        // Fetch dynamic course mapping with correct lesson counts
        const courseMappingResponse = await fetch('/api/course-mapping/it', { credentials: 'same-origin' });
        if (!courseMappingResponse.ok) {
          throw new Error(`HTTP error! status: ${courseMappingResponse.status}`);
        }
        const courseMapping = await courseMappingResponse.json();
        
        // Fetch user progress data
        const progressResponse = await fetch('/api/progress/italian', { credentials: 'same-origin' });
        if (!progressResponse.ok) {
          throw new Error(`HTTP error! status: ${progressResponse.status}`);
        }
        const progressData = await progressResponse.json();
        
        // Calculate progress for each course based on actual database progress
        const progress: CategoryProgress[] = [];
        let hasUncompletedCategory = false;

        courseMapping.forEach((course: any) => {
          // Count completed lessons in this course from the database progress
          const completedInCategory = progressData.filter((p: any) => 
            p.courseId === course.courseId && p.completed === true
          ).length;
          
          const isUnlocked = !hasUncompletedCategory || completedInCategory > 0;
          
          progress.push({
            name: course.name,
            emoji: course.emoji,
            level: course.level,
            totalLessons: course.totalLessons,
            completedLessons: completedInCategory,
            isUnlocked,
            order: course.order
          });

          // If this category is not completed, next categories are locked
          if (completedInCategory < course.totalLessons) {
            hasUncompletedCategory = true;
          }
        });

        setCategoryProgress(progress);
      } catch (error) {
        console.error('Error fetching progress:', error);
        // Fallback to old method if API fails
        const lessons = getLessonsInOrder();
        
        // Group lessons by category to get actual progress
        const categoryMap = new Map<string, any>();
        lessons.forEach(lesson => {
          const categoryName = lesson.category || 'Unknown';
          if (!categoryMap.has(categoryName)) {
            categoryMap.set(categoryName, {
              lessons: []
            });
          }
          categoryMap.get(categoryName)!.lessons.push(lesson);
        });

        // Fallback hardcoded mapping (old values for safety)
        const fallbackCourseMapping = [
          { courseId: "course1", name: "Greetings", emoji: "👋", level: "A1", totalLessons: 20, order: 1 },
          { courseId: "course2", name: "Introducing Yourself", emoji: "🙋", level: "A1", totalLessons: 20, order: 2 },
          { courseId: "course3", name: "Essential Courtesy Phrases", emoji: "🙏", level: "A1", totalLessons: 21, order: 3 },
          { courseId: "course4", name: "Numbers", emoji: "🔢", level: "A1", totalLessons: 41, order: 4 },
          { courseId: "course5", name: "Time and Date", emoji: "⏰", level: "A1", totalLessons: 49, order: 5 },
          { courseId: "course6", name: "Family and People", emoji: "👨‍👩‍👧‍👦", level: "A1", totalLessons: 44, order: 6 },
          { courseId: "course7", name: "Colors & Adjectives", emoji: "🎨", level: "A1", totalLessons: 29, order: 7 },
          { courseId: "course8", name: "Weather and Seasons", emoji: "🌤️", level: "A1", totalLessons: 24, order: 8 },
          { courseId: "course9", name: "Food and Drinks", emoji: "🍝", level: "A1", totalLessons: 29, order: 9 },
          { courseId: "course10", name: "Directions and Places", emoji: "📍", level: "A1", totalLessons: 28, order: 10 },
          { courseId: "course11", name: "Shopping", emoji: "🛒", level: "A1", totalLessons: 13, order: 11 },
          { courseId: "course12", name: "Likes and Dislikes", emoji: "❤️", level: "A1", totalLessons: 14, order: 12 },
          { courseId: "course13", name: "Basic Grammar", emoji: "📚", level: "A1", totalLessons: 29, order: 13 }
        ];

        // Calculate progress for each course (fallback method)
        const progress: CategoryProgress[] = [];
        let hasUncompletedCategory = false;

        fallbackCourseMapping.forEach(course => {
          const categoryData = categoryMap.get(course.name);
          const actualLessons = categoryData ? categoryData.lessons : [];
          
          const completedInCategory = actualLessons.filter((lesson: any) => 
            completedLessonIds.includes(lesson.id)
          ).length;
          
          const isUnlocked = !hasUncompletedCategory || completedInCategory > 0;
          
          progress.push({
            name: course.name,
            emoji: course.emoji,
            level: course.level,
            totalLessons: course.totalLessons,
            completedLessons: completedInCategory,
            isUnlocked,
            order: course.order
          });

          // If this category is not completed, next categories are locked
          if (actualLessons.length > 0 && completedInCategory < actualLessons.length) {
            hasUncompletedCategory = true;
          }
        });

        setCategoryProgress(progress);
      }
    };

    getProgressFromAPI();
  }, [completedLessonIds]);

  return (
    <Card className="bg-white border border-gray-200 shadow-card">
      <CardContent className="p-4">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Learning Path</h3>
        <div className="space-y-2">
          {categoryProgress.map((category, index) => (
            <div key={category.name} className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                category.completedLessons === category.totalLessons 
                  ? 'bg-green-100 text-green-700'
                  : category.isUnlocked 
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-400'
              }`}>
                {category.completedLessons === category.totalLessons ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : category.isUnlocked ? (
                  <span className="text-sm">{category.emoji}</span>
                ) : (
                  <Lock className="h-3 w-3" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium truncate ${
                    category.isUnlocked ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {category.name}
                  </span>
                  <span className={`text-sm font-medium ml-2 flex-shrink-0 ${
                    category.completedLessons === category.totalLessons 
                      ? 'text-green-600' 
                      : category.completedLessons > 0 
                        ? 'text-primary-600' 
                        : 'text-gray-500'
                  }`}>
                    {category.completedLessons}/{category.totalLessons}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      category.completedLessons === category.totalLessons 
                        ? 'bg-green-500'
                        : 'bg-primary'
                    }`}
                    style={{
                      width: `${category.totalLessons > 0 ? (category.completedLessons / category.totalLessons) * 100 : 0}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <p className="font-medium">Complete Italian Course</p>
            <p className="text-sm text-blue-600 mt-1">
              {categoryProgress.reduce((sum, cat) => sum + cat.totalLessons, 0)} lessons • {categoryProgress.length} courses
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}