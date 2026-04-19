import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme/colors';
import { useCart } from '../../hooks/useCart';
import { orderAPI } from '../../services/api';

export default function CheckoutScreen({ navigation }) {
  const { items, restaurantData, getTotal, clearCart, foodCourtId, getItemsByRestaurant } = useCart();
  const isFoodCourt = !!foodCourtId;
  const restaurantGroups = isFoodCourt ? getItemsByRestaurant() : [];
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [orderType, setOrderType] = useState(isFoodCourt ? 'dine_in' : 'delivery');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    // Food court orders don't need address (counter pickup)
    if (!isFoodCourt && orderType === 'delivery' && !address.trim()) {
      newErrors.address = 'Delivery address is required';
    }
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Enter a valid 10-digit phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      // Show specific error instead of generic message
      const errorMessages = Object.values(errors);
      const newErrors = {};
      if (!isFoodCourt && orderType === 'delivery' && !address.trim()) {
        newErrors.address = 'Delivery address is required';
      }
      if (!phoneNumber.trim()) {
        newErrors.phoneNumber = 'Phone number is required';
      } else if (!/^[0-9]{10}$/.test(phoneNumber.replace(/\D/g, ''))) {
        newErrors.phoneNumber = 'Enter a valid 10-digit phone number';
      }
      const msgs = Object.values(newErrors);
      Alert.alert(
        'Missing Info',
        msgs.length > 0 ? msgs.join('\n') : 'Please fill in all required fields'
      );
      return;
    }

    setLoading(true);
    try {
      if (isFoodCourt && restaurantGroups.length > 0) {
        // Food court: create separate order per restaurant
        const tokens = [];
        for (const group of restaurantGroups) {
          const groupSubtotal = group.items.reduce((s, i) => s + i.price * i.quantity, 0);
          const groupTax = groupSubtotal * 0.05;
          const orderData = {
            restaurantId: group.restaurantId,
            items: group.items.map((item) => ({
              menuItemId: item._id || item.id,
              quantity: item.quantity,
              price: item.price,
            })),
            deliveryAddress: '',
            phoneNumber: phoneNumber.replace(/\D/g, ''),
            orderType: 'dine_in',
            paymentMethod,
            notes: specialInstructions,
            total: groupSubtotal + groupTax,
            foodCourtId,
          };

          const response = await orderAPI.create(orderData);
          const order = response.data?.order || response.data;
          const token = order?.tokenNumber || order?.token || order?.orderNumber || '';
          if (token) {
            tokens.push(`${group.restaurantName}: #${token}`);
          } else {
            tokens.push(`${group.restaurantName}: Order placed`);
          }
        }

        clearCart();
        Alert.alert(
          'Orders Placed!',
          `${tokens.length} order(s) created:\n\n${tokens.join('\n')}\n\nPick up at each restaurant counter with your token.`,
          [
            {
              text: 'View Orders',
              onPress: () => navigation.getParent()?.navigate('Orders'),
            },
            {
              text: 'OK',
              onPress: () => navigation.getParent()?.navigate('FoodCourts'),
            },
          ]
        );
      } else {
        // Single restaurant order
        const orderData = {
          restaurantId: restaurantData._id || restaurantData.id,
          items: items.map((item) => ({
            menuItemId: item._id || item.id,
            quantity: item.quantity,
            price: item.price,
          })),
          deliveryAddress: isFoodCourt ? '' : address,
          phoneNumber: phoneNumber.replace(/\D/g, ''),
          orderType: isFoodCourt ? 'dine_in' : orderType,
          paymentMethod,
          notes: specialInstructions,
          total: getTotal(),
          ...(isFoodCourt ? { foodCourtId } : {}),
        };

        const response = await orderAPI.create(orderData);
        const order = response.data?.order || response.data;
        const tokenNumber = order?.tokenNumber || order?.token || order?.orderNumber || '';
        clearCart();

        if (isFoodCourt && tokenNumber) {
          Alert.alert(
            'Order Placed!',
            `Your token number is ${tokenNumber}.\nPlease pick up your order at the restaurant counter.`,
            [
              { text: 'View Orders', onPress: () => navigation.getParent()?.navigate('Orders') },
              { text: 'OK', onPress: () => navigation.getParent()?.navigate('FoodCourts') },
            ]
          );
        } else {
          Alert.alert('Order Placed!', 'Your order has been placed successfully!', [
            { text: 'View Orders', onPress: () => navigation.getParent()?.navigate('Orders') },
            { text: 'OK', onPress: () => navigation.getParent()?.navigate('Home') },
          ]);
        }
      }
    } catch (err) {
      Alert.alert(
        'Order Failed',
        err.response?.data?.message || 'Failed to place order. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{'Checkout'}</Text>
          <View style={styles.headerPlaceholder} />
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.emptyTitle}>{'Cart is Empty'}</Text>
          <Text style={styles.emptyText}>
            {'Add items to your cart before checkout'}
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.getParent()?.navigate('Home')}
          >
            <Text style={styles.backButtonText}>{'Browse Restaurants'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const total = getTotal();

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{'Checkout'}</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        {/* Progress Steps */}
        <View style={styles.progressBar}>
          <View style={styles.progressStep}>
            <View style={[styles.stepDot, styles.stepDotActive]}>
              <Text style={styles.stepNumber}>{'1'}</Text>
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelActive]}>
              {'Review'}
            </Text>
          </View>
          <View style={[styles.progressLine, styles.progressLineActive]} />
          <View style={styles.progressStep}>
            <View style={[styles.stepDot, styles.stepDotActive]}>
              <Text style={styles.stepNumber}>{'2'}</Text>
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelActive]}>
              {'Payment'}
            </Text>
          </View>
          <View style={styles.progressLine} />
          <View style={styles.progressStep}>
            <View style={styles.stepDot}>
              <Text style={[styles.stepNumber, styles.stepNumberInactive]}>
                {'3'}
              </Text>
            </View>
            <Text style={styles.stepLabel}>{'Confirm'}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Restaurant(s) */}
          {isFoodCourt && restaurantGroups.length > 1 ? (
            <View style={styles.restaurantSection}>
              <Icon name="shopping-bag" size={16} color={Colors.primary} />
              <Text style={styles.restaurantName}>
                {restaurantGroups.length} Restaurants
              </Text>
            </View>
          ) : restaurantData ? (
            <View style={styles.restaurantSection}>
              <Icon name="home" size={16} color={Colors.primary} />
              <Text style={styles.restaurantName}>{restaurantData.name}</Text>
            </View>
          ) : null}

          {/* Food Court Pickup Banner */}
          {isFoodCourt ? (
            <View style={styles.foodCourtBanner}>
              <View style={styles.foodCourtBannerIcon}>
                <Icon name="hash" size={20} color={Colors.primary} />
              </View>
              <View style={styles.foodCourtBannerContent}>
                <Text style={styles.foodCourtBannerTitle}>
                  {'Food Court Pickup'}
                </Text>
                <Text style={styles.foodCourtBannerText}>
                  {'Collect your order at the restaurant counter with your token number'}
                </Text>
              </View>
            </View>
          ) : (
            <>
              {/* Order Type */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{'Order Type'}</Text>
                <View style={styles.orderTypeRow}>
                  {[
                    { value: 'delivery', label: 'Delivery', icon: 'truck' },
                    { value: 'takeaway', label: 'Pickup', icon: 'shopping-bag' },
                    { value: 'dine_in', label: 'Dine-In', icon: 'coffee' },
                  ].map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.orderTypeBtn,
                        orderType === type.value && styles.orderTypeBtnActive,
                      ]}
                      onPress={() => setOrderType(type.value)}
                    >
                      <Icon
                        name={type.icon}
                        size={18}
                        color={
                          orderType === type.value
                            ? Colors.primary
                            : Colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.orderTypeLabel,
                          orderType === type.value && styles.orderTypeLabelActive,
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Delivery Address */}
              {orderType === 'delivery' ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>{'Delivery Address'}</Text>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.address && styles.inputError,
                    ]}
                  >
                    <Icon name="map-pin" size={18} color={Colors.textSecondary} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter full delivery address"
                      placeholderTextColor={Colors.textMuted}
                      value={address}
                      onChangeText={setAddress}
                      editable={!loading}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                  {errors.address ? (
                    <Text style={styles.errorText}>{errors.address}</Text>
                  ) : null}
                </View>
              ) : null}
            </>
          )}

          {/* Contact Number */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{'Contact Number'}</Text>
            <View
              style={[
                styles.inputContainer,
                errors.phoneNumber && styles.inputError,
              ]}
            >
              <Icon name="phone" size={18} color={Colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="10-digit phone number"
                placeholderTextColor={Colors.textMuted}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                editable={!loading}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
            {errors.phoneNumber ? (
              <Text style={styles.errorText}>{errors.phoneNumber}</Text>
            ) : null}
          </View>

          {/* Special Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {'Special Instructions (Optional)'}
            </Text>
            <View style={styles.inputContainer}>
              <Icon
                name="message-square"
                size={18}
                color={Colors.textSecondary}
              />
              <TextInput
                style={styles.input}
                placeholder="Extra sauce, no onions, etc."
                placeholderTextColor={Colors.textMuted}
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                editable={!loading}
                multiline
                numberOfLines={2}
              />
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{'Payment Method'}</Text>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'cash' && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod('cash')}
            >
              <View style={styles.radioOuter}>
                {paymentMethod === 'cash' ? (
                  <View style={styles.radioInner} />
                ) : null}
              </View>
              <Icon name="dollar-sign" size={18} color={Colors.text} />
              <Text style={styles.paymentLabel}>{isFoodCourt ? 'Cash at Counter' : 'Cash on Delivery'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'razorpay' && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod('razorpay')}
            >
              <View style={styles.radioOuter}>
                {paymentMethod === 'razorpay' ? (
                  <View style={styles.radioInner} />
                ) : null}
              </View>
              <Icon name="credit-card" size={18} color={Colors.text} />
              <Text style={styles.paymentLabel}>{'Pay Online'}</Text>
            </TouchableOpacity>
          </View>

          {/* Order Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{'Order Summary'}</Text>
            <View style={styles.summaryBox}>
              {isFoodCourt && restaurantGroups.length > 1 ? (
                restaurantGroups.map((group) => (
                  <View key={group.restaurantId}>
                    <Text style={styles.groupHeader}>{group.restaurantName}</Text>
                    {group.items.map((item) => (
                      <View
                        key={String(item._id || item.id)}
                        style={styles.summaryItem}
                      >
                        <View style={styles.summaryItemLeft}>
                          <Text style={styles.summaryItemName}>{item.name}</Text>
                          <Text style={styles.summaryItemQty}>x{item.quantity}</Text>
                        </View>
                        <Text style={styles.summaryItemPrice}>
                          Rs. {(item.price * item.quantity).toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))
              ) : (
                items.map((item) => (
                  <View
                    key={String(item._id || item.id)}
                    style={styles.summaryItem}
                  >
                    <View style={styles.summaryItemLeft}>
                      <Text style={styles.summaryItemName}>{item.name}</Text>
                      <Text style={styles.summaryItemQty}>
                        {'x'}
                        {item.quantity}
                      </Text>
                    </View>
                    <Text style={styles.summaryItemPrice}>
                      {'Rs. '}
                      {(item.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>

          {/* Total */}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{'Subtotal'}</Text>
              <Text style={styles.totalValue}>
                {'Rs. '}
                {(total * 0.9).toFixed(2)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{'Tax'}</Text>
              <Text style={styles.totalValue}>
                {'Rs. '}
                {(total * 0.1).toFixed(2)}
              </Text>
            </View>
            {orderType === 'delivery' ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{'Delivery Fee'}</Text>
                <Text style={styles.totalValue}>{'Rs. 50.00'}</Text>
              </View>
            ) : null}
            <View style={[styles.totalRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>{'Total Amount'}</Text>
              <Text style={styles.grandTotalValue}>
                {'Rs. '}
                {total.toFixed(2)}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.placeOrderBtn, loading && styles.btnDisabled]}
            onPress={handlePlaceOrder}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <Text style={styles.placeOrderBtnText}>{'Place Order'}</Text>
                <Icon name="arrow-right" size={18} color={Colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  // Progress
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progressStep: {
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.boxBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepDotActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  stepNumberInactive: {
    color: Colors.textSecondary,
  },
  stepLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 4,
    fontFamily: Fonts.regular,
  },
  stepLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  progressLineActive: {
    backgroundColor: Colors.primary,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: 100,
  },
  restaurantSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
  foodCourtBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    gap: Spacing.md,
  },
  foodCourtBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodCourtBannerContent: {
    flex: 1,
  },
  foodCourtBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: Fonts.bold,
  },
  foodCourtBannerText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 3,
    fontFamily: Fonts.regular,
    lineHeight: 17,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.md,
    fontFamily: Fonts.semiBold,
  },
  orderTypeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  orderTypeBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  orderTypeBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  orderTypeLabel: {
    marginTop: Spacing.xs,
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
    fontFamily: Fonts.medium,
  },
  orderTypeLabelActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.boxBg,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    color: Colors.text,
    marginHorizontal: Spacing.sm,
    fontFamily: Fonts.regular,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: Spacing.xs,
    fontFamily: Fonts.regular,
  },
  // Payment
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  paymentOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  paymentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  // Summary
  groupHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    fontFamily: Fonts.bold,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary,
  },
  summaryBox: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    borderStyle: 'dashed',
  },
  summaryItemLeft: {
    flex: 1,
  },
  summaryItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  summaryItemQty: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: Fonts.regular,
  },
  summaryItemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
  totalSection: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  totalLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
  totalValue: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderStyle: 'dashed',
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  grandTotalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.success,
    fontFamily: Fonts.bold,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  placeOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.pill,
    gap: Spacing.sm,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  placeOrderBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.lg,
    fontFamily: Fonts.bold,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontFamily: Fonts.regular,
  },
  backButton: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.pill,
  },
  backButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
});
