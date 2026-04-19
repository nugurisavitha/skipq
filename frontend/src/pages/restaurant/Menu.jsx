import React, { useEffect, useState, useCallback } from 'react';
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiToggleLeft,
  FiToggleRight,
  FiSearch,
  FiX,
  FiAlertCircle,
  FiLoader,
  FiImage,
  FiCopy,
  FiCheck,
  FiUpload,
  FiDownload,
  FiFileText,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { menuAPI, restaurantsAPI } from '../../services/api';

// Match backend MenuItem model enum exactly
const CATEGORIES = [
  'Appetizers',
  'Main Course',
  'Desserts',
  'Beverages',
  'Soups',
  'Salads',
  'Bread',
  'Rice',
  'Noodles',
  'Biryani',
  'Pizza',
  'Burger',
  'Sandwich',
  'Other',
];

export default function Menu() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discountPrice: '',
    category: 'Appetizers',
    isVeg: true,
    preparationTime: '30',
    image: '',
    customizations: [],
    tags: '',
  });
  const [newCustomization, setNewCustomization] = useState({
    name: '',
    required: false,
    options: [],
  });
  const [newOption, setNewOption] = useState({ name: '', price: '0' });

  // Clone menu state
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneSearch, setCloneSearch] = useState('');
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [cloneSourceId, setCloneSourceId] = useState(null);
  const [cloneSourceName, setCloneSourceName] = useState('');
  const [cloneMenuCount, setCloneMenuCount] = useState(null);
  const [cloneLoading, setCloneLoading] = useState(false);
  const [fetchingRestaurants, setFetchingRestaurants] = useState(false);

  // Import menu state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importFileName, setImportFileName] = useState('');

  // Fetch restaurant first, then menu items
  const fetchMenuItems = useCallback(async () => {
    try {
      setLoading(true);

      // Get restaurant for this admin
      const restaurantRes = await restaurantsAPI.getMine();
      const restaurant =
        restaurantRes.data?.data?.restaurant ||
        restaurantRes.data?.data ||
        restaurantRes.data;
      const restId = restaurant?._id || restaurant?.id;
      setRestaurantId(restId);

      if (!restId) {
        toast.error('No restaurant found for your account');
        setLoading(false);
        return;
      }

      // Fetch menu items - pass includeUnavailable for admin view
      const response = await menuAPI.getByRestaurant(restId, true);
      const items =
        response.data?.data?.menuItems ||
        response.data?.data ||
        response.data ||
        [];
      setMenuItems(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error('Error fetching menu:', error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  // Filter items
  useEffect(() => {
    let filtered = menuItems;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    setFilteredItems(filtered);
  }, [menuItems, selectedCategory, searchQuery]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      discountPrice: '',
      category: 'Appetizers',
      isVeg: true,
      preparationTime: '30',
      image: '',
      customizations: [],
      tags: '',
    });
    setNewCustomization({ name: '', required: false, options: [] });
    setNewOption({ name: '', price: '0' });
    setEditingItem(null);
  };

  const openModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price,
        discountPrice: item.discountPrice || '',
        category: item.category,
        isVeg: item.isVeg !== undefined ? item.isVeg : true,
        preparationTime: item.preparationTime || '30',
        image: item.image || '',
        customizations: item.customizations || [],
        tags: item.tags?.join(', ') || '',
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

  const addCustomizationOption = () => {
    if (!newOption.name.trim()) {
      toast.error('Option name is required');
      return;
    }

    setNewCustomization((prev) => ({
      ...prev,
      options: [...prev.options, { ...newOption, price: parseFloat(newOption.price) || 0 }],
    }));
    setNewOption({ name: '', price: '0' });
  };

  const addCustomization = () => {
    if (!newCustomization.name.trim()) {
      toast.error('Customization group name is required');
      return;
    }
    if (newCustomization.options.length === 0) {
      toast.error('Add at least one option to the customization');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      customizations: [...prev.customizations, newCustomization],
    }));
    setNewCustomization({ name: '', required: false, options: [] });
  };

  const removeCustomization = (index) => {
    setFormData((prev) => ({
      ...prev,
      customizations: prev.customizations.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price) {
      toast.error('Name and price are required');
      return;
    }

    if (!restaurantId) {
      toast.error('Restaurant not found');
      return;
    }

    try {
      setSubmitLoading(true);
      const payload = {
        restaurantId,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice
          ? parseFloat(formData.discountPrice)
          : null,
        category: formData.category,
        isVeg: formData.isVeg,
        preparationTime: parseInt(formData.preparationTime),
        image: formData.image,
        customizations: formData.customizations,
        tags: formData.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      };

      if (editingItem) {
        const itemId = editingItem._id || editingItem.id;
        await menuAPI.update(itemId, payload);
        toast.success('Menu item updated successfully');
      } else {
        await menuAPI.create(payload);
        toast.success('Menu item added successfully');
      }

      closeModal();
      fetchMenuItems();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast.error(error.response?.data?.message || 'Failed to save menu item');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleAvailability = async (itemId) => {
    try {
      await menuAPI.toggleAvailability(itemId);
      setMenuItems((prev) =>
        prev.map((item) =>
          item._id === itemId
            ? { ...item, isAvailable: !item.isAvailable }
            : item,
        ),
      );
      toast.success('Availability updated');
    } catch (error) {
      console.error('Error toggling availability:', error);
      toast.error('Failed to update availability');
    }
  };

  const handleDelete = async (itemId) => {
    try {
      await menuAPI.delete(itemId);
      setMenuItems((prev) => prev.filter((item) => item._id !== itemId));
      setDeleteConfirm(null);
      toast.success('Menu item deleted');
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast.error('Failed to delete menu item');
    }
  };

  // Open clone modal and fetch restaurants
  const openCloneModal = async () => {
    setShowCloneModal(true);
    setCloneSearch('');
    setCloneSourceId(null);
    setCloneSourceName('');
    setCloneMenuCount(null);

    if (allRestaurants.length === 0) {
      try {
        setFetchingRestaurants(true);
        const res = await restaurantsAPI.getAll({ limit: 200 });
        const restaurants =
          res.data?.data?.restaurants ||
          res.data?.data ||
          res.data ||
          [];
        // Filter out current restaurant
        setAllRestaurants(
          Array.isArray(restaurants)
            ? restaurants.filter((r) => (r._id || r.id) !== restaurantId)
            : [],
        );
      } catch (err) {
        console.error('Error fetching restaurants:', err);
        toast.error('Failed to load restaurants');
      } finally {
        setFetchingRestaurants(false);
      }
    }
  };

  // When a clone source is selected, fetch its menu count
  const handleCloneSourceSelect = async (restaurant) => {
    const id = restaurant._id || restaurant.id;
    setCloneSourceId(id);
    setCloneSourceName(restaurant.name);
    try {
      const res = await menuAPI.getByRestaurant(id);
      const items = res.data?.data?.menuItems || res.data?.data || res.data || [];
      setCloneMenuCount(Array.isArray(items) ? items.length : 0);
    } catch {
      setCloneMenuCount(null);
    }
  };

  // Execute clone
  const handleCloneMenu = async () => {
    if (!cloneSourceId || !restaurantId) return;

    try {
      setCloneLoading(true);
      const res = await menuAPI.cloneMenu(cloneSourceId, restaurantId);
      const count = res.data?.data?.clonedCount || 0;
      toast.success(`Successfully cloned ${count} menu items!`);
      setShowCloneModal(false);
      fetchMenuItems(); // Refresh menu
    } catch (error) {
      console.error('Error cloning menu:', error);
      toast.error(error.response?.data?.message || 'Failed to clone menu');
    } finally {
      setCloneLoading(false);
    }
  };

  // Filter restaurants for clone search
  const filteredCloneRestaurants = allRestaurants.filter((r) =>
    r.name?.toLowerCase().includes(cloneSearch.toLowerCase()),
  );

  // ===== IMPORT MENU HELPERS =====

  // Parse CSV text into array of objects
  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];

    // Parse header row - handle quoted fields
    const parseRow = (row) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = parseRow(lines[i]);
      if (values.every((v) => !v)) continue; // skip blank rows
      const obj = {};
      headers.forEach((header, idx) => {
        obj[header] = values[idx] || '';
      });
      rows.push(obj);
    }
    return rows;
  };

  // XLSX handling — instruct user to save as CSV since no xlsx library is available
  const handleXLSXFallback = () => {
    toast.error('Please save your Excel file as CSV first, then upload the CSV.');
    return null;
  };

  // Normalize parsed row keys to match expected field names
  const normalizeRow = (row) => {
    const mapping = {
      name: ['name', 'itemname', 'item', 'menuitem', 'dish', 'dishname', 'item_name'],
      description: ['description', 'desc', 'details', 'about'],
      price: ['price', 'cost', 'amount', 'mrp', 'rate'],
      discountprice: ['discountprice', 'discount_price', 'saleprice', 'sale_price', 'offerprice', 'offer_price'],
      category: ['category', 'cat', 'type', 'section', 'menutype'],
      isveg: ['isveg', 'is_veg', 'veg', 'vegetarian', 'vegnonveg', 'veg/nonveg', 'foodtype', 'food_type'],
      preparationtime: ['preparationtime', 'preparation_time', 'preptime', 'prep_time', 'time', 'cooktime', 'cook_time'],
      image: ['image', 'imageurl', 'image_url', 'photo', 'img', 'picture'],
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

  // Handle file selection
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
          const text = evt.target.result;
          const rawRows = parseCSV(text);
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
      // Since we can't install xlsx library, instruct user to save as CSV
      setImportErrors([
        'Excel (.xlsx) files cannot be parsed directly in this environment. Please open your file in Excel or Google Sheets and save/export it as CSV, then upload the CSV file.',
      ]);
      setImportPreview([]);
    } else {
      setImportErrors(['Unsupported file type. Please upload a .csv or .xlsx file.']);
      setImportPreview([]);
    }

    // Reset the input so same file can be re-selected
    e.target.value = '';
  };

  // Execute import
  const handleImportMenu = async () => {
    if (!restaurantId || importPreview.length === 0) return;

    try {
      setImportLoading(true);
      const res = await menuAPI.bulkImport(restaurantId, importPreview);
      const data = res.data?.data || {};
      const msg = res.data?.message || `Imported ${data.importedCount || 0} items`;
      toast.success(msg, { duration: 5000 });

      if (data.errors?.length > 0) {
        setImportErrors(data.errors);
      } else {
        setShowImportModal(false);
        setImportPreview([]);
        setImportFileName('');
      }
      fetchMenuItems(); // Refresh menu
    } catch (error) {
      console.error('Import error:', error);
      toast.error(error.response?.data?.message || 'Failed to import menu');
      if (error.response?.data?.data?.errors) {
        setImportErrors(error.response.data.data.errors);
      }
    } finally {
      setImportLoading(false);
    }
  };

  // Download template
  const downloadTemplate = (format) => {
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
      .map((row) =>
        row.map((cell) => {
          // Wrap in quotes if contains comma
          if (String(cell).includes(',')) return `"${cell}"`;
          return cell;
        }).join(','),
      )
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

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-orange-50 via-white to-orange-50/30 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
              Menu Management
            </h1>
            <p className="text-gray-600 mt-2">Add and manage your restaurant menu items</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => {
                setShowImportModal(true);
                setImportPreview([]);
                setImportErrors([]);
                setImportFileName('');
              }}
              className="bg-white border-2 border-dashed border-green-300 hover:bg-green-50 text-green-700 font-medium py-2 px-5 rounded-[15px] flex items-center space-x-2 transition-all"
            >
              <FiUpload className="w-5 h-5" />
              <span>Import Menu</span>
            </button>
            <button
              onClick={openCloneModal}
              className="bg-white border-2 border-dashed border-purple-300 hover:bg-purple-50 text-purple-700 font-medium py-2 px-5 rounded-[15px] flex items-center space-x-2 transition-all"
            >
              <FiCopy className="w-5 h-5" />
              <span>Clone Menu</span>
            </button>
            <button
              onClick={() => openModal()}
              className="bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg text-white font-medium py-2 px-6 rounded-[15px] flex items-center space-x-2 transition-all"
            >
              <FiPlus className="w-5 h-5" />
              <span>Add Menu Item</span>
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-3 w-5 h-5 text-primary" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30 text-base text-gray-900"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              <button
                onClick={() => setSelectedCategory('All')}
                className={`px-4 py-2 rounded-[10px] whitespace-nowrap font-medium transition-all ${
                  selectedCategory === 'All'
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                All
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-[10px] whitespace-nowrap font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <FiLoader className="w-8 h-8 text-primary animate-spin mr-2" />
            <p className="text-gray-600">Loading menu items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FiAlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">
              {menuItems.length === 0
                ? 'No menu items yet. Create your first item!'
                : 'No items match your search.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className={`bg-white border-2 border-dashed border-orange-200 rounded-[15px] overflow-hidden hover:shadow-lg hover:border-primary transition-all shadow-sm ${
                  !item.isAvailable ? 'opacity-60' : ''
                }`}
              >
                {/* Image */}
                <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden relative">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FiImage className="w-12 h-12 text-gray-400" />
                  )}
                  {!item.isAvailable && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                        Unavailable
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                    {item.isVeg && (
                      <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                        Veg
                      </span>
                    )}
                    {!item.isVeg && (
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
                        Non-Veg
                      </span>
                    )}
                  </div>

                  {/* Category and Price */}
                  <div className="mt-3 pb-3 border-b border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">
                      {item.category}
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-lg text-gray-900">
                          ₹{item.price}
                        </span>
                        {item.discountPrice && (
                          <span className="text-sm text-gray-500 line-through ml-2">
                            ₹{item.discountPrice}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-600">
                        {item.preparationTime}min
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleAvailability(item._id)}
                      className={`p-2 rounded-[10px] transition-all ${
                        item.isAvailable
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`}
                      title={
                        item.isAvailable
                          ? 'Mark as unavailable'
                          : 'Mark as available'
                      }
                    >
                      {item.isAvailable ? (
                        <FiToggleRight className="w-5 h-5" />
                      ) : (
                        <FiToggleLeft className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openModal(item)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-[10px] transition-all"
                      >
                        <FiEdit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(item._id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-[10px] transition-all"
                      >
                        <FiTrash2 className="w-5 h-5" />
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
            <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b-2 border-dashed border-orange-200 p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">
                  {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-orange-50 rounded-[10px] transition-colors"
                >
                  <FiX className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              {/* Modal Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-900">
                    Basic Information
                  </h3>

                  <input
                    type="text"
                    placeholder="Item Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                    required
                  />

                  <textarea
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary h-24 resize-none bg-orange-50/30"
                  />

                  <div className="grid md:grid-cols-2 gap-4">
                    <input
                      type="number"
                      placeholder="Price (₹)"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          price: e.target.value,
                        }))
                      }
                      step="0.01"
                      className="px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Discount Price (₹)"
                      value={formData.discountPrice}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          discountPrice: e.target.value,
                        }))
                      }
                      step="0.01"
                      className="px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: e.target.value,
                        }))
                      }
                      className="px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      placeholder="Preparation Time (mins)"
                      value={formData.preparationTime}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          preparationTime: e.target.value,
                        }))
                      }
                      className="px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                    />
                  </div>

                  <input
                    type="url"
                    placeholder="Image URL"
                    value={formData.image}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        image: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                  />

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isVeg}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          isVeg: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="text-gray-900 font-medium">
                      This is a vegetarian item
                    </span>
                  </label>

                  <input
                    type="text"
                    placeholder="Tags (comma-separated: Popular, New, Bestseller, Spicy, Healthy, Low-Calorie)"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        tags: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-orange-50/30"
                  />
                </div>

                {/* Customizations */}
                <div className="space-y-4 pt-4 border-t border-gray-200">
                  <h3 className="font-bold text-gray-900">Customizations</h3>

                  {formData.customizations.length > 0 && (
                    <div className="space-y-2">
                      {formData.customizations.map((cust, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-medium text-gray-900">
                                {cust.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {cust.required ? 'Required' : 'Optional'} •{' '}
                                {cust.options.length} options
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeCustomization(idx)}
                              className="p-1 hover:bg-red-100 rounded transition-colors text-red-600"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            {cust.options.map((opt, optIdx) => (
                              <p key={optIdx}>
                                - {opt.name}{' '}
                                {opt.price > 0 && `+₹${opt.price}`}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-[10px] space-y-3">
                    <input
                      type="text"
                      placeholder="Customization Name (e.g., Extra Toppings)"
                      value={newCustomization.name}
                      onChange={(e) =>
                        setNewCustomization((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                    />

                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newCustomization.required}
                        onChange={(e) =>
                          setNewCustomization((prev) => ({
                            ...prev,
                            required: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-gray-900 font-medium">
                        Required
                      </span>
                    </label>

                    {newCustomization.options.length > 0 && (
                      <div className="space-y-1">
                        {newCustomization.options.map((opt, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm bg-white p-2 rounded"
                          >
                            <span>{opt.name}</span>
                            <span className="text-gray-600">
                              +₹{opt.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="grid md:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Option Name"
                          value={newOption.name}
                          onChange={(e) =>
                            setNewOption((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        />
                        <input
                          type="number"
                          placeholder="Extra Price (₹)"
                          value={newOption.price}
                          onChange={(e) =>
                            setNewOption((prev) => ({
                              ...prev,
                              price: e.target.value,
                            }))
                          }
                          step="0.01"
                          className="px-4 py-2 border-2 border-dashed border-orange-100 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addCustomizationOption}
                        className="w-full bg-white hover:bg-orange-50 border-2 border-dashed border-orange-200 text-gray-900 font-medium py-2 px-4 rounded-[10px] transition-colors"
                      >
                        Add Option
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={addCustomization}
                      disabled={
                        !newCustomization.name ||
                        newCustomization.options.length === 0
                      }
                      className="w-full bg-gradient-to-r from-primary to-primary-dark hover:shadow-lg disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-[10px] transition-all"
                    >
                      Add Customization Group
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-6 border-t-2 border-dashed border-orange-200">
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
                    {submitLoading && (
                      <FiLoader className="w-5 h-5 animate-spin" />
                    )}
                    <span>
                      {editingItem ? 'Update Item' : 'Add Item'}
                    </span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Clone Menu Modal */}
        {showCloneModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white border-2 border-dashed border-purple-200 rounded-[15px] shadow-xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 border-b-2 border-dashed border-purple-200 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-purple-800 flex items-center gap-2">
                    <FiCopy className="w-5 h-5" />
                    Clone Menu from Another Restaurant
                  </h2>
                  <p className="text-sm text-purple-600 mt-1">
                    Copy all menu items from an existing restaurant
                  </p>
                </div>
                <button
                  onClick={() => setShowCloneModal(false)}
                  className="p-2 hover:bg-purple-100 rounded-[10px] transition-colors"
                >
                  <FiX className="w-5 h-5 text-purple-600" />
                </button>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-purple-100">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 w-5 h-5 text-purple-400" />
                  <input
                    type="text"
                    placeholder="Search restaurants..."
                    value={cloneSearch}
                    onChange={(e) => setCloneSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border-2 border-dashed border-purple-200 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-purple-400 bg-purple-50/30"
                  />
                </div>
              </div>

              {/* Restaurant List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {fetchingRestaurants ? (
                  <div className="flex items-center justify-center py-8">
                    <FiLoader className="w-6 h-6 text-purple-500 animate-spin mr-2" />
                    <span className="text-gray-600">Loading restaurants...</span>
                  </div>
                ) : filteredCloneRestaurants.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {allRestaurants.length === 0
                      ? 'No other restaurants found'
                      : 'No restaurants match your search'}
                  </div>
                ) : (
                  filteredCloneRestaurants.map((r) => {
                    const id = r._id || r.id;
                    const isSelected = cloneSourceId === id;
                    return (
                      <button
                        key={id}
                        onClick={() => handleCloneSourceSelect(r)}
                        className={`w-full text-left p-3 rounded-[10px] border-2 transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-purple-500 bg-purple-50 shadow-sm'
                            : 'border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {r.logo ? (
                            <img
                              src={r.logo}
                              alt={r.name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                              <span className="text-purple-600 font-bold text-sm">
                                {r.name?.charAt(0)?.toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900">{r.name}</p>
                            <p className="text-xs text-gray-500">
                              {r.cuisine?.join(', ') || 'No cuisine listed'}
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <FiCheck className="w-5 h-5 text-purple-600" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer with selected info and clone button */}
              <div className="border-t-2 border-dashed border-purple-200 p-4 bg-purple-50/30">
                {cloneSourceId && (
                  <div className="mb-3 p-3 bg-white rounded-[10px] border border-purple-200">
                    <p className="text-sm text-gray-700">
                      Cloning from: <span className="font-semibold text-purple-700">{cloneSourceName}</span>
                    </p>
                    {cloneMenuCount !== null && (
                      <p className="text-xs text-gray-500 mt-1">
                        {cloneMenuCount} menu item{cloneMenuCount !== 1 ? 's' : ''} will be copied
                      </p>
                    )}
                    {menuItems.length > 0 && (
                      <p className="text-xs text-amber-600 mt-1 font-medium">
                        Note: Cloned items will be added to your existing {menuItems.length} item{menuItems.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCloneModal(false)}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-[10px] transition-colors border border-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCloneMenu}
                    disabled={!cloneSourceId || cloneLoading || cloneMenuCount === 0}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-[10px] transition-all flex items-center justify-center space-x-2"
                  >
                    {cloneLoading ? (
                      <>
                        <FiLoader className="w-5 h-5 animate-spin" />
                        <span>Cloning...</span>
                      </>
                    ) : (
                      <>
                        <FiCopy className="w-5 h-5" />
                        <span>Clone Menu</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Menu Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white border-2 border-dashed border-green-200 rounded-[15px] shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-dashed border-green-200 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-green-800 flex items-center gap-2">
                    <FiUpload className="w-5 h-5" />
                    Import Menu from File
                  </h2>
                  <p className="text-sm text-green-600 mt-1">
                    Upload a CSV file with your menu items
                  </p>
                </div>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-2 hover:bg-green-100 rounded-[10px] transition-colors"
                >
                  <FiX className="w-5 h-5 text-green-600" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Step 1: Download Template */}
                <div className="bg-green-50/50 border border-green-200 rounded-[10px] p-4">
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    Download Template
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Download a pre-filled template with sample data to see the expected format. Fill it with your menu items and save as CSV.
                  </p>
                  <button
                    onClick={() => downloadTemplate('csv')}
                    className="bg-white border border-green-300 hover:bg-green-50 text-green-700 font-medium py-2 px-4 rounded-[10px] flex items-center gap-2 transition-all text-sm"
                  >
                    <FiDownload className="w-4 h-4" />
                    Download CSV Template
                  </button>
                </div>

                {/* Step 2: Upload File */}
                <div className="bg-green-50/50 border border-green-200 rounded-[10px] p-4">
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    Upload Your File
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Columns: <strong>Name</strong> (required), <strong>Price</strong> (required), Category, Description, Veg (Yes/No), Preparation Time, Tags, Discount Price, Image URL
                  </p>
                  <label className="flex items-center justify-center gap-3 w-full border-2 border-dashed border-green-300 hover:border-green-400 bg-white hover:bg-green-50/50 text-green-700 rounded-[10px] py-6 cursor-pointer transition-all">
                    <FiFileText className="w-6 h-6" />
                    <span className="font-medium">
                      {importFileName || 'Click to select CSV or Excel file'}
                    </span>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls,.tsv"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Errors */}
                {importErrors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-[10px] p-4">
                    <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
                      <FiAlertCircle className="w-4 h-4" />
                      Issues Found
                    </h4>
                    <ul className="text-sm text-red-600 space-y-1 max-h-32 overflow-y-auto">
                      {importErrors.map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Step 3: Preview */}
                {importPreview.length > 0 && (
                  <div className="bg-green-50/50 border border-green-200 rounded-[10px] p-4">
                    <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      Preview ({importPreview.length} item{importPreview.length !== 1 ? 's' : ''})
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
                            <th className="text-left p-2 font-semibold text-green-800">Time</th>
                            <th className="text-left p-2 font-semibold text-green-800">Tags</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importPreview.map((item, idx) => {
                            const vegStr = item.isveg !== undefined ? String(item.isveg).toLowerCase() : 'yes';
                            const isVeg = !['false', 'no', '0', 'non-veg', 'nonveg', 'non veg', 'nv'].includes(vegStr);
                            return (
                              <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-green-50/30'}>
                                <td className="p-2 text-gray-500">{idx + 1}</td>
                                <td className="p-2 font-medium text-gray-900">{item.name}</td>
                                <td className="p-2 text-gray-700">
                                  ₹{item.price}
                                  {item.discountprice && <span className="text-xs text-green-600 ml-1">(₹{item.discountprice})</span>}
                                </td>
                                <td className="p-2 text-gray-600">{item.category || 'Other'}</td>
                                <td className="p-2">
                                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${isVeg ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {isVeg ? 'Veg' : 'Non-Veg'}
                                  </span>
                                </td>
                                <td className="p-2 text-gray-600">{item.preparationtime || '15'}m</td>
                                <td className="p-2 text-gray-500 text-xs">{item.tags || '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {menuItems.length > 0 && (
                      <p className="text-xs text-amber-600 mt-2 font-medium">
                        Note: These items will be added alongside your existing {menuItems.length} menu item{menuItems.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t-2 border-dashed border-green-200 p-4 bg-green-50/30">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-[10px] transition-colors border border-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImportMenu}
                    disabled={importPreview.length === 0 || importLoading}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-[10px] transition-all flex items-center justify-center space-x-2"
                  >
                    {importLoading ? (
                      <>
                        <FiLoader className="w-5 h-5 animate-spin" />
                        <span>Importing...</span>
                      </>
                    ) : (
                      <>
                        <FiUpload className="w-5 h-5" />
                        <span>Import {importPreview.length} Item{importPreview.length !== 1 ? 's' : ''}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white border-2 border-dashed border-orange-200 rounded-[15px] shadow-xl p-6 max-w-sm">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Delete Item?
              </h3>
              <p className="text-gray-600 mb-6">
                This action cannot be undone.
              </p>
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
