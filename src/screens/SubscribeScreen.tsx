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
  const [selectedInterval, setSelectedInterval] = useState<PlanInterval | null>(null);

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

  const handleSelectPlan = async (interval: PlanInterval) => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to subscribe.');
      return;
    }

    setSelectedInterval(interval);
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
        setSelectedInterval(null);
        return;
      }

      // Find the package that matches the selected interval
      const selectedPackage = packages.find(pkg => {
        const identifier = pkg.identifier.toLowerCase();
        if (interval === 'monthly') {
          return identifier.includes('monthly') || identifier.includes('month') || pkg.packageType === 'MONTHLY';
        } else {
          return identifier.includes('annual') || identifier.includes('year') || pkg.packageType === 'ANNUAL';
        }
      });

      if (!selectedPackage) {
        Alert.alert('Error', `${interval === 'monthly' ? 'Monthly' : 'Annual'} plan not available. Please try the other option.`);
        setIsProcessing(false);
        setProcessingStage('idle');
        setSelectedInterval(null);
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
      setSelectedInterval(null);
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

  // Features list - matching web exactly
  const features = [
    'Access to all premium video lessons',
    'Early mobile app access',
    'Cancel anytime',
    'Advanced progress tracking',
    'Offline lesson downloads',
    'Priority customer support',
    'No ads',
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
        {/* Header - matching web */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Upgrade to Pro Learner</Text>
            <Text style={styles.headerSubtitle}>
              Unlock your full language learning potential
            </Text>
          </View>
        </View>


        {/* Pricing Card - matching web exactly */}
        <Card style={styles.pricingCard}>
          <CardContent style={styles.pricingContent}>
            {/* Features List */}
            <View style={styles.featuresSection}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={theme.colors.success500} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Pricing Section */}
            {!isProcessing && (
              <View style={styles.pricingSection}>
                <View style={styles.priceItem}>
                  <Text style={styles.priceAmount}>£2.99</Text>
                  <Text style={styles.priceInterval}>per month</Text>
                </View>
                <View style={styles.priceItem}>
                  <View style={styles.priceWithBadge}>
                    <Text style={styles.priceAmount}>£28.99</Text>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>20% off</Text>
                    </View>
                  </View>
                  <Text style={styles.priceInterval}>per year</Text>
                </View>
              </View>
            )}

            {/* Plan Selection Buttons */}
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
              <>
                <Button
                  style={styles.subscribeButton}
                  onPress={() => handleSelectPlan('monthly')}
                >
                  <Text style={styles.subscribeButtonText}>
                    Select Monthly Plan
                  </Text>
                </Button>

                <Button
                  style={[styles.subscribeButton, styles.annualButton]}
                  onPress={() => handleSelectPlan('annual')}
                >
                  <View style={styles.annualButtonContent}>
                    <Text style={styles.subscribeButtonText}>
                      Select Annual Plan
                    </Text>
                    <View style={styles.savingsBadge}>
                      <Text style={styles.savingsText}>Save 20%</Text>
                    </View>
                  </View>
                </Button>
              </>
            )}

            {/* Back Button - matching web */}
            <Button
              style={styles.backToAppButton}
              onPress={() => navigation.navigate('MainTabs' as never)}
              disabled={isProcessing}
            >
              <Text style={styles.backToAppButtonText}>Back to Dashboard</Text>
            </Button>
          </CardContent>
        </Card>

        {/* Additional Info - matching web */}
        <View style={styles.additionalInfo}>
          <Text style={styles.infoText}>
            7-day free trial • Cancel anytime • No commitment
          </Text>
          <Text style={styles.infoText}>
            By subscribing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>

        {/* Pro Features Highlight */}
        <Card style={styles.proFeaturesCard}>
          <CardHeader>
            <CardTitle style={styles.proFeaturesTitle}>
              <Ionicons name="star" size={20} color="#f59e0b" />
              <Text style={styles.proFeaturesTitleText}>What Pro Users Get</Text>
            </CardTitle>
          </CardHeader>
          <CardContent style={styles.proFeaturesContent}>
            <View style={styles.proFeatureGrid}>
              <View style={styles.proFeatureItem}>
                <Ionicons name="play-circle" size={24} color="#3b82f6" />
                <Text style={styles.proFeatureTitle}>Premium Videos</Text>
                <Text style={styles.proFeatureDescription}>
                  Access all video lessons with native speakers
                </Text>
              </View>
              
              <View style={styles.proFeatureItem}>
                <Ionicons name="phone-portrait" size={24} color="#10b981" />
                <Text style={styles.proFeatureTitle}>Mobile App</Text>
                <Text style={styles.proFeatureDescription}>
                  Early access to our mobile learning app
                </Text>
              </View>
              
              <View style={styles.proFeatureItem}>
                <Ionicons name="analytics" size={24} color="#8b5cf6" />
                <Text style={styles.proFeatureTitle}>Progress Tracking</Text>
                <Text style={styles.proFeatureDescription}>
                  Detailed analytics and learning insights
                </Text>
              </View>
              
              <View style={styles.proFeatureItem}>
                <Ionicons name="headset" size={24} color="#f59e0b" />
                <Text style={styles.proFeatureTitle}>Priority Support</Text>
                <Text style={styles.proFeatureDescription}>
                  Get help faster with priority customer support
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
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
    marginBottom: theme.spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  featureText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },

  // Pricing
  pricingSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  priceItem: {
    alignItems: 'center',
    flex: 1,
  },
  priceWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.foreground,
  },
  priceInterval: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginTop: theme.spacing.xs,
  },
  discountBadge: {
    backgroundColor: theme.colors.success500,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.sm,
  },
  discountText: {
    color: theme.colors.primaryForeground,
    fontSize: 11,
    fontWeight: '600',
  },

  // Toggle
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: theme.borderRadius.lg,
    padding: 4,
    marginBottom: theme.spacing.xl,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  toggleButtonLeft: {
    borderTopLeftRadius: theme.borderRadius.md,
    borderBottomLeftRadius: theme.borderRadius.md,
  },
  toggleButtonRight: {
    borderTopRightRadius: theme.borderRadius.md,
    borderBottomRightRadius: theme.borderRadius.md,
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.mutedForeground,
  },
  toggleButtonTextActive: {
    color: theme.colors.primary,
  },
  toggleButtonDisabled: {
    opacity: 0.4,
  },
  toggleButtonTextDisabled: {
    color: theme.colors.mutedForeground,
  },
  savingsBadgeSmall: {
    position: 'absolute',
    top: -8,
    right: 4,
    backgroundColor: theme.colors.success500,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  savingsTextSmall: {
    color: theme.colors.primaryForeground,
    fontSize: 10,
    fontWeight: '600',
  },

  // Buttons
  subscribeButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  subscribeButtonDisabled: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    color: theme.colors.primaryForeground,
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    textAlign: 'center',
  },
  processingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  annualButton: {
    position: 'relative',
  },
  annualButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  savingsBadge: {
    backgroundColor: theme.colors.success500,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  savingsText: {
    color: theme.colors.primaryForeground,
    fontSize: 12,
    fontWeight: '600',
  },
  backToAppButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  backToAppButtonText: {
    color: theme.colors.foreground,
    fontSize: theme.fontSize.base,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Additional Info
  additionalInfo: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  infoText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },

  // Pro Features
  proFeaturesCard: {
    marginHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.card,
  },
  proFeaturesTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  proFeaturesTitleText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  proFeaturesContent: {
    paddingTop: 0,
  },
  proFeatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.lg,
  },
  proFeatureItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: '#f8fafc',
    borderRadius: theme.borderRadius.lg,
  },
  proFeatureTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  proFeatureDescription: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 18,
  },
});