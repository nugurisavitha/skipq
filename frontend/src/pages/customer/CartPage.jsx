import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FiTrash2,
  FiArrowLeft,
  FiShoppingBag,
  FiPlus,
  FiMinus,
  FiMapPin,
  FiClock,
  FiAlertCircle,
  FiNavigation,
  FiLoader,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { addHours, format } from 'date-fns';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';
import { useGeolocation } from '../../hooks/useGeolocation';
import api from '../../services/api';
import EmptyState from '../../components/common/EmptyState';
import LocationPickerButton from '../../components/common/LocationPickerButton';

export default function CartPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const {
    items,
    isEmpty,
    removeItem,
    updateQuantity,
    clearCart,
    getSubtotal,
    getTax,
    getDeliveryFee,
    getTotal,
    restaurantData,
    dineInInfo,
  } = useCart();

  const { getCurrentLocation, loading: locationLoading, address: geoAddress } = useGeolocation();

  // Fetch latest selfService status from restaurant if not in cart data
  const [fetchedSelfService, setFetchedSelfService] = useState(false);
  useEffect(() => {
    const fetchSelfService = async () => {
      if (!restaurantData?.slug) return;
      // If selfService is already set in restaurantData or dineInInfo, no need to fetch
      if (restaurantData?.selfService !== undefined || dineInInfo?.selfService !== undefined) return;
      try {
        const res = await api.restaurants.getBySlug(restaurantData.slug);
        const data = res.data?.data?.restaurant || res.data?.data || res.data;
        if (data?.selfService) {
          setFetchedSelfService(true);
        }
      } catch {
        // Silently fail — non-critical
      }
    };
    fetchSelfService();
  }, [restaurantData?.slug, restaurantData?.selfService, dineInInfo?.selfService]);

  // Detect self-service mode from restaurant data, dine-in info, or fetched status
  const isSelfService = restaurantData?.selfService || dineInInfo?.selfService || fetchedSelfService;

  // Auto-fill from QR scan dine-in info if available
  const [orderType, setOrderType] = useState(
    dineInInfo?.orderType || 'delivery',
  );
  const [dineInTime, setDineInTime] = useState('');
  const [tableNumber, setTableNumber] = useState(
    dineInInfo?.tableNumber || '',
  );
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');

  const handleUseMyLocation = async () => {
    const result = await getCurrentLocation();
    if (result?.address) {
      setSelectedAddress(result.address);
      toast.success('Location detected!');
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please login to proceed');
      navigate('/login');
      return;
    }

    if (orderType === 'dine_in' && !isSelfService && !dineInTime) {
      toast.error('Please select a time for dine-in');
      return;
    }

    // tableNumber is optional for dine-in (and self-service)

    if (orderType === 'delivery' && !selectedAddress) {
      toast.error('Please select a delivery address');
      return;
    }

    navigate('/checkout', {
      state: {
        orderType,
        dineInTime: orderType === 'dine_in' ? dineInTime : null,
        tableNumber: orderType === 'dine_in' ? tableNumber : null,
        specialInstructions,
        deliveryAddress: orderType === 'delivery' ? selectedAddress : null,
      },
    });
  };

  const minDineInTime = addHours(new Date(), 0.25);
  const dineInDateTimeString = dineInTime
    ? format(new Date(dineInTime), 'dd MMM, hh:mm a')
    : '';

  if (isEmpty) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <EmptyState
            icon={FiShoppingBag}
            title="Your cart is empty"
            description="Add some delicious food from your favorite restaurants"
            actionLabel="Browse Restaurants"
            onAction={() => navigate('/restaurants')}
          />
        </div>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const tax = getTax();
  const deliveryFee = orderType === 'delivery' ? getDeliveryFee() : 0;
  const total = subtotal + tax + deliveryFee;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          to="/restaurants"
          className="flex items-center space-x-2 text-primary hover:text-primary-dark mb-6 transition-colors font-medium"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span>Back to Restaurants</span>
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-8">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Restaurant Header */}
            {restaurantData && (
              <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6 shadow-sm">
                <h2 className="text-2xl font-bold text-gray-900">
                  {restaurantData.name}
                </h2>
              </div>
            )}

            {/* Order Type Selector */}
            <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6">
              <h3 className="font-bold text-gray-900 mb-4 text-lg">Order Type</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="flex items-center p-4 border-2 border-gray-200 rounded-[12px] cursor-pointer hover:border-primary transition-colors" style={{ borderColor: orderType === 'delivery' ? 'var(--primary, #F2A93E)' : undefined }}>
                  <input
                    type="radio"
                    name="orderType"
                    value="delivery"
                    checked={orderType === 'delivery'}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="ml-3 font-semibold text-gray-900">
                    <div className="text-xl mb-1">🚚</div>
                    Delivery
                  </span>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-[12px] cursor-pointer hover:border-primary transition-colors" style={{ borderColor: orderType === 'takeaway' ? 'var(--primary, #F2A93E)' : undefined }}>
                  <input
                    type="radio"
                    name="orderType"
                    value="takeaway"
                    checked={orderType === 'takeaway'}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="ml-3 font-semibold text-gray-900">
                    <div className="text-xl mb-1">📦</div>
                    Takeaway
                  </span>
                </label>

                <label className="flex items-center p-4 border-2 border-gray-200 rounded-[12px] cursor-pointer hover:border-primary transition-colors" style={{ borderColor: orderType === 'dine_in' ? 'var(--primary, #F2A93E)' : undefined }}>
                  <input
                    type="radio"
                    name="orderType"
                    value="dine_in"
                    checked={orderType === 'dine_in'}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-4 h-4"
                  />
                  <span className="ml-3 font-semibold text-gray-900">
                    <div className="text-xl mb-1">🍽️</div>
                    Dine-in
                  </span>
                </label>
              </div>

              {/* Dine-in Options */}
              {orderType === 'dine_in' && (
                <div className="mt-6 space-y-4 pt-6 border-t-2 border-dashed border-orange-200">
                  {/* Self-service info banner */}
                  {isSelfService && (
                    <div className="flex items-center space-x-3 bg-blue-50 border border-blue-200 p-4 rounded-[12px]">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xl">📱</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-800">
                          Self-Service Restaurant
                        </p>
                        <p className="text-xs text-blue-600">
                          Order now and you'll be notified when your food is ready for pickup
                        </p>
                      </div>
                    </div>
                  )}

                  {/* QR scan info banner */}
                  {dineInInfo?.tableNumber && (
                    <div className="flex items-center space-x-3 bg-green-50 border border-green-200 p-3 rounded-[12px]">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-green-700 text-sm font-bold">{dineInInfo.tableNumber}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-green-800">
                          Table {dineInInfo.tableNumber} — from QR code
                        </p>
                        <p className="text-xs text-green-600">
                          Your order will be sent to this table
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Time picker — only for non-self-service restaurants */}
                  {!isSelfService && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        <FiClock className="w-4 h-4 inline mr-2 text-primary" />
                        Select Time
                      </label>
                      <input
                        type="datetime-local"
                        value={dineInTime}
                        onChange={(e) => setDineInTime(e.target.value)}
                        min={format(minDineInTime, "yyyy-MM-dd'T'HH:mm")}
                        className="input-field w-full border-2 border-dashed border-orange-200 rounded-[12px] focus:border-primary"
                      />
                      {dineInTime && (
                        <p className="text-sm text-primary font-medium mt-2">
                          {dineInDateTimeString}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Table number — only for non-self-service restaurants */}
                  {!isSelfService && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Table Number {!dineInInfo?.tableNumber && <span className="text-gray-400 font-normal">(Optional)</span>}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., T-05 (assigned at restaurant if left blank)"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className={`input-field w-full border-2 border-dashed rounded-[12px] focus:border-primary ${
                          dineInInfo?.tableNumber ? 'border-green-300 bg-green-50/50' : 'border-orange-200'
                        }`}
                        readOnly={!!dineInInfo?.tableNumber}
                      />
                      {dineInInfo?.tableNumber && (
                        <p className="text-xs text-green-600 mt-1">Auto-filled from QR code scan</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Delivery Address */}
              {orderType === 'delivery' && (
                <div className="mt-6 space-y-4 pt-6 border-t-2 border-dashed border-orange-200">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                      <FiMapPin className="w-4 h-4 inline mr-2 text-primary" />
                      Delivery Address
                    </label>

                    {/* Use My Location Button */}
                    <LocationPickerButton
                      buttonLabel="Use My Current Location"
                      onLocationSelect={({ address }) => {
                        setSelectedAddress(address);
                      }}
                      className="mb-3"
                    />

                    <div className="relative">
                      <textarea
                        placeholder="Enter your delivery address or use your current location above"
                        value={selectedAddress}
                        onChange={(e) => setSelectedAddress(e.target.value)}
                        rows="3"
                        className="input-field w-full border-2 border-dashed border-orange-200 rounded-[12px] focus:border-primary"
                      />
                      {selectedAddress && geoAddress && selectedAddress === geoAddress && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-green-600 font-medium">
                          <FiNavigation className="w-3 h-3" />
                          <span>Auto-detected from your location</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Special Instructions */}
            <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6">
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Special Instructions
              </label>
              <textarea
                placeholder="Any special requests or allergies? Let us know here..."
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows="3"
                className="input-field w-full border-2 border-dashed border-orange-200 rounded-[12px] focus:border-primary"
              />
            </div>

            {/* Cart Items List */}
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-4 flex items-center justify-between hover:shadow-md transition-all"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    {item.customizations && (
                      <p className="text-sm text-gray-600 mt-1">
                        {item.customizations}
                      </p>
                    )}
                    <p className="text-sm font-medium text-primary mt-2">
                      ₹{item.price}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 ml-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center border-2 border-dashed border-orange-200 rounded-[12px] bg-orange-50">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, Math.max(0, item.quantity - 1))
                        }
                        className="p-2 hover:bg-orange-100 transition-colors"
                      >
                        <FiMinus className="w-4 h-4 text-primary font-bold" />
                      </button>
                      <span className="px-3 py-1 font-bold text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="p-2 hover:bg-orange-100 transition-colors"
                      >
                        <FiPlus className="w-4 h-4 text-primary font-bold" />
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <FiTrash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Clear Cart Button */}
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear your cart?')) {
                  clearCart();
                  toast.success('Cart cleared');
                }
              }}
              className="w-full bg-white border-2 border-dashed border-red-200 text-red-600 font-bold py-3 rounded-[15px] hover:bg-red-50 transition-all"
            >
              Clear Cart
            </button>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6 sticky top-24 shadow-md">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>

              <div className="space-y-3 mb-6 pb-6 border-b-2 border-dashed border-orange-200">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Taxes & Charges</span>
                  <span className="font-semibold">₹{tax.toFixed(2)}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span className="font-semibold">₹{deliveryFee.toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-2xl font-bold text-white bg-gradient-to-r from-primary to-primary-dark p-4 rounded-[12px] mb-6">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>

              {/* Info Alert */}
              {orderType === 'dine_in' && !isSelfService && !dineInTime && (
                <div className="mb-4 p-3 bg-orange-50 border-2 border-dashed border-orange-200 rounded-lg flex items-start space-x-2">
                  <FiAlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-orange-800 font-medium">
                    Please select a time for your dine-in reservation
                  </p>
                </div>
              )}

              {orderType === 'delivery' && !selectedAddress && (
                <div className="mb-4 p-3 bg-orange-50 border-2 border-dashed border-orange-200 rounded-lg flex items-start space-x-2">
                  <FiAlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-orange-800 font-medium">
                    Please enter your delivery address
                  </p>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={
                  (orderType === 'dine_in' && !isSelfService && !dineInTime) ||
                  (orderType === 'delivery' && !selectedAddress)
                }
                className="w-full bg-gradient-to-r from-primary to-primary-dark text-white font-bold py-3 rounded-[15px] hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed to Checkout
              </button>

              <Link
                to="/restaurants"
                className="block w-full mt-3 bg-white border-2 border-dashed border-orange-200 text-primary font-bold py-3 rounded-[15px] text-center hover:bg-orange-50 transition-all"
              >
                Add More Items
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
