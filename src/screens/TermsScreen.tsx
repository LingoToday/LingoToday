import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../lib/theme';

export default function TermsScreen() {
  const navigation = useNavigation();

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="globe" size={20} color="#ffffff" />
            </View>
            <Text style={styles.logoText}>LingoToday</Text>
          </View>
        </View>

        {/* Terms Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Terms of Service</Text>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.sectionText}>
              By accessing and using LingoToday, you accept and agree to be bound by the terms and provision of this agreement. 
              If you do not agree to abide by the above, please do not use this service.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Description of Service</Text>
            <Text style={styles.sectionText}>
              LingoToday is a language learning platform that provides mobile-based micro-lessons and interactive content. 
              We reserve the right to modify or discontinue the service at any time without notice.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. User Accounts</Text>
            <Text style={styles.sectionText}>
              You are responsible for maintaining the confidentiality of your account and password. 
              You agree to accept responsibility for all activities that occur under your account.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4. Payment and Subscriptions</Text>
            <Text style={styles.sectionText}>
              Some features of LingoToday require payment. You agree to pay all fees and charges incurred through your account. 
              Subscription fees are billed in advance and are non-refundable except as required by law.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. User Content</Text>
            <Text style={styles.sectionText}>
              You retain ownership of any content you submit, post or display on LingoToday. 
              By submitting content, you grant us a worldwide, non-exclusive license to use, copy, reproduce, and distribute such content.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Privacy</Text>
            <Text style={styles.sectionText}>
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of LingoToday, 
              to understand our practices.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
            <Text style={styles.sectionText}>
              LingoToday shall not be liable for any indirect, incidental, special, consequential or punitive damages, 
              including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Changes to Terms</Text>
            <Text style={styles.sectionText}>
              We reserve the right to modify these terms at any time. We will notify users of significant changes to these terms. 
              Your continued use of LingoToday after such modifications constitutes acceptance of the updated terms.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9. Contact Information</Text>
            <Text style={styles.sectionText}>
              If you have any questions about these Terms of Service, please contact us at support@lingotoday.com
            </Text>
          </View>

          <View style={styles.lastUpdated}>
            <Text style={styles.lastUpdatedText}>Last updated: September 27, 2025</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    position: 'absolute',
    top: theme.spacing.lg,
    left: theme.spacing.lg,
    padding: theme.spacing.sm,
    zIndex: 1,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    width: 32,
    height: 32,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  logoText: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.foreground,
  },

  // Content
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: '700',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xl,
  },

  // Sections
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },
  sectionText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    lineHeight: 24,
  },

  // Last Updated
  lastUpdated: {
    paddingTop: theme.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    marginTop: theme.spacing.xl,
  },
  lastUpdatedText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    fontStyle: 'italic',
  },
});