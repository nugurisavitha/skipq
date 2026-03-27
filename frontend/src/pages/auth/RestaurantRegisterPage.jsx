import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiLoader,
  FiMapPin, FiChevronRight, FiChevronLeft, FiCheck, FiHome,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { authAPI } from '../../services/api';

const CUISINE_OPTIONS = [
  'Indian', 'Chinese', 'Continental', 'Italian', 'Mexican', 'Thai',
  'Japanese', 'North Indian', 'South Indian', 'Seafood', 'Fast Food',
  'Bakery', 'Desserts', 'Beverages', 'Other',
];

export default function RestaurantRegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [step, setStep] = useState(1); // 1 = Owner, 2 = Restaurant, 3 = Review
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    // Owner details
    ownerName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Restaurant details
    restaurantName: '',
    restaurantAddress: '',
    restaurantPhone: '',
    restaurantEmail: '',
    description: '',
    cuisine: [],
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'restaurant_admin') {
        navigate('/restaurant-admin/dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleCuisineToggle = (cuisine) => {
    setFormData((prev) => ({
      ...prev,
      cuisine: prev.cuisine.includes(cuisine)
        ? prev.cuisine.filter((c) => c !== cuisine)
        : [...prev.cuisine, cuisine],
    }));
  };

  const validateStep1 = () => {
    const errs = {};
    if (!formData.ownerName.trim()) errs.ownerName = 'Name is required';
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Invalid email';
    if (!formData.phone.trim()) errs.phone = 'Phone is required';
    else if (!/^[6-9]\d{9}$/.test(formData.phone)) errs.phone = 'Enter valid 10-digit phone';
    if (!formData.password) errs.password = 'Password is required';
    else if (formData.password.length < 6) errs.password = 'Min 6 characters';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (!formData.restaurantName.trim()) errs.restaurantName = 'Restaurant name is required';
    if (!formData.restaurantAddress.trim()) errs.restaurantAddress = 'Address is required';
    if (!formData.restaurantPhone.trim()) errs.restaurantPhone = 'Phone is required';
    else if (!/^[6-9]\d{9}$/.test(formData.restaurantPhone)) errs.restaurantPhone = 'Enter valid 10-digit phone';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await authAPI.registerRestaurant({
        ownerName: formData.ownerName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        restaurantName: formData.restaurantName.trim(),
        restaurantAddress: formData.restaurantAddress.trim(),
        restaurantPhone: formData.restaurantPhone.trim(),
        restaurantEmail: formData.restaurantEmail.trim() || undefined,
        description: formData.description.trim() || undefined,
        cuisine: formData.cuisine.length > 0 ? formData.cuisine : ['Other'],
      });

      const msg = res.data?.message || 'Registration successful!';
      toast.success(msg, { duration: 5000 });

      // Save token and redirect
      const token = res.data?.data?.token;
      if (token) {
        localStorage.setItem('token', token);
      }

      navigate('/restaurant/login', {
        state: { registered: true },
      });
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { num: 1, label: 'Owner Details' },
    { num: 2, label: 'Restaurant Info' },
    { num: 3, label: 'Review & Submit' },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-5xl">
        <div className="grid md:grid-cols-5 gap-0 rounded-[15px] overflow-hidden shadow-lg">
          {/* Left Panel - Branding */}
          <div className="md:col-span-2 hidden md:flex bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-8 flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#F2A93E]/15 rounded-full -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#F07054]/15 rounded-full -ml-16 -mb-16"></div>

            <div className="relative z-10">
              <div className="w-12 h-12 bg-gradient-to-br from-[#F2A93E] to-[#F07054] rounded-xl flex items-center justify-center mb-6">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3">
                Partner with SkipQ
              </h2>
              <p className="text-gray-300 text-base leading-relaxed">
                Grow your restaurant business by reaching thousands of hungry customers. Join our network of top restaurants.
              </p>
            </div>

            <div className="relative z-10 space-y-4 mt-8">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#F2A93E]/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiCheck className="text-[#F2A93E] w-4 h-4" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Increase your reach</p>
                  <p className="text-gray-400 text-xs">Get discovered by new customers daily</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#F2A93E]/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiCheck className="text-[#F2A93E] w-4 h-4" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Easy management</p>
                  <p className="text-gray-400 text-xs">Manage orders, menu & tables from one dashboard</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#F2A93E]/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FiCheck className="text-[#F2A93E] w-4 h-4" />
                </div>
                <div>
                  <p className="text-white font-medium text-sm">Real-time analytics</p>
                  <p className="text-gray-400 text-xs">Track revenue, orders & customer insights</p>
                </div>
              </div>
            </div>

            <p className="text-gray-500 text-xs mt-6 relative z-10">
              Already a partner?{' '}
              <Link to="/restaurant/login" className="text-[#F2A93E] hover:underline">
                Sign in here
              </Link>
            </p>
          </div>

          {/* Right Panel - Form */}
          <div className="md:col-span-3 bg-white p-6 md:p-8">
            {/* Mobile Header */}
            <div className="md:hidden text-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-[#1a1a2e] to-[#16213e] rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-[#F2A93E] font-bold text-xl">S</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Partner with SkipQ</h1>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-8">
              {steps.map((s, idx) => (
                <React.Fragment key={s.num}>
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                        step >= s.num
                          ? 'bg-gradient-to-r from-[#F2A93E] to-[#F07054] text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {step > s.num ? <FiCheck size={16} /> : s.num}
                    </div>
                    <span className="text-xs text-gray-500 mt-1 hidden sm:block">{s.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`w-12 sm:w-20 h-0.5 mx-1 ${step > s.num ? 'bg-[#F2A93E]' : 'bg-gray-200'}`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {/* ===== STEP 1: Owner Details ===== */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Owner Details</h3>
                  <p className="text-sm text-gray-500 mb-4">Tell us about yourself</p>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-3 text-gray-400" size={18} />
                      <input type="text" name="ownerName" value={formData.ownerName} onChange={handleChange}
                        placeholder="Your full name" className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#F2A93E] bg-white" />
                    </div>
                    {errors.ownerName && <p className="text-sm text-red-500 mt-1">{errors.ownerName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                    <div className="relative">
                      <FiMail className="absolute left-3 top-3 text-gray-400" size={18} />
                      <input type="email" name="email" value={formData.email} onChange={handleChange}
                        placeholder="you@example.com" className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#F2A93E] bg-white" />
                    </div>
                    {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone *</label>
                    <div className="relative">
                      <FiPhone className="absolute left-3 top-3 text-gray-400" size={18} />
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                        placeholder="10-digit phone" maxLength={10} className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#F2A93E] bg-white" />
                    </div>
                    {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Password *</label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-3 text-gray-400" size={18} />
                      <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange}
                        placeholder="Min 6 characters" className="w-full pl-10 pr-10 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#F2A93E] bg-white" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                        {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password *</label>
                    <div className="relative">
                      <FiLock className="absolute left-3 top-3 text-gray-400" size={18} />
                      <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                        placeholder="Re-enter password" className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#F2A93E] bg-white" />
                    </div>
                    {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword}</p>}
                  </div>
                </div>
              )}

              {/* ===== STEP 2: Restaurant Info ===== */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Restaurant Details</h3>
                  <p className="text-sm text-gray-500 mb-4">Tell us about your restaurant</p>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Restaurant Name *</label>
                    <div className="relative">
                      <FiHome className="absolute left-3 top-3 text-gray-400" size={18} />
                      <input type="text" name="restaurantName" value={formData.restaurantName} onChange={handleChange}
                        placeholder="e.g. Dragon Palace" className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#F2A93E] bg-white" />
                    </div>
                    {errors.restaurantName && <p className="text-sm text-red-500 mt-1">{errors.restaurantName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Address *</label>
                    <div className="relative">
                      <FiMapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                      <input type="text" name="restaurantAddress" value={formData.restaurantAddress} onChange={handleChange}
                        placeholder="Full restaurant address" className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#F2A93E] bg-white" />
                    </div>
                    {errors.restaurantAddress && <p className="text-sm text-red-500 mt-1">{errors.restaurantAddress}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Restaurant Phone *</label>
                      <div className="relative">
                        <FiPhone className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input type="tel" name="restaurantPhone" value={formData.restaurantPhone} onChange={handleChange}
                          placeholder="10-digit phone" maxLength={10} className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#F2A93E] bg-white" />
                      </div>
                      {errors.restaurantPhone && <p className="text-sm text-red-500 mt-1">{errors.restaurantPhone}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Restaurant Email</label>
                      <div className="relative">
                        <FiMail className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input type="email" name="restaurantEmail" value={formData.restaurantEmail} onChange={handleChange}
                          placeholder="restaurant@email.com" className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#F2A93E] bg-white" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                    <textarea name="description" value={formData.description} onChange={handleChange}
                      placeholder="Briefly describe your restaurant..." rows="2"
                      className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#F2A93E] bg-white resize-none" />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cuisine Type</label>
                    <div className="flex flex-wrap gap-2">
                      {CUISINE_OPTIONS.map((c) => (
                        <button key={c} type="button" onClick={() => handleCuisineToggle(c)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            formData.cuisine.includes(c)
                              ? 'bg-[#F2A93E] text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}>
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ===== STEP 3: Review ===== */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Review & Submit</h3>
                  <p className="text-sm text-gray-500 mb-4">Please confirm your details before submitting</p>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 text-sm border-b border-gray-200 pb-2">Owner Info</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">Name:</span> <span className="font-medium">{formData.ownerName}</span></div>
                      <div><span className="text-gray-500">Email:</span> <span className="font-medium">{formData.email}</span></div>
                      <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{formData.phone}</span></div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
                    <h4 className="font-semibold text-gray-800 text-sm border-b border-gray-200 pb-2">Restaurant Info</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-gray-500">Name:</span> <span className="font-medium">{formData.restaurantName}</span></div>
                      <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{formData.restaurantPhone}</span></div>
                      <div className="col-span-2"><span className="text-gray-500">Address:</span> <span className="font-medium">{formData.restaurantAddress}</span></div>
                      {formData.cuisine.length > 0 && (
                        <div className="col-span-2">
                          <span className="text-gray-500">Cuisine:</span>{' '}
                          {formData.cuisine.map((c) => (
                            <span key={c} className="inline-block px-2 py-0.5 bg-[#F2A93E]/10 text-[#F2A93E] rounded-full text-xs font-medium mr-1 mb-1">{c}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                    Your restaurant will be reviewed by our admin team. Once approved, you can start managing orders from your dashboard.
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-3 mt-8">
                {step > 1 && (
                  <button type="button" onClick={handleBack}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
                    <FiChevronLeft size={18} />
                    Back
                  </button>
                )}

                {step < 3 ? (
                  <button type="button" onClick={handleNext}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#F2A93E] to-[#F07054] text-white rounded-lg font-semibold hover:shadow-lg transition-all">
                    Next
                    <FiChevronRight size={18} />
                  </button>
                ) : (
                  <button type="submit" disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#1a1a2e] to-[#16213e] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50">
                    {isLoading ? (
                      <><FiLoader className="animate-spin" size={18} /> Submitting...</>
                    ) : (
                      <><FiCheck size={18} /> Submit Application</>
                    )}
                  </button>
                )}
              </div>
            </form>

            {/* Bottom Links */}
            <div className="mt-6 text-center text-sm text-gray-500">
              Already a partner?{' '}
              <Link to="/restaurant/login" className="text-[#F2A93E] font-semibold hover:underline">
                Sign in
              </Link>
              <span className="mx-2">|</span>
              <Link to="/login" className="text-gray-600 hover:underline">
                Customer login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
