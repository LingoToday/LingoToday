import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

const { height: screenHeight } = Dimensions.get('window');

// Use the attached video from the user
const welcomeVideo = require('../attached_assets/copy_AED4EBC5-C8C5-4DA5-8561-43B1F1A27CEC_1760083421188.MOV');

interface LandingScreenProps {
  navigation: any;
}

export default function LandingScreen({ navigation }: LandingScreenProps) {
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    // Auto-play the video once when component mounts
    const playVideo = async () => {
      try {
        if (videoRef.current) {
          await videoRef.current.playAsync();
        }
      } catch (error) {
        console.log('Video playback error:', error);
      }
    };
    playVideo();
  }, []);

  const handleVideoStatusUpdate = (status: AVPlaybackStatus) => {
    // Stop the video after it finishes playing once (GIF-style)
    if (status.isLoaded && status.didJustFinish) {
      videoRef.current?.stopAsync();
      videoRef.current?.setPositionAsync(0);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.content}>
        {/* LingoToday Branding */}
        <Text style={styles.brandingText} data-testid="text-branding">
          LingoToday
        </Text>

        {/* Video Section */}
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={welcomeVideo}
            style={styles.video}
            resizeMode={ResizeMode.COVER}
            shouldPlay={true}
            isLooping={false}
            isMuted={true}
            useNativeControls={false}
            onPlaybackStatusUpdate={handleVideoStatusUpdate}
            data-testid="video-welcome"
          />
        </View>

        {/* Marketing Copy */}
        <View style={styles.textContainer}>
          <Text style={styles.titleText} data-testid="text-title">
            Micro-Lessons. Major Progress.
          </Text>
          <Text style={styles.subtitleText} data-testid="text-subtitle">
            Short lessons and real life videos that teach you bit by bit — no pressure, just consistent wins. Backed by science.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.getStartedButton}
            onPress={() => navigation.navigate('Onboarding')}
            data-testid="button-get-started"
          >
            <Text style={styles.getStartedButtonText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
            data-testid="button-login"
          >
            <Text style={styles.loginButtonText}>Log in</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'flex-start',
  },
  brandingText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  videoContainer: {
    width: '75%',
    aspectRatio: 9 / 16,
    alignSelf: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  getStartedButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  loginButtonText: {
    color: '#374151',
    fontSize: 17,
    fontWeight: '600',
  },
});
