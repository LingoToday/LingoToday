import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function MissionScreen() {
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
        {/* Header - Enhanced for mobile */}
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

        {/* Mission Content - Mobile optimized */}
        <View style={styles.content}>
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.iconContainer}>
              <Ionicons name="rocket" size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>Our Mission</Text>
            <Text style={styles.subtitle}>
              Making language learning accessible for busy professionals
            </Text>
          </View>

          {/* Content Cards */}
          <View style={styles.contentCards}>
            {/* Card 1 - Problem */}
            <View style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="time" size={20} color="#EF4444" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>The Challenge</Text>
                <Text style={styles.cardText}>
                  At LingoToday, our mission is simple: help busy people learn a new language without turning their lives upside down.
                </Text>
              </View>
            </View>

            {/* Card 2 - Understanding */}
            <View style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="people" size={20} color="#F59E0B" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>We Understand You</Text>
                <Text style={styles.cardText}>
                  We know that for many, phone apps and long study sessions just don't fit into the day. You're at your desk, focused on work — but you still want to grow, learn, and achieve your language goals.
                </Text>
              </View>
            </View>

            {/* Card 3 - Solution */}
            <View style={styles.card}>
              <View style={styles.cardIcon}>
                <Ionicons name="bulb" size={20} color="#10B981" />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>Our Solution</Text>
                <Text style={styles.cardText}>
                  That's why we bring the lessons to you. In short, engaging bursts that pop up on your computer, LingoToday lets you learn without losing momentum in your day. We're here to make language learning possible for everyone — no matter how packed your schedule.
                </Text>
              </View>
            </View>
          </View>

          {/* Mission Statement */}
          <View style={styles.missionStatement}>
            <View style={styles.quoteContainer}>
              <Ionicons name="chatbubble" size={24} color={theme.colors.primary} style={styles.quoteIcon} />
              <Text style={styles.quoteText}>
                "Making language learning possible for everyone — no matter how packed your schedule."
              </Text>
            </View>
          </View>

          {/* Key Points */}
          <View style={styles.keyPoints}>
            <Text style={styles.sectionTitle}>Why LingoToday?</Text>
            <View style={styles.pointsList}>
              <View style={styles.point}>
                <View style={styles.pointBullet}>
                  <Ionicons name="checkmark" size={16} color="#ffffff" />
                </View>
                <Text style={styles.pointText}>
                  <Text style={styles.pointHighlight}>Short bursts:</Text> Quick 2-3 minute lessons that fit into your workflow
                </Text>
              </View>
              
              <View style={styles.point}>
                <View style={styles.pointBullet}>
                  <Ionicons name="checkmark" size={16} color="#ffffff" />
                </View>
                <Text style={styles.pointText}>
                  <Text style={styles.pointHighlight}>No disruption:</Text> Learn while you work, without losing focus
                </Text>
              </View>
              
              <View style={styles.point}>
                <View style={styles.pointBullet}>
                  <Ionicons name="checkmark" size={16} color="#ffffff" />
                </View>
                <Text style={styles.pointText}>
                  <Text style={styles.pointHighlight}>Real progress:</Text> Consistent daily practice that builds real skills
                </Text>
              </View>
              
              <View style={styles.point}>
                <View style={styles.pointBullet}>
                  <Ionicons name="checkmark" size={16} color="#ffffff" />
                </View>
                <Text style={styles.pointText}>
                  <Text style={styles.pointHighlight}>For busy professionals:</Text> Designed specifically for working adults
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
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    flexGrow: 1,
  },

  // Header - Enhanced for mobile
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginRight: 52, // Account for back button space
  },
  logoIcon: {
    width: 32,
    height: 32,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '700',
    color: '#111827',
  },

  // Content - Mobile optimized
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: isTablet ? 48 : 32,
    gap: isTablet ? 48 : 32,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    textAlign: 'center',
    gap: 16,
    paddingVertical: isTablet ? 32 : 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#EFF6FF',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: isTablet ? 36 : 28,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    lineHeight: isTablet ? 44 : 36,
  },
  subtitle: {
    fontSize: isTablet ? 20 : 18,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: isTablet ? 28 : 26,
    maxWidth: isTablet ? 600 : '100%',
  },

  // Content Cards
  contentCards: {
    gap: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: isTablet ? 24 : 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  cardContent: {
    flex: 1,
    gap: 8,
  },
  cardTitle: {
    fontSize: isTablet ? 18 : 16,
    fontWeight: '600',
    color: '#111827',
    lineHeight: isTablet ? 26 : 24,
  },
  cardText: {
    fontSize: isTablet ? 16 : 15,
    color: '#6B7280',
    lineHeight: isTablet ? 26 : 24,
  },

  // Mission Statement
  missionStatement: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: isTablet ? 32 : 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  quoteContainer: {
    alignItems: 'center',
    gap: 16,
  },
  quoteIcon: {
    opacity: 0.6,
  },
  quoteText: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: isTablet ? 30 : 28,
  },

  // Key Points
  keyPoints: {
    gap: 20,
  },
  sectionTitle: {
    fontSize: isTablet ? 24 : 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  pointsList: {
    gap: 16,
  },
  point: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#ffffff',
    padding: isTablet ? 20 : 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pointBullet: {
    width: 24,
    height: 24,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  pointText: {
    flex: 1,
    fontSize: isTablet ? 16 : 15,
    color: '#6B7280',
    lineHeight: isTablet ? 24 : 22,
  },
  pointHighlight: {
    fontWeight: '600',
    color: '#374151',
  },
});