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
    const lessons = getLessonsInOrder();
    
    // Group lessons by category
    const categoryMap = new Map<string, any>();
    
    lessons.forEach(lesson => {
      const categoryName = lesson.category || 'Unknown';
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          name: categoryName,
          emoji: lesson.emoji || '📖',
          level: lesson.level || 'A1',
          order: lesson.categoryOrder || 999,
          lessons: []
        });
      }
      categoryMap.get(categoryName)!.lessons.push(lesson);
    });

    // Calculate progress for each category
    const progress: CategoryProgress[] = [];
    let hasUncompletedCategory = false;

    Array.from(categoryMap.values())
      .sort((a, b) => a.order - b.order)
      .forEach(category => {
        const completedInCategory = category.lessons.filter((lesson: any) => 
          completedLessonIds.includes(lesson.id)
        ).length;
        
        const isUnlocked = !hasUncompletedCategory || completedInCategory > 0;
        
        progress.push({
          name: category.name,
          emoji: category.emoji,
          level: category.level,
          totalLessons: category.lessons.length,
          completedLessons: completedInCategory,
          isUnlocked,
          order: category.order
        });

        // If this category is not completed, next categories are locked
        if (completedInCategory < category.lessons.length) {
          hasUncompletedCategory = true;
        }
      });

    setCategoryProgress(progress);
  }, [completedLessonIds]);

  return (
    <Card className="bg-white border border-gray-200 shadow-card">
      <CardContent className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Learning Path</h3>
        <div className="space-y-3">
          {categoryProgress.map((category, index) => (
            <div key={category.name} className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                category.isUnlocked 
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {category.completedLessons === category.totalLessons ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : category.isUnlocked ? (
                  category.emoji
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${
                    category.isUnlocked ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {category.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    [{category.level}] {category.completedLessons}/{category.totalLessons}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(category.completedLessons / category.totalLessons) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}