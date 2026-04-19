import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { colors } from '../../theme/colors';
import { adminAPI } from '../../services/api';

const chartWidth = Dimensions.get('window').width - 32;

const AnalyticsScreen = ({ navigation }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await adminAPI.getAnalytics();
      const data = res.data;
      setAnalyticsData(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load analytics');
      console.error('Error fetching analytics:', error);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    setLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  }, [fetchAnalytics]);

  // Mock data for charts
  const revenueData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [
          analyticsData?.revenueByDay?.[0] || 1200,
          analyticsData?.revenueByDay?.[1] || 1500,
          analyticsData?.revenueByDay?.[2] || 1100,
          analyticsData?.revenueByDay?.[3] || 1800,
          analyticsData?.revenueByDay?.[4] || 2000,
          analyticsData?.revenueByDay?.[5] || 1600,
          analyticsData?.revenueByDay?.[6] || 1400,
        ],
        strokeWidth: 2,
      },
    ],
  };

  const orderStatusData = {
    labels: ['Pending', 'Confirmed', 'Preparing', 'Delivered', 'Cancelled'],
    datasets: [
      {
        data: [
          analyticsData?.ordersByStatus?.pending || 45,
          analyticsData?.ordersByStatus?.confirmed || 120,
          analyticsData?.ordersByStatus?.preparing || 78,
          analyticsData?.ordersByStatus?.delivered || 420,
          analyticsData?.ordersByStatus?.cancelled || 25,
        ],
      },
    ],
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>Platform performance metrics</Text>
        </View>

        {/* KPI Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Icon name="dollar-sign" size={24} color={colors.primary} />
              <Text style={styles.kpiLabel}>Total Revenue</Text>
              <Text style={styles.kpiValue}>
                ${(analyticsData?.totalRevenue || 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Icon name="package" size={24} color={colors.success} />
              <Text style={styles.kpiLabel}>Total Orders</Text>
              <Text style={styles.kpiValue}>{analyticsData?.totalOrders || 0}</Text>
            </View>
          </View>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Icon name="trending-up" size={24} color={colors.secondary} />
              <Text style={styles.kpiLabel}>Avg Order Value</Text>
              <Text style={styles.kpiValue}>
                ${(analyticsData?.avgOrderValue || 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.kpiCard}>
              <Icon name="users" size={24} color="#f57c00" />
              <Text style={styles.kpiLabel}>Active Users</Text>
              <Text style={styles.kpiValue}>{analyticsData?.activeUsers || 0}</Text>
            </View>
          </View>
        </View>

        {/* Revenue Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Revenue Over Time</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={revenueData}
              width={chartWidth}
              height={220}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                color: () => colors.primary,
                strokeWidth: 2,
                style: {
                  borderRadius: 8,
                },
                propsForDots: {
                  r: 4,
                  strokeWidth: 2,
                  stroke: colors.primary,
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        </View>

        {/* Order Status Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.chartTitle}>Orders by Status</Text>
          <View style={styles.chartContainer}>
            <BarChart
              data={orderStatusData}
              width={chartWidth}
              height={220}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                color: () => colors.secondary,
                strokeWidth: 2,
                style: {
                  borderRadius: 8,
                },
              }}
              style={styles.chart}
            />
          </View>
        </View>

        {/* Performance Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Stats</Text>

          <View style={styles.statItem}>
            <View style={styles.statLeft}>
              <Icon name="zap" size={20} color={colors.primary} />
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Avg Delivery Time</Text>
                <Text style={styles.statValue}>
                  {analyticsData?.avgDeliveryTime || '—'} min
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statItem}>
            <View style={styles.statLeft}>
              <Icon name="star" size={20} color="#ffc107" />
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Avg Rating</Text>
                <Text style={styles.statValue}>
                  {analyticsData?.avgRating || '—'} / 5.0
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statItem}>
            <View style={styles.statLeft}>
              <Icon name="percent" size={20} color={colors.success} />
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Delivery Success Rate</Text>
                <Text style={styles.statValue}>
                  {(analyticsData?.successRate || 0).toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statItem}>
            <View style={styles.statLeft}>
              <Icon name="users" size={20} color={colors.secondary} />
              <View style={styles.statContent}>
                <Text style={styles.statLabel}>Customer Retention</Text>
                <Text style={styles.statValue}>
                  {(analyticsData?.retentionRate || 0).toFixed(1)}%
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Traffic Sources */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Traffic Sources</Text>

          <View style={styles.sourceItem}>
            <View style={styles.sourceLeft}>
              <Text style={styles.sourceName}>Mobile App</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: '75%', backgroundColor: colors.primary },
                  ]}
                />
              </View>
            </View>
            <Text style={styles.sourceValue}>75%</Text>
          </View>

          <View style={styles.sourceItem}>
            <View style={styles.sourceLeft}>
              <Text style={styles.sourceName}>Web Browser</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: '20%', backgroundColor: colors.secondary },
                  ]}
                />
              </View>
            </View>
            <Text style={styles.sourceValue}>20%</Text>
          </View>

          <View style={styles.sourceItem}>
            <View style={styles.sourceLeft}>
              <Text style={styles.sourceName}>API/Third Party</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: '5%', backgroundColor: colors.success },
                  ]}
                />
              </View>
            </View>
            <Text style={styles.sourceValue}>5%</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 12,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  chartSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 12,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chart: {
    borderRadius: 8,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  sourceItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sourceLeft: {
    marginBottom: 8,
  },
  sourceName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  sourceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'right',
  },
});

export default AnalyticsScreen;
