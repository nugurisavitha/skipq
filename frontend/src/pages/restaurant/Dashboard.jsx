import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  FiShoppingBag,
  FiTrendingUp,
  FiClock,
  FiStar,
  FiArrowRight,
  FiRefreshCw,
  FiPackage,
  FiMaximize,
} from 'react-icons/fi';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import { ordersAPI, restaurantsAPI } from '../../services/api';

const STATUS_COLORS = {
  placed: '#3b82f6',
  confirmed: '#8b5cf6',
  preparing: '#f59e0b',
  ready: '#10b981',
  out_for_delivery: '#06b6d4',
  delivered: '#10b981',
  cancelled: '#ef4444',
  completed: { bg: '#bbf7d0', text: '#166534', label: 'Completed' },
};

const DEFAULT_STATUS_COLOR = { bg: '#f3f4f6', text: '#374151', label: 'Unknown' };

export default function RestaurantDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);
  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    averageRating: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch restaurant data
      const restaurantRes = await restaurantsAPI.getMine();
      const restaurantData = restaurantRes.data?.data?.restaurant || restaurantRes.data?.data || restaurantRes.data;
      setRestaurant(restaurantData);

      // Fetch orders
      const ordersRes = await ordersAPI.getAll({ limit: 100 });
      const allOrders = ordersRes.data?.data?.orders || ordersRes.data?.data || [];

      // Calculate today's stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayOrders = allOrders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime() && o.status !== 'cancelled';
      });

      const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const pendingOrders = allOrders.filter((o) =>
        ['placed', 'confirmed', 'preparing', 'ready'].includes(o.status)
      );

      setStats({
        todayOrders: todayOrders.length,
        todayRevenue,
        pendingOrders: pendingOrders.length,
        averageRating: (restaurantData?.rating || 0).toFixed(1),
      });

      setRecentOrders(todayOrders.slice(0, 10));

      // Generate chart data (last 7 days)
      const chartDataArray = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const dayOrders = allOrders.filter((o) => {
          const orderDate = new Date(o.createdAt);
          orderDate.setHours(0, 0, 0, 0);
          return orderDate.getTime() === date.getTime() && o.status !== 'cancelled';
        });

        const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);

        chartDataArray.push({
          date: format(date, 'MMM dd'),
          orders: dayOrders.length,
          revenue: dayRevenue,
        });
      }
      setChartData(chartDataArray);

      // Status distribution
      const statusCounts = {};
      allOrders.forEach((o) => {
        statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
      });

      const statusData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
        value: count,
        status,
      }));
      setStatusDistribution(statusData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Socket listener for new orders
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (newOrder) => {
      toast.success(`New order #${newOrder.orderNumber} received!`, {
        duration: 5,
      });
      fetchDashboardData();
    };

    socket.on('new_order', handleNewOrder);
    return () => socket.off('new_order', handleNewOrder);
  }, [socket, fetchDashboardData]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FiRefreshCw className="w-8 h-8 animate-spin" style={{ color: '#F2A93E' }} />
          <p className="text-gray-600 font-poppins">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Card */}
        <div
          className="relative overflow-hidden rounded-[15px] border border-dashed border-gray-200 p-8 md:p-12 text-white shadow-sm"
          style={{
            background: 'linear-gradient(135deg, #F2A93E 0%, #F07054 100%)',
          }}
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.3)' }} />
          <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full opacity-20" style={{ background: 'rgba(255,255,255,0.3)' }} />

          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-bold font-poppins">
              Welcome, {user?.name || 'Chef'}!
            </h1>
            <p className="text-white/80 mt-2 text-lg font-poppins">
              {restaurant?.name || 'Your Restaurant'}
            </p>
          </div>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Today's Orders */}
          <div className="bg-white rounded-[15px] border border-dashed border-gray-200 p-6 shadow-sm hover:shadow-md hover:translate-y-[-5px] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <FiShoppingBag className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-poppins">Today's Orders</p>
            <p className="text-3xl font-bold text-gray-900 mt-2 font-poppins">{stats.todayOrders}</p>
            <p className="text-xs text-gray-500 mt-1 font-poppins">Last 24 hours</p>
          </div>

          {/* Today's Revenue */}
          <div className="bg-white rounded-[15px] border border-dashed border-gray-200 p-6 shadow-sm hover:shadow-md hover:translate-y-[-5px] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                <FiTrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-poppins">Today's Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-2 font-poppins">
              ₹{stats.todayRevenue.toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-poppins">Total earnings</p>
          </div>

          {/* Pending Orders */}
          <div className="bg-white rounded-[15px] border border-dashed border-gray-200 p-6 shadow-sm hover:shadow-md hover:translate-y-[-5px] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
                <FiClock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-poppins">Pending Orders</p>
            <p className="text-3xl font-bold text-gray-900 mt-2 font-poppins">{stats.pendingOrders}</p>
            <p className="text-xs text-gray-500 mt-1 font-poppins">Awaiting action</p>
          </div>

          {/* Average Rating */}
          <div className="bg-white rounded-[15px] border border-dashed border-gray-200 p-6 shadow-sm hover:shadow-md hover:translate-y-[-5px] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                <FiStar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-poppins">Average Rating</p>
            <div className="flex items-baseline gap-2 mt-2">
              <p className="text-3xl font-bold text-gray-900 font-poppins">{stats.averageRating}</p>
              <span className="text-yellow-500 text-xl">★</span>
            </div>
            <p className="text-xs text-gray-500 mt-1 font-poppins">Customer rating</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* View Orders */}
          <button
            onClick={() => navigate('/restaurant-admin/orders')}
            className="bg-white rounded-[15px] border border-dashed border-gray-200 p-6 shadow-sm hover:shadow-md hover:translate-y-[-5px] transition-all duration-300 text-left group"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
                  <FiPackage className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 font-poppins">View Orders</h3>
                <p className="text-sm text-gray-600 mt-1 font-poppins">Manage all orders</p>
              </div>
              <FiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors mt-1" />
            </div>
          </button>

          {/* Manage Menu */}
          <button
            onClick={() => navigate('/restaurant-admin/menu')}
            className="bg-white rounded-[15px] border border-dashed border-gray-200 p-6 shadow-sm hover:shadow-md hover:translate-y-[-5px] transition-all duration-300 text-left group"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-100 transition-colors">
                  <FiShoppingBag className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 font-poppins">Manage Menu</h3>
                <p className="text-sm text-gray-600 mt-1 font-poppins">Edit menu items</p>
              </div>
              <FiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors mt-1" />
            </div>
          </button>

          {/* QR Codes */}
          <button
            onClick={() => navigate('/restaurant-admin/qr-codes')}
            className="bg-white rounded-[15px] border border-dashed border-gray-200 p-6 shadow-sm hover:shadow-md hover:translate-y-[-5px] transition-all duration-300 text-left group"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                  <FiMaximize className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900 font-poppins">QR Codes</h3>
                <p className="text-sm text-gray-600 mt-1 font-poppins">Generate QR codes</p>
              </div>
              <FiArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors mt-1" />
            </div>
          </button>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Orders Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-[15px] border border-dashed border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 font-poppins">Orders (Last 7 Days)</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="orders" fill="#F2A93E" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-gray-500">
                <p>No orders data available</p>
              </div>
            )}
          </div>

          {/* Status Distribution Donut Chart */}
          <div className="bg-white rounded-[15px] border border-dashed border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 font-poppins">Status Distribution</h2>
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || DEFAULT_STATUS_COLOR.bg} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} orders`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-gray-500">
                <p>No order data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-[15px] border border-dashed border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6 font-poppins">Recent Orders</h2>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dashed border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm font-poppins">Order #</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm font-poppins">Customer</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm font-poppins">Items</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm font-poppins">Total</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm font-poppins">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm font-poppins">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order, idx) => (
                    <tr
                      key={order._id}
                      className={`border-b border-dashed border-gray-200 hover:bg-gray-50 transition-colors ${
                        idx % 2 === 0 ? 'bg-gray-50/50' : ''
                      }`}
                    >
                      <td className="py-4 px-4 font-medium text-sm" style={{ color: '#F2A93E' }}>
                        #{order.orderNumber}
                      </td>
                      <td className="py-4 px-4 text-gray-900 text-sm">{order.customer?.name || 'Customer'}</td>
                      <td className="py-4 px-4 text-gray-600 text-sm">
                        <div className="max-w-xs truncate">
                          {order.items?.slice(0, 2).map((item) => item.name).join(', ')}
                          {order.items?.length > 2 && ` +${order.items.length - 2}`}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-900 font-semibold text-sm">
                        ₹{(order.total || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                          style={{ backgroundColor: STATUS_COLORS[order.status] || DEFAULT_STATUS_COLOR.bg }}
                        >
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600 text-sm">
                        {order.createdAt ? formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No orders today</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
