import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme/colors';
import { foodCourtAPI } from '../../services/api';

export default function FoodCourtsScreen({ navigation }) {
  const [foodCourts, setFoodCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');

  const fetchFoodCourts = async () => {
    try {
      setError(null);
      const response = await foodCourtAPI.getAll();
      const data = response.data;
      const list = Array.isArray(data) ? data : data?.foodCourts || [];
      setFoodCourts(list);
    } catch (err) {
      setError('Failed to load food courts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFoodCourts();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFoodCourts();
    setRefreshing(false);
  };

  const filtered = foodCourts.filter((fc) => {
    if (!searchText.trim()) return true;
    return (
      (fc.name || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (fc.address || '').toLowerCase().includes(searchText.toLowerCase())
    );
  });

  const renderFoodCourtCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate('FoodCourtDetail', {
          foodCourtId: item._id || item.id,
        })
      }
      activeOpacity={0.7}
    >
      <View style={styles.cardImageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Icon name="grid" size={40} color={Colors.textMuted} />
          </View>
        )}
        {/* Restaurant count badge */}
        {item.restaurantCount ? (
          <View style={styles.countBadge}>
            <Icon name="home" size={11} color={Colors.white} />
            <Text style={styles.countBadgeText}>
              {item.restaurantCount}
              {' restaurants'}
            </Text>
          </View>
        ) : null}
        {/* Open/Closed status */}
        <View style={styles.statusPill}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{'Open'}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.name}
        </Text>

        <View style={styles.locationRow}>
          <Icon name="map-pin" size={13} color={Colors.textSecondary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.address || 'Location not specified'}
          </Text>
        </View>

        {item.description ? (
          <Text style={styles.descText} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.cardFooter}>
          {item.openingTime ? (
            <View style={styles.footerChip}>
              <Icon name="clock" size={12} color={Colors.primary} />
              <Text style={styles.footerChipText}>
                {item.openingTime}
                {' - '}
                {item.closingTime}
              </Text>
            </View>
          ) : null}
          {item.distance ? (
            <View style={styles.footerChip}>
              <Icon name="navigation" size={12} color={Colors.primary} />
              <Text style={styles.footerChipText}>
                {item.distance}
                {' km'}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (error && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{'Food Courts'}</Text>
          <Text style={styles.headerSubtitle}>
            {'Explore food courts near you'}
          </Text>
        </View>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color={Colors.error} />
          <Text style={styles.errorTitle}>{'Oops!'}</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchFoodCourts}
          >
            <Text style={styles.retryButtonText}>{'Try Again'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{'Food Courts'}</Text>
        <Text style={styles.headerSubtitle}>
          {'Explore food courts near you'}
        </Text>
        <View style={styles.searchContainer}>
          <Icon name="search" size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search food courts..."
            placeholderTextColor={Colors.textMuted}
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Icon name="x" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{'Loading food courts...'}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="grid" size={56} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>{'No food courts found'}</Text>
          <Text style={styles.emptyText}>
            {searchText
              ? 'Try a different search term'
              : 'Check back soon for new food courts in your area'}
          </Text>
          {searchText ? (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => setSearchText('')}
            >
              <Text style={styles.clearBtnText}>{'Clear Search'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderFoodCourtCard}
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
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.primary,
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
  listContent: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
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
    height: 170,
  },
  cardImagePlaceholder: {
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.pill,
    gap: 4,
  },
  countBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  statusPill: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(39, 125, 42, 0.9)',
    paddingVertical: 3,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.pill,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7CFC00',
  },
  statusText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  cardContent: {
    padding: Spacing.md,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.xs,
  },
  locationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    flex: 1,
  },
  descText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    lineHeight: 17,
    fontFamily: Fonts.regular,
  },
  cardFooter: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  footerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.pill,
    gap: 4,
  },
  footerChipText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  // States
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
  clearBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.pill,
  },
  clearBtnText: {
    color: Colors.white,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
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
