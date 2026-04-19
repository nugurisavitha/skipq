import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';
import { authAPI } from '../../services/api';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = 'Invalid email';
    if (!phone.trim()) newErrors.phone = 'Phone is required';
    else if (!/^[0-9]{10}$/.test(phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await authAPI.updateProfile({
        name,
        email,
        phone: phone.replace(/\D/g, ''),
      });
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      Alert.alert(
        'Error',
        err.response?.data?.message || 'Failed to update profile'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: () => logout(), style: 'destructive' },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const initials = (user.name || 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{'Profile'}</Text>
          {isEditing ? (
            <TouchableOpacity onPress={() => setIsEditing(false)}>
              <Text style={styles.cancelText}>{'Cancel'}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Icon name="edit-2" size={20} color={Colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Avatar Card */}
          <View style={styles.avatarCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>
                {user.role
                  ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
                  : 'Customer'}
              </Text>
            </View>
          </View>

          {isEditing ? (
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>
                {'Personal Information'}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{'Full Name'}</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.name && styles.inputError,
                  ]}
                >
                  <Icon name="user" size={18} color={Colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Your name"
                    placeholderTextColor={Colors.textMuted}
                    value={name}
                    onChangeText={setName}
                    editable={!loading}
                  />
                </View>
                {errors.name ? (
                  <Text style={styles.errorText}>{errors.name}</Text>
                ) : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{'Email'}</Text>
                <View style={[styles.inputContainer, styles.inputDisabled]}>
                  <Icon name="mail" size={18} color={Colors.textMuted} />
                  <TextInput
                    style={[styles.input, styles.inputTextDisabled]}
                    value={email}
                    editable={false}
                  />
                  <Icon name="lock" size={14} color={Colors.textMuted} />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{'Phone Number'}</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.phone && styles.inputError,
                  ]}
                >
                  <Icon name="phone" size={18} color={Colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="10-digit phone number"
                    placeholderTextColor={Colors.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    editable={!loading}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
                {errors.phone ? (
                  <Text style={styles.errorText}>{errors.phone}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={[styles.saveButton, loading && styles.btnDisabled]}
                onPress={handleUpdateProfile}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.saveButtonText}>{'Save Changes'}</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>
                {'Personal Information'}
              </Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Icon name="user" size={18} color={Colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{'Full Name'}</Text>
                    <Text style={styles.infoValue}>{user.name}</Text>
                  </View>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Icon name="mail" size={18} color={Colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{'Email'}</Text>
                    <Text style={styles.infoValue}>{user.email}</Text>
                  </View>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Icon name="phone" size={18} color={Colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>{'Phone Number'}</Text>
                    <Text style={styles.infoValue}>
                      {user.phone || 'Not set'}
                    </Text>
                  </View>
                </View>
                {user.createdAt ? (
                  <>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                      <Icon
                        name="calendar"
                        size={18}
                        color={Colors.primary}
                      />
                      <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>
                          {'Member Since'}
                        </Text>
                        <Text style={styles.infoValue}>
                          {new Date(user.createdAt).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            }
                          )}
                        </Text>
                      </View>
                    </View>
                  </>
                ) : null}
              </View>
            </View>
          )}

          {/* Quick Links */}
          <View style={styles.linksSection}>
            <Text style={styles.sectionTitle}>{'Quick Links'}</Text>
            <View style={styles.linksCard}>
              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => navigation.navigate('Orders')}
              >
                <View style={styles.linkLeft}>
                  <View
                    style={[styles.linkIcon, { backgroundColor: '#FFF5E6' }]}
                  >
                    <Icon name="shopping-bag" size={18} color={Colors.primary} />
                  </View>
                  <Text style={styles.linkText}>{'My Orders'}</Text>
                </View>
                <Icon
                  name="chevron-right"
                  size={18}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
              <View style={styles.linkDivider} />
              <TouchableOpacity
                style={styles.linkRow}
                onPress={() => navigation.getParent()?.navigate('Home')}
              >
                <View style={styles.linkLeft}>
                  <View
                    style={[styles.linkIcon, { backgroundColor: '#EBF0FC' }]}
                  >
                    <Icon name="grid" size={18} color={Colors.info} />
                  </View>
                  <Text style={styles.linkText}>
                    {'Browse Restaurants'}
                  </Text>
                </View>
                <Icon
                  name="chevron-right"
                  size={18}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Icon name="log-out" size={18} color={Colors.error} />
            <Text style={styles.logoutButtonText}>{'Logout'}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{'SkipQ v1.0.0'}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  cancelText: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  // Avatar card
  avatarCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    fontFamily: Fonts.bold,
  },
  userEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: Spacing.xs,
    fontFamily: Fonts.regular,
  },
  roleBadge: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 4,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.pill,
  },
  roleText: {
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  // Info section
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Fonts.semiBold,
    marginBottom: Spacing.md,
  },
  infoSection: {
    marginBottom: Spacing.xl,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  infoDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginTop: 2,
    fontFamily: Fonts.medium,
  },
  // Form
  formSection: {
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
    fontFamily: Fonts.semiBold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.boxBg,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    height: 46,
  },
  inputDisabled: {
    backgroundColor: Colors.border + '40',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    marginHorizontal: Spacing.sm,
    fontFamily: Fonts.regular,
  },
  inputTextDisabled: {
    color: Colors.textMuted,
  },
  inputError: {
    borderWidth: 1,
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: Spacing.xs,
    fontFamily: Fonts.regular,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  btnDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  // Quick Links
  linksSection: {
    marginBottom: Spacing.xl,
  },
  linksCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  linkIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    fontFamily: Fonts.medium,
  },
  linkDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },
  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderWidth: 1.5,
    borderColor: Colors.error,
    borderRadius: BorderRadius.pill,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  logoutButtonText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
  },
});
