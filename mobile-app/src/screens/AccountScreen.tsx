import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../lib/apiClient';

interface AccountScreenProps {
  navigation: any;
}

export default function AccountScreen({ navigation }: AccountScreenProps) {
  const { user, logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Fetch dashboard data for stats
  const { data: dashboardData } = useQuery({
    queryKey: ['/api/dashboard'],
    queryFn: () => apiClient.getDashboardData(),
    enabled: !!user,
  });

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
            } catch (error) {
              console.error('Logout error:', error);
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your progress will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Feature Not Available',
              'Account deletion is not yet available. Please contact support if you need assistance.'
            );
          },
        },
      ]
    );
  };

  const getLanguageDisplayName = (code: string): string => {
    const languages: { [key: string]: string } = {
      italian: 'Italian',
      spanish: 'Spanish',
      french: 'French',
      german: 'German',
      portuguese: 'Portuguese',
      mandarin: 'Mandarin',
      japanese: 'Japanese',
      korean: 'Korean',
    };
    return languages[code?.toLowerCase()] || code?.charAt(0).toUpperCase() + code?.slice(1);
  };

  const getLevelDisplayName = (code: string): string => {
    const levels: { [key: string]: string } = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    };
    return levels[code?.toLowerCase()] || code?.charAt(0).toUpperCase() + code?.slice(1);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'N/A';
    }
  };

  const stats = dashboardData?.stats || { streak: 0, totalLessons: 0, wordsLearned: 0, lessonsCompleted: 0 };
  const memberSince = user?.createdAt ? formatDate(user.createdAt) : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Account</Text>
          <Text style={styles.headerSubtitle}>Manage your profile and preferences</Text>
        </View>

        {/* Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatarText}>
                  {user?.firstName ? user.firstName[0].toUpperCase() : 
                   user?.email ? user.email[0].toUpperCase() : '?'}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}`
                    : user?.firstName || 'User'
                  }
                </Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
                {memberSince && (
                  <Text style={styles.profileMeta}>Member since {memberSince}</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Learning Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Learning Profile</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Language</Text>
              <Text style={styles.infoValue}>
                {user?.selectedLanguage ? getLanguageDisplayName(user.selectedLanguage) : 'Not set'}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Level</Text>
              <Text style={styles.infoValue}>
                {user?.selectedLevel ? getLevelDisplayName(user.selectedLevel) : 'Not set'}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progress Statistics</Text>
          <View style={styles.statsCard}>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>🔥</Text>
                <Text style={styles.statNumber}>{stats.streak}</Text>
                <Text style={styles.statLabel}>Current Streak</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>📚</Text>
                <Text style={styles.statNumber}>{stats.lessonsCompleted}</Text>
                <Text style={styles.statLabel}>Lessons Completed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>💬</Text>
                <Text style={styles.statNumber}>{stats.wordsLearned}</Text>
                <Text style={styles.statLabel}>Words Learned</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>⏱️</Text>
                <Text style={styles.statNumber}>0</Text>
                <Text style={styles.statLabel}>Hours Studied</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingIcon}>🔔</Text>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingSubtitle}>Manage your learning reminders</Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingIcon}>🌐</Text>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Language & Level</Text>
                <Text style={styles.settingSubtitle}>Change your learning preferences</Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingIcon}>🎯</Text>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Learning Goals</Text>
                <Text style={styles.settingSubtitle}>Set daily study targets</Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingIcon}>❓</Text>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Help & FAQ</Text>
                <Text style={styles.settingSubtitle}>Get answers to common questions</Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingIcon}>💌</Text>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Contact Support</Text>
                <Text style={styles.settingSubtitle}>Get help with your account</Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>

            <View style={styles.divider} />
            
            <TouchableOpacity style={styles.settingItem}>
              <Text style={styles.settingIcon}>⭐</Text>
              <View style={styles.settingContent}>
                <Text style={styles.settingTitle}>Rate LingoToday</Text>
                <Text style={styles.settingSubtitle}>Help us improve the app</Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <View style={styles.actionsCard}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.logoutButtonText}>Sign Out</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDeleteAccount}
            >
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>LingoToday v1.0.0</Text>
          <Text style={styles.appInfoText}>Made with ❤️ for language learners</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  profileMeta: {
    fontSize: 12,
    color: '#94a3b8',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#374151',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 20,
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  settingArrow: {
    fontSize: 20,
    color: '#94a3b8',
  },
  actionsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  deleteButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  appInfoText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
});