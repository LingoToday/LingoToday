import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../lib/theme';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

const { width } = Dimensions.get('window');

// Type definitions - matching web exactly
interface Language {
  name: string;
  flag: string;
  colors: string[];
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface Testimonial {
  name: string;
  title: string;
  content: string;
  rating: number;
  initials: string;
  bgColor: string;
}

interface FAQ {
  question: string;
  answer: string;
}

export default function DesktopScreen() {
  const navigation = useNavigation();
  const [currency, setCurrency] = useState<'GBP' | 'USD'>('GBP');

  // Pricing data - matching web exactly
  const prices = {
    GBP: {
      monthly: '£2.49',
      yearly: '£14.99',
      savings: '£33'
    },
    USD: {
      monthly: '$6.99',
      yearly: '$20.99',
      savings: '$46'
    }
  };

  // Languages data - matching web exactly
  const languages: Language[] = [
    { name: 'French', flag: '🇫🇷', colors: ['#002654', '#FFFFFF', '#CE1126'] },
    { name: 'Spanish', flag: '🇪🇸', colors: ['#AA151B', '#F1BF00', '#AA151B'] },
    { name: 'German', flag: '🇩🇪', colors: ['#000000', '#DD0000', '#FFCE00'] },
    { name: 'Italian', flag: '🇮🇹', colors: ['#009246', '#FFFFFF', '#CE2B37'] },
  ];

  // Features data - matching web exactly
  const features: Feature[] = [
    {
      icon: 'brain',
      title: 'Spaced repetition',
      description: 'You learn better when content is repeated over time. We deliver lessons when your brain is most likely to retain them.'
    },
    {
      icon: 'zap',
      title: 'Microlearning',
      description: 'Short, focused lessons mean lower cognitive load and higher engagement. It fits into your day without demanding it.'
    },
    {
      icon: 'trending-up',
      title: 'The science backs it',
      description: 'Studies show people retain up to 80% more when they learn in small bursts with spaced reviews vs. one big session.'
    }
  ];

  // How it works steps - matching web exactly
  const steps = [
    {
      number: 1,
      title: 'Pick your language and goals',
      description: 'Choose from Italian, Spanish, German, French, and more to come soon'
    },
    {
      number: 2,
      title: 'Set notifications frequency for the day',
      description: 'Set your notifications for every 30 minutes, 1 hour, or custom. Each one is quick and focused — a phrase, rule, or word that actually matters'
    },
    {
      number: 3,
      title: 'Click the notifications to complete the micro lesson',
      description: 'See the full lesson, hear the translated audio, test your memory, and get cultural context'
    },
    {
      number: 4,
      title: 'Track your progress',
      description: 'See your progress and how far you have to reach your goals. Smart review system brings content back when it\'s at risk of being forgotten'
    }
  ];

  // Testimonials data - matching web exactly
  const testimonials: Testimonial[] = [
    {
      name: 'Sarah Martinez',
      title: 'Product Manager, San Francisco',
      content: 'The notifications are genius! I never remember to study on my own, but these little reminders fit perfectly into my workday. I\'ve learned more Italian in 3 months than I did in 2 years of trying other apps.',
      rating: 5,
      initials: 'SM',
      bgColor: '#dbeafe'
    },
    {
      name: 'James Kim',
      title: 'Teacher, Toronto',
      content: 'As a busy parent, finding time to learn French seemed impossible. LingoToday changed that completely. 30 seconds here and there, and I\'m actually having conversations with my French neighbors!',
      rating: 5,
      initials: 'JK',
      bgColor: '#dcfce7'
    },
    {
      name: 'Anna Liu',
      title: 'Software Engineer, Berlin',
      content: 'I tried Duolingo, Babbel, everything. But LingoToday\'s spaced repetition actually works. I remember words months later without trying. My German colleagues are impressed!',
      rating: 5,
      initials: 'AL',
      bgColor: '#f3e8ff'
    }
  ];

  // FAQ data - matching web exactly
  const faqs: FAQ[] = [
    {
      question: 'How do the notifications work?',
      answer: 'LingoToday sends you smart micro-lessons throughout your day via browser notifications. Each lesson takes 30-60 seconds and appears at optimal intervals using spaced repetition science. You can customize the frequency and timing to match your schedule.'
    },
    {
      question: 'What languages are available?',
      answer: 'Currently, we offer Italian, Spanish, French, and German with more languages coming soon. Each course is designed by native speakers and linguists to ensure authentic, practical learning.'
    },
    {
      question: 'Can I use LingoToday on mobile?',
      answer: 'Yes! LingoToday works on any device with a web browser. Our mobile app is coming soon and will sync seamlessly with your desktop progress, so you never miss a lesson.'
    },
    {
      question: 'What makes LingoToday different from other apps?',
      answer: 'Unlike traditional language apps that require dedicated study time, LingoToday integrates learning into your existing routine through intelligent notifications. Our spaced repetition system and micro-learning approach are scientifically proven to improve retention by up to 80%.'
    },
    {
      question: 'Is there really no credit card required for the free trial?',
      answer: 'Absolutely! Start your 7-day free trial with just an email address. No credit card, no hidden fees. If you love LingoToday, you can upgrade to a paid plan after your trial ends.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, you can cancel your subscription at any time from your account settings. There are no cancellation fees, and you\'ll retain access to your courses until the end of your billing period.'
    }
  ];

  // Future features data - matching web exactly
  const futureFeatures = [
    {
      icon: 'phone-portrait',
      title: 'Mobile App',
      subtitle: 'Continuous Learning Anywhere',
      description: 'Take LingoToday beyond your desk. Our mobile app keeps your learning streak alive so your progress never pauses.',
      image: require('../attached_assets/Group 77_1755208831106.png')
    },
    {
      icon: 'videocam',
      title: 'Real-World Immersion',
      subtitle: 'See It, Speak It, Live It',
      description: 'Learn phrases in context with immersive video scenarios. Watch real conversations from native speakers in everyday situations.',
      video: require('../attached_assets/Grok-Video-32DC88E3-42B1-46FE-BBEA-8BDFB1F94C59_1755601704305.mov')
    },
    {
      icon: 'mic',
      title: 'Speaking Practice',
      subtitle: 'Build Confidence Through Conversation',
      description: 'Practice pronunciation and conversation with AI-powered speech recognition. Get instant feedback on your accent and fluency.',
      image: require('../attached_assets/speaking-practice-image.png')
    }
  ];

  const handleSignIn = () => {
    navigation.navigate('Login' as never);
  };

  const handleTryFree = () => {
    navigation.navigate('Onboarding' as never);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Text key={index} style={styles.star}>
        {index < rating ? '★' : '☆'}
      </Text>
    ));
  };

  const renderLanguageFlag = (language: Language) => {
    return (
      <TouchableOpacity
        key={language.name}
        style={styles.languageItem}
        onPress={handleTryFree}
      >
        <View style={styles.languageFlag}>
          <Text style={styles.flagEmoji}>{language.flag}</Text>
        </View>
        <Text style={styles.languageName}>{language.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header - matching web exactly */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="globe" size={16} color="#ffffff" />
            </View>
            <Text style={styles.logoText}>LingoToday</Text>
          </View>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={handleSignIn} style={styles.signInButton}>
              <Text style={styles.signInButtonText}>Sign In</Text>
            </TouchableOpacity>
            <Button onPress={handleTryFree} style={styles.tryFreeButton}>
              <Text style={styles.tryFreeButtonText}>Try 3 Months Free</Text>
            </Button>
          </View>
        </View>

        {/* Hero Section - matching web exactly */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>
            The Most Effective Way to Learn a Language
          </Text>
          <Text style={styles.heroSubtitle}>
            Short micro lessons delivered by browser notifications to your laptop, 
            discreetly throughout your work day. Using learning methods backed by science.
          </Text>
          <Button onPress={handleTryFree} style={styles.heroButton}>
            <Text style={styles.heroButtonText}>Try 3 Months Free</Text>
          </Button>
        </View>

        {/* Language Selection - matching web exactly */}
        <View style={styles.languageSection}>
          <Text style={styles.sectionTitle}>I Want To Learn</Text>
          <View style={styles.languageGrid}>
            {languages.map(renderLanguageFlag)}
          </View>
        </View>

        {/* Why This Works Section - matching web exactly */}
        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Why This Works?</Text>
          <View style={styles.featuresList}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons 
                    name={feature.icon as any} 
                    size={24} 
                    color={
                      index === 0 ? '#3b82f6' : 
                      index === 1 ? '#10b981' : 
                      '#8b5cf6'
                    } 
                  />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* How It Works Section - matching web exactly */}
        <View style={styles.howItWorksSection}>
          <View style={styles.sectionBadge}>
            <Ionicons name="globe" size={16} color="#3b82f6" />
            <Text style={styles.sectionBadgeText}>How It Works</Text>
          </View>
          <Text style={styles.sectionTitle}>
            Simple Steps to{'\n'}
            <Text style={styles.primaryText}>Language Mastery</Text>
          </Text>
          
          <View style={styles.stepsGrid}>
            {steps.map((step) => (
              <Card key={step.number} style={styles.stepCard}>
                <CardContent style={styles.stepCardContent}>
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

        {/* Future Features Section - matching web exactly */}
        <View style={styles.futureSection}>
          <Text style={styles.sectionTitle}>The Future of Language Learning</Text>
          <View style={styles.futureGrid}>
            {futureFeatures.map((feature, index) => (
              <Card key={index} style={styles.futureCard}>
                <CardContent style={styles.futureCardContent}>
                  <View style={styles.futureHeader}>
                    <View style={[styles.futureIcon, { backgroundColor: 
                      index === 0 ? '#dbeafe' : 
                      index === 1 ? '#dcfce7' : 
                      '#f3e8ff' 
                    }]}>
                      <Ionicons 
                        name={feature.icon as any} 
                        size={24} 
                        color={
                          index === 0 ? '#3b82f6' : 
                          index === 1 ? '#10b981' : 
                          '#8b5cf6'
                        } 
                      />
                    </View>
                    <View style={styles.futureTitleContainer}>
                      <Text style={styles.futureTitle}>{feature.title}</Text>
                      <Text style={styles.futureSubtitle}>{feature.subtitle}</Text>
                    </View>
                  </View>
                  <Text style={styles.futureDescription}>{feature.description}</Text>
                  
                  {/* Placeholder for images/videos */}
                  <View style={styles.futurePlaceholder}>
                    <Ionicons 
                      name={feature.icon as any} 
                      size={48} 
                      color={theme.colors.mutedForeground} 
                    />
                    <Text style={styles.futurePlaceholderText}>
                      {feature.title} Preview
                    </Text>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        </View>

        {/* CTA Section - matching web exactly */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Unlock 3 months free as part of our launch offer!</Text>
          <Button onPress={handleTryFree} style={styles.ctaButton}>
            <Text style={styles.ctaButtonText}>Try 3 Months Free</Text>
          </Button>
        </View>

        {/* Testimonials Section - matching web exactly */}
        <View style={styles.testimonialsSection}>
          <Text style={styles.sectionTitle}>Loved by language learners worldwide</Text>
          <Text style={styles.sectionSubtitle}>See what our community says about their learning journey</Text>
          
          <View style={styles.testimonialsGrid}>
            {testimonials.map((testimonial, index) => (
              <Card key={index} style={styles.testimonialCard}>
                <CardContent style={styles.testimonialContent}>
                  <View style={styles.testimonialRating}>
                    {renderStars(testimonial.rating)}
                  </View>
                  <Text style={styles.testimonialText}>"{testimonial.content}"</Text>
                  <View style={styles.testimonialAuthor}>
                    <View style={[styles.testimonialAvatar, { backgroundColor: testimonial.bgColor }]}>
                      <Text style={styles.testimonialInitials}>{testimonial.initials}</Text>
                    </View>
                    <View style={styles.testimonialInfo}>
                      <Text style={styles.testimonialName}>{testimonial.name}</Text>
                      <Text style={styles.testimonialTitle}>{testimonial.title}</Text>
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        </View>

        {/* FAQ Section - matching web exactly */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <Text style={styles.sectionSubtitle}>Everything you need to know about LingoToday</Text>
          
          <View style={styles.faqList}>
            {faqs.map((faq, index) => (
              <Card key={index} style={styles.faqCard}>
                <CardContent style={styles.faqContent}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                </CardContent>
              </Card>
            ))}
          </View>
        </View>

        {/* Final CTA Section - matching web exactly */}
        <View style={styles.finalCtaSection}>
          <View style={styles.finalCtaCard}>
            <Text style={styles.finalCtaTitle}>
              Ready to Transform Your Language Learning?
            </Text>
            <Text style={styles.finalCtaSubtitle}>
              Join thousands who are already learning smarter, not harder. Start your journey today with a free trial.
            </Text>
            <Button onPress={handleTryFree} style={styles.finalCtaButton}>
              <Text style={styles.finalCtaButtonText}>Try 3 Months Free</Text>
            </Button>
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

  // Header - matching web exactly
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  logoIcon: {
    width: 32,
    height: 32,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.foreground,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  signInButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: theme.borderRadius.full,
  },
  signInButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: '#374151',
  },
  tryFreeButton: {
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  tryFreeButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: '#ffffff',
  },

  // Hero Section - matching web exactly
  heroSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl * 2,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: '700',
    color: theme.colors.foreground,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 42,
  },
  heroSubtitle: {
    fontSize: theme.fontSize.xl,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
    lineHeight: 26,
    paddingHorizontal: theme.spacing.md,
  },
  heroButton: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  heroButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Language Section - matching web exactly
  languageSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: '700',
    color: theme.colors.foreground,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: theme.spacing.xl,
  },
  languageItem: {
    alignItems: 'center',
    minWidth: 80,
  },
  languageFlag: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  flagEmoji: {
    fontSize: 32,
  },
  languageName: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.foreground,
  },

  // Features Section - matching web exactly
  featuresSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  featuresList: {
    gap: theme.spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.lg,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  featureDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    lineHeight: 20,
  },

  // How It Works Section - matching web exactly
  howItWorksSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: '#dbeafe',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.xl,
  },
  sectionBadgeText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: '#3b82f6',
  },
  primaryText: {
    color: theme.colors.primary,
  },
  stepsGrid: {
    gap: theme.spacing.lg,
    width: '100%',
  },
  stepCard: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepCardContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  stepNumber: {
    width: 40,
    height: 40,
    backgroundColor: '#dbeafe',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  stepNumberText: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  stepTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  stepDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Future Features Section - matching web exactly
  futureSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  futureGrid: {
    gap: theme.spacing.lg,
  },
  futureCard: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  futureCardContent: {
    gap: theme.spacing.lg,
  },
  futureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  futureIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  futureTitleContainer: {
    flex: 1,
  },
  futureTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  futureSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  futureDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    lineHeight: 20,
  },
  futurePlaceholder: {
    height: 200,
    backgroundColor: '#f9fafb',
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  futurePlaceholderText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },

  // CTA Section - matching web exactly
  ctaSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: '700',
    color: theme.colors.foreground,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  ctaButton: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
  },
  ctaButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Testimonials Section - matching web exactly
  testimonialsSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  sectionSubtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  testimonialsGrid: {
    gap: theme.spacing.lg,
  },
  testimonialCard: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testimonialContent: {
    gap: theme.spacing.lg,
  },
  testimonialRating: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  star: {
    fontSize: 16,
    color: '#fbbf24',
  },
  testimonialText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    lineHeight: 20,
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  testimonialAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testimonialInitials: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  testimonialInfo: {
    flex: 1,
  },
  testimonialName: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.foreground,
  },
  testimonialTitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },

  // FAQ Section - matching web exactly
  faqSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  faqList: {
    gap: theme.spacing.lg,
  },
  faqCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  faqContent: {
    gap: theme.spacing.sm,
  },
  faqQuestion: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  faqAnswer: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    lineHeight: 20,
  },

  // Final CTA Section - matching web exactly
  finalCtaSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },
  finalCtaCard: {
    backgroundColor: '#f8fafc',
    padding: theme.spacing.xl * 1.5,
    borderRadius: theme.borderRadius.xl * 2,
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  finalCtaTitle: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: '700',
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  finalCtaSubtitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 24,
  },
  finalCtaButton: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.full,
  },
  finalCtaButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: '#ffffff',
  },
});