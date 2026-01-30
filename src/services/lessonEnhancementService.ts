import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../lib/apiClient';

const CACHE_KEY_PREFIX = 'enhanced_lesson_';

interface EnhancedContent {
  pronunciation: string;
  genderNote: string;
  dailyLifeUsage: string;
  originalNote: string;
}

interface LessonInfo {
  word: string;
  translation: string;
  example?: string;
  exampleTranslation?: string;
  note?: string;
}

function getCacheKey(language: string, lessonId: string): string {
  return `${CACHE_KEY_PREFIX}${language}_${lessonId}`;
}

export async function getEnhancedContent(
  language: string,
  lessonId: string
): Promise<EnhancedContent | null> {
  const cacheKey = getCacheKey(language, lessonId);
  
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (error) {
    console.warn('Error reading cached enhanced content:', error);
  }

  return null;
}

export async function generateEnhancedContent(
  language: string,
  lessonId: string,
  lessonInfo: LessonInfo
): Promise<EnhancedContent | null> {
  const cached = await getEnhancedContent(language, lessonId);
  if (cached) {
    return cached;
  }

  if (!lessonInfo.note || lessonInfo.note.trim().length === 0) {
    return null;
  }

  try {
    const response = await apiClient.enhanceLessonContent({
      language,
      lessonId,
      word: lessonInfo.word,
      translation: lessonInfo.translation,
      example: lessonInfo.example,
      exampleTranslation: lessonInfo.exampleTranslation,
      note: lessonInfo.note,
    });

    if (!response.success || !response.enhancedContent) {
      throw new Error(response.error || 'Failed to enhance content');
    }
    
    const enhancedContent: EnhancedContent = {
      pronunciation: response.enhancedContent.pronunciation || '',
      genderNote: response.enhancedContent.genderNote || '',
      dailyLifeUsage: response.enhancedContent.dailyLifeUsage || '',
      originalNote: lessonInfo.note,
    };

    const cacheKey = getCacheKey(language, lessonId);
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(enhancedContent));
    } catch (cacheError) {
      console.warn('Error caching enhanced content:', cacheError);
    }

    return enhancedContent;
  } catch (error) {
    console.error('Error generating enhanced content:', error);
    return null;
  }
}

export async function clearEnhancedContentCache(language?: string, lessonId?: string): Promise<void> {
  try {
    if (language && lessonId) {
      const cacheKey = getCacheKey(language, lessonId);
      await AsyncStorage.removeItem(cacheKey);
    } else {
      const allKeys = await AsyncStorage.getAllKeys();
      const cacheKeys = allKeys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      if (cacheKeys.length > 0) {
        await AsyncStorage.multiRemove(cacheKeys);
      }
    }
  } catch (error) {
    console.warn('Error clearing enhanced content cache:', error);
  }
}
