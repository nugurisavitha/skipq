import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FiBarChart2, FiPieChart, FiTrendingUp, FiChevronDown, FiLoader, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminAPI } from '../../services/api';

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [data, setData] = useState({
    summary: {
      totalRevenue: 0,
      averagePerDay: 0,
      growthPercent: 0,
    },
    revenueChart: [],
    ordersByStatus: [],
    ordersByType: [],
    topCuisines: [],
    peakHours: [],
  });

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAnalytics({ days: dateRange });
      setData(response.data?.data || response.data || {});
      toast.success('Analytics loaded successfully');
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">Platform performance metrics</p>
          </div>
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-10"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-6 hover:shadow-md transition">
            <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
            <p className="text-3xl font-bold text-primary mt-2">₹{(data.summary?.totalRevenue || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-6 hover:shadow-md transition">
            <p className="text-gray-600 text-sm font-medium">Avg Per Day</p>
            <p className="text-3xl font-bold text-primary mt-2">₹{(data.summary?.averagePerDay || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-6 hover:shadow-md transition">
            <p className="text-gray-600 text-sm font-medium">Growth</p>
            <p className="text-3xl font-bold text-primary mt-2">{(data.summary?.growthPercent || 0).toFixed(1)}%</p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Over Time */}
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiTrendingUp className="w-5 h-5 text-primary" />
              Revenue Over Time
            </h2>
            {data.revenueChart && data.revenueChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.revenueChart}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F2A93E" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#F2A93E" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip formatter={(value) => `₹${value}`} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#F2A93E" fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-gray-500">
                <p>No data available</p>
              </div>
            )}
          </div>

          {/* Orders by Status */}
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiPieChart className="w-5 h-5 text-primary" />
              Orders by Status
            </h2>
            {data.ordersByStatus && data.ordersByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.ordersByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-gray-500">
                <p>No data available</p>
              </div>
            )}
          </div>

          {/* Orders by Type */}
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiBarChart2 className="w-5 h-5 text-primary" />
              Orders by Type
            </h2>
            {data.ordersByType && data.ordersByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.ordersByType}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="type" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-gray-500">
                <p>No data available</p>
              </div>
            )}
          </div>

          {/* Top Cuisines */}
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Top Cuisines</h2>
            {data.topCuisines && data.topCuisines.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.topCuisines} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" stroke="#9ca3af" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#9ca3af" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-72 flex items-center justify-center text-gray-500">
                <p>No data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Peak Order Hours */}
        <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Peak Order Hours</h2>
          {data.peakHours && data.peakHours.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Bar dataKey="orders" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-72 flex items-center justify-center text-gray-500">
              <p>No data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
