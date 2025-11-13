import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

import { theme } from '../lib/theme';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { apiClient } from '../lib/apiClient';
import { purchaseService } from '../services/purchaseService';
import { useAuth } from '../hooks/useAuth';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  priceTier?: string;
}

interface SubscriptionStatus {
  isProUser: boolean;
  status: string;
  currentPeriodEnd?: number;
  subscriptionId?: string;
}

function getLearningTier(priceTier?: string): string {
  if (!priceTier || priceTier === 'n/a' || priceTier === 'free-trial') return 'Free';
  if (priceTier.startsWith('pro-')) return 'Pro';
  if (priceTier.startsWith('plus-')) return 'Plus';
  return 'Free';
}

function getPlanType(priceTier?: string): string {
  if (!priceTier || priceTier === 'n/a' || priceTier === 'free-trial') return 'Free';
  if (priceTier === 'pro-monthly') return 'Pro (Monthly)';
  if (priceTier === 'pro-yearly') return 'Pro (Yearly)';
  if (priceTier === 'plus-monthly') return 'Plus (Monthly)';
  if (priceTier === 'plus-yearly') return 'Plus (Yearly)';
  return 'Free';
}

function getPriceDisplay(priceTier?: string): string {
  if (!priceTier || priceTier === 'n/a' || priceTier === 'free-trial') return 'Free';
  if (priceTier === 'pro-monthly') return '£2.99/month';
  if (priceTier === 'pro-yearly') return '£28.99/year';
  if (priceTier === 'plus-monthly') return '£16.99/month';
  if (priceTier === 'plus-yearly') return '£149.99/year';
  return 'Free';
}

const planFeatures = [
  'Unlimited Pro video Lessons',
  'Cultural and bonus tips',
  'Exclusive \'Explore\' content',
  'Early access to new features',
  'Ad-free experience',
  'Priority support',
  'Cancel anytime',
];

export default function SubscriptionScreenNew() {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('annual');

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const res = await apiClient.getCurrentUser?.();
      return (res as any)?.data || res;
    },
  });

  const { data: subscriptionStatus, isLoading: subLoading } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription-status'],
    enabled: !!user,
    queryFn: async () => {
      if ((apiClient as any).getSubscriptionStatus) {
        const res = await (apiClient as any).getSubscriptionStatus();
        return (res as any)?.data || res;
      }
      const res = await (apiClient as any).request?.('GET', '/api/subscription-status');
      return (res as any)?.data || res;
    },
  });

  const handleBack = () => navigation.goBack();

  const handleChangePlan = () => {
    navigation.navigate('Subscribe' as never);
  };

  const handleRestorePurchases = async () => {
    try {
      Alert.alert('Restore Purchases', 'Checking for existing subscriptions...');
      
      const result = await purchaseService.restorePurchases();
      
      if (result.success) {
        // Notify backend about restored purchase to sync entitlements
        try {
          // Refresh user data to get updated subscription status
          const updatedUser = await apiClient.getCurrentUser();
          console.log('✅ User data refreshed after restore:', updatedUser);
        } catch (backendError) {
          console.warn('⚠️ Failed to refresh user after restore:', backendError);
          // Continue anyway - RevenueCat webhook will eventually sync
        }

        Alert.alert(
          '✅ Purchase Restored',
          'Your subscription has been restored successfully!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'We couldn\'t find any previous purchases for this account.'
        );
      }
    } catch (error: any) {
      console.error('Restore error:', error);
      Alert.alert('Restore Failed', 'Unable to restore purchases. Please try again.');
    }
  };

  const handleOpenTerms = async () => {
    await WebBrowser.openBrowserAsync('https://www.lingotoday.co/terms');
  };

  const handleOpenPrivacy = async () => {
    await WebBrowser.openBrowserAsync('https://www.lingotoday.co/privacy');
  };

  const handleManageSubscription = async () => {
    // Open App Store subscription management on iOS
    if (Platform.OS === 'ios') {
      await WebBrowser.openBrowserAsync('https://apps.apple.com/account/subscriptions');
    } else {
      // For Android, open Google Play subscriptions
      await WebBrowser.openBrowserAsync('https://play.google.com/store/account/subscriptions');
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'This will permanently delete your account and all associated data. Are you absolutely sure?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                },
                {
                  text: 'Yes, Delete My Account',
                  style: 'destructive',
                  onPress: async () => {
                    let deleteSuccess = false;
                    let errorMessage = '';
                    
                    try {
                      console.log('🗑️ Attempting to delete account...');
                      await apiClient.deleteAccount();
                      console.log('✅ Account deleted successfully');
                      deleteSuccess = true;
                    } catch (error: any) {
                      console.error('❌ Delete account error:', error);
                      errorMessage = error?.message || 'Unknown error';
                    } finally {
                      console.log('🚪 Logging out and clearing cache...');
                      queryClient.clear();
                      await logout();
                      
                      if (deleteSuccess) {
                        Alert.alert(
                          'Account Deleted',
                          'Your account has been permanently deleted and you have been logged out.'
                        );
                      } else {
                        const is404 = errorMessage.includes('404') || errorMessage.includes('Not Found');
                        const is500 = errorMessage.includes('500') || errorMessage.includes('Internal Server Error');
                        
                        if (is404) {
                          Alert.alert(
                            'Feature Unavailable',
                            'The account deletion feature is not yet available on the server. Please contact support to delete your account. You have been logged out.'
                          );
                        } else if (is500) {
                          Alert.alert(
                            'Server Error',
                            'There was a problem deleting your account. Please contact support. You have been logged out.'
                          );
                        } else {
                          Alert.alert(
                            'Error',
                            `Failed to delete account: ${errorMessage}. You have been logged out.`
                          );
                        }
                      }
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  if (userLoading || subLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading subscription details...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Please log in to view your subscription.</Text>
      </View>
    );
  }

  const currentPrice = selectedPlan === 'annual' ? '£28.99' : '£2.99';
  const currentPeriod = selectedPlan === 'annual' ? 'annually' : 'monthly';
  const strikethroughPrice = selectedPlan === 'annual' ? '£2.99' : null;
  const perMonthPrice = selectedPlan === 'annual' ? '£2.41/month' : null;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack} testID="back-to-account">
              <Ionicons name="chevron-back" size={24} color={theme.colors.foreground} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Subscription Package</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.mainTitle}>Upgrade to Pro</Text>
            <Text style={styles.subtitle}>Unlock your full language learning potential</Text>

            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  selectedPlan === 'monthly' && styles.toggleButtonActive,
                ]}
                onPress={() => setSelectedPlan('monthly')}
              >
                <Text style={[
                  styles.toggleButtonText,
                  selectedPlan === 'monthly' && styles.toggleButtonTextActive,
                ]}>
                  Monthly
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  styles.toggleButtonAnnual,
                  selectedPlan === 'annual' && styles.toggleButtonActive,
                ]}
                onPress={() => setSelectedPlan('annual')}
              >
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Popular</Text>
                </View>
                <Text style={[
                  styles.toggleButtonText,
                  styles.toggleButtonAnnualText,
                  selectedPlan === 'annual' && styles.toggleButtonTextActive,
                ]}>
                  Annual{'\n'}Save 19%
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.featuresContainer}>
              {planFeatures.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} style={styles.checkmark} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            <View style={styles.pricingContainer}>
              <Text style={styles.mainPrice}>{currentPrice}</Text>
              <Text style={styles.period}>{currentPeriod}</Text>
              {strikethroughPrice && (
                <View style={styles.strikethroughContainer}>
                  <Text style={styles.strikethroughPrice}>{strikethroughPrice}</Text>
                  <Text style={styles.perMonthPrice}>{perMonthPrice}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.joinButton} onPress={handleChangePlan}>
              <Text style={styles.joinButtonText}>Join Pro</Text>
            </TouchableOpacity>

            <View style={styles.trialNotice}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
              <Text style={styles.trialNoticeText}>3-day free trial, Cancel anytime</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.mutedForeground,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.foreground,
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  content: {
    paddingHorizontal: 20,
  },
  mainTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.foreground,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 32,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.muted,
    borderRadius: 12,
    padding: 6,
    marginBottom: 32,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.transparent,
    position: 'relative',
  },
  toggleButtonAnnual: {
    backgroundColor: theme.colors.toggleActive,
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.toggleActive,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  toggleButtonAnnualText: {
    color: theme.colors.foreground,
  },
  toggleButtonTextActive: {
    color: theme.colors.foreground,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primaryForeground,
  },
  featuresContainer: {
    marginBottom: 32,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkmark: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: theme.colors.foreground,
    flex: 1,
  },
  pricingContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mainPrice: {
    fontSize: 64,
    fontWeight: '700',
    color: theme.colors.primary,
    lineHeight: 72,
  },
  period: {
    fontSize: 16,
    color: theme.colors.mutedForeground,
    marginBottom: 8,
  },
  strikethroughContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strikethroughPrice: {
    fontSize: 14,
    color: theme.colors.mutedForeground,
    textDecorationLine: 'line-through',
  },
  perMonthPrice: {
    fontSize: 14,
    color: theme.colors.mutedForeground,
  },
  joinButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  joinButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primaryForeground,
  },
  trialNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 32,
  },
  trialNoticeText: {
    fontSize: 14,
    color: theme.colors.mutedForeground,
  },
});