import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiShoppingBag,
  FiRepeat,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import api from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

const STATUS_CONFIG = {
  placed: { label: 'Placed', color: 'bg-blue-100 text-blue-800', icon: '📋' },
  confirmed: { label: 'Confirmed', color: 'bg-yellow-100 text-yellow-800', icon: '✓' },
  preparing: { label: 'Preparing', color: 'bg-orange-100 text-orange-800', icon: '👨‍🍳' },
  ready: { label: 'Ready', color: 'bg-green-100 text-green-800', icon: '✓' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-purple-100 text-purple-800', icon: '🚗' },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: '✓' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: '✕' },
};

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch orders (no status filter — fetch all, then split client-side)
  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.orders.getAll({ limit: 50 });
        const data = response.data?.data?.orders || response.data?.data || [];
        setOrders(data);
      } catch (err) {
        const message = err.response?.data?.message || 'Failed to load orders';
        setError(message);
        toast.error(message);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const activeOrders = orders.filter(
    (order) =>
      !['delivered', 'cancelled'].includes(order.status)
  );

  const pastOrders = orders.filter((order) =>
    ['delivered', 'cancelled'].includes(order.status)
  );

  const displayOrders = activeTab === 'active' ? activeOrders : pastOrders;

  const handleReorder = async (order) => {
    try {
      toast.success('Items added to cart. Redirecting to cart...');
      window.location.href = '/cart';
    } catch (error) {
      toast.error('Failed to reorder');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">My Orders</h1>

        {/* Tabs */}
        <div className="flex border-b-2 border-gray-200 mb-8 space-x-8">
          <button
            onClick={() => setActiveTab('active')}
            className={`py-3 font-bold border-b-2 transition-colors pb-3 ${
              activeTab === 'active'
                ? 'text-primary border-primary'
                : 'text-gray-600 border-transparent hover:text-primary'
            }`}
          >
            Active Orders
            {activeOrders.length > 0 && (
              <span className="ml-2 bg-gradient-to-r from-primary to-primary-dark text-white text-xs font-bold rounded-full px-2.5 py-1">
                {activeOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('past')}
            className={`py-3 font-bold border-b-2 transition-colors pb-3 ${
              activeTab === 'past'
                ? 'text-primary border-primary'
                : 'text-gray-600 border-transparent hover:text-primary'
            }`}
          >
            Past Orders
            {pastOrders.length > 0 && (
              <span className="ml-2 bg-gray-400 text-white text-xs font-bold rounded-full px-2.5 py-1">
                {pastOrders.length}
              </span>
            )}
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-dashed border-red-200 rounded-[15px] flex items-start space-x-3">
            <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-900">Error Loading Orders</h3>
              <p className="text-sm text-red-800 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {displayOrders.length === 0 ? (
          <EmptyState
            icon={FiShoppingBag}
            title={
              activeTab === 'active'
                ? 'No active orders'
                : 'No past orders'
            }
            description={
              activeTab === 'active'
                ? 'Your active orders will appear here'
                : 'Your past orders will appear here'
            }
            actionLabel="Browse Restaurants"
            onAction={() => (window.location.href = '/restaurants')}
          />
        ) : (
          <div className="space-y-4">
            {displayOrders.map((order) => {
              const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.placed;
              const itemCount = order.items?.length || 0;

              return (
                <Link
                  key={order._id || order.id}
                  to={`/orders/${order._id || order.id}`}
                  className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] overflow-hidden hover:shadow-lg transition-all cursor-pointer block"
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap mb-3">
                          <h3 className="text-lg font-bold text-gray-900">
                            Order #{order.orderNumber || (order._id || order.id).slice(0, 8).toUpperCase()}
                          </h3>
                          {order.tokenNumber && (
                            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-primary to-primary-dark text-white font-bold px-3 py-1 rounded-full text-xs">
                              🎫 Token #{order.tokenNumber}
                            </span>
                          )}
                          <span
                            className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                              order.status === 'delivered'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {status.icon} {status.label}
                          </span>
                        </div>

                        <p className="text-gray-900 font-semibold mb-2">
                          {order.restaurant?.name || 'Restaurant'}
                        </p>

                        <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                          <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                          <span className="text-primary font-bold">
                            ₹{order.total?.toFixed(2) || '0.00'}
                          </span>
                        </div>

                        {order.createdAt && (
                          <p className="text-xs text-gray-500">
                            {format(new Date(order.createdAt), 'MMM dd, yyyy • hh:mm a')}
                          </p>
                        )}
                      </div>

                      {/* Order Type Badge */}
                      <div className="text-sm font-bold text-gray-700 bg-orange-50 px-4 py-2 rounded-[12px] border border-orange-100">
                        {order.orderType === 'delivery'
                          ? '🚚 Delivery'
                          : order.orderType === 'takeaway'
                          ? '📦 Takeaway'
                          : '🍽️ Dine-in'}
                      </div>

                      <FiArrowRight className="w-5 h-5 text-primary hidden md:block" />
                    </div>

                    {/* Items Summary */}
                    {order.items && order.items.length > 0 && (
                      <div className="mb-4 p-3 bg-orange-50 rounded-[12px] border border-orange-100">
                        <p className="text-xs font-bold text-gray-900 mb-2 uppercase">
                          Items
                        </p>
                        <div className="space-y-1">
                          {order.items.slice(0, 2).map((item, idx) => (
                            <p key={idx} className="text-sm text-gray-700">
                              • {item.name} × {item.quantity}
                            </p>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-xs text-gray-600 font-medium">
                              +{order.items.length - 2} more
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
