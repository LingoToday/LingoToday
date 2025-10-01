import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { Footer } from '../components/ui/Footer';
import { theme } from '../lib/theme';

// Import assets exactly like the web version
const heroDevicesImage = require('../attached_assets/Group 85 (1)_1755545239041.png');
const desktopImage = require('../attached_assets/Group 97_1755526583226.png');
const mobileAppImage = require('../attached_assets/Group 77_1755208831106.png');
const immersionVideo = require('../attached_assets/Grok-Video-32DC88E3-42B1-46FE-BBEA-8BDFB1F94C59 copy_1755209004432.mov');

const { width: screenWidth } = Dimensions.get('window');

interface LandingScreenProps {
  navigation: any;
}

export default function LandingScreen({ navigation }: LandingScreenProps) {
  const [currency, setCurrency] = useState<'GBP' | 'USD'>('GBP');
  
  const prices = {
    GBP: {
      pro: {
        monthly: '£2.49',
        yearly: '£39.99'
      },
      plus: {
        monthly: '£16.99',
        yearly: '£149.99'
      }
    },
    USD: {
      pro: {
        monthly: '$6.99',
        yearly: '$59.99'
      },
      plus: {
        monthly: '$24.99',
        yearly: '$219.99'
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="globe" size={16} color="#ffffff" />
            </View>
            <Text style={styles.logoText}>LingoToday</Text>
          </View>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.signInButton}>
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Onboarding')} style={styles.useForFreeButton}>
              <Text style={styles.useForFreeButtonText}>Use For Free</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContainer}>
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>
                Micro language lessons on your laptop & phone - backed by science.
              </Text>
              
              <View style={styles.heroSubtitleContainer}>
                <Text style={styles.heroSubtitle}>
                  Text, audio, video, and two way AI character conversations using official CEFR course structures.
                </Text>
              </View>
              
              <View style={styles.heroButtonContainer}>
                <TouchableOpacity onPress={() => navigation.navigate('Onboarding')} style={styles.heroButton}>
                  <Text style={styles.heroButtonText}>Use For Free</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.heroImageContainer}>
              <Image
                source={heroDevicesImage}
                style={styles.heroImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        {/* Language Selection */}
        <View style={styles.languageSection}>
          <Text style={styles.languageSectionTitle}>I Want To Learn</Text>
          
          <View style={styles.languageGrid}>
            <TouchableOpacity style={styles.languageItem} onPress={() => navigation.navigate('Onboarding')}>
              <View style={styles.languageFlag}>
                <View style={[styles.flagSection, { backgroundColor: '#3B82F6', flex: 1 }]} />
                <View style={[styles.flagSection, { backgroundColor: '#FFFFFF', flex: 1 }]} />
                <View style={[styles.flagSection, { backgroundColor: '#EF4444', flex: 1 }]} />
              </View>
              <Text style={styles.languageName}>French</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.languageItem} onPress={() => navigation.navigate('Onboarding')}>
              <View style={[styles.languageFlag, styles.verticalFlag]}>
                <View style={[styles.flagSection, { backgroundColor: '#EF4444', flex: 1 }]} />
                <View style={[styles.flagSection, { backgroundColor: '#FDE047', flex: 1 }]} />
                <View style={[styles.flagSection, { backgroundColor: '#EF4444', flex: 1 }]} />
              </View>
              <Text style={styles.languageName}>Spanish</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.languageItem} onPress={() => navigation.navigate('Onboarding')}>
              <View style={[styles.languageFlag, styles.verticalFlag]}>
                <View style={[styles.flagSection, { backgroundColor: '#000000', flex: 1 }]} />
                <View style={[styles.flagSection, { backgroundColor: '#EF4444', flex: 1 }]} />
                <View style={[styles.flagSection, { backgroundColor: '#FDE047', flex: 1 }]} />
              </View>
              <Text style={styles.languageName}>German</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.languageItem} onPress={() => navigation.navigate('Onboarding')}>
              <View style={styles.languageFlag}>
                <View style={[styles.flagSection, { backgroundColor: '#16A34A', flex: 1 }]} />
                <View style={[styles.flagSection, { backgroundColor: '#FFFFFF', flex: 1 }]} />
                <View style={[styles.flagSection, { backgroundColor: '#EF4444', flex: 1 }]} />
              </View>
              <Text style={styles.languageName}>Italian</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Why This Works */}
        <View style={styles.whyWorksSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Why This Works?</Text>
          </View>

          <View style={styles.whyWorksContainer}>
            <View style={styles.featuresColumn}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="bulb-outline" size={24} color="#2563eb" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Spaced repetition</Text>
                  <Text style={styles.featureDescription}>
                    You learn better when content is repeated over time. We deliver lessons when your brain is most likely to retain them.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="flash-outline" size={24} color="#16a34a" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>Microlearning</Text>
                  <Text style={styles.featureDescription}>
                    Short, focused lessons mean lower cognitive load and higher engagement. It fits into your day without demanding it.
                  </Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: '#faf5ff' }]}>
                  <Ionicons name="trending-up-outline" size={24} color="#9333ea" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>The science backs it</Text>
                  <Text style={styles.featureDescription}>
                    Studies show people retain up to 80% more when they learn in small bursts with spaced reviews vs. one big session.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.desktopImageContainer}>
              <Image
                source={desktopImage}
                style={styles.desktopImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.howItWorksSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.badge}>
              <Ionicons name="globe" size={16} color="#2563EB" />
              <Text style={styles.badgeText}>How It Works</Text>
            </View>
            <Text style={styles.sectionTitle}>
              Simple Steps to{'\n'}
              <Text style={styles.sectionTitleAccent}>Language Mastery</Text>
            </Text>
          </View>

          <View style={styles.stepsGrid}>
            {[
              {
                number: 1,
                title: "Pick your language and goals",
                description: "Choose from Italian, Spanish, German, French, and more to come soon"
              },
              {
                number: 2,
                title: "Set notifications frequency for the day",
                description: "Set your notifications for every 30 minutes, 1 hour, or custom. Each one is quick and focused — a phrase, rule, or word that actually matters"
              },
              {
                number: 3,
                title: "Click the notifications to complete the micro lesson",
                description: "See the full lesson, hear the translated audio, test your memory, and get cultural context"
              },
              {
                number: 4,
                title: "Track your progress",
                description: "See your progress and how far you have to reach your goals. Smart review system brings content back when it's at risk of being forgotten"
              }
            ].map((step, index) => (
              <Card key={index} style={styles.stepCard}>
                <CardContent style={styles.stepContent}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{step.number}</Text>
                  </View>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </CardContent>
              </Card>
            ))}
          </View>
        </View>

        {/* Coming Soon Section */}
        <View style={styles.comingSoonSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>The Future of Language Learning</Text>
          </View>

          <View style={styles.comingSoonGrid}>
            <Card style={styles.comingSoonCard}>
              <CardContent style={styles.comingSoonContent}>
                <View style={styles.comingSoonHeader}>
                  <View style={[styles.comingSoonIcon, { backgroundColor: '#DBEAFE' }]}>
                    <Ionicons name="phone-portrait" size={24} color="#2563EB" />
                  </View>
                  <View>
                    <Text style={styles.comingSoonCardTitle}>Mobile App</Text>
                    <Text style={styles.comingSoonCardSubtitle}>Continuous Learning Anywhere</Text>
                  </View>
                </View>
                <Text style={styles.comingSoonDescription}>
                  Coming soon! Take LingoToday beyond your desk. Our mobile app keeps your learning streak alive so your progress never pauses.
                </Text>
                <View style={styles.comingSoonImageContainer}>
                  <Image
                    source={mobileAppImage}
                    style={styles.mobileImage}
                    resizeMode="contain"
                  />
                </View>
              </CardContent>
            </Card>

            <Card style={styles.comingSoonCard}>
              <CardContent style={styles.comingSoonContent}>
                <View style={styles.comingSoonHeader}>
                  <View style={[styles.comingSoonIcon, { backgroundColor: '#DCFCE7' }]}>
                    <Ionicons name="videocam" size={24} color="#16A34A" />
                  </View>
                  <View>
                    <Text style={styles.comingSoonCardTitle}>Real-World Immersion</Text>
                    <Text style={styles.comingSoonCardSubtitle}>Learn in the Moment</Text>
                  </View>
                </View>
                <Text style={styles.comingSoonDescription}>
                  Step into real-life situations with interactive "in-the-scene" video lessons. Practice language as if you were there — from ordering in a café to asking for directions in the Tuscan countryside.
                </Text>
                <View style={styles.videoContainer}>
                  <Video
                    source={immersionVideo}
                    style={styles.video}
                    shouldPlay
                    isLooping
                    isMuted
                    resizeMode={ResizeMode.COVER}
                    useNativeControls={false}
                  />
                </View>
              </CardContent>
            </Card>

            <Card style={styles.comingSoonCard}>
              <CardContent style={styles.comingSoonContent}>
                <View style={styles.comingSoonHeader}>
                  <View style={[styles.comingSoonIcon, { backgroundColor: '#FED7AA' }]}>
                    <Ionicons name="bulb" size={24} color="#EA580C" />
                  </View>
                  <View>
                    <Text style={styles.comingSoonCardTitle}>Micro Learning</Text>
                    <Text style={styles.comingSoonCardSubtitle}>Science-Backed Learning Method</Text>
                  </View>
                </View>
                <Text style={styles.comingSoonDescription}>
                  Research shows learning in small, frequent sessions improves retention by up to 80% compared to cramming. Our micro-lessons work with your brain's natural learning patterns.
                </Text>
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>80%</Text>
                    <Text style={styles.statLabel}>Better retention with micro-learning</Text>
                  </View>
                </View>
              </CardContent>
            </Card>
          </View>
        </View>

        {/* Pricing Section */}
        <View style={styles.pricingSection}>
          <View style={styles.sectionHeader}>
            <View style={[styles.badge, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="diamond" size={16} color="#16A34A" />
              <Text style={[styles.badgeText, { color: '#16A34A' }]}>Simple Pricing</Text>
            </View>
            <Text style={styles.sectionTitle}>Start Your Language Journey Today</Text>
            <Text style={styles.sectionSubtitle}>
              Choose the plan that fits your learning style. No hidden fees, cancel anytime.
            </Text>

            <View style={styles.currencyToggle}>
              <Text style={[styles.currencyText, currency === 'GBP' && styles.currencyActive]}>GBP</Text>
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setCurrency(currency === 'GBP' ? 'USD' : 'GBP')}
              >
                <View style={[styles.toggleSlider, currency === 'USD' && styles.toggleSliderActive]} />
              </TouchableOpacity>
              <Text style={[styles.currencyText, currency === 'USD' && styles.currencyActive]}>USD</Text>
            </View>
          </View>

          <View style={styles.pricingGrid}>
            {/* Free Plan */}
            <Card style={styles.pricingCard}>
              <CardContent style={styles.pricingContent}>
                <Text style={styles.planName}>Free</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>{currency === 'GBP' ? '£0' : '$0'}</Text>
                  <Text style={styles.pricePeriod}>/forever</Text>
                </View>
                
                <View style={styles.featuresList}>
                  {[
                    'Daily notifications & micro-lessons',
                    'Streaks, badges & progress charts',
                    '1 video & scenario based lesson per day',
                    'Referral unlocks',
                    '1 language'
                  ].map((feature, index) => (
                    <View key={index} style={styles.featureListItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.featureListText}>{feature}</Text>
                    </View>
                  ))}
                </View>
                
                <Button
                  title="Get Started Free"
                  variant="outline"
                  onPress={() => navigation.navigate('Onboarding')}
                  style={styles.planButton}
                  size="lg"
                />
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card style={{...styles.pricingCard, ...styles.popularCard}}>
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>Most Popular</Text>
              </View>
              <CardContent style={styles.pricingContent}>
                <Text style={styles.planName}>Pro</Text>
                <View style={styles.priceContainer}>
                  <View style={styles.priceRow}>
                    <Text style={styles.oldPrice}>{currency === 'GBP' ? '£4.99' : '$9.99'}</Text>
                    <Text style={styles.price}>{prices[currency].pro.monthly}</Text>
                  </View>
                  <Text style={styles.pricePeriod}>/month</Text>
                </View>
                
                <View style={styles.featuresList}>
                  {[
                    'Full access to all video & scenario based lessons',
                    'Early access to mobile app features',
                    'Custom lesson notifications'
                  ].map((feature, index) => (
                    <View key={index} style={styles.featureListItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.featureListText}>{feature}</Text>
                    </View>
                  ))}
                </View>
                
                <Button
                  title="Start Pro"
                  onPress={() => navigation.navigate('Onboarding')}
                  style={styles.planButton}
                  size="lg"
                />
              </CardContent>
            </Card>

            {/* Plus Plan */}
            <Card style={styles.pricingCard}>
              <CardContent style={styles.pricingContent}>
                <Text style={styles.planName}>Plus</Text>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>{prices[currency].plus.monthly}</Text>
                  <Text style={styles.pricePeriod}>/month</Text>
                </View>
                
                <View style={styles.featuresList}>
                  {[
                    'Everything in Pro, plus:',
                    'Full multi-language unlock (Italian, Spanish, French, German, etc)',
                    'Learn with a interactive AI character',
                    'Early access to new features',
                    'Choose your video learning character'
                  ].map((feature, index) => (
                    <View key={index} style={styles.featureListItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.featureListText}>{feature}</Text>
                    </View>
                  ))}
                </View>
                
                <Button
                  title="Go Plus"
                  onPress={() => navigation.navigate('Onboarding')}
                  style={{...styles.planButton, backgroundColor: '#1F2937'}}
                  textStyle={{ color: '#FFFFFF' }}
                  size="lg"
                />
              </CardContent>
            </Card>
          </View>

          <Text style={styles.pricingNote}>No credit card required • Cancel anytime</Text>
        </View>

        {/* Final CTA */}
        <View style={styles.finalCTASection}>
          <Text style={styles.finalCTATitle}>
            Smarter Language Learning,{'\n'}
            <Text style={styles.finalCTATitleAccent}>Finally on Desktop & Mobile</Text>
          </Text>
          <Text style={styles.finalCTADescription}>
            There are thousands of language apps. This isn't one of them. LingoToday is for people who want to learn while they work — not after. Just hit start and micro-learn your way to a new language.
          </Text>
          <Button
            title="🎯 Try it now. It takes less time than reading this page."
            onPress={() => navigation.navigate('Onboarding')}
            style={styles.finalCTAButton}
            size="lg"
          />
        </View>

        <Footer />
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
  },

  // Header
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signInButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInButtonText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '500',
  },
  useForFreeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  useForFreeButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },

  // Hero Section
  heroSection: {
    paddingHorizontal: 16,
    paddingVertical: 64,
    backgroundColor: '#FFFFFF',
  },
  heroContainer: {
    alignItems: 'center',
  },
  heroContent: {
    alignItems: 'center',
    marginBottom: 32, // Reduced from 48
    paddingHorizontal: 16,
  },
  heroTitle: {
    fontSize: 32, // Increased from 28
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  heroSubtitleContainer: {
    marginBottom: 32,
    maxWidth: 480, // Reduced from 600
    alignItems: 'center',
  },
  heroSubtitle: {
    fontSize: 18, // Reduced from 20
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 16,
  },
  heroButtonContainer: {
    alignItems: 'center',
  },
  heroButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 25,
    paddingHorizontal: 32,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  heroImageContainer: {
    alignItems: 'center',
    marginTop: 16, // Reduced from 48
    width: '100%',
  },
  heroImage: {
    width: screenWidth * 0.95, // Increased from 0.8 to fill more space
    maxWidth: 520,
    height: undefined,
    aspectRatio: 1.6, // Adjusted aspect ratio
  },

  // Language Selection
  languageSection: {
    paddingHorizontal: 16,
    paddingVertical: 64,
    alignItems: 'center',
  },
  languageSectionTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 48,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 32,
    paddingHorizontal: 16,
  },
  languageItem: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  languageFlag: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  verticalFlag: {
    flexDirection: 'column',
  },
  flagSection: {
    // Base style for flag sections
  },
  languageName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },

  // Why This Works
  whyWorksSection: {
    paddingHorizontal: 16,
    paddingVertical: 64,
  },
  whyWorksContainer: {
    // Grid layout: mobile single column, large screens side-by-side
  },
  featuresColumn: {
    gap: 32, // space-y-8 = 32px
    marginBottom: 48,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16, // gap-4 = 16px
  },
  featureIcon: {
    width: 48, // w-12 = 48px
    height: 48, // h-12 = 48px
    borderRadius: 12, // rounded-xl = 12px
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0, // flex-shrink-0
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600', // font-semibold
    color: '#111827', // text-gray-900
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14, // text-sm
    color: '#4b5563', // text-gray-600
    lineHeight: 20, // leading-relaxed
  },
  desktopImageContainer: {
    alignItems: 'center',
  },
  desktopImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 2, // Approximate aspect ratio matching web version
    maxWidth: Math.min(screenWidth * 0.9, 600),
    borderRadius: 8,
  },

  // Common section styles
  sectionHeader: {
    alignItems: 'center',
    marginBottom: 48,
  },
  sectionTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  sectionTitleAccent: {
    color: theme.colors.primary,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 600,
  },

  // How It Works
  howItWorksSection: {
    paddingHorizontal: 16,
    paddingVertical: 64,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 32,
    gap: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
  },
  stepsGrid: {
    gap: 24,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  stepContent: {
    padding: 24,
    alignItems: 'center',
  },
  stepNumber: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },

  // Coming Soon Section
  comingSoonSection: {
    paddingHorizontal: 16,
    paddingVertical: 64,
  },
  comingSoonGrid: {
    gap: 32,
  },
  comingSoonCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  comingSoonContent: {
    padding: 24,
  },
  comingSoonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  comingSoonIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  comingSoonCardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  comingSoonDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  comingSoonImageContainer: {
    alignItems: 'center',
  },
  mobileImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 9/16,
    maxWidth: 200,
    maxHeight: 350,
  },
  videoContainer: {
    alignItems: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    maxWidth: 200,
    alignSelf: 'center',
  },
  video: {
    width: 200,
    height: 356,
    borderRadius: 8,
  },
  statsContainer: {
    alignItems: 'center',
  },
  statItem: {
    backgroundColor: 'rgba(234, 88, 12, 0.1)',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    maxWidth: 200,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#EA580C',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Pricing Section
  pricingSection: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 64,
  },
  currencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 32,
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  currencyActive: {
    color: theme.colors.primary,
  },
  toggleButton: {
    width: 44,
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSlider: {
    width: 16,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  toggleSliderActive: {
    alignSelf: 'flex-end',
  },
  pricingGrid: {
    gap: 24,
    marginTop: 48,
  },
  pricingCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  popularCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 20,
    zIndex: 1,
  },
  popularBadgeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  pricingContent: {
    padding: 24,
    alignItems: 'center',
  },
  planName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 24,
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  oldPrice: {
    fontSize: 18,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 48,
    fontWeight: '700',
    color: '#111827',
  },
  pricePeriod: {
    fontSize: 14,
    color: '#6B7280',
  },
  featuresList: {
    alignSelf: 'stretch',
    marginBottom: 32,
    gap: 12,
  },
  featureListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureListText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  planButton: {
    alignSelf: 'stretch',
  },
  pricingNote: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 32,
  },

  // Final CTA
  finalCTASection: {
    paddingHorizontal: 16,
    paddingVertical: 48,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    margin: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  finalCTATitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 16,
  },
  finalCTATitleAccent: {
    color: theme.colors.primary,
  },
  finalCTADescription: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 32,
  },
  finalCTAButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 20,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
});