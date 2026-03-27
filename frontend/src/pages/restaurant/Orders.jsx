import React, { useEffect, useState, useCallback } from 'react';
import {
  FiFilter,
  FiSearch,
  FiLoader,
  FiAlertCircle,
  FiCheck,
  FiX,
  FiChevronDown,
  FiTruck,
  FiShoppingBag,
  FiClock,
  FiGrid,
  FiBell,
} from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { ordersAPI, restaurantsAPI, foodCourtsAPI } from '../../services/api';

const STATUS_COLORS = {
  placed: { bg: '#dbeafe', text: '#0369a1', label: 'New' },
  confirmed: { bg: '#e9d5ff', text: '#6b21a8', label: 'Confirmed' },
  preparing: { bg: '#fef08a', text: '#854d0e', label: 'Preparing' },
  ready: { bg: '#d1fae5', text: '#065f46', label: 'Ready' },
  out_for_delivery: { bg: '#cffafe', text: '#0e7490', label: 'Out for Delivery' },
  delivered: { bg: '#d1fae5', text: '#065f46', label: 'Delivered' },
  completed: { bg: '#bbf7d0', text: '#166534', label: 'Completed' },
  cancelled: { bg: '#fee2e2', text: '#991b1b', label: 'Cancelled' },
};

const DEFAULT_STATUS_COLOR = { bg: '#f3f4f6', text: '#374151', label: 'Unknown' };

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'placed', label: 'New' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'ready', label: 'Ready' },
  { id: 'out_for_delivery', label: 'Out for Delivery' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
];

export default function Orders() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [foodCourtOrders, setFoodCourtOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('regular'); // 'regular' or 'food_court'
  const [restaurantId, setRestaurantId] = useState(null);
  const [estimatedTimes, setEstimatedTimes] = useState({}); // { [orderId]: minutes }

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch restaurant info to get restaurantId for food court orders
      let myRestaurantId = restaurantId;
      if (!myRestaurantId) {
        try {
          const restaurantRes = await restaurantsAPI.getMine();
          const restaurant = restaurantRes.data?.data?.restaurant || restaurantRes.data?.data;
          myRestaurantId = restaurant?._id || restaurant?.id;
          setRestaurantId(myRestaurantId);
        } catch (e) {
          console.warn('Could not fetch restaurant info:', e);
        }
      }

      // Fetch regular orders
      const response = await ordersAPI.getAll({ limit: 100 });
      console.log('Orders API response:', response.data);
      const allOrders = response.data?.data?.orders || response.data?.data || [];
      setOrders(Array.isArray(allOrders) ? allOrders : []);

      // Fetch food court orders for this restaurant
      if (myRestaurantId) {
        try {
          const fcResponse = await foodCourtsAPI.getRestaurantOrders(myRestaurantId, { limit: 100 });
          const fcOrders = fcResponse.data?.data?.orders || fcResponse.data?.data || [];
          setFoodCourtOrders(Array.isArray(fcOrders) ? fcOrders : []);
        } catch (e) {
          console.warn('Could not fetch food court orders:', e);
          setFoodCourtOrders([]);
        }
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      const message = err.response?.data?.message || err.message || 'Failed to load orders';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter orders based on view mode
  useEffect(() => {
    const sourceOrders = viewMode === 'food_court' ? foodCourtOrders : orders;
    let filtered = sourceOrders;

    if (viewMode === 'food_court') {
      // For food court orders, filter by the restaurant's status within the order
      if (selectedTab !== 'all') {
        filtered = filtered.filter((order) => {
          const myStatus = order.restaurantStatuses?.find(
            (rs) => rs.restaurantId === restaurantId || rs.restaurantId?._id === restaurantId
          );
          return myStatus?.status === selectedTab;
        });
      }
    } else {
      if (selectedTab !== 'all') {
        filtered = filtered.filter((order) => order.status === selectedTab);
      }
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter((order) =>
        order.orderNumber?.toString().includes(searchQuery) ||
        order.tokenNumber?.toString().includes(searchQuery) ||
        order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredOrders(filtered);
  }, [orders, foodCourtOrders, selectedTab, searchQuery, viewMode, restaurantId]);

  // Socket listener for new orders
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (newOrder) => {
      if (newOrder.foodCourt) {
        setFoodCourtOrders((prev) => [newOrder, ...prev]);
        toast.success(`New food court order #${newOrder.orderNumber} received!`, {
          duration: 5,
          icon: '🍽️',
        });
      } else {
        setOrders((prev) => [newOrder, ...prev]);
        toast.success(
          newOrder.tokenNumber
            ? `New order #${newOrder.orderNumber} (Token #${newOrder.tokenNumber}) received!`
            : `New order #${newOrder.orderNumber} received!`,
          { duration: 5, icon: '🔔' },
        );
      }
    };

    socket.on('new_order', handleNewOrder);
    return () => socket.off('new_order', handleNewOrder);
  }, [socket]);

  const getStatusActions = (order) => {
    switch (order.status) {
      case 'placed':
        return [
          { label: 'Accept', action: 'confirmed', color: 'bg-green-600' },
          { label: 'Reject', action: 'cancelled', color: 'bg-red-600' },
        ];
      case 'confirmed':
        return [{ label: 'Start Preparing', action: 'preparing', color: 'bg-blue-600' }];
      case 'preparing':
        return [{ label: 'Mark Ready', action: 'ready', color: 'bg-green-600' }];
      case 'ready':
        if (order.orderType === 'delivery') {
          return [{ label: 'Out for Delivery', action: 'out_for_delivery', color: 'bg-blue-600' }];
        }
        return [{ label: 'Complete', action: 'delivered', color: 'bg-green-600' }];
      case 'out_for_delivery':
        return [{ label: 'Delivered', action: 'delivered', color: 'bg-green-600' }];
      default:
        return [];
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setActionLoading((prev) => ({ ...prev, [orderId]: true }));
      const estTime = estimatedTimes[orderId] || null;
      await ordersAPI.updateStatus(orderId, newStatus, estTime);
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId
            ? {
                ...order,
                status: newStatus,
                estimatedTime: estTime ? parseInt(estTime) : order.estimatedTime,
                ...(newStatus === 'ready' || newStatus === 'delivered' ? { estimatedTime: null } : {}),
              }
            : order
        )
      );
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    } finally {
      setActionLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  // Handle food court restaurant status update (mark items ready for pickup)
  const handleFoodCourtStatusUpdate = async (orderId, newStatus) => {
    try {
      setActionLoading((prev) => ({ ...prev, [`fc_${orderId}`]: true }));
      const estTime = estimatedTimes[orderId] || null;
      await foodCourtsAPI.updateRestaurantStatus(orderId, restaurantId, newStatus, estTime);
      // Update local state
      setFoodCourtOrders((prev) =>
        prev.map((order) => {
          if (order._id === orderId) {
            const updatedStatuses = order.restaurantStatuses?.map((rs) => {
              const rsId = rs.restaurantId?._id || rs.restaurantId;
              if (rsId === restaurantId) {
                return {
                  ...rs,
                  status: newStatus,
                  ...(estTime ? { estimatedTime: parseInt(estTime) } : {}),
                  ...(newStatus === 'ready' ? { readyAt: new Date().toISOString(), estimatedTime: undefined } : {}),
                };
              }
              return rs;
            });
            return { ...order, restaurantStatuses: updatedStatuses };
          }
          return order;
        })
      );
      const statusLabel = newStatus === 'ready' ? 'Ready for Pickup' : newStatus;
      toast.success(`Food court order updated: ${statusLabel}`);
    } catch (error) {
      console.error('Error updating food court order status:', error);
      toast.error('Failed to update food court order status');
    } finally {
      setActionLoading((prev) => ({ ...prev, [`fc_${orderId}`]: false }));
    }
  };

  // Get the restaurant's status within a food court order
  const getMyFoodCourtStatus = (order) => {
    const myStatus = order.restaurantStatuses?.find(
      (rs) => (rs.restaurantId?._id || rs.restaurantId) === restaurantId
    );
    return myStatus?.status || 'placed';
  };

  // Get actions for food court orders based on this restaurant's status
  const getFoodCourtActions = (order) => {
    const myStatus = getMyFoodCourtStatus(order);
    switch (myStatus) {
      case 'placed':
        return [{ label: 'Accept & Confirm', action: 'confirmed', color: 'bg-green-600' }];
      case 'confirmed':
        return [{ label: 'Start Preparing', action: 'preparing', color: 'bg-blue-600' }];
      case 'preparing':
        return [{ label: 'Mark Ready for Pickup', action: 'ready', color: 'bg-green-600' }];
      default:
        return [];
    }
  };

  const getOrderTypeIcon = (type) => {
    switch (type) {
      case 'delivery':
        return <FiTruck className="w-4 h-4" />;
      case 'takeaway':
        return <FiShoppingBag className="w-4 h-4" />;
      case 'dine_in':
        return <FiShoppingBag className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTabCounts = () => {
    if (viewMode === 'food_court') {
      const getStatus = (order) => getMyFoodCourtStatus(order);
      return {
        all: foodCourtOrders.length,
        placed: foodCourtOrders.filter((o) => getStatus(o) === 'placed').length,
        confirmed: foodCourtOrders.filter((o) => getStatus(o) === 'confirmed').length,
        preparing: foodCourtOrders.filter((o) => getStatus(o) === 'preparing').length,
        ready: foodCourtOrders.filter((o) => getStatus(o) === 'ready').length,
        delivered: foodCourtOrders.filter((o) => getStatus(o) === 'delivered').length,
        cancelled: foodCourtOrders.filter((o) => getStatus(o) === 'cancelled').length,
      };
    }
    return {
      all: orders.length,
      placed: orders.filter((o) => o.status === 'placed').length,
      confirmed: orders.filter((o) => o.status === 'confirmed').length,
      preparing: orders.filter((o) => o.status === 'preparing').length,
      ready: orders.filter((o) => o.status === 'ready').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };
  };
  const tabCounts = getTabCounts();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-orange-50 via-white to-orange-50/30 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">Orders</h1>
            <p className="text-gray-600 mt-2">Manage and track all orders in real-time</p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-white border-2 border-dashed border-orange-200 rounded-[12px] overflow-hidden shadow-sm">
            <button
              onClick={() => { setViewMode('regular'); setSelectedTab('all'); }}
              className={`px-5 py-2.5 font-medium text-sm flex items-center gap-2 transition-all ${
                viewMode === 'regular'
                  ? 'bg-gradient-to-r from-[#F2A93E] to-[#F07054] text-white'
                  : 'text-gray-600 hover:bg-orange-50'
              }`}
            >
              <FiShoppingBag className="w-4 h-4" /> Regular Orders
            </button>
            <button
              onClick={() => { setViewMode('food_court'); setSelectedTab('all'); }}
              className={`px-5 py-2.5 font-medium text-sm flex items-center gap-2 transition-all ${
                viewMode === 'food_court'
                  ? 'bg-gradient-to-r from-[#F2A93E] to-[#F07054] text-white'
                  : 'text-gray-600 hover:bg-orange-50'
              }`}
            >
              <FiGrid className="w-4 h-4" /> Food Court
              {foodCourtOrders.length > 0 && (
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                  viewMode === 'food_court' ? 'bg-white/30 text-white' : 'bg-orange-100 text-primary'
                }`}>
                  {foodCourtOrders.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-4 mb-6 shadow-sm">
          <div className="flex gap-4">
            <FiSearch className="w-5 h-5 text-primary flex-shrink-0 mt-2" />
            <input
              type="text"
              placeholder="Search by order number or customer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 outline-none text-gray-900 placeholder-gray-500 bg-transparent"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] mb-6 overflow-x-auto shadow-sm">
          <div className="flex border-b-2 border-dashed border-orange-200">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-6 py-4 font-medium transition-all whitespace-nowrap border-b-2 ${
                  selectedTab === tab.id
                    ? 'text-primary border-primary'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                {tab.label}
                {tabCounts[tab.id] > 0 && (
                  <span className={`ml-2 px-2 py-1 text-xs font-bold rounded-full ${
                    selectedTab === tab.id
                      ? 'bg-primary text-white'
                      : 'bg-orange-100 text-primary'
                  }`}>
                    {tabCounts[tab.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <FiAlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Error Loading Orders</h3>
                <p className="text-sm text-red-800 mt-1">{error}</p>
                <button
                  onClick={fetchOrders}
                  className="mt-2 text-sm text-red-700 underline hover:text-red-900"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-12 text-center">
            <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {orders.length === 0 ? 'No orders yet' : 'No orders match your search'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const isExpanded = expandedOrder === order._id;
              const isFoodCourt = viewMode === 'food_court';
              const myFcStatus = isFoodCourt ? getMyFoodCourtStatus(order) : null;
              const statusColor = STATUS_COLORS[isFoodCourt ? myFcStatus : order.status] || DEFAULT_STATUS_COLOR;
              const actions = isFoodCourt ? getFoodCourtActions(order) : getStatusActions(order);

              // For food court orders, only show items belonging to this restaurant
              const myItems = isFoodCourt
                ? order.items?.filter((item) => {
                    const itemRestId = item.restaurantId?._id || item.restaurantId;
                    return itemRestId === restaurantId;
                  })
                : order.items;

              return (
                <div key={order._id} className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] overflow-hidden hover:shadow-lg transition-all shadow-sm">
                  {/* Order Header */}
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedOrder(isExpanded ? null : order._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2 flex-wrap gap-y-2">
                          <h3 className="font-bold text-lg text-gray-900">Order #{order.orderNumber}</h3>
                          {order.tokenNumber && (
                            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-primary to-primary-dark text-white font-bold px-3 py-1 rounded-full text-xs">
                              🎫 Token #{order.tokenNumber}
                            </span>
                          )}
                          <span
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                          >
                            {statusColor.label}
                          </span>
                          {isFoodCourt && (
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 flex items-center gap-1">
                              <FiGrid className="w-3 h-3" /> Food Court
                            </span>
                          )}
                          <span className="flex items-center space-x-1 text-sm text-gray-600">
                            {getOrderTypeIcon(order.orderType)}
                            <span className="capitalize">{order.orderType?.replace('_', ' ')}</span>
                          </span>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-600">Customer</p>
                            <p className="text-sm font-medium text-gray-900">{order.customer?.name || order.customerName || 'Customer'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">{isFoodCourt ? 'Your Items' : 'Items'}</p>
                            <p className="text-sm font-medium text-gray-900">
                              {myItems?.length || 0} item{(myItems?.length || 0) !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600">Order Total</p>
                            <p className="text-sm font-medium text-gray-900">₹{(order.total || 0).toLocaleString('en-IN')}</p>
                          </div>
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-xs text-gray-600">Time</p>
                              <p className="text-sm font-medium text-gray-900">
                                {order.createdAt ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }) : 'N/A'}
                              </p>
                            </div>
                            <FiChevronDown
                              className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Details (Expanded) */}
                  {isExpanded && (
                    <div className="border-t-2 border-dashed border-orange-200 p-6 bg-orange-50/30">
                      {/* Food Court Info Banner */}
                      {isFoodCourt && (
                        <div className="mb-6 bg-purple-50 border-2 border-dashed border-purple-200 rounded-[12px] p-4 flex items-start gap-3">
                          <div className="p-2 bg-purple-100 rounded-full flex-shrink-0">
                            <FiBell className="text-purple-600 text-lg" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">Food Court Order — Counter Pickup</h4>
                            <p className="text-xs text-gray-600 mt-1">
                              This is a multi-restaurant food court order. Prepare only your items below.
                              When ready, click <span className="font-semibold text-green-600">"Mark Ready for Pickup"</span> to
                              notify the customer that your food is ready at your counter.
                            </p>
                            {order.restaurantStatuses && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {order.restaurantStatuses.map((rs, idx) => {
                                  const rsId = rs.restaurantId?._id || rs.restaurantId;
                                  const isMe = rsId === restaurantId;
                                  const rsStatusColor = STATUS_COLORS[rs.status] || DEFAULT_STATUS_COLOR;
                                  return (
                                    <span
                                      key={idx}
                                      className={`px-3 py-1 rounded-full text-xs font-medium ${isMe ? 'ring-2 ring-purple-400' : ''}`}
                                      style={{ backgroundColor: rsStatusColor.bg, color: rsStatusColor.text }}
                                    >
                                      {rs.restaurantName || 'Restaurant'}{isMe ? ' (You)' : ''}: {rsStatusColor.label}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Order Items (filtered to this restaurant for food court) */}
                      <div className="mb-6">
                        <h4 className="font-bold text-gray-900 mb-3">
                          {isFoodCourt ? 'Your Items to Prepare' : 'Items'}
                        </h4>
                        <div className="space-y-2">
                          {myItems?.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white border border-orange-100 p-3 rounded-[10px]">
                              <div>
                                <p className="font-medium text-gray-900">{item.name}</p>
                                {item.customizations && item.customizations.length > 0 && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {item.customizations.map((c) => c.selectedOption).join(', ')}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">x{item.quantity}</p>
                                <p className="text-sm text-gray-600">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Special Instructions */}
                      {order.specialInstructions && (
                        <div className="mb-6 bg-orange-50 border-l-4 border-primary p-4 rounded-[10px]">
                          <p className="text-xs text-gray-600 font-semibold mb-1">Special Instructions</p>
                          <p className="text-sm text-gray-900">{order.specialInstructions}</p>
                        </div>
                      )}

                      {/* Delivery Details (regular orders only) */}
                      {!isFoodCourt && order.orderType === 'delivery' && (
                        <div className="mb-6 grid md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-600 font-semibold mb-1">Delivery Address</p>
                            <p className="text-sm text-gray-900">
                              {typeof order.deliveryAddress === 'string'
                                ? order.deliveryAddress
                                : order.deliveryAddress?.address || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-600 font-semibold mb-1">Contact Number</p>
                            <p className="text-sm text-gray-900">{order.customer?.phone || order.customerPhone || 'N/A'}</p>
                          </div>
                        </div>
                      )}

                      {/* Dine-in Details (regular orders only) */}
                      {!isFoodCourt && order.orderType === 'dine_in' && order.tableNumber && (
                        <div className="mb-6">
                          <p className="text-xs text-gray-600 font-semibold mb-1">Table Number</p>
                          <p className="text-sm text-gray-900">Table {order.tableNumber}</p>
                        </div>
                      )}

                      {/* Food Court: Ready status confirmation */}
                      {isFoodCourt && myFcStatus === 'ready' && (
                        <div className="mb-6 bg-green-50 border-2 border-dashed border-green-200 rounded-[12px] p-4 flex items-center gap-3">
                          <FiCheck className="text-green-600 text-xl flex-shrink-0" />
                          <div>
                            <p className="font-bold text-green-800 text-sm">Your items are marked as Ready!</p>
                            <p className="text-xs text-green-700 mt-1">The customer has been notified to pick up from your counter.</p>
                          </div>
                        </div>
                      )}

                      {isFoodCourt && myFcStatus === 'picked_up' && (
                        <div className="mb-6 bg-blue-50 border-2 border-dashed border-blue-200 rounded-[12px] p-4 flex items-center gap-3">
                          <FiCheck className="text-blue-600 text-xl flex-shrink-0" />
                          <div>
                            <p className="font-bold text-blue-800 text-sm">Customer has picked up your items</p>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {actions.length > 0 && (
                        <div className="pt-4 border-t-2 border-dashed border-orange-200">
                          {/* Estimated Time Input — shows for all orders in actionable states */}
                          {(() => {
                            const showEstInput = isFoodCourt
                              ? (myFcStatus === 'placed' || myFcStatus === 'confirmed' || myFcStatus === 'preparing')
                              : (order.status === 'placed' || order.status === 'confirmed' || order.status === 'preparing');
                            return showEstInput ? (
                              <div className="mb-4 flex flex-wrap items-center gap-3 bg-white border border-orange-100 p-3 rounded-[10px]">
                                <FiClock className="w-5 h-5 text-primary flex-shrink-0" />
                                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Est. Prep Time:</label>
                                <div className="flex items-center gap-2 flex-wrap">
                                  {[5, 10, 15, 20, 30].map((mins) => (
                                    <button
                                      key={mins}
                                      type="button"
                                      onClick={() => setEstimatedTimes((prev) => ({ ...prev, [order._id]: mins }))}
                                      className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                                        estimatedTimes[order._id] === mins
                                          ? 'bg-primary text-white shadow-sm'
                                          : 'bg-orange-50 text-gray-600 hover:bg-orange-100'
                                      }`}
                                    >
                                      {mins}m
                                    </button>
                                  ))}
                                  <input
                                    type="number"
                                    min="1"
                                    max="120"
                                    placeholder="Custom"
                                    value={estimatedTimes[order._id] || ''}
                                    onChange={(e) => setEstimatedTimes((prev) => ({ ...prev, [order._id]: e.target.value ? parseInt(e.target.value) : '' }))}
                                    className="w-20 px-2 py-1.5 text-xs border border-orange-200 rounded-full text-center outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                  />
                                  <span className="text-xs text-gray-500">mins</span>
                                </div>
                              </div>
                            ) : null;
                          })()}

                          {/* Current estimated time display */}
                          {(() => {
                            if (isFoodCourt) {
                              const myRs = order.restaurantStatuses?.find(
                                (rs) => (rs.restaurantId?._id || rs.restaurantId) === restaurantId
                              );
                              return myRs?.estimatedTime ? (
                                <div className="mb-4 flex items-center gap-2 text-sm text-orange-700 bg-orange-50 px-3 py-2 rounded-full w-fit">
                                  <FiClock className="w-4 h-4" />
                                  <span>Customer sees: <strong>{myRs.estimatedTime} min</strong> estimated</span>
                                </div>
                              ) : null;
                            }
                            return order.estimatedTime ? (
                              <div className="mb-4 flex items-center gap-2 text-sm text-orange-700 bg-orange-50 px-3 py-2 rounded-full w-fit">
                                <FiClock className="w-4 h-4" />
                                <span>Customer sees: <strong>{order.estimatedTime} min</strong> estimated</span>
                              </div>
                            ) : null;
                          })()}

                          <div className="flex gap-3">
                            {actions.map((action) => {
                              const loadingKey = isFoodCourt ? `fc_${order._id}` : order._id;
                              return (
                                <button
                                  key={action.action}
                                  onClick={() =>
                                    isFoodCourt
                                      ? handleFoodCourtStatusUpdate(order._id, action.action)
                                      : handleStatusUpdate(order._id, action.action)
                                  }
                                  disabled={actionLoading[loadingKey]}
                                  className={`${action.color} hover:shadow-lg disabled:opacity-50 text-white font-medium py-2 px-4 rounded-[10px] transition-all flex items-center space-x-2`}
                                >
                                  {actionLoading[loadingKey] && <FiLoader className="w-4 h-4 animate-spin" />}
                                  <span>{action.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
