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

export interface EnhancedContentResult {
  content: EnhancedContent | null;
  fromCache: boolean;
  error?: string;
  httpStatus?: number;
}

export async function generateEnhancedContent(
  language: string,
  lessonId: string,
  lessonInfo: LessonInfo
): Promise<EnhancedContentResult> {
  console.log('[EnhanceService] generateEnhancedContent called with:', { language, lessonId, word: lessonInfo.word });
  
  const cached = await getEnhancedContent(language, lessonId);
  if (cached) {
    console.log('[EnhanceService] Returning cached content');
    return { content: cached, fromCache: true };
  }

  if (!lessonInfo.note || lessonInfo.note.trim().length === 0) {
    console.log('[EnhanceService] No note provided, returning null');
    return { content: null, fromCache: false, error: 'No note provided' };
  }

  console.log('[EnhanceService] Making API call to enhance content...');
  
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

    console.log('[EnhanceService] API response:', JSON.stringify(response, null, 2));

    if (!response.success || !response.enhancedContent) {
      const errorMsg = response.error || 'API returned no content';
      console.error('[EnhanceService] API returned error or no content:', errorMsg);
      return { content: null, fromCache: false, error: errorMsg, httpStatus: response.httpStatus };
    }
    
    // Helper to safely convert any value to string
    const toStringValue = (value: any): string => {
      if (!value) return '';
      if (typeof value === 'string') return value;
      if (typeof value === 'object') {
        // Handle objects with common keys from backend
        const parts: string[] = [];
        if (value.scenario) parts.push(value.scenario);
        if (value.example) parts.push(`Example: ${value.example}`);
        if (value.male) parts.push(`Male: ${value.male}`);
        if (value.female) parts.push(`Female: ${value.female}`);
        if (value.formal) parts.push(`Formal: ${value.formal}`);
        if (value.informal) parts.push(`Informal: ${value.informal}`);
        if (value.text) parts.push(value.text);
        if (value.phonetic) parts.push(value.phonetic);
        // If no recognized keys, stringify the whole thing
        if (parts.length === 0) {
          return JSON.stringify(value);
        }
        return parts.join('\n\n');
      }
      return String(value);
    };

    const enhancedContent: EnhancedContent = {
      pronunciation: toStringValue(response.enhancedContent.pronunciation),
      genderNote: toStringValue(response.enhancedContent.genderNote),
      dailyLifeUsage: toStringValue(response.enhancedContent.dailyLifeUsage),
      originalNote: lessonInfo.note,
    };

    console.log('[EnhanceService] ✅ Enhanced content created:', enhancedContent);

    const cacheKey = getCacheKey(language, lessonId);
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(enhancedContent));
      console.log('[EnhanceService] Content cached successfully');
    } catch (cacheError) {
      console.warn('[EnhanceService] Error caching enhanced content:', cacheError);
    }

    return { content: enhancedContent, fromCache: false };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[EnhanceService] ❌ Error generating enhanced content:', errorMsg);
    return { content: null, fromCache: false, error: errorMsg };
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
