import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme/colors';
import { foodCourtAPI } from '../../services/api';

export default function FoodCourtDetailScreen({ navigation, route }) {
  const { foodCourtId } = route.params;
  const [foodCourt, setFoodCourt] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFoodCourtDetail();
  }, [foodCourtId]);

  const fetchFoodCourtDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await foodCourtAPI.getById(foodCourtId);
      const data = response.data;
      const fc = data?.foodCourt || data;
      setFoodCourt(fc);
      setRestaurants(fc.restaurants || data.restaurants || []);
    } catch (err) {
      setError('Failed to load food court details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderRestaurantCard = ({ item }) => (
    <TouchableOpacity
      style={styles.restaurantCard}
      onPress={() =>
        navigation.navigate('RestaurantDetail', {
          slug: item.slug,
          orderType: 'dine_in',
          foodCourtId,
        })
      }
      activeOpacity={0.7}
    >
      <View style={styles.restCardRow}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.restImage} />
        ) : (
          <View style={[styles.restImage, styles.restImagePlaceholder]}>
            <Icon name="image" size={24} color={Colors.textMuted} />
          </View>
        )}
        <View style={styles.restContent}>
          <Text style={styles.restName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.restCuisine} numberOfLines={1}>
            {item.cuisineType || 'Multi-cuisine'}
          </Text>
          <View style={styles.restMeta}>
            {item.rating ? (
              <View style={styles.ratingBadge}>
                <Icon name="star" size={10} color={Colors.white} />
                <Text style={styles.ratingText}>
                  {item.rating.toFixed(1)}
                </Text>
              </View>
            ) : null}
            {item.deliveryTime ? (
              <View style={styles.metaChip}>
                <Icon name="clock" size={11} color={Colors.textSecondary} />
                <Text style={styles.metaChipText}>
                  {item.deliveryTime}
                  {' min'}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <Icon name="chevron-right" size={18} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{'Loading food court...'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !foodCourt) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.navBar}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>{'Oops!'}</Text>
          <Text style={styles.errorMessage}>
            {error || 'Failed to load'}
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchFoodCourtDetail}
          >
            <Text style={styles.retryButtonText}>{'Try Again'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Hero Image */}
      <View style={styles.heroContainer}>
        {foodCourt.image ? (
          <Image source={{ uri: foodCourt.image }} style={styles.heroImage} />
        ) : (
          <View style={[styles.heroImage, styles.heroPlaceholder]}>
            <Icon name="grid" size={48} color={Colors.white} />
          </View>
        )}
        <View style={styles.heroOverlay} />

        {/* Back button */}
        <TouchableOpacity
          style={styles.heroBackBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={22} color={Colors.white} />
        </TouchableOpacity>

        {/* Food court name on hero */}
        <View style={styles.heroInfo}>
          <Text style={styles.heroName}>{foodCourt.name}</Text>
          <View style={styles.heroLocationRow}>
            <Icon name="map-pin" size={14} color="rgba(255,255,255,0.85)" />
            <Text style={styles.heroLocation}>
              {foodCourt.address || 'Location not specified'}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          {foodCourt.openingTime ? (
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Icon name="clock" size={16} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.statLabel}>{'Hours'}</Text>
                <Text style={styles.statValue}>
                  {foodCourt.openingTime}
                  {' - '}
                  {foodCourt.closingTime}
                </Text>
              </View>
            </View>
          ) : null}
          {foodCourt.distance ? (
            <View style={styles.statItem}>
              <View style={styles.statIcon}>
                <Icon name="navigation" size={16} color={Colors.primary} />
              </View>
              <View>
                <Text style={styles.statLabel}>{'Distance'}</Text>
                <Text style={styles.statValue}>
                  {foodCourt.distance}
                  {' km away'}
                </Text>
              </View>
            </View>
          ) : null}
          <View style={styles.statItem}>
            <View style={styles.statIcon}>
              <Icon name="home" size={16} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.statLabel}>{'Restaurants'}</Text>
              <Text style={styles.statValue}>
                {restaurants.length}
                {' available'}
              </Text>
            </View>
          </View>
        </View>

        {/* Description */}
        {foodCourt.description ? (
          <View style={styles.descSection}>
            <Text style={styles.descText}>{foodCourt.description}</Text>
          </View>
        ) : null}

        {/* Restaurants List */}
        <View style={styles.restaurantsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {'Restaurants'}
            </Text>
            <Text style={styles.sectionCount}>
              {restaurants.length}
              {' total'}
            </Text>
          </View>

          {restaurants.length === 0 ? (
            <View style={styles.emptyRestaurants}>
              <Icon name="inbox" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>
                {'No restaurants yet'}
              </Text>
              <Text style={styles.emptyText}>
                {'Restaurants will appear here once they join this food court'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={restaurants}
              renderItem={renderRestaurantCard}
              keyExtractor={(item) => String(item._id || item.id)}
              scrollEnabled={false}
            />
          )}
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
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.pill,
    marginTop: Spacing.xl,
  },
  retryButtonText: {
    color: Colors.white,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  // Hero
  heroContainer: {
    height: 240,
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
  heroBackBtn: {
    position: 'absolute',
    top: Spacing.xl + 20,
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroInfo: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  heroName: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  heroLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  heroLocation: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: Fonts.regular,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    marginTop: 1,
  },
  // Description
  descSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
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
  // Restaurants
  restaurantsSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  sectionCount: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
  restaurantCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  restCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restImage: {
    width: 75,
    height: 75,
    borderRadius: BorderRadius.sm,
  },
  restImagePlaceholder: {
    backgroundColor: Colors.boxBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  restContent: {
    flex: 1,
    marginHorizontal: Spacing.md,
  },
  restName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  restCuisine: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: Fonts.regular,
  },
  restMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.sm,
    gap: 3,
  },
  ratingText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
  // Empty
  emptyRestaurants: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginTop: Spacing.md,
    fontFamily: Fonts.semiBold,
  },
  emptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
    fontFamily: Fonts.regular,
    paddingHorizontal: Spacing.xl,
  },
});
