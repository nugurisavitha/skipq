import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiLoader,
  FiCheck,
  FiEye,
  FiEyeOff,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/');
    }
  }, [isAuthenticated, user, navigate]);

  const getPasswordStrength = () => {
    const pass = formData.password;
    if (!pass) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (pass.length >= 8) strength++;
    if (pass.length >= 12) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/\d/.test(pass)) strength++;
    if (/[^a-zA-Z\d]/.test(pass)) strength++;

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600'];

    return { strength, label: labels[strength], color: colors[strength] };
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const phoneDigits = formData.phone.replace(/\D/g, '');
      if (!/^[6-9]/.test(phoneDigits) || phoneDigits.length !== 10) {
        newErrors.phone = 'Enter a valid 10-digit Indian phone number (starting with 6-9)';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!termsAccepted) {
      newErrors.terms = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        role: 'customer',
      };

      await register(userData);
      toast.success('Registration successful! Redirecting...');
      navigate('/');
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStepStatus = () => {
    if (!formData.name && !formData.email && !formData.phone) return 1;
    if (formData.name && formData.email && formData.phone) return 2;
    if (formData.password && formData.confirmPassword && termsAccepted) return 3;
    return 1;
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-5xl">
        <div className="grid md:grid-cols-2 gap-0 rounded-[15px] overflow-hidden shadow-lg">
          {/* Left Panel - Branding */}
          <div className="hidden md:flex bg-gradient-to-br from-primary to-primary-dark p-8 flex-col justify-between relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

            {/* Content */}
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">Join SkipQ</h2>
              <p className="text-white/80 text-lg leading-relaxed">
                Get access to exclusive deals, track your orders, and enjoy seamless food delivery from your favorite restaurants.
              </p>
            </div>

            {/* Bottom Text */}
            <div className="relative z-10 space-y-2">
              <p className="text-white/70 text-sm">Start your food journey today! 🚀</p>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="bg-white p-8 flex flex-col justify-center">
            {/* Mobile Header */}
            <div className="md:hidden text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Join SkipQ</h1>
            </div>

            {/* Steps Indicator */}
            <div className="mb-8 hidden md:block">
              <div className="flex items-center justify-between">
                {[1, 2, 3].map((step) => (
                  <div key={step} className="flex-1">
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-all ${
                          getStepStatus() >= step
                            ? 'bg-gradient-to-r from-primary to-primary-dark text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {step}
                      </div>
                      {step < 3 && (
                        <div
                          className={`flex-1 h-1 mx-2 transition-all ${
                            getStepStatus() > step
                              ? 'bg-gradient-to-r from-primary to-primary-dark'
                              : 'bg-gray-200'
                          }`}
                        ></div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 text-center">
                      {['Details', 'Security', 'Complete'][step - 1]}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative group">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`input-field pl-12 w-full border-1 focus:border-primary focus:shadow-md focus:shadow-primary/20 transition-all ${
                      errors.name ? 'border-red-500' : ''
                    }`}
                    placeholder="John Doe"
                    disabled={isLoading}
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-2 font-medium">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input-field pl-12 w-full border-1 focus:border-primary focus:shadow-md focus:shadow-primary/20 transition-all ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                    placeholder="you@example.com"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-2 font-medium">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative group">
                  <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`input-field pl-12 w-full border-1 focus:border-primary focus:shadow-md focus:shadow-primary/20 transition-all ${
                      errors.phone ? 'border-red-500' : ''
                    }`}
                    placeholder="9876543210"
                    disabled={isLoading}
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-2 font-medium">{errors.phone}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`input-field pl-12 pr-12 w-full border-1 focus:border-primary focus:shadow-md focus:shadow-primary/20 transition-all ${
                      errors.password ? 'border-red-500' : ''
                    }`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <FiEyeOff className="w-5 h-5" />
                    ) : (
                      <FiEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Password strength</span>
                      <span className="text-xs font-medium text-primary">{getPasswordStrength().label}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${getPasswordStrength().color}`}
                        style={{
                          width: `${(getPasswordStrength().strength / 5) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
                {errors.password && (
                  <p className="text-red-500 text-sm mt-2 font-medium">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative group">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`input-field pl-12 pr-12 w-full border-1 focus:border-primary focus:shadow-md focus:shadow-primary/20 transition-all ${
                      errors.confirmPassword ? 'border-red-500' : ''
                    }`}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff className="w-5 h-5" />
                    ) : (
                      <FiEye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-2 font-medium">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Terms */}
              <div className="flex items-start space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(e) => {
                    setTermsAccepted(e.target.checked);
                    if (errors.terms) {
                      setErrors((prev) => ({ ...prev, terms: '' }));
                    }
                  }}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  disabled={isLoading}
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I agree to the{' '}
                  <a href="#" className="text-primary hover:text-primary-dark font-medium transition-colors">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-primary hover:text-primary-dark font-medium transition-colors">
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.terms && (
                <p className="text-red-500 text-sm font-medium">{errors.terms}</p>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center space-x-2 mt-8 bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/30 transition-all font-semibold py-3 rounded-lg text-white"
              >
                {isLoading ? (
                  <>
                    <FiLoader className="w-5 h-5 animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <FiCheck className="w-5 h-5" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Already have an account?</span>
              </div>
            </div>

            {/* Login Link */}
            <Link
              to="/login"
              className="w-full btn btn-outline text-center border-2 border-gray-200 text-gray-700 hover:border-primary hover:bg-primary/5 transition-all font-semibold py-2 rounded-lg"
            >
              Sign In
            </Link>

            {/* Restaurant Partner Link */}
            <div className="mt-4 text-center">
              <Link
                to="/restaurant/register"
                className="text-sm text-gray-500 hover:text-primary transition-colors"
              >
                Own a restaurant?{' '}
                <span className="font-semibold text-primary">Partner with SkipQ</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
