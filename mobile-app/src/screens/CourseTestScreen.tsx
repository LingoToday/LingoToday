import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { theme } from '../lib/theme';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { apiClient } from '../lib/apiClient';

// Type definitions - matching web exactly
interface Language {
  id: number;
  code: string;
  name: string;
  createdAt: string;
}

interface Course {
  id: number;
  languageId: number;
  skillLevelId: number;
  courseNumber: number;
  title: string;
  description: string;
  isActive: boolean;
  language?: Language;
  lessons?: any[];
}

export default function CourseTestScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Test API endpoints - with proper queryFn matching web
  const { data: languages, isLoading: languagesLoading, error: languagesError, refetch: refetchLanguages } = useQuery<Language[]>({
    queryKey: ['/api/languages'],
    queryFn: async () => {
      const response = await apiClient.getLanguages();
      return (response as any).data || response;
    },
  });

  const { data: courses, isLoading: coursesLoading, error: coursesError, refetch: refetchCourses } = useQuery<Course[]>({
    queryKey: ['/api/db/courses'],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('withRelations', 'true');
      const response = await apiClient.getCoursesWithRelations(params.toString());
      return (response as any).data || response;
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchLanguages(), refetchCourses()]);
    setRefreshing(false);
  };

  if (languagesLoading || coursesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Course Database Test</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading course data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (languagesError || coursesError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Course Database Test</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.errorContainer}>
          <Card style={styles.errorCard}>
            <CardContent style={styles.errorContent}>
              <View style={styles.errorIcon}>
                <Ionicons name="warning" size={48} color="#ef4444" />
              </View>
              <Text style={styles.errorTitle}>Error Loading Data</Text>
              <Text style={styles.errorText}>
                {languagesError ? `Languages Error: ${(languagesError as any).message}` : ''}
                {coursesError ? `Courses Error: ${(coursesError as any).message}` : ''}
              </Text>
              <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </CardContent>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - matching web */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Course Database Test</Text>
          <Text style={styles.headerSubtitle}>Testing the database-driven course management system</Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Overview Stats - matching web exactly */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <CardHeader style={styles.statHeader}>
              <CardTitle style={styles.statTitle}>
                <Text style={styles.statTitleText}>Languages</Text>
                <Ionicons name="globe" size={16} color={theme.colors.mutedForeground} />
              </CardTitle>
            </CardHeader>
            <CardContent style={styles.statContent}>
              <Text style={styles.statValue}>{languages?.length || 0}</Text>
              <Text style={styles.statDescription}>Available in database</Text>
            </CardContent>
          </Card>

          <Card style={styles.statCard}>
            <CardHeader style={styles.statHeader}>
              <CardTitle style={styles.statTitle}>
                <Text style={styles.statTitleText}>Courses</Text>
                <Ionicons name="book" size={16} color={theme.colors.mutedForeground} />
              </CardTitle>
            </CardHeader>
            <CardContent style={styles.statContent}>
              <Text style={styles.statValue}>{courses?.length || 0}</Text>
              <Text style={styles.statDescription}>Imported from JSON</Text>
            </CardContent>
          </Card>

          <Card style={styles.statCard}>
            <CardHeader style={styles.statHeader}>
              <CardTitle style={styles.statTitle}>
                <Text style={styles.statTitleText}>Total Lessons</Text>
                <Ionicons name="people" size={16} color={theme.colors.mutedForeground} />
              </CardTitle>
            </CardHeader>
            <CardContent style={styles.statContent}>
              <Text style={styles.statValue}>
                {courses?.reduce((total, course) => total + (course.lessons?.length || 0), 0) || 0}
              </Text>
              <Text style={styles.statDescription}>Across all courses</Text>
            </CardContent>
          </Card>
        </View>

        {/* Available Languages Section - matching web */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Languages</Text>
          <View style={styles.languagesGrid}>
            {languages?.map((language) => (
              <Card key={language.id} style={styles.languageCard}>
                <CardHeader>
                  <CardTitle style={styles.languageTitle}>
                    <Text style={styles.languageName}>{language.name}</Text>
                  </CardTitle>
                  <Text style={styles.languageCode}>Code: {language.code}</Text>
                </CardHeader>
                <CardContent>
                  <View style={styles.languageDetails}>
                    <Badge style={styles.languageBadge}>
                      <Text style={styles.languageBadgeText}>
                        {courses?.filter(c => c.language?.code === language.code).length || 0} courses
                      </Text>
                    </Badge>
                    <Text style={styles.languageId}>ID: {language.id}</Text>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        </View>

        {/* Imported Courses Section - matching web */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Imported Courses</Text>
          <View style={styles.coursesGrid}>
            {courses?.map((course) => (
              <Card key={course.id} style={styles.courseCard}>
                <CardHeader>
                  <View style={styles.courseHeader}>
                    <View style={styles.courseInfo}>
                      <Text style={styles.courseNumber}>Course {course.courseNumber}</Text>
                      <Text style={styles.courseTitle}>{course.title}</Text>
                      <Text style={styles.courseDescription}>{course.description}</Text>
                    </View>
                    <Badge variant={course.isActive ? "default" : "secondary"}>
                      <Text style={styles.courseBadgeText}>
                        {course.isActive ? "Active" : "Inactive"}
                      </Text>
                    </Badge>
                  </View>
                </CardHeader>
                
                <CardContent>
                  <View style={styles.courseDetails}>
                    <View style={styles.courseDetailRow}>
                      <Ionicons name="globe" size={16} color={theme.colors.mutedForeground} />
                      <Text style={styles.courseDetailText}>{course.language?.name || 'Unknown'}</Text>
                      <Text style={styles.courseDetailSeparator}>•</Text>
                      <Text style={styles.courseDetailText}>Lang ID: {course.languageId}</Text>
                    </View>
                    
                    <View style={styles.courseDetailRow}>
                      <Ionicons name="book" size={16} color={theme.colors.mutedForeground} />
                      <Text style={styles.courseDetailText}>{course.lessons?.length || 0} lessons</Text>
                      <Text style={styles.courseDetailSeparator}>•</Text>
                      <Text style={styles.courseDetailText}>DB ID: {course.id}</Text>
                    </View>
                    
                    <Text style={styles.skillLevelText}>
                      Skill Level ID: {course.skillLevelId}
                    </Text>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        </View>

        {/* API Response Debug Section - matching web */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>API Response Debug</Text>
          <Card style={styles.debugCard}>
            <CardHeader>
              <CardTitle>
                <Text style={styles.debugTitle}>Raw Data</Text>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.debugContent}>
                <View style={styles.debugSection}>
                  <Text style={styles.debugSectionTitle}>Languages Response:</Text>
                  <ScrollView horizontal style={styles.debugCodeContainer}>
                    <Text style={styles.debugCode}>
                      {JSON.stringify(languages, null, 2)}
                    </Text>
                  </ScrollView>
                </View>
                
                <View style={styles.debugSection}>
                  <Text style={styles.debugSectionTitle}>Courses Response (first course):</Text>
                  <ScrollView horizontal style={styles.debugCodeContainer}>
                    <Text style={styles.debugCode}>
                      {JSON.stringify(courses?.[0], null, 2)}
                    </Text>
                  </ScrollView>
                </View>
              </View>
            </CardContent>
          </Card>
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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: '700',
    color: theme.colors.foreground,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },

  // Content
  content: {
    flex: 1,
    padding: theme.spacing.lg,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.mutedForeground,
  },

  // Error
  errorContainer: {
    flex: 1,
    padding: theme.spacing.lg,
  },
  errorCard: {
    borderColor: '#fee2e2',
  },
  errorContent: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  errorIcon: {
    marginBottom: theme.spacing.sm,
  },
  errorTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '600',
    color: '#dc2626',
  },
  errorText: {
    fontSize: theme.fontSize.base,
    color: '#dc2626',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.md,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: theme.fontSize.base,
    fontWeight: '600',
  },

  // Stats Grid - matching web exactly
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  statHeader: {
    paddingBottom: theme.spacing.xs,
  },
  statTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statTitleText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.foreground,
  },
  statContent: {
    gap: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: '700',
    color: theme.colors.foreground,
  },
  statDescription: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },

  // Sections
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },

  // Languages Grid - matching web
  languagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  languageCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
  },
  languageTitle: {
    marginBottom: theme.spacing.xs,
  },
  languageName: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  languageCode: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  languageDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageBadge: {
    backgroundColor: '#e5e7eb',
  },
  languageBadgeText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  languageId: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },

  // Courses Grid - matching web
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  courseCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  courseInfo: {
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  courseNumber: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  courseTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginTop: theme.spacing.xs,
  },
  courseDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
  },
  courseBadgeText: {
    fontSize: theme.fontSize.xs,
  },
  courseDetails: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  courseDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  courseDetailText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  courseDetailSeparator: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  skillLevelText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },

  // Debug Section - matching web
  debugCard: {
    backgroundColor: '#ffffff',
  },
  debugTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  debugContent: {
    gap: theme.spacing.lg,
  },
  debugSection: {
    gap: theme.spacing.sm,
  },
  debugSectionTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: '500',
    color: theme.colors.foreground,
  },
  debugCodeContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    maxHeight: 200,
  },
  debugCode: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});