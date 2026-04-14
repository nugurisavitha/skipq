import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FiArrowLeft,
  FiLoader,
  FiCheck,
  FiCreditCard,
  FiTag,
  FiAlertCircle,
  FiMapPin,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { useCart } from '../../hooks/useCart';
import { useAuth } from '../../hooks/useAuth';

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const {
    items,
    restaurantData,
    getSubtotal,
    getTax,
    getDeliveryFee,
    clearCart,
    isEmpty,
  } = useCart();

  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const state = location.state || {};

  if (isEmpty || !restaurantData) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-white flex items-center justify-center">
        <div className="text-center">
          <FiAlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Cart is Empty</h1>
          <p className="text-gray-600 mb-6">Please add items to your cart</p>
          <button
            onClick={() => navigate('/restaurants')}
            className="btn btn-primary"
          >
            Browse Restaurants
          </button>
        </div>
      </div>
    );
  }

  const subtotal = getSubtotal();
  const tax = getTax();
  const deliveryFee = state.orderType === 'delivery' ? getDeliveryFee() : 0;
  // Convenience fee: Rs 10 + 18% GST = Rs 11.80
  const convenienceFee = 11.80;
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const total = subtotal + tax + deliveryFee + convenienceFee - discountAmount;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    if (couponCode.toUpperCase() === 'SAVE50') {
      setAppliedCoupon({
        code: couponCode,
        discount: Math.min(50, subtotal * 0.1),
      });
      toast.success('Coupon applied successfully!');
    } else {
      toast.error('Invalid coupon code');
    }
  };

  const handlePaymentWithRazorpay = async () => {
    if (!window.Razorpay) {
      toast.error('Payment service not available');
      return;
    }

    setIsLoading(true);
    try {
      const orderResponse = await api.payments.createOrder({
        amount: Math.round(total * 100),
        currency: 'INR',
        description: `Order from ${restaurantData.name}`,
      });

      const paymentOrderId = orderResponse.data.data.orderId;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_key',
        amount: Math.round(total * 100),
        currency: 'INR',
        name: 'SkipQ',
        description: `Order from ${restaurantData.name}`,
        order_id: paymentOrderId,
        handler: async (response) => {
          try {
            await api.payments.verify({
              orderId: paymentOrderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            });

            await createOrder('razorpay', response.razorpay_payment_id);
          } catch (error) {
            toast.error('Payment verification failed');
            console.error('Payment verification error:', error);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#FF6B35',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create payment order';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCODPayment = async () => {
    await createOrder('cash');
  };

  const createOrder = async (paymentMethod, paymentId = null) => {
    setIsLoading(true);
    try {
      const orderData = {
        restaurantId: restaurantData._id || restaurantData.id,
        items: items.map((item) => ({
          menuItemId: item._id || item.id,
          quantity: item.quantity,
          customizations: item.customizations,
        })),
        orderType: state.orderType || 'delivery',
        deliveryAddress:
          state.orderType === 'delivery'
            ? { address: state.deliveryAddress }
            : null,
        scheduledFor:
          state.orderType === 'dine_in' ? state.dineInTime : null,
        tableNumber:
          state.orderType === 'dine_in' ? state.tableNumber : null,
        specialInstructions: state.specialInstructions,
        paymentMethod,
        paymentId,
        couponCode: appliedCoupon?.code,
        totalAmount: total,
      };

      const response = await api.orders.create(orderData);
      const orderRes = response.data?.data?.order || response.data?.data;
      const newOrderId = orderRes?._id || orderRes?.id;

      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/orders/${newOrderId}`);
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to place order';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center space-x-2 text-primary hover:text-primary-dark mb-6 transition-colors font-medium"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span>Back to Cart</span>
        </button>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12 max-w-2xl mx-auto">
          <div className="flex items-center space-x-4 w-full">
            <div className="flex-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-primary to-primary-dark text-white font-bold">1</div>
              <p className="text-xs text-gray-600 text-center mt-2">Review</p>
            </div>
            <div className="flex-1 h-1 bg-gradient-to-r from-primary to-primary-dark rounded-full"></div>
            <div className="flex-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/30 text-primary font-bold">2</div>
              <p className="text-xs text-gray-600 text-center mt-2">Payment</p>
            </div>
            <div className="flex-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="flex-1">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-300 text-gray-600 font-bold">3</div>
              <p className="text-xs text-gray-600 text-center mt-2">Confirm</p>
            </div>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Payment & Delivery */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            {state.orderType === 'delivery' && (
              <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FiMapPin className="w-5 h-5 text-primary mr-2" />
                  Delivery Address
                </h2>
                <p className="text-gray-700 whitespace-pre-line bg-orange-50 p-4 rounded-[12px] border border-orange-100 mb-4">
                  {state.deliveryAddress}
                </p>
                <button
                  onClick={() => navigate('/cart')}
                  className="text-sm text-primary hover:underline font-bold"
                >
                  Change Address
                </button>
              </div>
            )}

            {/* Dine-in Details */}
            {state.orderType === 'dine_in' && (
              <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Dine-in Details
                </h2>
                <div className={`grid ${state.tableNumber ? 'grid-cols-2' : 'grid-cols-1'} gap-4 mb-4`}>
                  <div className="bg-orange-50 p-4 rounded-[12px] border border-orange-100">
                    <p className="text-sm text-gray-600 font-medium">Date & Time</p>
                    <p className="font-semibold text-gray-900 text-primary">
                      {state.dineInTime}
                    </p>
                  </div>
                  {state.tableNumber && (
                    <div className="bg-orange-50 p-4 rounded-[12px] border border-orange-100">
                      <p className="text-sm text-gray-600 font-medium">Table Number</p>
                      <p className="font-semibold text-gray-900 text-primary">
                        {state.tableNumber}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => navigate('/cart')}
                  className="text-sm text-primary hover:underline font-bold"
                >
                  Change Details
                </button>
              </div>
            )}

            {/* Coupon Code */}
            <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <FiTag className="w-5 h-5 text-primary mr-2" />
                Apply Coupon
              </h2>
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  disabled={!!appliedCoupon}
                  className="input-field flex-1 border-2 border-dashed border-orange-200 rounded-[12px] focus:border-primary"
                />
                {appliedCoupon ? (
                  <button
                    onClick={() => setAppliedCoupon(null)}
                    className="bg-white border-2 border-dashed border-red-200 text-red-600 font-bold px-4 py-2 rounded-[12px] hover:bg-red-50 transition-all"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={handleApplyCoupon}
                    className="bg-gradient-to-r from-primary to-primary-dark text-white font-bold px-4 py-2 rounded-[12px] flex items-center space-x-1"
                  >
                    <FiTag className="w-4 h-4" />
                    Apply
                  </button>
                )}
              </div>
              {appliedCoupon && (
                <div className="p-3 bg-green-50 border-2 border-dashed border-green-200 rounded-[12px] flex items-center space-x-2 mb-3">
                  <FiCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-green-800 font-medium">
                    {appliedCoupon.code} applied - Save ₹{appliedCoupon.discount.toFixed(2)}
                  </span>
                </div>
              )}
              <p className="text-xs text-gray-600 font-medium">
                Try code: SAVE50
              </p>
            </div>

            {/* Payment Method */}
            <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <FiCreditCard className="w-5 h-5 text-primary mr-2" />
                Payment Method
              </h2>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-[12px] cursor-pointer hover:border-primary transition-colors" style={{ borderColor: paymentMethod === 'cash' ? 'var(--primary, #F2A93E)' : undefined }}>
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-bold text-gray-900">
                      Cash on Delivery
                    </p>
                    <p className="text-sm text-gray-600">
                      Pay when your order arrives
                    </p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-[12px] cursor-pointer hover:border-primary transition-colors" style={{ borderColor: paymentMethod === 'razorpay' ? 'var(--primary, #F2A93E)' : undefined }}>
                  <input
                    type="radio"
                    name="payment"
                    value="razorpay"
                    checked={paymentMethod === 'razorpay'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-4 h-4"
                  />
                  <div>
                    <p className="font-bold text-gray-900 flex items-center">
                      <FiCreditCard className="w-5 h-5 text-primary mr-2" />
                      Pay Online
                    </p>
                    <p className="text-sm text-gray-600">
                      Card, UPI, Wallet & more
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              onClick={
                paymentMethod === 'razorpay'
                  ? handlePaymentWithRazorpay
                  : handleCODPayment
              }
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-primary to-primary-dark text-white font-bold text-lg py-4 rounded-[15px] flex items-center justify-center space-x-2 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {isLoading ? (
                <>
                  <FiLoader className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <FiCheck className="w-5 h-5" />
                  <span>Place Order</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6 sticky top-24 shadow-md">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                Order Summary
              </h2>

              {/* Items */}
              <div className="space-y-3 mb-6 pb-6 border-b-2 border-dashed border-orange-200 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-start text-sm"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        × {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-2 mb-6 pb-6 border-b-2 border-dashed border-orange-200 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Taxes & Charges</span>
                  <span className="font-medium">₹{tax.toFixed(2)}</span>
                </div>
                {state.orderType === 'delivery' && (
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span className="font-medium">₹{deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Convenience Fee (₹10 + GST)</span>
                  <span className="font-medium">₹{convenienceFee.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Discount</span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="flex justify-between text-lg font-bold text-white bg-gradient-to-r from-primary to-primary-dark p-4 rounded-[12px] mb-4">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>

              {/* Restaurant Info */}
              <div className="p-4 bg-orange-50 border-2 border-dashed border-orange-200 rounded-[12px] text-sm">
                <p className="font-bold text-gray-900 mb-1">From</p>
                <p className="text-gray-700 font-medium">{restaurantData.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
