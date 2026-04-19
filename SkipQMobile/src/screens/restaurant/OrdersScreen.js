import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { restaurantAPI, orderAPI } from '../../services/api';
import { colors } from '../../theme/colors';

const OrdersScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { socket, joinRoom } = useSocket();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);

  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'confirmed', label: 'Confirmed' },
    { id: 'preparing', label: 'Preparing' },
    { id: 'ready', label: 'Ready' },
    { id: 'completed', label: 'Completed' },
  ];

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const restaurantRes = await restaurantAPI.getMine();
      const restaurantData = restaurantRes.data?.restaurant || restaurantRes.data;
      setRestaurantId(restaurantData._id || restaurantData.id);

      const ordersRes = await orderAPI.getAll({
        restaurantId: restaurantData._id || restaurantData.id,
      });
      const ordersData = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.orders || []);

      // Sort by most recent first
      ordersData.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setAllOrders(ordersData);
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
      console.error('Orders fetch error:', err);
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

  // Filter orders by tab
  useEffect(() => {
    if (selectedTab === 'all') {
      setFilteredOrders(allOrders);
    } else {
      setFilteredOrders(
        allOrders.filter(order => order.status === selectedTab)
      );
    }
  }, [selectedTab, allOrders]);

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

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'out-for-delivery',
      'out-for-delivery': 'completed',
    };
    return statusFlow[currentStatus];
  };

  const getStatusLabel = (status) => {
    return status.replace('-', ' ').toUpperCase();
  };

  const getStatusColor = (status) => {
    const colors_map = {
      pending: colors.error,
      confirmed: '#FF9800',
      preparing: '#2196F3',
      ready: colors.success,
      'out-for-delivery': '#9C27B0',
      completed: colors.success,
    };
    return colors_map[status] || colors.primary;
  };

  const handleStatusUpdate = async (orderId, currentStatus) => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) {
      alert('Order is already completed');
      return;
    }

    Alert.alert(
      'Update Order Status',
      `Mark this order as ${getStatusLabel(nextStatus)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            setUpdatingOrderId(orderId);
            try {
              await orderAPI.updateStatus(orderId, nextStatus);
              setAllOrders(
                allOrders.map(order =>
                  order._id === orderId
                    ? { ...order, status: nextStatus }
                    : order
                )
              );
            } catch (err) {
              console.error('Update error:', err);
              alert('Failed to update order status');
            } finally {
              setUpdatingOrderId(null);
            }
          },
        },
      ]
    );
  };

  const OrderCard = ({ order }) => {
    const statusColor = getStatusColor(order.status);
    const nextStatus = getNextStatus(order.status);
    const canUpdate = nextStatus !== undefined;

    const timeAgo = () => {
      const diff = Date.now() - new Date(order.createdAt).getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    };

    const customerName = order.customer?.name || 'Guest';

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetails', { orderId: order._id })}
      >
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.orderId}>#{order._id.slice(-6).toUpperCase()}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + '20', borderColor: statusColor },
              ]}
            >
              <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                {getStatusLabel(order.status)}
              </Text>
            </View>
          </View>
          <Text style={styles.orderTime}>{timeAgo()}</Text>
        </View>

        {/* Customer & Items */}
        <View style={styles.cardBody}>
          <Text style={styles.customerName}>{customerName}</Text>
          <Text style={styles.itemCount}>
            {order.items ? order.items.length : 0} item{order.items?.length !== 1 ? 's' : ''}
          </Text>

          {/* Items list (show first 2) */}
          {order.items && order.items.length > 0 && (
            <View style={styles.itemsList}>
              {order.items.slice(0, 2).map((item, idx) => (
                <Text key={idx} style={styles.itemName} numberOfLines={1}>
                  • {item.name} x{item.quantity}
                </Text>
              ))}
              {order.items.length > 2 && (
                <Text style={styles.itemName}>
                  • +{order.items.length - 2} more
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.orderTotal}>Rs. {order.total?.toFixed(2) || '0.00'}</Text>
          {canUpdate && updatingOrderId !== order._id && (
            <TouchableOpacity
              style={[styles.updateButton, { backgroundColor: statusColor }]}
              onPress={() => handleStatusUpdate(order._id, order.status)}
            >
              <Icon name="arrow-right" size={16} color="#fff" />
              <Text style={styles.updateButtonText}>
                {nextStatus.replace('-', ' ')}
              </Text>
            </TouchableOpacity>
          )}
          {updatingOrderId === order._id && (
            <View style={styles.updatingIndicator}>
              <ActivityIndicator size="small" color={statusColor} />
            </View>
          )}
          {!canUpdate && (
            <View style={[styles.updateButton, { backgroundColor: '#ccc' }]}>
              <Text style={styles.updateButtonText}>Completed</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading orders...</Text>
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
      </View>

      {/* Tab Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              selectedTab === tab.id && styles.tabActive,
            ]}
            onPress={() => setSelectedTab(tab.id)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab.id && styles.tabTextActive,
              ]}
            >
              {tab.label}
            </Text>
            {tab.id !== 'all' && (
              <Text style={styles.tabBadge}>
                {allOrders.filter(o => o.status === tab.id).length}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={item => item._id}
        renderItem={({ item }) => <OrderCard order={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="inbox" size={48} color={colors.secondary + '40'} />
            <Text style={styles.emptyStateText}>No orders in this category</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  tabsContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabsContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 4,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#666',
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
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
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderTime: {
    fontSize: 12,
    color: '#999',
  },
  cardBody: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
  },
  itemsList: {
    gap: 2,
  },
  itemName: {
    fontSize: 12,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  orderTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  updateButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  updatingIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
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

export default OrdersScreen;
