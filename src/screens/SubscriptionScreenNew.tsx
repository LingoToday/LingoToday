import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../lib/theme';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
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
  if (priceTier === 'pro-monthly') return '£2.49/month';
  if (priceTier === 'pro-yearly') return '£14.99/year';
  if (priceTier === 'plus-monthly') return '£16.99/month';
  if (priceTier === 'plus-yearly') return '£149.99/year';
  return 'Free';
}

const planFeatures = {
  free: [
    'Access to basic courses',
    'Limited lessons per day',
  ],
  pro: [
    'Unlimited access to all courses',
    'Priority support and new features',
  ],
  plus: [
    'Everything in Pro',
    'Advanced analytics and personalized learning paths',
  ],
};

export default function SubscriptionScreenNew() {
  const navigation = useNavigation();

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
      // Fallback to generic request if a helper is not available
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

  const handleRestorePurchases = () => {
    Alert.alert('Restore Purchases', 'Checking for existing subscriptions...');
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
          <TouchableOpacity style={styles.backButton} onPress={handleBack} testID="back-to-account">
            <Ionicons name="arrow-back" size={16} color={theme.colors.foreground} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Subscription</Text>
          </View>
        </View>
      </View>

      <View style={styles.contentWrapper}>
        <View style={styles.stack}>
          {/* Current Plan Card */}
          <Card testID="current-plan-card" style={styles.card}>
            <CardHeader>
              <CardTitle style={styles.cardTitle}>
                <Ionicons name="diamond" size={20} color="#D97706" style={{ marginRight: 8 }} />
                <Text style={styles.cardTitleText}>Current Plan</Text>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <View style={styles.rowBetween}>
                <View>
                  <Text style={styles.muted}>Plan Type</Text>
                  <View style={styles.row}>
                    <Badge
                      variant={currentTier === 'Free' ? 'secondary' : 'default'}
                      style={StyleSheet.flatten([
                        styles.badge,
                        currentTier === 'Pro' && styles.badgePro,
                        currentTier === 'Plus' && styles.badgePlus,
                      ])}
                      testID="plan-type"
                    >
                      <Text style={[styles.badgeText, currentTier !== 'Free' && styles.badgeTextWhite]}>
                        {currentPlan}
                      </Text>
                    </Badge>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.muted}>Price</Text>
                  <Text style={styles.price} testID="plan-price">{priceDisplay}</Text>
                </View>
              </View>

              {renewalDate && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.muted}>Renewal Date</Text>
                  <Text style={styles.renewal} testID="renewal-date">{renewalDate}</Text>
                </View>
              )}
            </CardContent>
          </Card>

          {/* Plan Features */}
          <Card testID="plan-features-card" style={styles.card}>
            <CardHeader>
              <CardTitle style={styles.cardTitle}>
                <Text style={styles.cardTitleText}>What's Included</Text>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Free */}
              <View style={{ marginBottom: 16 }}>
                <Badge variant="secondary">
                  <Text style={styles.badgeText}>Free</Text>
                </Badge>
                <View style={{ height: 8 }} />
                {planFeatures.free.map((feature, idx) => (
                  <View key={`free-${idx}`} style={styles.featureRow}>
                    <Ionicons name="checkmark" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {/* Pro */}
              <View style={{ marginBottom: 16 }}>
                <Badge style={StyleSheet.flatten([styles.badge, styles.badgePro])}>
                  <Text style={[styles.badgeText, styles.badgeTextWhite]}>Pro</Text>
                </Badge>
                <View style={{ height: 8 }} />
                {planFeatures.pro.map((feature, idx) => (
                  <View key={`pro-${idx}`} style={styles.featureRow}>
                    <Ionicons name="checkmark" size={16} color="#2563EB" style={{ marginRight: 8 }} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {/* Plus */}
              <View>
                <Badge style={StyleSheet.flatten([styles.badge, styles.badgePlus])}>
                  <Text style={[styles.badgeText, styles.badgeTextWhite]}>Plus</Text>
                </Badge>
                <View style={{ height: 8 }} />
                {planFeatures.plus.map((feature, idx) => (
                  <View key={`plus-${idx}`} style={styles.featureRow}>
                    <Ionicons name="checkmark" size={16} color="#7C3AED" style={{ marginRight: 8 }} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <View style={{ gap: 12 }}>
            <Button onPress={handleChangePlan} testID="change-plan-button">
              <View style={styles.buttonContent}>
                <Ionicons name="diamond" size={16} color="#FFFFFF" />
                <Text style={styles.buttonText}>Change Plan</Text>
              </View>
            </Button>

            <Button variant="outline" onPress={handleRestorePurchases} testID="restore-purchases-button">
              <View style={styles.buttonContent}>
                <Ionicons name="refresh" size={16} color={theme.colors.foreground} />
                <Text style={[styles.buttonText, { color: theme.colors.foreground }]}>Restore Purchases</Text>
              </View>
            </Button>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(249, 250, 251, 1)' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(249, 250, 251, 1)' },
  loadingText: { marginTop: 12, color: '#6B7280', fontSize: 16 },

  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
      android: { elevation: 2 },
    }),
    marginTop: 20,
  },
  headerContent: {
    maxWidth: 896, alignSelf: 'center', width: '100%',
    paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', minHeight: 60,
  },
  backButton: { paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6 },
  headerCenter: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: -1 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginTop: 10 },

  contentWrapper: { maxWidth: 896, alignSelf: 'center', width: '100%', paddingHorizontal: 16, paddingVertical: 24 },
  stack: { gap: 16 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8 }, android: { elevation: 3 } }),
  },
  cardTitle: { flexDirection: 'row', alignItems: 'center' },
  cardTitleText: { fontSize: 18, fontWeight: '600', color: '#111827' },

  muted: { fontSize: 12, color: '#6B7280' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price: { fontSize: 24, fontWeight: '700', color: '#111827' },
  renewal: { fontSize: 16, fontWeight: '500', color: '#111827' },

  badge: { backgroundColor: '#E5E7EB', alignSelf: 'flex-start' },
  badgePro: { backgroundColor: '#2563EB' },
  badgePlus: { backgroundColor: '#7C3AED' },
  badgeText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  badgeTextWhite: { color: '#FFFFFF' },

  featureRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  featureText: { color: '#4B5563', fontSize: 14 },

  buttonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
});