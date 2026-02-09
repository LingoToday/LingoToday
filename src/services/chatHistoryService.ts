import AsyncStorage from '@react-native-async-storage/async-storage';

const HISTORY_PREFIX = 'chat_history_';
const MAX_MESSAGES = 500;

export interface StoredChatMessage {
  id: string;
  type: string;
  content: string;
  options?: string[];
  correctAnswer?: string;
  expectedAnswers?: string[];
  answered?: boolean;
  userAnswer?: string;
  isCorrect?: boolean;
  cardType?: string;
  phraseText?: string;
  language?: string;
  validation?: string | object;
  videoUrl?: string;
  videoPlayed?: boolean;
  timestamp: number;
  sessionId?: string;
}

function getStorageKey(language: string, level: string, track: string): string {
  return `${HISTORY_PREFIX}${language}_${level}_${track}`;
}

export async function loadChatHistory(
  language: string,
  level: string,
  track: string
): Promise<StoredChatMessage[]> {
  try {
    const key = getStorageKey(language, level, track);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const messages: StoredChatMessage[] = JSON.parse(raw);
    return messages;
  } catch (error) {
    console.warn('[ChatHistory] Failed to load:', error);
    return [];
  }
}

export async function saveChatHistory(
  language: string,
  level: string,
  track: string,
  messages: StoredChatMessage[]
): Promise<void> {
  try {
    const key = getStorageKey(language, level, track);
    const trimmed = messages.slice(-MAX_MESSAGES);
    await AsyncStorage.setItem(key, JSON.stringify(trimmed));
  } catch (error) {
    console.warn('[ChatHistory] Failed to save:', error);
  }
}

export async function clearChatHistory(
  language: string,
  level: string,
  track: string
): Promise<void> {
  try {
    const key = getStorageKey(language, level, track);
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn('[ChatHistory] Failed to clear:', error);
  }
}
