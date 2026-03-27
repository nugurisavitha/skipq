import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FiTrendingUp, FiMapPin, FiClock, FiDollarSign, FiToggleLeft, FiToggleRight, FiLoader, FiAlertCircle, FiNavigation, FiPhone, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { deliveryAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

export default function DeliveryDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [stats, setStats] = useState({
    todayDeliveries: 0,
    todayEarnings: 0,
    averageDeliveryTime: 0,
    rating: 0,
  });
  const [currentOrder, setCurrentOrder] = useState(null);
  const [earningsData, setEarningsData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const assignedResponse = await deliveryAPI.getAssigned({});
      const earningsResponse = await deliveryAPI.getEarnings({ days: 7 });

      const assigned = assignedResponse.data?.data || assignedResponse.data;
      const earnings = earningsResponse.data?.data || earningsResponse.data;

      setStats({
        todayDeliveries: assigned.todayCount || 0,
        todayEarnings: assigned.todayEarnings || 0,
        averageDeliveryTime: assigned.averageTime || 0,
        rating: assigned.rating || 0,
      });

      const activeOrder = assigned.orders?.find(o => o.status !== 'delivered' && o.status !== 'cancelled');
      setCurrentOrder(activeOrder || null);
      setEarningsData(earnings.chartData || []);

      toast.success('Dashboard loaded successfully');
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityToggle = async () => {
    try {
      await deliveryAPI.toggleAvailability(!isAvailable);
      setIsAvailable(!isAvailable);
      toast.success(`You are now ${!isAvailable ? 'online' : 'offline'}`);
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('Failed to update availability');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { icon: FiMapPin, label: "Today's Deliveries", value: stats.todayDeliveries, color: 'blue' },
    { icon: FiDollarSign, label: "Today's Earnings", value: `₹${stats.todayEarnings.toLocaleString()}`, color: 'orange' },
    { icon: FiClock, label: 'Avg Delivery Time', value: `${stats.averageDeliveryTime} min`, color: 'amber' },
    { icon: FiTrendingUp, label: 'Your Rating', value: `${stats.rating.toFixed(1)}/5`, color: 'yellow' },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-600',
      orange: 'bg-orange-50 text-primary',
      amber: 'bg-amber-50 text-amber-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      green: 'bg-green-50 text-green-600',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Availability Toggle */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Delivery Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">Welcome, {user?.name || 'Delivery Partner'}</p>
          </div>
          <div className="flex items-center gap-4 bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold text-gray-900">{isAvailable ? 'Online' : 'Offline'}</p>
            </div>
            <button
              onClick={handleAvailabilityToggle}
              className={`text-4xl transition ${isAvailable ? 'text-emerald-500' : 'text-gray-400'}`}
            >
              {isAvailable ? <FiToggleRight /> : <FiToggleLeft />}
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-6 hover:shadow-md transition">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${getColorClasses(stat.color)}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-gray-600 text-xs md:text-sm font-medium">{stat.label}</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Current Active Order */}
          <div className="lg:col-span-2 bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Current Active Order</h2>
            {currentOrder ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                  <div>
                    <p className="text-sm text-gray-600">Order #</p>
                    <p className="text-xl font-bold text-gray-900">#{currentOrder.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="text-lg font-bold text-orange-600">{currentOrder.status.replace('_', ' ')}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Restaurant</p>
                    <p className="text-gray-900 font-semibold">{currentOrder.restaurantName}</p>
                    <p className="text-sm text-gray-600 mt-1">{currentOrder.restaurantAddress}</p>
                    <button className="mt-2 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
                      <FiPhone className="w-4 h-4" />
                      Call Restaurant
                    </button>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Customer</p>
                    <p className="text-gray-900 font-semibold">{currentOrder.customerName}</p>
                    <p className="text-sm text-gray-600 mt-1">{currentOrder.customerAddress}</p>
                    <button className="mt-2 inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm font-medium">
                      <FiPhone className="w-4 h-4" />
                      Call Customer
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Items Count</p>
                      <p className="text-lg font-bold text-gray-900">{currentOrder.itemsCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-lg font-bold text-gray-900">₹{currentOrder.total?.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-primary-dark text-white px-4 py-2 rounded-lg hover:shadow-lg transition font-medium">
                    <FiNavigation className="w-5 h-5" />
                    Open Maps
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition font-medium">
                    <FiCheckCircle className="w-5 h-5" />
                    Update Status
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FiAlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No active orders at the moment</p>
                </div>
              </div>
            )}
          </div>

          {/* Map Placeholder */}
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Location Map</h2>
            <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <FiMapPin className="w-12 h-12 mx-auto text-primary mb-2" />
                <p className="text-gray-600">Map will display here</p>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Chart */}
        <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Earnings (Last 7 Days)</h2>
          {earningsData && earningsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip formatter={(value) => `₹${value}`} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Bar dataKey="earnings" fill="#F2A93E" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-500">
              <p>No earnings data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
