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
import { authAPI } from '../../services/api';

export default function OTPLoginScreen({ navigation }) {
  const { loginWithOTP, isLoading } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState('phone');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errors, setErrors] = useState({});
  const [timer, setTimer] = useState(0);

  const validatePhone = () => {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phone.trim()) {
      setErrors({ phone: 'Phone number is required' });
      return false;
    }
    if (!phoneRegex.test(phone.replace(/\D/g, ''))) {
      setErrors({ phone: 'Enter a valid 10-digit phone number' });
      return false;
    }
    return true;
  };

  const handleSendOTP = async () => {
    if (!validatePhone()) return;
    setSending(true);
    setErrors({});
    try {
      const res = await authAPI.sendOTP(phone.replace(/\D/g, ''));
      const devOtp = res.data?.otp;
      if (devOtp) {
        Alert.alert('DEV OTP', `Your OTP is: ${devOtp}`);
      } else {
        Alert.alert('Success', 'OTP sent to your phone number');
      }
      setStage('otp');
      setTimer(60);
      const interval = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            clearInterval(interval);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } catch (err) {
      console.log(
        'OTP Error:',
        JSON.stringify(err?.response?.data || err?.message || err)
      );
      const msg =
        err.response?.data?.message || err?.message || 'Failed to send OTP';
      Alert.alert('OTP Error', msg);
      setErrors({ phone: msg });
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setErrors({ otp: 'OTP is required' });
      return;
    }
    if (otp.length !== 6) {
      setErrors({ otp: 'OTP must be 6 digits' });
      return;
    }
    setVerifying(true);
    setErrors({});
    try {
      await loginWithOTP(phone.replace(/\D/g, ''), otp);
    } catch (err) {
      setErrors({ otp: err.response?.data?.message || 'Invalid OTP' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Back button */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (stage === 'otp') {
                setStage('phone');
                setOtp('');
                setTimer(0);
              } else {
                navigation.goBack();
              }
            }}
          >
            <Icon name="arrow-left" size={24} color={Colors.text} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.headerSection}>
            <View style={styles.logoCircle}>
              <Icon name="smartphone" size={28} color={Colors.white} />
            </View>
            <Text style={styles.title}>{'OTP Login'}</Text>
            <Text style={styles.subtitle}>
              {stage === 'phone'
                ? 'Enter your phone number to receive an OTP'
                : `OTP sent to +91 ${phone}`}
            </Text>
          </View>

          {stage === 'phone' ? (
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{'Phone Number'}</Text>
                <View
                  style={[
                    styles.inputContainer,
                    errors.phone && styles.inputError,
                  ]}
                >
                  <Text style={styles.prefix}>{'+91'}</Text>
                  <View style={styles.prefixDivider} />
                  <TextInput
                    style={styles.input}
                    placeholder="10-digit phone number"
                    placeholderTextColor={Colors.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    editable={!sending}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
                {errors.phone ? (
                  <Text style={styles.errorText}>{errors.phone}</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, sending && styles.btnDisabled]}
                onPress={handleSendOTP}
                disabled={sending}
                activeOpacity={0.8}
              >
                {sending ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>{'Send OTP'}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.linkBtnText}>
                  {'Back to Email Login'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{'Enter OTP'}</Text>
                <View
                  style={[
                    styles.inputContainer,
                    styles.otpInputContainer,
                    errors.otp && styles.inputError,
                  ]}
                >
                  <TextInput
                    style={styles.otpInput}
                    placeholder="000000"
                    placeholderTextColor={Colors.textMuted}
                    value={otp}
                    onChangeText={setOtp}
                    editable={!verifying}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
                {errors.otp ? (
                  <Text style={styles.errorText}>{errors.otp}</Text>
                ) : null}
              </View>

              {timer > 0 ? (
                <Text style={styles.timerText}>
                  {'Resend OTP in '}
                  {timer}
                  {'s'}
                </Text>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryBtn, verifying && styles.btnDisabled]}
                onPress={handleVerifyOTP}
                disabled={verifying}
                activeOpacity={0.8}
              >
                {verifying ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={styles.primaryBtnText}>{'Verify OTP'}</Text>
                )}
              </TouchableOpacity>

              {timer === 0 ? (
                <TouchableOpacity
                  onPress={handleSendOTP}
                  disabled={sending}
                  style={styles.linkBtn}
                >
                  <Text style={styles.linkBtnText}>{'Resend OTP'}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
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
    paddingVertical: Spacing.lg,
  },
  backBtn: {
    marginBottom: Spacing.md,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
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
    height: 48,
  },
  prefix: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Fonts.semiBold,
  },
  prefixDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontFamily: Fonts.regular,
  },
  otpInputContainer: {
    justifyContent: 'center',
  },
  otpInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: Fonts.bold,
    textAlign: 'center',
    letterSpacing: 12,
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
  timerText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    fontFamily: Fonts.regular,
    fontSize: 13,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    height: 48,
    borderRadius: BorderRadius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
  linkBtn: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  linkBtnText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Fonts.semiBold,
  },
});
