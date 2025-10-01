import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { theme } from '../lib/theme';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

interface Course {
  id: number;
  languageId: number;
  skillLevelId: number;
  courseNumber: number;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  language: {
    id: number;
    code: string;
    name: string;
  };
  skillLevel: {
    id: number;
    code: string;
    name: string;
    description?: string;
    sortOrder: number;
  };
  lessons: Array<{
    id: number;
    courseId: number;
    lessonNumber: number;
    title: string;
    isActive: boolean;
  }>;
}

interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalLessons: number;
  activeUsers: number;
}

export default function AdminScreen() {
  const navigation = useNavigation();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'courses' | 'users' | 'analytics'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Mock data - replace with actual API calls
  const { data: adminStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<AdminStats> => {
      // Mock data - replace with actual API call
      return {
        totalUsers: 1247,
        totalCourses: 24,
        totalLessons: 185,
        activeUsers: 856,
      };
    },
  });

  const { data: courses, isLoading: coursesLoading, refetch: refetchCourses } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async (): Promise<Course[]> => {
      // Mock data - replace with actual API call
      return [
        {
          id: 1,
          languageId: 1,
          skillLevelId: 1,
          courseNumber: 1,
          title: 'French Greetings',
          description: 'Learn basic French greetings and introductions',
          isActive: true,
          createdAt: '2025-01-01',
          updatedAt: '2025-01-15',
          language: { id: 1, code: 'fr', name: 'French' },
          skillLevel: { id: 1, code: 'beginner', name: 'Beginner', sortOrder: 1 },
          lessons: [
            { id: 1, courseId: 1, lessonNumber: 1, title: 'Hello and Goodbye', isActive: true },
            { id: 2, courseId: 1, lessonNumber: 2, title: 'How are you?', isActive: true },
          ],
        },
        {
          id: 2,
          languageId: 2,
          skillLevelId: 1,
          courseNumber: 1,
          title: 'Spanish Basics',
          description: 'Essential Spanish phrases for beginners',
          isActive: true,
          createdAt: '2025-01-02',
          updatedAt: '2025-01-16',
          language: { id: 2, code: 'es', name: 'Spanish' },
          skillLevel: { id: 1, code: 'beginner', name: 'Beginner', sortOrder: 1 },
          lessons: [
            { id: 3, courseId: 2, lessonNumber: 1, title: 'Hola y Adiós', isActive: true },
          ],
        },
      ];
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchCourses()]);
    setRefreshing(false);
  };

  const renderOverview = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Dashboard Overview</Text>
      
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <CardContent style={styles.statCardContent}>
            <View style={styles.statIcon}>
              <Ionicons name="people" size={24} color="#3b82f6" />
            </View>
            <Text style={styles.statValue}>{adminStats?.totalUsers?.toLocaleString() || '0'}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </CardContent>
        </Card>

        <Card style={styles.statCard}>
          <CardContent style={styles.statCardContent}>
            <View style={styles.statIcon}>
              <Ionicons name="book" size={24} color="#10b981" />
            </View>
            <Text style={styles.statValue}>{adminStats?.totalCourses || '0'}</Text>
            <Text style={styles.statLabel}>Total Courses</Text>
          </CardContent>
        </Card>

        <Card style={styles.statCard}>
          <CardContent style={styles.statCardContent}>
            <View style={styles.statIcon}>
              <Ionicons name="library" size={24} color="#f59e0b" />
            </View>
            <Text style={styles.statValue}>{adminStats?.totalLessons || '0'}</Text>
            <Text style={styles.statLabel}>Total Lessons</Text>
          </CardContent>
        </Card>

        <Card style={styles.statCard}>
          <CardContent style={styles.statCardContent}>
            <View style={styles.statIcon}>
              <Ionicons name="pulse" size={24} color="#ef4444" />
            </View>
            <Text style={styles.statValue}>{adminStats?.activeUsers?.toLocaleString() || '0'}</Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </CardContent>
        </Card>
      </View>

      <Card style={styles.recentActivityCard}>
        <CardContent style={styles.cardContent}>
          <Text style={styles.cardTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="person-add" size={16} color="#10b981" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>New user registration</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="book-outline" size={16} color="#3b82f6" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Course completed: French Basics</Text>
                <Text style={styles.activityTime}>4 hours ago</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="trending-up" size={16} color="#f59e0b" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>Daily active users: +15%</Text>
                <Text style={styles.activityTime}>1 day ago</Text>
              </View>
            </View>
          </View>
        </CardContent>
      </Card>
    </View>
  );

  const renderCourses = () => (
    <View style={styles.tabContent}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Course Management</Text>
        <Button style={styles.addButton}>
          <Ionicons name="add" size={16} color="#ffffff" />
          <Text style={styles.addButtonText}>Add Course</Text>
        </Button>
      </View>
      
      <View style={styles.coursesList}>
        {courses?.map((course) => (
          <Card key={course.id} style={styles.courseCard}>
            <CardContent style={styles.courseCardContent}>
              <View style={styles.courseHeader}>
                <View style={styles.courseInfo}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <Text style={styles.courseLanguage}>{course.language.name} • {course.skillLevel.name}</Text>
                </View>
                <Badge variant={course.isActive ? 'default' : 'secondary'} style={styles.courseBadge}>
                  <Text style={styles.courseBadgeText}>
                    {course.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </Badge>
              </View>
              
              {course.description && (
                <Text style={styles.courseDescription}>{course.description}</Text>
              )}
              
              <View style={styles.courseStats}>
                <Text style={styles.courseStatsText}>
                  {course.lessons.length} lessons
                </Text>
                <Text style={styles.courseStatsText}>
                  Course #{course.courseNumber}
                </Text>
              </View>
              
              <View style={styles.courseActions}>
                <TouchableOpacity style={styles.courseAction}>
                  <Ionicons name="eye" size={16} color={theme.colors.primary} />
                  <Text style={styles.courseActionText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.courseAction}>
                  <Ionicons name="create" size={16} color={theme.colors.primary} />
                  <Text style={styles.courseActionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.courseAction}>
                  <Ionicons name="analytics" size={16} color={theme.colors.primary} />
                  <Text style={styles.courseActionText}>Analytics</Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>
        ))}
      </View>
    </View>
  );

  const renderUsers = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>User Management</Text>
      <Text style={styles.comingSoon}>User management features coming soon...</Text>
    </View>
  );

  const renderAnalytics = () => (
    <View style={styles.tabContent}>
      <Text style={styles.tabTitle}>Analytics Dashboard</Text>
      <Text style={styles.comingSoon}>Advanced analytics coming soon...</Text>
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverview();
      case 'courses':
        return renderCourses();
      case 'users':
        return renderUsers();
      case 'analytics':
        return renderAnalytics();
      default:
        return renderOverview();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Ionicons name="shield-checkmark" size={20} color="#ffffff" />
          </View>
          <Text style={styles.logoText}>Admin Panel</Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
          {[
            { key: 'overview', label: 'Overview', icon: 'home' },
            { key: 'courses', label: 'Courses', icon: 'book' },
            { key: 'users', label: 'Users', icon: 'people' },
            { key: 'analytics', label: 'Analytics', icon: 'analytics' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, selectedTab === tab.key && styles.tabButtonActive]}
              onPress={() => setSelectedTab(tab.key as any)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={16} 
                color={selectedTab === tab.key ? theme.colors.primary : theme.colors.mutedForeground} 
              />
              <Text style={[styles.tabButtonText, selectedTab === tab.key && styles.tabButtonTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderTabContent()}
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 32,
    height: 32,
    backgroundColor: '#ef4444',
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
  headerRight: {
    width: 40,
  },

  // Tab Navigation
  tabNavigation: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabScrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginRight: theme.spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabButtonText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.mutedForeground,
    marginLeft: theme.spacing.sm,
  },
  tabButtonTextActive: {
    color: theme.colors.primary,
  },

  // Content
  content: {
    flex: 1,
  },
  tabContent: {
    padding: theme.spacing.lg,
  },
  tabTitle: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: '700',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.lg,
  },
  tabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    marginLeft: theme.spacing.xs,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
  },
  statCardContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  statValue: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: '700',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },

  // Recent Activity
  recentActivityCard: {
    backgroundColor: '#ffffff',
  },
  cardContent: {
    paddingVertical: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.md,
  },
  activityList: {
    gap: theme.spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },

  // Courses
  coursesList: {
    gap: theme.spacing.md,
  },
  courseCard: {
    backgroundColor: '#ffffff',
  },
  courseCardContent: {
    paddingVertical: theme.spacing.lg,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  courseLanguage: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  courseBadge: {
    marginLeft: theme.spacing.sm,
  },
  courseBadgeText: {
    fontSize: theme.fontSize.xs,
  },
  courseDescription: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  courseStats: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  courseStatsText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  courseActions: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  courseAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  courseActionText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
    fontWeight: '500',
  },

  // Coming Soon
  comingSoon: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    marginTop: theme.spacing.xl,
    fontStyle: 'italic',
  },
});