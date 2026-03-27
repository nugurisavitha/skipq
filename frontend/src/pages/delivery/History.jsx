import React, { useState, useEffect } from 'react';
import { FiCalendar, FiDollarSign, FiStar, FiChevronDown, FiChevronLeft, FiChevronRight, FiLoader, FiAlertCircle, FiBarChart2 } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { deliveryAPI } from '../../services/api';

export default function DeliveryHistory() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [earningsData, setEarningsData] = useState([]);

  const deliveriesPerPage = 10;

  useEffect(() => {
    fetchDeliveryHistory();
  }, [dateFilter]);

  const fetchDeliveryHistory = async () => {
    try {
      setLoading(true);
      const response = await deliveryAPI.getHistory({
        period: dateFilter === 'all' ? 'all' : dateFilter,
      });
      const data = response.data?.data || response.data;
      setDeliveries(data.deliveries || []);
      setEarningsData(data.earningsBreakdown || []);
      toast.success('Delivery history loaded successfully');
    } catch (error) {
      console.error('Error fetching delivery history:', error);
      toast.error('Failed to load delivery history');
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (deliveries.length === 0) {
      return {
        totalDeliveries: 0,
        totalEarnings: 0,
        averageRating: 0,
      };
    }

    return {
      totalDeliveries: deliveries.length,
      totalEarnings: deliveries.reduce((sum, d) => sum + (d.earnings || 0), 0),
      averageRating: (deliveries.reduce((sum, d) => sum + (d.rating || 0), 0) / deliveries.length).toFixed(1),
    };
  };

  const paginatedDeliveries = deliveries.slice(
    (currentPage - 1) * deliveriesPerPage,
    currentPage * deliveriesPerPage
  );
  const totalPages = Math.ceil(deliveries.length / deliveriesPerPage);

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-600">Loading delivery history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Delivery History</h1>
            <p className="text-gray-600 text-sm mt-1">Total deliveries: {deliveries.length}</p>
          </div>
          <div className="relative">
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-10"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-6 hover:shadow-md transition">
            <p className="text-gray-600 text-sm font-medium">Total Deliveries</p>
            <p className="text-3xl font-bold text-primary mt-2">{stats.totalDeliveries}</p>
          </div>
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-6 hover:shadow-md transition">
            <p className="text-gray-600 text-sm font-medium">Total Earnings</p>
            <p className="text-3xl font-bold text-primary mt-2">₹{stats.totalEarnings.toLocaleString()}</p>
          </div>
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-6 hover:shadow-md transition">
            <p className="text-gray-600 text-sm font-medium">Average Rating</p>
            <div className="flex items-center gap-2 mt-2">
              <FiStar className="w-6 h-6 text-amber-400 fill-current" />
              <p className="text-3xl font-bold text-gray-900">{stats.averageRating}</p>
            </div>
          </div>
        </div>

        {/* Earnings Breakdown Chart */}
        {earningsData && earningsData.length > 0 && (
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiBarChart2 className="w-5 h-5 text-primary" />
              Earnings Breakdown
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} />
                <Tooltip formatter={(value) => `₹${value}`} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Bar dataKey="earnings" fill="#F2A93E" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Deliveries Table */}
        <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm overflow-hidden">
          {paginatedDeliveries.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-dashed border-orange-100 bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Order #</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Restaurant</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Total</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Earnings</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedDeliveries.map((delivery) => (
                      <tr key={delivery._id || delivery.id} className="border-b border-gray-100 hover:bg-orange-50">
                        <td className="py-3 px-4 text-gray-900 font-semibold">#{delivery.orderNumber}</td>
                        <td className="py-3 px-4 text-gray-600 text-sm">{delivery.restaurantName}</td>
                        <td className="py-3 px-4 text-gray-600 text-sm">{delivery.customerName}</td>
                        <td className="py-3 px-4 text-gray-900 font-semibold">₹{(delivery.total || 0).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-primary font-semibold">
                            <FiDollarSign className="w-4 h-4" />
                            ₹{(delivery.earnings || 0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 text-sm">
                          {new Date(delivery.deliveredAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1">
                            {delivery.rating ? (
                              <>
                                <FiStar className="w-4 h-4 text-amber-400 fill-current" />
                                <span className="text-gray-900 font-semibold">{delivery.rating.toFixed(1)}</span>
                              </>
                            ) : (
                              <span className="text-gray-500 text-sm">Not rated</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * deliveriesPerPage + 1} to {Math.min(currentPage * deliveriesPerPage, deliveries.length)} of {deliveries.length}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiChevronLeft className="w-4 h-4" />
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded text-sm font-medium transition ${
                            page === currentPage
                              ? 'bg-primary text-white'
                              : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <FiChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FiAlertCircle className="w-12 h-12 mx-auto mb-3 text-primary" />
                <p>No delivery history found for the selected period</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
