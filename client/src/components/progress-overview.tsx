import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, Play } from "lucide-react";

export default function ProgressOverview() {
  const { data: dashboardData } = useQuery({
    queryKey: ["/api/dashboard"],
    retry: false,
  });

  if (!dashboardData) {
    return (
      <Card className="shadow-material">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="flex space-x-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-8 h-8 bg-gray-200 rounded-full"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { settings, stats, progress } = dashboardData;
  
  // Calculate week progress (assuming 5 days per week)
  const currentWeek = 2;
  const currentDay = 3;
  const weekProgress = (currentDay / 5) * 100;
  
  // Get days of week for visual representation
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  
  return (
    <Card className="shadow-material">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-900">This Week's Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Week {currentWeek} Progress</span>
            <span className="font-medium">{currentDay}/5 days</span>
          </div>
          <Progress value={weekProgress} className="h-2" />
        </div>
        
        <div className="grid grid-cols-5 gap-2">
          {daysOfWeek.map((day, index) => {
            const dayNumber = index + 1;
            const isCompleted = dayNumber < currentDay;
            const isCurrent = dayNumber === currentDay;
            const isFuture = dayNumber > currentDay;
            
            return (
              <div key={day} className="text-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs mb-1 ${
                  isCompleted ? 'bg-success-500 text-white' :
                  isCurrent ? 'bg-primary-500 text-white' :
                  'bg-gray-200 text-gray-400'
                }`}>
                  {isCompleted ? <Check className="h-3 w-3" /> :
                   isCurrent ? <Play className="h-3 w-3" /> :
                   dayNumber}
                </div>
                <div className="text-xs text-gray-500">{day}</div>
              </div>
            );
          })}
        </div>
        
        <div className="pt-4 border-t border-gray-100">
          <h4 className="font-medium text-gray-900 mb-3">Learning Goals</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Daily lessons</span>
              <span className="text-success-600 font-medium">{currentDay}/5 this week</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">New words</span>
              <span className="text-primary-600 font-medium">{stats.wordsLearned || 0} learned</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Current streak</span>
              <span className="text-secondary-600 font-medium">{stats.streak || 0} days</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
