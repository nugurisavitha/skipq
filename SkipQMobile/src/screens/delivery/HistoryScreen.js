import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../../theme/colors';
import { deliveryAPI } from '../../services/api';

const HistoryScreen = ({ navigation }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    totalEarnings: 0,
    totalDistance: 0,
  });

  const fetchHistory = useCallback(async () => {
    try {
      const res = await deliveryAPI.getHistory();
      const data = Array.isArray(res.data) ? res.data : (res.data?.history || []);
      setHistory(data || []);

      // Calculate stats
      if (data && data.length > 0) {
        const totalEarnings = data.reduce((sum, item) => sum + (item.earnings || 0), 0);
        const totalDistance = data.reduce((sum, item) => sum + (item.distance || 0), 0);

        setStats({
          totalDeliveries: data.length,
          totalEarnings,
          totalDistance,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load history');
      console.error('Error fetching history:', error);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    setLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  }, [fetchHistory]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderHistoryCard = ({ item }) => (
    <TouchableOpacity
      style={styles.historyCard}
      onPress={() => navigation.navigate('DeliveryDetail', { deliveryId: item._id || item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.dateCircle}>
            <Icon name="check-circle" size={24} color={colors.success} />
          </View>
          <View>
            <Text style={styles.restaurantName}>{item.restaurantName}</Text>
            <Text style={styles.dateText}>{formatDate(item.completedAt)}</Text>
          </View>
        </View>
        <View style={styles.earningsBox}>
          <Text style={styles.earningsLabel}>Earned</Text>
          <Text style={styles.earningsAmount}>${item.earnings?.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailItem}>
          <Icon name="navigation-2" size={16} color={colors.primary} />
          <Text style={styles.detailValue}>{item.distance?.toFixed(1)} km</Text>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailItem}>
          <Icon name="clock" size={16} color={colors.secondary} />
          <Text style={styles.detailValue}>{item.duration || 'N/A'}</Text>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailItem}>
          <Icon name="star" size={16} color="#ffc107" />
          <Text style={styles.detailValue}>{item.rating || '—'}/5</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
        data={history}
        renderItem={renderHistoryCard}
        keyExtractor={(item) => String(item._id || item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Delivery History</Text>
              <Text style={styles.headerSubtitle}>Your completed deliveries</Text>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#e3f2fd' }]}>
                  <Icon name="check-circle" size={24} color={colors.secondary} />
                </View>
                <Text style={styles.statValue}>{stats.totalDeliveries}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#f3e5f5' }]}>
                  <Icon name="dollar-sign" size={24} color={colors.primary} />
                </View>
                <Text style={styles.statValue}>${stats.totalEarnings.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Total Earned</Text>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: '#f0f4c3' }]}>
                  <Icon name="navigation-2" size={24} color="#fbc02d" />
                </View>
                <Text style={styles.statValue}>{stats.totalDistance.toFixed(0)}</Text>
                <Text style={styles.statLabel}>km Driven</Text>
              </View>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="inbox" size={48} color="#ccc" />
            <Text style={styles.emptyStateText}>No delivery history</Text>
            <Text style={styles.emptyStateSubtext}>
              Completed deliveries will appear here
            </Text>
          </View>
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
    paddingBottom: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#999',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
  },
  historyCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateCircle: {
    marginRight: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  earningsBox: {
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  earningsAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  detailDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#f0f0f0',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
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

export default HistoryScreen;
