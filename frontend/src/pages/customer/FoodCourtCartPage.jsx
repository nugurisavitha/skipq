import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiTrash2, FiPlus, FiMinus, FiShoppingCart, FiCreditCard, FiX, FiBell } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { foodCourtsAPI } from '../../services/api';

export default function FoodCourtCartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cart, setCart] = useState(null);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isLoading, setIsLoading] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const foodCourtCart = localStorage.getItem('foodCourtCart');
    if (foodCourtCart) {
      setCart(JSON.parse(foodCourtCart));
    }
  }, []);

  // Group items by restaurant
  const groupedItems = React.useMemo(() => {
    if (!cart?.items) return {};
    return cart.items.reduce((acc, item) => {
      const restaurantId = item.restaurantId;
      if (!acc[restaurantId]) {
        acc[restaurantId] = {
          restaurantId,
          restaurantName: item.restaurantName,
          items: [],
        };
      }
      acc[restaurantId].items.push(item);
      return acc;
    }, {});
  }, [cart]);

  // Update quantity
  const updateQuantity = (menuItemId, change) => {
    const updatedItems = cart.items.map((item) => {
      if (item.menuItemId === menuItemId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean);

    const updatedCart = { ...cart, items: updatedItems };
    setCart(updatedCart);
    localStorage.setItem('foodCourtCart', JSON.stringify(updatedCart));
  };

  // Remove item
  const removeItem = (menuItemId) => {
    const updatedItems = cart.items.filter((item) => item.menuItemId !== menuItemId);
    const updatedCart = { ...cart, items: updatedItems };
    setCart(updatedCart);
    localStorage.setItem('foodCourtCart', JSON.stringify(updatedCart));
    toast.success('Item removed from cart');
  };

  // Calculate totals
  const calculateSubtotal = () => {
    return cart?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.05;
  // Convenience fee: Rs 10 + 18% GST = Rs 11.80
  const convenienceFee = 11.80;
  const total = subtotal + tax + convenienceFee;

  // Handle place order
  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please log in to place an order');
      navigate('/login');
      return;
    }

    if (!cart?.items || cart.items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    setIsLoading(true);
    try {
      const orderData = {
        items: cart.items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          customizations: item.customizations || [],
        })),
        specialInstructions: specialInstructions || undefined,
        paymentMethod,
      };

      const response = await foodCourtsAPI.createOrder(cart.foodCourtId, orderData);
      const order = response.data?.data?.order || response.data?.data;

      // Clear cart from localStorage
      localStorage.removeItem('foodCourtCart');

      toast.success('Order placed successfully!');
      navigate(`/orders/${order._id || order.id}`);
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setIsLoading(false);
    }
  };

  // Empty cart state
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white p-4 md:p-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-orange-100 rounded-lg transition"
            >
              <FiArrowLeft className="text-2xl text-gray-700" />
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Food Court Order</h1>
          </div>

          {/* Empty State */}
          <div className="flex flex-col items-center justify-center py-20">
            <FiShoppingCart className="text-6xl text-orange-200 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 text-center mb-8">
              Browse food courts and add items to get started
            </p>
            <button
              onClick={() => navigate('/food-courts')}
              className="bg-gradient-to-r from-[#F2A93E] to-[#F07054] text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition"
            >
              Browse Food Courts
            </button>
          </div>
        </div>
      </div>
    );
  }

  const restaurantCount = Object.keys(groupedItems).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-orange-100 rounded-lg transition"
          >
            <FiArrowLeft className="text-2xl text-gray-700" />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Food Court Order</h1>
            <p className="text-gray-600 mt-1">{cart.foodCourtName}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Items Grouped by Restaurant */}
            <div className="space-y-6 mb-8">
              {Object.entries(groupedItems).map(([restaurantId, restaurant]) => (
                <div
                  key={restaurantId}
                  className="border-2 border-dashed border-orange-200 rounded-[15px] overflow-hidden"
                >
                  {/* Restaurant Header */}
                  <div className="bg-gradient-to-r from-[#F2A93E] to-[#F07054] px-6 py-4">
                    <h2 className="text-xl font-bold text-white">{restaurant.restaurantName}</h2>
                  </div>

                  {/* Items List */}
                  <div className="bg-orange-50 p-6 space-y-4">
                    {restaurant.items.map((item) => (
                      <div
                        key={item.menuItemId}
                        className="bg-white rounded-[12px] p-4 flex gap-4 items-start hover:shadow-md transition"
                      >
                        {/* Item Image */}
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                          />
                        )}

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-lg">{item.name}</h3>
                          {item.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          <p className="text-lg font-bold text-[#F2A93E] mt-2">
                            ₹{item.price.toFixed(2)}
                          </p>
                        </div>

                        {/* Quantity Controls and Remove */}
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => removeItem(item.menuItemId)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Remove item"
                          >
                            <FiTrash2 className="text-xl" />
                          </button>

                          <div className="flex items-center gap-2 bg-orange-100 rounded-lg p-1">
                            <button
                              onClick={() => updateQuantity(item.menuItemId, -1)}
                              className="p-1 hover:bg-white rounded transition"
                              disabled={item.quantity <= 1}
                            >
                              <FiMinus className="text-gray-700" />
                            </button>
                            <span className="w-8 text-center font-semibold text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.menuItemId, 1)}
                              className="p-1 hover:bg-white rounded transition"
                            >
                              <FiPlus className="text-gray-700" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Restaurant Subtotal */}
                    <div className="border-t border-orange-200 pt-4 mt-4 text-right">
                      <p className="text-gray-700">
                        Subtotal:{' '}
                        <span className="font-bold text-gray-900">
                          ₹
                          {restaurant.items
                            .reduce((sum, item) => sum + item.price * item.quantity, 0)
                            .toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Counter Pickup Info + Order Details */}
            <div className="border-2 border-dashed border-orange-200 rounded-[15px] overflow-hidden">
              <div className="bg-gradient-to-r from-[#F2A93E] to-[#F07054] px-6 py-4">
                <h2 className="text-xl font-bold text-white">Order Details</h2>
              </div>

              <div className="bg-orange-50 p-6 space-y-6">
                {/* Counter Pickup Banner */}
                <div className="bg-white border-2 border-dashed border-green-200 rounded-[12px] p-4 flex items-start gap-3">
                  <div className="p-2 bg-green-100 rounded-full flex-shrink-0">
                    <FiBell className="text-green-600 text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Counter Pickup</h3>
                    <p className="text-sm text-gray-600">
                      After placing your order, each restaurant will prepare your food separately.
                      You'll get a <span className="font-semibold text-[#F07054]">real-time notification</span> on
                      your app when food from each restaurant is ready. Just walk to the counter and pick it up!
                    </p>
                  </div>
                </div>

                {/* Special Instructions */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Special Instructions
                  </label>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Add any special requests or dietary information"
                    rows="4"
                    className="w-full px-4 py-2 border border-orange-200 rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#F2A93E] resize-none"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Payment Method
                  </label>
                  <div className="space-y-3">
                    {/* Cash Option */}
                    <label className="flex items-center gap-3 p-4 border-2 border-orange-200 rounded-[12px] cursor-pointer hover:bg-white transition"
                      style={{
                        borderColor: paymentMethod === 'cash' ? '#F2A93E' : '#FDEDD3',
                        backgroundColor: paymentMethod === 'cash' ? '#FFF5E6' : 'transparent',
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5 accent-[#F2A93E]"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">Pay at Counter</p>
                        <p className="text-sm text-gray-600">Pay with cash when you pick up</p>
                      </div>
                    </label>

                    {/* Razorpay Option */}
                    <label className="flex items-center gap-3 p-4 border-2 border-orange-200 rounded-[12px] cursor-pointer hover:bg-white transition"
                      style={{
                        borderColor: paymentMethod === 'razorpay' ? '#F2A93E' : '#FDEDD3',
                        backgroundColor: paymentMethod === 'razorpay' ? '#FFF5E6' : 'transparent',
                      }}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="razorpay"
                        checked={paymentMethod === 'razorpay'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-5 h-5 accent-[#F2A93E]"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                          <FiCreditCard /> Pay Online
                        </p>
                        <p className="text-sm text-gray-600">Secure payment with Razorpay</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Price Summary (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 border-2 border-dashed border-orange-200 rounded-[15px] overflow-hidden">
              <div className="bg-gradient-to-r from-[#F2A93E] to-[#F07054] px-6 py-4">
                <h2 className="text-lg font-bold text-white">Price Summary</h2>
              </div>

              <div className="bg-orange-50 p-6 space-y-4">
                {/* Items Count */}
                <div className="flex justify-between items-center text-gray-700">
                  <span>Items from {restaurantCount} restaurant{restaurantCount > 1 ? 's' : ''}</span>
                  <span className="font-semibold">{cart.items.length}</span>
                </div>

                {/* Subtotal */}
                <div className="flex justify-between items-center text-gray-700 border-b border-orange-200 pb-3">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>

                {/* Tax */}
                <div className="flex justify-between items-center text-gray-700 pb-3">
                  <span>Tax (5%)</span>
                  <span className="font-semibold">₹{tax.toFixed(2)}</span>
                </div>

                {/* Convenience Fee */}
                <div className="flex justify-between items-center text-gray-700 pb-3">
                  <span>Convenience Fee (₹10 + GST)</span>
                  <span className="font-semibold">₹{convenienceFee.toFixed(2)}</span>
                </div>

                {/* Total */}
                <div className="bg-gradient-to-r from-[#F2A93E] to-[#F07054] rounded-[12px] p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold text-white">₹{total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-[#F2A93E] to-[#F07054] text-white py-3 rounded-[12px] font-semibold hover:shadow-lg transition disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
