import React, { useEffect, useState, useCallback } from 'react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiLoader,
  FiAlertCircle,
  FiCheck,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { restaurantsAPI } from '../../services/api';

export default function Tables() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState(null);
  const [tables, setTables] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    tableNumber: '',
    seats: '4',
  });
  const [bulkAddConfig, setBulkAddConfig] = useState({
    count: 4,
    startNumber: 1,
  });
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  const fetchRestaurant = useCallback(async () => {
    try {
      setLoading(true);
      const response = await restaurantsAPI.getMine();
      const restaurantData = response.data?.data?.restaurant || response.data?.data || response.data;
      setRestaurant(restaurantData);
      setTables(restaurantData?.tables || []);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      toast.error('Failed to load tables');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  const resetForm = () => {
    setFormData({ tableNumber: '', seats: '4' });
    setEditingTable(null);
  };

  const openModal = (table = null) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        tableNumber: table.tableNumber,
        seats: table.seats.toString(),
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.tableNumber || !formData.seats) {
      toast.error('Table number and seats are required');
      return;
    }

    try {
      setSubmitLoading(true);

      const newTables = [...tables];

      if (editingTable) {
        const index = newTables.findIndex((t) => t._id === editingTable._id);
        if (index !== -1) {
          newTables[index] = {
            ...newTables[index],
            tableNumber: parseInt(formData.tableNumber),
            seats: parseInt(formData.seats),
          };
        }
      } else {
        const tableExists = newTables.some((t) => t.tableNumber === parseInt(formData.tableNumber));
        if (tableExists) {
          toast.error('Table number already exists');
          return;
        }
        newTables.push({
          tableNumber: parseInt(formData.tableNumber),
          seats: parseInt(formData.seats),
          isActive: true,
        });
      }

      const updatedRestaurant = { ...restaurant, tables: newTables };
      await restaurantsAPI.update(restaurant._id, updatedRestaurant);

      setTables(newTables);
      setRestaurant(updatedRestaurant);
      toast.success(editingTable ? 'Table updated successfully' : 'Table added successfully');
      closeModal();
    } catch (error) {
      console.error('Error saving table:', error);
      toast.error(error.response?.data?.message || 'Failed to save table');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleBulkAdd = async (e) => {
    e.preventDefault();

    try {
      setSubmitLoading(true);

      const newTables = [...tables];
      for (let i = 0; i < bulkAddConfig.count; i++) {
        const tableNumber = bulkAddConfig.startNumber + i;
        const tableExists = newTables.some((t) => t.tableNumber === tableNumber);
        if (!tableExists) {
          newTables.push({
            tableNumber,
            seats: 4,
            isActive: true,
          });
        }
      }

      const updatedRestaurant = { ...restaurant, tables: newTables };
      await restaurantsAPI.update(restaurant._id, updatedRestaurant);

      setTables(newTables);
      setRestaurant(updatedRestaurant);
      toast.success(`${bulkAddConfig.count} tables added successfully`);
      setShowBulkAdd(false);
      setBulkAddConfig({ count: 4, startNumber: 1 });
    } catch (error) {
      console.error('Error adding tables:', error);
      toast.error('Failed to add tables');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (tableId) => {
    try {
      const newTables = tables.filter((t) => t._id !== tableId);
      const updatedRestaurant = { ...restaurant, tables: newTables };
      await restaurantsAPI.update(restaurant._id, updatedRestaurant);

      setTables(newTables);
      setRestaurant(updatedRestaurant);
      setDeleteConfirm(null);
      toast.success('Table deleted');
    } catch (error) {
      console.error('Error deleting table:', error);
      toast.error('Failed to delete table');
    }
  };

  const handleToggleActive = async (tableId) => {
    try {
      const newTables = tables.map((t) =>
        t._id === tableId ? { ...t, isActive: !t.isActive } : t
      );
      const updatedRestaurant = { ...restaurant, tables: newTables };
      await restaurantsAPI.update(restaurant._id, updatedRestaurant);

      setTables(newTables);
      setRestaurant(updatedRestaurant);
      toast.success('Table status updated');
    } catch (error) {
      console.error('Error updating table:', error);
      toast.error('Failed to update table');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <FiLoader className="w-8 h-8 text-primary animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading tables...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-orange-50 via-white to-orange-50/30 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">Table Management</h1>
            <p className="text-gray-600 mt-2">{tables.length} table{tables.length !== 1 ? 's' : ''} configured</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openModal()}
              className="bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg text-white font-medium py-2 px-6 rounded-[15px] flex items-center space-x-2 transition-all"
            >
              <FiPlus className="w-5 h-5" />
              <span>Add Table</span>
            </button>
            <button
              onClick={() => setShowBulkAdd(!showBulkAdd)}
              className="bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg text-white font-medium py-2 px-6 rounded-[15px] flex items-center space-x-2 transition-all"
            >
              <FiPlus className="w-5 h-5" />
              <span>Bulk Add</span>
            </button>
          </div>
        </div>

        {/* Bulk Add Form */}
        {showBulkAdd && (
          <div className="bg-orange-50/50 border-2 border-dashed border-orange-200 rounded-[15px] p-6 mb-8 shadow-sm">
            <h3 className="font-bold text-primary mb-4">Add Multiple Tables</h3>
            <form onSubmit={handleBulkAdd} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Starting Table Number
                  </label>
                  <input
                    type="number"
                    value={bulkAddConfig.startNumber}
                    onChange={(e) => setBulkAddConfig((prev) => ({ ...prev, startNumber: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                    min="1"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Number of Tables
                  </label>
                  <input
                    type="number"
                    value={bulkAddConfig.count}
                    onChange={(e) => setBulkAddConfig((prev) => ({ ...prev, count: parseInt(e.target.value) }))}
                    className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                    min="1"
                    max="50"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowBulkAdd(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-2 px-4 rounded-[10px] transition-colors border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-[10px] transition-all flex items-center justify-center space-x-2"
                >
                  {submitLoading && <FiLoader className="w-5 h-5 animate-spin" />}
                  <span>Add {bulkAddConfig.count} Tables</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tables Grid */}
        {tables.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-12 text-center">
            <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-6">No tables configured yet</p>
            <button
              onClick={() => openModal()}
              className="bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg text-white font-medium py-2 px-6 rounded-[15px] transition-all inline-flex items-center space-x-2"
            >
              <FiPlus className="w-5 h-5" />
              <span>Add Your First Table</span>
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tables
              .sort((a, b) => a.tableNumber - b.tableNumber)
              .map((table) => (
                <div
                  key={table._id || `table-${table.tableNumber}`}
                  className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] overflow-hidden hover:shadow-lg transition-all shadow-sm"
                >
                  {/* Status Indicator */}
                  <div
                    className={`h-1 ${table.isActive ? 'bg-gradient-to-r from-primary to-primary-dark' : 'bg-gray-400'}`}
                  />

                  {/* Content */}
                  <div className="p-6">
                    {/* Table Info */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-2xl font-bold text-gray-900">Table {table.tableNumber}</h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            table.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {table.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-gray-600">Capacity: {table.seats} person{table.seats !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-4 border-t-2 border-dashed border-orange-200">
                      <button
                        onClick={() => handleToggleActive(table._id)}
                        className={`w-full py-2 px-4 rounded-[10px] font-medium transition-all ${
                          table.isActive
                            ? 'bg-orange-50 text-primary hover:bg-orange-100 border border-orange-100'
                            : 'bg-green-100 text-green-900 hover:bg-green-200'
                        }`}
                      >
                        {table.isActive ? 'Mark Inactive' : 'Mark Active'}
                      </button>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openModal(table)}
                          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-primary hover:bg-orange-50 border-2 border-dashed border-primary rounded-[10px] transition-all text-sm"
                        >
                          <FiEdit2 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(table._id)}
                          className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-100 border-2 border-dashed border-red-600 rounded-[10px] transition-all text-sm"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-xl max-w-sm w-full">
              {/* Modal Header */}
              <div className="border-b-2 border-dashed border-orange-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                  {editingTable ? 'Edit Table' : 'Add Table'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-orange-50 rounded-[10px] transition-colors"
                >
                  <FiX className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Modal Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Table Number
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 1"
                    value={formData.tableNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tableNumber: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-1">
                    Number of Seats
                  </label>
                  <input
                    type="number"
                    placeholder="e.g., 4"
                    value={formData.seats}
                    onChange={(e) => setFormData((prev) => ({ ...prev, seats: e.target.value }))}
                    className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                    min="1"
                    max="20"
                    required
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t-2 border-dashed border-orange-200">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-2 px-4 rounded-[10px] transition-colors border border-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="flex-1 bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-[10px] transition-all flex items-center justify-center space-x-2"
                  >
                    {submitLoading && <FiLoader className="w-5 h-5 animate-spin" />}
                    <span>{editingTable ? 'Update' : 'Add'} Table</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-xl p-6 max-w-sm w-full">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Table?</h3>
              <p className="text-gray-600 mb-6">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-2 px-4 rounded-[10px] transition-colors border border-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-[10px] transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
