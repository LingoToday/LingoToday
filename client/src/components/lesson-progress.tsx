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
    // Define the complete course structure with correct lesson counts from the course outline
    const courseStructure = [
      { name: "Greetings", emoji: "👋", level: "A1", totalLessons: 13, order: 1 },
      { name: "Introducing Yourself", emoji: "🙋", level: "A1", totalLessons: 13, order: 2 },
      { name: "Essential Courtesy Phrases", emoji: "🙏", level: "A1", totalLessons: 14, order: 3 },
      { name: "Numbers", emoji: "🔢", level: "A1", totalLessons: 6, order: 4 },
      { name: "Time and Date", emoji: "⏰", level: "A1", totalLessons: 13, order: 5 },
      { name: "Family and People", emoji: "👨‍👩‍👧‍👦", level: "A1", totalLessons: 11, order: 6 },
      { name: "Colors & Adjectives", emoji: "🎨", level: "A1", totalLessons: 12, order: 7 },
      { name: "Weather and Seasons", emoji: "🌤️", level: "A1", totalLessons: 13, order: 8 },
      { name: "Food and Drinks", emoji: "🍝", level: "A1", totalLessons: 14, order: 9 },
      { name: "Directions and Places", emoji: "📍", level: "A1", totalLessons: 12, order: 10 },
      { name: "Shopping", emoji: "🛒", level: "A1", totalLessons: 12, order: 11 },
      { name: "Likes and Dislikes", emoji: "❤️", level: "A1", totalLessons: 11, order: 12 },
      { name: "Basic Grammar", emoji: "📚", level: "A1", totalLessons: 22, order: 13 }
    ];

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

    // Calculate progress for each course
    const progress: CategoryProgress[] = [];
    let hasUncompletedCategory = false;

    courseStructure.forEach(course => {
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
      // For now, only check courses that have actual lessons loaded
      if (actualLessons.length > 0 && completedInCategory < actualLessons.length) {
        hasUncompletedCategory = true;
      }
    });

    setCategoryProgress(progress);
  }, [completedLessonIds]);

  return (
    <Card className="bg-white border border-gray-200 shadow-card">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Learning Path</h3>
        <div className="space-y-4">
          {categoryProgress.map((category, index) => (
            <div key={category.name} className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                category.completedLessons === category.totalLessons 
                  ? 'bg-green-100 text-green-700'
                  : category.isUnlocked 
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-400'
              }`}>
                {category.completedLessons === category.totalLessons ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : category.isUnlocked ? (
                  <span className="text-lg">{category.emoji}</span>
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`text-base font-medium ${
                      category.isUnlocked ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {category.name}
                    </span>
                  </div>
                  <span className={`text-sm font-medium ${
                    category.completedLessons === category.totalLessons 
                      ? 'text-green-600' 
                      : category.completedLessons > 0 
                        ? 'text-primary-600' 
                        : 'text-gray-500'
                  }`}>
                    {category.completedLessons}/{category.totalLessons} lessons
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      category.completedLessons === category.totalLessons 
                        ? 'bg-green-500'
                        : 'bg-primary'
                    }`}
                    style={{
                      width: `${category.totalLessons > 0 ? (category.completedLessons / category.totalLessons) * 100 : 0}%`
                    }}
                  />
                </div>
                {category.completedLessons === category.totalLessons && (
                  <div className="text-xs text-green-600 mt-1 font-medium">
                    ✓ Course completed!
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Complete Italian Course</p>
            <p className="text-xs text-blue-600">
              Total: {categoryProgress.reduce((sum, cat) => sum + cat.totalLessons, 0)} lessons across {categoryProgress.length} courses
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}