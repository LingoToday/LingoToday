import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PurchasesPackage } from 'react-native-purchases';

import { theme } from '../lib/theme';
import { Button } from '../components/ui/Button';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import { purchaseService } from '../services/purchaseService';
import { PRO_PRICING } from '../constants/pricing';

interface SubscriptionStatus {
  isProUser: boolean;
  status: string;
}

type PlanInterval = 'monthly' | 'annual';

export default function SubscribeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<'idle' | 'loading' | 'payment' | 'activating'>('idle');
  const [selectedInterval, setSelectedInterval] = useState<PlanInterval>('annual');

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Check if user is already a pro member
  const { data: subscriptionStatus, isLoading: statusLoading } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription-status'],
    queryFn: async () => {
      const response = await apiClient.getSubscriptionStatus();
      return (response as any).data || response;
    },
    staleTime: 30000,
  });

  // Poll subscription status until webhook upgrades account
  const pollSubscriptionStatus = async (): Promise<boolean> => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5 seconds * 60)
    
    while (attempts < maxAttempts) {
      try {
        const response = await apiClient.getSubscriptionStatus();
        const data = (response as any).data || response;
        
        if (data.isProUser) {
          return true; // Webhook processed successfully
        }
        
        // Wait 5 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      } catch (error) {
        console.error('Error checking subscription status:', error);
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempts++;
      }
    }
    
    return false; // Timeout - webhook didn't arrive in time
  };

  const handleSelectPlan = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to subscribe.');
      return;
    }

    setIsProcessing(true);
    setProcessingStage('loading');

    try {
      // Initialize RevenueCat and fetch offerings
      await purchaseService.initialize(user.id);
      const packages = await purchaseService.getOfferings();
      
      if (!packages || packages.length === 0) {
        Alert.alert('Error', 'No subscription packages available. Please try again later.');
        setIsProcessing(false);
        setProcessingStage('idle');
        return;
      }

      // Find the package that matches the selected interval
      const selectedPackage = packages.find(pkg => {
        const identifier = pkg.identifier.toLowerCase();
        if (selectedInterval === 'monthly') {
          return identifier.includes('monthly') || identifier.includes('month') || pkg.packageType === 'MONTHLY';
        } else {
          return identifier.includes('annual') || identifier.includes('year') || pkg.packageType === 'ANNUAL';
        }
      });

      if (!selectedPackage) {
        Alert.alert('Error', `${selectedInterval === 'monthly' ? 'Monthly' : 'Annual'} plan not available. Please try the other option.`);
        setIsProcessing(false);
        setProcessingStage('idle');
        return;
      }

      // Proceed with purchase
      setProcessingStage('payment');
      const result = await purchaseService.purchasePackage(selectedPackage);
      
      if (result.success) {
        setProcessingStage('activating');
        
        // Poll subscription status until webhook upgrades account
        const webhookSuccess = await pollSubscriptionStatus();
        
        if (webhookSuccess) {
          // Invalidate all queries that depend on user's pro status
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['/api/subscription-status'] }),
            queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] }),
            queryClient.invalidateQueries({ queryKey: ['/api/courses'] }),
            queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] }),
            queryClient.invalidateQueries({ queryKey: ['/api/progress'] }),
          ]);
          
          Alert.alert(
            'Welcome to Pro Learner!',
            'Your subscription is now active. You have access to all premium features.',
            [{ 
              text: 'OK', 
              onPress: () => navigation.navigate('MainTabs' as never) 
            }]
          );
        } else {
          Alert.alert(
            'Payment Processed',
            'Your payment was successful. If you don\'t see Pro features immediately, please refresh the app in a few minutes.',
            [{ 
              text: 'OK', 
              onPress: () => navigation.navigate('MainTabs' as never) 
            }]
          );
        }
      } else if (result.error === 'Purchase cancelled') {
        console.log('User cancelled purchase');
      } else {
        Alert.alert('Purchase Failed', result.error || 'Unable to complete purchase. Please try again.');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      Alert.alert('Error', error.message || 'Failed to process subscription. Please try again.');
    } finally {
      setIsProcessing(false);
      setProcessingStage('idle');
    }
  };

  // Redirect if already pro
  useEffect(() => {
    if (subscriptionStatus && subscriptionStatus.isProUser) {
      Alert.alert(
        'Already Subscribed',
        'You\'re already a Pro Learner! Redirecting to dashboard...',
        [{ 
          text: 'OK', 
          onPress: () => navigation.navigate('MainTabs' as never) 
        }]
      );
    }
  }, [subscriptionStatus, navigation]);

  // Features list - matching design
  const features = [
    'Unlimited Pro video Lessons',
    'Cultural and bonus tips',
    'Exclusive \'Explore\' content',
    'Early access to new features',
    'Ad-free experience',
    'Priority support',
    'Cancel anytime',
  ];

  if (statusLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Subscription Package</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Title and Subtitle */}
          <Text style={styles.title}>Upgrade to Pro</Text>
          <Text style={styles.subtitle}>Unlock your full language learning potential</Text>

          {/* Monthly/Annual Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                selectedInterval === 'monthly' && styles.toggleButtonActive,
                isProcessing && styles.toggleButtonDisabled,
              ]}
              onPress={() => !isProcessing && setSelectedInterval('monthly')}
              disabled={isProcessing}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  selectedInterval === 'monthly' && styles.toggleButtonTextActive,
                ]}
              >
                Monthly
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                selectedInterval === 'annual' && styles.toggleButtonActive,
                isProcessing && styles.toggleButtonDisabled,
              ]}
              onPress={() => !isProcessing && setSelectedInterval('annual')}
              disabled={isProcessing}
            >
              {selectedInterval === 'annual' && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>Popular</Text>
                </View>
              )}
              <Text
                style={[
                  styles.toggleButtonText,
                  selectedInterval === 'annual' && styles.toggleButtonTextActive,
                ]}
              >
                Annual
              </Text>
              <Text style={[
                styles.savingsText,
                selectedInterval === 'annual' && styles.savingsTextActive,
              ]}>
                Save 19%
              </Text>
            </TouchableOpacity>
          </View>

          {/* Features List - directly on background */}
          <View style={styles.featuresSection}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Pricing Display */}
          <View style={styles.pricingDisplaySection}>
            <Text style={styles.priceAmount}>
              {selectedInterval === 'monthly' ? PRO_PRICING.GBP.monthly : PRO_PRICING.GBP.yearly}
            </Text>
            <Text style={styles.priceInterval}>
              {selectedInterval === 'monthly' ? '/month' : 'annually'}
            </Text>
            {selectedInterval === 'annual' && (
              <View style={styles.monthlyBreakdown}>
                <Text style={styles.strikethroughPrice}>{PRO_PRICING.GBP.monthly}</Text>
                <Text style={styles.billedText}> {PRO_PRICING.GBP.yearlyMonthlyBreakdown}/month</Text>
              </View>
            )}
          </View>

          {/* CTA Button */}
          {isProcessing ? (
            <Button
              style={[styles.subscribeButton, styles.subscribeButtonDisabled]}
              disabled={true}
            >
              <View style={styles.processingContent}>
                <ActivityIndicator size="small" color={theme.colors.primaryForeground} />
                <Text style={styles.subscribeButtonText}>
                  {processingStage === 'loading' && 'Loading...'}
                  {processingStage === 'payment' && 'Processing Payment...'}
                  {processingStage === 'activating' && 'Activating Subscription...'}
                </Text>
              </View>
            </Button>
          ) : (
            <Button
              style={styles.subscribeButton}
              onPress={handleSelectPlan}
            >
              <Text style={styles.subscribeButtonText}>Join Pro</Text>
            </Button>
          )}

          {/* Additional Info */}
          <View style={styles.additionalInfo}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
            <Text style={styles.infoText}>3-day free trial, Cancel anytime</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 10,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },

  // Content
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.foreground,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    marginBottom: 32,
  },

  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.muted,
    borderRadius: 12,
    padding: 6,
    marginBottom: 32,
    gap: 6,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  toggleButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  toggleButtonTextActive: {
    color: theme.colors.primaryForeground,
  },
  toggleButtonDisabled: {
    opacity: 0.5,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  popularText: {
    color: theme.colors.primaryForeground,
    fontSize: 10,
    fontWeight: '600',
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.mutedForeground,
    marginTop: 4,
  },
  savingsTextActive: {
    color: theme.colors.primaryForeground,
  },

  // Features - directly on background
  featuresSection: {
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  featureText: {
    flex: 1,
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    lineHeight: 24,
  },

  // Pricing Display
  pricingDisplaySection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  priceAmount: {
    fontSize: 64,
    fontWeight: '700',
    color: theme.colors.primary,
    lineHeight: 72,
  },
  priceInterval: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    marginBottom: 8,
  },
  monthlyBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  strikethroughPrice: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    textDecorationLine: 'line-through',
  },
  billedText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.primary,
  },

  // Buttons
  subscribeButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    marginBottom: 16,
  },
  subscribeButtonDisabled: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    color: theme.colors.primaryForeground,
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
  },
  processingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },

  // Additional Info
  additionalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
});
