import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { theme } from '../lib/theme';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/apiClient';

// Type definitions
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  priceTier?: string;
  authProvider?: string;
}

interface SubscriptionStatus {
  isProUser: boolean;
  status: string;
  currentPeriodEnd?: number;
  subscriptionId?: string;
}

// Helper functions
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
  const { user: authUser, logout } = useAuth();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const response = await apiClient.getCurrentUser();
      return (response as any).data || response;
    },
    enabled: !!authUser,
  });

  // Fetch subscription status
  const { data: subscriptionStatus, isLoading: subscriptionLoading } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription-status'],
    queryFn: async () => {
      const response = await fetch('/api/subscription-status', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch subscription status');
      return response.json();
    },
    enabled: !!user,
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete account');
      }
      
      return response.json();
    },
    onSuccess: async () => {
      Alert.alert(
        'Account Deleted',
        'Your account has been successfully deleted.',
        [
          {
            text: 'OK',
            onPress: async () => {
              await logout();
            },
          },
        ]
      );
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to delete account');
    },
  });

  const handleRestorePurchases = () => {
    Alert.alert(
      'Restore Purchases',
      'Checking for existing subscriptions...',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteAccount = () => {
    if (!user) return;

    // Check if user is using local auth (has password)
    if (user.authProvider !== 'local') {
      Alert.alert(
        'Cannot Delete Account',
        'Account deletion is only available for accounts created with email and password. Please contact support for assistance.',
        [{ text: 'OK' }]
      );
      return;
    }

    setShowDeleteDialog(true);
  };

  const confirmDeleteAccount = () => {
    if (!deletePassword.trim()) {
      Alert.alert('Error', 'Please enter your password to confirm account deletion');
      return;
    }

    Alert.alert(
      'Delete Account',
      'Are you absolutely sure? This action cannot be undone and all your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteAccountMutation.mutate(deletePassword);
            setShowDeleteDialog(false);
            setDeletePassword('');
          },
        },
      ]
    );
  };

  // Loading state
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

  // Not logged in state
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
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => (navigation.navigate as any)('MainTabs', { screen: 'Profile' })}
            testID="back-to-account"
          >
            <Ionicons name="arrow-back" size={16} color={theme.colors.foreground} />
            <Text style={styles.backButtonText}>Back to Account</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Subscription</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cardsContainer}>
          {/* Current Plan Card */}
          <Card style={styles.card} testID="current-plan-card">
            <CardHeader>
              <CardTitle style={styles.cardTitle}>
                <Ionicons name="diamond" size={20} color="#D97706" style={styles.cardIcon} />
                <Text style={styles.cardTitleText}>Current Plan</Text>
              </CardTitle>
            </CardHeader>
            
            <CardContent style={styles.cardContent}>
              <View style={styles.planDetails}>
                <View style={styles.planInfo}>
                  <Text style={styles.planLabel}>Plan Type</Text>
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
                
                <View style={styles.planPrice}>
                  <Text style={styles.planLabel}>Price</Text>
                  <Text style={styles.planPriceValue} testID="plan-price">{priceDisplay}</Text>
                </View>
              </View>

              {renewalDate && (
                <View style={styles.renewalInfo}>
                  <Text style={styles.planLabel}>Renewal Date</Text>
                  <Text style={styles.renewalDate} testID="renewal-date">{renewalDate}</Text>
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
                  <Text style={[styles.featureBadgeText, styles.featureBadgeTextWhite]}>Pro</Text>
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
                  <Text style={[styles.featureBadgeText, styles.featureBadgeTextWhite]}>Plus</Text>
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
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <TouchableOpacity 
              style={styles.changePlanButton}
              onPress={() => navigation.navigate('Subscribe' as never)}
              testID="change-plan-button"
            >
              <Ionicons name="diamond" size={16} color="#FFFFFF" />
              <Text style={styles.changePlanButtonText}>Change Plan</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.restoreButton}
              onPress={handleRestorePurchases}
              testID="restore-purchases-button"
            >
              <Ionicons name="refresh" size={16} color={theme.colors.foreground} />
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            </TouchableOpacity>

            {user.authProvider === 'local' && (
              <TouchableOpacity 
                style={styles.deleteButton}
                onPress={handleDeleteAccount}
                testID="delete-account-button"
              >
                <Ionicons name="trash-outline" size={16} color="#DC2626" />
                <Text style={styles.deleteButtonText}>Delete Account</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Delete Account Dialog */}
          {showDeleteDialog && (
            <View style={styles.dialogOverlay}>
              <View style={styles.dialogContainer}>
                <Text style={styles.dialogTitle}>Delete Account</Text>
                <Text style={styles.dialogMessage}>
                  Enter your password to confirm account deletion. This action cannot be undone.
                </Text>
                
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                  autoCapitalize="none"
                  testID="delete-password-input"
                />
                
                <View style={styles.dialogButtons}>
                  <TouchableOpacity 
                    style={styles.dialogCancelButton}
                    onPress={() => {
                      setShowDeleteDialog(false);
                      setDeletePassword('');
                    }}
                  >
                    <Text style={styles.dialogCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.dialogDeleteButton}
                    onPress={confirmDeleteAccount}
                    disabled={deleteAccountMutation.isPending}
                  >
                    {deleteAccountMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.dialogDeleteButtonText}>Delete</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.foreground,
    fontWeight: '500',
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

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  cardsContainer: {
    maxWidth: 896,
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 32,
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

  // Plan Details
  planDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planInfo: {
    flex: 1,
  },
  planLabel: {
    fontSize: 14,
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
  planPrice: {
    alignItems: 'flex-end',
  },
  planPriceValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  renewalInfo: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  renewalDate: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
    marginTop: 4,
  },

  // Features
  featureSection: {
    marginBottom: 24,
  },
  featureBadge: {
    alignSelf: 'flex-start',
    marginBottom: 8,
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

  // Actions
  actionsContainer: {
    gap: 12,
  },
  changePlanButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  changePlanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  restoreButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  restoreButtonText: {
    color: theme.colors.foreground,
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '500',
  },

  // Delete Dialog
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  dialogContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  dialogMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    marginBottom: 20,
  },
  dialogButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  dialogCancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dialogCancelButtonText: {
    color: '#4B5563',
    fontSize: 16,
    fontWeight: '500',
  },
  dialogDeleteButton: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  dialogDeleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});
