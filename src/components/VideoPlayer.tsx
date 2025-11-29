import React, { useState, useRef, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Animated, Platform, Text } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import type { AVPlaybackStatus } from 'expo-av';
import { theme } from '../lib/theme';

interface VideoPlayerProps {
  source: {
    uri: string;
    headers?: { [key: string]: string };
  };
  style?: any;
  useNativeControls?: boolean;
  resizeMode?: ResizeMode;
  shouldPlay?: boolean;
  isLooping?: boolean;
  isMuted?: boolean;
  onPlaybackStatusUpdate?: (status: AVPlaybackStatus) => void;
  videoRef?: React.RefObject<Video | null>;
  placeholderColor?: string;
  aspectRatio?: number;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  source,
  style,
  useNativeControls = true,
  resizeMode = ResizeMode.CONTAIN,
  shouldPlay = true,
  isLooping = false,
  isMuted = false,
  onPlaybackStatusUpdate,
  videoRef,
  placeholderColor = theme.colors.card,
  aspectRatio = 9 / 16,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const internalVideoRef = useRef<Video>(null);
  const effectiveVideoRef = videoRef || internalVideoRef;

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    fadeAnim.setValue(0);
  }, [source.uri]);

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (status.isLoaded) {
      if (isLoading) {
        setIsLoading(false);
        setHasError(false);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    } else if ('error' in status && status.error) {
      setIsLoading(false);
      setHasError(true);
      console.error('Video playback error:', status.error, {
        uri: source.uri?.substring(0, 100),
        hasHeaders: !!source.headers,
        hasAuthHeader: !!source.headers?.Authorization,
        platform: Platform.OS
      });
    }

    if (onPlaybackStatusUpdate) {
      onPlaybackStatusUpdate(status);
    }
  };

  return (
    <View style={[styles.container, { aspectRatio }, style]}>
      {isLoading && !hasError && (
        <View style={[styles.loadingContainer, { backgroundColor: placeholderColor }]}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      )}
      
      {hasError && (
        <View style={[styles.errorContainer, { backgroundColor: placeholderColor }]}>
          <Text style={styles.errorText}>⚠️</Text>
          <Text style={styles.errorMessage}>Unable to load video</Text>
          <Text style={styles.errorHint}>Please check your connection and try again</Text>
        </View>
      )}
      
      <Animated.View style={[styles.videoWrapper, { opacity: fadeAnim }]}>
        <Video
          ref={effectiveVideoRef}
          style={styles.video}
          source={source}
          useNativeControls={useNativeControls}
          resizeMode={resizeMode}
          shouldPlay={shouldPlay}
          isLooping={isLooping}
          isMuted={isMuted}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    padding: 20,
  },
  errorText: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorMessage: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorHint: {
    fontSize: 14,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  videoWrapper: {
    width: '100%',
    height: '100%',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
