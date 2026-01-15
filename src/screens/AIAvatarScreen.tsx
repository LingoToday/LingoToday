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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';
import * as Clipboard from 'expo-clipboard';
import { Audio } from 'expo-av';
import { theme } from '../lib/theme';

const HEYGEN_AVATAR_ID = 'bf00036b-558a-44b5-b2ff-1e3cec0f4ceb';
const HEYGEN_CONTEXT_ID = 'c32cf18d-d920-4d35-8eb4-39c4b1fd90ce'; // Updated context ID from client
const HEYGEN_VOICE_ID = 'b2bd6569-a537-4342-aeca-a1f15d2a2c97';
const API_BASE_URL = 'https://api.liveavatar.com';
const HEYGEN_API_KEY_STORAGE_KEY = 'heygen_api_key';
const HEYGEN_API_KEY_HARDCODED = '785e5d3e-d8eb-11f0-a99e-066a7fa2e369'; // Fallback API key

const SESSION_SOFT_LIMIT = 90;
const SESSION_HARD_LIMIT = 120;

type SessionContext = {
  role: string;
  language_learning: {
    target_language: string;
    ui_language: string;
    level: string;
    course: string;
    lesson: string;
    review_type: string;
  };
  session_rules: {
    duration_seconds: number;
    target_seconds: number;
    topic_strict: boolean;
    redirect_line: string;
  };
  review_items: Array<{
    id: string;
    prompt_en: string;
    expected_target: string[];
    notes?: string;
  }>;
};

const buildSessionContext = (
  language: string,
  level: string,
  courseTitle: string,
  lessonTitle: string,
  reviewPhrases: string[],
  languageCode: string
): SessionContext => {
  const languageNames: { [key: string]: string } = {
    'it': 'Italian',
    'es': 'Spanish',
    'de': 'German',
    'fr': 'French',
    'en': 'English'
  };
  const targetLanguageName = languageNames[languageCode] || language;

  const reviewItems = reviewPhrases.map((phrase, index) => ({
    id: `r${index + 1}`,
    prompt_en: phrase,
    expected_target: [],
    notes: `Ask the user: "How would you say '${phrase}' in ${targetLanguageName}?" Wait for their response, then provide feedback.`
  }));

  return {
    role: 'LingoToday Review Coach',
    language_learning: {
      target_language: languageCode,
      ui_language: 'en',
      level: level || 'beginner',
      course: courseTitle || 'Language Practice',
      lesson: lessonTitle || 'Review Session',
      review_type: 'recall_translation'
    },
    session_rules: {
      duration_seconds: SESSION_HARD_LIMIT,
      target_seconds: SESSION_SOFT_LIMIT,
      topic_strict: true,
      redirect_line: "Let's get back to practising the phrases from this lesson."
    },
    review_items: reviewItems.length > 0 ? reviewItems : [
      {
        id: 'r1',
        prompt_en: 'Practice conversation',
        expected_target: [],
        notes: `Have a simple ${targetLanguageName} conversation practice. Ask basic questions appropriate for the ${level} level.`
      }
    ]
  };
};

// Build the avatar prompt text that will be sent to the avatar context
const buildAvatarPrompt = (
  language: string,
  level: string,
  courseTitle: string,
  lessonTitle: string,
  reviewPhrases: string[]
): string => {
  const phrasesText = reviewPhrases.length > 0
    ? `The phrases to practice are: ${reviewPhrases.map((p, i) => `${i + 1}. "${p}"`).join(', ')}.`
    : 'Practice general conversation appropriate for their level.';

  return `You are a friendly ${language} language tutor for LingoToday. 
You are conducting a 2-minute review session for a ${level} level learner.
Course: ${courseTitle || 'Language Practice'}
Lesson: ${lessonTitle || 'Review Session'}

YOUR BEHAVIOR:
1. Start by greeting the learner warmly and briefly introducing what you'll practice together.
2. Ask the learner to translate English phrases to ${language}, one at a time. Do NOT ask all at once.
3. Wait for their spoken response before proceeding to the next phrase.
4. Give brief, encouraging feedback: "Great job!", "Almost! Try...", "Perfect pronunciation!"
5. If they struggle, give a gentle hint, then the correct answer.
6. Keep responses short (1-2 sentences max) to maintain conversation flow.
7. If they go off-topic, gently redirect: "That's interesting! Let's get back to practicing our phrases."

PHRASES TO PRACTICE:
${phrasesText}

IMPORTANT RULES:
- Speak mainly in English, but use ${language} for the target phrases.
- Keep the session interactive and encouraging.
- This is a spoken conversation - be natural and conversational.
- You have about 90 seconds for this review.
- STRICTLY follow the script and do not deviate.`;
};

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
  useTracks: any;
  useLocalParticipant: any;
  useRoomContext: any;
  AudioSession: any;
  Track: any;
} | null;

// Debug telemetry type for UI-visible debugging (Build 19c)
type DebugTelemetry = {
  audioSessionStarted: boolean;
  audioSessionTime: string | null;
  permissionGranted: boolean;
  permissionTime: string | null;
  micEnabled: boolean;
  micEnabledTime: string | null;
  trackPublished: boolean;
  trackPublishedTime: string | null;
  trackPublishedViaFallback: boolean;
  roomConnected: boolean;
  roomState: string;
  audioTrackCount: number;
  audioTrackMuted: boolean | null;
  audioTrackSid: string | null;
  dataChannelReady: boolean;
  dataChannelState: string | null;
  startListeningSent: boolean;
  startListeningTime: string | null;
  lastServerEvent: string | null;
  lastServerEventTime: string | null;
  // Build 19e: Audio track capture state
  trackStarted: boolean | null;
  trackEnabled: boolean | null;
  mediaStreamActive: boolean | null;
  mediaTrackReadyState: string | null;
  // Build 19f: Mic level meter and outbound stats
  micLevel: number | null;
  bytesSent: number | null;
  packetsSent: number | null;
  micReEnabled: boolean;
  micReEnabledTime: string | null;
  // Build 19g: LiveKit URL/token for meet.livekit.io testing
  liveKitUrl: string | null;
  liveKitToken: string | null;
  participantIdentity: string | null;
  audioCodec: string | null;
  allServerEvents: string[];
  errors: string[];
};

const initialDebugTelemetry: DebugTelemetry = {
  audioSessionStarted: false,
  audioSessionTime: null,
  permissionGranted: false,
  permissionTime: null,
  micEnabled: false,
  micEnabledTime: null,
  trackPublished: false,
  trackPublishedTime: null,
  trackPublishedViaFallback: false,
  roomConnected: false,
  roomState: 'unknown',
  audioTrackCount: 0,
  audioTrackMuted: null,
  audioTrackSid: null,
  dataChannelReady: false,
  dataChannelState: null,
  startListeningSent: false,
  startListeningTime: null,
  lastServerEvent: null,
  lastServerEventTime: null,
  trackStarted: null,
  trackEnabled: null,
  mediaStreamActive: null,
  mediaTrackReadyState: null,
  micLevel: null,
  bytesSent: null,
  packetsSent: null,
  micReEnabled: false,
  micReEnabledTime: null,
  liveKitUrl: null,
  liveKitToken: null,
  participantIdentity: null,
  audioCodec: null,
  allServerEvents: [],
  errors: [],
};

const getTimeStamp = () => {
  const now = new Date();
  return `${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
};

// Debug Panel Component - Shows telemetry directly in UI
function DebugPanel({ telemetry, visible }: { telemetry: DebugTelemetry; visible: boolean }) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('[AIAvatar] Failed to copy to clipboard:', err);
    }
  };

  if (!visible) return null;

  const StatusRow = ({ label, value, time }: { label: string; value: boolean | string | number | null; time?: string | null }) => {
    let icon = '⏳';
    let color = '#888';

    if (typeof value === 'boolean') {
      icon = value ? '✅' : '❌';
      color = value ? '#4ade80' : '#f87171';
    } else if (value !== null && value !== undefined) {
      icon = '📋';
      color = '#60a5fa';
    }

    return (
      <View style={debugStyles.row}>
        <Text style={[debugStyles.icon, { color }]}>{icon}</Text>
        <Text style={debugStyles.label}>{label}</Text>
        <Text style={debugStyles.value} numberOfLines={1}>
          {typeof value === 'boolean' ? (value ? 'YES' : 'NO') : String(value ?? '-')}
        </Text>
        {time && <Text style={debugStyles.time}>{time}</Text>}
      </View>
    );
  };

  return (
    <View style={debugStyles.container}>
      <Text style={debugStyles.title}>🔧 Build 25 Debug (scroll for more)</Text>
      <ScrollView style={debugStyles.scrollContent} showsVerticalScrollIndicator={true}>
        <View style={debugStyles.section}>
          <Text style={debugStyles.sectionTitle}>Mic Setup</Text>
          <StatusRow label="AudioSession" value={telemetry.audioSessionStarted} time={telemetry.audioSessionTime} />
          <StatusRow label="Permission" value={telemetry.permissionGranted} time={telemetry.permissionTime} />
          <StatusRow label="Mic Enabled" value={telemetry.micEnabled} time={telemetry.micEnabledTime} />
          <StatusRow label="Track Published" value={telemetry.trackPublished} time={telemetry.trackPublishedTime} />
          {telemetry.trackPublishedViaFallback && <Text style={debugStyles.fallback}>⚠️ Via 5s fallback</Text>}
        </View>

        <View style={debugStyles.section}>
          <Text style={debugStyles.sectionTitle}>Room State</Text>
          <StatusRow label="Connected" value={telemetry.roomConnected} />
          <StatusRow label="State" value={telemetry.roomState} />
          <StatusRow label="Audio Tracks" value={telemetry.audioTrackCount} />
          <StatusRow label="Track Muted" value={telemetry.audioTrackMuted} />
          <StatusRow label="Track SID" value={telemetry.audioTrackSid} />
        </View>

        <View style={debugStyles.section}>
          <Text style={debugStyles.sectionTitle}>Audio Capture</Text>
          <StatusRow label="Track Started" value={telemetry.trackStarted} />
          <StatusRow label="Track Enabled" value={telemetry.trackEnabled} />
          <StatusRow label="Stream Active" value={telemetry.mediaStreamActive} />
          <StatusRow label="ReadyState" value={telemetry.mediaTrackReadyState} />
          <StatusRow label="Mic Re-Enabled" value={telemetry.micReEnabled} time={telemetry.micReEnabledTime} />
        </View>

        <View style={debugStyles.section}>
          <Text style={debugStyles.sectionTitle}>Audio Stats</Text>
          <StatusRow label="Mic Level" value={telemetry.micLevel !== null ? telemetry.micLevel.toFixed(2) : '-'} />
          <StatusRow label="Bytes Sent" value={telemetry.bytesSent} />
          <StatusRow label="Packets Sent" value={telemetry.packetsSent} />
        </View>

        <View style={debugStyles.section}>
          <Text style={debugStyles.sectionTitle}>Voice Loop</Text>
          <StatusRow label="DC Ready" value={telemetry.dataChannelReady} />
          <StatusRow label="DC State" value={telemetry.dataChannelState} />
          <StatusRow label="start_listening" value={telemetry.startListeningSent} time={telemetry.startListeningTime} />
          <StatusRow label="Last Event" value={telemetry.lastServerEvent} time={telemetry.lastServerEventTime} />
        </View>

        <View style={debugStyles.section}>
          <Text style={debugStyles.sectionTitle}>LiveKit Info (Scroll down)</Text>
          <StatusRow label="Participant" value={telemetry.participantIdentity} />
          <StatusRow label="Audio Codec" value={telemetry.audioCodec} />
          <TouchableOpacity
            onPress={() => telemetry.liveKitUrl && copyToClipboard(telemetry.liveKitUrl, 'url')}
            style={debugStyles.copyButton}
          >
            <Text style={debugStyles.urlLabel}>
              URL (tap to copy) {copiedField === 'url' ? '✅' : '📋'}
            </Text>
            <Text style={debugStyles.urlValue} numberOfLines={1}>{telemetry.liveKitUrl || '-'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => telemetry.liveKitToken && copyToClipboard(telemetry.liveKitToken, 'token')}
            style={debugStyles.copyButton}
          >
            <Text style={debugStyles.urlLabel}>
              Token (tap to copy full) {copiedField === 'token' ? '✅' : '📋'}
            </Text>
            <Text style={debugStyles.urlValue} numberOfLines={1}>{telemetry.liveKitToken ? telemetry.liveKitToken.substring(0, 40) + '...' : '-'}</Text>
          </TouchableOpacity>
        </View>

        {telemetry.allServerEvents.length > 0 && (
          <View style={debugStyles.section}>
            <Text style={debugStyles.sectionTitle}>📡 Server Events (last 5)</Text>
            {telemetry.allServerEvents.slice(-5).map((evt, i) => (
              <Text key={i} style={debugStyles.eventLog}>{evt}</Text>
            ))}
          </View>
        )}

        {telemetry.errors.length > 0 && (
          <View style={debugStyles.section}>
            <Text style={debugStyles.sectionTitle}>❗ Errors</Text>
            {telemetry.errors.slice(-3).map((err, i) => (
              <Text key={i} style={debugStyles.error}>{err}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const debugStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 180,
    left: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 8,
    padding: 8,
    maxHeight: 400,
    zIndex: 1000,
  },
  scrollContent: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#a3e635',
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  icon: {
    fontSize: 12,
    width: 18,
  },
  label: {
    color: '#ccc',
    fontSize: 11,
    width: 100,
  },
  value: {
    color: '#fff',
    fontSize: 11,
    flex: 1,
  },
  time: {
    color: '#888',
    fontSize: 9,
    marginLeft: 4,
  },
  fallback: {
    color: '#fbbf24',
    fontSize: 10,
    marginLeft: 18,
  },
  error: {
    color: '#f87171',
    fontSize: 10,
    marginLeft: 4,
  },
  urlLabel: {
    color: '#888',
    fontSize: 9,
    marginTop: 2,
  },
  urlValue: {
    color: '#60a5fa',
    fontSize: 8,
    marginBottom: 4,
  },
  copyButton: {
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderRadius: 4,
    padding: 4,
    marginVertical: 2,
  },
  eventLog: {
    color: '#a78bfa',
    fontSize: 9,
    marginLeft: 4,
  },
});

async function loadLiveKitModules(): Promise<LiveKitModules> {
  try {
    console.log('[AIAvatar] Attempting to load LiveKit modules...');

    let livekit: any;
    let livekitClient: any;

    try {
      livekit = await import('@livekit/react-native');
    } catch (importErr) {
      console.log('[AIAvatar] Failed to import @livekit/react-native:', importErr);
      return null;
    }

    try {
      livekitClient = await import('livekit-client');
    } catch (importErr) {
      console.log('[AIAvatar] Failed to import livekit-client:', importErr);
      return null;
    }

    // Note: registerGlobals() is now called in index.js at app startup (before React renders)
    // This is required for LiveKit to detect WebRTC and must run with New Architecture disabled.

    if (!livekit?.LiveKitRoom || !livekit?.useTracks || !livekitClient?.Track) {
      console.log('[AIAvatar] LiveKit modules missing required exports');
      return null;
    }

    console.log('[AIAvatar] LiveKit modules loaded successfully');
    return {
      LiveKitRoom: livekit.LiveKitRoom,
      VideoTrack: livekit.VideoTrack || null,
      useTracks: livekit.useTracks,
      useLocalParticipant: livekit.useLocalParticipant || null,
      useRoomContext: livekit.useRoomContext || null,
      AudioSession: livekit.AudioSession || null,
      Track: livekitClient.Track,
    };
  } catch (e) {
    console.log('[AIAvatar] LiveKit not available:', e);
    return null;
  }
}

// MINIMAL TEST: Remote video renderer - only used AFTER connection confirmed
function MinimalRemoteVideoRenderer({ modules }: { modules: LiveKitModules }) {
  if (!modules) return null;

  const { useTracks, Track, VideoTrack } = modules;
  // Only subscribe to remote camera track (avatar video) - no mic, no audio
  const tracks = useTracks([Track.Source.Camera]);
  const videoTrack = tracks.find((t: any) => t.source === Track.Source.Camera);

  console.log('[AIAvatar] MinimalRemoteVideoRenderer - tracks found:', tracks.length);

  if (!videoTrack) {
    return (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.placeholderText}>Waiting for avatar video track...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mediaContainer}>
      <VideoTrack
        trackRef={videoTrack}
        style={styles.videoTrack}
      />
    </View>
  );
}

// Phase 4: Remote audio renderer - subscribe to avatar's audio track (CRASHES - DO NOT USE)
function RemoteAudioRenderer({ modules }: { modules: LiveKitModules }) {
  if (!modules) return null;

  const { useTracks, Track } = modules;
  // Subscribe to remote microphone track (avatar's voice)
  const tracks = useTracks([Track.Source.Microphone], { onlySubscribed: false });
  const audioTrack = tracks.find((t: any) => t.source === Track.Source.Microphone);

  console.log('[AIAvatar] RemoteAudioRenderer - audio tracks found:', tracks.length);

  if (!audioTrack) {
    console.log('[AIAvatar] No remote audio track yet');
    return null;
  }

  console.log('[AIAvatar] Rendering remote audio track - NOTE: Audio plays automatically in RN');
  return null; // Audio plays automatically, no component needed
}

// Build 18a: Direct audio controller - uses room events instead of useTracks
// This avoids the Hermes crash caused by useTracks for audio
function DirectAudioController({
  modules,
  isConnected,
  renderAudio = false
}: {
  modules: LiveKitModules;
  isConnected: boolean;
  renderAudio?: boolean;
}) {
  // Use ref to store audio track - prevents re-render loops
  const audioTrackRef = useRef<any>(null);
  const [hasAudioTrack, setHasAudioTrack] = useState(false);
  const listenerAttachedRef = useRef(false);

  // Get room context
  const room = modules?.useRoomContext ? modules.useRoomContext() : null;

  // Register room event listeners for track subscription
  useEffect(() => {
    if (!room || !isConnected || listenerAttachedRef.current) return;

    console.log('[AIAvatar] DirectAudioController: Attaching track event listeners...');
    listenerAttachedRef.current = true;

    const handleTrackSubscribed = (track: any, publication: any, participant: any) => {
      console.log('[AIAvatar] DirectAudioController: TrackSubscribed event');
      console.log('[AIAvatar] - Track kind:', track?.kind);
      console.log('[AIAvatar] - Track source:', publication?.source);
      console.log('[AIAvatar] - Participant identity:', participant?.identity);
      console.log('[AIAvatar] - Is local:', participant?.isLocal);

      // Only handle remote audio tracks
      if (track?.kind === 'audio' && !participant?.isLocal) {
        console.log('[AIAvatar] DirectAudioController: Remote audio track FOUND!');
        audioTrackRef.current = { track, publication, participant };
        setHasAudioTrack(true);
      }
    };

    const handleTrackUnsubscribed = (track: any, publication: any, participant: any) => {
      console.log('[AIAvatar] DirectAudioController: TrackUnsubscribed event');
      console.log('[AIAvatar] - Track kind:', track?.kind);

      // Clear audio track if it was unsubscribed
      if (track?.kind === 'audio' && !participant?.isLocal) {
        console.log('[AIAvatar] DirectAudioController: Remote audio track REMOVED');
        audioTrackRef.current = null;
        setHasAudioTrack(false);
      }
    };

    // Attach listeners
    room.on('trackSubscribed', handleTrackSubscribed);
    room.on('trackUnsubscribed', handleTrackUnsubscribed);
    console.log('[AIAvatar] DirectAudioController: Event listeners attached');

    return () => {
      console.log('[AIAvatar] DirectAudioController: Cleaning up event listeners');
      room.off('trackSubscribed', handleTrackSubscribed);
      room.off('trackUnsubscribed', handleTrackUnsubscribed);
      listenerAttachedRef.current = false;
    };
  }, [room, isConnected]);

  // Build 18a: Log only, no AudioTrack render yet
  // Build 18b: renderAudio && hasAudioTrack && <AudioTrack />
  // FIXED: Audio plays automatically in React Native, no need to render AudioTrack component
  if (!modules) return null;

  return (
    <View style={styles.directAudioStatus}>
      <Text style={styles.directAudioText}>
        {hasAudioTrack ? '🔊 Audio track ready' : '⏳ Waiting for audio...'}
      </Text>
      {/* Audio plays automatically via WebRTC when subscribed */}
    </View>
  );
}

// Build 19c: Voice loop controller with UI-visible debug telemetry
function VoiceLoopController({
  modules,
  isConnected,
  updateTelemetry
}: {
  modules: LiveKitModules;
  isConnected: boolean;
  updateTelemetry: (updates: Partial<DebugTelemetry>) => void;
}) {
  const [listeningStarted, setListeningStarted] = useState(false);
  const [avatarState, setAvatarState] = useState<string>('idle');
  const [micTrackPublished, setMicTrackPublished] = useState(false);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const stopListeningSentRef = useRef(false); // Build 25: Prevent duplicate stop_listening sends
  const startListeningSentRef = useRef(false); // Prevent duplicate sends
  const wasConnectedRef = useRef(false); // Track previous connection state for reset logic
  const conversationTurnRef = useRef(0); // Build 22: Track conversation turn count

  // Get room context to send data channel messages
  const room = modules?.useRoomContext ? modules.useRoomContext() : null;

  // Build 23: Reset all state when a new session connects
  // This ensures subsequent sessions work properly by clearing stale flags
  // Note: We intentionally exclude updateTelemetry from deps to prevent re-running on every render
  useEffect(() => {
    if (isConnected && !wasConnectedRef.current) {
      // Transitioning from disconnected -> connected = new session starting
      console.log('[AIAvatar] VoiceLoop: NEW SESSION DETECTED - Resetting all state');
      setListeningStarted(false);
      setAvatarState('idle');
      setMicTrackPublished(false);
      startListeningSentRef.current = false;
      stopListeningSentRef.current = false; // Build 25: Reset stop_listening guard
      conversationTurnRef.current = 0;

      // Clear any pending fallback timer
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }

      // Reset telemetry for new session
      updateTelemetry({
        startListeningSent: false,
        startListeningTime: null,
        trackPublished: false,
        trackPublishedTime: null,
        allServerEvents: [],
        errors: [],
      });

      console.log('[AIAvatar] VoiceLoop: State reset complete for new session');
    }

    // Update the ref to track current connection state
    wasConnectedRef.current = isConnected;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  // Update room state in telemetry
  useEffect(() => {
    if (room) {
      updateTelemetry({
        roomConnected: isConnected,
        roomState: room.state || 'unknown',
      });
    }
  }, [room, isConnected]);

  // Listen for LocalTrackPublished event to know when mic is truly ready
  // Also set up 5-second fallback timer
  useEffect(() => {
    if (!room || !isConnected) return;

    console.log('[AIAvatar] VoiceLoop: Setting up LocalTrackPublished listener...');

    const handleLocalTrackPublished = (publication: any, participant: any) => {
      console.log('[AIAvatar] VoiceLoop: LocalTrackPublished event received');
      console.log('[AIAvatar] VoiceLoop: Track source:', publication?.source);
      console.log('[AIAvatar] VoiceLoop: Track kind:', publication?.kind);
      console.log('[AIAvatar] VoiceLoop: Track SID:', publication?.trackSid);

      // Check if this is a microphone/audio track
      if (publication?.kind === 'audio' || publication?.source === 'microphone') {
        console.log('[AIAvatar] VoiceLoop: LOCAL MIC TRACK PUBLISHED!');
        setMicTrackPublished(true);

        // Build 19e: Deep inspect the published track
        const track = publication?.track;
        let trackStarted: boolean | null = null;
        let trackEnabled: boolean | null = null;
        let mediaStreamActive: boolean | null = null;
        let mediaTrackReadyState: string | null = null;

        if (track) {
          console.log('[AIAvatar] VoiceLoop: Inspecting published track...');
          console.log('[AIAvatar] VoiceLoop: track.isStarted:', track.isStarted);
          console.log('[AIAvatar] VoiceLoop: track.isEnabled:', track.isEnabled);
          if (track.isStarted !== undefined) trackStarted = track.isStarted;
          if (track.isEnabled !== undefined) trackEnabled = track.isEnabled;

          const mediaStreamTrack = track.mediaStreamTrack || track._mediaStreamTrack;
          if (mediaStreamTrack) {
            console.log('[AIAvatar] VoiceLoop: MediaStreamTrack.readyState:', mediaStreamTrack.readyState);
            console.log('[AIAvatar] VoiceLoop: MediaStreamTrack.enabled:', mediaStreamTrack.enabled);
            console.log('[AIAvatar] VoiceLoop: MediaStreamTrack.muted:', mediaStreamTrack.muted);
            if (mediaStreamTrack.readyState) mediaTrackReadyState = mediaStreamTrack.readyState;
            if (track.mediaStream?.active !== undefined) mediaStreamActive = track.mediaStream.active;
          }
        }

        updateTelemetry({
          trackPublished: true,
          trackPublishedTime: getTimeStamp(),
          trackPublishedViaFallback: false,
          audioTrackSid: publication?.trackSid || null,
          audioTrackMuted: publication?.isMuted ?? null,
          ...(trackStarted !== null && { trackStarted }),
          ...(trackEnabled !== null && { trackEnabled }),
          ...(mediaStreamActive !== null && { mediaStreamActive }),
          ...(mediaTrackReadyState !== null && { mediaTrackReadyState }),
        });

        // Build 19f: Force re-enable mic to start audio transmission
        console.log('[AIAvatar] VoiceLoop: Build 19f - Force re-enabling mic after publication...');
        (async () => {
          try {
            await room.localParticipant.setMicrophoneEnabled(true);
            console.log('[AIAvatar] VoiceLoop: Mic re-enabled successfully');
            updateTelemetry({
              micReEnabled: true,
              micReEnabledTime: getTimeStamp(),
            });
          } catch (reEnableErr) {
            console.error('[AIAvatar] VoiceLoop: Failed to re-enable mic:', reEnableErr);
            updateTelemetry({
              errors: [`Re-enable failed: ${reEnableErr}`],
            });
          }
        })();

        // Clear fallback timer since we got the event
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }
      }
    };

    // Build 19e: Helper to deep inspect audio track capture state
    const inspectAudioTrackCapture = (audioTracks: Map<string, any>) => {
      let trackSid: string | null = null;
      let trackMuted: boolean | null = null;
      let trackStarted: boolean | null = null;
      let trackEnabled: boolean | null = null;
      let mediaStreamActive: boolean | null = null;
      let mediaTrackReadyState: string | null = null;

      audioTracks.forEach((pub: any) => {
        trackSid = pub.trackSid;
        trackMuted = pub.isMuted ?? null;

        const track = pub.track;
        if (track) {
          console.log('[AIAvatar] VoiceLoop: Inspecting track capture state...');
          console.log('[AIAvatar] VoiceLoop: track.isStarted:', track.isStarted);
          console.log('[AIAvatar] VoiceLoop: track.isEnabled:', track.isEnabled);
          if (track.isStarted !== undefined) trackStarted = track.isStarted;
          if (track.isEnabled !== undefined) trackEnabled = track.isEnabled;

          const mediaStreamTrack = track.mediaStreamTrack || track._mediaStreamTrack;
          if (mediaStreamTrack) {
            console.log('[AIAvatar] VoiceLoop: MediaStreamTrack.readyState:', mediaStreamTrack.readyState);
            console.log('[AIAvatar] VoiceLoop: MediaStreamTrack.enabled:', mediaStreamTrack.enabled);
            console.log('[AIAvatar] VoiceLoop: MediaStreamTrack.muted:', mediaStreamTrack.muted);
            if (mediaStreamTrack.readyState) mediaTrackReadyState = mediaStreamTrack.readyState;
            if (track.mediaStream?.active !== undefined) mediaStreamActive = track.mediaStream.active;
          }
        }
      });

      return { trackSid, trackMuted, trackStarted, trackEnabled, mediaStreamActive, mediaTrackReadyState };
    };

    // Also check if there's already a published audio track
    const existingAudioTracks = room.localParticipant?.audioTrackPublications;
    if (existingAudioTracks && existingAudioTracks.size > 0) {
      console.log('[AIAvatar] VoiceLoop: Found existing audio tracks:', existingAudioTracks.size);
      setMicTrackPublished(true);

      const captureState = inspectAudioTrackCapture(existingAudioTracks as Map<string, any>);

      updateTelemetry({
        trackPublished: true,
        trackPublishedTime: getTimeStamp(),
        trackPublishedViaFallback: false,
        audioTrackCount: existingAudioTracks.size,
        audioTrackSid: captureState.trackSid,
        audioTrackMuted: captureState.trackMuted,
        ...(captureState.trackStarted !== null && { trackStarted: captureState.trackStarted }),
        ...(captureState.trackEnabled !== null && { trackEnabled: captureState.trackEnabled }),
        ...(captureState.mediaStreamActive !== null && { mediaStreamActive: captureState.mediaStreamActive }),
        ...(captureState.mediaTrackReadyState !== null && { mediaTrackReadyState: captureState.mediaTrackReadyState }),
      });
    } else {
      // Set up 5-second fallback timer
      console.log('[AIAvatar] VoiceLoop: Setting up 5-second fallback timer...');
      fallbackTimerRef.current = setTimeout(() => {
        console.log('[AIAvatar] VoiceLoop: FALLBACK TIMER FIRED - checking for audio tracks...');
        const audioTracks = room.localParticipant?.audioTrackPublications;
        const trackCount = audioTracks?.size || 0;

        updateTelemetry({
          audioTrackCount: trackCount,
        });

        if (trackCount > 0) {
          console.log('[AIAvatar] VoiceLoop: Found audio tracks via fallback, proceeding...');
          setMicTrackPublished(true);

          // Clear timer after fallback fires
          fallbackTimerRef.current = null;

          const captureState = inspectAudioTrackCapture(audioTracks as Map<string, any>);

          updateTelemetry({
            trackPublished: true,
            trackPublishedTime: getTimeStamp(),
            trackPublishedViaFallback: true,
            audioTrackSid: captureState.trackSid,
            audioTrackMuted: captureState.trackMuted,
            ...(captureState.trackStarted !== null && { trackStarted: captureState.trackStarted }),
            ...(captureState.trackEnabled !== null && { trackEnabled: captureState.trackEnabled }),
            ...(captureState.mediaStreamActive !== null && { mediaStreamActive: captureState.mediaStreamActive }),
            ...(captureState.mediaTrackReadyState !== null && { mediaTrackReadyState: captureState.mediaTrackReadyState }),
          });

          // Build 19f: Force re-enable mic in fallback path too
          console.log('[AIAvatar] VoiceLoop: Build 19f - Force re-enabling mic after fallback detection...');
          (async () => {
            try {
              await room.localParticipant.setMicrophoneEnabled(true);
              console.log('[AIAvatar] VoiceLoop: Mic re-enabled successfully (fallback path)');
              updateTelemetry({
                micReEnabled: true,
                micReEnabledTime: getTimeStamp(),
              });
            } catch (reEnableErr) {
              console.error('[AIAvatar] VoiceLoop: Failed to re-enable mic (fallback):', reEnableErr);
              updateTelemetry({
                errors: [`Re-enable failed (fallback): ${reEnableErr}`],
              });
            }
          })();
        } else {
          console.warn('[AIAvatar] VoiceLoop: FALLBACK - No audio tracks found after 5s!');
          updateTelemetry({
            errors: ['No audio tracks after 5s fallback'],
          });
        }
      }, 5000);
    }

    room.on('localTrackPublished', handleLocalTrackPublished);

    return () => {
      room.off('localTrackPublished', handleLocalTrackPublished);
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
      }
    };
  }, [room, isConnected]);

  // Build 19f: Refs for AudioContext to persist across interval iterations
  const audioContextRef = useRef<any>(null);
  const analyserRef = useRef<any>(null);

  // Build 19f: Monitor mic level and outbound audio stats
  useEffect(() => {
    if (!room || !isConnected || !micTrackPublished) return;

    let intervalId: NodeJS.Timeout | null = null;

    const monitorAudioStats = async () => {
      try {
        // Get audio track publication
        const audioTracks = room.localParticipant?.audioTrackPublications;
        if (!audioTracks || audioTracks.size === 0) return;

        let track: any = null;
        let publication: any = null;
        audioTracks.forEach((pub: any) => {
          publication = pub;
          track = pub.track;
        });

        if (!track) return;

        // Get MediaStreamTrack for audio level
        const mediaStreamTrack = track.mediaStreamTrack || track._mediaStreamTrack;

        // Try to get outbound stats via RTCPeerConnection
        const engine = room.engine as any;
        const pc = engine?.publisher?.pc || engine?.pcManager?.publisher;

        if (pc && typeof pc.getStats === 'function') {
          try {
            const stats = await pc.getStats();
            stats.forEach((report: any) => {
              if (report.type === 'outbound-rtp' && report.kind === 'audio') {
                console.log('[AIAvatar] AudioStats: bytesSent:', report.bytesSent, 'packetsSent:', report.packetsSent, 'codec:', report.codecId);
                updateTelemetry({
                  bytesSent: report.bytesSent || 0,
                  packetsSent: report.packetsSent || 0,
                });
              }
              // Build 19g: Get codec info
              if (report.type === 'codec' && report.mimeType?.includes('audio')) {
                console.log('[AIAvatar] AudioStats: codec mimeType:', report.mimeType);
                updateTelemetry({
                  audioCodec: report.mimeType || 'unknown',
                });
              }
            });
          } catch (statsErr) {
            console.log('[AIAvatar] AudioStats: Failed to get stats:', statsErr);
          }
        }

        // Try to get audio level using AudioContext (web/native) - only create once
        if (mediaStreamTrack && !audioContextRef.current) {
          try {
            const AudioContextClass = (globalThis as any).AudioContext || (globalThis as any).webkitAudioContext;
            if (AudioContextClass && track.mediaStream) {
              audioContextRef.current = new AudioContextClass();
              const source = audioContextRef.current.createMediaStreamSource(track.mediaStream);
              analyserRef.current = audioContextRef.current.createAnalyser();
              analyserRef.current.fftSize = 256;
              source.connect(analyserRef.current);
              console.log('[AIAvatar] AudioStats: AudioContext created for mic level monitoring');
            }
          } catch (ctxErr) {
            console.log('[AIAvatar] AudioStats: Failed to create AudioContext:', ctxErr);
          }
        }

        // Read audio level from analyser
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
          const normalizedLevel = average / 255;
          updateTelemetry({
            micLevel: normalizedLevel,
          });
        }
      } catch (err) {
        console.log('[AIAvatar] AudioStats: Error monitoring:', err);
      }
    };

    // Poll every 500ms
    intervalId = setInterval(monitorAudioStats, 500);
    monitorAudioStats(); // Initial check

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
          audioContextRef.current = null;
          analyserRef.current = null;
        } catch (e) { }
      }
    };
  }, [room, isConnected, micTrackPublished]);

  // Helper to check actual data channel readiness
  const checkDataChannelReady = useCallback(() => {
    if (!room) return { ready: false, state: 'no_room' };

    const engine = room.engine as any;
    if (!engine) return { ready: false, state: 'no_engine' };

    // Check multiple possible data channel locations in LiveKit
    // The publisher data channel is used for reliable data messages
    const publisherDC = engine.publisher?.dataChannel;
    const reliableDC = engine.reliableDC;
    const lossyDC = engine.lossyDC;

    // Log all possible data channel states
    const publisherState = publisherDC?.readyState || 'undefined';
    const reliableState = reliableDC?.readyState || 'undefined';
    const lossyState = lossyDC?.readyState || 'undefined';
    const engineConnected = engine.connected ?? false;

    console.log('[AIAvatar] DataChannel states:');
    console.log('  - engine.connected:', engineConnected);
    console.log('  - publisher.dataChannel:', publisherState);
    console.log('  - reliableDC:', reliableState);
    console.log('  - lossyDC:', lossyState);

    // Check if any data channel is open
    const isReliableOpen = reliableState === 'open';
    const isLossyOpen = lossyState === 'open';
    const isPublisherOpen = publisherState === 'open';

    const anyOpen = isReliableOpen || isLossyOpen || isPublisherOpen;
    const stateString = `reliable:${reliableState},lossy:${lossyState},pub:${publisherState}`;

    return {
      ready: anyOpen,
      state: stateString,
      engineConnected,
      reliableState,
      lossyState,
      publisherState
    };
  }, [room]);

  // Build 22: Reusable function to send avatar.start_listening command
  // Can be called at startup and after avatar finishes speaking
  const sendStartListeningCommand = useCallback(async (reason: string) => {
    if (!room) {
      console.log('[AIAvatar] sendStartListening: No room available');
      return false;
    }

    const dcStatus = checkDataChannelReady();
    console.log(`[AIAvatar] sendStartListening (${reason}): DataChannel ready:`, dcStatus.ready);

    if (!dcStatus.ready) {
      console.log(`[AIAvatar] sendStartListening (${reason}): DataChannel not ready, skipping`);
      return false;
    }

    try {
      const roomState = room.state;
      const isRoomConnected = roomState === 'connected' ||
        roomState === 'Connected' ||
        (roomState && String(roomState).toLowerCase() === 'connected');

      if (!isRoomConnected) {
        console.warn(`[AIAvatar] sendStartListening (${reason}): Room not connected`);
        return false;
      }

      if (!room.localParticipant) {
        console.warn(`[AIAvatar] sendStartListening (${reason}): Local participant not ready`);
        return false;
      }

      conversationTurnRef.current += 1;
      const turnNum = conversationTurnRef.current;

      const command = JSON.stringify({
        event_type: 'avatar.start_listening'
      });
      console.log(`[AIAvatar] sendStartListening (${reason}): Sending command, turn #${turnNum}`);

      const encoder = new TextEncoder();
      const data = encoder.encode(command);

      await room.localParticipant.publishData(data, {
        reliable: true,
        topic: 'agent-control'
      });

      console.log(`[AIAvatar] sendStartListening (${reason}): Command SENT successfully, turn #${turnNum}`);

      // Build 22 FIX: Update state flags to prevent duplicate sends and sync state machine
      startListeningSentRef.current = true;
      setListeningStarted(true);

      updateTelemetry({
        startListeningSent: true,
        startListeningTime: getTimeStamp(),
        appendEvent: `${getTimeStamp()}: start_listening (turn ${turnNum})`,
      } as any);

      return true;
    } catch (err: any) {
      console.error(`[AIAvatar] sendStartListening (${reason}): Failed:`, err);
      updateTelemetry({
        errors: [`start_listening failed (${reason}): ${err?.message || 'unknown'}`],
      });
      return false;
    }
  }, [room, checkDataChannelReady, updateTelemetry]);

  // Build 24: Function to send avatar.stop_listening command
  // Must be sent after user.speak_ended to signal HeyGen to generate a response
  const sendStopListeningCommand = useCallback(async (reason: string) => {
    if (!room) {
      console.log('[AIAvatar] sendStopListening: No room available');
      return false;
    }

    const dcStatus = checkDataChannelReady();
    console.log(`[AIAvatar] sendStopListening (${reason}): DataChannel ready:`, dcStatus.ready);

    if (!dcStatus.ready) {
      console.log(`[AIAvatar] sendStopListening (${reason}): DataChannel not ready, skipping`);
      return false;
    }

    try {
      const roomState = room.state;
      const isRoomConnected = roomState === 'connected' ||
        roomState === 'Connected' ||
        (roomState && String(roomState).toLowerCase() === 'connected');

      if (!isRoomConnected) {
        console.warn(`[AIAvatar] sendStopListening (${reason}): Room not connected`);
        return false;
      }

      if (!room.localParticipant) {
        console.warn(`[AIAvatar] sendStopListening (${reason}): Local participant not ready`);
        return false;
      }

      const command = JSON.stringify({
        event_type: 'avatar.stop_listening'
      });
      console.log(`[AIAvatar] sendStopListening (${reason}): Sending command...`);

      const encoder = new TextEncoder();
      const data = encoder.encode(command);

      await room.localParticipant.publishData(data, {
        reliable: true,
        topic: 'agent-control'
      });

      console.log(`[AIAvatar] sendStopListening (${reason}): Command SENT successfully`);

      // NOTE: Do NOT reset listening guards here!
      // The avatar.speak_ended handler already resets startListeningSentRef before re-arming.
      // Resetting guards here would cause the initial polling useEffect to fire again.

      updateTelemetry({
        appendEvent: `${getTimeStamp()}: stop_listening (${reason})`,
      } as any);

      return true;
    } catch (err: any) {
      console.error(`[AIAvatar] sendStopListening (${reason}): Failed:`, err);
      updateTelemetry({
        errors: [`stop_listening failed (${reason}): ${err?.message || 'unknown'}`],
      });
      return false;
    }
  }, [room, checkDataChannelReady, updateTelemetry]);

  // Build 22: Simplified initial start_listening trigger using the reusable helper
  // Polls for data channel readiness, then calls sendStartListeningCommand
  useEffect(() => {
    if (isConnected && room && micTrackPublished && !listeningStarted && !startListeningSentRef.current) {
      console.log('[AIAvatar] VoiceLoop: Mic track confirmed published, starting DC poll...');

      let pollCount = 0;
      const maxPolls = 20; // 20 polls * 250ms = 5 seconds max wait
      let pollInterval: NodeJS.Timeout | null = null;
      let stopped = false;

      const pollAndSend = async () => {
        // Guard: Already sent or stopped
        if (startListeningSentRef.current || stopped) {
          console.log('[AIAvatar] VoiceLoop: Already sent or stopped, clearing poll');
          if (pollInterval) clearInterval(pollInterval);
          return;
        }

        pollCount++;
        console.log(`[AIAvatar] VoiceLoop: Poll attempt ${pollCount}/${maxPolls}`);

        // Check data channel readiness
        const dcStatus = checkDataChannelReady();
        updateTelemetry({
          dataChannelReady: dcStatus.ready,
          dataChannelState: dcStatus.state,
        });

        if (!dcStatus.ready) {
          if (pollCount >= maxPolls) {
            console.error('[AIAvatar] VoiceLoop: Data channel never opened after 5s!');
            updateTelemetry({ errors: [`Data channel timeout: ${dcStatus.state}`] });
            if (pollInterval) clearInterval(pollInterval);
          }
          return; // Will retry on next poll
        }

        // DC ready - stop polling and send via helper
        if (pollInterval) clearInterval(pollInterval);
        stopped = true;

        console.log('[AIAvatar] VoiceLoop: DC ready, calling sendStartListeningCommand...');
        const success = await sendStartListeningCommand('initial');

        if (!success) {
          console.error('[AIAvatar] VoiceLoop: Initial sendStartListeningCommand failed');
        }
      };

      // Start polling for data channel readiness
      console.log('[AIAvatar] VoiceLoop: Starting data channel readiness polling...');

      // Initial check after 200ms delay
      setTimeout(() => {
        pollAndSend();
        // Then poll every 250ms if first attempt didn't succeed
        if (!startListeningSentRef.current && !stopped) {
          pollInterval = setInterval(pollAndSend, 250);
        }
      }, 200);

      return () => {
        stopped = true;
        if (pollInterval) clearInterval(pollInterval);
      };
    }
  }, [isConnected, room, micTrackPublished, listeningStarted, checkDataChannelReady, sendStartListeningCommand]);

  // Listen for server events via DataReceived
  // Build 22: Updated to re-send start_listening after avatar finishes speaking
  useEffect(() => {
    if (!room) return;

    const handleDataReceived = (payload: Uint8Array, participant: any, kind: any, topic?: string) => {
      try {
        const decoder = new TextDecoder();
        const message = decoder.decode(payload);
        const data = JSON.parse(message);

        // Build 21: LiveAvatar uses event_type field, but also check type for backwards compat
        const eventType = data.event_type || data.type || JSON.stringify(data).substring(0, 40);
        const timestamp = getTimeStamp();
        console.log('[AIAvatar] Server event received:', eventType);
        console.log('[AIAvatar] Event topic:', topic || 'no-topic');
        console.log('[AIAvatar] Full data:', JSON.stringify(data));

        // Build 21: Update telemetry with event
        updateTelemetry({
          lastServerEvent: eventType,
          lastServerEventTime: timestamp,
          appendEvent: `${timestamp}: ${eventType}`,
        } as any);

        // Update state based on events - check both event_type and type fields
        const evt = data.event_type || data.type;
        if (evt === 'user.speak_started') {
          console.log('[AIAvatar] >>> User started speaking');
          setAvatarState('listening');
        } else if (evt === 'user.speak_ended') {
          console.log('[AIAvatar] >>> User stopped speaking');
          setAvatarState('processing');

          // Build 25: Set up fallback timer - if transcription_ended doesn't arrive in 3s, send stop_listening anyway
          // This prevents deadlock if transcription fails or is delayed
          if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current);
          }
          fallbackTimerRef.current = setTimeout(() => {
            if (!stopListeningSentRef.current) {
              console.log('[AIAvatar] >>> Fallback: transcription_ended not received in 3s, sending stop_listening...');
              sendStopListeningCommand('fallback_timeout');
              stopListeningSentRef.current = true;
            }
          }, 3000);
        } else if (evt === 'avatar.speak_started') {
          console.log('[AIAvatar] >>> Avatar started speaking');
          setAvatarState('speaking');
        } else if (evt === 'avatar.speak_ended') {
          console.log('[AIAvatar] >>> Avatar stopped speaking');
          setAvatarState('idle');

          // Build 22: Re-send start_listening after avatar finishes speaking
          // This re-arms the listening mode for the next conversational turn
          console.log('[AIAvatar] >>> Re-arming listening mode for next turn...');

          // Reset guards to allow sending commands for next turn
          startListeningSentRef.current = false;
          stopListeningSentRef.current = false; // Build 25: Reset for next turn

          // Clear any pending fallback timer
          if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
          }

          setTimeout(() => {
            sendStartListeningCommand('avatar_finished');
          }, 100); // Small delay to ensure avatar has fully finished
        } else if (evt === 'user.transcription_ended') {
          // Build 25: Send stop_listening AFTER transcription is complete
          // This ensures the transcript is fully delivered before signaling end of turn
          console.log('[AIAvatar] >>> User transcription:', data.text);

          // Clear fallback timer since transcription arrived
          if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
          }

          // Only send stop_listening if we haven't already (guard against duplicates)
          if (!stopListeningSentRef.current) {
            console.log('[AIAvatar] >>> Transcription complete, sending stop_listening...');
            stopListeningSentRef.current = true;
            setTimeout(() => {
              sendStopListeningCommand('transcription_finished');
            }, 50);
          } else {
            console.log('[AIAvatar] >>> Transcription complete, but stop_listening already sent');
          }
        } else if (evt === 'avatar.transcription_ended') {
          console.log('[AIAvatar] >>> Avatar response:', data.text);
        }
      } catch (err) {
        console.log('[AIAvatar] Non-JSON data received');
      }
    };

    room.on('dataReceived', handleDataReceived);
    console.log('[AIAvatar] Phase 4: DataReceived listener attached (Build 25 - stop on transcription_ended)');

    return () => {
      room.off('dataReceived', handleDataReceived);
    };
  }, [room, sendStartListeningCommand, sendStopListeningCommand]);

  // Status indicator overlay
  return (
    <View style={styles.voiceStateOverlay}>
      <Text style={styles.voiceStateText}>
        {avatarState === 'listening' ? '🎤 Listening...' :
          avatarState === 'processing' ? '🤔 Processing...' :
            avatarState === 'speaking' ? '🗣️ Speaking...' :
              listeningStarted ? '✅ Ready' : '⏳ Starting...'}
      </Text>
    </View>
  );
}

// Build 19c: MicController with UI-visible debug telemetry
function MicController({
  modules,
  isConnected,
  updateTelemetry
}: {
  modules: LiveKitModules;
  isConnected: boolean;
  updateTelemetry: (updates: Partial<DebugTelemetry>) => void;
}) {
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [audioSessionStarted, setAudioSessionStarted] = useState(false);

  // Always call hook unconditionally (React rules)
  const { localParticipant } = modules!.useLocalParticipant();

  // Step 1: Start LiveKit AudioSession FIRST (required for iOS, optional on other platforms)
  useEffect(() => {
    if (isConnected && !audioSessionStarted) {
      console.log('[AIAvatar] MicController: Checking AudioSession availability...');

      if (modules?.AudioSession) {
        console.log('[AIAvatar] MicController: AudioSession available, starting...');
        const startAudioSession = async () => {
          try {
            await modules.AudioSession.startAudioSession();
            console.log('[AIAvatar] MicController: AudioSession STARTED successfully');
            setAudioSessionStarted(true);
            updateTelemetry({
              audioSessionStarted: true,
              audioSessionTime: getTimeStamp(),
            });
          } catch (err: any) {
            console.error('[AIAvatar] MicController: Failed to start AudioSession:', err);
            updateTelemetry({
              audioSessionStarted: true,
              audioSessionTime: getTimeStamp(),
              errors: [`AudioSession failed: ${err?.message}`],
            });
            // Continue anyway - might work on some platforms
            setAudioSessionStarted(true);
          }
        };
        startAudioSession();
      } else {
        // AudioSession not available (Android/Web) - proceed without it
        console.log('[AIAvatar] MicController: AudioSession not available, skipping (non-iOS platform)');
        setAudioSessionStarted(true);
        updateTelemetry({
          audioSessionStarted: true,
          audioSessionTime: getTimeStamp(),
        });
      }
    }
  }, [isConnected, modules, audioSessionStarted]);

  // Step 2: Enable mic AFTER AudioSession is started
  useEffect(() => {
    if (isConnected && localParticipant && audioSessionStarted && !isMicEnabled) {
      console.log('[AIAvatar] MicController: Attempting to enable local microphone...');
      console.log('[AIAvatar] MicController: localParticipant identity:', localParticipant.identity);
      console.log('[AIAvatar] MicController: localParticipant sid:', localParticipant.sid);

      // Build 19g: Update telemetry with participant identity
      updateTelemetry({
        participantIdentity: localParticipant.identity || localParticipant.sid || 'unknown',
      });

      const enableMic = async () => {
        try {
          // Request audio permissions first (Expo)
          console.log('[AIAvatar] MicController: Requesting audio permissions...');
          const { status } = await Audio.requestPermissionsAsync();
          console.log('[AIAvatar] MicController: Audio permission status:', status);

          updateTelemetry({
            permissionGranted: status === 'granted',
            permissionTime: getTimeStamp(),
          });

          if (status !== 'granted') {
            throw new Error('Microphone permission denied');
          }

          console.log('[AIAvatar] MicController: Calling setMicrophoneEnabled(true)...');
          await localParticipant.setMicrophoneEnabled(true);
          console.log('[AIAvatar] MicController: setMicrophoneEnabled COMPLETED');

          // Check if mic track is published
          const audioTracks = localParticipant.audioTrackPublications;
          const trackCount = audioTracks?.size || 0;
          console.log('[AIAvatar] MicController: Audio track publications count:', trackCount);

          // Build 19e: Helper to inspect LocalAudioTrack capture state
          const inspectAudioTrack = (audioTracks: Map<string, any>) => {
            let trackStarted: boolean | null = null;
            let trackEnabled: boolean | null = null;
            let mediaStreamActive: boolean | null = null;
            let mediaTrackReadyState: string | null = null;

            audioTracks.forEach((pub: any, key: string) => {
              console.log('[AIAvatar] MicController: Audio track:', key, 'source:', pub.source, 'trackSid:', pub.trackSid);

              const track = pub.track;
              if (track) {
                console.log('[AIAvatar] MicController: Track object found');
                console.log('[AIAvatar] MicController: track.isStarted:', track.isStarted);
                console.log('[AIAvatar] MicController: track.isEnabled:', track.isEnabled);
                console.log('[AIAvatar] MicController: track.isMuted:', track.isMuted);

                // Only update if we have actual values (don't overwrite with null)
                if (track.isStarted !== undefined) trackStarted = track.isStarted;
                if (track.isEnabled !== undefined) trackEnabled = track.isEnabled;

                const mediaStreamTrack = track.mediaStreamTrack || track._mediaStreamTrack;
                if (mediaStreamTrack) {
                  console.log('[AIAvatar] MicController: MediaStreamTrack found');
                  console.log('[AIAvatar] MicController: mediaStreamTrack.readyState:', mediaStreamTrack.readyState);
                  console.log('[AIAvatar] MicController: mediaStreamTrack.enabled:', mediaStreamTrack.enabled);
                  console.log('[AIAvatar] MicController: mediaStreamTrack.muted:', mediaStreamTrack.muted);

                  if (mediaStreamTrack.readyState) mediaTrackReadyState = mediaStreamTrack.readyState;

                  if (track.mediaStream && track.mediaStream.active !== undefined) {
                    mediaStreamActive = track.mediaStream.active;
                    console.log('[AIAvatar] MicController: mediaStream.active:', mediaStreamActive);
                  }
                } else {
                  console.log('[AIAvatar] MicController: No MediaStreamTrack found on track object');
                  console.log('[AIAvatar] MicController: Track object keys:', Object.keys(track));
                }
              } else {
                console.log('[AIAvatar] MicController: No track object on publication (may still be publishing)');
              }
            });

            return { trackStarted, trackEnabled, mediaStreamActive, mediaTrackReadyState };
          };

          // Initial inspection
          let captureState = inspectAudioTrack(audioTracks as Map<string, any>);

          setIsMicEnabled(true);
          setMicError(null);
          updateTelemetry({
            micEnabled: true,
            micEnabledTime: getTimeStamp(),
            audioTrackCount: trackCount,
            ...(captureState.trackStarted !== null && { trackStarted: captureState.trackStarted }),
            ...(captureState.trackEnabled !== null && { trackEnabled: captureState.trackEnabled }),
            ...(captureState.mediaStreamActive !== null && { mediaStreamActive: captureState.mediaStreamActive }),
            ...(captureState.mediaTrackReadyState !== null && { mediaTrackReadyState: captureState.mediaTrackReadyState }),
          });
          console.log('[AIAvatar] MicController: Mic ENABLED and ready');

          // Re-inspect after a short delay in case track is still publishing
          setTimeout(() => {
            const delayedTracks = localParticipant.audioTrackPublications;
            if (delayedTracks && delayedTracks.size > 0) {
              console.log('[AIAvatar] MicController: Re-inspecting audio tracks after 500ms...');
              const delayedState = inspectAudioTrack(delayedTracks as Map<string, any>);
              updateTelemetry({
                ...(delayedState.trackStarted !== null && { trackStarted: delayedState.trackStarted }),
                ...(delayedState.trackEnabled !== null && { trackEnabled: delayedState.trackEnabled }),
                ...(delayedState.mediaStreamActive !== null && { mediaStreamActive: delayedState.mediaStreamActive }),
                ...(delayedState.mediaTrackReadyState !== null && { mediaTrackReadyState: delayedState.mediaTrackReadyState }),
              });
            }
          }, 500);
        } catch (err: any) {
          console.error('[AIAvatar] MicController: Failed to enable microphone:', err);
          console.error('[AIAvatar] MicController: Error name:', err?.name);
          console.error('[AIAvatar] MicController: Error message:', err?.message);
          setMicError(err?.message || 'Failed to enable mic');
          updateTelemetry({
            errors: [`Mic enable failed: ${err?.message || 'unknown'}`],
          });
        }
      };
      enableMic();
    }
  }, [isConnected, localParticipant, audioSessionStarted, isMicEnabled]);

  const toggleMic = async () => {
    if (!localParticipant) return;
    try {
      const newState = !isMicEnabled;
      await localParticipant.setMicrophoneEnabled(newState);
      console.log('[AIAvatar] Mic toggled to:', newState);
      setIsMicEnabled(newState);
      updateTelemetry({ micEnabled: newState });
    } catch (err: any) {
      console.error('[AIAvatar] Failed to toggle mic:', err);
      setMicError(err?.message || 'Mic toggle failed');
    }
  };

  return (
    <View style={styles.micOverlay}>
      <TouchableOpacity
        style={[styles.micButton, isMicEnabled ? styles.micButtonActive : styles.micButtonInactive]}
        onPress={toggleMic}
      >
        <Ionicons
          name={isMicEnabled ? "mic" : "mic-off"}
          size={36}
          color="#fff"
        />
      </TouchableOpacity>
      {micError && (
        <Text style={styles.micErrorText}>{micError}</Text>
      )}
      <Text style={styles.micStatusText}>
        {isMicEnabled ? 'Mic ON - Speak now' : 'Mic OFF'}
      </Text>
    </View>
  );
}

// Build 19c: MinimalLiveKitContent with debug telemetry panel
function MinimalLiveKitContent({
  isConnected,
  showRemoteVideo,
  enableLocalMic,
  enableRemoteAudio,
  enableDataChannel,
  enableDirectAudio,
  modules,
  showDebugPanel = true,
  liveKitUrl = '',
  liveKitToken = ''
}: {
  isConnected: boolean;
  showRemoteVideo: boolean;
  enableLocalMic: boolean;
  enableRemoteAudio: boolean;
  enableDataChannel: boolean;
  enableDirectAudio: boolean;
  modules: LiveKitModules;
  showDebugPanel?: boolean;
  liveKitUrl?: string;
  liveKitToken?: string;
}) {
  // Build 19c: Debug telemetry state
  const [debugTelemetry, setDebugTelemetry] = useState<DebugTelemetry>(initialDebugTelemetry);

  const updateTelemetry = useCallback((updates: Partial<DebugTelemetry> & { appendEvent?: string }) => {
    setDebugTelemetry(prev => {
      let newState = { ...prev, ...updates };

      // Special handling for errors array - append instead of replace
      if (updates.errors) {
        newState.errors = [...prev.errors, ...updates.errors].slice(-5);
      }

      // Build 19g: Special handling for allServerEvents - append
      if ((updates as any).appendEvent) {
        newState.allServerEvents = [...(prev.allServerEvents || []), (updates as any).appendEvent].slice(-10);
        delete (newState as any).appendEvent;
      }

      return newState;
    });
  }, []);

  console.log('[AIAvatar] MinimalLiveKitContent render - isConnected:', isConnected, 'showRemoteVideo:', showRemoteVideo, 'enableLocalMic:', enableLocalMic, 'enableDirectAudio:', enableDirectAudio, 'enableDataChannel:', enableDataChannel);

  // Build 19g: Update telemetry with LiveKit URL/token for meet.livekit.io testing
  useEffect(() => {
    if (liveKitUrl || liveKitToken) {
      setDebugTelemetry(prev => ({
        ...prev,
        liveKitUrl: liveKitUrl || prev.liveKitUrl,
        liveKitToken: liveKitToken || prev.liveKitToken,
      }));
    }
  }, [liveKitUrl, liveKitToken]);

  return (
    <View style={styles.videoContainer}>
      {!isConnected ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Connecting to LiveKit room...</Text>
        </View>
      ) : showRemoteVideo ? (
        // Phase 2+: Render remote video after connection is stable
        <>
          <MinimalRemoteVideoRenderer modules={modules} />
          {/* Build 17a: Remote audio via useTracks - CRASHES, DO NOT USE */}
          {enableRemoteAudio && modules && (
            <RemoteAudioRenderer modules={modules} />
          )}
          {/* Build 18a: Direct audio via room events - avoids useTracks crash */}
          {enableDirectAudio && modules && (
            <DirectAudioController modules={modules} isConnected={isConnected} renderAudio={true} />
          )}
          {/* Build 19c: Voice loop controller with debug telemetry */}
          {enableDataChannel && modules && (
            <VoiceLoopController modules={modules} isConnected={isConnected} updateTelemetry={updateTelemetry} />
          )}
          {/* Build 19c: Mic control with debug telemetry */}
          {enableLocalMic && modules && (
            <MicController modules={modules} isConnected={isConnected} updateTelemetry={updateTelemetry} />
          )}
          {/* Build 19c: Debug panel overlay */}
          <DebugPanel telemetry={debugTelemetry} visible={showDebugPanel} />
        </>
      ) : (
        // Phase 1: Connection successful, but no track subscription yet
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="checkmark-circle" size={64} color={theme.colors.primary} />
          <Text style={styles.placeholderText}>LiveKit Connected!</Text>
          <Text style={styles.placeholderSubtext}>Connection test passed</Text>
        </View>
      )}
    </View>
  );
}

// ORIGINAL COMPONENTS - DISABLED FOR MINIMAL TEST
// Uncomment these and LiveKitContent after minimal test passes

/*
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
*/

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

  // Debug panel visibility - toggle with 5 taps on timer (for testing)
  const [showDebugPanel, setShowDebugPanel] = useState(__DEV__); // Show in dev mode by default
  const debugTapCountRef = useRef(0);
  const debugTapTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTimerTap = () => {
    debugTapCountRef.current += 1;
    if (debugTapTimerRef.current) clearTimeout(debugTapTimerRef.current);

    if (debugTapCountRef.current >= 5) {
      setShowDebugPanel(prev => !prev);
      debugTapCountRef.current = 0;
    } else {
      debugTapTimerRef.current = setTimeout(() => {
        debugTapCountRef.current = 0;
      }, 2000);
    }
  };

  const [sessionId, setSessionId] = useState<string>('');
  const [sessionToken, setSessionToken] = useState<string>('');
  const [liveKitUrl, setLiveKitUrl] = useState<string>('');
  const [liveKitToken, setLiveKitToken] = useState<string>('');
  const [liveKitModules, setLiveKitModules] = useState<LiveKitModules>(null);
  const [liveKitLoaded, setLiveKitLoaded] = useState(false);

  // LiveKit feature flags
  const [showRemoteVideo, setShowRemoteVideo] = useState(true);
  const [enableLocalMic, setEnableLocalMic] = useState(true);
  // enableRemoteAudio = false: useTracks for audio CRASHES - DO NOT USE
  // enableDataChannel = true: Send avatar.start_listening, listen for events
  // enableDirectAudio = true: Use room events for audio track (log only for 18a)
  const [enableRemoteAudio, setEnableRemoteAudio] = useState(false);
  const [enableDataChannel, setEnableDataChannel] = useState(true);
  const [enableDirectAudio, setEnableDirectAudio] = useState(true);

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
      // Fall back to hardcoded API key if no stored key
      if (!key && HEYGEN_API_KEY_HARDCODED) {
        console.log('[AIAvatar] Using fallback API key');
        return HEYGEN_API_KEY_HARDCODED;
      }
      return key;
    } catch (err) {
      console.error('[AIAvatar] Error retrieving API key:', err);
      // Fall back to hardcoded API key on error
      if (HEYGEN_API_KEY_HARDCODED) {
        console.log('[AIAvatar] Using fallback API key after error');
        return HEYGEN_API_KEY_HARDCODED;
      }
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

    const langCode = getLanguageCode(language);
    const sessionContext = buildSessionContext(
      language,
      level,
      courseTitle,
      lessonTitle,
      reviewPhrases,
      langCode
    );

    // Build the dynamic avatar prompt for this lesson
    const avatarPrompt = buildAvatarPrompt(
      language,
      level,
      courseTitle,
      lessonTitle,
      reviewPhrases
    );
    console.log('[AIAvatar] Avatar prompt:', avatarPrompt);
    console.log('[AIAvatar] Session context:', JSON.stringify(sessionContext, null, 2));

    const requestBody = {
      mode: 'FULL',
      avatar_id: HEYGEN_AVATAR_ID,
      avatar_persona: {
        voice_id: HEYGEN_VOICE_ID,
        context_id: HEYGEN_CONTEXT_ID,
        language: langCode,
        // Add dynamic context prompt for this specific lesson
        system_prompt: avatarPrompt,
      },
      session_context: sessionContext,
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

      // Build 19g: Log LiveKit URL/token for meet.livekit.io testing
      console.log('[AIAvatar] Build 19g: LiveKit URL for testing:', url);
      console.log('[AIAvatar] Build 19g: LiveKit Token (first 50):', token.substring(0, 50));

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
            console.error('[AIAvatar] Error name:', err?.name);
            console.error('[AIAvatar] Error message:', err?.message);
            console.error('[AIAvatar] Error stack:', err?.stack);
            console.error('[AIAvatar] Error stringified:', JSON.stringify(err, Object.getOwnPropertyNames(err || {})));
            const errorMessage = err?.message || 'Unknown connection error';
            setError(`Connection error: ${errorMessage}`);
          }}
        >
          {/* MINIMAL TEST: Using MinimalLiveKitContent instead of full LiveKitContent */}
          <MinimalLiveKitContent
            isConnected={isConnected}
            showRemoteVideo={showRemoteVideo}
            enableLocalMic={enableLocalMic}
            enableRemoteAudio={enableRemoteAudio}
            enableDataChannel={enableDataChannel}
            enableDirectAudio={enableDirectAudio}
            modules={liveKitModules}
            showDebugPanel={showDebugPanel}
            liveKitUrl={liveKitUrl}
            liveKitToken={liveKitToken}
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
        <TouchableOpacity onPress={handleTimerTap} style={styles.timerContainer}>
          <View style={[styles.liveIndicator, isConnected && styles.liveIndicatorActive]} />
          <Text style={styles.timerText}>
            {formatTime(sessionTime)} / {formatTime(SESSION_HARD_LIMIT)}
          </Text>
        </TouchableOpacity>

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
          {lessonTitle ? ` • ${lessonTitle}` : ''}
        </Text>
        {reviewPhrases.length > 0 && (
          <Text style={styles.contextPhrases}>
            Practicing: {reviewPhrases.slice(0, 3).join(', ')}{reviewPhrases.length > 3 ? '...' : ''}
          </Text>
        )}
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
  contextPhrases: {
    color: theme.colors.primary,
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
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
  micButtonInactive: {
    backgroundColor: '#6b7280',
  },
  micButtonDisabled: {
    opacity: 0.5,
  },
  micOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  micErrorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  micStatusText: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  voiceStateOverlay: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  voiceStateText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  directAudioStatus: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  directAudioText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: 'rgba(34,197,94,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
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
