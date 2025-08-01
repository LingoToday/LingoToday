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
  week?: number;
  day?: number;
  category?: string;
  categoryOrder?: number;
  level?: string;
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

// Convert API lesson data to flat array (handles both old and new structures)
export function processLessonData(apiData: any, language: string): LessonData[] {
  const lessons: LessonData[] = [];
  
  console.log(`🔧 Processing lesson data for ${language}:`, { 
    dataType: typeof apiData, 
    isArray: Array.isArray(apiData),
    keys: Object.keys(apiData || {})
  });
  
  if (!apiData || typeof apiData !== 'object') {
    console.error('❌ Invalid API data received:', apiData);
    return lessons;
  }
  
  // Check if this is the new Italian course structure
  if (language === 'italian' && apiData.course1) {
    console.log('🆕 Processing new Italian course structure');
    
    // Course order for proper progression
    const courseOrder = ['course1', 'course2', 'course3', 'course4'];
    
    courseOrder.forEach((courseId, courseIndex) => {
      const courseData = apiData[courseId];
      if (!courseData || !courseData.lessons) {
        console.log(`⚠️ No course data for ${courseId}`);
        return;
      }
      
      console.log(`📚 Processing ${courseId}: ${courseData.title}`);
      
      // Lesson order within each course
      const lessonOrder = ['lesson1', 'lesson2', 'lesson3', 'lesson4'];
      
      lessonOrder.forEach((lessonId, lessonIndex) => {
        const lessonData = courseData.lessons[lessonId];
        if (!lessonData) return; // Skip if lesson doesn't exist
        
        // Create a standardized lesson object
        const lesson: LessonData = {
          id: `${courseId}_${lessonId}`,
          title: lessonData.title,
          emoji: '📚',
          description: `${courseData.title}: ${lessonData.title}`,
          content: {
            word: lessonData.items[0]?.italian || '',
            translation: lessonData.items[0]?.english || '',
            pronunciation: lessonData.items[0]?.italian || '',
            example: lessonData.items[1]?.italian || lessonData.items[0]?.italian || '',
            exampleTranslation: lessonData.items[1]?.english || lessonData.items[0]?.english || ''
          },
          quiz: {
            question: `What does "${lessonData.items[0]?.italian || ''}" mean?`,
            options: [
              lessonData.items[0]?.english || '',
              'Wrong answer 1',
              'Wrong answer 2',
              'Wrong answer 3'
            ],
            correct: 0
          },
          words: lessonData.items.map((item: any) => item.italian).filter(Boolean),
          week: courseIndex + 1,
          day: lessonIndex + 1,
          category: courseData.title,
          // Fix: lessonIndex should start from 0, so lesson1 gets categoryOrder 0, lesson2 gets 1, etc.
          categoryOrder: (courseIndex * 10) + lessonIndex
        };
        
        console.log(`📚 Adding lesson: ${lesson.id} (${courseData.title}: ${lessonData.title})`);
        lessons.push(lesson);
      });
    });
  } else {
    // Handle old lesson structures for other languages
    console.log('📜 Processing legacy lesson structure');
    
    Object.keys(apiData).forEach(categoryKey => {
      const categoryData = apiData[categoryKey];
      
      console.log(`📅 Processing ${categoryKey}:`, Object.keys(categoryData || {}));
      
      if (!categoryData || typeof categoryData !== 'object') {
        console.error(`❌ Invalid category data for ${categoryKey}:`, categoryData);
        return;
      }
      
      // Check if this is old week-based structure (week_1, week_2) or new category structure
      if (categoryKey.startsWith('week_')) {
        // Handle old week-based structure
        const week = parseInt(categoryKey.replace('week_', ''));
        
        Object.keys(categoryData).forEach(dayKey => {
          const day = parseInt(dayKey.replace('day_', ''));
          const lesson = categoryData[dayKey];
          
          if (!lesson || !lesson.id) {
            console.error(`❌ Invalid lesson data for ${categoryKey}/${dayKey}:`, lesson);
            return;
          }
          
          console.log(`📚 Adding lesson: ${lesson.id} (Week ${week}, Day ${day})`);
          
          lessons.push({
            ...lesson,
            week,
            day
          });
        });
      } else {
        // Handle category-based structure
        Object.keys(categoryData).forEach(lessonKey => {
          const lesson = categoryData[lessonKey];
          
          if (!lesson || !lesson.id) {
            console.error(`❌ Invalid lesson data for ${categoryKey}/${lessonKey}:`, lesson);
            return;
          }
          
          console.log(`📚 Adding lesson: ${lesson.id} (Category: ${lesson.category || categoryKey})`);
          
          // Add week/day defaults for compatibility with existing code
          lessons.push({
            ...lesson,
            week: lesson.week || 1,
            day: lesson.day || lessons.length + 1,
            category: lesson.category || categoryKey
          });
        });
      }
    });
  }
  
  // Sort by category order first, then by lesson number within category
  const sortedLessons = lessons.sort((a, b) => {
    // Primary sort: by categoryOrder (learning progression)
    const orderA = a.categoryOrder || 999;
    const orderB = b.categoryOrder || 999;
    if (orderA !== orderB) return orderA - orderB;
    
    // Secondary sort: by lesson ID within same category
    return a.id.localeCompare(b.id);
  });
  
  console.log(`✅ Processed ${sortedLessons.length} lessons total`);
  return sortedLessons;
}

// Get next uncompleted lessons
export function getNextLessons(completedLessonIds: string[], maxCount: number = 50): LessonData[] {
  try {
    // Get lessons in proper learning order
    const orderedLessons = getLessonsInOrder();
    
    // Filter out completed lessons while maintaining order
    const uncompletedLessons = orderedLessons.filter(lesson => 
      !completedLessonIds.includes(lesson.id)
    );
    

    return uncompletedLessons.slice(0, maxCount);
  } catch (error) {
    console.error('Error getting next lessons:', error);
    return [];
  }
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
    console.log(`🔄 Loading lessons for ${language} from API...`);
    
    // Use the courses endpoint for Italian to get the proper course structure
    const endpoint = language === 'italian' ? `/api/courses/${language}` : `/api/lessons/${language}`;
    const response = await fetch(endpoint, {
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📡 API Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to load lessons: ${response.status} - ${errorText}`);
      return false;
    }
    
    const apiData = await response.json();
    console.log(`📊 Received API data:`, { keys: Object.keys(apiData), sample: Object.keys(apiData)[0] });
    
    const lessons = processLessonData(apiData, language);
    console.log(`🔢 Processed ${lessons.length} lessons from API data`);
    
    if (lessons.length === 0) {
      console.error('❌ No lessons were processed from API data');
      return false;
    }
    
    storeLessons(lessons, language);
    console.log(`✅ Successfully loaded and stored ${lessons.length} lessons`);
    
    return true;
  } catch (error) {
    console.error('❌ Error loading lessons from API:', error);
    return false;
  }
}

// Initialize lesson store on app start
export async function initializeLessonStore(language: string, completedLessonIds: string[]): Promise<void> {
  console.log(`🔧 Initializing lesson store for language: "${language}"`);
  
  // Always load fresh data from API instead of using cache for now
  console.log('💫 Loading fresh lesson data from API (bypassing cache)...');
  
  // Load fresh data from API
  console.log('Loading fresh lesson data from API...');
  const success = await loadAndStoreLessons(language);
  
  if (success) {
    console.log(`✅ Successfully initialized lesson store for ${language}`);
    
    // Verify the data was stored correctly
    const verifyStored = loadStoredLessons();
    if (verifyStored) {
      console.log(`🔍 Verification: ${verifyStored.lessons.length} lessons stored for ${verifyStored.language}`);
    } else {
      console.error(`❌ Verification failed: No data found after storage`);
    }
  } else {
    console.error(`❌ Failed to initialize lesson store for ${language}`);
  }
}

// Get lessons in learning order (sorted by categoryOrder)
export function getLessonsInOrder(): LessonData[] {
  try {
    const stored = loadStoredLessons();
    if (!stored || stored.lessons.length === 0) return [];
    
    const sorted = stored.lessons.sort((a, b) => {
      const orderA = a.categoryOrder !== undefined ? a.categoryOrder : 999;
      const orderB = b.categoryOrder !== undefined ? b.categoryOrder : 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.id.localeCompare(b.id);
    });
    

    return sorted;
  } catch (error) {
    console.error('Error getting lessons in order:', error);
    return [];
  }
}

// Get the next lesson to learn (first incomplete lesson in order)
export function getNextLessonToLearn(completedLessonIds: string[] = []): LessonData | null {
  try {
    const orderedLessons = getLessonsInOrder();
    
    // Find the first lesson that hasn't been completed
    for (const lesson of orderedLessons) {
      if (!completedLessonIds.includes(lesson.id)) {
        return lesson;
      }
    }
    
    // If all lessons are completed, return the first lesson for review
    console.log('All lessons completed, returning first lesson for review');
    return orderedLessons[0] || null;
  } catch (error) {
    console.error('Error getting next lesson:', error);
    return null;
  }
}