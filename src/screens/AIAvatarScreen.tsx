import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import { Audio } from 'expo-av';
import { theme } from '../lib/theme';

const HEYGEN_AVATAR_ID = 'bf00036b-558a-44b5-b2ff-1e3cec0f4ceb';
const HEYGEN_CONTEXT_ID = 'c32cf18d-d920-4d35-8eb4-39c4b1fd90ce';
const API_BASE_URL = 'https://api.heygen.com';
const HEYGEN_API_KEY_STORAGE_KEY = 'heygen_api_key';

const SESSION_SOFT_LIMIT = 90;
const SESSION_HARD_LIMIT = 120;

type AIAvatarRouteParams = {
  language?: string;
  level?: string;
  courseTitle?: string;
  lessonTitle?: string;
  reviewPhrases?: string[];
};

type RouteType = RouteProp<{ AIAvatar: AIAvatarRouteParams }, 'AIAvatar'>;

export default function AIAvatarScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  
  const { language = 'Italian', level = 'beginner', courseTitle = '', lessonTitle = '', reviewPhrases = [] } = route.params || {};
  
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Connecting to AI Avatar...');
  const [error, setError] = useState<string | null>(null);
  
  const [sessionId, setSessionId] = useState<string>('');
  const [sessionToken, setSessionToken] = useState<string>('');
  const [wsUrl, setWsUrl] = useState<string>('');
  const [accessToken, setAccessToken] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const webSocketRef = useRef<WebSocket | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const buildKnowledgePrompt = useCallback(() => {
    let prompt = `You are a friendly language learning tutor helping a student practice ${language} at the ${level} level.`;
    
    if (courseTitle) {
      prompt += ` The current course is "${courseTitle}".`;
    }
    if (lessonTitle) {
      prompt += ` The current lesson is "${lessonTitle}".`;
    }
    if (reviewPhrases && reviewPhrases.length > 0) {
      prompt += ` Focus on practicing these phrases: ${reviewPhrases.join(', ')}.`;
    }
    
    prompt += `

Your role:
1. Greet the learner warmly in English, then introduce the practice focus.
2. Ask questions in ${language} and help the learner respond correctly.
3. Provide gentle corrections and encouragement.
4. If the learner goes off-topic, briefly acknowledge and redirect: "That's interesting! Let's get back to practicing our ${language} phrases."
5. Keep responses concise and focused on language practice.
6. Use a mix of English for explanations and ${language} for practice.

Session rules:
- Maximum 2 minutes per session
- Stay focused on the lesson content
- Be encouraging and patient`;

    return prompt;
  }, [language, level, courseTitle, lessonTitle, reviewPhrases]);

  const getStoredApiKey = async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(HEYGEN_API_KEY_STORAGE_KEY);
    } catch (err) {
      console.error('Error retrieving API key:', err);
      return null;
    }
  };

  const getSessionToken = async (key: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/streaming.create_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': key,
        },
      });
      
      const data = await response.json();
      if (data.data?.token) {
        return data.data.token;
      }
      throw new Error('Failed to get session token');
    } catch (err) {
      console.error('Error getting session token:', err);
      throw err;
    }
  };

  const createSession = async (token: string) => {
    try {
      const knowledgePrompt = buildKnowledgePrompt();
      
      const response = await fetch(`${API_BASE_URL}/v1/streaming.new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          quality: 'high',
          avatar_name: HEYGEN_AVATAR_ID,
          version: 'v2',
          video_encoding: 'H264',
          knowledge_base: knowledgePrompt,
          knowledge_base_id: HEYGEN_CONTEXT_ID,
        }),
      });
      
      const data = await response.json();
      if (data.data) {
        return data.data;
      }
      throw new Error('Failed to create session');
    } catch (err) {
      console.error('Error creating session:', err);
      throw err;
    }
  };

  const startStreaming = async (sid: string, token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/v1/streaming.start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          session_id: sid,
        }),
      });
      
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error starting streaming:', err);
      throw err;
    }
  };

  const sendTextToAvatar = async (text: string) => {
    if (!sessionId || !sessionToken) return;
    
    try {
      setIsSpeaking(true);
      const response = await fetch(`${API_BASE_URL}/v1/streaming.task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          text: text,
          task_type: 'talk',
        }),
      });
      
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error sending text:', err);
    } finally {
      setIsSpeaking(false);
    }
  };

  const closeSession = async () => {
    if (!sessionId || !sessionToken) return;
    
    try {
      await fetch(`${API_BASE_URL}/v1/streaming.stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
        }),
      });
    } catch (err) {
      console.error('Error closing session:', err);
    }
  };

  const initializeSession = async () => {
    try {
      setIsConnecting(true);
      setStatusMessage('Checking API credentials...');
      
      const storedKey = await getStoredApiKey();
      if (!storedKey) {
        setError('HeyGen API key not configured. Please set up your API key first.');
        setIsConnecting(false);
        return;
      }
      setApiKey(storedKey);
      
      setStatusMessage('Getting session token...');
      const token = await getSessionToken(storedKey);
      setSessionToken(token);
      
      setStatusMessage('Creating avatar session...');
      const sessionData = await createSession(token);
      
      setSessionId(sessionData.session_id);
      setWsUrl(sessionData.url);
      setAccessToken(sessionData.access_token);
      
      setStatusMessage('Starting stream...');
      await startStreaming(sessionData.session_id, token);
      
      setIsConnected(true);
      setIsConnecting(false);
      setStatusMessage('Connected! Say something to practice.');
      
      timerRef.current = setInterval(() => {
        setSessionTime(prev => {
          const newTime = prev + 1;
          
          if (newTime >= SESSION_HARD_LIMIT) {
            handleLeaveSession();
          } else if (newTime === SESSION_SOFT_LIMIT) {
            sendTextToAvatar("We have about 30 seconds left. Let's wrap up our practice!");
          }
          
          return newTime;
        });
      }, 1000);
      
      setTimeout(() => {
        const greeting = `Ciao! Welcome to your ${language} practice session. Let's review what you've learned. Are you ready to begin?`;
        sendTextToAvatar(greeting);
      }, 2000);
      
    } catch (err) {
      console.error('Session initialization error:', err);
      setError('Failed to connect to AI Avatar. Please try again.');
      setIsConnecting(false);
    }
  };

  const handleLeaveSession = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    await closeSession();
    navigation.goBack();
  };

  const confirmLeave = () => {
    Alert.alert(
      'Leave Session',
      'Are you sure you want to end this practice session?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: handleLeaveSession },
      ]
    );
  };

  useEffect(() => {
    const requestMicPermission = async () => {
      try {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          setError('Microphone permission is required for voice practice.');
          return false;
        }
        return true;
      } catch (err) {
        console.error('Error requesting mic permission:', err);
        return false;
      }
    };
    
    const setup = async () => {
      const hasPermission = await requestMicPermission();
      if (hasPermission) {
        await initializeSession();
      }
    };
    
    setup();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      closeSession();
    };
  }, []);

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.destructive} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.timerContainer}>
          <View style={[styles.liveIndicator, isConnected && styles.liveIndicatorActive]} />
          <Text style={styles.timerText}>
            {formatTime(sessionTime)} / {formatTime(SESSION_HARD_LIMIT)}
          </Text>
        </View>
        
        <TouchableOpacity onPress={confirmLeave} style={styles.leaveButton}>
          <Ionicons name="close" size={24} color="#fff" />
          <Text style={styles.leaveButtonText}>Leave</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.videoContainer}>
        {isConnecting ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{statusMessage}</Text>
          </View>
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person-circle" size={120} color={theme.colors.mutedForeground} />
            <Text style={styles.placeholderText}>AI Avatar Video Stream</Text>
            <Text style={styles.placeholderSubtext}>
              (Requires development build with native modules)
            </Text>
          </View>
        )}
      </View>

      <View style={styles.contextInfo}>
        <Text style={styles.contextTitle}>Practice Session</Text>
        <Text style={styles.contextText}>
          {language} - {level}
          {courseTitle ? ` - ${courseTitle}` : ''}
        </Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.statusContainer}>
          {isListening && (
            <View style={styles.listeningIndicator}>
              <Ionicons name="mic" size={24} color={theme.colors.primary} />
              <Text style={styles.listeningText}>Listening...</Text>
            </View>
          )}
          {isSpeaking && (
            <View style={styles.speakingIndicator}>
              <Ionicons name="volume-high" size={24} color={theme.colors.primary} />
              <Text style={styles.speakingText}>Avatar speaking...</Text>
            </View>
          )}
          {!isListening && !isSpeaking && isConnected && (
            <Text style={styles.readyText}>Tap the mic to speak</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.micButton, isListening && styles.micButtonActive]}
          onPress={() => setIsListening(!isListening)}
          disabled={!isConnected || isSpeaking}
        >
          <Ionicons
            name={isListening ? 'mic' : 'mic-outline'}
            size={36}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {sessionTime >= SESSION_SOFT_LIMIT && (
        <View style={styles.warningBanner}>
          <Ionicons name="time" size={20} color="#fff" />
          <Text style={styles.warningText}>
            Session ending soon - {SESSION_HARD_LIMIT - sessionTime}s remaining
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1628',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.mutedForeground,
    marginRight: 8,
  },
  liveIndicatorActive: {
    backgroundColor: '#22c55e',
  },
  timerText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  leaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.destructive,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  leaveButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },
  videoContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    color: theme.colors.mutedForeground,
    marginTop: 16,
    fontSize: 16,
  },
  avatarPlaceholder: {
    alignItems: 'center',
  },
  placeholderText: {
    color: theme.colors.mutedForeground,
    fontSize: 18,
    marginTop: 16,
  },
  placeholderSubtext: {
    color: theme.colors.mutedForeground,
    fontSize: 12,
    marginTop: 8,
    opacity: 0.7,
  },
  contextInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  contextTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contextText: {
    color: theme.colors.mutedForeground,
    fontSize: 14,
    marginTop: 4,
  },
  controls: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  statusContainer: {
    height: 40,
    justifyContent: 'center',
    marginBottom: 16,
  },
  listeningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listeningText: {
    color: theme.colors.primary,
    marginLeft: 8,
    fontSize: 16,
  },
  speakingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  speakingText: {
    color: theme.colors.primary,
    marginLeft: 8,
    fontSize: 16,
  },
  readyText: {
    color: theme.colors.mutedForeground,
    fontSize: 16,
  },
  micButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  micButtonActive: {
    backgroundColor: '#22c55e',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  warningText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: theme.colors.mutedForeground,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
