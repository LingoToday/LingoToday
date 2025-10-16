import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../lib/theme';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Progress } from './ui/Progress';
import { apiClient, DashboardData } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';

export default function ProgressOverview() {
  const { user } = useAuth();
  const { data: dashboardData, isLoading, error: dashboardError } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard"],
    queryFn: async () => {
      try {
        return await apiClient.getDashboardData();
      } catch (error) {
        console.error('Dashboard query error:', error);
        // Return fallback data to prevent UI breaking
        const fallbackUser = user ? {
          ...user,
          firstName: user.firstName ?? undefined, // Convert null to undefined
          lastName: user.lastName ?? undefined,
          avatarUrl: user.avatarUrl ?? undefined,
          password: user.password ?? undefined,
          selectedLanguage: user.selectedLanguage ?? undefined
        } : { id: '', email: '', firstName: 'User' };
        
        return {
          user: fallbackUser,
          settings: {
            notificationsEnabled: false,
            notificationFrequency: 15,
            notificationStartTime: '09:00',
            notificationEndTime: '18:00',
            selectedLanguage: user?.selectedLanguage || 'italian',
          },
          stats: {
            streak: 0,
            totalLessons: 0,
            wordsLearned: 0,
            lessonsCompleted: 0,
          },
          progress: []
        } as DashboardData;
      }
    },
    enabled: !!user,
    retry: 1, // Only retry once
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (!dashboardData) {
    return (
      <Card style={styles.card}>
        <CardContent style={styles.loadingContent}>
          <View style={styles.loadingPlaceholder}>
            <View style={styles.loadingBar} />
            <View style={[styles.loadingBar, { width: '50%' }]} />
            <View style={styles.loadingDots}>
              {[...Array(5)].map((_, i) => (
                <View key={i} style={styles.loadingDot} />
              ))}
            </View>
          </View>
        </CardContent>
      </Card>
    );
  }

  const { stats } = dashboardData;
  
  // Calculate week progress (assuming 5 days per week) - matching web exactly
  const currentWeek = 2;
  const currentDay = 3;
  const weekProgress = (currentDay / 5) * 100;
  
  // Get days of week for visual representation - matching web exactly
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  
  return (
    <Card style={styles.card}>
      <CardHeader>
        <CardTitle style={styles.cardTitle}>This Week's Progress</CardTitle>
      </CardHeader>
      <CardContent style={styles.cardContent}>
        {/* Week Progress - matching web exactly */}
        <View style={styles.progressSection}>
          <View style={styles.progressInfo}>
            <Text style={styles.progressLabel}>Week {currentWeek} Progress</Text>
            <Text style={styles.progressValue}>{currentDay}/5 days</Text>
          </View>
          <Progress value={weekProgress} style={styles.progressBar} />
        </View>
        
        {/* Days Grid - matching web exactly */}
        <View style={styles.daysGrid}>
          {daysOfWeek.map((day, index) => {
            const dayNumber = index + 1;
            const isCompleted = dayNumber < currentDay;
            const isCurrent = dayNumber === currentDay;
            const isFuture = dayNumber > currentDay;
            
            return (
              <View key={day} style={styles.dayItem}>
                <View style={[
                  styles.dayCircle,
                  isCompleted && styles.dayCompleted,
                  isCurrent && styles.dayCurrent,
                  isFuture && styles.dayFuture,
                ]}>
                  {isCompleted ? (
                    <Ionicons name="checkmark" size={12} color="#ffffff" />
                  ) : isCurrent ? (
                    <Ionicons name="play" size={12} color="#ffffff" />
                  ) : (
                    <Text style={styles.dayNumber}>{dayNumber}</Text>
                  )}
                </View>
                <Text style={styles.dayLabel}>{day}</Text>
              </View>
            );
          })}
        </View>
        
        {/* Learning Goals - matching web exactly */}
        <View style={styles.goalsSection}>
          <Text style={styles.goalsTitle}>Learning Goals</Text>
          <View style={styles.goalsList}>
            <View style={styles.goalItem}>
              <Text style={styles.goalLabel}>Daily lessons</Text>
              <Text style={styles.goalValue}>{currentDay}/5 this week</Text>
            </View>
            <View style={styles.goalItem}>
              <Text style={styles.goalLabel}>New words</Text>
              <Text style={styles.goalValuePrimary}>{stats?.wordsLearned || 0} learned</Text>
            </View>
            <View style={styles.goalItem}>
              <Text style={styles.goalLabel}>Current streak</Text>
              <Text style={styles.goalValueSecondary}>{stats?.streak || 0} days</Text>
            </View>
          </View>
        </View>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  // Card
  card: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Loading
  loadingContent: {
    paddingVertical: theme.spacing.lg,
  },
  loadingPlaceholder: {
    gap: theme.spacing.md,
  },
  loadingBar: {
    height: 16,
    backgroundColor: '#e5e7eb',
    borderRadius: theme.borderRadius.sm,
    width: '75%',
  },
  loadingDots: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  loadingDot: {
    width: 32,
    height: 32,
    backgroundColor: '#e5e7eb',
    borderRadius: theme.borderRadius.full,
  },

  // Card Content
  cardTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: '#111827', // text-gray-900
  },
  cardContent: {
    gap: theme.spacing.lg,
  },

  // Progress Section
  progressSection: {
    gap: theme.spacing.sm,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  progressLabel: {
    fontSize: theme.fontSize.sm,
    color: '#6b7280', // text-gray-600
  },
  progressValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: '#111827',
  },
  progressBar: {
    height: 8,
  },

  // Days Grid
  daysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  dayItem: {
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  dayCompleted: {
    backgroundColor: '#10b981', // success-500
  },
  dayCurrent: {
    backgroundColor: '#3b82f6', // primary-500
  },
  dayFuture: {
    backgroundColor: '#e5e7eb', // gray-200
  },
  dayNumber: {
    fontSize: theme.fontSize.xs,
    color: '#9ca3af', // text-gray-400
  },
  dayLabel: {
    fontSize: theme.fontSize.xs,
    color: '#6b7280', // text-gray-500
  },

  // Learning Goals
  goalsSection: {
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6', // border-gray-100
  },
  goalsTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: '500',
    color: '#111827', // text-gray-900
    marginBottom: theme.spacing.md,
  },
  goalsList: {
    gap: theme.spacing.sm,
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalLabel: {
    fontSize: theme.fontSize.sm,
    color: '#6b7280', // text-gray-600
  },
  goalValue: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: '#10b981', // text-success-600
  },
  goalValuePrimary: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: '#3b82f6', // text-primary-600
  },
  goalValueSecondary: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: '#8b5cf6', // text-secondary-600
  },
});