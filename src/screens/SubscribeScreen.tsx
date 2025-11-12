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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PurchasesPackage } from 'react-native-purchases';

import { theme } from '../lib/theme';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import { purchaseService } from '../services/purchaseService';

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
    'Unlimited Pro video lessons',
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
            <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Upgrade to Pro</Text>
            <Text style={styles.headerSubtitle}>
              Unlock your full language learning potential
            </Text>
          </View>
        </View>


        {/* Pricing Card */}
        <Card style={styles.pricingCard}>
          <CardContent style={styles.pricingContent}>
            {/* Monthly/Annual Toggle */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  styles.toggleButtonLeft,
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
                  styles.toggleButtonRight,
                  selectedInterval === 'annual' && styles.toggleButtonActive,
                  isProcessing && styles.toggleButtonDisabled,
                ]}
                onPress={() => !isProcessing && setSelectedInterval('annual')}
                disabled={isProcessing}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    selectedInterval === 'annual' && styles.toggleButtonTextActive,
                  ]}
                >
                  Annual
                </Text>
                {selectedInterval === 'annual' && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                )}
                <Text style={styles.savingsTextToggle}>Save 19%</Text>
              </TouchableOpacity>
            </View>

            {/* Features List */}
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
              {selectedInterval === 'monthly' ? (
                <>
                  <Text style={styles.priceAmount}>£2.99</Text>
                  <Text style={styles.priceInterval}>/month</Text>
                </>
              ) : (
                <>
                  <Text style={styles.priceAmount}>£28.99</Text>
                  <Text style={styles.priceInterval}>annually</Text>
                  <View style={styles.monthlyBreakdown}>
                    <Text style={styles.strikethroughPrice}>£2.99</Text>
                    <Text style={styles.billedText}> £2.41/month</Text>
                  </View>
                </>
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
          </CardContent>
        </Card>

        {/* Additional Info */}
        <View style={styles.additionalInfo}>
          <View style={styles.infoRow}>
            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
            <Text style={styles.infoText}>3-day free trial • Cancel anytime</Text>
          </View>
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  errorTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.foreground,
    textAlign: 'center',
    marginTop: theme.spacing.md,
  },
  errorMessage: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    marginTop: theme.spacing.lg,
  },
  retryButtonText: {
    color: theme.colors.primaryForeground,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    paddingTop: 10,
    backgroundColor: theme.colors.card,
  },
  backButton: {
    padding: theme.spacing.sm,
    marginRight: theme.spacing.md,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: '700',
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },

  // Pricing Card
  pricingCard: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.card,
  },
  pricingContent: {
    paddingVertical: theme.spacing.xl,
  },

  // Features
  featuresSection: {
    marginBottom: theme.spacing.lg,
    backgroundColor: '#F9FAFB',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
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
    marginBottom: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
  },
  strikethroughPrice: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.mutedForeground,
    textDecorationLine: 'line-through',
    marginBottom: theme.spacing.xs,
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: theme.colors.foreground,
  },
  priceInterval: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.mutedForeground,
  },
  billedText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
  },
  monthlyBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },

  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: theme.spacing.xl,
    gap: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 8,
  },
  toggleButtonLeft: {
    borderRadius: 8,
  },
  toggleButtonRight: {
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: '#6B7280',
  },
  toggleButtonTextActive: {
    color: '#111827',
  },
  toggleButtonDisabled: {
    opacity: 0.5,
  },
  popularBadge: {
    position: 'absolute',
    top: -6,
    right: 8,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  savingsTextToggle: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.primary,
    marginTop: 2,
  },

  // Buttons
  subscribeButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
  },
  subscribeButtonDisabled: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
});