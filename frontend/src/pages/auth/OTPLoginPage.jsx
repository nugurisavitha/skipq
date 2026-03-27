import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiPhone, FiLoader, FiArrowLeft, FiUser, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function OTPLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithOTP, isAuthenticated, user } = useAuth();

  const [step, setStep] = useState('phone'); // 'phone' | 'otp' | 'name'
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(new Array(OTP_LENGTH).fill(''));
  const [name, setName] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [resendTimer, setResendTimer] = useState(0);
  const [devOtp, setDevOtp] = useState('');

  const otpRefs = useRef([]);
  const from = location.state?.from?.pathname || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const roleRedirects = {
        customer: '/',
        delivery_admin: '/delivery/dashboard',
        restaurant_admin: '/restaurant-admin/dashboard',
        admin: '/admin/dashboard',
        super_admin: '/admin/dashboard',
      };
      navigate(roleRedirects[user.role] || from);
    }
  }, [isAuthenticated, user, navigate, from]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Auto-focus first OTP input
  useEffect(() => {
    if (step === 'otp' && otpRefs.current[0]) {
      otpRefs.current[0].focus();
    }
  }, [step]);

  const validatePhone = (value) => /^[6-9]\d{9}$/.test(value);

  const handleSendOTP = async (e) => {
    e?.preventDefault();

    if (!phone || !validatePhone(phone)) {
      setErrors({ phone: 'Enter a valid 10-digit mobile number starting with 6-9' });
      return;
    }

    setErrors({});
    setIsLoading(true);
    try {
      const { default: api } = await import('../../services/api');
      const response = await api.auth.sendOTP(phone);
      const data = response.data?.data;

      setIsNewUser(data?.isNewUser || false);

      // In development, auto-fill OTP if returned
      if (data?.otp) {
        setDevOtp(data.otp);
      }

      setResendTimer(RESEND_COOLDOWN);
      setStep('otp');
      toast.success('OTP sent to your mobile number');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send OTP';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setErrors({});

    // Auto-advance to next input
    if (value && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === OTP_LENGTH - 1 && newOtp.every((d) => d)) {
      handleVerifyOTP(null, newOtp.join(''));
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOTPPaste = (e) => {
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      otpRefs.current[OTP_LENGTH - 1]?.focus();
      // Auto-submit
      setTimeout(() => handleVerifyOTP(null, pastedData), 100);
    }
  };

  const handleVerifyOTP = async (e, otpString) => {
    e?.preventDefault();
    const code = otpString || otp.join('');

    if (code.length !== OTP_LENGTH) {
      setErrors({ otp: 'Please enter the complete 6-digit OTP' });
      return;
    }

    // If new user, need name first
    if (isNewUser && !name.trim()) {
      setStep('name');
      return;
    }

    setErrors({});
    setIsLoading(true);
    try {
      const userData = await loginWithOTP(phone, code, isNewUser ? name.trim() : undefined);
      toast.success(isNewUser ? 'Welcome to SkipQ!' : 'Login successful!');

      const roleRedirects = {
        customer: '/',
        delivery_admin: '/delivery/dashboard',
      };
      navigate(roleRedirects[userData.role] || from);
    } catch (error) {
      const message = error.response?.data?.message || 'Verification failed';
      // If backend says name is required
      if (error.response?.data?.data?.isNewUser) {
        setIsNewUser(true);
        setStep('name');
        return;
      }
      toast.error(message);
      // Reset OTP on failure
      if (message.toLowerCase().includes('expired') || message.toLowerCase().includes('not found')) {
        setOtp(new Array(OTP_LENGTH).fill(''));
        setStep('phone');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrors({ name: 'Please enter your name' });
      return;
    }
    handleVerifyOTP(null, otp.join(''));
  };

  const handleResendOTP = () => {
    if (resendTimer > 0) return;
    setOtp(new Array(OTP_LENGTH).fill(''));
    handleSendOTP();
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-5xl">
        <div className="grid md:grid-cols-2 gap-0 rounded-[15px] overflow-hidden shadow-lg">
          {/* Left Panel - Branding */}
          <div className="hidden md:flex bg-gradient-to-br from-primary to-primary-dark p-8 flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">
                {step === 'phone' && 'Login with Mobile'}
                {step === 'otp' && 'Verify OTP'}
                {step === 'name' && 'Almost There!'}
              </h2>
              <p className="text-white/80 text-lg leading-relaxed">
                {step === 'phone' && 'Quick and secure login with OTP verification. No passwords needed!'}
                {step === 'otp' && `We've sent a 6-digit code to +91 ${phone}. Enter it below.`}
                {step === 'name' && "Welcome to SkipQ! Tell us your name to get started."}
              </p>
            </div>

            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2 text-white/70 text-sm">
                <FiShield className="w-4 h-4" />
                <span>Secure OTP verification</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="bg-white p-8 flex flex-col justify-center">
            {/* Mobile Header */}
            <div className="md:hidden text-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {step === 'phone' && 'Login with Mobile'}
                {step === 'otp' && 'Verify OTP'}
                {step === 'name' && 'Your Name'}
              </h1>
            </div>

            {/* Step: Phone Number */}
            {step === 'phone' && (
              <form onSubmit={handleSendOTP} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-sm">+91</span>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(val);
                        setErrors({});
                      }}
                      className={`input-field pl-14 w-full border-1 focus:border-primary focus:shadow-md focus:shadow-primary/20 transition-all text-lg tracking-wider ${
                        errors.phone ? 'border-red-500' : ''
                      }`}
                      placeholder="98765 43210"
                      disabled={isLoading}
                      autoFocus
                      inputMode="numeric"
                    />
                    <FiPhone className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>
                  {errors.phone && (
                    <p className="mt-2 text-sm text-red-500 font-medium">{errors.phone}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || phone.length !== 10}
                  className="btn-primary w-full flex items-center justify-center space-x-2 mt-8 bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/30 transition-all font-semibold py-3 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <FiLoader className="w-5 h-5 animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <span>Send OTP</span>
                  )}
                </button>
              </form>
            )}

            {/* Step: OTP Verification */}
            {step === 'otp' && (
              <form onSubmit={(e) => handleVerifyOTP(e)} className="space-y-5">
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => {
                    setStep('phone');
                    setOtp(new Array(OTP_LENGTH).fill(''));
                    setErrors({});
                  }}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors mb-2"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  <span>Change number</span>
                </button>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Enter 6-digit OTP sent to +91 {phone}
                  </label>
                  <div className="flex gap-3 justify-center" onPaste={handleOTPPaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOTPChange(index, e.target.value)}
                        onKeyDown={(e) => handleOTPKeyDown(index, e)}
                        className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-[10px] focus:outline-none focus:border-primary focus:shadow-md focus:shadow-primary/20 transition-all ${
                          digit ? 'border-primary bg-primary/5' : 'border-gray-200'
                        } ${errors.otp ? 'border-red-400' : ''}`}
                        disabled={isLoading}
                      />
                    ))}
                  </div>
                  {errors.otp && (
                    <p className="mt-3 text-sm text-red-500 font-medium text-center">{errors.otp}</p>
                  )}
                </div>

                {/* Dev OTP display */}
                {devOtp && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-[10px] text-center">
                    <p className="text-xs text-blue-600 font-medium">Dev Mode — OTP: <span className="font-bold text-lg tracking-widest text-blue-800">{devOtp}</span></p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || otp.some((d) => !d)}
                  className="btn-primary w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/30 transition-all font-semibold py-3 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <FiLoader className="w-5 h-5 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify & Login</span>
                  )}
                </button>

                {/* Resend OTP */}
                <div className="text-center">
                  {resendTimer > 0 ? (
                    <p className="text-sm text-gray-500">
                      Resend OTP in <span className="font-bold text-primary">{resendTimer}s</span>
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      className="text-sm text-primary hover:text-primary-dark font-semibold transition-colors"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* Step: Name (for new users) */}
            {step === 'name' && (
              <form onSubmit={handleNameSubmit} className="space-y-5">
                <button
                  type="button"
                  onClick={() => setStep('otp')}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors mb-2"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  <span>Back to OTP</span>
                </button>

                <div className="text-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🎉</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    OTP verified! Since you're new here, please enter your name.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Name
                  </label>
                  <div className="relative group">
                    <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setErrors({});
                      }}
                      className={`input-field pl-12 w-full border-1 focus:border-primary focus:shadow-md focus:shadow-primary/20 transition-all ${
                        errors.name ? 'border-red-500' : ''
                      }`}
                      placeholder="Enter your full name"
                      autoFocus
                      disabled={isLoading}
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-500 font-medium">{errors.name}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !name.trim()}
                  className="btn-primary w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/30 transition-all font-semibold py-3 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <FiLoader className="w-5 h-5 animate-spin" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <span>Get Started</span>
                  )}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Email Login Link */}
            <Link
              to="/login/email"
              className="w-full btn btn-outline text-center border-2 border-gray-200 text-gray-700 hover:border-primary hover:bg-primary/5 transition-all font-semibold py-2 rounded-lg block"
            >
              Login with Email & Password
            </Link>

            {/* Restaurant Partner Link */}
            <div className="mt-6 text-center">
              <Link
                to="/restaurant/login"
                className="text-sm text-gray-500 hover:text-primary transition-colors"
              >
                Are you a restaurant partner?{' '}
                <span className="font-semibold text-primary">Login here</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
