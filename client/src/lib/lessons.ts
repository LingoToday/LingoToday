export interface LessonContent {
  word: string;
  translation: string;
  pronunciation: string;
  example: string;
  exampleTranslation: string;
}

export interface LessonQuiz {
  question: string;
  options: string[];
  correct: number;
}

export interface Lesson {
  id: string;
  title: string;
  emoji: string;
  description: string;
  content: LessonContent;
  quiz: LessonQuiz;
  words: string[];
}

export interface WeekData {
  [day: string]: Lesson;
}

export interface LanguageData {
  [week: string]: WeekData;
}

export interface LessonsData {
  [language: string]: LanguageData;
}

// Helper function to get lesson by coordinates
export function getLessonPath(language: string, week: number, day: number): string {
  return `/api/lessons/${language}/${week}/${day}`;
}

// Helper function to get next lesson
export function getNextLesson(language: string, week: number, day: number): { week: number; day: number } | null {
  // Simple logic: increment day, if day > 5, increment week and reset day to 1
  if (day < 5) {
    return { week, day: day + 1 };
  } else if (week < 4) { // Assuming 4 weeks of content
    return { week: week + 1, day: 1 };
  }
  return null; // No more lessons
}

// Helper function to get previous lesson
export function getPreviousLesson(language: string, week: number, day: number): { week: number; day: number } | null {
  if (day > 1) {
    return { week, day: day - 1 };
  } else if (week > 1) {
    return { week: week - 1, day: 5 };
  }
  return null; // No previous lessons
}

// Helper function to format lesson progress
export function formatLessonProgress(completed: number, total: number): string {
  const percentage = Math.round((completed / total) * 100);
  return `${percentage}%`;
}

// Helper function to calculate streak
export function calculateStreak(progressDates: Date[]): number {
  if (progressDates.length === 0) return 0;
  
  const sortedDates = progressDates.sort((a, b) => b.getTime() - a.getTime());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let currentDate = new Date(today);
  
  for (const date of sortedDates) {
    const lessonDate = new Date(date);
    lessonDate.setHours(0, 0, 0, 0);
    
    if (lessonDate.getTime() === currentDate.getTime()) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else if (lessonDate.getTime() < currentDate.getTime()) {
      break;
    }
  }
  
  return streak;
}

// Helper function to get language display name
export function getLanguageDisplayName(language: string): string {
  const names: { [key: string]: string } = {
    spanish: "Spanish",
    italian: "Italian",
    french: "French",
    german: "German",
  };
  return names[language] || language.charAt(0).toUpperCase() + language.slice(1);
}

// Helper function to get language flag emoji
export function getLanguageFlag(language: string): string {
  const flags: { [key: string]: string } = {
    spanish: "🇪🇸",
    italian: "🇮🇹",
    french: "🇫🇷",
    german: "🇩🇪",
  };
  return flags[language] || "🌍";
}
