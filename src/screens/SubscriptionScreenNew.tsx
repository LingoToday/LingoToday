import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

import { theme } from '../lib/theme';
import { Button } from '../components/ui/Button';
import { apiClient } from '../lib/apiClient';
import { purchaseService } from '../services/purchaseService';
import { useAuth } from '../hooks/useAuth';
import { getPriceDisplay } from '../constants/pricing';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  priceTier?: string;
}

function getPlanType(priceTier?: string): string {
  if (!priceTier || priceTier === 'n/a' || priceTier === 'free-trial') return 'Free';
  if (priceTier === 'pro-monthly') return 'Pro (Monthly)';
  if (priceTier === 'pro-yearly') return 'Pro (Yearly)';
  if (priceTier === 'plus-monthly') return 'Plus (Monthly)';
  if (priceTier === 'plus-yearly') return 'Plus (Yearly)';
  return 'Free';
}


const freeFeatures = [
  'Access to basic courses',
  'Limited lessons per day',
];

const proFeatures = [
  'Unlimited premium video lessons',
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
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/user'],
    queryFn: async () => {
      const res = await apiClient.getCurrentUser?.();
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
        try {
          await apiClient.getCurrentUser();
          await queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
        } catch (backendError) {
          console.warn('⚠️ Failed to refresh user after restore:', backendError);
        }

        Alert.alert(
          '✅ Purchase Restored',
          'Your subscription has been restored successfully!',
          [{ text: 'OK' }]
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
    if (Platform.OS === 'web') {
      Alert.alert(
        'Not Available on Web',
        'Please manage your subscription through the App Store or Google Play Store on your mobile device.'
      );
      return;
    }
    
    try {
      if (Platform.OS === 'ios') {
        await WebBrowser.openBrowserAsync('https://apps.apple.com/account/subscriptions');
      } else if (Platform.OS === 'android') {
        await WebBrowser.openBrowserAsync('https://play.google.com/store/account/subscriptions');
      } else {
        Alert.alert(
          'Not Supported',
          'Subscription management is only available on iOS and Android devices.'
        );
      }
    } catch (error) {
      console.error('Error opening subscription management:', error);
      Alert.alert(
        'Unable to Open',
        'Could not open subscription management. Please try again later.'
      );
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
                    setIsDeletingAccount(true);
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
                      setIsDeletingAccount(false);
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

  if (userLoading) {
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

  const planType = getPlanType(user.priceTier);
  const priceDisplay = getPriceDisplay(user.priceTier);

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack} testID="back-to-account">
              <Ionicons name="chevron-back" size={24} color={theme.colors.foreground} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Subscription</Text>
            <View style={styles.backButton} />
          </View>

          {/* Current Plan Card */}
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planHeaderText}>Current Plan</Text>
            </View>
            <View style={styles.planDetails}>
              <View style={styles.planTypeContainer}>
                <Text style={styles.planTypeLabel}>Plan Type</Text>
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>{planType}</Text>
                </View>
              </View>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Price</Text>
                <Text style={styles.priceValue}>{priceDisplay}</Text>
              </View>
            </View>
          </View>

          {/* What's Included Section */}
          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>What's Included</Text>
            
            {/* Free Tier */}
            <View style={styles.tierContainer}>
              <View style={styles.tierBadge}>
                <Text style={styles.tierBadgeTextFree}>Free</Text>
              </View>
              {freeFeatures.map((feature, index) => (
                <View key={`free-${index}`} style={styles.featureRow}>
                  <Ionicons name="checkmark" size={18} color={theme.colors.mutedForeground} style={styles.checkmark} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>

            {/* Pro Tier */}
            <View style={styles.tierContainer}>
              <View style={[styles.tierBadge, styles.tierBadgePro]}>
                <Text style={styles.tierBadgeTextPro}>Pro</Text>
              </View>
              {proFeatures.map((feature, index) => (
                <View key={`pro-${index}`} style={styles.featureRow}>
                  <Ionicons name="checkmark" size={18} color={theme.colors.mutedForeground} style={styles.checkmark} />
                  <Text style={styles.featureText}>{feature}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <Button
              title="Change Plan"
              onPress={handleChangePlan}
              variant="default"
              style={styles.changePlanButton}
            />
            
            <Button
              title="Restore Purchases"
              onPress={handleRestorePurchases}
              variant="outline"
              style={styles.actionButton}
            />
            
            <Button
              title="Manage Subscription"
              onPress={handleManageSubscription}
              variant="outline"
              style={styles.actionButton}
            />
          </View>

          {/* Footer Links */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleDeleteAccount}>
              <Text style={styles.deleteAccountText}>Delete Account</Text>
            </TouchableOpacity>
            
            <View style={styles.legalLinks}>
              <TouchableOpacity onPress={handleOpenTerms}>
                <Text style={styles.legalLinkText}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={styles.legalSeparator}> • </Text>
              <TouchableOpacity onPress={handleOpenPrivacy}>
                <Text style={styles.legalLinkText}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Loading Overlay for Account Deletion */}
      <Modal
        visible={isDeletingAccount}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.modalText}>Deleting account...</Text>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 40,
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
    fontSize: theme.fontSize.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  
  // Current Plan Card
  planCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
  },
  planHeader: {
    marginBottom: 16,
  },
  planHeaderText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  planDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planTypeContainer: {
    flex: 1,
  },
  planTypeLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginBottom: 8,
  },
  planBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  planBadgeText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.primaryForeground,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.foreground,
  },
  
  // What's Included Card
  featuresCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
  },
  featuresTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: 20,
  },
  tierContainer: {
    marginBottom: 20,
  },
  tierBadge: {
    backgroundColor: theme.colors.muted,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  tierBadgePro: {
    backgroundColor: theme.colors.primary,
  },
  tierBadgeTextFree: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.mutedForeground,
  },
  tierBadgeTextPro: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
    color: theme.colors.primaryForeground,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingLeft: 4,
  },
  checkmark: {
    marginRight: 8,
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    lineHeight: theme.fontSize.sm * 1.5,
  },
  
  // Action Buttons
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  changePlanButton: {
    marginBottom: 12,
  },
  actionButton: {
    marginBottom: 12,
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  deleteAccountText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginBottom: 16,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legalLinkText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  legalSeparator: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  
  // Loading Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.xl,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    minWidth: 200,
  },
  modalText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    fontWeight: '600',
  },
});
