import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FiMail, FiLock, FiLoader, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
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

  const from = location.state?.from?.pathname || '/';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      const roleRedirects = {
        customer: '/',
        restaurant_admin: '/restaurant-admin/dashboard',
        admin: '/admin/dashboard',
        super_admin: '/admin/dashboard',
        delivery_admin: '/delivery/dashboard',
      };
      navigate(roleRedirects[user.role] || from);
    }
  }, [isAuthenticated, user, navigate, from]);

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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(formData.email, formData.password);
      toast.success('Login successful!');

      // Redirect based on role
      const roleRedirects = {
        customer: '/',
        restaurant_admin: '/restaurant-admin/dashboard',
        admin: '/admin/dashboard',
        super_admin: '/admin/dashboard',
        delivery_admin: '/delivery/dashboard',
      };

      const redirectPath = roleRedirects[user.role] || from;
      navigate(redirectPath);
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid email or password. Please try again.';
      toast.error(message);
      setErrors({ email: ' ', password: message });
    } finally {
      setIsLoading(false);
    }
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
              <h2 className="text-4xl font-bold text-white mb-4">Welcome Back</h2>
              <p className="text-white/80 text-lg leading-relaxed">
                Order delicious food from your favorite restaurants. Fast delivery, great quality, everyday deals.
              </p>
            </div>

            {/* Bottom Text */}
            <div className="relative z-10 space-y-2">
              <p className="text-white/70 text-sm">Let's get your cravings satisfied! ð</p>
            </div>
          </div>

          {/* Right Panel - Form */}
          <div className="bg-white p-8 flex flex-col justify-center">
            {/* Mobile Header */}
            <div className="md:hidden text-center mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  <p className="mt-2 text-sm text-red-500 font-medium">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => toast('Please contact your administrator to reset your password.', { icon: '\u2139\uFE0F' })}
                    className="text-sm text-primary hover:text-primary-dark transition-colors font-medium"
                  >
                    Forgot?
                  </button>
                </div>
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
                    placeholder="â¢â¢â¢â¢â¢â¢â¢â¢"
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
                className="btn-primary w-full flex items-center justify-center space-x-2 mt-8 bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg hover:shadow-primary/30 transition-all font-semibold py-3 rounded-lg text-white"
              >
                {isLoading ? (
                  <>
                    <FiLoader className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* OTP Login Link */}
            <Link
              to="/login"
              className="w-full btn btn-outline text-center border-2 border-gray-200 text-gray-700 hover:border-primary hover:bg-primary/5 transition-all font-semibold py-2 rounded-lg block"
            >
              Login with Mobile OTP
            </Link>

            {/* Register Link */}
            <div className="mt-4 text-center">
              <Link
                to="/register"
                className="text-sm text-gray-500 hover:text-primary transition-colors"
              >
                New to SkipQ?{' '}
                <span className="font-semibold text-primary">Create an Account</span>
              </Link>
            </div>

            {/* Restaurant Partner Link */}
            <div className="mt-3 text-center">
              <Link
                to="/restaurant/login"
                className="text-sm text-gray-500 hover:text-primary transition-colors"
              >
                Are you a restaurant partner?{' '}
                <span className="font-semibold text-primary">Login here</span>
              </Link>
            </div>

            {/* Demo credentials removed for production */}
          </div>
        </div>
      </div>
    </div>
  );
}
