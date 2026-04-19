import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  RefreshControl,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Geolocation from '@react-native-community/geolocation';
import { colors } from '../../theme/colors';
import { deliveryAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';

const { height } = Dimensions.get('window');

const DashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { socket, joinRoom } = useSocket();

  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offers, setOffers] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [earnings, setEarnings] = useState(0);
  const [locationSharing, setLocationSharing] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      const [userData, offersData, tripData] = await Promise.all([
        deliveryAPI.getMe(),
        isOnline ? deliveryAPI.getOffers() : Promise.resolve([]),
        deliveryAPI.getActiveTrip(),
      ]);

      setIsOnline(userData.isOnline);
      setOffers(offersData || []);
      setActiveTrip(tripData || null);
      setEarnings(userData.earningsToday || 0);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    }
  }, [isOnline]);

  // Handle online/offline toggle
  const handleOnlineToggle = async (value) => {
    try {
      await deliveryAPI.setOnline(value);
      setIsOnline(value);
      setLocationSharing(value);

      if (value) {
        joinRoom(`delivery-${user?.id}`);
        startLocationTracking();
      } else {
        stopLocationTracking();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update online status');
    }
  };

  // Location tracking
  let locationIntervalId = null;

  const startLocationTracking = () => {
    if (locationIntervalId) return;

    locationIntervalId = setInterval(() => {
      Geolocation.getCurrentPosition(
        async (position) => {
          try {
            await deliveryAPI.updateLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
            setLocationError(null);
          } catch (error) {
            console.error('Error updating location:', error);
          }
        },
        (error) => {
          setLocationError(error.message);
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    }, 30000);
  };

  const stopLocationTracking = () => {
    if (locationIntervalId) {
      clearInterval(locationIntervalId);
      locationIntervalId = null;
    }
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData();
    setLoading(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, []);

  // Handle accept offer
  const handleAcceptOffer = async (offerId) => {
    try {
      await deliveryAPI.acceptOffer(offerId);
      Alert.alert('Success', 'Delivery accepted!');
      fetchDashboardData();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to accept offer');
    }
  };

  // Handle reject offer
  const handleRejectOffer = async (offerId) => {
    try {
      await deliveryAPI.rejectOffer(offerId);
      setOffers(offers.filter((o) => (o._id || o.id) !== offerId));
    } catch (error) {
      Alert.alert('Error', 'Failed to reject offer');
    }
  };

  // Handle mark picked up
  const handleMarkPickedUp = async () => {
    if (!activeTrip) return;
    try {
      await deliveryAPI.markPickedUp(activeTrip._id || activeTrip.id);
      Alert.alert('Success', 'Order marked as picked up');
      fetchDashboardData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  // Handle mark delivered
  const handleMarkDelivered = async () => {
    if (!activeTrip) return;
    try {
      await deliveryAPI.markDelivered(activeTrip._id || activeTrip.id);
      Alert.alert('Success', 'Delivery completed!');
      fetchDashboardData();
    } catch (error) {
      Alert.alert('Error', 'Failed to complete delivery');
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  const renderOfferCard = ({ item }) => (
    <View style={styles.offerCard}>
      <View style={styles.offerHeader}>
        <View>
          <Text style={styles.restaurantName}>{item.restaurantName}</Text>
          <View style={styles.offerDetails}>
            <Icon name="map-pin" size={14} color="#666" />
            <Text style={styles.detailText}>{item.distance?.toFixed(1)}km away</Text>
          </View>
        </View>
        <View style={styles.priceTag}>
          <Text style={styles.price}>${item.quotedPrice?.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.addressSection}>
        <View style={styles.addressRow}>
          <Icon name="home" size={16} color={colors.primary} />
          <Text style={styles.addressText} numberOfLines={1}>
            {item.pickupAddress}
          </Text>
        </View>
        <View style={styles.addressRow}>
          <Icon name="navigation" size={16} color={colors.secondary} />
          <Text style={styles.addressText} numberOfLines={1}>
            {item.deliveryAddress}
          </Text>
        </View>
      </View>

      <View style={styles.offerActions}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleRejectOffer(item.id)}
        >
          <Icon name="x" size={18} color={colors.error} />
          <Text style={styles.rejectButtonText}>Reject</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptOffer(item.id)}
        >
          <Icon name="check" size={18} color="#fff" />
          <Text style={styles.acceptButtonText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderActiveTripCard = () => {
    if (!activeTrip) return null;

    return (
      <View style={styles.tripCard}>
        <View style={styles.tripHeader}>
          <Text style={styles.tripTitle}>Active Delivery</Text>
          <View style={[styles.statusBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.statusText}>{activeTrip.status}</Text>
          </View>
        </View>

        <View style={styles.tripAddresses}>
          <View style={styles.tripAddressRow}>
            <View style={styles.tripIcon}>
              <Icon name="home" size={16} color={colors.primary} />
            </View>
            <View style={styles.tripAddressContent}>
              <Text style={styles.tripAddressLabel}>Pickup</Text>
              <Text style={styles.tripAddressText}>{activeTrip.pickupAddress}</Text>
            </View>
          </View>

          <View style={styles.tripDivider} />

          <View style={styles.tripAddressRow}>
            <View style={styles.tripIcon}>
              <Icon name="navigation" size={16} color={colors.secondary} />
            </View>
            <View style={styles.tripAddressContent}>
              <Text style={styles.tripAddressLabel}>Delivery</Text>
              <Text style={styles.tripAddressText}>{activeTrip.deliveryAddress}</Text>
            </View>
          </View>
        </View>

        <View style={styles.tripActions}>
          {activeTrip.status !== 'picked_up' && (
            <TouchableOpacity
              style={styles.statusButton}
              onPress={handleMarkPickedUp}
            >
              <Icon name="package" size={18} color="#fff" />
              <Text style={styles.statusButtonText}>Mark Picked Up</Text>
            </TouchableOpacity>
          )}
          {activeTrip.status === 'picked_up' && (
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: colors.success }]}
              onPress={handleMarkDelivered}
            >
              <Icon name="check-circle" size={18} color="#fff" />
              <Text style={styles.statusButtonText}>Mark Delivered</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={offers}
        renderItem={renderOfferCard}
        keyExtractor={(item) => String(item._id || item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            {/* Online Toggle */}
            <View style={styles.toggleContainer}>
              <View>
                <Text style={styles.toggleLabel}>Delivery Status</Text>
                <Text style={styles.toggleStatus}>
                  {isOnline ? 'Online - Ready to accept' : 'Offline'}
                </Text>
              </View>
              <Switch
                value={isOnline}
                onValueChange={handleOnlineToggle}
                trackColor={{ false: '#ccc', true: colors.primary }}
                thumbColor={isOnline ? colors.primary : '#999'}
              />
            </View>

            {/* Location Sharing Status */}
            {isOnline && (
              <View style={styles.locationStatusCard}>
                <Icon
                  name="map-pin"
                  size={16}
                  color={colors.success}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.locationStatusText}>
                  {locationSharing ? 'Location sharing enabled' : 'Location sharing disabled'}
                </Text>
              </View>
            )}

            {/* Earnings Card */}
            <View style={styles.earningsCard}>
              <View>
                <Text style={styles.earningsLabel}>Today's Earnings</Text>
                <Text style={styles.earningsAmount}>${earnings.toFixed(2)}</Text>
              </View>
              <Icon name="dollar-sign" size={32} color={colors.primary} />
            </View>

            {/* Active Trip */}
            {activeTrip && (
              <>
                <Text style={styles.sectionTitle}>Current Delivery</Text>
                {renderActiveTripCard()}
              </>
            )}

            {/* Offers Section */}
            {offers.length > 0 && (
              <Text style={styles.sectionTitle}>Available Offers ({offers.length})</Text>
            )}
          </>
        }
        ListEmptyComponent={
          isOnline ? (
            <View style={styles.emptyState}>
              <Icon name="inbox" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No delivery offers available</Text>
              <Text style={styles.emptyStateSubtext}>Check back soon!</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="wifi-off" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>You're offline</Text>
              <Text style={styles.emptyStateSubtext}>Toggle online to receive offers</Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        scrollEnabled={true}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
  },
  toggleStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  locationStatusCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  locationStatusText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500',
  },
  earningsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  earningsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  earningsAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    marginTop: 12,
    marginBottom: 12,
  },
  offerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 4,
  },
  offerDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  priceTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  addressSection: {
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  addressText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  offerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: 8,
    paddingVertical: 10,
  },
  rejectButtonText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
  },
  acceptButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tripTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  tripAddresses: {
    marginBottom: 16,
  },
  tripAddressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tripIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tripAddressContent: {
    flex: 1,
  },
  tripAddressLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  tripAddressText: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '500',
  },
  tripDivider: {
    height: 20,
    width: 2,
    backgroundColor: '#f0f0f0',
    marginLeft: 15,
    marginVertical: 8,
  },
  tripActions: {
    flexDirection: 'row',
    gap: 10,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 8,
    paddingVertical: 12,
  },
  statusButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
});

export default DashboardScreen;
