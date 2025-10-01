import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../lib/theme';
import { Button } from '../components/ui/Button';

export default function NotFoundScreen() {
  const navigation = useNavigation();

  const handleGoHome = () => {
    // Reset to Dashboard if authenticated, otherwise go to Landing
    navigation.navigate('Dashboard' as never);
  };

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      handleGoHome();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* 404 Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.notFoundIcon}>
            <Ionicons name="search" size={64} color={theme.colors.mutedForeground} />
          </View>
          <Text style={styles.errorCode}>404</Text>
        </View>

        {/* Error Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>Page Not Found</Text>
          <Text style={styles.subtitle}>
            Oops! The page you're looking for doesn't exist or has been moved.
          </Text>
        </View>

        {/* Suggestions */}
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Here's what you can do:</Text>
          
          <View style={styles.suggestionsList}>
            <View style={styles.suggestionItem}>
              <View style={styles.suggestionIcon}>
                <Ionicons name="arrow-back" size={16} color={theme.colors.primary} />
              </View>
              <Text style={styles.suggestionText}>Go back to the previous page</Text>
            </View>
            
            <View style={styles.suggestionItem}>
              <View style={styles.suggestionIcon}>
                <Ionicons name="home" size={16} color={theme.colors.primary} />
              </View>
              <Text style={styles.suggestionText}>Return to the dashboard</Text>
            </View>
            
            <View style={styles.suggestionItem}>
              <View style={styles.suggestionIcon}>
                <Ionicons name="search" size={16} color={theme.colors.primary} />
              </View>
              <Text style={styles.suggestionText}>Check the URL for typos</Text>
            </View>
            
            <View style={styles.suggestionItem}>
              <View style={styles.suggestionIcon}>
                <Ionicons name="help-circle" size={16} color={theme.colors.primary} />
              </View>
              <Text style={styles.suggestionText}>Contact support if you need help</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button onPress={handleGoHome} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Go to Dashboard</Text>
          </Button>
          
          <TouchableOpacity onPress={handleGoBack} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>

        {/* Help Links */}
        <View style={styles.helpContainer}>
          <TouchableOpacity 
            style={styles.helpLink}
            onPress={() => navigation.navigate('Contact' as never)}
          >
            <Ionicons name="chatbubble-ellipses" size={16} color={theme.colors.primary} />
            <Text style={styles.helpLinkText}>Contact Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.helpLink}
            onPress={() => navigation.navigate('FAQ' as never)}
          >
            <Ionicons name="help-circle" size={16} color={theme.colors.primary} />
            <Text style={styles.helpLinkText}>Visit FAQ</Text>
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Ionicons name="globe" size={16} color="#ffffff" />
          </View>
          <Text style={styles.logoText}>LingoToday</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Illustration
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  notFoundIcon: {
    width: 120,
    height: 120,
    backgroundColor: '#f3f4f6',
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  errorCode: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: -2,
  },

  // Message
  messageContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: '700',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },

  // Suggestions
  suggestionsContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: theme.spacing.xl,
  },
  suggestionsTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  suggestionsList: {
    gap: theme.spacing.sm,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  suggestionIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#f8f9ff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  suggestionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    flex: 1,
  },

  // Actions
  actionsContainer: {
    width: '100%',
    maxWidth: 280,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  primaryButton: {
    width: '100%',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: theme.borderRadius.lg,
  },
  secondaryButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.foreground,
  },

  // Help Links
  helpContainer: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  helpLinkText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },

  // Logo
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.6,
  },
  logoIcon: {
    width: 24,
    height: 24,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.xs,
  },
  logoText: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
});