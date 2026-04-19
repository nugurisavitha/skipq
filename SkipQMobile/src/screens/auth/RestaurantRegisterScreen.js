import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Picker,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme/colors';
import { authAPI } from '../../services/api';

const CUISINES = [
  { label: 'Select Cuisine', value: '' },
  { label: 'Indian', value: 'Indian' },
  { label: 'Chinese', value: 'Chinese' },
  { label: 'Italian', value: 'Italian' },
  { label: 'Fast Food', value: 'Fast Food' },
  { label: 'Bakery', value: 'Bakery' },
  { label: 'Cafe', value: 'Cafe' },
  { label: 'Desserts', value: 'Desserts' },
  { label: 'Beverages', value: 'Beverages' },
  { label: 'Mexican', value: 'Mexican' },
  { label: 'Continental', value: 'Continental' },
  { label: 'Multi-cuisine', value: 'Multi-cuisine' },
];

export default function RestaurantRegisterScreen({ navigation }) {
  const [restaurantName, setRestaurantName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!restaurantName.trim()) newErrors.restaurantName = 'Restaurant name is required';
    if (!ownerName.trim()) newErrors.ownerName = 'Owner name is required';
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Invalid email';
    if (!phone.trim()) newErrors.phone = 'Phone is required';
    else if (!/^[0-9]{10}$/.test(phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!cuisineType) newErrors.cuisineType = 'Cuisine type is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      await authAPI.registerRestaurant({
        restaurantName,
        ownerName,
        email,
        phone: phone.replace(/\D/g, ''),
        password,
        cuisineType,
      });
      Alert.alert(
        'Registration Successful',
        'Your restaurant registration is pending admin approval. You will receive an email when approved.'
      );
      navigation.navigate('Login');
    } catch (err) {
      Alert.alert(
        'Registration Failed',
        err.response?.data?.message || 'Please try again'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color={Colors.text} />
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Icon name="home" size={40} color={Colors.primary} />
              <Text style={styles.title}>Register Restaurant</Text>
              <Text style={styles.subtitle}>List your restaurant on SkipQ</Text>
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Restaurant Name</Text>
              <View style={[styles.inputContainer, errors.restaurantName && styles.inputError]}>
                <Icon name="home" size={18} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Your restaurant name"
                  placeholderTextColor={Colors.textMuted}
                  value={restaurantName}
                  onChangeText={setRestaurantName}
                  editable={!loading}
                />
              </View>
              {errors.restaurantName && (
                <Text style={styles.errorText}>{errors.restaurantName}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Owner Name</Text>
              <View style={[styles.inputContainer, errors.ownerName && styles.inputError]}>
                <Icon name="user" size={18} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Your full name"
                  placeholderTextColor={Colors.textMuted}
                  value={ownerName}
                  onChangeText={setOwnerName}
                  editable={!loading}
                />
              </View>
              {errors.ownerName && <Text style={styles.errorText}>{errors.ownerName}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                <Icon name="mail" size={18} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  editable={!loading}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.inputContainer, errors.phone && styles.inputError]}>
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
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cuisine Type</Text>
              <View style={[styles.pickerContainer, errors.cuisineType && styles.inputError]}>
                <Picker
                  selectedValue={cuisineType}
                  onValueChange={setCuisineType}
                  enabled={!loading}
                  style={styles.picker}
                >
                  {CUISINES.map((item) => (
                    <Picker.Item key={item.value} label={item.label} value={item.value} />
                  ))}
                </Picker>
              </View>
              {errors.cuisineType && <Text style={styles.errorText}>{errors.cuisineType}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                <Icon name="lock" size={18} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••••••"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Icon
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={18}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.buttonText}>Register Restaurant</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.info}>
            <Icon name="info" size={16} color={Colors.info} />
            <Text style={styles.infoText}>
              Your restaurant will be listed after admin verification. We will contact you via
              email for confirmation.
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Login</Text>
            </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  headerText: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts.bold,
    marginTop: Spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    fontFamily: Fonts.regular,
    textAlign: 'center',
  },
  form: {
    marginBottom: Spacing.xl,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
    fontFamily: Fonts.semiBold,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.inputBg,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: 14,
    color: Colors.text,
    marginHorizontal: Spacing.sm,
    fontFamily: Fonts.regular,
  },
  pickerContainer: {
    backgroundColor: Colors.inputBg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: Spacing.xs,
    fontFamily: Fonts.regular,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  info: {
    flexDirection: 'row',
    backgroundColor: `${Colors.info}15`,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  infoText: {
    flex: 1,
    color: Colors.info,
    fontSize: 12,
    marginLeft: Spacing.sm,
    fontFamily: Fonts.regular,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  footerText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
  },
  linkText: {
    color: Colors.primary,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
});
