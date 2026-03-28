import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiEdit2,
  FiCheck,
  FiX,
  FiPlus,
  FiTrash2,
  FiLogOut,
  FiLoader,
  FiPackage,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import Modal from '../../components/common/Modal';
import LocationPickerButton from '../../components/common/LocationPickerButton';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateProfile, isLoading: authLoading } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [orderCount, setOrderCount] = useState(0);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });

  const [addressFormData, setAddressFormData] = useState({
    label: '',
    address: '',
    latitude: '',
    longitude: '',
  });

  // Fetch user's addresses and order count
  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real app, you'd fetch these from API
        setAddresses([
          {
            id: '1',
            label: 'Home',
            address: '123 Main St, Apt 4B, New York, NY 10001',
          },
          {
            id: '2',
            label: 'Office',
            address: '456 Business Ave, Suite 200, New York, NY 10002',
          },
        ]);

        // Fetch order count
        const response = await api.orders.getAll({ limit: 1 });
        setOrderCount(response.data.meta?.total || 0);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddressFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
      });

      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();

    if (!addressFormData.label || !addressFormData.address) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);

    try {
      // In a real app, you'd save to API
      const newAddress = {
        id: Date.now().toString(),
        ...addressFormData,
      };

      setAddresses((prev) => [...prev, newAddress]);
      toast.success('Address added successfully');
      setShowAddressForm(false);
      setAddressFormData({
        label: '',
        address: '',
        latitude: '',
        longitude: '',
      });
    } catch (error) {
      toast.error('Failed to add address');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      // In a real app, you'd delete from API
      setAddresses((prev) => prev.filter((addr) => addr.id !== id));
      toast.success('Address deleted successfully');
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/login');
      toast.success('Logged out successfully');
    }
  };

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please login to view your profile</p>
          <button
            onClick={() => navigate('/login')}
            className="btn btn-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - User Info & Addresses */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Avatar & Quick Info */}
            <div className="bg-gradient-to-r from-primary/10 to-primary-dark/10 border-2 border-dashed border-orange-200 rounded-[15px] p-8">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary to-primary-dark flex items-center justify-center text-white font-bold text-4xl">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{user?.name}</h2>
                  <p className="text-gray-600 flex items-center mt-1">
                    <FiMail className="w-4 h-4 mr-2 text-primary" />
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* User Info Card */}
            <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <FiUser className="w-5 h-5 text-primary" />
                  <span>Personal Information</span>
                </h2>

                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-primary to-primary-dark text-white font-bold text-sm py-2 px-4 rounded-[12px] flex items-center space-x-1 hover:shadow-lg transition-all"
                  >
                    <FiEdit2 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input-field w-full border-2 border-dashed border-orange-200 rounded-[12px] focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input-field w-full border-2 border-dashed border-orange-200 rounded-[12px] focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Email (Not editable)
                    </label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="input-field w-full bg-gray-100 border-2 border-gray-200 rounded-[12px] cursor-not-allowed"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-primary to-primary-dark text-white font-bold py-2 rounded-[12px] flex items-center justify-center space-x-2 hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <FiLoader className="w-4 h-4 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <FiCheck className="w-4 h-4" />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setFormData({
                          name: user.name || '',
                          phone: user.phone || '',
                        });
                      }}
                      className="flex-1 bg-white border-2 border-dashed border-orange-200 text-gray-900 font-bold py-2 rounded-[12px] flex items-center justify-center space-x-2 hover:bg-orange-50 transition-all"
                    >
                      <FiX className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-orange-50 rounded-[12px] border border-orange-100">
                    <p className="text-xs text-gray-600 font-bold uppercase">Name</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {user.name}
                    </p>
                  </div>

                  <div className="p-4 bg-orange-50 rounded-[12px] border border-orange-100">
                    <p className="text-xs text-gray-600 font-bold uppercase">Phone</p>
                    <p className="text-lg font-bold text-primary mt-1">
                      {user.phone || 'Not added'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Saved Addresses */}
            <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <FiMapPin className="w-5 h-5 text-primary" />
                  <span>Saved Addresses</span>
                </h2>

                <button
                  onClick={() => setShowAddressForm(!showAddressForm)}
                  className="bg-gradient-to-r from-primary to-primary-dark text-white font-bold text-sm py-2 px-4 rounded-[12px] flex items-center space-x-1 hover:shadow-lg transition-all"
                >
                  <FiPlus className="w-4 h-4" />
                  <span>Add New</span>
                </button>
              </div>

              {/* Add Address Form */}
              {showAddressForm && (
                <form onSubmit={handleAddAddress} className="space-y-4 mb-6 pb-6 border-b-2 border-dashed border-orange-200">
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Address Label
                    </label>
                    <select
                      name="label"
                      value={addressFormData.label}
                      onChange={handleAddressChange}
                      className="input-field w-full border-2 border-dashed border-orange-200 rounded-[12px] focus:border-primary"
                    >
                      <option value="">Select Label</option>
                      <option value="Home">Home</option>
                      <option value="Office">Office</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-2">
                      Address
                    </label>
                    <LocationPickerButton
                      onLocationSelect={({ address, lat, lng }) => {
                        setAddressFormData((prev) => ({
                          ...prev,
                          address,
                          latitude: lat.toString(),
                          longitude: lng.toString(),
                        }));
                      }}
                      className="mb-2"
                    />
                    <textarea
                      name="address"
                      value={addressFormData.address}
                      onChange={handleAddressChange}
                      placeholder="Enter full address"
                      rows="3"
                      className="input-field w-full border-2 border-dashed border-orange-200 rounded-[12px] focus:border-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Latitude (Optional)
                      </label>
                      <input
                        type="text"
                        name="latitude"
                        value={addressFormData.latitude}
                        onChange={handleAddressChange}
                        placeholder="e.g., 40.7128"
                        className="input-field w-full border-2 border-dashed border-orange-200 rounded-[12px] focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-900 mb-2">
                        Longitude (Optional)
                      </label>
                      <input
                        type="text"
                        name="longitude"
                        value={addressFormData.longitude}
                        onChange={handleAddressChange}
                        placeholder="e.g., -74.0060"
                        className="input-field w-full border-2 border-dashed border-orange-200 rounded-[12px] focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 bg-gradient-to-r from-primary to-primary-dark text-white font-bold py-2 rounded-[12px] hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {isLoading ? 'Adding...' : 'Add Address'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="flex-1 bg-white border-2 border-dashed border-orange-200 text-gray-900 font-bold py-2 rounded-[12px] hover:bg-orange-50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Addresses List */}
              {addresses.length > 0 ? (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className="p-4 bg-orange-50 rounded-[12px] border border-orange-100 flex items-start justify-between"
                    >
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">
                          {addr.label}
                        </p>
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          {addr.address}
                        </p>
                      </div>

                      <button
                        onClick={() => handleDeleteAddress(addr.id)}
                        className="text-red-500 hover:text-red-700 p-2 flex-shrink-0"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8 font-medium">
                  No saved addresses. Add one for faster checkout.
                </p>
              )}
            </div>
          </div>

          {/* Right Column - Stats & Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Stats Card */}
            <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                Your Activity
              </h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-[12px] border border-orange-100">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-full">
                      <FiPackage className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-gray-900 font-medium">Total Orders</span>
                  </div>
                  <span className="font-bold text-2xl text-primary">
                    {orderCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-[12px] border border-orange-100">
                  <span className="text-gray-900 font-medium">Member Since</span>
                  <span className="font-bold text-primary">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                        })
                      : 'Recently'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Quick Links
              </h2>

              <div className="space-y-2">
                <button
                  onClick={() => navigate('/orders')}
                  className="w-full text-left bg-white border-2 border-dashed border-orange-200 text-gray-900 font-bold py-3 px-4 rounded-[12px] hover:bg-orange-50 transition-all flex items-center justify-between"
                >
                  <span>My Orders</span>
                  <FiPackage className="w-4 h-4 text-primary" />
                </button>

                <button
                  onClick={() => navigate('/restaurants')}
                  className="w-full text-left bg-white border-2 border-dashed border-orange-200 text-gray-900 font-bold py-3 px-4 rounded-[12px] hover:bg-orange-50 transition-all flex items-center justify-between"
                >
                  <span>Browse Restaurants</span>
                  <FiMapPin className="w-4 h-4 text-primary" />
                </button>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="w-full bg-white border-2 border-dashed border-red-200 text-red-600 font-bold py-3 rounded-[15px] hover:bg-red-50 transition-all flex items-center justify-center space-x-2"
            >
              <FiLogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
