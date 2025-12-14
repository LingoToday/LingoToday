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
const API_BASE_URL = 'https://api.liveavatar.com';
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

type LiveKitModules = {
  LiveKitRoom: any;
  VideoTrack: any;
  AudioTrack: any;
  useTracks: any;
  useLocalParticipant: any;
  useRoomContext: any;
  AudioSession: any;
  Track: any;
} | null;

async function loadLiveKitModules(): Promise<LiveKitModules> {
  try {
    console.log('[AIAvatar] Attempting to load LiveKit modules...');
    const livekit = await import('@livekit/react-native');
    const livekitClient = await import('livekit-client');
    
    if (livekit.registerGlobals) {
      livekit.registerGlobals();
    }
    
    console.log('[AIAvatar] LiveKit modules loaded successfully');
    return {
      LiveKitRoom: livekit.LiveKitRoom,
      VideoTrack: livekit.VideoTrack,
      AudioTrack: (livekit as any).AudioTrack || null,
      useTracks: livekit.useTracks,
      useLocalParticipant: livekit.useLocalParticipant,
      useRoomContext: livekit.useRoomContext,
      AudioSession: livekit.AudioSession,
      Track: livekitClient.Track,
    };
  } catch (e) {
    console.log('[AIAvatar] LiveKit not available:', e);
    return null;
  }
}

function AvatarMediaRenderer({ modules }: { modules: LiveKitModules }) {
  if (!modules) return null;
  
  const { useTracks, Track, VideoTrack, AudioTrack } = modules;
  const tracks = useTracks([Track.Source.Camera, Track.Source.Microphone]);
  const videoTrack = tracks.find((t: any) => t.source === Track.Source.Camera);
  const audioTrack = tracks.find((t: any) => t.source === Track.Source.Microphone);
  
  if (!videoTrack) {
    return (
      <View style={styles.avatarPlaceholder}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.placeholderText}>Loading avatar video...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.mediaContainer}>
      <VideoTrack
        trackRef={videoTrack}
        style={styles.videoTrack}
      />
      {audioTrack && (
        <AudioTrack trackRef={audioTrack} />
      )}
    </View>
  );
}

function MuteOnConnect({ modules, onReady }: { modules: LiveKitModules; onReady: () => void }) {
  const room = modules?.useRoomContext ? modules.useRoomContext() : null;
  const hasInitialized = useRef(false);
  
  useEffect(() => {
    const initMic = async () => {
      if (room && !hasInitialized.current) {
        hasInitialized.current = true;
        try {
          await room.localParticipant.setMicrophoneEnabled(false);
          console.log('[AIAvatar] Microphone muted on connect');
        } catch (err) {
          console.error('[AIAvatar] Error muting on connect:', err);
        }
        onReady();
      }
    };
    initMic();
  }, [room, onReady]);
  
  return null;
}

function MicController({ modules, isListening, onToggle, disabled }: { 
  modules: LiveKitModules; 
  isListening: boolean; 
  onToggle: (enabled: boolean) => void;
  disabled: boolean;
}) {
  const room = modules?.useRoomContext ? modules.useRoomContext() : null;
  
  const toggleMic = useCallback(async () => {
    const newState = !isListening;
    onToggle(newState);
    
    if (room) {
      try {
        await room.localParticipant.setMicrophoneEnabled(newState);
        console.log('[AIAvatar] Microphone', newState ? 'enabled' : 'disabled');
      } catch (err) {
        console.error('[AIAvatar] Error toggling microphone:', err);
      }
    }
  }, [isListening, onToggle, room]);
  
  return (
    <TouchableOpacity
      style={[styles.micButton, isListening && styles.micButtonActive, disabled && styles.micButtonDisabled]}
      onPress={toggleMic}
      disabled={disabled}
    >
      <Ionicons
        name={isListening ? 'mic' : 'mic-outline'}
        size={36}
        color="#fff"
      />
    </TouchableOpacity>
  );
}

function LiveKitContent({ 
  modules,
  isConnecting, 
  statusMessage, 
  isListening, 
  setIsListening,
  isSpeaking,
  isConnected,
  onMicReady
}: { 
  modules: LiveKitModules;
  isConnecting: boolean; 
  statusMessage: string; 
  isListening: boolean;
  setIsListening: (val: boolean) => void;
  isSpeaking: boolean;
  isConnected: boolean;
  onMicReady: () => void;
}) {
  return (
    <>
      <MuteOnConnect modules={modules} onReady={onMicReady} />
      <View style={styles.videoContainer}>
        {isConnecting ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{statusMessage}</Text>
          </View>
        ) : (
          <AvatarMediaRenderer modules={modules} />
        )}
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

        <MicController 
          modules={modules}
          isListening={isListening} 
          onToggle={setIsListening}
          disabled={!isConnected || isSpeaking}
        />
      </View>
    </>
  );
}

export default function AIAvatarScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteType>();
  
  const { language = 'Italian', level = 'beginner', courseTitle = '', lessonTitle = '', reviewPhrases = [] } = route.params || {};
  
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing...');
  const [error, setError] = useState<string | null>(null);
  
  const [sessionId, setSessionId] = useState<string>('');
  const [sessionToken, setSessionToken] = useState<string>('');
  const [liveKitUrl, setLiveKitUrl] = useState<string>('');
  const [liveKitToken, setLiveKitToken] = useState<string>('');
  const [liveKitModules, setLiveKitModules] = useState<LiveKitModules>(null);
  const [liveKitLoaded, setLiveKitLoaded] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionDataRef = useRef<{ sessionId: string; sessionToken: string }>({ sessionId: '', sessionToken: '' });
  const softWarningShownRef = useRef(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getLanguageCode = (lang: string): string => {
    const codes: { [key: string]: string } = {
      'Italian': 'it',
      'italian': 'it',
      'Spanish': 'es',
      'spanish': 'es',
      'German': 'de',
      'german': 'de',
      'French': 'fr',
      'french': 'fr',
      'English': 'en',
      'english': 'en',
    };
    return codes[lang] || 'en';
  };

  const validateApiKey = (key: string | null): { valid: boolean; error?: string } => {
    if (!key) {
      return { valid: false, error: 'HeyGen API key not configured. Please set up your API key first.' };
    }
    
    const trimmedKey = key.trim();
    if (trimmedKey.length === 0) {
      return { valid: false, error: 'API key is empty. Please enter a valid HeyGen API key.' };
    }
    
    if (trimmedKey.length < 20) {
      return { valid: false, error: 'API key appears to be invalid (too short). Please check your HeyGen API key.' };
    }
    
    return { valid: true };
  };

  const getStoredApiKey = async (): Promise<string | null> => {
    try {
      const key = await SecureStore.getItemAsync(HEYGEN_API_KEY_STORAGE_KEY);
      console.log('[AIAvatar] API key retrieved:', key ? `exists (length: ${key.length})` : 'not found');
      return key;
    } catch (err) {
      console.error('[AIAvatar] Error retrieving API key:', err);
      return null;
    }
  };

  const parseApiError = (status: number, errorBody: string): string => {
    console.log('[AIAvatar] Parsing error - status:', status, 'body:', errorBody);
    
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed.message) return parsed.message;
      if (parsed.error) return typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error);
      if (parsed.detail) return typeof parsed.detail === 'string' ? parsed.detail : JSON.stringify(parsed.detail);
    } catch {
    }
    
    switch (status) {
      case 401:
        return 'Invalid API key. Please check your HeyGen API key and try again.';
      case 403:
        return 'Access denied. Your API key may not have permission for this feature.';
      case 404:
        return 'Avatar or service not found. Please contact support.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
      case 502:
      case 503:
        return 'HeyGen service is temporarily unavailable. Please try again later.';
      default:
        return `Server error (${status}). Please try again.`;
    }
  };

  const extractSessionData = (data: any): { sessionId: string; sessionToken: string } | null => {
    console.log('[AIAvatar] Extracting session data from:', JSON.stringify(data, null, 2));
    
    if (data.session_id && data.session_token) {
      console.log('[AIAvatar] Found session data at top level');
      return { sessionId: data.session_id, sessionToken: data.session_token };
    }
    
    if (data.data && data.data.session_id && data.data.session_token) {
      console.log('[AIAvatar] Found session data in data wrapper');
      return { sessionId: data.data.session_id, sessionToken: data.data.session_token };
    }
    
    if (data.session_id && data.access_token) {
      console.log('[AIAvatar] Found session_id with access_token (old format)');
      return { sessionId: data.session_id, sessionToken: data.access_token };
    }
    
    if (data.data && data.data.session_id && data.data.access_token) {
      console.log('[AIAvatar] Found session data in data wrapper (old format)');
      return { sessionId: data.data.session_id, sessionToken: data.data.access_token };
    }
    
    console.log('[AIAvatar] Could not extract session data. Available keys:', Object.keys(data));
    if (data.data) {
      console.log('[AIAvatar] data.data keys:', Object.keys(data.data));
    }
    
    return null;
  };

  const extractLiveKitData = (data: any): { liveKitUrl: string; liveKitToken: string } | null => {
    console.log('[AIAvatar] Extracting LiveKit data from:', JSON.stringify(data, null, 2));
    
    if (data.livekit_url && data.livekit_client_token) {
      return { liveKitUrl: data.livekit_url, liveKitToken: data.livekit_client_token };
    }
    
    if (data.data && data.data.livekit_url && data.data.livekit_client_token) {
      return { liveKitUrl: data.data.livekit_url, liveKitToken: data.data.livekit_client_token };
    }
    
    if (data.url && data.access_token) {
      console.log('[AIAvatar] Found url with access_token (old streaming.new format)');
      return { liveKitUrl: data.url, liveKitToken: data.access_token };
    }
    
    if (data.data && data.data.url && data.data.access_token) {
      return { liveKitUrl: data.data.url, liveKitToken: data.data.access_token };
    }
    
    console.log('[AIAvatar] Could not extract LiveKit data. Available keys:', Object.keys(data));
    if (data.data) {
      console.log('[AIAvatar] data.data keys:', Object.keys(data.data));
    }
    
    return null;
  };

  const createSessionWithToken = async (apiKey: string) => {
    console.log('[AIAvatar] Creating session with token...');
    console.log('[AIAvatar] Using API base URL:', API_BASE_URL);
    console.log('[AIAvatar] Avatar ID:', HEYGEN_AVATAR_ID);
    console.log('[AIAvatar] Context ID:', HEYGEN_CONTEXT_ID);
    
    const requestBody = {
      mode: 'FULL',
      avatar_id: HEYGEN_AVATAR_ID,
      avatar_persona: {
        context_id: HEYGEN_CONTEXT_ID,
        language: getLanguageCode(language),
      },
    };
    console.log('[AIAvatar] Request body:', JSON.stringify(requestBody, null, 2));
    
    try {
      const response = await fetch(`${API_BASE_URL}/v1/sessions/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
          'accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('[AIAvatar] Session token response status:', response.status);
      
      const responseText = await response.text();
      console.log('[AIAvatar] Raw response body:', responseText);
      
      if (!response.ok) {
        const errorMessage = parseApiError(response.status, responseText);
        throw new Error(errorMessage);
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('[AIAvatar] Failed to parse JSON response:', parseErr);
        throw new Error('Invalid response from server. Please try again.');
      }
      
      const sessionData = extractSessionData(data);
      if (sessionData) {
        console.log('[AIAvatar] Successfully extracted session data');
        return sessionData;
      }
      
      throw new Error('Unexpected response format from HeyGen. Please try again or contact support.');
    } catch (err: any) {
      console.error('[AIAvatar] Error creating session token:', err);
      if (err.message && !err.message.includes('fetch')) {
        throw err;
      }
      throw new Error('Network error. Please check your internet connection and try again.');
    }
  };

  const startSession = async (token: string) => {
    console.log('[AIAvatar] Starting session with token length:', token.length);
    
    try {
      const response = await fetch(`${API_BASE_URL}/v1/sessions/start`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('[AIAvatar] Start session response status:', response.status);
      
      const responseText = await response.text();
      console.log('[AIAvatar] Raw start session response:', responseText);
      
      if (!response.ok) {
        const errorMessage = parseApiError(response.status, responseText);
        throw new Error(errorMessage);
      }
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('[AIAvatar] Failed to parse start session JSON:', parseErr);
        throw new Error('Invalid response from server. Please try again.');
      }
      
      const liveKitData = extractLiveKitData(data);
      if (liveKitData) {
        console.log('[AIAvatar] Successfully extracted LiveKit data');
        return liveKitData;
      }
      
      throw new Error('Unexpected response format when starting stream. Please try again.');
    } catch (err: any) {
      console.error('[AIAvatar] Error starting session:', err);
      if (err.message && !err.message.includes('fetch')) {
        throw err;
      }
      throw new Error('Network error. Please check your internet connection and try again.');
    }
  };

  const closeSession = async () => {
    const token = sessionDataRef.current.sessionToken || sessionToken;
    if (!token) return;
    
    console.log('[AIAvatar] Closing session...');
    try {
      await fetch(`${API_BASE_URL}/v1/sessions/stop`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log('[AIAvatar] Session closed');
    } catch (err) {
      console.error('[AIAvatar] Error closing session:', err);
    }
  };

  const initializeAudioSession = async () => {
    if (liveKitModules?.AudioSession) {
      try {
        await liveKitModules.AudioSession.startAudioSession();
        console.log('[AIAvatar] Audio session started');
      } catch (err) {
        console.error('[AIAvatar] Error starting audio session:', err);
      }
    }
  };

  const handleRoomConnected = useCallback(() => {
    console.log('[AIAvatar] Room connected');
    setIsConnected(true);
    setIsConnecting(false);
    setStatusMessage('Connected! Say something to practice.');
    
    timerRef.current = setInterval(() => {
      setSessionTime(prev => {
        const newTime = prev + 1;
        
        if (newTime >= SESSION_HARD_LIMIT) {
          handleLeaveSession();
        } else if (newTime >= SESSION_SOFT_LIMIT && !softWarningShownRef.current) {
          softWarningShownRef.current = true;
        }
        
        return newTime;
      });
    }, 1000);
  }, []);

  const initializeSession = async () => {
    try {
      setIsConnecting(true);
      setStatusMessage('Loading modules...');
      
      const modules = await loadLiveKitModules();
      setLiveKitModules(modules);
      setLiveKitLoaded(true);
      
      if (!modules) {
        console.log('[AIAvatar] LiveKit not available, showing fallback UI');
      }
      
      setStatusMessage('Checking API credentials...');
      const storedKey = await getStoredApiKey();
      const keyValidation = validateApiKey(storedKey);
      if (!keyValidation.valid) {
        setError(keyValidation.error || 'Invalid API key');
        setIsConnecting(false);
        return;
      }
      
      if (modules) {
        await initializeAudioSession();
      }
      
      setStatusMessage('Creating session...');
      const { sessionId: sid, sessionToken: sToken } = await createSessionWithToken(storedKey!);
      setSessionId(sid);
      setSessionToken(sToken);
      sessionDataRef.current = { sessionId: sid, sessionToken: sToken };
      
      setStatusMessage('Starting stream...');
      const { liveKitUrl: url, liveKitToken: token } = await startSession(sToken);
      setLiveKitUrl(url);
      setLiveKitToken(token);
      
      if (!modules) {
        setIsConnected(true);
        setIsConnecting(false);
        setStatusMessage('Connected (video requires development build)');
        
        timerRef.current = setInterval(() => {
          setSessionTime(prev => {
            const newTime = prev + 1;
            if (newTime >= SESSION_HARD_LIMIT) {
              handleLeaveSession();
            }
            return newTime;
          });
        }, 1000);
      }
      
    } catch (err: any) {
      console.error('[AIAvatar] Session initialization error:', err);
      setError(`Failed to connect: ${err.message || 'Unknown error'}`);
      setIsConnecting(false);
    }
  };

  const handleLeaveSession = async () => {
    console.log('[AIAvatar] Leaving session');
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
        console.log('[AIAvatar] Mic permission status:', status);
        if (status !== 'granted') {
          setError('Microphone permission is required for voice practice.');
          return false;
        }
        return true;
      } catch (err) {
        console.error('[AIAvatar] Error requesting mic permission:', err);
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
      console.log('[AIAvatar] Cleanup');
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (liveKitModules?.AudioSession) {
        liveKitModules.AudioSession.stopAudioSession().catch(console.error);
      }
      closeSession();
    };
  }, []);

  const handleMicReady = useCallback(() => {
    console.log('[AIAvatar] Microphone initialized');
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

  const renderContent = () => {
    if (liveKitModules && liveKitUrl && liveKitToken) {
      const { LiveKitRoom } = liveKitModules;
      return (
        <LiveKitRoom
          serverUrl={liveKitUrl}
          token={liveKitToken}
          connect={true}
          audio={false}
          video={false}
          onConnected={handleRoomConnected}
          onDisconnected={() => {
            console.log('[AIAvatar] Room disconnected');
            setIsConnected(false);
          }}
          onError={(err: any) => {
            console.error('[AIAvatar] LiveKit room error:', err);
            setError('Connection error. Please try again.');
          }}
        >
          <LiveKitContent
            modules={liveKitModules}
            isConnecting={isConnecting}
            statusMessage={statusMessage}
            isListening={isListening}
            setIsListening={setIsListening}
            isSpeaking={isSpeaking}
            isConnected={isConnected}
            onMicReady={handleMicReady}
          />
        </LiveKitRoom>
      );
    }
    
    return (
      <>
        <View style={styles.videoContainer}>
          {isConnecting ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>{statusMessage}</Text>
            </View>
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person-circle" size={120} color={theme.colors.mutedForeground} />
              <Text style={styles.placeholderText}>AI Avatar</Text>
              <Text style={styles.placeholderSubtext}>
                {liveKitLoaded && !liveKitModules
                  ? 'Video requires development build'
                  : 'Waiting for connection...'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.controls}>
          <View style={styles.statusContainer}>
            {isConnected && (
              <Text style={styles.readyText}>Session active (audio-only mode)</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.micButton, styles.micButtonDisabled]}
            disabled={true}
          >
            <Ionicons name="mic-outline" size={36} color="#fff" />
          </TouchableOpacity>
        </View>
      </>
    );
  };

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

      {renderContent()}

      <View style={styles.contextInfo}>
        <Text style={styles.contextTitle}>Practice Session</Text>
        <Text style={styles.contextText}>
          {language} - {level}
          {courseTitle ? ` - ${courseTitle}` : ''}
        </Text>
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
  videoTrack: {
    width: '100%',
    height: '100%',
  },
  mediaContainer: {
    width: '100%',
    height: '100%',
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
  micButtonDisabled: {
    opacity: 0.5,
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
