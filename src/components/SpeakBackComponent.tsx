import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { theme } from '../lib/theme';
import { apiClient } from '../lib/apiClient';

interface SpeakBackComponentProps {
  expectedAnswer: string;
  alternativeAnswers?: string[];
  language: string;
  onResult: (isCorrect: boolean, transcription: string) => void;
  onSwitchToText: () => void;
  disabled?: boolean;
}

type RecordingState = 'idle' | 'recording' | 'processing' | 'result';

export const SpeakBackComponent: React.FC<SpeakBackComponentProps> = ({
  expectedAnswer,
  alternativeAnswers = [],
  language,
  onResult,
  onSwitchToText,
  disabled = false,
}) => {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [transcription, setTranscription] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const languageCodeMap: { [key: string]: string } = {
    'italian': 'it',
    'spanish': 'es',
    'french': 'fr',
    'german': 'de',
    'english': 'en',
  };

  useEffect(() => {
    checkPermission();
  }, []);

  useEffect(() => {
    if (recordingState === 'recording') {
      startPulseAnimation();
    } else {
      pulseAnim.setValue(1);
    }
  }, [recordingState]);

  const checkPermission = async () => {
    try {
      const { status } = await Audio.getPermissionsAsync();
      setHasPermission(status === 'granted');
    } catch (err) {
      console.error('Error checking audio permission:', err);
      setHasPermission(false);
    }
  };

  const requestPermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
      return status === 'granted';
    } catch (err) {
      console.error('Error requesting audio permission:', err);
      setHasPermission(false);
      return false;
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startRecording = async () => {
    if (disabled) return;
    
    setError(null);
    setTranscription('');
    setIsCorrect(null);

    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        setError('Microphone access is required to use speak-back');
        return;
      }
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setRecordingState('recording');
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    setRecordingState('processing');

    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      if (uri) {
        await processRecording(uri);
      } else {
        setError('No recording found. Please try again.');
        setRecordingState('idle');
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setError('Failed to process recording. Please try again.');
      setRecordingState('idle');
    }
  };

  const processRecording = async (audioUri: string) => {
    const langCode = languageCodeMap[language.toLowerCase()] || language;
    
    const result = await apiClient.transcribeAudio(audioUri, langCode);

    if (!result.success || !result.transcription) {
      setError(result.error || 'Failed to transcribe audio. Please try again.');
      setRecordingState('idle');
      return;
    }

    const userSaid = result.transcription.toLowerCase().trim();
    setTranscription(result.transcription);

    const correct = checkAnswer(userSaid);
    setIsCorrect(correct);
    setRecordingState('result');

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    onResult(correct, result.transcription);
  };

  const checkAnswer = (userSaid: string): boolean => {
    const normalize = (text: string) => {
      return text
        .toLowerCase()
        .trim()
        .replace(/[.,!?¿¡'"]/g, '')
        .replace(/\s+/g, ' ');
    };

    const normalizedUser = normalize(userSaid);
    const normalizedExpected = normalize(expectedAnswer);

    if (normalizedUser === normalizedExpected) return true;

    for (const alt of alternativeAnswers) {
      if (normalize(alt) === normalizedUser) return true;
    }

    if (normalizedExpected.includes(normalizedUser) || normalizedUser.includes(normalizedExpected)) {
      const lengthRatio = Math.min(normalizedUser.length, normalizedExpected.length) / 
                          Math.max(normalizedUser.length, normalizedExpected.length);
      if (lengthRatio > 0.7) return true;
    }

    const distance = levenshteinDistance(normalizedUser, normalizedExpected);
    const maxLength = Math.max(normalizedUser.length, normalizedExpected.length);
    const similarity = 1 - (distance / maxLength);
    
    return similarity >= 0.8;
  };

  const levenshteinDistance = (a: string, b: string): number => {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  };

  const resetState = () => {
    setRecordingState('idle');
    setTranscription('');
    setIsCorrect(null);
    setError(null);
    fadeAnim.setValue(0);
  };

  const renderIdleState = () => (
    <View style={styles.container}>
      <Text style={styles.promptText}>Say the word or phrase:</Text>
      <Text style={styles.expectedText}>{expectedAnswer}</Text>
      
      <TouchableOpacity
        style={[styles.micButton, disabled && styles.micButtonDisabled]}
        onPress={startRecording}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Ionicons name="mic" size={48} color="#fff" />
      </TouchableOpacity>
      
      <Text style={styles.hintText}>Tap to record</Text>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <TouchableOpacity style={styles.switchButton} onPress={onSwitchToText}>
        <Ionicons name="keypad-outline" size={20} color={theme.colors.mutedForeground} />
        <Text style={styles.switchButtonText}>Can't talk right now? Switch to text</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRecordingState = () => (
    <View style={styles.container}>
      <Text style={styles.promptText}>Listening...</Text>
      <Text style={styles.expectedText}>{expectedAnswer}</Text>
      
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          style={[styles.micButton, styles.micButtonRecording]}
          onPress={stopRecording}
          activeOpacity={0.8}
        >
          <Ionicons name="stop" size={48} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
      
      <Text style={styles.hintText}>Tap to stop</Text>
    </View>
  );

  const renderProcessingState = () => (
    <View style={styles.container}>
      <Text style={styles.promptText}>Processing your answer...</Text>
      <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
    </View>
  );

  const renderResultState = () => (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={[styles.resultBadge, isCorrect ? styles.correctBadge : styles.incorrectBadge]}>
        <Ionicons 
          name={isCorrect ? "checkmark-circle" : "close-circle"} 
          size={32} 
          color="#fff" 
        />
        <Text style={styles.resultBadgeText}>
          {isCorrect ? 'Correct!' : 'Not quite right'}
        </Text>
      </View>
      
      <View style={styles.transcriptionBox}>
        <Text style={styles.transcriptionLabel}>You said:</Text>
        <Text style={styles.transcriptionText}>"{transcription}"</Text>
      </View>
      
      {!isCorrect && (
        <View style={styles.expectedBox}>
          <Text style={styles.expectedLabel}>Expected:</Text>
          <Text style={styles.expectedTextSmall}>"{expectedAnswer}"</Text>
        </View>
      )}
      
      <View style={styles.resultActions}>
        {!isCorrect && (
          <TouchableOpacity style={styles.tryAgainButton} onPress={resetState}>
            <Ionicons name="refresh" size={20} color={theme.colors.primary} />
            <Text style={styles.tryAgainButtonText}>Try Again</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  switch (recordingState) {
    case 'recording':
      return renderRecordingState();
    case 'processing':
      return renderProcessingState();
    case 'result':
      return renderResultState();
    default:
      return renderIdleState();
  }
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  promptText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  expectedText: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  micButtonDisabled: {
    backgroundColor: theme.colors.mutedForeground,
    shadowOpacity: 0,
  },
  micButtonRecording: {
    backgroundColor: theme.colors.error,
    shadowColor: theme.colors.error,
  },
  hintText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  switchButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  loader: {
    marginTop: theme.spacing.xl,
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.lg,
  },
  correctBadge: {
    backgroundColor: theme.colors.checkmarkGreen,
  },
  incorrectBadge: {
    backgroundColor: theme.colors.error,
  },
  resultBadgeText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: '#fff',
  },
  transcriptionBox: {
    backgroundColor: theme.colors.muted + '50',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  transcriptionLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.xs,
  },
  transcriptionText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
    fontStyle: 'italic',
  },
  expectedBox: {
    backgroundColor: theme.colors.error + '20',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
    width: '100%',
  },
  expectedLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.error,
    marginBottom: theme.spacing.xs,
  },
  expectedTextSmall: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.error,
    fontStyle: 'italic',
  },
  resultActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  tryAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  tryAgainButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});

export default SpeakBackComponent;
