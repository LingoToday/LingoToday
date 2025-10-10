import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

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
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Header - Matching web exactly with sticky behavior */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleGoBack} style={styles.logoLink}>
              <View style={styles.logoContainer}>
                <View style={styles.logoIcon}>
                  <Ionicons name="globe" size={16} color="#ffffff" />
                </View>
                <Text style={styles.logoText}>LingoToday</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Content - Matching web structure exactly */}
        <View style={styles.main}>
          <View style={styles.prose}>
            <Text style={styles.title}>Approach</Text>
            
            <View style={styles.contentSpace}>
              <View style={styles.textContent}>
                <Text style={styles.paragraph}>
                  We believe small, regular steps add up to big results.
                </Text>
                
                <Text style={styles.paragraph}>
                  Our approach is built on proven learning science, combining micro-learning with spaced repetition and retrieval practice. Instead of cramming or setting aside big blocks of time, you get a series of quick 1–2 minute lessons spaced throughout your workday.
                </Text>
                
                <Text style={styles.paragraph}>This means:</Text>
                
                <View style={styles.bulletSection}>
                  <View style={styles.bulletItem}>
                    <Text style={styles.bulletContent}>
                      <Text style={styles.bulletTitle}>Minimum disruption</Text>
                      <Text style={styles.bulletText}> – You can keep your workflow intact while still progressing.</Text>
                    </Text>
                  </View>
                  
                  <View style={styles.bulletItem}>
                    <Text style={styles.bulletContent}>
                      <Text style={styles.bulletTitle}>Better retention</Text>
                      <Text style={styles.bulletText}> – Revisiting concepts at spaced intervals locks them into long-term memory.</Text>
                    </Text>
                  </View>
                  
                  <View style={styles.bulletItem}>
                    <Text style={styles.bulletContent}>
                      <Text style={styles.bulletTitle}>Lower effort, higher consistency</Text>
                      <Text style={styles.bulletText}> – Because each lesson is so short, it's easier to stick with it.</Text>
                    </Text>
                  </View>
                  
                  <View style={styles.bulletItem}>
                    <Text style={styles.bulletContent}>
                      <Text style={styles.bulletTitle}>Real skills, built daily</Text>
                      <Text style={styles.bulletText}> – Small doses of focused practice compound over time into real conversational ability.</Text>
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.paragraph}>
                  LingoToday turns your desk into your classroom — without the overwhelm, without the guilt, and without the need to find "extra time."
                </Text>
              </View>
            </View>
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
    flexGrow: 1,
  },

  // Header - Matching web sticky header with backdrop blur effect
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    marginTop: 20,
    // Simulate sticky behavior with elevation
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerContent: {
    maxWidth: isTablet ? 1280 : width,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: isTablet ? 32 : 16,
    paddingVertical: 0,
  },
  logoLink: {
    alignSelf: 'flex-start',
    paddingVertical: 16,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    width: 32,
    height: 32,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '700',
    color: '#111827', // text-gray-900
  },

  // Main Content - Matching web max-w-4xl structure
  main: {
    maxWidth: isTablet ? 896 : width, // max-w-4xl = 896px
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: isTablet ? 32 : 16,
    paddingVertical: 64, // py-16
  },
  prose: {
    maxWidth: '100%',
  },
  title: {
    fontSize: isTablet ? 36 : 30, // text-3xl md:text-4xl
    fontWeight: '700',
    color: '#111827', // text-gray-900
    marginBottom: 32, // mb-8
  },
  
  // Content spacing - Matching web space-y-8
  contentSpace: {
    gap: 32,
  },
  textContent: {
    color: '#6B7280', // text-gray-600
    lineHeight: 28, // leading-relaxed
    fontSize: 18, // text-lg
    gap: 24, // space-y-6
  },
  paragraph: {
    color: '#6B7280',
    fontSize: 18,
    lineHeight: 28,
    marginBottom: 24,
  },

  // Bullet Section - Matching web space-y-4 ml-4
  bulletSection: {
    marginLeft: 16, // ml-4
    gap: 16, // space-y-4
    marginBottom: 24,
  },
  bulletItem: {
    // Each bullet item container
  },
  bulletContent: {
    fontSize: 18,
    lineHeight: 28,
  },
  bulletTitle: {
    fontWeight: '700', // font-bold
    color: '#6B7280',
  },
  bulletText: {
    color: '#6B7280',
    fontWeight: '400',
  },
});