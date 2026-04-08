import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
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
  FiUsers,
  FiShoppingBag,
  FiPackage,
  FiDollarSign,
  FiLoader,
  FiAlertCircle,
  FiTrendingUp,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { adminAPI, ordersAPI, restaurantsAPI } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';

const STATUS_COLORS = {
  placed: '#3b82f6',
  confirmed: '#8b5cf6',
  preparing: '#f59e0b',
  ready: '#10b981',
  delivered: '#10b981',
  cancelled: '#ef4444',
  completed: { bg: '#bbf7d0', text: '#166534', label: 'Completed' },
};

const DEFAULT_STATUS_COLOR = { bg: '#f3f4f6', text: '#374151', label: 'Unknown' };

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    stats: {
      totalUsers: 0,
      totalRestaurants: 0,
      totalOrders: 0,
      totalRevenue: 0,
    },
    revenueData: [],
    ordersByStatus: [],
    topRestaurants: [],
    recentOrders: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch admin dashboard data
      const dashResponse = await adminAPI.getDashboard();
      const dashData = dashResponse.data?.data || dashResponse.data;

      // Map stats
      const stats = dashData.stats || {};
      const revenueByMonth = dashData.revenueByMonth || [];
      const ordersByStatus = dashData.ordersByStatus || [];

      // Map top restaurants
      const topRestaurants = ((dashData.topRestaurants || []).slice(0, 5)).map((r) => ({
        name: r.restaurantDetails?.[0]?.name || 'Unknown',
        ownerName: r.restaurantDetails?.[0]?.owner?.name || '-',
        totalOrders: r.orders || 0,
        revenue: r.revenue || 0,
        rating: r.restaurantDetails?.[0]?.rating || 0,
      }));

      // Generate revenue chart data (last 7 days) from actual backend data
      let revenueData = [];
      if (revenueByMonth && revenueByMonth.length > 0) {
        revenueData = revenueByMonth.map((item) => ({
          date: item.date || item._id || 'N/A',
          revenue: item.revenue || item.total || 0,
        }));
      } else {
        // Fallback: show last 7 days with zero revenue if no data
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = format(date, 'MMM dd');
          revenueData.push({
            date: dateStr,
            revenue: 0,
          });
        }
      }

      // Map orders by status - handle both array and object formats from backend
      let statusChartData = [];
      if (Array.isArray(ordersByStatus)) {
        statusChartData = ordersByStatus.map((item) => ({
          name: (item._id || item.status || 'unknown').charAt(0).toUpperCase() + (item._id || item.status || 'unknown').slice(1).replace('_', ' '),
          value: item.count || item.value || 0,
          status: item._id || item.status || 'unknown',
        }));
      } else if (typeof ordersByStatus === 'object') {
        statusChartData = Object.entries(ordersByStatus).map(([status, count]) => ({
          name: status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '),
          value: count,
          status,
        }));
      }

      // Fetch recent orders
      const ordersResponse = await ordersAPI.getAll({ limit: 10 });
      const recentOrders = (ordersResponse.data?.data?.orders || ordersResponse.data?.data || []).slice(0, 10);

      setData({
        stats: {
          totalUsers: stats.totalUsers || 0,
          totalRestaurants: stats.totalRestaurants || 0,
          totalOrders: stats.totalOrders || 0,
          totalRevenue: stats.totalRevenue || 0,
        },
        revenueData,
        ordersByStatus: statusChartData,
        topRestaurants,
        recentOrders,
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="w-8 h-8 animate-spin" style={{ color: '#F2A93E' }} />
          <p className="text-gray-600">Loading dashboard...</p>
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
              Welcome back, {user?.name || 'Admin'}!
            </h1>
            <p className="text-white/80 mt-2 text-lg font-poppins">
              {format(new Date(), 'EEEE, MMMM dd, yyyy')}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Users */}
          <div className="bg-white rounded-[15px] border border-dashed border-gray-200 p-6 shadow-sm hover:shadow-md hover:translate-y-[-5px] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <FiUsers className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-poppins">Total Users</p>
            <p className="text-3xl font-bold text-gray-900 mt-2 font-poppins">{data.stats.totalUsers.toLocaleString()}</p>
          </div>

          {/* Total Restaurants */}
          <div className="bg-white rounded-[15px] border border-dashed border-gray-200 p-6 shadow-sm hover:shadow-md hover:translate-y-[-5px] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                <FiShoppingBag className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-poppins">Total Restaurants</p>
            <p className="text-3xl font-bold text-gray-900 mt-2 font-poppins">{data.stats.totalRestaurants.toLocaleString()}</p>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-[15px] border border-dashed border-gray-200 p-6 shadow-sm hover:shadow-md hover:translate-y-[-5px] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
                <FiPackage className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-poppins">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900 mt-2 font-poppins">{data.stats.totalOrders.toLocaleString()}</p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-[15px] border border-dashed border-gray-200 p-6 shadow-sm hover:shadow-md hover:translate-y-[-5px] transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
                <FiDollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-gray-600 text-sm font-poppins">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-2 font-poppins">
              ₹{(data.stats.totalRevenue || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="bg-white rounded-[15px] border border-dashed border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 font-poppins">Revenue (Last 7 Days)</h2>
            {data.revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.revenueData}>
                  <defs>
                    <linearGradient id="colorRevenueAdmin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F2A93E" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#F2A93E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#F2A93E" fillOpacity={1} fill="url(#colorRevenueAdmin)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-gray-500">
                <p>No revenue data available</p>
              </div>
            )}
          </div>

          {/* Orders by Status */}
          <div className="bg-white rounded-[15px] border border-dashed border-gray-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 font-poppins">Orders by Status</h2>
            {data.ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.ordersByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.ordersByStatus.map((entry, index) => (
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

        {/* Top Restaurants Table */}
        <div className="bg-white rounded-[15px] border border-dashed border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6 font-poppins">Top Restaurants</h2>
          {data.topRestaurants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dashed border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm font-poppins">#</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm font-poppins">Restaurant</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm font-poppins">Owner</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm font-poppins">Orders</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm font-poppins">Revenue</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm font-poppins">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topRestaurants.map((restaurant, idx) => (
                    <tr
                      key={idx}
                      className={`border-b border-dashed border-gray-200 hover:bg-gray-50 transition-colors ${
                        idx % 2 === 0 ? 'bg-gray-50/50' : ''
                      }`}
                    >
                      <td className="py-4 px-4 text-gray-700 font-medium text-sm">{idx + 1}</td>
                      <td className="py-4 px-4 text-gray-900 font-medium text-sm">{restaurant.name}</td>
                      <td className="py-4 px-4 text-gray-600 text-sm">{restaurant.ownerName}</td>
                      <td className="py-4 px-4 text-gray-900 font-semibold text-sm">{restaurant.totalOrders}</td>
                      <td className="py-4 px-4 text-gray-900 text-sm">₹{restaurant.revenue.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-semibold text-gray-900">{restaurant.rating.toFixed(1)}</span>
                          <span className="text-yellow-500">★</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No restaurant data available</p>
            </div>
          )}
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-[15px] border border-dashed border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-6 font-poppins">Recent Orders</h2>
          {data.recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-dashed border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm font-poppins">Order #</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm font-poppins">Customer</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm font-poppins">Restaurant</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm font-poppins">Total</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm font-poppins">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm font-poppins">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((order, idx) => (
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
                      <td className="py-4 px-4 text-gray-600 text-sm">{order.restaurant?.name || '-'}</td>
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
                        {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>No recent orders</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
