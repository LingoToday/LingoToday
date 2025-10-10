import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { theme } from '../lib/theme';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/apiClient';

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
  if (!priceTier || priceTier === 'n/a' || priceTier === 'free-trial') {
    return 'Free';
  }
  if (priceTier.startsWith('pro-')) {
    return 'Pro';
  }
  if (priceTier.startsWith('plus-')) {
    return 'Plus';
  }
  return 'Free';
}

function getPlanType(priceTier?: string): string {
  if (!priceTier || priceTier === 'n/a' || priceTier === 'free-trial') {
    return 'Free';
  }
  if (priceTier === 'pro-monthly') {
    return 'Pro (Monthly)';
  }
  if (priceTier === 'pro-yearly') {
    return 'Pro (Yearly)';
  }
  if (priceTier === 'plus-monthly') {
    return 'Plus (Monthly)';
  }
  if (priceTier === 'plus-yearly') {
    return 'Plus (Yearly)';
  }
  return 'Free';
}

function getPriceDisplay(priceTier?: string): string {
  if (!priceTier || priceTier === 'n/a' || priceTier === 'free-trial') {
    return 'Free';
  }
  if (priceTier === 'pro-monthly') {
    return '£2.49/month';
  }
  if (priceTier === 'pro-yearly') {
    return '£14.99/year';
  }
  if (priceTier === 'plus-monthly') {
    return '£16.99/month';
  }
  if (priceTier === 'plus-yearly') {
    return '£149.99/year';
  }
  return 'Free';
}

const planFeatures = {
  free: [
    "Access to basic courses",
    "Limited lessons per day"
  ],
  pro: [
    "Unlimited access to all courses",
    "Priority support and new features"
  ],
  plus: [
    "Everything in Pro",
    "Advanced analytics and personalized learning paths"
  ]
};

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const { user: authUser } = useAuth();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const response = await apiClient.getCurrentUser();
      return (response as any).data || response;
    },
    enabled: !!authUser,
  });

  const { data: subscriptionStatus, isLoading: subscriptionLoading } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription-status'],
    queryFn: async () => {
      const response = await apiClient.getSubscriptionStatus();
      return (response as any).data || response;
    },
    enabled: !!user,
  });

  const handleRestorePurchases = () => {
    Alert.alert(
      "Restore Purchases",
      "Checking for existing subscriptions...",
      [{ text: 'OK' }]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Account Deletion', 'Account deletion functionality will be implemented.');
          },
        },
      ]
    );
  };

  const handleChangePlan = () => {
    navigation.navigate('Subscribe' as never);
  };

  if (userLoading || subscriptionLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading subscription details...</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <Text style={styles.loadingText}>Please log in to view your subscription.</Text>
        </View>
      </View>
    );
  }

  const currentPlan = getPlanType(user.priceTier);
  const currentTier = getLearningTier(user.priceTier);
  const priceDisplay = getPriceDisplay(user.priceTier);
  const renewalDate = subscriptionStatus?.currentPeriodEnd 
    ? format(new Date(subscriptionStatus.currentPeriodEnd * 1000), 'MMMM d, yyyy')
    : null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.navigate('Account' as never)}
              testID="back-to-account"
            >
              <Ionicons name="arrow-back" size={16} color={theme.colors.foreground} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Subscription</Text>
          </View>
          
          <View style={styles.headerRight} />
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridContainer}>
          {/* Current Plan Card */}
          <Card style={styles.card} testID="current-plan-card">
            <CardHeader>
              <CardTitle style={styles.cardTitle}>
                <Ionicons name="diamond" size={20} color="#D97706" style={styles.cardIcon} />
                <Text style={styles.cardTitleText}>Current Plan</Text>
              </CardTitle>
            </CardHeader>
            
            <CardContent style={styles.cardContent}>
              <View style={styles.planRow}>
                <View style={styles.planInfo}>
                  <Text style={styles.infoLabel}>Plan Type</Text>
                  <View style={styles.planBadgeContainer}>
                    <Badge 
                      variant={currentTier === 'Free' ? 'secondary' : 'default'}
                      style={StyleSheet.flatten([
                        styles.planBadge,
                        currentTier === 'Pro' && styles.proBadge,
                        currentTier === 'Plus' && styles.plusBadge,
                      ])}
                      testID="plan-type"
                    >
                      <Text style={[
                        styles.planBadgeText,
                        currentTier !== 'Free' && styles.planBadgeTextWhite,
                      ]}>
                        {currentPlan}
                      </Text>
                    </Badge>
                  </View>
                </View>
                <View style={styles.priceInfo}>
                  <Text style={styles.infoLabel}>Price</Text>
                  <Text style={styles.priceValue} testID="plan-price">{priceDisplay}</Text>
                </View>
              </View>

              {renewalDate && (
                <View style={styles.renewalSection}>
                  <Text style={styles.infoLabel}>Renewal Date</Text>
                  <Text style={styles.renewalValue} testID="renewal-date">{renewalDate}</Text>
                </View>
              )}
            </CardContent>
          </Card>

          {/* Plan Features */}
          <Card style={styles.card} testID="plan-features-card">
            <CardHeader>
              <CardTitle style={styles.cardTitle}>
                <Text style={styles.cardTitleText}>What's Included</Text>
              </CardTitle>
            </CardHeader>
            
            <CardContent style={styles.cardContent}>
              <View style={styles.featuresContainer}>
                {/* Free Plan */}
                <View style={styles.featureSection}>
                  <Badge variant="secondary" style={styles.featureBadge}>
                    <Text style={styles.featureBadgeText}>Free</Text>
                  </Badge>
                  <View style={styles.featureList}>
                    {planFeatures.free.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Ionicons name="checkmark" size={16} color="#9CA3AF" />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Pro Plan */}
                <View style={styles.featureSection}>
                  <Badge style={StyleSheet.flatten([styles.featureBadge, styles.proBadge])}>
                    <Text style={StyleSheet.flatten([styles.featureBadgeText, styles.featureBadgeTextWhite])}>Pro</Text>
                  </Badge>
                  <View style={styles.featureList}>
                    {planFeatures.pro.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Ionicons name="checkmark" size={16} color="#2563EB" />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Plus Plan */}
                <View style={styles.featureSection}>
                  <Badge style={StyleSheet.flatten([styles.featureBadge, styles.plusBadge])}>
                    <Text style={StyleSheet.flatten([styles.featureBadgeText, styles.featureBadgeTextWhite])}>Plus</Text>
                  </Badge>
                  <View style={styles.featureList}>
                    {planFeatures.plus.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Ionicons name="checkmark" size={16} color="#7C3AED" />
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleChangePlan}
              testID="change-plan-button"
            >
              <Ionicons name="diamond" size={16} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Change Plan</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={handleRestorePurchases}
              testID="restore-purchases-button"
            >
              <Ionicons name="refresh" size={16} color={theme.colors.foreground} />
              <Text style={styles.secondaryButtonText}>Restore Purchases</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleDeleteAccount}
              testID="delete-account-link"
              style={styles.deleteAccountLink}
            >
              <Text style={styles.deleteAccountText}>Delete account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(249, 250, 251, 1)',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'rgba(249, 250, 251, 1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
    marginTop: 20,
  },
  headerContent: {
    maxWidth: 896,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: -1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  headerRight: {
    flex: 1,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  gridContainer: {
    maxWidth: 896,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 32,
    gap: 24,
  },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  cardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    marginRight: 8,
  },
  cardTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  cardContent: {
    padding: 0,
  },

  // Plan Section
  planRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planInfo: {
    flex: 1,
  },
  priceInfo: {
    alignItems: 'flex-end',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  planBadgeContainer: {
    marginTop: 4,
  },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E7EB',
  },
  planBadgeText: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  planBadgeTextWhite: {
    color: '#FFFFFF',
  },
  proBadge: {
    backgroundColor: '#2563EB',
  },
  plusBadge: {
    backgroundColor: '#7C3AED',
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  renewalSection: {
    marginTop: 8,
  },
  renewalValue: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
    marginTop: 4,
  },

  // Features Section
  featuresContainer: {
    gap: 24,
  },
  featureSection: {
    gap: 8,
  },
  featureBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E7EB',
  },
  featureBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  featureBadgeTextWhite: {
    color: '#FFFFFF',
  },
  featureList: {
    gap: 4,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },

  // Action Buttons
  actionsContainer: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  secondaryButtonText: {
    color: theme.colors.foreground,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteAccountLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  deleteAccountText: {
    color: '#2563EB',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
