import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../lib/theme';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Footer } from '../components/ui/Footer';

const { width: screenWidth } = Dimensions.get('window');

interface Language {
  id: string;
  name: string;
  flag: string;
  description: string;
  available: boolean;
  courses: {
    beginner: {
      title: string;
      description: string;
      duration: string;
      lessons: number;
      level: string;
      outline: string[];
    };
  };
}

const languages: Language[] = [
  {
    id: "italian",
    name: "Italian",
    flag: "🇮🇹",
    description: "Learn the beautiful language of Italy with our comprehensive beginner course.",
    available: true,
    courses: {
      beginner: {
        title: "Italian for Beginners",
        description: "Perfect for complete beginners. Learn essential vocabulary, basic grammar, and everyday conversations.",
        duration: "8 weeks",
        lessons: 282,
        level: "Beginner",
        outline: [
          "Basic greetings and introductions",
          "Essential vocabulary (numbers, colors, family)",
          "Present tense verbs and common expressions",
          "Food and dining vocabulary",
          "Travel and transportation phrases",
          "Past and future tense basics"
        ]
      }
    }
  },
  {
    id: "spanish",
    name: "Spanish",
    flag: "🇪🇸",
    description: "Master Spanish, one of the world's most spoken languages.",
    available: true,
    courses: {
      beginner: {
        title: "Spanish for Beginners",
        description: "Start your Spanish journey with essential vocabulary, pronunciation, and basic conversations through structured micro-lessons.",
        duration: "9 weeks",
        lessons: 197,
        level: "Beginner",
        outline: [
          "Greetings and farewells (¡Hola!, Buenos días, Adiós)",
          "Introducing yourself (Me llamo, Soy de...)",
          "Essential courtesy phrases (Por favor, Gracias, Lo siento)",
          "Numbers from 0 to 100",
          "Days, months, and dates",
          "Family and people vocabulary",
          "Colors and descriptive adjectives",
          "Food and drink vocabulary",
          "Restaurant phrases and ordering"
        ]
      }
    }
  },
  {
    id: "german",
    name: "German",
    flag: "🇩🇪",
    description: "Discover the logical structure of German with our beginner-friendly approach.",
    available: true,
    courses: {
      beginner: {
        title: "German for Beginners",
        description: "Learn German fundamentals including der, die, das, basic grammar, and essential vocabulary.",
        duration: "12 weeks",
        lessons: 110,
        level: "Beginner",
        outline: [
          "German pronunciation and sounds",
          "Articles (der, die, das) and noun gender",
          "Basic sentence structure and word order",
          "Present tense regular verbs",
          "Personal pronouns and basic cases",
          "Numbers, time, and calendar",
          "Family, professions, and hobbies",
          "Modal verbs (können, müssen, wollen)"
        ]
      }
    }
  },
  {
    id: "french",
    name: "French",
    flag: "🇫🇷",
    description: "Learn the language of love and culture with our structured French course.",
    available: true,
    courses: {
      beginner: {
        title: "French for Beginners",
        description: "Master essential French through practical micro-lessons covering everyday vocabulary, proper pronunciation, and basic conversation skills.",
        duration: "9 weeks",
        lessons: 0,
        level: "Beginner",
        outline: [
          "Greetings and farewells (Salut, Bonjour, Au revoir)",
          "Introducing yourself (Je m'appelle, Je viens de...)",
          "Essential courtesy phrases (S'il vous plaît, Merci, Pardon)",
          "Numbers from 0 to 100 and asking age",
          "Days, months, telling time, and dates",
          "Family members and relationships",
          "Colors and descriptive adjectives",
          "Weather expressions and conditions",
          "Food, drinks, and dining vocabulary"
        ]
      }
    }
  }
];

export default function CoursesScreen() {
  const navigation = useNavigation();
  const { user, isAuthenticated } = useAuth();
  const [expandedOutlines, setExpandedOutlines] = useState<Set<string>>(new Set());

  const toggleOutline = (languageId: string) => {
    const newExpanded = new Set(expandedOutlines);
    if (newExpanded.has(languageId)) {
      newExpanded.delete(languageId);
    } else {
      newExpanded.add(languageId);
    }
    setExpandedOutlines(newExpanded);
  };

  const handleStartLearning = (languageId: string) => {
    if (!isAuthenticated) {
      navigation.navigate('Login' as never);
      return;
    }
    // Navigate to specific language courses - would be implemented
    navigation.navigate('Dashboard' as never);
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const totalCourses = languages.length;
  const totalLessons = languages.reduce((sum, lang) => sum + lang.courses.beginner.lessons, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {/* Back Button */}
            {navigation.canGoBack() && (
              <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
              </TouchableOpacity>
            )}
            
            <View style={styles.logoContainer}>
              <View style={styles.logoIcon}>
                <Ionicons name="globe" size={20} color="#ffffff" />
              </View>
              <Text style={styles.logoText}>LingoToday</Text>
            </View>

            {/* Auth buttons */}
            {!isAuthenticated && (
              <View style={styles.headerButtons}>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Login' as never)} 
                  style={styles.signInButton}
                >
                  <Text style={styles.signInButtonText}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Onboarding' as never)} 
                  style={styles.freeTrialButton}
                >
                  <Text style={styles.freeTrialButtonText}>Free Trial</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Authenticated user info */}
            {isAuthenticated && user && (
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.firstName || 'User'}</Text>
                <TouchableOpacity 
                  onPress={() => {/* Logout logic */}} 
                  style={styles.logoutButton}
                >
                  <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Page Header - matching web exactly */}
          <View style={styles.pageHeader}>
            <View style={styles.titleContainer}>
              <Ionicons name="globe" size={32} color={theme.colors.primary} style={styles.titleIcon} />
              <Text style={styles.pageTitle}>Language Courses</Text>
            </View>
            <Text style={styles.pageDescription}>
              Choose from our selection of language courses designed for busy professionals. 
              Start with our beginner courses and build a strong foundation.
            </Text>
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                {totalCourses} courses • {totalLessons} lessons available
              </Text>
            </View>
          </View>

          {/* Languages Grid - matching web layout */}
          <View style={styles.languagesGrid}>
            {languages.map((language) => (
              <Card key={language.id} style={styles.languageCard}>
                <CardHeader>
                  <View style={styles.languageHeader}>
                    <View style={styles.languageInfo}>
                      <Text style={styles.languageFlag}>{language.flag}</Text>
                      <View style={styles.languageDetails}>
                        <CardTitle style={styles.languageTitle}>
                          {language.name}
                        </CardTitle>
                        <Text style={styles.languageDescription}>
                          {language.description}
                        </Text>
                      </View>
                    </View>
                    {language.available && (
                      <Badge style={styles.availableBadge}>
                        <Text style={styles.availableBadgeText}>Available</Text>
                      </Badge>
                    )}
                  </View>
                </CardHeader>

                <CardContent>
                  {/* Beginner Course Info */}
                  <View style={styles.courseSection}>
                    <View style={styles.courseHeader}>
                      <View style={styles.courseTitleContainer}>
                        <Ionicons name="book-outline" size={20} color={theme.colors.primary} />
                        <Text style={styles.courseTitle}>
                          {language.courses.beginner.title}
                        </Text>
                        <Badge variant="outline" style={styles.levelBadge}>
                          <Text style={styles.levelBadgeText}>{language.courses.beginner.level}</Text>
                        </Badge>
                      </View>
                    </View>

                    <Text style={styles.courseDescription}>
                      {language.courses.beginner.description}
                    </Text>

                    {/* Course Stats */}
                    <View style={styles.courseStats}>
                      <View style={styles.statItem}>
                        <Ionicons name="time-outline" size={16} color={theme.colors.mutedForeground} />
                        <Text style={styles.statText}>{language.courses.beginner.duration}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="book-outline" size={16} color={theme.colors.mutedForeground} />
                        <Text style={styles.statText}>{language.courses.beginner.lessons} lessons</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Ionicons name="people-outline" size={16} color={theme.colors.mutedForeground} />
                        <Text style={styles.statText}>Beginner level</Text>
                      </View>
                    </View>

                    {/* Course Outline - Collapsible */}
                    <View style={styles.outlineSection}>
                      <TouchableOpacity 
                        style={styles.outlineToggle}
                        onPress={() => toggleOutline(language.id)}
                      >
                        <View style={styles.outlineHeader}>
                          <Ionicons name="trophy-outline" size={16} color={theme.colors.foreground} />
                          <Text style={styles.outlineTitle}>Course Outline</Text>
                        </View>
                        <Ionicons 
                          name={expandedOutlines.has(language.id) ? "chevron-up" : "chevron-down"} 
                          size={20} 
                          color={theme.colors.mutedForeground} 
                        />
                      </TouchableOpacity>

                      {expandedOutlines.has(language.id) && (
                        <View style={styles.outlineContent}>
                          {language.courses.beginner.outline.map((topic, index) => (
                            <View key={index} style={styles.outlineItem}>
                              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                              <Text style={styles.outlineItemText}>{topic}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>

                    {/* Action Button */}
                    <Button
                      onPress={() => handleStartLearning(language.id)}
                      style={[styles.actionButton, !language.available && styles.disabledButton]}
                      disabled={!language.available}
                    >
                      <Text style={[styles.actionButtonText, !language.available && styles.disabledButtonText]}>
                        {language.available ? `Start Learning ${language.name}` : 'Coming Soon'}
                      </Text>
                    </Button>
                  </View>

                  {/* Other Levels */}
                  <View style={styles.otherLevels}>
                    <Text style={styles.otherLevelsTitle}>Other Levels</Text>
                    <View style={styles.otherLevelsBadges}>
                      <Badge variant="secondary" style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonBadgeText}>Intermediate - Coming Soon</Text>
                      </Badge>
                      <Badge variant="secondary" style={styles.comingSoonBadge}>
                        <Text style={styles.comingSoonBadgeText}>Advanced - Coming Soon</Text>
                      </Badge>
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>

          {/* Features Section - matching web exactly */}
          <View style={styles.featuresSection}>
            <Text style={styles.featuresTitle}>Why Choose Our Language Courses?</Text>
            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                  <Ionicons name="time-outline" size={32} color={theme.colors.primary} />
                </View>
                <Text style={styles.featureTitle}>Micro-Learning</Text>
                <Text style={styles.featureDescription}>
                  Short, focused lessons that fit into your busy schedule. Learn effectively in just 10-15 minutes a day.
                </Text>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                  <Ionicons name="star-outline" size={32} color={theme.colors.primary} />
                </View>
                <Text style={styles.featureTitle}>Personalized Learning</Text>
                <Text style={styles.featureDescription}>
                  Adaptive courses that adjust to your pace and learning style for optimal progress.
                </Text>
              </View>

              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                  <Ionicons name="trophy-outline" size={32} color={theme.colors.primary} />
                </View>
                <Text style={styles.featureTitle}>Professional Focus</Text>
                <Text style={styles.featureDescription}>
                  Designed for working professionals with practical vocabulary and real-world scenarios.
                </Text>
              </View>
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
    flexGrow: 1,
  },

  // Updated Header - Fixed positioning and logo
  header: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingTop: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 24, // Proper status bar spacing
    paddingBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    minHeight: 56,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginRight: 170, // Ensure space for potential right buttons
  },
  logoIcon: {
    width: 32,
    height: 32,
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    minWidth: 100, // Prevent text wrapping
    textAlign: 'left',
  },

  // For CoursesScreen specifically - Auth buttons
  headerButtons: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signInButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minWidth: 65,
    alignItems: 'center',
  },
  signInButtonText: {
    color: '#374151',
    fontSize: 13,
    fontWeight: '500',
  },
  freeTrialButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minWidth: 75,
    alignItems: 'center',
  },
  freeTrialButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  userInfo: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userName: {
    fontSize: 14,
    color: '#6B7280',
    maxWidth: 80,
  },
  logoutButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logoutButtonText: {
    color: '#6B7280',
    fontSize: 13,
  },

  // Content
  content: {
    paddingHorizontal: 16,
    paddingVertical: 48,
  },

  // Page Header
  pageHeader: {
    alignItems: 'center',
    marginBottom: 48,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleIcon: {
    marginRight: 12,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  pageDescription: {
    fontSize: 20,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: 600,
    marginBottom: 16,
  },
  statsContainer: {
    marginTop: 16,
  },
  statsText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
  },

  // Languages Grid
  languagesGrid: {
    gap: 32,
    marginBottom: 48,
  },
  languageCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  languageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  languageFlag: {
    fontSize: 24,
  },
  languageDetails: {
    flex: 1,
  },
  languageTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  languageDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  availableBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  availableBadgeText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '500',
  },

  // Course Section
  courseSection: {
    marginBottom: 24,
  },
  courseHeader: {
    marginBottom: 16,
  },
  courseTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  levelBadge: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  levelBadgeText: {
    color: '#6B7280',
    fontSize: 12,
  },
  courseDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },

  // Course Stats
  courseStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Outline Section
  outlineSection: {
    marginBottom: 16,
  },
  outlineToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  outlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  outlineTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  outlineContent: {
    paddingTop: 16,
    gap: 8,
  },
  outlineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  outlineItemText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    flex: 1,
  },

  // Buttons
  actionButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  disabledButtonText: {
    color: '#FFFFFF',
  },

  // Other Levels
  otherLevels: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  otherLevelsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  otherLevelsBadges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  comingSoonBadge: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  comingSoonBadgeText: {
    color: '#6B7280',
    fontSize: 12,
  },

  // Features Section
  featuresSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  featuresTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 32,
    textAlign: 'center',
  },
  featuresGrid: {
    gap: 32,
    width: '100%',
  },
  featureItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  featureIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});