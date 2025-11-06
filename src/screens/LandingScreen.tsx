import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { theme } from '../lib/theme';

const portraitVideo = require('../../attached_assets/copy_10F92020-BB3D-4CA0-947B-2634A0946F72_1761142720055.MOV');
const logo = require('../../assets/logo.png');

export default function LandingScreen() {
  const navigation = useNavigation();
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  const player = useVideoPlayer(portraitVideo, player => {
    player.loop = true;
    player.play();
    player.muted = true;
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const videoHeight = Math.min(dimensions.height * 0.5, 450);
  const videoWidth = videoHeight * (9 / 16);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={logo} 
            style={styles.logoIcon}
            resizeMode="contain"
          />
          <Text style={styles.logoText}>LingoToday</Text>
        </View>

        {/* Portrait Video (GIF-like) */}
        <View style={[styles.videoContainer, { width: videoWidth, height: videoHeight }]}>
          <VideoView
            style={styles.portraitVideo}
            player={player}
            allowsFullscreen={false}
            allowsPictureInPicture={false}
            nativeControls={false}
          />
        </View>

        {/* Tagline */}
        <View style={styles.taglineContainer}>
          <Text style={styles.tagline}>
            Micro-Lessons. Major Progress.
          </Text>
          <Text style={styles.description}>
            Short lessons and engaging videos that teach you bit by bit — no pressure, just consistent wins. Backed by science.
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.joinButton}
            onPress={() => navigation.navigate('Onboarding' as never)}
            data-testid="button-join"
          >
            <Text style={styles.joinButtonText}>Join</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login' as never)}
            data-testid="button-login"
          >
            <Text style={styles.loginButtonText}>Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    paddingBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  logoIcon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.foreground,
  },
  videoContainer: {
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  portraitVideo: {
    width: '100%',
    height: '100%',
  },
  taglineContainer: {
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 8,
  },
  tagline: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.foreground,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    maxWidth: 360,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 12,
    marginTop: 16,
  },
  joinButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  loginButtonText: {
    color: '#374151',
    fontSize: 18,
    fontWeight: '600',
  },
});
