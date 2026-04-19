import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { restaurantAPI } from '../../services/api';
import { colors } from '../../theme/colors';

const TablesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);

  const [tables, setTables] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    number: '',
    capacity: '',
    sectionName: '',
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const restaurantRes = await restaurantAPI.getMine();
      const restaurantData = restaurantRes.data?.restaurant || restaurantRes.data;
      setRestaurantId(restaurantData._id || restaurantData.id);

      // Assuming tables are stored in restaurant.tables
      const tablesData = restaurantData.tables || [];
      setTables(tablesData);
    } catch (err) {
      setError(err.message || 'Failed to fetch tables');
      console.error('Tables fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchData();
    }, [fetchData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleAddPress = () => {
    setEditingTable(null);
    setFormData({
      number: '',
      capacity: '',
      sectionName: '',
    });
    setModalVisible(true);
  };

  const handleEditPress = (table) => {
    setEditingTable(table);
    setFormData({
      number: table.number.toString(),
      capacity: table.capacity.toString(),
      sectionName: table.sectionName || '',
    });
    setModalVisible(true);
  };

  const handleDeletePress = (tableId) => {
    Alert.alert('Delete Table', 'Are you sure you want to delete this table?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setTables(tables.filter(t => t._id !== tableId));
        },
      },
    ]);
  };

  const handleSubmit = async () => {
    if (!formData.number || !formData.capacity) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        number: parseInt(formData.number),
        capacity: parseInt(formData.capacity),
        sectionName: formData.sectionName || 'Main',
      };

      if (editingTable) {
        const updated = {
          ...editingTable,
          ...payload,
        };
        setTables(tables.map(t => (t._id === editingTable._id ? updated : t)));
      } else {
        const newTable = {
          _id: Date.now().toString(),
          ...payload,
          status: 'available',
        };
        setTables([...tables, newTable]);
      }

      setModalVisible(false);
    } catch (err) {
      console.error('Submit error:', err);
      alert('Failed to save table');
    } finally {
      setSubmitting(false);
    }
  };

  const getTableStatus = (table) => {
    return table.status || 'available';
  };

  const getStatusColor = (status) => {
    const colors_map = {
      available: colors.success,
      occupied: '#2196F3',
      reserved: '#FF9800',
      maintenance: colors.error,
    };
    return colors_map[status] || colors.primary;
  };

  const TableCard = ({ table }) => {
    const status = getTableStatus(table);
    const statusColor = getStatusColor(status);

    return (
      <View style={[styles.tableCard, { borderLeftColor: statusColor }]}>
        <View style={styles.tableContent}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableNumber}>Table {table.number}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColor + '20', borderColor: statusColor },
              ]}
            >
              <Text style={[styles.statusText, { color: statusColor }]}>
                {status.replace('-', ' ').toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={styles.tableDetails}>
            <View style={styles.detail}>
              <Icon name="users" size={14} color="#999" />
              <Text style={styles.detailText}>
                {table.capacity} {table.capacity === 1 ? 'person' : 'persons'}
              </Text>
            </View>
            {table.sectionName && (
              <View style={styles.detail}>
                <Icon name="map-pin" size={14} color="#999" />
                <Text style={styles.detailText}>{table.sectionName}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.tableActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditPress(table)}
          >
            <Icon name="edit-2" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeletePress(table._id)}
          >
            <Icon name="trash-2" size={16} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading tables...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Icon name="alert-circle" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setLoading(true);
              fetchData();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tables</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPress}>
          <Icon name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{tables.length}</Text>
          <Text style={styles.statLabel}>Total Tables</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {tables.filter(t => getTableStatus(t) === 'available').length}
          </Text>
          <Text style={styles.statLabel}>Available</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {tables.filter(t => getTableStatus(t) === 'occupied').length}
          </Text>
          <Text style={styles.statLabel}>Occupied</Text>
        </View>
      </View>

      {/* Tables Grid */}
      <FlatList
        data={tables}
        keyExtractor={item => item._id}
        renderItem={({ item }) => <TableCard table={item} />}
        numColumns={1}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="grid" size={48} color={colors.secondary + '40'} />
            <Text style={styles.emptyStateText}>No tables yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Create tables to manage your seating
            </Text>
          </View>
        }
      />

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingTable ? 'Edit Table' : 'Add New Table'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="x" size={24} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Table Number *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 1, 2, 3"
                  value={formData.number}
                  onChangeText={text => setFormData({ ...formData, number: text })}
                  keyboardType="number-pad"
                  editable={!submitting}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Capacity (Persons) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., 2, 4, 6"
                  value={formData.capacity}
                  onChangeText={text => setFormData({ ...formData, capacity: text })}
                  keyboardType="number-pad"
                  editable={!submitting}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Section Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Main, Terrace, VIP"
                  value={formData.sectionName}
                  onChangeText={text =>
                    setFormData({ ...formData, sectionName: text })
                  }
                  editable={!submitting}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {editingTable ? 'Update' : 'Add'} Table
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tableCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  tableContent: {
    flex: 1,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tableNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tableDetails: {
    gap: 4,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: '#999',
  },
  tableActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 4,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  errorText: {
    fontSize: 14,
    color: colors.error,
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: colors.background,
    marginTop: '20%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.secondary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default TablesScreen;
