import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme/colors';
import { restaurantAPI, menuAPI } from '../../services/api';
import { useCart } from '../../hooks/useCart';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RestaurantDetailScreen({ navigation, route }) {
  const { slug, foodCourtId: fcId } = route.params;
  const { addItem, itemCount, restaurantData, getTotal } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    fetchRestaurantDetail();
  }, [slug]);

  const fetchRestaurantDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const restaurantRes = await restaurantAPI.getBySlug(slug);
      const rData = restaurantRes.data;
      const restaurant = rData?.restaurant || rData;
      setRestaurant(restaurant);

      const menuRes = await menuAPI.getByRestaurant(restaurant._id || restaurant.id);
      const mData = menuRes.data;
      const items = Array.isArray(mData)
        ? mData
        : mData?.items || mData?.menuItems || [];
      setMenuItems(items);

      const grouped = groupByCategory(items);
      setSections(grouped);
      if (grouped.length > 0) {
        setActiveCategory(grouped[0].title);
      }
    } catch (err) {
      setError('Failed to load restaurant details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const groupByCategory = (items) => {
    const grouped = {};
    items.forEach((item) => {
      const category = item.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    return Object.keys(grouped).map((category) => ({
      title: category,
      data: grouped[category],
    }));
  };

  const handleAddToCart = (item) => {
    try {
      const result = addItem(
        { ...item, _id: item._id || item.id },
        { ...restaurant, _id: restaurant._id || restaurant.id },
        fcId || null
      );
      if (result === 'switched') {
        Alert.alert('Cart Updated', 'Previous cart cleared. Item added from new restaurant.');
      }
    } catch (err) {
      Alert.alert('Error', String(err?.message || err));
    }
  };

  const renderMenuItem = ({ item }) => (
    <View style={styles.menuItem}>
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemInfo}>
          {item.isVeg !== undefined && (
            <View
              style={[
                styles.vegIndicator,
                { borderColor: item.isVeg ? Colors.success : Colors.error },
              ]}
            >
              <View
                style={[
                  styles.vegDot,
                  {
                    backgroundColor: item.isVeg ? Colors.success : Colors.error,
                  },
                ]}
              />
            </View>
          )}
          <Text style={styles.menuItemName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.description ? (
            <Text style={styles.menuItemDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <View style={styles.menuItemPriceRow}>
            <Text style={styles.menuItemPrice}>
              {'Rs. '}
              {item.price}
            </Text>
            {item.originalPrice && item.originalPrice > item.price ? (
              <Text style={styles.menuItemOrigPrice}>
                {'Rs. '}
                {item.originalPrice}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.menuItemRight}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.menuItemImage} />
          ) : null}
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => handleAddToCart(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.addBtnText}>{'+Add'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>
        {sections.find((s) => s.title === title)?.data.length || 0}
        {' items'}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{'Loading menu...'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !restaurant) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>{'Oops!'}</Text>
          <Text style={styles.errorMessage}>{error || 'Failed to load'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchRestaurantDetail}>
            <Text style={styles.retryBtnText}>{'Try Again'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const total = getTotal();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Hero Image with Overlay */}
      <View style={styles.heroContainer}>
        {restaurant.image ? (
          <Image
            source={{ uri: restaurant.image }}
            style={styles.heroImage}
          />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Icon name="image" size={48} color={Colors.white} />
          </View>
        )}
        <View style={styles.heroOverlay} />

        {/* Nav buttons over hero */}
        <View style={styles.heroNav}>
          <TouchableOpacity
            style={styles.heroNavBtn}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={22} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.heroNavBtn}
            onPress={() => navigation.getParent()?.navigate('Cart')}
          >
            <Icon name="shopping-cart" size={22} color={Colors.white} />
            {itemCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{itemCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Restaurant info on hero */}
        <View style={styles.heroInfo}>
          <Text style={styles.heroName}>{restaurant.name}</Text>
          <Text style={styles.heroCuisine}>{restaurant.cuisineType}</Text>
        </View>
      </View>

      {/* Restaurant Meta Stats */}
      <View style={styles.metaBar}>
        {restaurant.rating ? (
          <View style={styles.metaChip}>
            <View style={styles.ratingDot}>
              <Icon name="star" size={11} color={Colors.white} />
            </View>
            <Text style={styles.metaChipText}>{restaurant.rating.toFixed(1)}</Text>
          </View>
        ) : null}
        <View style={styles.metaChip}>
          <Icon name="clock" size={14} color={Colors.primary} />
          <Text style={styles.metaChipText}>
            {restaurant.deliveryTime || '30-45'}{' mins'}
          </Text>
        </View>
        <View style={styles.metaChip}>
          <Icon name="map-pin" size={14} color={Colors.primary} />
          <Text style={styles.metaChipText}>
            {restaurant.distance || '5'}{' km'}
          </Text>
        </View>
      </View>

      {restaurant.description ? (
        <View style={styles.descSection}>
          <Text style={styles.descText}>{restaurant.description}</Text>
        </View>
      ) : null}

      {/* Menu Section */}
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => String((item._id || item.id) + index)}
        renderItem={renderMenuItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
      />

      {/* Cart Bar */}
      {itemCount > 0 && (
        <TouchableOpacity
          style={styles.cartBar}
          onPress={() => navigation.getParent()?.navigate('Cart')}
          activeOpacity={0.9}
        >
          <View style={styles.cartBarLeft}>
            <View style={styles.cartBarCount}>
              <Text style={styles.cartBarCountText}>{itemCount}</Text>
            </View>
            <Text style={styles.cartBarItemsText}>
              {itemCount === 1 ? '1 item' : `${itemCount} items`}
            </Text>
          </View>
          <View style={styles.cartBarRight}>
            <Text style={styles.cartBarTotal}>
              {'Rs. '}
              {total.toFixed(2)}
            </Text>
            <Icon name="chevron-right" size={18} color={Colors.white} />
          </View>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    fontFamily: Fonts.regular,
  },
  navBar: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.boxBg,
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
    fontFamily: Fonts.regular,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.pill,
    marginTop: Spacing.xl,
  },
  retryBtnText: {
    color: Colors.white,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  // Hero
  heroContainer: {
    height: 220,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  heroNav: {
    position: 'absolute',
    top: Spacing.xl + 20,
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroNavBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  heroInfo: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  heroCuisine: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: Spacing.xs,
    fontFamily: Fonts.regular,
  },
  // Meta bar
  metaBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.lg,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ratingDot: {
    width: 22,
    height: 22,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metaChipText: {
    fontSize: 13,
    color: Colors.text,
    fontFamily: Fonts.medium,
    fontWeight: '500',
  },
  descSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  descText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
    fontFamily: Fonts.regular,
  },
  // Menu list
  listContent: {
    paddingBottom: 80,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  sectionCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
  menuItem: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  menuItemInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  vegIndicator: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderRadius: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.full,
  },
  menuItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  menuItemDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    lineHeight: 17,
    fontFamily: Fonts.regular,
  },
  menuItemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  menuItemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  menuItemOrigPrice: {
    fontSize: 13,
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
    fontFamily: Fonts.regular,
  },
  menuItemRight: {
    alignItems: 'center',
    width: 100,
  },
  menuItemImage: {
    width: 90,
    height: 80,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  addBtn: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    paddingVertical: 6,
    paddingHorizontal: Spacing.xl,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
  // Cart bar
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  cartBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cartBarCount: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cartBarCountText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  cartBarItemsText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '500',
    fontFamily: Fonts.medium,
  },
  cartBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  cartBarTotal: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
});
