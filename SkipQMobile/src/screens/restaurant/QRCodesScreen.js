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
  Image,
  Share,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { restaurantAPI, qrAPI } from '../../services/api';
import { colors } from '../../theme/colors';

const QRCodesScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [restaurantId, setRestaurantId] = useState(null);

  const [qrCodes, setQrCodes] = useState([]);
  const [selectedQRCode, setSelectedQRCode] = useState(null);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
  const [togglingQRId, setTogglingQRId] = useState(null);

  const [newQRData, setNewQRData] = useState({
    tableNumber: '',
    sectionName: '',
  });

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const restaurantRes = await restaurantAPI.getMine();
      const restaurantData = restaurantRes.data?.restaurant || restaurantRes.data;
      setRestaurantId(restaurantData._id || restaurantData.id);

      const qrCodesRes = await qrAPI.getByRestaurant(restaurantData._id || restaurantData.id);
      const qrCodesData = Array.isArray(qrCodesRes.data) ? qrCodesRes.data : (qrCodesRes.data?.qrCodes || []);
      setQrCodes(qrCodesData);
    } catch (err) {
      setError(err.message || 'Failed to fetch QR codes');
      console.error('QR codes fetch error:', err);
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

  const handleGenerateQR = async () => {
    if (!newQRData.tableNumber) {
      alert('Please enter a table number');
      return;
    }

    setGeneratingQR(true);
    try {
      const payload = {
        restaurantId,
        tableNumber: newQRData.tableNumber,
        sectionName: newQRData.sectionName || 'Main',
      };

      const newQR = await qrAPI.generate(payload);
      setQrCodes([...qrCodes, newQR]);
      setGenerateModalVisible(false);
      setNewQRData({ tableNumber: '', sectionName: '' });
    } catch (err) {
      console.error('Generate error:', err);
      alert('Failed to generate QR code');
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleToggleQR = async (qrCodeId, currentStatus) => {
    setTogglingQRId(qrCodeId);
    try {
      const updated = await qrAPI.toggle(qrCodeId, !currentStatus);
      setQrCodes(
        qrCodes.map(qr => (qr._id === qrCodeId ? updated : qr))
      );
    } catch (err) {
      console.error('Toggle error:', err);
      alert('Failed to toggle QR code');
    } finally {
      setTogglingQRId(null);
    }
  };

  const handleDeleteQR = (qrCodeId) => {
    Alert.alert(
      'Delete QR Code',
      'Are you sure you want to delete this QR code?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await qrAPI.delete(qrCodeId);
              setQrCodes(qrCodes.filter(qr => qr._id !== qrCodeId));
              setQrModalVisible(false);
            } catch (err) {
              console.error('Delete error:', err);
              alert('Failed to delete QR code');
            }
          },
        },
      ]
    );
  };

  const handleShareQR = async (qrCode) => {
    try {
      await Share.share({
        message: `QR Code for Table ${qrCode.tableNumber} - ${qrCode.sectionName}\n\nScan to place your order!`,
        title: `QR Code - Table ${qrCode.tableNumber}`,
        url: qrCode.imageUrl,
      });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const QRCodeCard = ({ qrCode }) => (
    <TouchableOpacity
      style={styles.qrCard}
      onPress={() => {
        setSelectedQRCode(qrCode);
        setQrModalVisible(true);
      }}
    >
      <View style={styles.qrCardContent}>
        <View style={styles.qrCardLeft}>
          <View style={styles.qrPreview}>
            {qrCode.imageUrl ? (
              <Image
                source={{ uri: qrCode.imageUrl }}
                style={styles.qrImage}
              />
            ) : (
              <Icon name="layers" size={32} color={colors.primary} />
            )}
          </View>
        </View>

        <View style={styles.qrCardInfo}>
          <Text style={styles.qrTableNumber}>Table {qrCode.tableNumber}</Text>
          <Text style={styles.qrSection}>{qrCode.sectionName}</Text>

          <View style={styles.qrStatus}>
            <Icon
              name={qrCode.isActive ? 'check-circle' : 'x-circle'}
              size={14}
              color={qrCode.isActive ? colors.success : colors.error}
            />
            <Text
              style={[
                styles.qrStatusText,
                { color: qrCode.isActive ? colors.success : colors.error },
              ]}
            >
              {qrCode.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        <View style={styles.qrCardActions}>
          {togglingQRId === qrCode._id ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <TouchableOpacity
              onPress={() => handleToggleQR(qrCode._id, qrCode.isActive)}
            >
              <Icon
                name={qrCode.isActive ? 'toggle-right' : 'toggle-left'}
                size={24}
                color={qrCode.isActive ? colors.success : '#ccc'}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading QR codes...</Text>
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
        <Text style={styles.title}>QR Codes</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setNewQRData({ tableNumber: '', sectionName: '' });
            setGenerateModalVisible(true);
          }}
        >
          <Icon name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* QR Codes List */}
      <FlatList
        data={qrCodes}
        keyExtractor={item => item._id}
        renderItem={({ item }) => <QRCodeCard qrCode={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Icon name="layers" size={48} color={colors.secondary + '40'} />
            <Text style={styles.emptyStateText}>No QR codes yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Create QR codes for your tables
            </Text>
          </View>
        }
      />

      {/* Generate QR Modal */}
      <Modal
        visible={generateModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setGenerateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Generate QR Code</Text>
              <TouchableOpacity onPress={() => setGenerateModalVisible(false)}>
                <Icon name="x" size={24} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formContainer}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Table Number *</Text>
                <View style={styles.input}>
                  <Text style={styles.inputLabel}>Table</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="e.g., 1, 2, A1"
                    value={newQRData.tableNumber}
                    onChangeText={text =>
                      setNewQRData({ ...newQRData, tableNumber: text })
                    }
                    editable={!generatingQR}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Section Name</Text>
                <View style={styles.input}>
                  <Text style={styles.inputLabel}>Section</Text>
                  <TextInput
                    style={styles.inputField}
                    placeholder="e.g., Main, Terrace, Garden"
                    value={newQRData.sectionName}
                    onChangeText={text =>
                      setNewQRData({ ...newQRData, sectionName: text })
                    }
                    editable={!generatingQR}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setGenerateModalVisible(false)}
                disabled={generatingQR}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleGenerateQR}
                disabled={generatingQR}
              >
                {generatingQR ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Generate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* QR Code Details Modal */}
      <Modal
        visible={qrModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setQrModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Table {selectedQRCode?.tableNumber}
              </Text>
              <TouchableOpacity onPress={() => setQrModalVisible(false)}>
                <Icon name="x" size={24} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailsContainer}>
              {selectedQRCode?.imageUrl && (
                <View style={styles.qrDisplayContainer}>
                  <Image
                    source={{ uri: selectedQRCode.imageUrl }}
                    style={styles.qrDisplay}
                  />
                </View>
              )}

              <View style={styles.detailsGroup}>
                <Text style={styles.detailLabel}>Table Number</Text>
                <Text style={styles.detailValue}>{selectedQRCode?.tableNumber}</Text>
              </View>

              <View style={styles.detailsGroup}>
                <Text style={styles.detailLabel}>Section</Text>
                <Text style={styles.detailValue}>
                  {selectedQRCode?.sectionName}
                </Text>
              </View>

              <View style={styles.detailsGroup}>
                <Text style={styles.detailLabel}>Status</Text>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: selectedQRCode?.isActive
                        ? colors.success + '20'
                        : colors.error + '20',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      {
                        color: selectedQRCode?.isActive
                          ? colors.success
                          : colors.error,
                      },
                    ]}
                  >
                    {selectedQRCode?.isActive ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsGroup}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>
                  {selectedQRCode?.createdAt
                    ? new Date(selectedQRCode.createdAt).toLocaleDateString()
                    : 'N/A'}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.detailsActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleShareQR(selectedQRCode)}
              >
                <Icon name="share-2" size={18} color={colors.primary} />
                <Text style={styles.actionButtonText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteActionButton]}
                onPress={() => handleDeleteQR(selectedQRCode._id)}
              >
                <Icon name="trash-2" size={18} color={colors.error} />
                <Text style={[styles.actionButtonText, { color: colors.error }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const TextInput = ({ value, onChangeText, editable, ...props }) => (
  <Text
    style={{
      fontSize: 14,
      color: colors.secondary,
      paddingVertical: 8,
    }}
    {...props}
  >
    {value || props.placeholder}
  </Text>
);

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
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  qrCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  qrCardLeft: {
    marginRight: 12,
  },
  qrPreview: {
    width: 80,
    height: 80,
    backgroundColor: colors.background,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#eee',
  },
  qrImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  qrCardInfo: {
    flex: 1,
  },
  qrTableNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 4,
  },
  qrSection: {
    fontSize: 13,
    color: '#999',
    marginBottom: 6,
  },
  qrStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  qrStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  qrCardActions: {
    justifyContent: 'center',
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
    marginBottom: 20,
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
  },
  inputLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  inputField: {
    fontSize: 14,
    color: colors.secondary,
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
  },
  qrDisplayContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrDisplay: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  detailsGroup: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '500',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
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
  detailsActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
  },
  deleteActionButton: {
    borderColor: colors.error,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default QRCodesScreen;
