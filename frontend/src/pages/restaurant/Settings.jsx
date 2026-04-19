import React, { useEffect, useState, useCallback } from 'react';
import {
  FiSave,
  FiLoader,
  FiAlertCircle,
  FiClock,
  FiToggleLeft,
  FiToggleRight,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { restaurantsAPI } from '../../services/api';
import LocationPickerButton from '../../components/common/LocationPickerButton';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    logoUrl: '',
    coverImageUrl: '',
    cuisines: '',
    minimumOrderAmount: '0',
    deliveryFee: '0',
    taxRate: '0',
    averagePreparationTime: '30',
    operatingHours: {},
    selfService: false,
    bankDetails: {
      accountName: '',
      accountNumber: '',
      ifscCode: '',
      bankName: '',
    },
  });

  const fetchRestaurant = useCallback(async () => {
    try {
      setLoading(true);
      const response = await restaurantsAPI.getMine();
      const restaurantData = response.data?.data?.restaurant || response.data?.data || response.data;
      setRestaurant(restaurantData);

      // Initialize operating hours
      const operatingHours = {};
      DAYS.forEach((day) => {
        operatingHours[day] = restaurantData.operatingHours?.[day] || {
          isOpen: true,
          openTime: '10:00',
          closeTime: '22:00',
        };
      });

      setFormData({
        name: restaurantData.name || '',
        description: restaurantData.description || '',
        email: restaurantData.email || '',
        phone: restaurantData.phone || '',
        address: restaurantData.address || '',
        logoUrl: restaurantData.logoUrl || '',
        coverImageUrl: restaurantData.coverImageUrl || '',
        cuisines: restaurantData.cuisines?.join(', ') || '',
        minimumOrderAmount: restaurantData.minimumOrderAmount || '0',
        deliveryFee: restaurantData.deliveryFee || '0',
        taxRate: restaurantData.taxRate || '0',
        averagePreparationTime: restaurantData.averagePreparationTime || '30',
        operatingHours,
        selfService: restaurantData.selfService || false,
        bankDetails: restaurantData.bankDetails || {
          accountName: '',
          accountNumber: '',
          ifscCode: '',
          bankName: '',
        },
      });
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOperatingHourChange = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value,
        },
      },
    }));
  };

  const handleBankDetailsChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [field]: value,
      },
    }));
  };

  const setSameHoursForAllDays = () => {
    const firstDay = formData.operatingHours['Monday'];
    const updatedHours = {};
    DAYS.forEach((day) => {
      updatedHours[day] = { ...firstDay };
    });
    setFormData((prev) => ({
      ...prev,
      operatingHours: updatedHours,
    }));
    toast.success('All days set to Monday hours');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Restaurant name is required');
      return;
    }

    try {
      setSubmitLoading(true);

      const payload = {
        name: formData.name,
        description: formData.description,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        logoUrl: formData.logoUrl,
        coverImageUrl: formData.coverImageUrl,
        cuisines: formData.cuisines.split(',').map((c) => c.trim()).filter(Boolean),
        minimumOrderAmount: parseFloat(formData.minimumOrderAmount),
        deliveryFee: parseFloat(formData.deliveryFee),
        taxRate: parseFloat(formData.taxRate),
        averagePreparationTime: parseInt(formData.averagePreparationTime),
        operatingHours: formData.operatingHours,
        selfService: formData.selfService,
        bankDetails: formData.bankDetails,
      };

      await restaurantsAPI.update(restaurant._id, payload);
      setRestaurant((prev) => ({ ...prev, ...payload }));
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-orange-50 via-white to-orange-50/30 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">Restaurant Settings</h1>
          <p className="text-gray-600 mt-2">Manage your restaurant information and configurations</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Section */}
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-6 space-y-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent border-b-2 border-dashed border-orange-200 pb-4">Restaurant Profile</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Restaurant Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Cuisines (comma-separated)
                </label>
                <input
                  type="text"
                  name="cuisines"
                  placeholder="Italian, Chinese, Indian"
                  value={formData.cuisines}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Address
              </label>
              <LocationPickerButton
                buttonLabel="Detect Restaurant Location"
                onLocationSelect={({ address }) => {
                  setFormData((prev) => ({ ...prev, address }));
                }}
                className="mb-2"
              />
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none bg-orange-50/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none bg-orange-50/30"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  name="logoUrl"
                  value={formData.logoUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Cover Image URL
                </label>
                <input
                  type="url"
                  name="coverImageUrl"
                  value={formData.coverImageUrl}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                />
              </div>
            </div>
          </div>

          {/* Operating Hours Section */}
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-6 space-y-6">
            <div className="flex items-center justify-between border-b-2 border-dashed border-orange-200 pb-4">
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">Operating Hours</h2>
              <button
                type="button"
                onClick={setSameHoursForAllDays}
                className="text-sm bg-orange-100 hover:bg-orange-200 text-primary font-medium px-3 py-1 rounded-[8px] transition-colors"
              >
                Same Hours for All Days
              </button>
            </div>

            <div className="space-y-4">
              {DAYS.map((day) => (
                <div key={day} className="border-2 border-dashed border-orange-100 rounded-[10px] p-4 bg-orange-50/30">
                  <div className="flex items-center justify-between mb-3">
                    <label className="font-medium text-gray-900">{day}</label>
                    <button
                      type="button"
                      onClick={() =>
                        handleOperatingHourChange(day, 'isOpen', !formData.operatingHours[day].isOpen)
                      }
                      className="p-2 hover:bg-orange-100 rounded-[8px] transition-colors"
                    >
                      {formData.operatingHours[day].isOpen ? (
                        <FiToggleRight className="w-6 h-6 text-primary" />
                      ) : (
                        <FiToggleLeft className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {formData.operatingHours[day].isOpen && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Opening Time</label>
                        <input
                          type="time"
                          value={formData.operatingHours[day].openTime}
                          onChange={(e) =>
                            handleOperatingHourChange(day, 'openTime', e.target.value)
                          }
                          className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Closing Time</label>
                        <input
                          type="time"
                          value={formData.operatingHours[day].closeTime}
                          onChange={(e) =>
                            handleOperatingHourChange(day, 'closeTime', e.target.value)
                          }
                          className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Order Settings Section */}
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-6 space-y-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent border-b-2 border-dashed border-orange-200 pb-4">Order Settings</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Minimum Order Amount (₹)
                </label>
                <input
                  type="number"
                  name="minimumOrderAmount"
                  value={formData.minimumOrderAmount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Delivery Fee (₹)
                </label>
                <input
                  type="number"
                  name="deliveryFee"
                  value={formData.deliveryFee}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  name="taxRate"
                  value={formData.taxRate}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Average Preparation Time (minutes)
                </label>
                <input
                  type="number"
                  name="averagePreparationTime"
                  value={formData.averagePreparationTime}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                />
              </div>
            </div>
          </div>

          {/* Self-Service Section */}
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-6 space-y-4">
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent border-b-2 border-dashed border-orange-200 pb-4">
              Service Mode
            </h2>

            {/* Self-Service Toggle */}
            <div
              className={`flex items-center justify-between p-4 rounded-[12px] border-2 border-dashed transition-colors ${
                formData.selfService
                  ? 'bg-green-50/50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex-1 mr-4">
                <p className="font-semibold text-gray-900 text-base">Self-Service Ordering</p>
                <p className="text-sm text-gray-600 mt-1">
                  Customers can walk in, scan your QR code or find your restaurant in the app, place an order from their phone, and pick it up when it's ready. No waiters needed.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    selfService: !prev.selfService,
                  }))
                }
                className={`flex-shrink-0 p-2 rounded-[10px] transition-all ${
                  formData.selfService
                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                    : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                }`}
              >
                {formData.selfService ? (
                  <FiToggleRight className="w-8 h-8" />
                ) : (
                  <FiToggleLeft className="w-8 h-8" />
                )}
              </button>
            </div>

            {/* Info when enabled */}
            {formData.selfService && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-[12px]">
                <p className="text-sm text-green-800 font-medium mb-2">When self-service is enabled:</p>
                <div className="text-sm text-green-700 space-y-1">
                  <p>- Customers see a "Self-Service" badge on your restaurant</p>
                  <p>- They can order from their phone without a waiter</p>
                  <p>- Orders are placed as "dine-in" with an order number</p>
                  <p>- Customers get notified when their order is ready to pick up</p>
                </div>
              </div>
            )}
          </div>

          {/* Bank Details Section */}
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-6 space-y-6">
            <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent border-b-2 border-dashed border-orange-200 pb-4">Bank Details</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={formData.bankDetails.accountName}
                  onChange={(e) => handleBankDetailsChange('accountName', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.bankDetails.accountNumber}
                  onChange={(e) => handleBankDetailsChange('accountNumber', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={formData.bankDetails.ifscCode}
                  onChange={(e) => handleBankDetailsChange('ifscCode', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bankDetails.bankName}
                  onChange={(e) => handleBankDetailsChange('bankName', e.target.value)}
                  className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitLoading}
              className="flex-1 bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-[15px] transition-all flex items-center justify-center space-x-2"
            >
              {submitLoading && <FiLoader className="w-5 h-5 animate-spin" />}
              <FiSave className="w-5 h-5" />
              <span>{submitLoading ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
