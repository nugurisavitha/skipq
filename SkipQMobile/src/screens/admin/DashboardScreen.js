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
  FlatList,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../../theme/colors';
import { adminAPI } from '../../services/api';

const DashboardScreen = ({ navigation }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await adminAPI.getDashboard();
      const data = res.data;
      setDashboardData(data);
      setRecentActivity(data?.recentActivity || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard');
      console.error('Error fetching dashboard:', error);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    setLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  }, [fetchDashboard]);

  const renderKPICard = (label, value, icon, color) => (
    <View style={[styles.kpiCard, { borderLeftColor: color }]}>
      <View style={[styles.kpiIcon, { backgroundColor: `${color}15` }]}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <View style={styles.kpiContent}>
        <Text style={styles.kpiLabel}>{label}</Text>
        <Text style={styles.kpiValue}>{value}</Text>
      </View>
    </View>
  );

  const renderActivityItem = ({ item }) => (
    <View style={styles.activityItem}>
      <View
        style={[
          styles.activityIcon,
          {
            backgroundColor:
              item.type === 'order'
                ? '#e3f2fd'
                : item.type === 'restaurant'
                ? '#f3e5f5'
                : '#f0f4c3',
          },
        ]}
      >
        <Icon
          name={
            item.type === 'order'
              ? 'package'
              : item.type === 'restaurant'
              ? 'home'
              : 'user-plus'
          }
          size={16}
          color={
            item.type === 'order'
              ? colors.secondary
              : item.type === 'restaurant'
              ? colors.primary
              : '#fbc02d'
          }
        />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{item.title}</Text>
        <Text style={styles.activityTime}>{item.time}</Text>
      </View>
      <Icon name="chevron-right" size={18} color="#ccc" />
    </View>
  );

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
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Platform overview</Text>
        </View>

        {/* KPI Cards */}
        <View style={styles.kpiContainer}>
          {renderKPICard(
            'Total Users',
            dashboardData?.totalUsers || 0,
            'users',
            colors.secondary
          )}
          {renderKPICard(
            'Total Restaurants',
            dashboardData?.totalRestaurants || 0,
            'home',
            colors.primary
          )}
          {renderKPICard(
            'Total Orders',
            dashboardData?.totalOrders || 0,
            'package',
            colors.success
          )}
          {renderKPICard(
            'Revenue',
            `$${(dashboardData?.revenue || 0).toFixed(2)}`,
            'dollar-sign',
            '#f44336'
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Stats</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Active Orders</Text>
              <Text style={styles.statValue}>{dashboardData?.activeOrders || 0}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Pending Approvals</Text>
              <Text style={styles.statValue}>{dashboardData?.pendingApprovals || 0}</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Today's Orders</Text>
              <Text style={styles.statValue}>{dashboardData?.todayOrders || 0}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Today's Revenue</Text>
              <Text style={styles.statValue}>
                ${(dashboardData?.todayRevenue || 0).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Activity')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentActivity.length > 0 ? (
            <FlatList
              data={recentActivity.slice(0, 5)}
              renderItem={renderActivityItem}
              keyExtractor={(item) => String(item._id || item.id)}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <View style={styles.emptyActivity}>
              <Text style={styles.emptyText}>No recent activity</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('PendingAgents')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#ffe0b2' }]}>
                <Icon name="user-check" size={24} color="#f57c00" />
              </View>
              <Text style={styles.actionLabel}>Approve Agents</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Restaurants')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#f3e5f5' }]}>
                <Icon name="home" size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionLabel}>Manage Restaurants</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Users')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#e3f2fd' }]}>
                <Icon name="users" size={24} color={colors.secondary} />
              </View>
              <Text style={styles.actionLabel}>Manage Users</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Orders')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#c8e6c9' }]}>
                <Icon name="package" size={24} color={colors.success} />
              </View>
              <Text style={styles.actionLabel}>View Orders</Text>
            </TouchableOpacity>
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
  kpiContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  kpiCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  kpiIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  kpiContent: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  viewAllText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
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
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.secondary,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  emptyActivity: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondary,
    textAlign: 'center',
  },
});

export default DashboardScreen;
