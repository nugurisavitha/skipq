import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { restaurantAPI, orderAPI } from '../../services/api';
import { colors } from '../../theme/colors';

const DashboardScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { socket, joinRoom } = useSocket();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    totalOrders: 0,
    revenue: 0,
    pendingOrders: 0,
    preparingOrders: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const restaurantRes = await restaurantAPI.getMine();
      const restaurantData = restaurantRes.data?.restaurant || restaurantRes.data;
      const ordersRes = await orderAPI.getAll({
        restaurantId: restaurantData._id || restaurantData.id,
      });
      const ordersData = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.orders || []);

      // Calculate stats
      const today = new Date().toDateString();
      const todayOrders = ordersData.filter(
        order => new Date(order.createdAt).toDateString() === today
      );

      const totalRevenue = todayOrders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + (order.total || 0), 0);

      const pendingCount = ordersData.filter(
        order => order.status === 'pending'
      ).length;
      const preparingCount = ordersData.filter(
        order => order.status === 'preparing'
      ).length;

      setStats({
        totalOrders: todayOrders.length,
        revenue: totalRevenue,
        pendingOrders: pendingCount,
        preparingOrders: preparingCount,
      });

      // Get recent 5 orders
      const recent = ordersData.slice(0, 5);
      setRecentOrders(recent);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData])
  );

  // Socket setup
  useEffect(() => {
    if (socket && user) {
      joinRoom(`restaurant-${user._id}`);

      const handleOrderUpdate = () => {
        fetchData();
      };

      socket.on('order_status_updated', handleOrderUpdate);

      return () => {
        socket.off('order_status_updated', handleOrderUpdate);
      };
    }
  }, [socket, user, joinRoom, fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const StatCard = ({ icon, label, value, color = colors.primary }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Icon name={icon} size={24} color={color} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  const OrderItem = ({ order }) => {
    const statusColor = {
      pending: colors.error,
      confirmed: '#FF9800',
      preparing: '#2196F3',
      ready: colors.success,
      'out-for-delivery': '#9C27B0',
      completed: colors.success,
    }[order.status] || colors.primary;

    const timeAgo = () => {
      const diff = Date.now() - new Date(order.createdAt).getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      return `${hours}h ago`;
    };

    return (
      <TouchableOpacity
        style={styles.orderItem}
        onPress={() => navigation.navigate('OrderDetails', { orderId: order._id })}
      >
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>Order #{order._id.slice(-6).toUpperCase()}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + '20', borderColor: statusColor },
            ]}
          >
            <Text style={[styles.statusText, { color: statusColor }]}>
              {order.status.replace('-', ' ').toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.orderItems}>
          {order.items ? order.items.length : 0} item{order.items?.length !== 1 ? 's' : ''}
        </Text>
        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>Rs. {order.total?.toFixed(2) || '0.00'}</Text>
          <Text style={styles.orderTime}>{timeAgo()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              fetchData();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.subtitle}>Welcome back!</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
            <Icon name="settings" size={24} color={colors.secondary} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <StatCard
            icon="shopping-cart"
            label="Orders Today"
            value={stats.totalOrders}
            color={colors.primary}
          />
          <StatCard
            icon="trending-up"
            label="Revenue"
            value={`Rs. ${stats.revenue.toFixed(0)}`}
            color={colors.success}
          />
          <StatCard
            icon="clock"
            label="Pending"
            value={stats.pendingOrders}
            color={colors.error}
          />
          <StatCard
            icon="chef-hat"
            label="Preparing"
            value={stats.preparingOrders}
            color="#FF9800"
          />
        </View>

        {/* Recent Orders */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Orders')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {recentOrders.length > 0 ? (
            <FlatList
              data={recentOrders}
              keyExtractor={item => item._id}
              renderItem={({ item }) => <OrderItem order={item} />}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="inbox" size={48} color={colors.secondary + '40'} />
              <Text style={styles.emptyStateText}>No orders yet</Text>
            </View>
          )}
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
  scrollView: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  statsContainer: {
    padding: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  viewAll: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  orderItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderItems: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  orderTime: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DashboardScreen;
