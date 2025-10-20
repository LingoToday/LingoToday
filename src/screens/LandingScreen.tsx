import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const portraitImage = require('../attached_assets/IMG_0553_1760371286919.png');

export default function LandingScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Ionicons name="globe" size={24} color="#ffffff" />
          </View>
          <Text style={styles.logoText}>LingoToday</Text>
        </View>

        {/* Portrait Image */}
        <View style={styles.imageContainer}>
          <Image
            source={portraitImage}
            style={styles.portraitImage}
            resizeMode="contain"
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
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#2563EB',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  imageContainer: {
    width: '100%',
    maxWidth: 300,
    aspectRatio: 3 / 4,
    marginVertical: 20,
  },
  portraitImage: {
    width: '100%',
    height: '100%',
  },
  taglineContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tagline: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 400,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 400,
    gap: 12,
  },
  joinButton: {
    backgroundColor: '#2563EB',
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
    borderColor: '#D1D5DB',
  },
  loginButtonText: {
    color: '#374151',
    fontSize: 18,
    fontWeight: '600',
  },
});
