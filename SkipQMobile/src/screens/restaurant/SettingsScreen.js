import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { restaurantAPI } from '../../services/api';
import { colors } from '../../theme/colors';

const SettingsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    openingTime: '09:00',
    closingTime: '22:00',
    deliveryFee: '',
    minimumOrder: '',
    prepTime: '',
    isSelfService: false,
  });

  // Fetch restaurant data
  useFocusEffect(
    useCallback(() => {
      fetchRestaurantData();
    }, [])
  );

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await restaurantAPI.getMine();
      const data = res.data?.restaurant || res.data;

      setFormData({
        name: data.name || '',
        description: data.description || '',
        phone: data.phone || '',
        email: data.email || '',
        openingTime: data.openingTime || '09:00',
        closingTime: data.closingTime || '22:00',
        deliveryFee: (data.deliveryFee || 0).toString(),
        minimumOrder: (data.minimumOrder || 0).toString(),
        prepTime: (data.prepTime || 30).toString(),
        isSelfService: data.isSelfService || false,
      });
      setHasChanges(false);
    } catch (err) {
      setError(err.message || 'Failed to load settings');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: formData.name,
        description: formData.description,
        phone: formData.phone,
        email: formData.email,
        openingTime: formData.openingTime,
        closingTime: formData.closingTime,
        deliveryFee: parseFloat(formData.deliveryFee) || 0,
        minimumOrder: parseFloat(formData.minimumOrder) || 0,
        prepTime: parseInt(formData.prepTime) || 30,
        isSelfService: formData.isSelfService,
      };

      await restaurantAPI.update(payload);

      setHasChanges(false);
      Alert.alert('Success', 'Settings saved successfully!', [
        { text: 'OK', onPress: () => {} },
      ]);
    } catch (err) {
      setError(err.message || 'Failed to save settings');
      console.error('Save error:', err);
      Alert.alert('Error', error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          logout();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Error Message */}
        {error && (
          <View style={styles.errorBanner}>
            <Icon name="alert-circle" size={16} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Restaurant Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restaurant Profile</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Restaurant Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter restaurant name"
              value={formData.name}
              onChangeText={text => handleChange('name', text)}
              editable={!saving}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textAreaInput]}
              placeholder="Brief description of your restaurant"
              value={formData.description}
              onChangeText={text => handleChange('description', text)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              editable={!saving}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 9876543210"
              value={formData.phone}
              onChangeText={text => handleChange('phone', text)}
              keyboardType="phone-pad"
              editable={!saving}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="restaurant@example.com"
              value={formData.email}
              onChangeText={text => handleChange('email', text)}
              keyboardType="email-address"
              editable={!saving}
            />
          </View>
        </View>

        {/* Operating Hours Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Operating Hours</Text>

          <View style={styles.rowContainer}>
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Opening Time</Text>
              <TextInput
                style={styles.input}
                placeholder="09:00"
                value={formData.openingTime}
                onChangeText={text => handleChange('openingTime', text)}
                editable={!saving}
              />
            </View>

            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Closing Time</Text>
              <TextInput
                style={styles.input}
                placeholder="22:00"
                value={formData.closingTime}
                onChangeText={text => handleChange('closingTime', text)}
                editable={!saving}
              />
            </View>
          </View>
        </View>

        {/* Delivery Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Settings</Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Delivery Fee (Rs.)</Text>
            <TextInput
              style={styles.input}
              placeholder="50"
              value={formData.deliveryFee}
              onChangeText={text => handleChange('deliveryFee', text)}
              keyboardType="decimal-pad"
              editable={!saving}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Minimum Order (Rs.)</Text>
            <TextInput
              style={styles.input}
              placeholder="200"
              value={formData.minimumOrder}
              onChangeText={text => handleChange('minimumOrder', text)}
              keyboardType="decimal-pad"
              editable={!saving}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Preparation Time (minutes)</Text>
            <TextInput
              style={styles.input}
              placeholder="30"
              value={formData.prepTime}
              onChangeText={text => handleChange('prepTime', text)}
              keyboardType="number-pad"
              editable={!saving}
            />
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>

          <View style={styles.toggleGroup}>
            <View>
              <Text style={styles.toggleLabel}>Self-Service Mode</Text>
              <Text style={styles.toggleDescription}>
                Allow customers to place orders using QR codes
              </Text>
            </View>
            <Switch
              value={formData.isSelfService}
              onValueChange={value => handleChange('isSelfService', value)}
              trackColor={{ false: '#ccc', true: colors.primary + '40' }}
              thumbColor={formData.isSelfService ? colors.primary : '#ccc'}
              disabled={saving}
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.accountInfo}>
            <View style={styles.accountField}>
              <Text style={styles.accountLabel}>Account Owner</Text>
              <Text style={styles.accountValue}>{user?.name || 'N/A'}</Text>
            </View>
            <View style={styles.accountField}>
              <Text style={styles.accountLabel}>Email</Text>
              <Text style={styles.accountValue}>{user?.email || 'N/A'}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Icon name="log-out" size={18} color={colors.error} />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Spacer */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Save Button */}
      {hasChanges && (
        <View style={styles.saveButtonContainer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              saving && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="save" size={18} color="#fff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.secondary,
  },
  scrollView: {
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.error + '15',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 6,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: colors.error,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.secondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  formGroup: {
    marginBottom: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
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
  textAreaInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  toggleGroup: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.secondary,
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 12,
    color: '#999',
  },
  accountInfo: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  accountField: {
    marginBottom: 12,
  },
  accountField: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accountField: {
    paddingBottom: 12,
  },
  accountLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    fontWeight: '500',
  },
  accountValue: {
    fontSize: 14,
    color: colors.secondary,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  saveButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: colors.primary,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  saveButtonDisabled: {
    backgroundColor: colors.primary + '80',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});

export default SettingsScreen;
