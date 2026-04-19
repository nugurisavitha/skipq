import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme/colors';
import { orderAPI } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'preparing',
  'out for delivery',
  'delivered',
];

const STATUS_LABELS = {
  pending: 'Order Placed',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  'out for delivery': 'On the Way',
  delivered: 'Delivered',
};

const normalizeStatus = (status) =>
  (status || '').toLowerCase().replace(/_/g, ' ');

const getStatusIndex = (status) => {
  const normalized = normalizeStatus(status);
  const idx = ORDER_STATUSES.indexOf(normalized);
  return idx >= 0 ? idx : -1;
};

const getStatusColor = (status) => {
  const normalized = normalizeStatus(status);
  switch (normalized) {
    case 'pending':
      return Colors.warning;
    case 'confirmed':
      return Colors.info;
    case 'preparing':
      return Colors.primary;
    case 'out for delivery':
      return Colors.info;
    case 'delivered':
      return Colors.success;
    case 'cancelled':
      return Colors.error;
    default:
      return Colors.textSecondary;
  }
};

export default function OrderDetailScreen({ navigation, route }) {
  const { orderId } = route.params;
  const { joinRoom, leaveRoom, on, off } = useSocket();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  useEffect(() => {
    if (orderId && !loading) {
      joinRoom(`order:${orderId}`);
      const handleOrderUpdate = (updatedOrder) => {
        setOrder(updatedOrder);
      };
      on(`order:${orderId}`, handleOrderUpdate);
      return () => {
        off(`order:${orderId}`, handleOrderUpdate);
        leaveRoom(`order:${orderId}`);
      };
    }
  }, [orderId, loading]);

  const fetchOrderDetail = async () => {
    try {
      setError(null);
      const response = await orderAPI.getById(orderId);
      setOrder(response.data);
    } catch (err) {
      setError('Failed to load order details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{'Order Details'}</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{'Order Details'}</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>{'Oops!'}</Text>
          <Text style={styles.errorMessage}>
            {error || 'Failed to load order'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchOrderDetail}
          >
            <Text style={styles.retryButtonText}>{'Try Again'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusIndex = getStatusIndex(order.status);
  const isCancelled = normalizeStatus(order.status) === 'cancelled';

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{'Order Details'}</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Order Info Card */}
        <View style={styles.orderCard}>
          <View style={styles.orderTopRow}>
            <View>
              <Text style={styles.orderId}>
                {'Order #'}
                {(order._id || order.id)?.slice(-8).toUpperCase()}
              </Text>
              <Text style={styles.orderDate}>
                {formatDate(order.createdAt)}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${getStatusColor(order.status)}18` },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: getStatusColor(order.status) },
                ]}
              >
                {isCancelled
                  ? 'Cancelled'
                  : STATUS_LABELS[normalizeStatus(order.status)] ||
                    order.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Status Timeline */}
        {!isCancelled ? (
          <View style={styles.timelineCard}>
            <Text style={styles.cardTitle}>{'Order Status'}</Text>
            <View style={styles.timeline}>
              {ORDER_STATUSES.map((status, index) => {
                const isCompleted = index < statusIndex;
                const isCurrent = index === statusIndex;
                const isActive = index <= statusIndex;
                return (
                  <View key={status} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View
                        style={[
                          styles.timelineDot,
                          isActive && styles.timelineDotActive,
                          isCurrent && styles.timelineDotCurrent,
                        ]}
                      >
                        {isCompleted ? (
                          <Icon name="check" size={12} color={Colors.white} />
                        ) : null}
                      </View>
                      {index < ORDER_STATUSES.length - 1 ? (
                        <View
                          style={[
                            styles.timelineLine,
                            isCompleted && styles.timelineLineActive,
                          ]}
                        />
                      ) : null}
                    </View>
                    <Text
                      style={[
                        styles.timelineLabel,
                        isActive && styles.timelineLabelActive,
                      ]}
                    >
                      {STATUS_LABELS[status] || status}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View style={styles.cancelledCard}>
            <Icon name="x-circle" size={24} color={Colors.error} />
            <Text style={styles.cancelledText}>
              {'This order has been cancelled'}
            </Text>
          </View>
        )}

        {/* Restaurant */}
        <View style={styles.section}>
          <Text style={styles.cardTitle}>{'Restaurant'}</Text>
          <View style={styles.infoBox}>
            <Icon name="home" size={18} color={Colors.primary} />
            <Text style={styles.infoText}>
              {order.restaurantName || 'Restaurant'}
            </Text>
          </View>
        </View>

        {/* Delivery Partner */}
        {order.deliveryPersonName ? (
          <View style={styles.section}>
            <Text style={styles.cardTitle}>{'Delivery Partner'}</Text>
            <View style={styles.infoBox}>
              <Icon name="user" size={18} color={Colors.primary} />
              <View>
                <Text style={styles.infoText}>
                  {order.deliveryPersonName}
                </Text>
                {order.deliveryPersonPhone ? (
                  <Text style={styles.infoSubtext}>
                    {order.deliveryPersonPhone}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
        ) : null}

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.cardTitle}>{'Items'}</Text>
          <View style={styles.itemsCard}>
            {order.items?.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.itemRow,
                  index < (order.items?.length || 0) - 1 &&
                    styles.itemRowBorder,
                ]}
              >
                <View style={styles.itemLeft}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemQty}>
                    {'Qty: '}
                    {item.quantity}
                  </Text>
                </View>
                <Text style={styles.itemPrice}>
                  {'Rs. '}
                  {(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Delivery Details */}
        <View style={styles.section}>
          <Text style={styles.cardTitle}>{'Delivery Details'}</Text>
          <View style={styles.infoBox}>
            {order.orderType === 'delivery' ? (
              <>
                <Icon name="map-pin" size={18} color={Colors.primary} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>{'Delivery Address'}</Text>
                  <Text style={styles.infoText}>
                    {order.deliveryAddress || 'Not provided'}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Icon
                  name={
                    order.orderType === 'dine_in' ? 'coffee' : 'shopping-bag'
                  }
                  size={18}
                  color={Colors.primary}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>
                    {order.orderType === 'dine_in' ? 'Dine-In' : 'Pickup'}
                  </Text>
                  <Text style={styles.infoText}>
                    {order.orderType === 'dine_in'
                      ? 'Dining at restaurant'
                      : 'Ready for pickup'}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Bill Details */}
        <View style={styles.section}>
          <Text style={styles.cardTitle}>{'Bill Details'}</Text>
          <View style={styles.billCard}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>{'Subtotal'}</Text>
              <Text style={styles.billValue}>
                {'Rs. '}
                {(order.total * 0.9).toFixed(2)}
              </Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>{'Tax'}</Text>
              <Text style={styles.billValue}>
                {'Rs. '}
                {(order.total * 0.1).toFixed(2)}
              </Text>
            </View>
            {order.orderType === 'delivery' ? (
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>{'Delivery Fee'}</Text>
                <Text style={styles.billValue}>{'Rs. 50.00'}</Text>
              </View>
            ) : null}
            <View style={[styles.billRow, styles.billTotalRow]}>
              <Text style={styles.billTotalLabel}>{'Total'}</Text>
              <Text style={styles.billTotalValue}>
                {'Rs. '}
                {order.total?.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  headerPlaceholder: {
    width: 24,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  // Order card
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  orderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontFamily: Fonts.regular,
  },
  statusBadge: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.pill,
  },
  statusBadgeText: {
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    fontSize: 12,
  },
  // Timeline
  timelineCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
    fontFamily: Fonts.semiBold,
  },
  timeline: {
    paddingLeft: Spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: Spacing.lg,
    width: 24,
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  timelineDotActive: {
    borderColor: Colors.success,
    backgroundColor: Colors.success,
  },
  timelineDotCurrent: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  timelineLine: {
    width: 2,
    height: 28,
    backgroundColor: Colors.border,
  },
  timelineLineActive: {
    backgroundColor: Colors.success,
  },
  timelineLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    paddingTop: 3,
  },
  timelineLabelActive: {
    color: Colors.text,
    fontWeight: '500',
    fontFamily: Fonts.medium,
  },
  cancelledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDECEC',
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  cancelledText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '500',
    fontFamily: Fonts.medium,
  },
  // Info boxes
  section: {
    marginBottom: Spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: Fonts.medium,
    marginTop: 2,
  },
  infoSubtext: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 2,
    fontFamily: Fonts.medium,
  },
  // Items
  itemsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  itemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    borderStyle: 'dashed',
  },
  itemLeft: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  itemQty: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: Fonts.regular,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
  // Bill
  billCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  billLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
  billValue: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  billTotalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderStyle: 'dashed',
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  billTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  billTotalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.success,
    fontFamily: Fonts.bold,
  },
  // States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
