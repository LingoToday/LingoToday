import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';

import { theme } from '../lib/theme';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/apiClient';

const { width } = Dimensions.get('window');

interface AnalyticsData {
  pageViews: { date: string; count: number; page?: string }[];
  pageBreakdown: { page: string; count: number }[];
  period: string;
  filters: {
    page?: string;
    startDate?: string;
    endDate?: string;
  };
}

const CHART_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Green  
  '#f59e0b', // Yellow
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#f97316', // Orange
  '#06b6d4', // Cyan
  '#84cc16', // Lime
];

export default function AnalyticsScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('week');
  const [selectedPage, setSelectedPage] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [showPageModal, setShowPageModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.navigate('Login' as never);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Build query parameters based on filters - matching web exactly
  const getQueryParams = () => {
    const params = new URLSearchParams();
    
    if (selectedPeriod !== 'custom') {
      params.append('period', selectedPeriod);
    }
    
    if (selectedPage !== 'all') {
      params.append('page', selectedPage);
    }
    
    if (selectedPeriod === 'custom') {
      if (startDate) {
        params.append('startDate', startDate);
      }
      if (endDate) {
        params.append('endDate', endDate);
      }
    }
    
    return params.toString();
  };

  // Fetch analytics data - matching web exactly
  const { data: analyticsData, isLoading, error, refetch } = useQuery<AnalyticsData>({
    queryKey: ['/api/analytics', selectedPeriod, selectedPage, startDate, endDate],
    queryFn: async () => {
      const params = getQueryParams();
      const url = params ? `?${params}` : '';
      const response = await apiClient.getAnalytics(url);
      return (response as any).data || response;
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Get unique pages for filter
  const uniquePages = analyticsData?.pageBreakdown?.map(item => item.page) || [];

  // Process data for charts - matching web logic exactly
  const chartData = analyticsData?.pageViews?.map(item => ({
    date: format(new Date(item.date), 'MMM dd'),
    views: parseInt(String(item.count)) || 0,
  })) || [];

  const pageBreakdownData = analyticsData?.pageBreakdown?.map((item, index) => ({
    name: item.page === '/' ? 'Home' : item.page.replace(/^\//, '').replace(/-/g, ' '),
    value: parseInt(String(item.count)) || 0,
    page: item.page,
    color: CHART_COLORS[index % CHART_COLORS.length],
  })) || [];

  // Calculate totals - matching web exactly
  const totalViews = analyticsData?.pageViews?.reduce((sum, item) => sum + (parseInt(String(item.count)) || 0), 0) || 0;
  const totalPages = uniquePages.length;
  const avgViewsPerDay = chartData.length > 0 ? Math.round(totalViews / chartData.length) : 0;

  const renderLineChart = () => {
    if (chartData.length === 0) return null;

    const maxValue = Math.max(...chartData.map(d => d.views));
    const chartHeight = 200;
    const chartWidth = width - theme.spacing.lg * 4;
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Page Views Over Time</Text>
        <Text style={styles.chartSubtitle}>
          {selectedPage === 'all' ? 'All pages' : `Views for ${selectedPage === '/' ? 'Home' : selectedPage}`}
        </Text>
        
        <View style={[styles.chart, { height: chartHeight }]}>
          <View style={styles.chartGrid}>
            {/* Y-axis labels */}
            <View style={styles.yAxisLabels}>
              <Text style={styles.yAxisLabel}>{maxValue}</Text>
              <Text style={styles.yAxisLabel}>{Math.round(maxValue * 0.75)}</Text>
              <Text style={styles.yAxisLabel}>{Math.round(maxValue * 0.5)}</Text>
              <Text style={styles.yAxisLabel}>{Math.round(maxValue * 0.25)}</Text>
              <Text style={styles.yAxisLabel}>0</Text>
            </View>
            
            {/* Chart area */}
            <View style={styles.chartArea}>
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map(i => (
                <View key={i} style={[styles.gridLine, { top: (i / 4) * (chartHeight - 40) }]} />
              ))}
              
              {/* Data points and line */}
              <View style={styles.dataContainer}>
                {chartData.map((data, index) => {
                  const x = (index / (chartData.length - 1)) * (chartWidth - 60);
                  const y = ((maxValue - data.views) / maxValue) * (chartHeight - 60);
                  
                  return (
                    <View
                      key={index}
                      style={[
                        styles.dataPoint,
                        { left: x, top: y }
                      ]}
                    />
                  );
                })}
              </View>
              
              {/* X-axis labels */}
              <View style={styles.xAxisLabels}>
                {chartData.map((data, index) => (
                  <Text key={index} style={styles.xAxisLabel}>
                    {data.date}
                  </Text>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderPieChart = () => {
    if (pageBreakdownData.length === 0) return null;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Page Views Breakdown</Text>
        <Text style={styles.chartSubtitle}>Distribution of views across different pages</Text>
        
        <View style={styles.pieChartContainer}>
          {/* Legend */}
          <View style={styles.pieChartLegend}>
            {pageBreakdownData.slice(0, 5).map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: item.color }]} />
                <Text style={styles.legendText} numberOfLines={1}>
                  {item.name}: {item.value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Analytics</Text>
          <View style={styles.headerRight} />
        </View>
        
        <View style={styles.errorContainer}>
          <Card style={styles.errorCard}>
            <CardContent style={styles.errorContent}>
              <Ionicons name="warning" size={48} color="#ef4444" />
              <Text style={styles.errorTitle}>Error</Text>
              <Text style={styles.errorText}>Failed to load analytics data</Text>
              <Button onPress={onRefresh} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - matching web exactly */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.foreground} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="book" size={16} color="#ffffff" />
            </View>
            <Text style={styles.logoText}>LingoToday</Text>
          </View>
        </View>
        
        <TouchableOpacity onPress={() => setShowAccountModal(true)} style={styles.accountButton}>
          <Ionicons name="person" size={16} color={theme.colors.foreground} />
          <Text style={styles.accountButtonText}>{user?.firstName || 'Account'}</Text>
          <Ionicons name="chevron-down" size={12} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Filters Card - matching web exactly */}
        <Card style={styles.filtersCard}>
          <CardContent style={styles.filtersContent}>
            <View style={styles.filtersHeader}>
              <Ionicons name="options" size={16} color={theme.colors.foreground} />
              <Text style={styles.filtersTitle}>Filters</Text>
            </View>
            <Text style={styles.filtersSubtitle}>Choose time period and page to analyze</Text>
            
            <View style={styles.filtersRow}>
              {/* Time Period Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Time Period</Text>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => setShowDateModal(true)}
                >
                  <Text style={styles.filterButtonText}>
                    {selectedPeriod === 'day' ? 'Today' :
                     selectedPeriod === 'week' ? 'Last 7 Days' :
                     selectedPeriod === 'month' ? 'Last 30 Days' :
                     'Custom Range'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={theme.colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              {/* Page Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Page</Text>
                <TouchableOpacity
                  style={styles.filterButton}
                  onPress={() => setShowPageModal(true)}
                >
                  <Text style={styles.filterButtonText} numberOfLines={1}>
                    {selectedPage === 'all' ? 'All Pages' : 
                     selectedPage === '/' ? 'Home' : selectedPage.replace(/^\//, '')}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={theme.colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Custom Date Inputs */}
            {selectedPeriod === 'custom' && (
              <View style={styles.customDateRow}>
                <View style={styles.dateInputGroup}>
                  <Text style={styles.filterLabel}>Start Date</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.colors.mutedForeground}
                  />
                </View>
                <View style={styles.dateInputGroup}>
                  <Text style={styles.filterLabel}>End Date</Text>
                  <TextInput
                    style={styles.dateInput}
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.colors.mutedForeground}
                  />
                </View>
              </View>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats - matching web exactly */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Total Views</Text>
                <Ionicons name="eye" size={20} color="#3b82f6" />
              </View>
              <Text style={styles.statValue}>{totalViews.toLocaleString()}</Text>
            </CardContent>
          </Card>

          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Unique Pages</Text>
                <Ionicons name="bar-chart" size={20} color="#10b981" />
              </View>
              <Text style={styles.statValue}>{totalPages}</Text>
            </CardContent>
          </Card>

          <Card style={styles.statCard}>
            <CardContent style={styles.statContent}>
              <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Avg. Views/Day</Text>
                <Ionicons name="trending-up" size={20} color="#8b5cf6" />
              </View>
              <Text style={styles.statValue}>{avgViewsPerDay.toLocaleString()}</Text>
            </CardContent>
          </Card>
        </View>

        {/* Charts */}
        <Card style={styles.chartCard}>
          <CardContent style={styles.chartCardContent}>
            {renderLineChart()}
          </CardContent>
        </Card>

        <Card style={styles.chartCard}>
          <CardContent style={styles.chartCardContent}>
            {renderPieChart()}
          </CardContent>
        </Card>

        {/* Page Details Table - matching web exactly */}
        <Card style={styles.tableCard}>
          <CardContent style={styles.tableContent}>
            <Text style={styles.tableTitle}>Page Details</Text>
            <Text style={styles.tableSubtitle}>Detailed breakdown of page views</Text>
            
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Page</Text>
                <Text style={[styles.tableHeaderCell, styles.tableHeaderCellRight]}>Views</Text>
                <Text style={[styles.tableHeaderCell, styles.tableHeaderCellRight]}>%</Text>
              </View>
              
              {pageBreakdownData.map((item, index) => (
                <View key={item.page} style={styles.tableRow}>
                  <View style={styles.tablePageCell}>
                    <View style={[styles.tableColorDot, { backgroundColor: item.color }]} />
                    <View style={styles.tablePageInfo}>
                      <Text style={styles.tablePageName}>{item.name}</Text>
                      <Badge style={styles.tablePageBadge}>
                        <Text style={styles.tablePageBadgeText}>{item.page}</Text>
                      </Badge>
                    </View>
                  </View>
                  <Text style={[styles.tableCell, styles.tableCellRight]}>{item.value.toLocaleString()}</Text>
                  <Text style={[styles.tableCell, styles.tableCellRight]}>
                    {totalViews > 0 ? `${Math.round((item.value / totalViews) * 100)}%` : '0%'}
                  </Text>
                </View>
              ))}
              
              {pageBreakdownData.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons name="eye" size={48} color={theme.colors.mutedForeground} />
                  <Text style={styles.emptyStateText}>No page views data available for the selected period</Text>
                </View>
              )}
            </View>
          </CardContent>
        </Card>
      </ScrollView>

      {/* Period Selection Modal */}
      <Modal visible={showDateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Time Period</Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalOptions}>
              {[
                { key: 'day', label: 'Today' },
                { key: 'week', label: 'Last 7 Days' },
                { key: 'month', label: 'Last 30 Days' },
                { key: 'custom', label: 'Custom Range' },
              ].map((period) => (
                <TouchableOpacity
                  key={period.key}
                  style={[
                    styles.modalOption,
                    selectedPeriod === period.key && styles.modalOptionActive
                  ]}
                  onPress={() => {
                    setSelectedPeriod(period.key);
                    setShowDateModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    selectedPeriod === period.key && styles.modalOptionTextActive
                  ]}>
                    {period.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Page Selection Modal */}
      <Modal visible={showPageModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Page</Text>
              <TouchableOpacity onPress={() => setShowPageModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              <View style={styles.modalOptions}>
                <TouchableOpacity
                  style={[
                    styles.modalOption,
                    selectedPage === 'all' && styles.modalOptionActive
                  ]}
                  onPress={() => {
                    setSelectedPage('all');
                    setShowPageModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText,
                    selectedPage === 'all' && styles.modalOptionTextActive
                  ]}>
                    All Pages
                  </Text>
                </TouchableOpacity>
                
                {uniquePages.map((page) => (
                  <TouchableOpacity
                    key={page}
                    style={[
                      styles.modalOption,
                      selectedPage === page && styles.modalOptionActive
                    ]}
                    onPress={() => {
                      setSelectedPage(page);
                      setShowPageModal(false);
                    }}
                  >
                    <Text style={[
                      styles.modalOptionText,
                      selectedPage === page && styles.modalOptionTextActive
                    ]}>
                      {page === '/' ? 'Home' : page.replace(/^\//, '')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Account Modal */}
      <Modal visible={showAccountModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Account</Text>
              <TouchableOpacity onPress={() => setShowAccountModal(false)}>
                <Ionicons name="close" size={24} color={theme.colors.foreground} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>
                {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.firstName || 'User'}
              </Text>
              <Text style={styles.accountEmail}>{user?.email}</Text>
            </View>
            
            <View style={styles.modalOptions}>
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setShowAccountModal(false);
                  navigation.navigate('Account' as never);
                }}
              >
                <Ionicons name="person" size={16} color={theme.colors.foreground} />
                <Text style={styles.modalOptionText}>Account Settings</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalOption, styles.logoutOption]}
                onPress={() => {
                  setShowAccountModal(false);
                  handleLogout();
                }}
              >
                <Ionicons name="log-out" size={16} color="#ef4444" />
                <Text style={[styles.modalOptionText, styles.logoutText]}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#3b82f6',
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  logoText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.foreground,
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  accountButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },
  headerTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  headerRight: {
    width: 40,
  },

  // Loading/Error
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
    padding: theme.spacing.lg,
  },
  errorCard: {
    borderColor: '#fee2e2',
  },
  errorContent: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  errorTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '600',
    color: '#dc2626',
  },
  errorText: {
    fontSize: theme.fontSize.base,
    color: '#dc2626',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: theme.spacing.md,
  },
  retryButtonText: {
    color: '#ffffff',
  },

  // Content
  content: {
    flex: 1,
  },

  // Filters
  filtersCard: {
    margin: theme.spacing.lg,
    backgroundColor: '#ffffff',
  },
  filtersContent: {
    gap: theme.spacing.md,
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  filtersTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  filtersSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  filterGroup: {
    flex: 1,
  },
  filterLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#ffffff',
  },
  filterButtonText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    flex: 1,
  },
  customDateRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  dateInputGroup: {
    flex: 1,
  },
  dateInput: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: theme.borderRadius.md,
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  statContent: {
    paddingVertical: theme.spacing.lg,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  statLabel: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.foreground,
  },
  statValue: {
    fontSize: theme.fontSize['2xl'],
    fontWeight: '700',
    color: theme.colors.foreground,
  },

  // Charts
  chartCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    backgroundColor: '#ffffff',
  },
  chartCardContent: {
    paddingVertical: theme.spacing.lg,
  },
  chartContainer: {
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  chartSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  chart: {
    width: '100%',
    position: 'relative',
  },
  chartGrid: {
    flexDirection: 'row',
  },
  yAxisLabels: {
    justifyContent: 'space-between',
    paddingRight: theme.spacing.sm,
    width: 40,
  },
  yAxisLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    textAlign: 'right',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#f3f4f6',
  },
  dataContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 20,
  },
  dataPoint: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.primary,
  },
  xAxisLabels: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xAxisLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },
  pieChartContainer: {
    alignItems: 'center',
  },
  pieChartLegend: {
    gap: theme.spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    flex: 1,
  },

  // Table
  tableCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    backgroundColor: '#ffffff',
  },
  tableContent: {
    paddingVertical: theme.spacing.lg,
  },
  tableTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: theme.spacing.xs,
  },
  tableSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
    marginBottom: theme.spacing.lg,
  },
  table: {
    gap: theme.spacing.xs,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableHeaderCell: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.foreground,
    flex: 1,
  },
  tableHeaderCellRight: {
    textAlign: 'right',
    flex: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  tablePageCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  tableColorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tablePageInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  tablePageName: {
    fontSize: theme.fontSize.sm,
    fontWeight: '500',
    color: theme.colors.foreground,
  },
  tablePageBadge: {
    alignSelf: 'flex-start',
  },
  tablePageBadgeText: {
    fontSize: theme.fontSize.xs,
  },
  tableCell: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.foreground,
    flex: 0.5,
  },
  tableCellRight: {
    textAlign: 'right',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  emptyStateText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.mutedForeground,
    textAlign: 'center',
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: theme.borderRadius.xl,
    borderTopRightRadius: theme.borderRadius.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  modalScrollView: {
    maxHeight: 300,
  },
  modalOptions: {
    padding: theme.spacing.lg,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  modalOptionActive: {
    backgroundColor: '#f8f9ff',
  },
  modalOptionText: {
    fontSize: theme.fontSize.base,
    color: theme.colors.foreground,
    flex: 1,
  },
  modalOptionTextActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  accountInfo: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  accountName: {
    fontSize: theme.fontSize.base,
    fontWeight: '500',
    color: theme.colors.foreground,
  },
  accountEmail: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.mutedForeground,
  },
  logoutOption: {
    marginTop: theme.spacing.md,
  },
  logoutText: {
    color: '#ef4444',
  },
});