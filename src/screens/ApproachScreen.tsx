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
import { Footer } from '../components/ui/Footer';

export default function ApproachScreen() {
  const navigation = useNavigation();

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Landing' as never);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header - matching web exactly */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="globe" size={16} color="#ffffff" />
            </View>
            <Text style={styles.logoText}>LingoToday</Text>
          </View>
        </View>

        {/* Approach Content - matching web exactly */}
        <View style={styles.content}>
          <View style={styles.prose}>
            <Text style={styles.title}>Approach</Text>
            
            <View style={styles.textContent}>
              <Text style={styles.paragraph}>
                We believe small, regular steps add up to big results.
              </Text>
              
              <Text style={styles.paragraph}>
                Our approach is built on proven learning science, combining micro-learning with spaced repetition and retrieval practice. Instead of cramming or setting aside big blocks of time, you get a series of quick 1–2 minute lessons spaced throughout your workday.
              </Text>
              
              <Text style={styles.paragraph}>This means:</Text>
              
              <View style={styles.bulletSection}>
                <View style={styles.bulletPoint}>
                  <Text style={styles.bulletTitle}>Minimum disruption</Text>
                  <Text style={styles.bulletText}> – You can keep your workflow intact while still progressing.</Text>
                </View>
                
                <View style={styles.bulletPoint}>
                  <Text style={styles.bulletTitle}>Better retention</Text>
                  <Text style={styles.bulletText}> – Revisiting concepts at spaced intervals locks them into long-term memory.</Text>
                </View>
                
                <View style={styles.bulletPoint}>
                  <Text style={styles.bulletTitle}>Lower effort, higher consistency</Text>
                  <Text style={styles.bulletText}> – Because each lesson is so short, it's easier to stick with it.</Text>
                </View>
                
                <View style={styles.bulletPoint}>
                  <Text style={styles.bulletTitle}>Real skills, built daily</Text>
                  <Text style={styles.bulletText}> – Small doses of focused practice compound over time into real conversational ability.</Text>
                </View>
              </View>
              
              <Text style={styles.paragraph}>
                LingoToday turns your desk into your classroom — without the overwhelm, without the guilt, and without the need to find "extra time."
              </Text>
            </View>
          </View>
        </View>

        <Footer />
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

  // Header - Matching TermsScreen exactly
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
  prose: {
    maxWidth: '100%',
  },
  title: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: '700',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xl,
  },
  textContent: {
    gap: theme.spacing.lg,
  },
  paragraph: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.lg,
    lineHeight: 28,
    marginBottom: theme.spacing.lg,
  },

  // Bullet Points - matching web ml-4 structure
  bulletSection: {
    marginLeft: 16,
    gap: 16,
    marginBottom: theme.spacing.lg,
  },
  bulletPoint: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  bulletTitle: {
    fontWeight: '700',
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.lg,
    lineHeight: 28,
  },
  bulletText: {
    color: theme.colors.mutedForeground,
    fontSize: theme.fontSize.lg,
    lineHeight: 28,
    flex: 1,
  },
});