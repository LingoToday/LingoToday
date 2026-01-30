import AsyncStorage from '@react-native-async-storage/async-storage';
import OpenAI from 'openai';
import Constants from 'expo-constants';

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

const openai = new OpenAI({
  apiKey: Constants?.expoConfig?.extra?.openaiApiKey || process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

function getCacheKey(language: string, lessonId: string): string {
  return `${CACHE_KEY_PREFIX}${language}_${lessonId}`;
}

export async function getEnhancedContent(
  language: string,
  lessonId: string,
  lessonInfo: LessonInfo
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
  const cached = await getEnhancedContent(language, lessonId, lessonInfo);
  if (cached) {
    return cached;
  }

  if (!lessonInfo.note || lessonInfo.note.trim().length === 0) {
    return null;
  }

  try {
    const languageName = language.charAt(0).toUpperCase() + language.slice(1);
    
    const prompt = `You are a language learning expert helping students learn ${languageName}. Given the following lesson information, create an enhanced "How to use" guide.

Lesson Word/Phrase: ${lessonInfo.word}
Translation: ${lessonInfo.translation}
${lessonInfo.example ? `Example: ${lessonInfo.example}` : ''}
${lessonInfo.exampleTranslation ? `Example Translation: ${lessonInfo.exampleTranslation}` : ''}
Current "When to use" note: ${lessonInfo.note}

Please provide an enhanced version with the following sections. Format each section on its own line with a blank line between sections:

1. Pronunciation: Write how to pronounce "${lessonInfo.word}" using easy phonetic spelling that English speakers can read. Include stress marks if helpful.

2. Gender/Form: If the word has masculine/feminine forms, plural variants, or formal/informal versions in ${languageName}, explain briefly. If not applicable, write "Not applicable for this word."

3. Daily Life Usage: Give 1-2 practical examples of when someone would use this word or phrase in everyday situations. Keep it conversational and relatable.

Respond with ONLY JSON in this exact format:
{
  "pronunciation": "your pronunciation guide here",
  "genderNote": "your gender/form note here", 
  "dailyLifeUsage": "your daily life usage examples here"
}`;

    // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const parsed = JSON.parse(content);
    
    const enhancedContent: EnhancedContent = {
      pronunciation: parsed.pronunciation || '',
      genderNote: parsed.genderNote || '',
      dailyLifeUsage: parsed.dailyLifeUsage || '',
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
