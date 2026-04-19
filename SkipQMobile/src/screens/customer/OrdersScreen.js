import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme/colors';
import { orderAPI } from '../../services/api';

const STATUS_CONFIG = {
  pending: { color: '#FFB931', bg: '#FFF8E6', label: 'Placed', icon: 'clock' },
  confirmed: { color: '#3A6DE5', bg: '#EBF0FC', label: 'Confirmed', icon: 'check-circle' },
  preparing: { color: '#F2A93E', bg: '#FFF5E6', label: 'Preparing', icon: 'activity' },
  ready: { color: '#277d2a', bg: '#E8F5E9', label: 'Ready', icon: 'package' },
  out_for_delivery: { color: '#3A6DE5', bg: '#EBF0FC', label: 'On the way', icon: 'truck' },
  delivered: { color: '#277d2a', bg: '#E8F5E9', label: 'Delivered', icon: 'check-circle' },
  cancelled: { color: '#F53A3A', bg: '#FDECEC', label: 'Cancelled', icon: 'x-circle' },
};

const ORDER_TYPE_EMOJI = {
  delivery: '\uD83D\uDE9A',
  takeaway: '\uD83D\uDCE6',
  dine_in: '\uD83C\uDF7D\uFE0F',
};

const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'];

const getConfig = (status) => {
  const normalized = (status || '').toLowerCase().replace(/\s+/g, '_');
  return STATUS_CONFIG[normalized] || STATUS_CONFIG.pending;
};

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  const fetchOrders = async () => {
    try {
      setError(null);
      const response = await orderAPI.getAll({ limit: 50 });
      const data = response.data;
      const list = Array.isArray(data) ? data : data?.orders || [];
      setOrders(list);
    } catch (err) {
      setError('Failed to load orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const activeOrders = orders.filter((o) => {
    const normalized = (o.status || '').toLowerCase().replace(/\s+/g, '_');
    return ACTIVE_STATUSES.includes(normalized);
  });

  const pastOrders = orders.filter((o) => {
    const normalized = (o.status || '').toLowerCase().replace(/\s+/g, '_');
    return !ACTIVE_STATUSES.includes(normalized);
  });

  const displayedOrders = activeTab === 'active' ? activeOrders : pastOrders;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderOrderCard = ({ item }) => {
    const config = getConfig(item.status);
    const orderTypeKey = (item.orderType || 'delivery').toLowerCase().replace(/\s+/g, '_');
    const emoji = ORDER_TYPE_EMOJI[orderTypeKey] || '';
    const itemNames = (item.items || [])
      .slice(0, 2)
      .map((i) => i.name)
      .join(', ');
    const moreCount = (item.items || []).length - 2;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() =>
          navigation.navigate('OrderDetail', { orderId: item._id || item.id })
        }
        activeOpacity={0.7}
      >
        {/* Top Row: Order # + Status */}
        <View style={styles.cardTopRow}>
          <View>
            <Text style={styles.orderNumber}>
              {'Order #'}
              {(item._id || item.id || '').slice(-6).toUpperCase()}
            </Text>
            {item.tokenNumber ? (
              <Text style={styles.tokenNumber}>
                {'Token: '}
                {item.tokenNumber}
              </Text>
            ) : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Icon name={config.icon} size={13} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        {/* Restaurant Name */}
        <View style={styles.restaurantRow}>
          <Icon name="home" size={14} color={Colors.primary} />
          <Text style={styles.restaurantName} numberOfLines={1}>
            {item.restaurantName || 'Restaurant'}
          </Text>
        </View>

        {/* Items */}
        <Text style={styles.itemsText} numberOfLines={1}>
          {itemNames}
          {moreCount > 0 ? ` +${moreCount} more` : ''}
        </Text>

        {/* Bottom Row: Price, Type, Date */}
        <View style={styles.cardBottomRow}>
          <Text style={styles.orderTotal}>
            {'Rs. '}
            {item.total?.toFixed(2) || '0.00'}
          </Text>
          <View style={styles.cardBottomRight}>
            <Text style={styles.orderType}>
              {emoji}{' '}
              {orderTypeKey === 'dine_in'
                ? 'Dine-in'
                : orderTypeKey === 'takeaway'
                ? 'Takeaway'
                : 'Delivery'}
            </Text>
            <Text style={styles.orderDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (error && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{'My Orders'}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>{'Oops!'}</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchOrders}>
            <Text style={styles.retryButtonText}>{'Try Again'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{'My Orders'}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'active' && styles.tabTextActive,
            ]}
          >
            {'Active Orders'}
          </Text>
          {activeOrders.length > 0 && (
            <View style={styles.tabCount}>
              <Text style={styles.tabCountText}>{activeOrders.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && styles.tabActive]}
          onPress={() => setActiveTab('past')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'past' && styles.tabTextActive,
            ]}
          >
            {'Past Orders'}
          </Text>
          {pastOrders.length > 0 && (
            <View style={[styles.tabCount, styles.tabCountInactive]}>
              <Text style={styles.tabCountTextInactive}>
                {pastOrders.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : displayedOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="inbox" size={56} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>
            {activeTab === 'active'
              ? 'No active orders'
              : 'No past orders yet'}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === 'active'
              ? 'Your active orders will appear here'
              : 'Your order history will appear here'}
          </Text>
          {activeTab === 'active' && (
            <TouchableOpacity
              style={styles.browseButton}
              onPress={() => navigation.getParent()?.navigate('Home')}
            >
              <Text style={styles.browseButtonText}>
                {'Browse Restaurants'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={displayedOrders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => String(item._id || item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    gap: Spacing.sm,
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    fontFamily: Fonts.medium,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  tabCount: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabCountText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  tabCountInactive: {
    backgroundColor: Colors.boxBg,
  },
  tabCountTextInactive: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  tokenNumber: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: Fonts.regular,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.pill,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  restaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  restaurantName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    flex: 1,
  },
  itemsText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    marginBottom: Spacing.md,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: Fonts.bold,
  },
  cardBottomRight: {
    alignItems: 'flex-end',
  },
  orderType: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
  orderDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    fontFamily: Fonts.regular,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.lg,
    fontFamily: Fonts.semiBold,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
    fontFamily: Fonts.regular,
  },
  browseButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.pill,
  },
  browseButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  listContent: {
    paddingVertical: Spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.md,
    fontFamily: Fonts.bold,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
    fontFamily: Fonts.regular,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.pill,
    marginTop: Spacing.lg,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
});
