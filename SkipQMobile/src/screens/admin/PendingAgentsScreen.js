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

const PendingAgentsScreen = ({ navigation }) => {
  const [pendingAgents, setPendingAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const fetchPendingAgents = useCallback(async () => {
    try {
      const res = await deliveryAPI.getPendingAgents();
      const data = Array.isArray(res.data) ? res.data : (res.data?.agents || []);
      setPendingAgents(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load pending agents');
      console.error('Error fetching pending agents:', error);
    }
  }, []);

  useEffect(() => {
    fetchPendingAgents();
    setLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPendingAgents();
    setRefreshing(false);
  }, [fetchPendingAgents]);

  const handleApprove = async (agentId) => {
    setProcessingId(agentId);
    try {
      await deliveryAPI.setAgentApproval(agentId, true);
      Alert.alert('Success', 'Agent approved successfully');
      fetchPendingAgents();
    } catch (error) {
      Alert.alert('Error', 'Failed to approve agent');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (agentId) => {
    Alert.alert('Reject Agent', 'Are you sure you want to reject this agent?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          setProcessingId(agentId);
          try {
            await deliveryAPI.setAgentApproval(agentId, false);
            Alert.alert('Success', 'Agent rejected');
            fetchPendingAgents();
          } catch (error) {
            Alert.alert('Error', 'Failed to reject agent');
          } finally {
            setProcessingId(null);
          }
        },
      },
    ]);
  };

  const getVehicleIcon = (vehicleType) => {
    switch (vehicleType) {
      case 'bike':
        return 'navigation-2';
      case 'scooter':
        return 'navigation-2';
      case 'car':
        return 'truck';
      case 'van':
        return 'truck';
      default:
        return 'navigation';
    }
  };

  const renderAgentCard = ({ item }) => (
    <View style={styles.agentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.agentInfo}>
          <View style={styles.avatar}>
            <Icon name="user" size={24} color="#fff" />
          </View>
          <View style={styles.agentDetails}>
            <Text style={styles.agentName}>{item.name}</Text>
            <Text style={styles.agentEmail}>{item.email}</Text>
          </View>
        </View>
        <View style={styles.applicationDate}>
          <Text style={styles.applicationDateLabel}>Applied</Text>
          <Text style={styles.applicationDateValue}>
            {new Date(item.appliedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
      </View>

      <View style={styles.agentDetails_}>
        <View style={styles.detailRow}>
          <Icon name="phone" size={16} color={colors.primary} />
          <Text style={styles.detailText}>{item.phone}</Text>
        </View>
        <View style={styles.detailRow}>
          <Icon name={getVehicleIcon(item.vehicleType)} size={16} color={colors.secondary} />
          <Text style={styles.detailText}>
            {item.vehicleType.charAt(0).toUpperCase() + item.vehicleType.slice(1)}
          </Text>
        </View>
      </View>

      {item.documents && (
        <View style={styles.documentsSection}>
          <Text style={styles.documentsLabel}>Documents:</Text>
          <View style={styles.documentsList}>
            {item.documents.map((doc, idx) => (
              <View key={idx} style={styles.documentItem}>
                <Icon name="file-text" size={14} color={colors.primary} />
                <Text style={styles.documentText}>{doc}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleReject(item._id || item.id)}
          disabled={processingId === (item._id || item.id)}
        >
          {processingId === (item._id || item.id) ? (
            <ActivityIndicator color={colors.error} size="small" />
          ) : (
            <>
              <Icon name="x" size={18} color={colors.error} />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => handleApprove(item._id || item.id)}
          disabled={processingId === (item._id || item.id)}
        >
          {processingId === item.id ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Icon name="check" size={18} color="#fff" />
              <Text style={styles.approveButtonText}>Approve</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
        data={pendingAgents}
        renderItem={renderAgentCard}
        keyExtractor={(item) => String(item._id || item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Pending Agents</Text>
            <Text style={styles.subtitle}>
              {pendingAgents.length} agent{pendingAgents.length !== 1 ? 's' : ''} awaiting approval
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="check-circle" size={48} color={colors.success} />
            <Text style={styles.emptyStateText}>All caught up!</Text>
            <Text style={styles.emptyStateSubtext}>No pending agents to review</Text>
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
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  agentCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  agentInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  agentDetails: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 2,
  },
  agentEmail: {
    fontSize: 12,
    color: '#999',
  },
  applicationDate: {
    alignItems: 'center',
  },
  applicationDateLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  applicationDateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  agentDetails_: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 13,
    color: colors.secondary,
    marginLeft: 8,
  },
  documentsSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  documentsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 8,
  },
  documentsList: {
    gap: 6,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  documentText: {
    fontSize: 12,
    color: '#666',
  },
  actionButtons: {
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
    paddingVertical: 12,
    gap: 6,
  },
  rejectButtonText: {
    color: colors.error,
    fontWeight: '600',
    fontSize: 14,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingVertical: 12,
    gap: 6,
  },
  approveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyStateText: {
    fontSize: 18,
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

export default PendingAgentsScreen;
