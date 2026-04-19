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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { Colors, Fonts, Spacing, BorderRadius } from '../../theme/colors';
import { useAuth } from '../../hooks/useAuth';

export default function LoginScreen({ navigation }) {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      newErrors.email = 'Invalid email';
    if (!password) newErrors.password = 'Password is required';
    if (password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    try {
      await login(email, password);
    } catch (err) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Brand Header */}
          <View style={styles.brandHeader}>
            <View style={styles.logoCircle}>
              <Icon name="zap" size={32} color={Colors.white} />
            </View>
            <Text style={styles.brandName}>{'SkipQ'}</Text>
            <Text style={styles.brandTagline}>
              {'Skip the queue, enjoy your food'}
            </Text>
          </View>

          {/* Login Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{'Welcome Back'}</Text>
            <Text style={styles.formSubtitle}>
              {'Sign in to your account'}
            </Text>

            <View style={styles.inputGroup}>
              <View
                style={[styles.inputContainer, errors.email && styles.inputError]}
              >
                <Icon name="mail" size={18} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor={Colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email ? (
                <Text style={styles.errorText}>{errors.email}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.inputContainer,
                  errors.password && styles.inputError,
                ]}
              >
                <Icon name="lock" size={18} color={Colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={Colors.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Icon
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={18}
                    color={Colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {errors.password ? (
                <Text style={styles.errorText}>{errors.password}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'Reset Password',
                  'Password reset feature coming soon.'
                )
              }
            >
              <Text style={styles.forgotText}>{'Forgot password?'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.loginButtonText}>{'Sign In'}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>{'or'}</Text>
            <View style={styles.line} />
          </View>

          {/* OTP Login */}
          <TouchableOpacity
            style={styles.otpButton}
            onPress={() => navigation.navigate('OTPLogin')}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Icon name="smartphone" size={18} color={Colors.primary} />
            <Text style={styles.otpButtonText}>{'Login with Mobile OTP'}</Text>
          </TouchableOpacity>

          {/* Sign Up */}
          <View style={styles.signupRow}>
            <Text style={styles.signupText}>{"Don't have an account? "}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signupLink}>{'Sign Up'}</Text>
            </TouchableOpacity>
          </View>

          {/* Partner Links */}
          <View style={styles.partnerSection}>
            <Text style={styles.partnerLabel}>{'Are you a partner?'}</Text>
            <View style={styles.partnerLinks}>
              <TouchableOpacity
                style={styles.partnerLink}
                onPress={() => navigation.navigate('RestaurantRegister')}
              >
                <Icon name="home" size={16} color={Colors.primary} />
                <Text style={styles.partnerLinkText}>
                  {'Register Restaurant'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.partnerLink}
                onPress={() => navigation.navigate('DeliverySignup')}
              >
                <Icon name="truck" size={16} color={Colors.primary} />
                <Text style={styles.partnerLinkText}>
                  {'Join as Delivery Partner'}
                </Text>
              </TouchableOpacity>
            </View>
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
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
    marginTop: Spacing.xl,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  brandName: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts.bold,
    marginTop: Spacing.md,
  },
  brandTagline: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontFamily: Fonts.regular,
  },
  formCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  formSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
    fontFamily: Fonts.regular,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.boxBg,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    marginHorizontal: Spacing.sm,
    fontFamily: Fonts.regular,
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
  forgotText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
    textAlign: 'right',
    marginBottom: Spacing.lg,
    fontFamily: Fonts.medium,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    fontSize: 13,
  },
  otpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    height: 48,
    borderRadius: BorderRadius.pill,
    gap: Spacing.sm,
  },
  otpButtonText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  signupText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  signupLink: {
    color: Colors.primary,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
    fontSize: 14,
  },
  partnerSection: {
    marginTop: Spacing.xxxl,
    alignItems: 'center',
  },
  partnerLabel: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: Fonts.regular,
    marginBottom: Spacing.md,
  },
  partnerLinks: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  partnerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  partnerLinkText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
    fontFamily: Fonts.medium,
  },
});
