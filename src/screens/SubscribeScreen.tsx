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

export default function SubscribeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<'idle' | 'payment' | 'activating'>('idle');
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);

  const handleGoBack = () => {
    navigation.goBack();
  };

  // Fetch RevenueCat offerings - wait for authenticated user
  const { data: packages, isLoading: packagesLoading } = useQuery<PurchasesPackage[]>({
    queryKey: ['revenuecat-offerings', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      await purchaseService.initialize(user.id);
      return await purchaseService.getOfferings();
    },
    enabled: !!user?.id, // Only fetch when user is available
    staleTime: 60000, // 1 minute
  });

  // Check if user is already a pro member - matching web exactly
  const { data: subscriptionStatus, isLoading: statusLoading } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription-status'],
    queryFn: async () => {
      const response = await apiClient.getSubscriptionStatus();
      return (response as any).data || response;
    },
    staleTime: 30000, // 30 seconds
  });

  // Create subscription mutation - matching web exactly
  const createSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.createSubscription();
      return (response as any).data || response;
    },
    onError: (error) => {
      Alert.alert(
        'Subscription Error',
        'Failed to create subscription. Please try again.',
        [{ text: 'OK' }]
      );
    },
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

  const handleSubscribe = async (packageToPurchase: PurchasesPackage) => {
    if (!packageToPurchase) {
      Alert.alert('Error', 'Please select a subscription plan.');
      return;
    }

    setIsProcessing(true);
    setProcessingStage('payment');

    try {
      // Purchase via RevenueCat IAP
      const result = await purchaseService.purchasePackage(packageToPurchase);
      
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
        // User cancelled - just reset state
        console.log('User cancelled purchase');
      } else {
        Alert.alert('Purchase Failed', result.error || 'Unable to complete purchase. Please try again.');
      }
      
      setIsProcessing(false);
      setProcessingStage('idle');
    } catch (error: any) {
      console.error('Purchase error:', error);
      Alert.alert('Error', 'Failed to process subscription. Please try again.');
      setIsProcessing(false);
      setProcessingStage('idle');
    }
  };

  // Auto-select first package when offerings load
  useEffect(() => {
    if (packages && packages.length > 0 && !selectedPackage) {
      setSelectedPackage(packages[0]);
    }
  }, [packages, selectedPackage]);

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

  if (statusLoading || packagesLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading subscription options...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Helper function to get package display name
  const getPackageName = (pkg: PurchasesPackage): string => {
    const identifier = pkg.identifier.toLowerCase();
    if (identifier.includes('annual') || identifier.includes('year')) {
      return 'Annual';
    }
    if (identifier.includes('monthly') || identifier.includes('month')) {
      return 'Monthly';
    }
    return pkg.product.title;
  };

  // Helper function to get savings text
  const getSavingsText = (pkg: PurchasesPackage): string | null => {
    const identifier = pkg.identifier.toLowerCase();
    if (identifier.includes('annual') || identifier.includes('year')) {
      return 'Save 20%';
    }
    return null;
  };

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

        {/* Subscription Plans */}
        {packages && packages.length > 0 && (
          <View style={styles.plansContainer}>
            <Text style={styles.plansTitle}>Choose Your Plan</Text>
            <View style={styles.plansGrid}>
              {packages.map((pkg) => {
                const isSelected = selectedPackage?.identifier === pkg.identifier;
                const savingsText = getSavingsText(pkg);
                
                return (
                  <TouchableOpacity
                    key={pkg.identifier}
                    style={[
                      styles.planCard,
                      isSelected && styles.planCardSelected
                    ]}
                    onPress={() => setSelectedPackage(pkg)}
                    disabled={isProcessing}
                  >
                    {savingsText && (
                      <View style={styles.savingsBadge}>
                        <Text style={styles.savingsText}>{savingsText}</Text>
                      </View>
                    )}
                    
                    <Text style={[
                      styles.planName,
                      isSelected && styles.planNameSelected
                    ]}>
                      {getPackageName(pkg)}
                    </Text>
                    
                    <Text style={[
                      styles.planPrice,
                      isSelected && styles.planPriceSelected
                    ]}>
                      {pkg.product.priceString}
                    </Text>
                    
                    <Text style={styles.planPeriod}>
                      {pkg.packageType === 'ANNUAL' ? 'per year' : 'per month'}
                    </Text>
                    
                    {isSelected && (
                      <View style={styles.selectedIndicator}>
                        <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Pricing Card - matching web exactly */}
        <Card style={styles.pricingCard}>
          <CardContent style={styles.pricingContent}>
            {/* Features List */}
            <View style={styles.featuresSection}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Pricing Display */}
            {selectedPackage && (
              <View style={styles.pricingDisplay}>
                <Text style={styles.priceAmount}>
                  {selectedPackage.product.priceString}
                </Text>
                <Text style={styles.pricePeriod}>
                  {selectedPackage.packageType === 'ANNUAL' ? 'per year' : 'per month'}
                </Text>
              </View>
            )}

            {/* Subscribe Button */}
            <Button
              style={[styles.subscribeButton, (isProcessing || !selectedPackage) && styles.subscribeButtonDisabled]}
              onPress={() => selectedPackage && handleSubscribe(selectedPackage)}
              disabled={isProcessing || !selectedPackage}
            >
              {isProcessing ? (
                <View style={styles.processingContent}>
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text style={styles.subscribeButtonText}>
                    {processingStage === 'payment' ? 'Processing Payment...' : 'Activating Subscription...'}
                  </Text>
                </View>
              ) : (
                <Text style={styles.subscribeButtonText}>
                  {selectedPackage 
                    ? `Subscribe for ${selectedPackage.product.priceString}`
                    : 'Loading...'}
                </Text>
              )}
            </Button>

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

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    paddingTop: 10,
    backgroundColor: '#ffffff',
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

  // Plans
  plansContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  plansTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  plansGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'center',
  },
  planCard: {
    flex: 1,
    maxWidth: 160,
    backgroundColor: '#f8fafc',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    position: 'relative',
    alignItems: 'center',
  },
  planCardSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  savingsBadge: {
    position: 'absolute',
    top: -10,
    right: -5,
    backgroundColor: '#10b981',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.md,
  },
  savingsText: {
    color: '#ffffff',
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
  },
  planName: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  planNameSelected: {
    color: '#1d4ed8',
  },
  planPrice: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: '700',
    color: theme.colors.foreground,
    marginBottom: 4,
  },
  planPriceSelected: {
    color: '#1d4ed8',
  },
  planPeriod: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
  },

  // Pricing Card
  pricingCard: {
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.lg,
    backgroundColor: '#ffffff',
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

  // Pricing Display
  pricingDisplay: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    backgroundColor: '#f8fafc',
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
  },
  priceAmount: {
    fontSize: theme.fontSize['3xl'],
    fontWeight: '700',
    color: theme.colors.foreground,
  },
  pricePeriod: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },

  // Buttons
  subscribeButton: {
    backgroundColor: '#1d4ed8',
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
  },
  subscribeButtonDisabled: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    color: '#ffffff',
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
  backToAppButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    backgroundColor: '#ffffff',
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