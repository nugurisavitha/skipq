import React, { useState, useEffect } from 'react';
import { FiEye, FiSearch, FiChevronDown, FiChevronLeft, FiChevronRight, FiLoader, FiAlertCircle, FiDownload, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { ordersAPI, deliveryAPI } from '../../services/api';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [deliveryPersons, setDeliveryPersons] = useState([]);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [selectedOrderForAssignment, setSelectedOrderForAssignment] = useState(null);
  const [selectedDeliveryPerson, setSelectedDeliveryPerson] = useState('');

  const ordersPerPage = 10;
  const STATUS_OPTIONS = ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'];
  const TYPE_OPTIONS = ['delivery', 'takeaway', 'dine_in'];

  useEffect(() => {
    fetchOrders();
    fetchDeliveryPersons();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await ordersAPI.getAll({});
      const allOrders = response.data?.data?.orders || response.data?.data || [];
      setOrders(Array.isArray(allOrders) ? allOrders : []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeliveryPersons = async () => {
    try {
      const response = await deliveryAPI.getAssigned({});
      const persons = response.data?.data?.deliveryPersons || response.data?.data || [];
      setDeliveryPersons(Array.isArray(persons) ? persons : []);
    } catch (error) {
      console.error('Error fetching delivery persons:', error);
    }
  };

  const handleAssignDelivery = async () => {
    if (!selectedOrderForAssignment || !selectedDeliveryPerson) {
      toast.error('Please select a delivery person');
      return;
    }

    try {
      await ordersAPI.assignDelivery(selectedOrderForAssignment, selectedDeliveryPerson);
      toast.success('Delivery assigned successfully');
      setSelectedOrderForAssignment(null);
      setSelectedDeliveryPerson('');
      fetchOrders();
    } catch (error) {
      console.error('Error assigning delivery:', error);
      toast.error('Failed to assign delivery');
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      placed: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-indigo-100 text-indigo-800',
      preparing: 'bg-yellow-100 text-yellow-800',
      ready: 'bg-purple-100 text-purple-800',
      out_for_delivery: 'bg-orange-100 text-orange-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getTypeColor = (type) => {
    const colors = {
      delivery: 'bg-green-50 text-green-700',
      takeaway: 'bg-blue-50 text-blue-700',
      dine_in: 'bg-purple-50 text-purple-700',
    };
    return colors[type] || 'bg-gray-50 text-gray-700';
  };

  const handleExportCSV = () => {
    try {
      const dataToExport = filteredOrders.length > 0 ? filteredOrders : orders;
      if (dataToExport.length === 0) {
        toast.error('No orders to export');
        return;
      }

      const headers = ['Order #', 'Customer', 'Restaurant', 'Items', 'Total (\u20b9)', 'Status', 'Type', 'Payment Status', 'Date'];
      const rows = dataToExport.map((order) => [
        order.orderNumber || '',
        order.customer?.name || 'N/A',
        order.restaurant?.name || 'N/A',
        order.items?.length || 0,
        order.total || 0,
        order.status?.replace('_', ' ') || '',
        order.orderType?.replace('_', ' ') || '',
        order.paymentStatus || 'N/A',
        order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '',
      ]);

      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `orders_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${dataToExport.length} orders`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export orders');
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = !searchTerm || order.orderNumber?.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesType = typeFilter === 'all' || order.orderType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ordersPerPage,
    currentPage * ordersPerPage
  );
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-4 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="w-8 h-8 animate-spin text-primary" />
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
            <p className="text-gray-600 text-sm mt-1">Total orders: {orders.length}</p>
          </div>
          <button onClick={handleExportCSV} className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition">
            <FiDownload className="w-5 h-5" />
            <span>Export</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by order number..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-10"
              >
                <option value="all">All Status</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-10"
              >
                <option value="all">All Types</option>
                {TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
                  </option>
                ))}
              </select>
              <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>

            <div className="relative">
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary appearance-none pr-10"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
                setDateRange('all');
                setCurrentPage(1);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {paginatedOrders.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Order #</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Customer</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Restaurant</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Items</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Total</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Type</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map((order) => (
                      <React.Fragment key={order._id}>
                        <tr className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-900 font-medium">
                            #{order.orderNumber}
                            {order.tokenNumber && (
                              <span className="ml-2 text-xs font-bold text-primary">T#{order.tokenNumber}</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-sm">{order.customer?.name || 'N/A'}</td>
                          <td className="py-3 px-4 text-gray-600 text-sm">{order.restaurant?.name || 'N/A'}</td>
                          <td className="py-3 px-4 text-gray-900 text-sm font-semibold">{order.items?.length || 0}</td>
                          <td className="py-3 px-4 text-gray-900 font-semibold">â¹{order.total?.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(order.status)}`}>
                              {order.status?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(order.orderType)}`}>
                              {order.orderType?.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600 text-sm">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                              className="text-blue-600 hover:text-blue-800 transition p-1"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                        {expandedOrder === order._id && (
                          <tr className="border-b border-gray-100 bg-gray-50">
                            <td colSpan="9" className="py-4 px-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-3">Order Details</h4>
                                  <div className="space-y-2 text-sm">
                                    <p><span className="text-gray-600">Payment Status:</span> <span className="font-medium">{order.paymentStatus || 'N/A'}</span></p>
                                    <p><span className="text-gray-600">Address:</span> <span className="font-medium">{order.deliveryAddress?.address || 'N/A'}</span></p>
                                    <p><span className="text-gray-600">Special Instructions:</span> <span className="font-medium">{order.specialInstructions || 'None'}</span></p>
                                  </div>
                                </div>
                                {order.status === 'ready' && order.orderType === 'delivery' && (
                                  <div>
                                    <h4 className="font-semibold text-gray-900 mb-3">Assign Delivery</h4>
                                    <div className="flex gap-2">
                                      <select
                                        value={selectedDeliveryPerson}
                                        onChange={(e) => setSelectedDeliveryPerson(e.target.value)}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                      >
                                        <option value="">Select delivery person...</option>
                                        {deliveryPersons.map((person) => (
                                          <option key={person._id} value={person._id}>
                                            {person.name}
                                          </option>
                                        ))}
                                      </select>
                                      <button
                                        onClick={() => {
                                          setSelectedOrderForAssignment(order._id);
                                          handleAssignDelivery();
                                        }}
                                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition font-medium text-sm"
                                      >
                                        Assign
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600">
                    Showing {(currentPage - 1) * ordersPerPage + 1} to {Math.min(currentPage * ordersPerPage, filteredOrders.length)} of {filteredOrders.length}
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
                <FiAlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>No orders found matching your filters</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
