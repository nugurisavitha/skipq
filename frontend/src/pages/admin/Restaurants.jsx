import React, { useState, useEffect } from 'react';
import {
  FiCheck,
  FiX,
  FiEye,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiChevronLeft,
  FiChevronRight,
  FiLoader,
  FiAlertCircle,
  FiStar,
  FiPackage,
  FiPlus,
  FiMapPin,
  FiPhone,
  FiMail,
  FiUser,
  FiSave,
  FiCopy,
  FiUpload,
  FiDownload,
  FiFileText,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminAPI, restaurantsAPI, menuAPI } from '../../services/api';
import LocationPickerButton from '../../components/common/LocationPickerButton';

const CUISINE_OPTIONS = [
  'Indian', 'Chinese', 'Continental', 'Italian', 'Mexican', 'Thai',
  'Japanese', 'North Indian', 'South Indian', 'Seafood', 'Fast Food',
  'Bakery', 'Desserts', 'Beverages', 'Other',
];

export default function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [expandedRestaurant, setExpandedRestaurant] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Create Restaurant state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [restaurantAdmins, setRestaurantAdmins] = useState([]);
  const [savingRestaurant, setSavingRestaurant] = useState(false);
  const [newRestaurant, setNewRestaurant] = useState({
    name: '',
    ownerId: '',
    address: '',
    phone: '',
    email: '',
    description: '',
    cuisine: [],
    preparationTime: 30,
    minimumOrder: 100,
    deliveryFee: 50,
    location: null,
  });

  // Clone Menu state
  const [showCloneSection, setShowCloneSection] = useState(false);
  const [cloneFromId, setCloneFromId] = useState('');
  const [cloneSearch, setCloneSearch] = useState('');
  const [cloneMenuCount, setCloneMenuCount] = useState(null);

  // Import Menu state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTargetId, setImportTargetId] = useState(null);
  const [importTargetName, setImportTargetName] = useState('');
  const [importPreview, setImportPreview] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importFileName, setImportFileName] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const tabs = ['all', 'pending', 'active', 'inactive'];

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getRestaurants({});
      setRestaurants(response.data?.data?.restaurants || response.data?.restaurants || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast.error('Failed to load restaurants');
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantAdmins = async () => {
    try {
      const response = await adminAPI.getUsers({ role: 'restaurant_admin', limit: 100 });
      const data = response.data?.data?.users || response.data?.data || [];
      setRestaurantAdmins(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load restaurant admins:', error);
    }
  };

  const handleApprove = async (restaurantId) => {
    try {
      await adminAPI.approveRestaurant(restaurantId);
      toast.success('Restaurant approved successfully');
      fetchRestaurants();
    } catch (error) {
      console.error('Error approving restaurant:', error);
      toast.error('Failed to approve restaurant');
    }
  };

  const handleReject = async () => {
    if (!selectedRestaurant) return;
    try {
      await adminAPI.rejectRestaurant(selectedRestaurant._id || selectedRestaurant.id);
      toast.success('Restaurant rejected successfully');
      setShowRejectModal(false);
      setSelectedRestaurant(null);
      setRejectReason('');
      fetchRestaurants();
    } catch (error) {
      console.error('Error rejecting restaurant:', error);
      toast.error('Failed to reject restaurant');
    }
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending_verification: 'bg-amber-100 text-amber-900 border border-amber-300',
      active: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
      inactive: 'bg-rose-100 text-rose-900 border border-rose-300',
      rejected: 'bg-gray-100 text-gray-800 border border-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border border-gray-300';
  };

  // ---- Create Restaurant handlers ----
  const handleOpenCreateModal = () => {
    fetchRestaurantAdmins();
    setShowCreateModal(true);
  };

  const resetCreateForm = () => {
    setNewRestaurant({
      name: '', ownerId: '', address: '', phone: '', email: '',
      description: '', cuisine: [], preparationTime: 30, minimumOrder: 100, deliveryFee: 50, location: null,
    });
    setCloneFromId('');
    setCloneSearch('');
    setCloneMenuCount(null);
    setShowCloneSection(false);
    setShowCreateModal(false);
  };

  const handleNewRestaurantChange = (e) => {
    const { name, value } = e.target;
    setNewRestaurant((prev) => ({ ...prev, [name]: value }));
  };

  const handleCuisineToggle = (cuisine) => {
    setNewRestaurant((prev) => ({
      ...prev,
      cuisine: prev.cuisine.includes(cuisine)
        ? prev.cuisine.filter((c) => c !== cuisine)
        : [...prev.cuisine, cuisine],
    }));
  };

  const handleCloneSourceChange = async (restaurantId) => {
    setCloneFromId(restaurantId);
    setCloneMenuCount(null);
    if (restaurantId) {
      try {
        const res = await menuAPI.getByRestaurant(restaurantId, true);
        const items = res.data?.data?.menuItems || res.data?.data || [];
        setCloneMenuCount(Array.isArray(items) ? items.length : 0);
      } catch {
        setCloneMenuCount(0);
      }
    }
  };

  const handleCreateRestaurant = async () => {
    // Validations
    if (!newRestaurant.name.trim()) { toast.error('Restaurant name is required'); return; }
    if (!newRestaurant.ownerId) { toast.error('Please select a restaurant owner'); return; }
    if (!newRestaurant.address.trim()) { toast.error('Restaurant address is required'); return; }
    if (!newRestaurant.phone.trim()) { toast.error('Restaurant phone is required'); return; }

    const phoneClean = newRestaurant.phone.trim().replace(/\s+/g, '');
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phoneClean)) {
      toast.error('Please enter a valid 10-digit phone number (digits only)');
      return;
    }

    try {
      setSavingRestaurant(true);

      const loc = newRestaurant.location || { lat: 12.9716, lng: 77.5946 };
      const payload = {
        name: newRestaurant.name.trim(),
        ownerId: newRestaurant.ownerId,
        address: newRestaurant.address.trim(),
        phone: phoneClean,
        email: newRestaurant.email.trim() || undefined,
        description: newRestaurant.description.trim() || undefined,
        cuisine: newRestaurant.cuisine.length > 0 ? newRestaurant.cuisine : ['Other'],
        preparationTime: parseInt(newRestaurant.preparationTime) || 30,
        minimumOrder: parseInt(newRestaurant.minimumOrder) || 100,
        deliveryFee: parseInt(newRestaurant.deliveryFee) || 50,
        location: loc,
      };

      // Step 1: Create the restaurant
      const createRes = await restaurantsAPI.create(payload);
      const createdRestaurant = createRes.data?.data?.restaurant || createRes.data?.data;
      const newId = createdRestaurant?._id || createdRestaurant?.id;

      if (!newId) throw new Error('Failed to get created restaurant ID');

      toast.success(`Restaurant "${newRestaurant.name}" created!`);

      // Step 2: Clone menu if selected
      if (cloneFromId) {
        try {
          const cloneRes = await menuAPI.cloneMenu(cloneFromId, newId);
          const clonedCount = cloneRes.data?.data?.clonedCount || 0;
          if (clonedCount > 0) {
            toast.success(`Cloned ${clonedCount} menu items!`);
          } else {
            toast('Source restaurant has no menu items to clone', { icon: 'â¹ï¸' });
          }
        } catch (cloneErr) {
          console.error('Menu clone failed:', cloneErr);
          toast.error('Restaurant created but menu clone failed. You can clone manually later.');
        }
      }

      resetCreateForm();
      fetchRestaurants();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to create restaurant';
      toast.error(msg);
      console.error(error);
    } finally {
      setSavingRestaurant(false);
    }
  };

  // ---- Import Menu helpers ----
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const parseRow = (row) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') { inQuotes = !inQuotes; }
        else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
        else { current += char; }
      }
      result.push(current.trim());
      return result;
    };
    const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ''));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseRow(lines[i]);
      if (values.every((v) => !v)) continue;
      const obj = {};
      headers.forEach((header, idx) => { obj[header] = values[idx] || ''; });
      rows.push(obj);
    }
    return rows;
  };

  const normalizeRow = (row) => {
    const mapping = {
      name: ['name', 'itemname', 'item', 'menuitem', 'dish', 'dishname', 'item_name'],
      description: ['description', 'desc', 'details', 'about'],
      price: ['price', 'cost', 'amount', 'mrp', 'rate'],
      discountprice: ['discountprice', 'discount_price', 'saleprice', 'sale_price', 'offerprice'],
      category: ['category', 'cat', 'type', 'section', 'menutype'],
      isveg: ['isveg', 'is_veg', 'veg', 'vegetarian', 'vegnonveg', 'foodtype'],
      preparationtime: ['preparationtime', 'preparation_time', 'preptime', 'prep_time', 'time', 'cooktime'],
      image: ['image', 'imageurl', 'image_url', 'photo', 'img'],
      tags: ['tags', 'tag', 'labels', 'label'],
    };
    const normalized = {};
    for (const [targetKey, aliases] of Object.entries(mapping)) {
      for (const alias of aliases) {
        const found = Object.keys(row).find((k) => k.toLowerCase().replace(/[\s_\-/]/g, '') === alias.replace(/[\s_\-/]/g, ''));
        if (found && row[found] !== undefined && row[found] !== '') {
          normalized[targetKey] = row[found];
          break;
        }
      }
    }
    return normalized;
  };

  const openImportModal = (restaurant) => {
    setImportTargetId(restaurant._id || restaurant.id);
    setImportTargetName(restaurant.name);
    setImportPreview([]);
    setImportErrors([]);
    setImportFileName('');
    setShowImportModal(true);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setImportErrors([]);
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'csv' || ext === 'tsv') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const rawRows = parseCSV(evt.target.result);
          const normalizedRows = rawRows.map(normalizeRow).filter((r) => r.name);
          if (normalizedRows.length === 0) {
            setImportErrors(['No valid rows found. Make sure the file has a "Name" column.']);
            setImportPreview([]);
          } else {
            setImportPreview(normalizedRows);
          }
        } catch (err) {
          setImportErrors(['Failed to parse file: ' + err.message]);
        }
      };
      reader.readAsText(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
      setImportErrors(['Please save your Excel file as CSV first, then upload the CSV.']);
      setImportPreview([]);
    } else {
      setImportErrors(['Unsupported file type. Please upload a .csv file.']);
      setImportPreview([]);
    }
    e.target.value = '';
  };

  const handleImportMenu = async () => {
    if (!importTargetId || importPreview.length === 0) return;
    try {
      setImportLoading(true);
      const res = await menuAPI.bulkImport(importTargetId, importPreview);
      const data = res.data?.data || {};
      toast.success(res.data?.message || `Imported ${data.importedCount || 0} items`, { duration: 5000 });
      if (data.errors?.length > 0) {
        setImportErrors(data.errors);
      } else {
        setShowImportModal(false);
      }
      fetchRestaurants();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import menu');
      if (error.response?.data?.data?.errors) setImportErrors(error.response.data.data.errors);
    } finally {
      setImportLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['Name', 'Description', 'Price', 'Discount Price', 'Category', 'Veg', 'Preparation Time', 'Tags', 'Image URL'];
    const sampleRows = [
      ['Butter Chicken', 'Creamy tomato-based curry with tender chicken', '350', '299', 'Main Course', 'No', '25', 'Popular,Bestseller', ''],
      ['Paneer Tikka', 'Marinated cottage cheese grilled to perfection', '280', '', 'Appetizers', 'Yes', '20', 'Popular', ''],
      ['Masala Dosa', 'Crispy crepe filled with spiced potato stuffing', '150', '120', 'Main Course', 'Yes', '15', 'Bestseller', ''],
      ['Mango Lassi', 'Refreshing yogurt drink with mango pulp', '120', '', 'Beverages', 'Yes', '5', 'New,Healthy', ''],
      ['Chicken Biryani', 'Fragrant basmati rice with spiced chicken', '320', '280', 'Biryani', 'No', '30', 'Bestseller,Spicy', ''],
      ['Gulab Jamun', 'Deep-fried dough balls soaked in sugar syrup', '100', '', 'Desserts', 'Yes', '10', '', ''],
    ];
    const csvContent = [headers, ...sampleRows]
      .map((row) => row.map((cell) => String(cell).includes(',') ? `"${cell}"` : cell).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'menu_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded!');
  };

  // Filtering
  const filteredRestaurants = restaurants.filter((r) => {
    const matchesSearch = !searchTerm ||
      r.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.ownerName?.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'pending') return matchesSearch && r.status === 'pending_verification';
    if (activeTab === 'active') return matchesSearch && r.status === 'active';
    if (activeTab === 'inactive') return matchesSearch && r.status === 'inactive';
    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRestaurants.length / itemsPerPage);
  const paginatedRestaurants = filteredRestaurants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // For clone list â use already-loaded restaurants from the page
  const cloneFilteredRestaurants = restaurants.filter((r) =>
    r.name?.toLowerCase().includes(cloneSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <FiLoader className="w-8 h-8 animate-spin text-[#F2A93E]" />
          <p className="text-gray-600">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-orange-50 to-amber-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Restaurant Management</h1>
            <p className="text-gray-600 text-sm mt-1">Total restaurants: {restaurants.length}</p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all duration-300 bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 active:scale-95"
          >
            <FiPlus size={20} />
            Add Restaurant
          </button>
        </div>

        {/* Search Bar */}
        <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm p-4 mb-6">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by restaurant name or owner..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b-2 border-dashed border-orange-200 overflow-x-auto pb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
              className={`px-4 py-2 font-medium text-sm whitespace-nowrap border-b-2 transition ${
                activeTab === tab
                  ? 'border-[#F2A93E] text-[#F2A93E]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Restaurants Cards */}
        {filteredRestaurants.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {paginatedRestaurants.map((restaurant) => (
              <div key={restaurant._id || restaurant.id} className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-sm overflow-hidden hover:shadow-md transition">
                <div className="p-6">
                  {/* Header Row */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 pb-4 border-b-2 border-dashed border-orange-100 gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{restaurant.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">Owner: {restaurant.ownerName}</p>
                    </div>
                    <span className={`px-4 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusBadgeColor(restaurant.status)}`}>
                      {restaurant.status?.replace('_', ' ') || 'unknown'}
                    </span>
                  </div>

                  {/* Main Content */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Cuisine</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{restaurant.cuisineType || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Total Orders</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{restaurant.totalOrders || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Rating</p>
                      <div className="flex items-center gap-1 mt-1">
                        <FiStar className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-semibold text-gray-900">{restaurant.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Menu Items</p>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{restaurant.menuItems || 0}</p>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  {expandedRestaurant === (restaurant._id || restaurant.id) && (
                    <div className="py-4 border-t-2 border-dashed border-orange-100 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600 font-medium">Revenue</p>
                          <p className="text-sm font-bold text-[#F2A93E] mt-1">â¹{(restaurant.revenue || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 font-medium">Phone</p>
                          <p className="text-sm text-gray-900 mt-1">{restaurant.phone || 'N/A'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Address</p>
                        <p className="text-sm text-gray-900 mt-1">{restaurant.address || 'N/A'}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t-2 border-dashed border-orange-100 flex-wrap">
                    <button
                      onClick={() => setExpandedRestaurant(expandedRestaurant === (restaurant._id || restaurant.id) ? null : (restaurant._id || restaurant.id))}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
                    >
                      <FiEye className="w-4 h-4" />
                      {expandedRestaurant === (restaurant._id || restaurant.id) ? 'Hide' : 'Details'}
                    </button>
                    <button
                      onClick={() => openImportModal(restaurant)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 transition font-medium text-sm"
                    >
                      <FiUpload className="w-4 h-4" />
                      Import Menu
                    </button>
                    {restaurant.status === 'pending_verification' && (
                      <>
                        <button
                          onClick={() => handleApprove(restaurant._id || restaurant.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:shadow-lg transition font-medium text-sm"
                        >
                          <FiCheck className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            setSelectedRestaurant(restaurant);
                            setShowRejectModal(true);
                          }}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-lg hover:shadow-lg transition font-medium text-sm"
                        >
                          <FiX className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-white border-2 border-dashed border-orange-200 rounded-[15px] mt-4">
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredRestaurants.length)} of {filteredRestaurants.length}
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
                          ? 'bg-[#F2A93E] text-white'
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
        ) : (
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <FiAlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No restaurants found</p>
            </div>
          </div>
        )}
      </div>

      {/* ============================== */}
      {/* REJECT MODAL */}
      {/* ============================== */}
      {showRejectModal && selectedRestaurant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-lg max-w-sm w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Reject Restaurant</h2>
            <p className="text-gray-600 text-sm mb-4">{selectedRestaurant.name}</p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setShowRejectModal(false); setSelectedRestaurant(null); setRejectReason(''); }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-[#F07054] to-red-500 text-white rounded-lg hover:shadow-lg transition font-medium"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================== */}
      {/* CREATE RESTAURANT MODAL */}
      {/* ============================== */}
      {/* ============================== */}
      {/* IMPORT MENU MODAL */}
      {/* ============================== */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-dashed border-green-200 rounded-[15px] shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white flex items-center justify-between sticky top-0 z-10 rounded-t-[13px]">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FiUpload className="w-5 h-5" />
                  Import Menu
                </h2>
                <p className="text-green-100 text-sm mt-1">for {importTargetName}</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-green-600 rounded-lg transition-colors">
                <FiX size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-green-50/30">
              {/* Download Template */}
              <div className="bg-white border border-green-200 rounded-[10px] p-4">
                <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  Download Template
                </h3>
                <p className="text-sm text-gray-600 mb-3">Download a CSV template with sample data to see the expected format.</p>
                <button onClick={downloadTemplate} className="bg-white border border-green-300 hover:bg-green-50 text-green-700 font-medium py-2 px-4 rounded-[10px] flex items-center gap-2 text-sm">
                  <FiDownload className="w-4 h-4" />
                  Download CSV Template
                </button>
              </div>

              {/* Upload */}
              <div className="bg-white border border-green-200 rounded-[10px] p-4">
                <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  Upload Your File
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Columns: <strong>Name</strong> (required), <strong>Price</strong> (required), Category, Description, Veg, Preparation Time, Tags, Discount Price, Image URL
                </p>
                <label className="flex items-center justify-center gap-3 w-full border-2 border-dashed border-green-300 hover:border-green-400 bg-white hover:bg-green-50/50 text-green-700 rounded-[10px] py-6 cursor-pointer transition-all">
                  <FiFileText className="w-6 h-6" />
                  <span className="font-medium">{importFileName || 'Click to select CSV file'}</span>
                  <input type="file" accept=".csv,.tsv" onChange={handleImportFile} className="hidden" />
                </label>
              </div>

              {/* Errors */}
              {importErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-[10px] p-4">
                  <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2"><FiAlertCircle className="w-4 h-4" /> Issues Found</h4>
                  <ul className="text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto">
                    {importErrors.map((err, i) => <li key={i}>â¢ {err}</li>)}
                  </ul>
                </div>
              )}

              {/* Preview */}
              {importPreview.length > 0 && (
                <div className="bg-white border border-green-200 rounded-[10px] p-4">
                  <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    Preview ({importPreview.length} items)
                  </h3>
                  <div className="overflow-x-auto max-h-64 overflow-y-auto border border-green-100 rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-green-100/80 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-semibold text-green-800">#</th>
                          <th className="text-left p-2 font-semibold text-green-800">Name</th>
                          <th className="text-left p-2 font-semibold text-green-800">Price</th>
                          <th className="text-left p-2 font-semibold text-green-800">Category</th>
                          <th className="text-left p-2 font-semibold text-green-800">Veg</th>
                          <th className="text-left p-2 font-semibold text-green-800">Tags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.map((item, idx) => {
                          const vegStr = item.isveg !== undefined ? String(item.isveg).toLowerCase() : 'yes';
                          const isVeg = !['false', 'no', '0', 'non-veg', 'nonveg', 'nv'].includes(vegStr);
                          return (
                            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-green-50/30'}>
                              <td className="p-2 text-gray-500">{idx + 1}</td>
                              <td className="p-2 font-medium text-gray-900">{item.name}</td>
                              <td className="p-2 text-gray-700">â¹{item.price}</td>
                              <td className="p-2 text-gray-600">{item.category || 'Other'}</td>
                              <td className="p-2">
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${isVeg ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {isVeg ? 'Veg' : 'Non-Veg'}
                                </span>
                              </td>
                              <td className="p-2 text-gray-500 text-xs">{item.tags || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t-2 border-dashed border-green-200 p-4 bg-green-50/30 flex gap-3">
              <button onClick={() => setShowImportModal(false)} className="flex-1 px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleImportMenu}
                disabled={importPreview.length === 0 || importLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {importLoading ? <><FiLoader className="w-5 h-5 animate-spin" /><span>Importing...</span></> : <><FiUpload className="w-5 h-5" /><span>Import {importPreview.length} Items</span></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-400 to-orange-500 p-6 text-white flex items-center justify-between sticky top-0 z-10 rounded-t-[13px]">
              <h2 className="text-2xl font-bold">Add New Restaurant</h2>
              <button
                onClick={resetCreateForm}
                disabled={savingRestaurant}
                className="p-2 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 bg-orange-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Restaurant Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Restaurant Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={newRestaurant.name}
                    onChange={handleNewRestaurantChange}
                    placeholder="e.g. McDonald's HSR Layout"
                    className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white"
                  />
                </div>

                {/* Owner Select */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Owner (Restaurant Admin) *</label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-3 text-gray-400" size={16} />
                    <select
                      name="ownerId"
                      value={newRestaurant.ownerId}
                      onChange={handleNewRestaurantChange}
                      className="w-full pl-9 pr-3 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white appearance-none"
                    >
                      <option value="">Select owner...</option>
                      {restaurantAdmins.map((user) => (
                        <option key={user._id || user.id} value={user._id || user.id}>
                          {user.name || user.email} {user.phone ? `(${user.phone})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  {restaurantAdmins.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      No restaurant admins found. Create a user with "restaurant_admin" role first.
                    </p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Address *</label>
                  <LocationPickerButton
                    compact={false}
                    buttonLabel="Detect Location"
                    onLocationSelect={({ address, lat, lng }) => {
                      setNewRestaurant((prev) => ({
                        ...prev,
                        address: address || prev.address,
                        location: lat && lng ? { lat, lng } : prev.location,
                      }));
                    }}
                    className="mb-2"
                  />
                  <div className="relative">
                    <FiMapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input
                      type="text"
                      name="address"
                      value={newRestaurant.address}
                      onChange={handleNewRestaurantChange}
                      placeholder="Restaurant address (type or use Detect Location)"
                      className="w-full pl-9 pr-3 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white"
                    />
                  </div>
                  {newRestaurant.location && (
                    <p className="text-xs text-green-600 mt-1">
                      Coordinates: {newRestaurant.location.lat.toFixed(4)}, {newRestaurant.location.lng.toFixed(4)}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phone *</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input
                      type="tel"
                      name="phone"
                      value={newRestaurant.phone}
                      onChange={handleNewRestaurantChange}
                      placeholder="10-digit phone number"
                      maxLength={10}
                      className="w-full pl-9 pr-3 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-3 text-gray-400" size={16} />
                    <input
                      type="email"
                      name="email"
                      value={newRestaurant.email}
                      onChange={handleNewRestaurantChange}
                      placeholder="restaurant@example.com"
                      className="w-full pl-9 pr-3 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    name="description"
                    value={newRestaurant.description}
                    onChange={handleNewRestaurantChange}
                    placeholder="Short description"
                    className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white"
                  />
                </div>

                {/* Prep Time */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Prep Time (min)</label>
                  <input
                    type="number"
                    name="preparationTime"
                    value={newRestaurant.preparationTime}
                    onChange={handleNewRestaurantChange}
                    min="5" max="120"
                    className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white"
                  />
                </div>

                {/* Min Order */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Minimum Order (â¹)</label>
                  <input
                    type="number"
                    name="minimumOrder"
                    value={newRestaurant.minimumOrder}
                    onChange={handleNewRestaurantChange}
                    min="0"
                    className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white"
                  />
                </div>

                {/* Delivery Fee */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Fee (â¹)</label>
                  <input
                    type="number"
                    name="deliveryFee"
                    value={newRestaurant.deliveryFee}
                    onChange={handleNewRestaurantChange}
                    min="0"
                    className="w-full px-3 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white"
                  />
                </div>
              </div>

              {/* Cuisine Tags */}
              <div className="mt-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cuisine Type</label>
                <div className="flex flex-wrap gap-2">
                  {CUISINE_OPTIONS.map((cuisine) => (
                    <button
                      key={cuisine}
                      type="button"
                      onClick={() => handleCuisineToggle(cuisine)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        newRestaurant.cuisine.includes(cuisine)
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cuisine}
                    </button>
                  ))}
                </div>
              </div>

              {/* ============================== */}
              {/* CLONE MENU SECTION */}
              {/* ============================== */}
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => setShowCloneSection(!showCloneSection)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-purple-50 border-2 border-purple-200 rounded-lg text-purple-700 font-semibold hover:bg-purple-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FiCopy size={18} />
                    <span>Clone Menu from Existing Restaurant</span>
                  </div>
                  {showCloneSection ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
                </button>

                {showCloneSection && (
                  <div className="mt-3 bg-white rounded-lg border-2 border-purple-200 p-4">
                    <p className="text-xs text-purple-600 mb-3">
                      For chain restaurants like McDonald's, KFC â copy the entire menu from an existing branch.
                    </p>

                    {/* Search */}
                    <div className="relative mb-3">
                      <FiSearch className="absolute left-3 top-2.5 text-purple-400" size={16} />
                      <input
                        type="text"
                        placeholder="Search restaurants to clone menu from..."
                        value={cloneSearch}
                        onChange={(e) => setCloneSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border-2 border-purple-200 rounded-lg focus:outline-none focus:border-purple-400 bg-white text-sm"
                      />
                    </div>

                    {/* Restaurant list */}
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {/* None option */}
                      <button
                        type="button"
                        onClick={() => { handleCloneSourceChange(''); setCloneSearch(''); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          !cloneFromId
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-purple-100 border border-purple-100'
                        }`}
                      >
                        No clone â start with empty menu
                      </button>

                      {cloneFilteredRestaurants.map((r) => {
                        const rId = r._id || r.id;
                        const isSelected = cloneFromId === rId;
                        return (
                          <button
                            key={rId}
                            type="button"
                            onClick={() => handleCloneSourceChange(rId)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${
                              isSelected
                                ? 'bg-purple-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-purple-100 border border-purple-100'
                            }`}
                          >
                            <div>
                              <span className="font-medium">{r.name}</span>
                              {r.menuItems > 0 && (
                                <span className={`ml-2 text-xs ${isSelected ? 'text-purple-200' : 'text-gray-400'}`}>
                                  ({r.menuItems} items)
                                </span>
                              )}
                            </div>
                            {isSelected && <FiCheck size={16} />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Menu count preview */}
                    {cloneFromId && cloneMenuCount !== null && (
                      <div className="mt-3 px-3 py-2 bg-purple-100 rounded-lg text-sm text-purple-800 font-medium">
                        {cloneMenuCount > 0
                          ? `${cloneMenuCount} menu items will be cloned to the new restaurant`
                          : 'This restaurant has no menu items yet'}
                      </div>
                    )}
                    {cloneFromId && cloneMenuCount === null && (
                      <div className="mt-3 px-3 py-2 bg-purple-100 rounded-lg text-sm text-purple-600 flex items-center gap-2">
                        <FiLoader className="animate-spin" size={14} />
                        Checking menu items...
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-orange-200">
                <button
                  onClick={resetCreateForm}
                  disabled={savingRestaurant}
                  className="flex-1 px-4 py-3 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRestaurant}
                  disabled={savingRestaurant}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold hover:from-orange-500 hover:to-orange-600 transition-all disabled:opacity-50 active:scale-95"
                >
                  {savingRestaurant ? (
                    <>
                      <FiLoader className="animate-spin" size={18} />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FiPlus size={18} />
                      {cloneFromId ? 'Create & Clone Menu' : 'Create Restaurant'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
