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

import { theme } from '../lib/theme';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { apiClient } from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';

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
  const [currency, setCurrency] = useState<'GBP' | 'USD'>('GBP');

  const handleGoBack = () => {
    navigation.goBack();
  };

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
      const priceId = currency === 'GBP' ? 'price_1QKNVhP7t8YNNmwE0kglMKTq' : 'price_usd_monthly';
      const response = await apiClient.createSubscription(priceId);
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

  // Poll subscription status until webhook upgrades account - matching web exactly
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

  const handleSubscribe = async () => {
    setIsProcessing(true);
    setProcessingStage('payment');

    try {
      // In a real app, this would integrate with Stripe or another payment processor
      // For now, simulate the payment process
      
      Alert.alert(
        'Payment Required',
        'This would process payment with Stripe. Integration needed for production.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setIsProcessing(false);
              setProcessingStage('idle');
            }
          },
          {
            text: 'Simulate Success',
            onPress: async () => {
              setProcessingStage('activating');
              
              // Simulate webhook processing
              Alert.alert(
                'Payment Successful',
                'Activating your Pro subscription...',
                [{ text: 'OK' }]
              );

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
                    onPress: () => navigation.navigate('Dashboard' as never) 
                  }]
                );
              } else {
                Alert.alert(
                  'Payment Processed',
                  'Your payment was successful. If you don\'t see Pro features immediately, please refresh the app in a few minutes.',
                  [{ 
                    text: 'OK', 
                    onPress: () => navigation.navigate('Dashboard' as never) 
                  }]
                );
              }
              
              setIsProcessing(false);
              setProcessingStage('idle');
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process subscription. Please try again.');
      setIsProcessing(false);
      setProcessingStage('idle');
    }
  };

  // Redirect if already pro - matching web exactly
  useEffect(() => {
    if (subscriptionStatus && subscriptionStatus.isProUser) {
      Alert.alert(
        'Already Subscribed',
        'You\'re already a Pro Learner! Redirecting to dashboard...',
        [{ 
          text: 'OK', 
          onPress: () => navigation.navigate('Dashboard' as never) 
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
          <Text style={styles.loadingText}>Setting up your subscription...</Text>
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

        {/* Currency Toggle - matching web desktop functionality */}
        <View style={styles.currencyContainer}>
          <Text style={styles.currencyLabel}>Currency:</Text>
          <View style={styles.currencyToggle}>
            <TouchableOpacity
              style={[
                styles.currencyOption,
                currency === 'GBP' && styles.currencyOptionActive
              ]}
              onPress={() => setCurrency('GBP')}
            >
              <Text style={[
                styles.currencyOptionText,
                currency === 'GBP' && styles.currencyOptionTextActive
              ]}>
                GBP (£)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.currencyOption,
                currency === 'USD' && styles.currencyOptionActive
              ]}
              onPress={() => setCurrency('USD')}
            >
              <Text style={[
                styles.currencyOptionText,
                currency === 'USD' && styles.currencyOptionTextActive
              ]}>
                USD ($)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

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
            <View style={styles.pricingDisplay}>
              <Text style={styles.priceAmount}>
                {currency === 'GBP' ? '£2.49' : '$2.99'}
              </Text>
              <Text style={styles.pricePeriod}>per month</Text>
            </View>

            {/* Subscribe Button */}
            <Button
              style={[styles.subscribeButton, isProcessing && styles.subscribeButtonDisabled]}
              onPress={handleSubscribe}
              disabled={isProcessing}
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
                  Subscribe for {currency === 'GBP' ? '£2.49' : '$2.99'}/month
                </Text>
              )}
            </Button>

            {/* Back Button - matching web */}
            <Button
              style={styles.backToAppButton}
              onPress={() => navigation.navigate('Dashboard' as never)}
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

  // Currency Toggle
  currencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  currencyLabel: {
    fontSize: theme.fontSize.base,
    fontWeight: '500',
    color: theme.colors.foreground,
    marginRight: theme.spacing.md,
  },
  currencyToggle: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: theme.borderRadius.lg,
    padding: 2,
  },
  currencyOption: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  currencyOptionActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  currencyOptionText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.mutedForeground,
  },
  currencyOptionTextActive: {
    color: theme.colors.foreground,
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