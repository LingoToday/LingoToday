// Frontend lesson data store for offline-first notifications

interface LessonData {
  id: string;
  title: string;
  emoji: string;
  description: string;
  content: any;
  quiz: {
    question: string;
    options: string[];
    correct: number;
  };
  words: string[];
  week: number;
  day: number;
}

interface LessonStore {
  lessons: LessonData[];
  lastUpdated: number;
  language: string;
}

const STORAGE_KEY = 'desklingo-lesson-store';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Load lessons from localStorage
export function loadStoredLessons(): LessonStore | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      console.log('❌ No stored lesson data found in localStorage');
      return null;
    }
    
    const data = JSON.parse(stored);
    
    // Check if cache is still valid
    if (Date.now() - data.lastUpdated > CACHE_DURATION) {
      console.log('Lesson cache expired, needs refresh');
      return null;
    }
    
    console.log(`Loaded ${data.lessons.length} cached lessons for ${data.language}`);
    return data;
  } catch (error) {
    console.error('Error loading stored lessons:', error);
    return null;
  }
}

// Store lessons in localStorage
export function storeLessons(lessons: LessonData[], language: string): void {
  try {
    const store: LessonStore = {
      lessons,
      lastUpdated: Date.now(),
      language
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    console.log(`Stored ${lessons.length} lessons for ${language}`);
  } catch (error) {
    console.error('Error storing lessons:', error);
  }
}

// Convert API lesson data to flat array
export function processLessonData(apiData: any, language: string): LessonData[] {
  const lessons: LessonData[] = [];
  
  Object.keys(apiData).forEach(weekKey => {
    const week = parseInt(weekKey.replace('week_', ''));
    const weekData = apiData[weekKey];
    
    Object.keys(weekData).forEach(dayKey => {
      const day = parseInt(dayKey.replace('day_', ''));
      const lesson = weekData[dayKey];
      
      lessons.push({
        ...lesson,
        week,
        day
      });
    });
  });
  
  return lessons.sort((a, b) => {
    if (a.week !== b.week) return a.week - b.week;
    return a.day - b.day;
  });
}

// Get next uncompleted lessons
export function getNextLessons(completedLessonIds: string[], maxCount: number = 50): LessonData[] {
  const stored = loadStoredLessons();
  if (!stored) return [];
  
  const uncompletedLessons = stored.lessons.filter(lesson => 
    !completedLessonIds.includes(lesson.id)
  );
  
  return uncompletedLessons.slice(0, maxCount);
}

// Get lesson by ID
export function getLessonById(lessonId: string): LessonData | null {
  const stored = loadStoredLessons();
  if (!stored) return null;
  
  return stored.lessons.find(lesson => lesson.id === lessonId) || null;
}

// Get random lesson for notification
export function getRandomLesson(completedLessonIds: string[]): LessonData | null {
  console.log('🔍 Getting random lesson, checking stored data...');
  const stored = loadStoredLessons();
  if (!stored || stored.lessons.length === 0) {
    console.log("❌ No stored lessons available", { stored: !!stored, count: stored?.lessons?.length || 0 });
    console.log("🔧 Debug: localStorage keys:", Object.keys(localStorage));
    return null;
  }
  
  // First try to get an uncompleted lesson
  const nextLessons = getNextLessons(completedLessonIds, 10);
  
  if (nextLessons.length > 0) {
    console.log(`🎯 Found ${nextLessons.length} uncompleted lessons`);
    return nextLessons[Math.floor(Math.random() * nextLessons.length)];
  }
  
  // If no uncompleted lessons, get a random completed lesson for review
  const completedLessons = stored.lessons.filter(lesson => 
    completedLessonIds.includes(lesson.id)
  );
  
  if (completedLessons.length > 0) {
    console.log(`🔄 All lessons completed, using ${completedLessons.length} lessons for review`);
    return completedLessons[Math.floor(Math.random() * completedLessons.length)];
  }
  
  // If no completed lessons (empty progress), just return a random lesson from stored data
  console.log(`🆕 No progress found, using random lesson from ${stored.lessons.length} available lessons`);
  return stored.lessons[Math.floor(Math.random() * stored.lessons.length)];
}

// Load lessons from API and store locally
export async function loadAndStoreLessons(language: string): Promise<boolean> {
  try {
    console.log(`Loading lessons for ${language} from API...`);
    
    const response = await fetch(`/api/lessons/${language}`, {
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to load lessons: ${response.status}`);
      return false;
    }
    
    const apiData = await response.json();
    const lessons = processLessonData(apiData, language);
    
    storeLessons(lessons, language);
    console.log(`Successfully loaded and stored ${lessons.length} lessons`);
    
    return true;
  } catch (error) {
    console.error('Error loading lessons from API:', error);
    return false;
  }
}

// Initialize lesson store on app start
export async function initializeLessonStore(language: string, completedLessonIds: string[]): Promise<void> {
  console.log(`🔧 Initializing lesson store for language: "${language}"`);
  
  // Check if we have valid cached data
  const cached = loadStoredLessons();
  
  if (cached && cached.language === language) {
    console.log('Using cached lesson data');
    console.log(`📚 Cached data contains ${cached.lessons.length} lessons for ${cached.language}`);
    return;
  }
  
  // Load fresh data from API
  console.log('Loading fresh lesson data from API...');
  const success = await loadAndStoreLessons(language);
  
  if (success) {
    console.log(`✅ Successfully initialized lesson store for ${language}`);
  } else {
    console.error(`❌ Failed to initialize lesson store for ${language}`);
  }
}