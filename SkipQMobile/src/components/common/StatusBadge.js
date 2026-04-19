import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme/colors';

/**
 * StatusBadge Component
 * Displays a colored badge for order status
 * Status types: pending, confirmed, preparing, ready, delivered, cancelled
 *
 * @param {string} status - Order status
 */
const StatusBadge = ({ status = 'pending' }) => {
  const statusConfig = {
    pending: {
      color: '#FBBF24',
      bgColor: '#FFFBEB',
      label: 'Pending',
    },
    confirmed: {
      color: Colors.info,
      bgColor: '#EFF6FF',
      label: 'Confirmed',
    },
    preparing: {
      color: '#EA580C',
      bgColor: '#FFEDD5',
      label: 'Preparing',
    },
    ready: {
      color: Colors.success,
      bgColor: '#F0FDF4',
      label: 'Ready',
    },
    delivered: {
      color: Colors.textSecondary,
      bgColor: '#F3F4F6',
      label: 'Delivered',
    },
    cancelled: {
      color: Colors.error,
      bgColor: '#FEE2E2',
      label: 'Cancelled',
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
      <Text style={[styles.badgeText, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    textTransform: 'capitalize',
  },
});

export default StatusBadge;
