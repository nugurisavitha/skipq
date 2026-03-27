import React, { useState, useEffect } from 'react';
import { FiMapPin, FiPhone, FiCheck, FiLoader, FiAlertCircle, FiNavigation, FiPackage, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { deliveryAPI } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

export default function DeliveryOrders() {
  const { socket, emitEvent } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState(null);

  useEffect(() => {
    fetchAssignedOrders();

    // Listen for real-time updates
    if (socket) {
      socket.on('order-updated', (updatedOrder) => {
        setOrders((prevOrders) =>
          prevOrders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
        );
      });

      socket.on('new-order-assigned', (newOrder) => {
        setOrders((prevOrders) => [newOrder, ...prevOrders]);
      });
    }

    return () => {
      if (socket) {
        socket.off('order-updated');
        socket.off('new-order-assigned');
      }
    };
  }, [socket]);

  const fetchAssignedOrders = async () => {
    try {
      setLoading(true);
      const response = await deliveryAPI.getAssigned({});
      setOrders(response.data?.data?.orders || response.data?.orders || []);
      toast.success('Orders loaded successfully');
    } catch (error) {
      console.error('Error fetching assigned orders:', error);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingOrder(orderId);
      await deliveryAPI.updateStatus(orderId, newStatus);
      toast.success(`Order status updated to ${newStatus.replace('_', ' ')}`);

      // Emit real-time event
      if (socket) {
        emitEvent('delivery-status-updated', { orderId, status: newStatus });
      }

      fetchAssignedOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      ready: 'bg-purple-100 text-purple-800 border-purple-300',
      out_for_delivery: 'bg-orange-100 text-orange-800 border-orange-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status] || 'bg-blue-100 text-blue-800 border-blue-300';
  };

  const getNextStatus = (currentStatus) => {
    if (currentStatus === 'ready') return 'out_for_delivery';
    if (currentStatus === 'out_for_delivery') return 'delivered';
    return null;
  };

  const getNextStatusLabel = (currentStatus) => {
    if (currentStatus === 'ready') return 'Pick Up';
    if (currentStatus === 'out_for_delivery') return 'Delivered';
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Active Orders</h1>
          <p className="text-gray-600 text-sm mt-1">You have {activeOrders.length} active order(s)</p>
        </div>

        {activeOrders.length > 0 ? (
          <div className="space-y-4">
            {activeOrders.map((order) => {
              const nextStatus = getNextStatus(order.status);
              const nextStatusLabel = getNextStatusLabel(order.status);

              return (
                <div key={order._id || order.id} className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm hover:shadow-md transition">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 pb-6 border-b border-gray-200 gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">#{order.orderNumber}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          <FiClock className="w-4 h-4 inline mr-1" />
                          Assigned {new Date(order.assignedAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    {/* Order Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Pickup Location */}
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-orange-100">
                            <FiMapPin className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Pickup Location</p>
                          <p className="text-sm font-semibold text-gray-900 mt-1">{order.restaurantName}</p>
                          <p className="text-xs text-gray-600 mt-1">{order.restaurantAddress}</p>
                        </div>
                      </div>

                      {/* Delivery Location */}
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-100">
                            <FiNavigation className="h-5 w-5 text-emerald-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Delivery To</p>
                          <p className="text-sm font-semibold text-gray-900 mt-1">{order.customerName}</p>
                          <p className="text-xs text-gray-600 mt-1">{order.customerAddress}</p>
                        </div>
                      </div>

                      {/* Items Count */}
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-100">
                            <FiPackage className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Items</p>
                          <p className="text-lg font-bold text-gray-900 mt-1">{order.itemsCount} items</p>
                        </div>
                      </div>

                      {/* Total Amount */}
                      <div className="flex gap-3">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-purple-100">
                            <FiCheck className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">Order Total</p>
                          <p className="text-lg font-bold text-gray-900 mt-1">₹{order.total?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-t border-gray-200 pt-6">
                      {/* Customer Contact */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Customer Contact</p>
                        <a
                          href={`tel:${order.customerPhone}`}
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          <FiPhone className="w-4 h-4" />
                          {order.customerPhone}
                        </a>
                      </div>

                      {/* Restaurant Contact */}
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Restaurant Contact</p>
                        <a
                          href={`tel:${order.restaurantPhone}`}
                          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          <FiPhone className="w-4 h-4" />
                          {order.restaurantPhone}
                        </a>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm">
                        <FiNavigation className="w-4 h-4" />
                        Open Maps
                      </button>
                      {nextStatus && (
                        <button
                          onClick={() => handleStatusUpdate(order._id || order.id, nextStatus)}
                          disabled={updatingOrder === (order._id || order.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg hover:shadow-lg transition font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updatingOrder === (order._id || order.id) ? (
                            <FiLoader className="w-4 h-4 animate-spin" />
                          ) : (
                            <FiCheck className="w-4 h-4" />
                          )}
                          {nextStatusLabel}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-12 text-center">
            <FiAlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Orders</h3>
            <p className="text-gray-600">You don't have any active orders at the moment. Go online and wait for new orders!</p>
          </div>
        )}
      </div>
    </div>
  );
}
