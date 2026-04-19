import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme/colors';
import { restaurantAPI } from '../../services/api';

const CUISINE_FILTERS = [
  'All',
  'Indian',
  'Chinese',
  'Italian',
  'Fast Food',
  'Desserts',
  'Beverages',
  'South Indian',
  'North Indian',
  'Biryani',
  'Pizza',
];

const SORT_OPTIONS = [
  { label: 'Trending', value: 'trending', icon: 'trending-up' },
  { label: 'Rating', value: 'rating', icon: 'star' },
  { label: 'Fast Delivery', value: 'delivery', icon: 'clock' },
];

export default function RestaurantsScreen({ navigation }) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [sortBy, setSortBy] = useState('trending');

  const fetchRestaurants = async () => {
    try {
      const response = await restaurantAPI.getAll();
      const raw = response.data;
      let list = [];
      if (Array.isArray(raw)) {
        list = raw;
      } else if (raw && typeof raw === 'object') {
        list = raw.restaurants || raw.data || [];
        if (!Array.isArray(list)) list = [];
      }
      setRestaurants(list);
    } catch (err) {
      console.log('Fetch error:', String(err?.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const filtered = restaurants.filter((r) => {
    const matchesSearch = !searchText.trim() ||
      (r.name || '').toLowerCase().includes(searchText.toLowerCase());
    const matchesCuisine = selectedCuisine === 'All' ||
      (r.cuisineType || '').toLowerCase().includes(selectedCuisine.toLowerCase());
    return matchesSearch && matchesCuisine;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'delivery') return (a.deliveryTime || 30) - (b.deliveryTime || 30);
    return 0;
  });

  const renderCuisineFilter = (cuisine) => (
    <TouchableOpacity
      key={cuisine}
      style={[
        styles.cuisineChip,
        selectedCuisine === cuisine && styles.cuisineChipActive,
      ]}
      onPress={() => setSelectedCuisine(cuisine)}
    >
      <Text
        style={[
          styles.cuisineChipText,
          selectedCuisine === cuisine && styles.cuisineChipTextActive,
        ]}
      >
        {cuisine}
      </Text>
    </TouchableOpacity>
  );

  const renderCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('RestaurantDetail', { slug: item.slug })}
      activeOpacity={0.7}
    >
      <View style={styles.cardImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Icon name="camera-off" size={32} color={Colors.textMuted} />
          </View>
        )}
        {item.rating > 0 && (
          <View style={styles.ratingBadge}>
            <Icon name="star" size={11} color={Colors.white} />
            <Text style={styles.ratingBadgeText}>
              {String(item.rating ? item.rating.toFixed(1) : 'New')}
            </Text>
          </View>
        )}
        {item.selfService && (
          <View style={styles.selfServiceBadge}>
            <Text style={styles.selfServiceText}>{'Self Service'}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.name || 'Unnamed'}
        </Text>
        <Text style={styles.cuisineText} numberOfLines={1}>
          {item.cuisineType || 'Restaurant'}
        </Text>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Icon name="clock" size={12} color={Colors.textSecondary} />
            <Text style={styles.metaText}>
              {String(item.deliveryTime || '30-45')} {'mins'}
            </Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <Icon name="map-pin" size={12} color={Colors.textSecondary} />
            <Text style={styles.metaText}>
              {String(item.distance || '5')} {'km'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with gradient-style background */}
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>{'Restaurants'}</Text>
            <Text style={styles.headerSubtitle}>{'Discover great food near you'}</Text>
          </View>
          <TouchableOpacity
            style={styles.foodCourtBtn}
            onPress={() => navigation.navigate('FoodCourts')}
          >
            <Icon name="grid" size={16} color={Colors.primary} />
            <Text style={styles.foodCourtBtnText}>{'Food Courts'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <Icon name="search" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search restaurants..."
            placeholderTextColor={Colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Icon name="x" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Cuisine Filter Pills */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cuisineScroll}
        >
          {CUISINE_FILTERS.map(renderCuisineFilter)}
        </ScrollView>

        {/* Sort Options */}
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.sortChip,
                sortBy === opt.value && styles.sortChipActive,
              ]}
              onPress={() => setSortBy(opt.value)}
            >
              <Icon
                name={opt.icon}
                size={13}
                color={sortBy === opt.value ? Colors.primary : Colors.textSecondary}
              />
              <Text
                style={[
                  styles.sortChipText,
                  sortBy === opt.value && styles.sortChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{'Loading restaurants...'}</Text>
        </View>
      ) : sorted.length === 0 ? (
        <View style={styles.center}>
          <Icon name="inbox" size={56} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>{'No restaurants found'}</Text>
          <Text style={styles.emptyText}>{'Try adjusting your filters or search'}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setSelectedCuisine('All');
              setSearchText('');
              fetchRestaurants();
            }}
          >
            <Text style={styles.retryText}>{'Clear Filters'}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sorted}
          renderItem={renderCard}
          keyExtractor={(item) => String(item._id || item.id || Math.random())}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await fetchRestaurants();
                setRefreshing(false);
              }}
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.primary,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  foodCourtBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.pill,
    gap: 6,
  },
  foodCourtBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    fontFamily: Fonts.semiBold,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    fontFamily: Fonts.regular,
    marginTop: Spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.pill,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: 14,
    color: Colors.text,
    marginLeft: Spacing.sm,
    fontFamily: Fonts.regular,
  },
  filterSection: {
    backgroundColor: Colors.white,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cuisineScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  cuisineChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    marginRight: Spacing.sm,
  },
  cuisineChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  cuisineChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: Fonts.medium,
    fontWeight: '500',
  },
  cuisineChipTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },
  sortRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.pill,
    backgroundColor: Colors.boxBg,
    gap: 4,
  },
  sortChipActive: {
    backgroundColor: Colors.primaryLight,
  },
  sortChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Fonts.medium,
  },
  sortChipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    fontFamily: Fonts.regular,
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
    fontFamily: Fonts.regular,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.pill,
    marginTop: Spacing.xl,
  },
  retryText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  listContent: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Spacing.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  cardImageContainer: {
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardImagePlaceholder: {
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: 3,
  },
  ratingBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Fonts.bold,
  },
  selfServiceBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.info,
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  selfServiceText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  cardContent: {
    padding: Spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  cuisineText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    fontFamily: Fonts.regular,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
    marginHorizontal: Spacing.sm,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
});
