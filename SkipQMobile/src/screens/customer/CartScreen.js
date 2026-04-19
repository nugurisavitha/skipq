import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme/colors';
import { useCart } from '../../hooks/useCart';

export default function CartScreen({ navigation }) {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTax,
    getDeliveryFee,
    getTotal,
    restaurantData,
    foodCourtId,
    getItemsByRestaurant,
  } = useCart();
  const isFoodCourt = !!foodCourtId;
  const restaurantGroups = isFoodCourt ? getItemsByRestaurant() : [];

  const handleRemoveItem = (itemId) => {
    Alert.alert('Remove Item', 'Remove this item from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        onPress: () => removeItem(itemId),
        style: 'destructive',
      },
    ]);
  };

  const handleClearCart = () => {
    Alert.alert('Clear Cart', 'Remove all items from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        onPress: () => clearCart(),
        style: 'destructive',
      },
    ]);
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.itemImage} />
      ) : (
        <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
          <Icon name="image" size={20} color={Colors.textMuted} />
        </View>
      )}
      <View style={styles.itemContent}>
        <Text style={styles.itemName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.itemPrice}>
          {'Rs. '}
          {(item.price * item.quantity).toFixed(2)}
        </Text>
      </View>
      <View style={styles.quantityControl}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() =>
            updateQuantity(item._id || item.id, item.quantity - 1)
          }
        >
          <Icon name="minus" size={14} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() =>
            updateQuantity(item._id || item.id, item.quantity + 1)
          }
        >
          <Icon name="plus" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleRemoveItem(item._id || item.id)}
      >
        <Icon name="trash-2" size={16} color={Colors.error} />
      </TouchableOpacity>
    </View>
  );

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{'Your Cart'}</Text>
          <View style={styles.headerPlaceholder} />
        </View>

        <View style={styles.emptyContainer}>
          <Icon name="shopping-cart" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>{'Your cart is empty'}</Text>
          <Text style={styles.emptyText}>
            {'Add delicious items from restaurants'}
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.getParent()?.navigate('Home')}
          >
            <Text style={styles.browseBtnText}>{'Browse Restaurants'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const subtotal = getSubtotal();
  const tax = getTax();
  const delivery = getDeliveryFee();
  const total = getTotal();
  const convenienceFee = 11.8;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{'Your Cart'}</Text>
        <TouchableOpacity onPress={handleClearCart}>
          <Text style={styles.clearText}>{'Clear'}</Text>
        </TouchableOpacity>
      </View>

      {/* Food Court pickup indicator */}
      {isFoodCourt ? (
        <View style={styles.foodCourtBanner}>
          <Icon name="hash" size={14} color={Colors.white} />
          <Text style={styles.foodCourtText}>
            {'Food Court Order — Pickup at counter with token'}
          </Text>
        </View>
      ) : null}

      {/* Restaurant banner(s) and items */}
      {isFoodCourt ? (
        <FlatList
          data={restaurantGroups}
          keyExtractor={(group) => group.restaurantId}
          contentContainerStyle={styles.itemsList}
          renderItem={({ item: group }) => (
            <View style={styles.restaurantGroup}>
              <View style={styles.restaurantBanner}>
                <Icon name="home" size={16} color={Colors.primary} />
                <Text style={styles.restaurantText} numberOfLines={1}>
                  {group.restaurantName}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    navigation.getParent()?.navigate('FoodCourts', {
                      screen: 'RestaurantDetail',
                      params: { slug: group.restaurantSlug, foodCourtId },
                    })
                  }
                >
                  <Text style={styles.addMoreText}>{'+ Add More'}</Text>
                </TouchableOpacity>
              </View>
              {group.items.map((cartItem) => (
                <View key={String(cartItem._id || cartItem.id)}>
                  {renderCartItem({ item: cartItem })}
                </View>
              ))}
            </View>
          )}
        />
      ) : (
        <>
          {restaurantData ? (
            <View style={[styles.restaurantBanner, { marginHorizontal: Spacing.lg, marginTop: Spacing.md }]}>
              <Icon name="home" size={16} color={Colors.primary} />
              <Text style={styles.restaurantText} numberOfLines={1}>
                {restaurantData.name}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.getParent()?.navigate('Home', {
                    screen: 'RestaurantDetail',
                    params: { slug: restaurantData.slug },
                  })
                }
              >
                <Text style={styles.addMoreText}>{'+ Add More'}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <FlatList
            data={items}
            renderItem={renderCartItem}
            keyExtractor={(item) => String(item._id || item.id)}
            contentContainerStyle={styles.itemsList}
          />
        </>
      )}

      {/* Order Summary */}
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>{'Bill Details'}</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{'Sub Total'}</Text>
          <Text style={styles.summaryValue}>
            {'Rs. '}
            {subtotal.toFixed(2)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{'Taxes'}</Text>
          <Text style={styles.summaryValue}>
            {'Rs. '}
            {tax.toFixed(2)}
          </Text>
        </View>
        {!isFoodCourt ? (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{'Delivery Fee'}</Text>
            <Text style={styles.summaryValue}>
              {'Rs. '}
              {delivery.toFixed(2)}
            </Text>
          </View>
        ) : null}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{'Convenience Fee'}</Text>
          <Text style={styles.summaryValue}>
            {'Rs. '}
            {convenienceFee.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>{'Grand Total'}</Text>
          <Text style={styles.totalValue}>
            {'Rs. '}
            {(total + convenienceFee).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkoutButton}
          onPress={() => navigation.navigate('Checkout')}
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutButtonText}>{'Proceed to Checkout'}</Text>
          <Icon name="arrow-right" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
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
  clearText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  foodCourtBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  foodCourtText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: Fonts.semiBold,
  },
  restaurantGroup: {
    marginBottom: Spacing.md,
  },
  restaurantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.sm,
    gap: Spacing.sm,
  },
  restaurantText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
  addMoreText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  itemsList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    borderStyle: 'dashed',
  },
  itemImage: {
    width: 65,
    height: 65,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  itemImagePlaceholder: {
    backgroundColor: Colors.boxBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  itemPrice: {
    fontSize: 14,
    color: Colors.primary,
    marginTop: Spacing.xs,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.12)',
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  qtyBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.boxBg,
  },
  qtyText: {
    width: 30,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
    backgroundColor: Colors.white,
  },
  deleteBtn: {
    padding: Spacing.sm,
  },
  // Summary
  summary: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderStyle: 'dashed',
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.success,
    fontFamily: Fonts.bold,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.pill,
    gap: Spacing.sm,
  },
  checkoutButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
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
  browseBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.pill,
  },
  browseBtnText: {
    color: Colors.white,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
});
