import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiMail, FiLock, FiLoader, FiEye, FiEyeOff, FiHome } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export default function RestaurantLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});

  // Show success toast if redirected from registration
  useEffect(() => {
    if (location.state?.registered) {
      toast.success('Registration successful! Please log in with your credentials.', {
        duration: 5000,
      });
    }
  }, [location.state]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'restaurant_admin') {
        navigate('/restaurant-admin/dashboard');
      } else if (user.role === 'admin' || user.role === 'super_admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const user = await login(formData.email, formData.password);

      if (user.role !== 'restaurant_admin') {
        toast.error('This login is for restaurant partners only.');
        return;
      }

      toast.success('Login successful!');
      navigate('/restaurant-admin/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f23] px-4 py-12">
      <div className="w-full max-w-5xl">
        <div className="grid md:grid-cols-2 gap-0 rounded-[15px] overflow-hidden shadow-2xl">
          {/* Left Panel - Dark Theme Branding */}
          <div className="hidden md:flex bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 flex-col justify-between relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full -ml-16 -mb-16"></div>
            <div className="absolute top-1/2 right-0 w-24 h-24 bg-amber-500/5 rounded-full -mr-12"></div>

            {/* Content */}
            <div className="relative z-10">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm border border-amber-500/30">
                <span className="text-amber-400 font-bold text-xl">S</span>
              </div>
              <h2 className="text-4xl font-bold text-white mb-4">
                Restaurant Partner
              </h2>
              <p className="text-gray-300/80 text-lg leading-relaxed">
                Manage your restaurant, track orders, and grow your business with SkipQ.
              </p>
            </div>

            {/* Benefits */}
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-green-400 text-sm">✓</span>
                </div>
                <span className="text-gray-300 text-sm">Real-time order management</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-green-400 text-sm">✓</span>
                </div>
                <span className="text-gray-300 text-sm">Easy menu & QR code setup</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                  <span className="text-green-400 text-sm">✓</span>
                </div>
                <span className="text-gray-300 text-sm">Detailed analytics & insights</span>
              </div>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="bg-white p-8 flex flex-col justify-center">
            {/* Mobile Header */}
            <div className="md:hidden text-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-amber-400 font-bold text-xl">S</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Restaurant Partner Login</h1>
            </div>

            {/* Desktop Title */}
            <div className="hidden md:block mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Partner Login</h1>
              <p className="text-gray-500 text-sm mt-1">Sign in to manage your restaurant</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#1a1a2e] transition-colors" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`input-field pl-12 w-full border-1 focus:border-[#1a1a2e] focus:shadow-md focus:shadow-[#1a1a2e]/10 transition-all ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                    placeholder="owner@restaurant.com"
                    disabled={isLoading}
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-500 font-medium">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Password</label>
                  <Link
                    to="#"
                    className="text-sm text-amber-600 hover:text-amber-700 transition-colors font-medium"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative group">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#1a1a2e] transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`input-field pl-12 pr-12 w-full border-1 focus:border-[#1a1a2e] focus:shadow-md focus:shadow-[#1a1a2e]/10 transition-all ${
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
                {errors.password && (
                  <p className="mt-2 text-sm text-red-500 font-medium">{errors.password}</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center space-x-2 mt-8 bg-gradient-to-r from-[#1a1a2e] to-[#16213e] hover:shadow-lg hover:shadow-[#1a1a2e]/30 transition-all font-semibold py-3 rounded-lg text-white"
              >
                {isLoading ? (
                  <>
                    <FiLoader className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In to Dashboard</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New restaurant partner?</span>
              </div>
            </div>

            {/* Register Link */}
            <Link
              to="/restaurant/register"
              className="w-full block text-center border-2 border-amber-400 text-amber-700 hover:bg-amber-50 transition-all font-semibold py-2 rounded-lg"
            >
              Register Your Restaurant
            </Link>

            {/* Customer Login Link */}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <FiHome className="w-4 h-4" />
                Back to Customer Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
