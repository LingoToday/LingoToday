import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { theme } from '../lib/theme';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { apiClient } from '../lib/apiClient';

// Type definitions - matching web exactly
interface Language {
  id: number;
  code: string;
  name: string;
  createdAt: string;
}

interface SkillLevel {
  id: number;
  code: string;
  name: string;
  description: string;
  sortOrder: number;
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
  createdAt: string;
  updatedAt: string;
}

interface CourseWithRelations extends Course {
  language: Language;
  skillLevel: SkillLevel;
  lessons: LessonWithSteps[];
}

interface Lesson {
  id: number;
  courseId: number;
  lessonNumber: number;
  title: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LessonStep {
  id: number;
  lessonId: number;
  stepNumber: number;
  stepType: string;
  content: any;
  createdAt: string;
  updatedAt: string;
}

interface LessonWithSteps extends Lesson {
  steps: LessonStep[];
}

export default function CourseManagerScreen() {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'courses' | 'languages'>('overview');
  const [selectedLanguage, setSelectedLanguage] = useState<number | null>(null);
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<number | null>(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newCourseData, setNewCourseData] = useState({
    title: '',
    description: '',
    languageId: '',
    skillLevelId: '',
  });

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Fetch languages - with proper queryFn
  const { data: languages, isLoading: languagesLoading, refetch: refetchLanguages } = useQuery<Language[]>({
    queryKey: ['/api/languages'],
    queryFn: async () => {
      const response = await apiClient.getLanguages();
      return (response as any).data || response;
    },
  });

  // Fetch skill levels - with proper queryFn
  const { data: skillLevels, isLoading: skillLevelsLoading, refetch: refetchSkillLevels } = useQuery<SkillLevel[]>({
    queryKey: ['/api/skill-levels'],
    queryFn: async () => {
      const response = await apiClient.getSkillLevels();
      return (response as any).data || response;
    },
  });

  // Fetch courses with relations - with proper queryFn
  const { data: courses, isLoading: coursesLoading, refetch: refetchCourses } = useQuery<CourseWithRelations[]>({
    queryKey: ['/api/db/courses', { languageId: selectedLanguage, skillLevelId: selectedSkillLevel, withRelations: true }],
    queryFn: async ({ queryKey }) => {
      const params = new URLSearchParams();
      const options = queryKey[1] as any;
      if (options.languageId) params.append('languageId', options.languageId.toString());
      if (options.skillLevelId) params.append('skillLevelId', options.skillLevelId.toString());
      if (options.withRelations) params.append('withRelations', 'true');
      
      const response = await apiClient.getCoursesWithRelations(params.toString());
      return (response as any).data || response;
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      const response = await apiClient.createCourse(courseData);
      return (response as any).data || response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/db/courses'] });
      setIsCreateModalVisible(false);
      setNewCourseData({ title: '', description: '', languageId: '', skillLevelId: '' });
      Alert.alert('Success', 'Course created successfully!');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.message || 'Failed to create course. Please try again.');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchCourses(), refetchLanguages(), refetchSkillLevels()]);
    setRefreshing(false);
  };

  const handleLanguageSelect = (languageId: number) => {
    setSelectedLanguage(languageId === selectedLanguage ? null : languageId);
  };

  const handleSkillLevelSelect = (skillLevelId: number) => {
    setSelectedSkillLevel(skillLevelId === selectedSkillLevel ? null : skillLevelId);
  };

  const handleCreateCourse = () => {
    if (!newCourseData.title || !newCourseData.languageId || !newCourseData.skillLevelId) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    createCourseMutation.mutate({
      ...newCourseData,
      languageId: parseInt(newCourseData.languageId),
      skillLevelId: parseInt(newCourseData.skillLevelId),
      isActive: true,
    });
  };

  const filteredCourses = courses?.filter(course => {
    if (selectedLanguage && course.languageId !== selectedLanguage) return false;
    if (selectedSkillLevel && course.skillLevelId !== selectedSkillLevel) return false;
    return true;
  }) || [];

  if (languagesLoading || skillLevelsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading course manager...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderOverview = () => (
    <View style={styles.tabContent}>
      {/* Overview Stats - matching web exactly */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <CardHeader style={styles.statHeader}>
            <CardTitle style={styles.statTitle}>
              <Text style={styles.statTitleText}>Total Languages</Text>
              <Ionicons name="globe" size={16} color={theme.colors.mutedForeground} />
            </CardTitle>
          </CardHeader>
          <CardContent style={styles.statContent}>
            <Text style={styles.statValue}>{languages?.length || 0}</Text>
            <Text style={styles.statDescription}>Available languages</Text>
          </CardContent>
        </Card>

        <Card style={styles.statCard}>
          <CardHeader style={styles.statHeader}>
            <CardTitle style={styles.statTitle}>
              <Text style={styles.statTitleText}>Total Courses</Text>
              <Ionicons name="book" size={16} color={theme.colors.mutedForeground} />
            </CardTitle>
          </CardHeader>
          <CardContent style={styles.statContent}>
            <Text style={styles.statValue}>{courses?.length || 0}</Text>
            <Text style={styles.statDescription}>Across all languages</Text>
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
            <Text style={styles.statDescription}>All lessons combined</Text>
          </CardContent>
        </Card>

        <Card style={styles.statCard}>
          <CardHeader style={styles.statHeader}>
            <CardTitle style={styles.statTitle}>
              <Text style={styles.statTitleText}>Skill Levels</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.mutedForeground} />
            </CardTitle>
          </CardHeader>
          <CardContent style={styles.statContent}>
            <Text style={styles.statValue}>{skillLevels?.length || 0}</Text>
            <Text style={styles.statDescription}>Available levels</Text>
          </CardContent>
        </Card>
      </View>

      {/* Languages and Skill Levels Grid - matching web */}
      <View style={styles.gridSection}>
        <Card style={styles.sectionCard}>
          <CardHeader>
            <CardTitle style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>Languages</Text>
            </CardTitle>
            <Text style={styles.sectionDescription}>Available languages in the system</Text>
          </CardHeader>
          <CardContent>
            <View style={styles.itemsList}>
              {languages?.map((language) => (
                <TouchableOpacity
                  key={language.id}
                  style={[
                    styles.itemRow,
                    selectedLanguage === language.id && styles.itemRowSelected
                  ]}
                  onPress={() => handleLanguageSelect(language.id)}
                >
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{language.name}</Text>
                    <Text style={styles.itemSubtitle}>Code: {language.code}</Text>
                  </View>
                  <Badge style={styles.itemBadge}>
                    <Text style={styles.itemBadgeText}>
                      {courses?.filter(c => c.languageId === language.id).length || 0} courses
                    </Text>
                  </Badge>
                </TouchableOpacity>
              ))}
            </View>
          </CardContent>
        </Card>

        <Card style={styles.sectionCard}>
          <CardHeader>
            <CardTitle style={styles.sectionTitle}>
              <Text style={styles.sectionTitleText}>Skill Levels</Text>
            </CardTitle>
            <Text style={styles.sectionDescription}>Available difficulty levels</Text>
          </CardHeader>
          <CardContent>
            <View style={styles.itemsList}>
              {skillLevels?.map((level) => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.itemRow,
                    selectedSkillLevel === level.id && styles.itemRowSelected
                  ]}
                  onPress={() => handleSkillLevelSelect(level.id)}
                >
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemTitle}>{level.name}</Text>
                    <Text style={styles.itemSubtitle}>{level.description}</Text>
                  </View>
                  <Badge style={styles.itemBadge}>
                    <Text style={styles.itemBadgeText}>
                      {courses?.filter(c => c.skillLevelId === level.id).length || 0} courses
                    </Text>
                  </Badge>
                </TouchableOpacity>
              ))}
            </View>
          </CardContent>
        </Card>
      </View>
    </View>
  );

  const renderCourses = () => (
    <View style={styles.tabContent}>
      {/* Filter Section - matching web */}
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersLabel}>Filter:</Text>
        <View style={styles.filtersRow}>
          {selectedLanguage && (
            <TouchableOpacity
              style={styles.filterBadge}
              onPress={() => setSelectedLanguage(null)}
            >
              <Text style={styles.filterBadgeText}>
                {languages?.find(l => l.id === selectedLanguage)?.name}
              </Text>
              <Ionicons name="close" size={14} color={theme.colors.mutedForeground} />
            </TouchableOpacity>
          )}
          {selectedSkillLevel && (
            <TouchableOpacity
              style={styles.filterBadge}
              onPress={() => setSelectedSkillLevel(null)}
            >
              <Text style={styles.filterBadgeText}>
                {skillLevels?.find(l => l.id === selectedSkillLevel)?.name}
              </Text>
              <Ionicons name="close" size={14} color={theme.colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Courses List */}
      {coursesLoading ? (
        <View style={styles.loadingSection}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : filteredCourses.length > 0 ? (
        <View style={styles.coursesList}>
          {filteredCourses.map((course) => (
            <Card key={course.id} style={styles.courseCard}>
              <CardHeader>
                <View style={styles.courseHeader}>
                  <View style={styles.courseInfo}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    <Text style={styles.courseDescription}>{course.description}</Text>
                  </View>
                  <Badge variant={course.isActive ? 'default' : 'secondary'}>
                    <Text style={styles.courseBadgeText}>
                      {course.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </Badge>
                </View>
              </CardHeader>
              
              <CardContent>
                <View style={styles.courseDetails}>
                  <View style={styles.courseDetailRow}>
                    <Ionicons name="globe" size={16} color={theme.colors.mutedForeground} />
                    <Text style={styles.courseDetailText}>{course.language.name}</Text>
                    <Badge style={styles.courseDetailBadge}>
                      <Text style={styles.courseDetailBadgeText}>{course.skillLevel.name}</Text>
                    </Badge>
                  </View>
                  
                  <View style={styles.courseDetailRow}>
                    <Ionicons name="book" size={16} color={theme.colors.mutedForeground} />
                    <Text style={styles.courseDetailText}>Course {course.courseNumber}</Text>
                    <Text style={styles.courseDetailSeparator}>•</Text>
                    <Text style={styles.courseDetailText}>{course.lessons?.length || 0} lessons</Text>
                  </View>
                  
                  <Text style={styles.courseStepsCount}>
                    Total steps: {course.lessons?.reduce((total, lesson) => total + (lesson.steps?.length || 0), 0) || 0}
                  </Text>
                </View>
                
                <Button style={styles.manageCourseButton}>
                  <Text style={styles.manageCourseButtonText}>Manage Course</Text>
                </Button>
              </CardContent>
            </Card>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="book" size={48} color={theme.colors.mutedForeground} />
          <Text style={styles.emptyStateTitle}>No courses found</Text>
          <Text style={styles.emptyStateDescription}>
            {selectedLanguage || selectedSkillLevel 
              ? "Try adjusting your filters or create a new course."
              : "Get started by creating your first course."
            }
          </Text>
          <Button 
            style={styles.emptyStateButton}
            onPress={() => setIsCreateModalVisible(true)}
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text style={styles.emptyStateButtonText}>Create Course</Text>
          </Button>
        </View>
      )}
    </View>
  );

  const renderLanguages = () => (
    <View style={styles.tabContent}>
      <View style={styles.languagesList}>
        {languages?.map((language) => (
          <Card key={language.id} style={styles.languageCard}>
            <CardHeader>
              <View style={styles.languageHeader}>
                <View style={styles.languageInfo}>
                  <Text style={styles.languageTitle}>{language.name}</Text>
                  <Text style={styles.languageCode}>Language code: {language.code}</Text>
                </View>
                <View style={styles.languageActions}>
                  <Badge style={styles.languageCourseBadge}>
                    <Text style={styles.languageCourseCount}>
                      {courses?.filter(c => c.languageId === language.id).length || 0} courses
                    </Text>
                  </Badge>
                  <Button style={styles.manageLanguageButton}>
                    <Text style={styles.manageLanguageButtonText}>Manage</Text>
                  </Button>
                </View>
              </View>
            </CardHeader>
            <CardContent>
              <Text style={styles.languageCreatedText}>
                Created: {new Date(language.createdAt).toLocaleDateString()}
              </Text>
            </CardContent>
          </Card>
        ))}
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverview();
      case 'courses':
        return renderCourses();
      case 'languages':
        return renderLanguages();
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
        
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>Course Manager</Text>
          <Text style={styles.headerSubtitle}>Manage language courses, lessons, and content from your database</Text>
        </View>
        
        <Button 
          style={styles.headerButton}
          onPress={() => setIsCreateModalVisible(true)}
        >
          <Ionicons name="add" size={16} color="#ffffff" />
          <Text style={styles.headerButtonText}>Add Course</Text>
        </Button>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContent}>
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'courses', label: 'Courses' },
            { key: 'languages', label: 'Languages' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, selectedTab === tab.key && styles.tabButtonActive]}
              onPress={() => setSelectedTab(tab.key as any)}
            >
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

      {/* Create Course Modal */}
      <Modal
        visible={isCreateModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsCreateModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              onPress={() => setIsCreateModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create New Course</Text>
            <TouchableOpacity 
              onPress={handleCreateCourse}
              style={styles.modalSaveButton}
              disabled={createCourseMutation.isPending}
            >
              <Text style={styles.modalSaveText}>Create</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Course Title *</Text>
              <TextInput
                style={styles.formInput}
                value={newCourseData.title}
                onChangeText={(text) => setNewCourseData(prev => ({ ...prev, title: text }))}
                placeholder="Enter course title"
                placeholderTextColor={theme.colors.mutedForeground}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={newCourseData.description}
                onChangeText={(text) => setNewCourseData(prev => ({ ...prev, description: text }))}
                placeholder="Enter course description"
                placeholderTextColor={theme.colors.mutedForeground}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Language *</Text>
              <View style={styles.selectContainer}>
                {languages?.map((language) => (
                  <TouchableOpacity
                    key={language.id}
                    style={[
                      styles.selectOption,
                      newCourseData.languageId === language.id.toString() && styles.selectOptionActive
                    ]}
                    onPress={() => setNewCourseData(prev => ({ ...prev, languageId: language.id.toString() }))}
                  >
                    <Text style={[
                      styles.selectOptionText,
                      newCourseData.languageId === language.id.toString() && styles.selectOptionTextActive
                    ]}>
                      {language.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Skill Level *</Text>
              <View style={styles.selectContainer}>
                {skillLevels?.map((level) => (
                  <TouchableOpacity
                    key={level.id}
                    style={[
                      styles.selectOption,
                      newCourseData.skillLevelId === level.id.toString() && styles.selectOptionActive
                    ]}
                    onPress={() => setNewCourseData(prev => ({ ...prev, skillLevelId: level.id.toString() }))}
                  >
                    <Text style={[
                      styles.selectOptionText,
                      newCourseData.skillLevelId === level.id.toString() && styles.selectOptionTextActive
                    ]}>
                      {level.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  loadingText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
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
  headerTitle: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  headerTitleText: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: '700',
    color: theme.colors.foreground,
  },
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  headerButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    marginLeft: theme.spacing.xs,
  },

  // Tab Navigation - matching web
  tabNavigation: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabScrollContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  tabButton: {
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
    gap: theme.spacing.lg,
  },

  // Overview Stats - matching web grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
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

  // Grid Section
  gridSection: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  sectionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    marginBottom: theme.spacing.xs,
  },
  sectionTitleText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  sectionDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  itemsList: {
    gap: theme.spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: '#f9fafb',
  },
  itemRowSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: '#f8f9ff',
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: '500',
    color: theme.colors.foreground,
  },
  itemSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  itemBadge: {
    marginLeft: theme.spacing.sm,
  },
  itemBadgeText: {
    fontSize: theme.fontSize.xs,
  },

  // Filters
  filtersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  filtersLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.foreground,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  filterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
    gap: theme.spacing.xs,
  },
  filterBadgeText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },

  // Courses
  loadingSection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  coursesList: {
    gap: theme.spacing.md,
  },
  courseCard: {
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
  courseTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  courseDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  courseBadgeText: {
    fontSize: theme.fontSize.xs,
  },
  courseDetails: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
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
  courseDetailBadge: {
    marginLeft: theme.spacing.xs,
  },
  courseDetailBadgeText: {
    fontSize: theme.fontSize.xs,
  },
  courseDetailSeparator: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  courseStepsCount: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
  },
  manageCourseButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginTop: theme.spacing.md,
  },
  manageCourseButtonText: {
    color: theme.colors.foreground,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyStateTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '500',
    color: theme.colors.foreground,
  },
  emptyStateDescription: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  emptyStateButtonText: {
    color: '#ffffff',
    marginLeft: theme.spacing.xs,
  },

  // Languages
  languagesList: {
    gap: theme.spacing.md,
  },
  languageCard: {
    backgroundColor: '#ffffff',
  },
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageInfo: {
    flex: 1,
  },
  languageTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  languageCode: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  languageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  languageCourseBadge: {},
  languageCourseCount: {
    fontSize: theme.fontSize.xs,
  },
  manageLanguageButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  manageLanguageButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  languageCreatedText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCloseButton: {
    padding: theme.spacing.sm,
  },
  modalCloseText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  modalSaveButton: {
    padding: theme.spacing.sm,
  },
  modalSaveText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: theme.spacing.lg,
  },

  // Form
  formGroup: {
    marginBottom: theme.spacing.lg,
  },
  formLabel: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    backgroundColor: '#ffffff',
  },
  formTextArea: {
    height: 100,
    paddingTop: theme.spacing.md,
  },
  selectContainer: {
    gap: theme.spacing.sm,
  },
  selectOption: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#ffffff',
  },
  selectOptionActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#f8f9ff',
  },
  selectOptionText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
  },
  selectOptionTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});