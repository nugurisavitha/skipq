import React, { useState, useEffect } from 'react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiMapPin,
  FiCheck,
  FiX,
  FiSave,
  FiLoader,
  FiChevronDown,
  FiChevronUp,
  FiUser,
  FiPhone,
  FiMail,
  FiUpload,
  FiDownload,
  FiFileText,
  FiAlertCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { foodCourtsAPI, restaurantsAPI, adminAPI, menuAPI } from '../../services/api';
import LocationPickerButton from '../../components/common/LocationPickerButton';

const CUISINE_OPTIONS = [
  'Indian', 'Chinese', 'Continental', 'Italian', 'Mexican', 'Thai',
  'Japanese', 'North Indian', 'South Indian', 'Seafood', 'Fast Food',
  'Bakery', 'Desserts', 'Beverages', 'Other',
];

export default function FoodCourts() {
  const [foodCourts, setFoodCourts] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedFoodCourtId, setExpandedFoodCourtId] = useState(null);
  const [searchRestaurant, setSearchRestaurant] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    image: '',
    logo: '',
    location: null,
  });

  const [foodCourtRestaurants, setFoodCourtRestaurants] = useState({});

  // New Restaurant form state
  const [showNewRestaurantForm, setShowNewRestaurantForm] = useState(false);
  const [restaurantAdmins, setRestaurantAdmins] = useState([]);
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
    cloneFromId: '',
  });
  const [savingRestaurant, setSavingRestaurant] = useState(false);
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

  useEffect(() => {
    fetchFoodCourts();
    fetchRestaurants();
  }, []);

  // Fetch restaurant_admin users when Manage section opens
  useEffect(() => {
    if (expandedFoodCourtId) {
      fetchRestaurantAdmins();
    }
  }, [expandedFoodCourtId]);

  const fetchFoodCourts = async () => {
    try {
      setLoading(true);
      const response = await foodCourtsAPI.getAll();
      const data = response.data?.data?.foodCourts || response.data?.data || [];
      setFoodCourts(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load food courts');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const response = await restaurantsAPI.getAll();
      const data = response.data?.data?.restaurants || response.data?.data || [];
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error('Failed to load restaurants');
      console.error(error);
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

  const handleOpenModal = (foodCourt = null) => {
    if (foodCourt) {
      setEditingId(foodCourt._id || foodCourt.id);
      setFormData({
        name: foodCourt.name || '',
        description: foodCourt.description || '',
        address: foodCourt.address || '',
        image: foodCourt.image || '',
        logo: foodCourt.logo || '',
        location: foodCourt.location?.coordinates
          ? { lat: foodCourt.location.coordinates[1], lng: foodCourt.location.coordinates[0] }
          : null,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        description: '',
        address: '',
        image: '',
        logo: '',
        location: null,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({
      name: '',
      description: '',
      address: '',
      image: '',
      logo: '',
      location: null,
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveFoodCourt = async () => {
    if (!formData.name.trim() || !formData.address.trim()) {
      toast.error('Please fill in name and address');
      return;
    }

    if (!formData.location && !editingId) {
      toast.error('Please use "Detect Location" to set the food court coordinates');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        image: formData.image,
        logo: formData.logo,
        ...(formData.location && { location: formData.location }),
      };
      if (editingId) {
        await foodCourtsAPI.update(editingId, payload);
        toast.success('Food court updated successfully');
      } else {
        await foodCourtsAPI.create(payload);
        toast.success('Food court created successfully');
      }
      handleCloseModal();
      fetchFoodCourts();
    } catch (error) {
      toast.error(editingId ? 'Failed to update food court' : 'Failed to create food court');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFoodCourt = async (id) => {
    if (!window.confirm('Are you sure you want to delete this food court?')) return;

    try {
      setLoading(true);
      await foodCourtsAPI.delete(id);
      toast.success('Food court deleted successfully');
      fetchFoodCourts();
    } catch (error) {
      toast.error('Failed to delete food court');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (foodCourt) => {
    try {
      setLoading(true);
      const updatedData = {
        ...foodCourt,
        isActive: !foodCourt.isActive,
      };
      await foodCourtsAPI.update(foodCourt._id || foodCourt.id, updatedData);
      toast.success(
        `Food court ${updatedData.isActive ? 'activated' : 'deactivated'} successfully`
      );
      fetchFoodCourts();
    } catch (error) {
      toast.error('Failed to update food court status');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRestaurant = async (restaurantId) => {
    if (!expandedFoodCourtId) return;

    try {
      setLoading(true);
      await foodCourtsAPI.addRestaurant(expandedFoodCourtId, restaurantId);
      toast.success('Restaurant added successfully');
      fetchFoodCourts();
      setSearchRestaurant('');
    } catch (error) {
      toast.error('Failed to add restaurant');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRestaurant = async (restaurantId) => {
    if (!expandedFoodCourtId) return;

    if (!window.confirm('Are you sure you want to remove this restaurant?')) return;

    try {
      setLoading(true);
      await foodCourtsAPI.removeRestaurant(expandedFoodCourtId, restaurantId);
      toast.success('Restaurant removed successfully');
      fetchFoodCourts();
    } catch (error) {
      toast.error('Failed to remove restaurant');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ---- Import Menu helpers ----
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const parseRow = (row) => {
      const result = []; let current = ''; let inQuotes = false;
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

  const normalizeImportRow = (row) => {
    const mapping = {
      name: ['name', 'itemname', 'item', 'menuitem', 'dish', 'dishname'],
      description: ['description', 'desc', 'details'],
      price: ['price', 'cost', 'amount', 'mrp', 'rate'],
      discountprice: ['discountprice', 'discount_price', 'saleprice'],
      category: ['category', 'cat', 'type', 'section'],
      isveg: ['isveg', 'is_veg', 'veg', 'vegetarian', 'foodtype'],
      preparationtime: ['preparationtime', 'preparation_time', 'preptime', 'time'],
      image: ['image', 'imageurl', 'image_url', 'photo'],
      tags: ['tags', 'tag', 'labels'],
    };
    const normalized = {};
    for (const [targetKey, aliases] of Object.entries(mapping)) {
      for (const alias of aliases) {
        const found = Object.keys(row).find((k) => k.toLowerCase().replace(/[\s_\-/]/g, '') === alias);
        if (found && row[found] !== undefined && row[found] !== '') { normalized[targetKey] = row[found]; break; }
      }
    }
    return normalized;
  };

  const openImportModal = (restaurant) => {
    setImportTargetId(restaurant._id || restaurant.id);
    setImportTargetName(restaurant.name);
    setImportPreview([]); setImportErrors([]); setImportFileName('');
    setShowImportModal(true);
  };

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name); setImportErrors([]);
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'csv' || ext === 'tsv') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const rawRows = parseCSV(evt.target.result);
          const normalizedRows = rawRows.map(normalizeImportRow).filter((r) => r.name);
          if (normalizedRows.length === 0) {
            setImportErrors(['No valid rows found. Make sure the file has a "Name" column.']);
            setImportPreview([]);
          } else { setImportPreview(normalizedRows); }
        } catch (err) { setImportErrors(['Failed to parse file: ' + err.message]); }
      };
      reader.readAsText(file);
    } else {
      setImportErrors(['Please upload a .csv file. Save Excel files as CSV first.']);
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
      toast.success(res.data?.message || 'Import successful', { duration: 5000 });
      if (data.errors?.length > 0) { setImportErrors(data.errors); }
      else { setShowImportModal(false); }
      fetchFoodCourts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to import menu');
      if (error.response?.data?.data?.errors) setImportErrors(error.response.data.data.errors);
    } finally { setImportLoading(false); }
  };

  const downloadImportTemplate = () => {
    const headers = ['Name', 'Description', 'Price', 'Discount Price', 'Category', 'Veg', 'Preparation Time', 'Tags', 'Image URL'];
    const sampleRows = [
      ['Butter Chicken', 'Creamy curry with chicken', '350', '299', 'Main Course', 'No', '25', 'Popular,Bestseller', ''],
      ['Paneer Tikka', 'Grilled cottage cheese', '280', '', 'Appetizers', 'Yes', '20', 'Popular', ''],
      ['Masala Dosa', 'Crispy crepe with potato', '150', '120', 'Main Course', 'Yes', '15', 'Bestseller', ''],
      ['Mango Lassi', 'Yogurt drink with mango', '120', '', 'Beverages', 'Yes', '5', 'New', ''],
    ];
    const csvContent = [headers, ...sampleRows]
      .map((row) => row.map((cell) => String(cell).includes(',') ? '"' + cell + '"' : cell).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'menu_import_template.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded!');
  };

  // New restaurant form handlers
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

  const resetNewRestaurantForm = () => {
    setNewRestaurant({
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
      cloneFromId: '',
    });
    setCloneSearch('');
    setCloneMenuCount(null);
    setShowNewRestaurantForm(false);
  };

  // When clone source is selected, fetch its menu count for preview
  const handleCloneSourceChange = async (restaurantId) => {
    setNewRestaurant((prev) => ({ ...prev, cloneFromId: restaurantId }));
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
    if (!newRestaurant.name.trim()) {
      toast.error('Restaurant name is required');
      return;
    }
    if (!newRestaurant.ownerId) {
      toast.error('Please select a restaurant owner');
      return;
    }
    if (!newRestaurant.address.trim()) {
      toast.error('Restaurant address is required');
      return;
    }
    if (!newRestaurant.phone.trim()) {
      toast.error('Restaurant phone is required');
      return;
    }

    // Validate phone format (10-digit Indian)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(newRestaurant.phone.trim())) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    try {
      setSavingRestaurant(true);

      // Use the food court's address as default location
      const fc = expandedFoodCourt;
      const payload = {
        name: newRestaurant.name.trim(),
        ownerId: newRestaurant.ownerId,
        address: newRestaurant.address.trim(),
        phone: newRestaurant.phone.trim(),
        email: newRestaurant.email.trim() || undefined,
        description: newRestaurant.description.trim() || undefined,
        cuisine: newRestaurant.cuisine.length > 0 ? newRestaurant.cuisine : ['Other'],
        preparationTime: parseInt(newRestaurant.preparationTime) || 30,
        minimumOrder: parseInt(newRestaurant.minimumOrder) || 100,
        deliveryFee: parseInt(newRestaurant.deliveryFee) || 50,
        // Use food court's location coordinates if available
        location: fc?.location?.coordinates
          ? { lng: fc.location.coordinates[0], lat: fc.location.coordinates[1] }
          : { lng: 0, lat: 0 },
      };

      // Step 1: Create the restaurant
      const createRes = await restaurantsAPI.create(payload);
      const createdRestaurant =
        createRes.data?.data?.restaurant || createRes.data?.data;
      const newId = createdRestaurant?._id || createdRestaurant?.id;

      if (!newId) {
        throw new Error('Failed to get created restaurant ID');
      }

      toast.success(`Restaurant "${newRestaurant.name}" created!`);

      // Step 2: Auto-add it to the current food court
      try {
        await foodCourtsAPI.addRestaurant(expandedFoodCourtId, newId);
        toast.success('Restaurant added to food court!');
      } catch (addErr) {
        console.error('Auto-add to food court failed:', addErr);
        toast.error('Restaurant created but could not auto-add to food court. Please add manually.');
      }

      // Step 3: Clone menu if a source restaurant was selected
      if (newRestaurant.cloneFromId) {
        try {
          const cloneRes = await menuAPI.cloneMenu(newRestaurant.cloneFromId, newId);
          const clonedCount = cloneRes.data?.data?.clonedCount || 0;
          if (clonedCount > 0) {
            toast.success(`Cloned ${clonedCount} menu items!`);
          } else {
            toast('Source restaurant has no menu items to clone', { icon: 'ℹ️' });
          }
        } catch (cloneErr) {
          console.error('Menu clone failed:', cloneErr);
          toast.error('Restaurant created but menu clone failed. You can clone manually later.');
        }
      }

      // Refresh data
      await Promise.all([fetchFoodCourts(), fetchRestaurants()]);
      resetNewRestaurantForm();
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to create restaurant';
      toast.error(msg);
      console.error(error);
    } finally {
      setSavingRestaurant(false);
    }
  };

  const expandedFoodCourt = foodCourts.find(
    (fc) => (fc._id || fc.id) === expandedFoodCourtId
  );
  const filteredRestaurants = restaurants.filter((r) =>
    r.name.toLowerCase().includes(searchRestaurant.toLowerCase())
  );
  const availableRestaurants = filteredRestaurants.filter(
    (r) =>
      !expandedFoodCourt?.restaurants?.some(
        (er) => (er._id || er.id) === (r._id || r.id)
      )
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Food Courts</h1>
          <p className="text-gray-600 mt-1">Manage and organize food courts</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 active:scale-95"
        >
          <FiPlus size={20} />
          Create Food Court
        </button>
      </div>

      {/* Food Courts Grid */}
      {loading && foodCourts.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <FiLoader className="animate-spin text-orange-500" size={32} />
        </div>
      ) : foodCourts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-orange-200">
          <p className="text-gray-500 text-lg">No food courts found. Create one to get started!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {foodCourts.map((foodCourt) => (
            <div
              key={foodCourt._id || foodCourt.id}
              className="border-2 border-dashed border-orange-200 rounded-[15px] overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white"
            >
              {/* Image */}
              {foodCourt.image && (
                <div className="h-40 overflow-hidden bg-gray-200">
                  <img
                    src={foodCourt.image}
                    alt={foodCourt.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Card Content */}
              <div className="p-5 bg-orange-50 rounded-b-[12px]">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">{foodCourt.name}</h3>
                    <div className="flex items-center gap-1 text-orange-600 text-sm mt-1">
                      <FiMapPin size={16} />
                      <p className="line-clamp-1">{foodCourt.address}</p>
                    </div>
                  </div>
                  {foodCourt.logo && (
                    <img
                      src={foodCourt.logo}
                      alt="logo"
                      className="w-10 h-10 rounded object-cover"
                    />
                  )}
                </div>

                {/* Description */}
                {foodCourt.description && (
                  <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                    {foodCourt.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-orange-200">
                  <span className="text-sm font-semibold text-gray-700">
                    {foodCourt.restaurants?.length || 0} Restaurants
                  </span>
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      foodCourt.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {foodCourt.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => handleOpenModal(foodCourt)}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-50 text-blue-600 font-semibold hover:bg-blue-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiEdit2 size={16} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteFoodCourt(foodCourt._id || foodCourt.id)}
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 font-semibold hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiTrash2 size={16} />
                    Delete
                  </button>
                </div>

                {/* Toggle & Manage Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActive(foodCourt)}
                    disabled={loading}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      foodCourt.isActive
                        ? 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {foodCourt.isActive ? <FiCheck size={16} /> : <FiX size={16} />}
                    {foodCourt.isActive ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    onClick={() =>
                      setExpandedFoodCourtId(
                        expandedFoodCourtId === (foodCourt._id || foodCourt.id)
                          ? null
                          : foodCourt._id || foodCourt.id
                      )
                    }
                    className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold hover:from-orange-500 hover:to-orange-600 transition-all active:scale-95"
                  >
                    Manage
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded Restaurant Management Section */}
      {expandedFoodCourt && (
        <div className="border-2 border-dashed border-orange-200 rounded-[15px] overflow-hidden bg-white mb-8">
          <div className="bg-gradient-to-r from-orange-400 to-orange-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                Manage Restaurants - {expandedFoodCourt.name}
              </h2>
              <button
                onClick={() => { setExpandedFoodCourtId(null); resetNewRestaurantForm(); }}
                className="p-2 hover:bg-orange-600 rounded-lg transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
          </div>

          <div className="p-6 bg-orange-50 rounded-b-[12px]">

            {/* ============================================ */}
            {/* CREATE NEW RESTAURANT SECTION */}
            {/* ============================================ */}
            <div className="mb-8 pb-8 border-b border-orange-200">
              <button
                onClick={() => setShowNewRestaurantForm(!showNewRestaurantForm)}
                className="w-full flex items-center justify-between px-4 py-3 bg-green-50 border-2 border-green-200 rounded-lg text-green-700 font-semibold hover:bg-green-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FiPlus size={20} />
                  <span>Create New Restaurant</span>
                </div>
                {showNewRestaurantForm ? <FiChevronUp size={20} /> : <FiChevronDown size={20} />}
              </button>

              {showNewRestaurantForm && (
                <div className="mt-4 bg-white rounded-lg border-2 border-green-200 p-5">
                  <h4 className="text-lg font-bold text-gray-900 mb-4">New Restaurant Details</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Restaurant Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Restaurant Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={newRestaurant.name}
                        onChange={handleNewRestaurantChange}
                        placeholder="e.g. Dragon Palace"
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-400 bg-white"
                      />
                    </div>

                    {/* Owner Select */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Owner (Restaurant Admin) *
                      </label>
                      <div className="relative">
                        <FiUser className="absolute left-3 top-3 text-gray-400" size={16} />
                        <select
                          name="ownerId"
                          value={newRestaurant.ownerId}
                          onChange={handleNewRestaurantChange}
                          className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-400 bg-white appearance-none"
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
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Address *
                      </label>
                      <LocationPickerButton
                        compact={false}
                        buttonLabel="Detect Location"
                        onLocationSelect={({ address }) => {
                          setNewRestaurant((prev) => ({ ...prev, address }));
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
                          placeholder="Restaurant address"
                          className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-400 bg-white"
                        />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Phone *
                      </label>
                      <div className="relative">
                        <FiPhone className="absolute left-3 top-3 text-gray-400" size={16} />
                        <input
                          type="tel"
                          name="phone"
                          value={newRestaurant.phone}
                          onChange={handleNewRestaurantChange}
                          placeholder="10-digit phone number"
                          maxLength={10}
                          className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-400 bg-white"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Email
                      </label>
                      <div className="relative">
                        <FiMail className="absolute left-3 top-3 text-gray-400" size={16} />
                        <input
                          type="email"
                          name="email"
                          value={newRestaurant.email}
                          onChange={handleNewRestaurantChange}
                          placeholder="restaurant@example.com"
                          className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-400 bg-white"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        name="description"
                        value={newRestaurant.description}
                        onChange={handleNewRestaurantChange}
                        placeholder="Short description"
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-400 bg-white"
                      />
                    </div>

                    {/* Prep Time, Min Order, Delivery Fee */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Prep Time (min)
                      </label>
                      <input
                        type="number"
                        name="preparationTime"
                        value={newRestaurant.preparationTime}
                        onChange={handleNewRestaurantChange}
                        min="5"
                        max="120"
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-400 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Minimum Order (₹)
                      </label>
                      <input
                        type="number"
                        name="minimumOrder"
                        value={newRestaurant.minimumOrder}
                        onChange={handleNewRestaurantChange}
                        min="0"
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-400 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Delivery Fee (₹)
                      </label>
                      <input
                        type="number"
                        name="deliveryFee"
                        value={newRestaurant.deliveryFee}
                        onChange={handleNewRestaurantChange}
                        min="0"
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-green-400 bg-white"
                      />
                    </div>
                  </div>

                  {/* Cuisine Tags */}
                  <div className="mt-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Cuisine Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {CUISINE_OPTIONS.map((cuisine) => (
                        <button
                          key={cuisine}
                          type="button"
                          onClick={() => handleCuisineToggle(cuisine)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            newRestaurant.cuisine.includes(cuisine)
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {cuisine}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clone Menu Section */}
                  <div className="mt-5 p-4 bg-purple-50 border-2 border-purple-200 rounded-lg">
                    <label className="block text-sm font-semibold text-purple-800 mb-2">
                      Clone Menu From Existing Restaurant (Optional)
                    </label>
                    <p className="text-xs text-purple-600 mb-3">
                      For chain restaurants like McDonald's, KFC etc. — copy the entire menu from an existing branch.
                    </p>

                    {/* Search filter for restaurants */}
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

                    {/* Restaurant list to pick from */}
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {/* "None" option */}
                      <button
                        type="button"
                        onClick={() => { handleCloneSourceChange(''); setCloneSearch(''); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          !newRestaurant.cloneFromId
                            ? 'bg-purple-600 text-white'
                            : 'bg-white text-gray-600 hover:bg-purple-100 border border-purple-100'
                        }`}
                      >
                        No clone — start with empty menu
                      </button>

                      {restaurants
                        .filter((r) =>
                          r.name.toLowerCase().includes(cloneSearch.toLowerCase())
                        )
                        .map((r) => {
                          const rId = r._id || r.id;
                          const isSelected = newRestaurant.cloneFromId === rId;
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
                              <span className="font-medium">{r.name}</span>
                              {isSelected && <FiCheck size={16} />}
                            </button>
                          );
                        })}
                    </div>

                    {/* Menu count preview */}
                    {newRestaurant.cloneFromId && cloneMenuCount !== null && (
                      <div className="mt-3 px-3 py-2 bg-purple-100 rounded-lg text-sm text-purple-800 font-medium">
                        {cloneMenuCount > 0
                          ? `${cloneMenuCount} menu items will be cloned to the new restaurant`
                          : 'This restaurant has no menu items yet'}
                      </div>
                    )}
                    {newRestaurant.cloneFromId && cloneMenuCount === null && (
                      <div className="mt-3 px-3 py-2 bg-purple-100 rounded-lg text-sm text-purple-600 flex items-center gap-2">
                        <FiLoader className="animate-spin" size={14} />
                        Checking menu items...
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                    <button
                      onClick={resetNewRestaurantForm}
                      disabled={savingRestaurant}
                      className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateRestaurant}
                      disabled={savingRestaurant}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 active:scale-95"
                    >
                      {savingRestaurant ? (
                        <>
                          <FiLoader className="animate-spin" size={18} />
                          Creating...
                        </>
                      ) : (
                        <>
                          <FiPlus size={18} />
                          Create & Add to Food Court
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ============================================ */}
            {/* ADD EXISTING RESTAURANT SECTION */}
            {/* ============================================ */}
            <div className="mb-8 pb-8 border-b border-orange-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Add Existing Restaurant</h3>
              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <FiSearch className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search restaurants..."
                    value={searchRestaurant}
                    onChange={(e) => setSearchRestaurant(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white"
                  />
                </div>
              </div>

              {availableRestaurants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                  {availableRestaurants.map((restaurant) => (
                    <div
                      key={restaurant._id || restaurant.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200 hover:border-orange-400 transition-colors"
                    >
                      <span className="font-medium text-gray-700">{restaurant.name}</span>
                      <button
                        onClick={() => handleAddRestaurant(restaurant._id || restaurant.id)}
                        disabled={loading}
                        className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FiPlus size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  {searchRestaurant
                    ? 'No restaurants match your search'
                    : 'All available restaurants are already added'}
                </p>
              )}
            </div>

            {/* ============================================ */}
            {/* CURRENT RESTAURANTS SECTION */}
            {/* ============================================ */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Current Restaurants ({expandedFoodCourt.restaurants?.length || 0})
              </h3>
              {expandedFoodCourt.restaurants && expandedFoodCourt.restaurants.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {expandedFoodCourt.restaurants.map((restaurant) => (
                    <div
                      key={restaurant._id || restaurant.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border-2 border-orange-200 hover:border-orange-400 transition-colors"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{restaurant.name}</p>
                        <p className="text-sm text-gray-600">{restaurant.cuisine || 'N/A'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openImportModal(restaurant)}
                          className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                          title="Import Menu"
                        >
                          <FiUpload size={18} />
                        </button>
                        <button
                          onClick={() =>
                            handleRemoveRestaurant(restaurant._id || restaurant.id)
                          }
                          disabled={loading}
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove Restaurant"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6 bg-white rounded-lg border-2 border-dashed border-orange-200">
                  No restaurants added yet
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Food Court Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[15px] border-2 border-dashed border-orange-200 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-400 to-orange-500 p-6 text-white flex items-center justify-between sticky top-0">
              <h2 className="text-2xl font-bold">
                {editingId ? 'Edit Food Court' : 'Create Food Court'}
              </h2>
              <button
                onClick={handleCloseModal}
                disabled={loading}
                className="p-2 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 bg-orange-50">
              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Food Court Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleFormChange}
                    placeholder="Enter food court name"
                    className="w-full px-4 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleFormChange}
                    placeholder="Enter food court description"
                    rows="3"
                    className="w-full px-4 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white resize-none"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address *
                  </label>
                  <LocationPickerButton
                    compact={false}
                    buttonLabel="Detect Location"
                    onLocationSelect={({ address, lat, lng }) => {
                      setFormData((prev) => ({
                        ...prev,
                        address,
                        location: lat && lng ? { lat, lng } : prev.location,
                      }));
                    }}
                    className="mb-2"
                  />
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleFormChange}
                    placeholder="Enter food court address"
                    className="w-full px-4 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white"
                  />
                  {formData.location && (
                    <p className="text-xs text-green-600 mt-1">
                      Coordinates: {formData.location.lat.toFixed(4)}, {formData.location.lng.toFixed(4)}
                    </p>
                  )}
                  {!formData.location && (
                    <p className="text-xs text-amber-600 mt-1">
                      Use &quot;Detect Location&quot; to set coordinates (required)
                    </p>
                  )}
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    name="image"
                    value={formData.image}
                    onChange={handleFormChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white"
                  />
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="preview"
                      className="mt-2 w-full h-32 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = '';
                      }}
                    />
                  )}
                </div>

                {/* Logo URL */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Logo URL
                  </label>
                  <input
                    type="url"
                    name="logo"
                    value={formData.logo}
                    onChange={handleFormChange}
                    placeholder="https://example.com/logo.jpg"
                    className="w-full px-4 py-2 border-2 border-orange-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white"
                  />
                  {formData.logo && (
                    <img
                      src={formData.logo}
                      alt="logo preview"
                      className="mt-2 w-20 h-20 object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = '';
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-orange-200">
                <button
                  onClick={handleCloseModal}
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveFoodCourt}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold hover:from-orange-500 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  {loading ? (
                    <>
                      <FiLoader className="animate-spin" size={18} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave size={18} />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================== */}
      {/* IMPORT MENU MODAL */}
      {/* ============================== */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border-2 border-dashed border-green-200 rounded-[15px] shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white flex items-center justify-between sticky top-0 z-10 rounded-t-[13px]">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2"><FiUpload className="w-5 h-5" /> Import Menu</h2>
                <p className="text-green-100 text-sm mt-1">for {importTargetName}</p>
              </div>
              <button onClick={() => setShowImportModal(false)} className="p-2 hover:bg-green-600 rounded-lg transition-colors"><FiX size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-green-50/30">
              <div className="bg-white border border-green-200 rounded-[10px] p-4">
                <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  Download Template
                </h3>
                <p className="text-sm text-gray-600 mb-3">Download a CSV template with sample data.</p>
                <button onClick={downloadImportTemplate} className="bg-white border border-green-300 hover:bg-green-50 text-green-700 font-medium py-2 px-4 rounded-[10px] flex items-center gap-2 text-sm">
                  <FiDownload className="w-4 h-4" /> Download CSV Template
                </button>
              </div>

              <div className="bg-white border border-green-200 rounded-[10px] p-4">
                <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  Upload Your File
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Columns: <strong>Name</strong> (required), <strong>Price</strong> (required), Category, Description, Veg, Prep Time, Tags
                </p>
                <label className="flex items-center justify-center gap-3 w-full border-2 border-dashed border-green-300 hover:border-green-400 bg-white hover:bg-green-50/50 text-green-700 rounded-[10px] py-6 cursor-pointer transition-all">
                  <FiFileText className="w-6 h-6" />
                  <span className="font-medium">{importFileName || 'Click to select CSV file'}</span>
                  <input type="file" accept=".csv,.tsv" onChange={handleImportFile} className="hidden" />
                </label>
              </div>

              {importErrors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-[10px] p-4">
                  <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2"><FiAlertCircle className="w-4 h-4" /> Issues</h4>
                  <ul className="text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto">
                    {importErrors.map((err, i) => <li key={i}>• {err}</li>)}
                  </ul>
                </div>
              )}

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
                              <td className="p-2 text-gray-700">₹{item.price}</td>
                              <td className="p-2 text-gray-600">{item.category || 'Other'}</td>
                              <td className="p-2">
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${isVeg ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {isVeg ? 'Veg' : 'NV'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t-2 border-dashed border-green-200 p-4 bg-green-50/30 flex gap-3">
              <button onClick={() => setShowImportModal(false)} className="flex-1 px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-200 hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleImportMenu}
                disabled={importPreview.length === 0 || importLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {importLoading ? <><FiLoader className="w-5 h-5 animate-spin" /> Importing...</> : <><FiUpload className="w-5 h-5" /> Import {importPreview.length} Items</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
