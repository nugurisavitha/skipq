import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiLoader,
  FiCheckCircle,
  FiClock,
  FiPhone,
  FiMapPin,
  FiX,
  FiAlertCircle,
  FiBell,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../../services/api';
import { useSocket } from '../../hooks/useSocket';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const STATUS_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: '📋' },
  { key: 'confirmed', label: 'Confirmed', icon: '✓' },
  { key: 'preparing', label: 'Preparing', icon: '👨‍🍳' },
  { key: 'ready', label: 'Ready', icon: '🎉' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚗' },
  { key: 'delivered', label: 'Delivered', icon: '✓' },
];

const STATUS_COLORS = {
  placed: 'bg-blue-500',
  confirmed: 'bg-yellow-500',
  preparing: 'bg-orange-500',
  ready: 'bg-green-500',
  out_for_delivery: 'bg-purple-500',
  delivered: 'bg-green-600',
  cancelled: 'bg-red-500',
  completed: { bg: '#bbf7d0', text: '#166534', label: 'Completed' },
};

const DEFAULT_STATUS_COLOR = { bg: '#f3f4f6', text: '#374151', label: 'Unknown' };

export default function OrderDetailPage() {
  const { id: orderId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Fetch order details
  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.orders.getById(orderId);
        const orderData = response.data?.data?.order || response.data?.data;
        setOrder(orderData);
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to load order';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleOrderUpdate = (data) => {
      if (data.orderId === orderId || data.orderId === order?._id) {
        setOrder((prev) => ({
          ...prev,
          status: data.status,
          restaurantStatuses: data.restaurantStatuses || prev?.restaurantStatuses,
        }));
        // Show toast for estimated time updates
        if (data.estimatedTime && data.restaurantName) {
          toast(`${data.restaurantName}: ~${data.estimatedTime} min estimated`, {
            icon: '⏱️',
            duration: 5000,
          });
        }
      }
    };

    const handlePickupReady = (data) => {
      if (data.orderId === orderId || data.orderId === order?._id) {
        toast.success(data.message, { duration: 8000, icon: '🔔' });
        // Update the restaurant status in local state
        setOrder((prev) => {
          if (!prev?.restaurantStatuses) return prev;
          return {
            ...prev,
            restaurantStatuses: prev.restaurantStatuses.map((rs) =>
              rs.restaurantId === data.restaurantId
                ? { ...rs, status: 'ready', readyAt: new Date().toISOString() }
                : rs
            ),
          };
        });
      }
    };

    socket.on('order_status_updated', handleOrderUpdate);
    socket.on('food_court_pickup_ready', handlePickupReady);

    // Join the order room for real-time updates
    socket.emit('join_order_room', orderId);

    return () => {
      socket.off('order_status_updated', handleOrderUpdate);
      socket.off('food_court_pickup_ready', handlePickupReady);
    };
  }, [socket, orderId, order?._id]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setCancelLoading(true);
    try {
      await api.orders.cancel(orderId);
      toast.success('Order cancelled successfully');
      setOrder((prev) => ({ ...prev, status: 'cancelled' }));
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to cancel order';
      toast.error(message);
    } finally {
      setCancelLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate('/orders')}
            className="flex items-center space-x-2 text-primary hover:text-primary-dark mb-6"
          >
            <FiArrowLeft className="w-5 h-5" />
            <span>Back to Orders</span>
          </button>
          <div className="text-center">
            <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900">Order Not Found</h1>
            <p className="text-gray-600 mt-2">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const currentStatusIndex = STATUS_STEPS.findIndex(
    (step) => step.key === order.status
  );

  const isDeliveryOrder = order.orderType === 'delivery';
  const isFoodCourtOrder = !!order.foodCourt;
  const isCancelled = order.status === 'cancelled';
  const canCancel = ['placed', 'confirmed'].includes(order.status);

  // Estimate remaining time based on order status
  const getEstimatedTime = () => {
    if (isCancelled || order.status === 'delivered' || order.status === 'completed') return null;

    // For food court orders, use the max estimated time from restaurants that aren't ready yet
    if (isFoodCourtOrder && order.restaurantStatuses?.length > 0) {
      const pendingRestaurants = order.restaurantStatuses.filter(
        (rs) => rs.status !== 'ready' && rs.status !== 'picked_up'
      );
      if (pendingRestaurants.length === 0) return null; // All ready
      const estimates = pendingRestaurants
        .filter((rs) => rs.estimatedTime)
        .map((rs) => rs.estimatedTime);
      if (estimates.length > 0) {
        const maxEst = Math.max(...estimates);
        return { min: maxEst, max: maxEst, label: 'Estimated prep time' };
      }
      // No estimates set by restaurants yet
      return { min: '?', max: '?', label: 'Waiting for restaurant estimates' };
    }

    // Use restaurant-set estimated time if available
    if (order.estimatedTime) {
      const labels = {
        placed: 'Estimated prep time',
        confirmed: 'Estimated prep time',
        preparing: 'Cooking your order',
        ready: 'Ready for pickup',
        out_for_delivery: 'On the way',
      };
      return {
        min: order.estimatedTime,
        max: order.estimatedTime,
        label: labels[order.status] || 'Estimated time',
      };
    }

    // Fallback to default ranges if restaurant hasn't set an estimate
    const statusTimes = {
      placed: { min: 30, max: 45, label: 'Estimated delivery' },
      confirmed: { min: 25, max: 35, label: 'Preparing & delivery' },
      preparing: { min: 15, max: 25, label: 'Cooking & delivery' },
      ready: { min: 10, max: 15, label: 'Pickup/delivery' },
      out_for_delivery: { min: 5, max: 15, label: 'Arriving' },
    };
    return statusTimes[order.status] || null;
  };

  const estimatedTime = getEstimatedTime();

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center space-x-2 text-primary hover:text-primary-dark mb-6 transition-colors font-medium"
        >
          <FiArrowLeft className="w-5 h-5" />
          <span>Back to Orders</span>
        </button>

        {/* Estimated Time Banner */}
        {estimatedTime && (
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-dashed border-orange-200 p-6 rounded-[15px] mb-8 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white rounded-full">
                <FiClock className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg">{estimatedTime.label}</p>
                <p className="text-sm text-gray-600">Your order is being processed</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-primary">
                {estimatedTime.min === estimatedTime.max
                  ? (estimatedTime.min === '?' ? '...' : `~${estimatedTime.min}`)
                  : `${estimatedTime.min}-${estimatedTime.max}`}
              </p>
              <p className="text-sm text-gray-600 font-medium">
                {estimatedTime.min === '?' ? 'pending' : 'minutes'}
              </p>
            </div>
          </div>
        )}

        {/* Order Header */}
        <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Order #{order.orderNumber || (order._id || orderId).slice(0, 8).toUpperCase()}
              </h1>
              {order.tokenNumber && (
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-primary-dark text-white font-bold px-4 py-2 rounded-[12px] text-lg mb-2">
                  <span>🎫</span>
                  <span>Token #{order.tokenNumber}</span>
                </div>
              )}
              {order.createdAt && (
                <p className="text-gray-600 font-medium">
                  {format(new Date(order.createdAt), 'MMMM dd, yyyy • hh:mm a')}
                </p>
              )}
            </div>

            <div>
              <div
                className={`px-6 py-3 rounded-[15px] text-white font-bold inline-block ${
                  isCancelled
                    ? 'bg-red-600'
                    : order.status === 'delivered'
                    ? 'bg-green-600'
                    : 'bg-gradient-to-r from-primary to-primary-dark'
                }`}
              >
                {order.status === 'placed' && '📋 Placed'}
                {order.status === 'confirmed' && '✓ Confirmed'}
                {order.status === 'preparing' && '👨‍🍳 Preparing'}
                {order.status === 'ready' && '🎉 Ready'}
                {order.status === 'out_for_delivery' && '🚗 Out for Delivery'}
                {order.status === 'delivered' && '✓ Delivered'}
                {order.status === 'cancelled' && '✕ Cancelled'}
              </div>
            </div>
          </div>
        </div>

        {/* Food Court Pickup Tracker */}
        {isFoodCourtOrder && order.restaurantStatuses?.length > 0 && !isCancelled && (
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-primary to-primary-dark rounded-full">
                <FiBell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Counter Pickup Status</h2>
                <p className="text-sm text-gray-600">You'll be notified when each restaurant's food is ready</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {order.restaurantStatuses.map((rs, idx) => {
                const isReady = rs.status === 'ready' || rs.status === 'picked_up';
                const isPreparing = rs.status === 'preparing';
                const isPickedUp = rs.status === 'picked_up';
                const hasEstimate = rs.estimatedTime && !isReady;

                return (
                  <div
                    key={rs.restaurantId || idx}
                    className={`relative rounded-[12px] p-4 border-2 transition-all ${
                      isPickedUp
                        ? 'border-gray-300 bg-gray-50'
                        : isReady
                        ? 'border-green-400 bg-green-50 shadow-md animate-pulse'
                        : isPreparing
                        ? 'border-yellow-400 bg-yellow-50'
                        : 'border-orange-200 bg-orange-50'
                    }`}
                  >
                    {isReady && !isPickedUp && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                        READY!
                      </div>
                    )}

                    <h3 className="font-bold text-gray-900 mb-2">{rs.restaurantName}</h3>

                    <div className={`inline-flex items-center space-x-1 text-sm font-semibold px-3 py-1 rounded-full ${
                      isPickedUp
                        ? 'bg-gray-200 text-gray-600'
                        : isReady
                        ? 'bg-green-200 text-green-800'
                        : isPreparing
                        ? 'bg-yellow-200 text-yellow-800'
                        : rs.status === 'confirmed'
                        ? 'bg-blue-200 text-blue-800'
                        : 'bg-orange-200 text-orange-800'
                    }`}>
                      <span>{
                        isPickedUp ? '✓ Picked Up' :
                        isReady ? '🔔 Ready for Pickup!' :
                        isPreparing ? '👨‍🍳 Preparing...' :
                        rs.status === 'confirmed' ? '✓ Confirmed' :
                        '📋 Order Placed'
                      }</span>
                    </div>

                    {/* Estimated Time Display */}
                    {hasEstimate && (
                      <div className="mt-3 flex items-center gap-2 bg-white/70 border border-orange-100 rounded-full px-3 py-1.5 w-fit">
                        <FiClock className="w-4 h-4 text-primary" />
                        <span className="text-sm font-bold text-primary">~{rs.estimatedTime} min</span>
                      </div>
                    )}

                    {isReady && !isPickedUp && (
                      <p className="text-sm text-green-700 font-medium mt-2">
                        Head to the {rs.restaurantName} counter!
                      </p>
                    )}

                    {rs.readyAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Ready at {new Date(rs.readyAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Timeline (hide for food court orders — they use the pickup tracker above) */}
            {!isCancelled && !isFoodCourtOrder && (
              <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-8">
                <h2 className="text-lg font-bold text-gray-900 mb-8">
                  Order Tracking
                </h2>

                <div className="space-y-6">
                  {STATUS_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStatusIndex;
                    const isCurrent = idx === currentStatusIndex;

                    return (
                      <div key={step.key} className="flex items-start">
                        {/* Timeline Point */}
                        <div className="flex flex-col items-center mr-6">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg ${
                              isCompleted
                                ? 'bg-gradient-to-r from-primary to-primary-dark'
                                : 'bg-gray-300'
                            }`}
                          >
                            {step.icon}
                          </div>

                          {idx < STATUS_STEPS.length - 1 && (
                            <div
                              className={`w-1.5 h-20 mt-3 rounded-full ${
                                isCompleted
                                  ? 'bg-gradient-to-b from-primary to-primary-dark'
                                  : 'bg-gray-300'
                              }`}
                            ></div>
                          )}
                        </div>

                        {/* Step Content */}
                        <div className="pt-1">
                          <p
                            className={`font-bold text-lg ${
                              isCompleted
                                ? 'text-gray-900'
                                : 'text-gray-400'
                            }`}
                          >
                            {step.label}
                          </p>
                          {isCurrent && (
                            <p className="text-sm text-primary font-bold mt-1">
                              In progress...
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Restaurant Info */}
            <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Restaurant
              </h2>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {order.restaurant?.name}
                  </h3>
                  {order.restaurant?.address && (
                    <p className="text-sm text-gray-600 mt-1 flex items-center">
                      <FiMapPin className="w-4 h-4 mr-1" />
                      {order.restaurant.address}
                    </p>
                  )}
                  {order.restaurant?.phone && (
                    <p className="text-sm text-gray-600 mt-1 flex items-center">
                      <FiPhone className="w-4 h-4 mr-1" />
                      {order.restaurant.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Delivery Person Info (if assigned) */}
            {isDeliveryOrder &&
              order.deliveryPerson &&
              order.status !== 'cancelled' && (
                <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Delivery Partner
                  </h2>

                  <div className="flex items-center justify-between">
                    <div className="bg-orange-50 p-4 rounded-[12px] border border-orange-100 flex-1 mr-4">
                      <h3 className="text-lg font-bold text-gray-900">
                        {order.deliveryPerson.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {order.deliveryPerson.vehicle}
                      </p>
                    </div>
                    <a
                      href={`tel:${order.deliveryPerson.phone}`}
                      className="bg-gradient-to-r from-primary to-primary-dark text-white font-bold p-3 rounded-full flex items-center justify-center hover:shadow-lg transition-all"
                    >
                      <FiPhone className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              )}

            {/* Items */}
            <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Order Items
              </h2>

              <div className="space-y-3">
                {order.items &&
                  order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-orange-50 rounded-[12px] border border-orange-100"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.name}
                        </p>
                        {item.customizations && (
                          <p className="text-sm text-gray-600">
                            {item.customizations}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">× {item.quantity}</p>
                        <p className="font-semibold text-gray-900">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Delivery/Pickup Info */}
            {isDeliveryOrder && order.deliveryAddress && (
              <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FiMapPin className="w-5 h-5 text-primary mr-2" />
                  Delivery Address
                </h2>
                <p className="text-gray-700 whitespace-pre-line bg-orange-50 p-4 rounded-[12px] border border-orange-100">
                  {typeof order.deliveryAddress === 'string'
                    ? order.deliveryAddress
                    : order.deliveryAddress?.address || 'N/A'}
                </p>
              </div>
            )}

            {order.orderType === 'dine_in' && (
              <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Dine-in Details
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-orange-50 p-4 rounded-[12px] border border-orange-100">
                    <p className="text-sm text-gray-600 font-medium">Date & Time</p>
                    <p className="font-bold text-gray-900 text-primary">
                      {order.dineInTime}
                    </p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-[12px] border border-orange-100">
                    <p className="text-sm text-gray-600 font-medium">Table</p>
                    <p className="font-bold text-gray-900 text-primary">
                      {order.tableNumber}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Special Instructions */}
            {order.specialInstructions && (
              <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                  Special Instructions
                </h2>
                <p className="text-gray-700 bg-orange-50 p-4 rounded-[12px] border border-orange-100">{order.specialInstructions}</p>
              </div>
            )}

            {/* Cancel Button */}
            {canCancel && (
              <button
                onClick={handleCancelOrder}
                disabled={cancelLoading}
                className="w-full bg-white border-2 border-dashed border-red-200 text-red-600 font-bold py-3 rounded-[15px] flex items-center justify-center space-x-2 hover:bg-red-50 transition-all disabled:opacity-50"
              >
                {cancelLoading ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <>
                    <FiX className="w-4 h-4" />
                    <span>Cancel Order</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right Sidebar - Price Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-6 sticky top-24 shadow-md">
              <h2 className="text-lg font-bold text-gray-900 mb-6">
                Price Summary
              </h2>

              <div className="space-y-2 mb-6 pb-6 border-b-2 border-dashed border-orange-200 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    ₹{order.subtotal?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Taxes & Charges</span>
                  <span className="font-medium">
                    ₹{order.tax?.toFixed(2) || '0.00'}
                  </span>
                </div>
                {isDeliveryOrder && (
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span className="font-medium">
                      ₹{order.deliveryFee?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                )}
                {order.convenienceFee > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Convenience Fee (₹10 + GST)</span>
                    <span className="font-medium">
                      ₹{order.convenienceFee.toFixed(2)}
                    </span>
                  </div>
                )}
                {order.discount && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Discount</span>
                    <span>
                      -₹{order.discount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-lg font-bold text-white bg-gradient-to-r from-primary to-primary-dark p-4 rounded-[12px] mb-6">
                <span>Total</span>
                <span>₹{(order.total || order.totalAmount)?.toFixed(2) || '0.00'}</span>
              </div>

              <div className="p-4 bg-orange-50 border-2 border-dashed border-orange-200 rounded-[12px] text-sm">
                <p className="font-bold text-gray-900 mb-2">
                  Payment Method
                </p>
                <p className="text-gray-700 font-medium">
                  {order.paymentMethod === 'cash'
                    ? 'Cash on Delivery'
                    : 'Online Payment (Razorpay)'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
