import React, { useState } from 'react';
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

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'How does LingoToday work?',
    answer: 'LingoToday uses adaptive learning algorithms to personalize your language learning experience. Our AI analyzes your progress and adjusts the difficulty and content to match your learning pace and style.',
    category: 'General',
  },
  {
    id: '2',
    question: 'What languages are available?',
    answer: 'We currently offer 15+ languages including Spanish, French, German, Italian, Portuguese, Japanese, Korean, Mandarin Chinese, Arabic, Russian, Dutch, Polish, Swedish, Norwegian, and more. We\'re constantly adding new languages.',
    category: 'General',
  },
  {
    id: '3',
    question: 'Can I learn multiple languages at once?',
    answer: 'Yes! You can learn multiple languages simultaneously. Our system keeps track of your progress in each language separately and provides personalized learning paths for each.',
    category: 'Learning',
  },
  {
    id: '4',
    question: 'How long does it take to become fluent?',
    answer: 'The time to fluency varies based on factors like your native language, learning pace, and daily practice time. On average, our users achieve conversational fluency in 3-6 months with consistent daily practice.',
    category: 'Learning',
  },
  {
    id: '5',
    question: 'Do I need an internet connection?',
    answer: 'While some features require an internet connection for real-time feedback and progress syncing, many lessons can be downloaded for offline use. Premium subscribers have access to more offline content.',
    category: 'Technical',
  },
  {
    id: '6',
    question: 'What\'s included in the free version?',
    answer: 'The free version includes access to basic lessons, vocabulary practice, and pronunciation exercises for one language. You can complete up to 5 lessons per day with limited features.',
    category: 'Pricing',
  },
  {
    id: '7',
    question: 'What additional features do I get with Premium?',
    answer: 'Premium subscribers get unlimited lessons, all languages, offline mode, advanced conversation practice, detailed progress analytics, personalized learning plans, and priority customer support.',
    category: 'Pricing',
  },
  {
    id: '8',
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time through your account settings or app store. You\'ll continue to have Premium access until the end of your current billing period.',
    category: 'Pricing',
  },
  {
    id: '9',
    question: 'Is my progress saved across devices?',
    answer: 'Yes, your progress is automatically synchronized across all your devices when you\'re signed in. You can seamlessly switch between your phone, tablet, and computer.',
    category: 'Technical',
  },
  {
    id: '10',
    question: 'How accurate is the pronunciation feedback?',
    answer: 'Our speech recognition technology is highly accurate, using advanced AI models trained on native speaker data. It provides detailed feedback on pronunciation, intonation, and rhythm.',
    category: 'Learning',
  },
  {
    id: '11',
    question: 'Do you offer courses for business or academic purposes?',
    answer: 'Yes, we offer specialized courses for business communication, academic writing, and professional contexts. These are available in our Premium subscription.',
    category: 'Learning',
  },
  {
    id: '12',
    question: 'How do I reset my password?',
    answer: 'You can reset your password by clicking "Forgot Password" on the login screen and following the instructions sent to your email. If you need further help, contact our support team.',
    category: 'Technical',
  },
];

const categories = ['All', 'General', 'Learning', 'Pricing', 'Technical'];

export default function FAQScreen() {
  const navigation = useNavigation();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const handleGoBack = () => {
    navigation.goBack();
  };

  const filteredFAQs = selectedCategory === 'All' 
    ? faqData 
    : faqData.filter(item => item.category === selectedCategory);

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
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

        {/* FAQ Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Frequently Asked Questions</Text>
          <Text style={styles.subtitle}>
            Find answers to common questions about LingoToday
          </Text>

          {/* Category Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryFilter}
            contentContainerStyle={styles.categoryFilterContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category && styles.categoryButtonTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* FAQ Items */}
          <View style={styles.faqList}>
            {filteredFAQs.map((item) => (
              <View key={item.id} style={styles.faqItem}>
                <TouchableOpacity
                  onPress={() => toggleExpanded(item.id)}
                  style={styles.faqQuestion}
                >
                  <Text style={styles.faqQuestionText}>{item.question}</Text>
                  <Ionicons
                    name={expandedItems.has(item.id) ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={theme.colors.mutedForeground}
                  />
                </TouchableOpacity>
                
                {expandedItems.has(item.id) && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{item.answer}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Contact Support */}
          <View style={styles.supportSection}>
            <Text style={styles.supportTitle}>Still have questions?</Text>
            <Text style={styles.supportText}>
              Can't find what you're looking for? Our support team is here to help.
            </Text>
            <TouchableOpacity 
              style={styles.supportButton}
              onPress={() => navigation.navigate('Contact' as never)}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="#ffffff" />
              <Text style={styles.supportButtonText}>Contact Support</Text>
            </TouchableOpacity>
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
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },

  // Category Filter
  categoryFilter: {
    marginBottom: theme.spacing.xl,
  },
  categoryFilterContent: {
    paddingHorizontal: theme.spacing.xs,
  },
  categoryButton: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: '#f3f4f6',
    marginRight: theme.spacing.sm,
  },
  categoryButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  categoryButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.mutedForeground,
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },

  // FAQ List
  faqList: {
    gap: theme.spacing.sm,
  },
  faqItem: {
    backgroundColor: '#ffffff',
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: theme.spacing.lg,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginRight: theme.spacing.sm,
  },
  faqAnswer: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  faqAnswerText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    lineHeight: 20,
    marginTop: theme.spacing.sm,
  },

  // Support Section
  supportSection: {
    backgroundColor: '#f8f9ff',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginTop: theme.spacing.xl,
    alignItems: 'center',
  },
  supportTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  supportText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  supportButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: theme.spacing.sm,
  },
});