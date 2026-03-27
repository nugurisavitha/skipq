const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPagination } = require('../utils/helpers');

/**
 * Create menu item
 * POST /api/menu
 * Access: restaurant_admin (owner only)
 */
const createMenuItem = asyncHandler(async (req, res) => {
  const { restaurantId, category, name, description, price, discountPrice, image, isVeg, preparationTime, tags, customizations } = req.body;

  // Validation
  if (!restaurantId || !category || !name || !price) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  // Check if restaurant exists
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found',
    });
  }

  // Check authorization - user must own the restaurant
  if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to manage menu for this restaurant',
    });
  }

  const menuItem = await MenuItem.create({
    restaurant: restaurantId,
    category,
    name,
    description,
    price,
    discountPrice,
    image,
    isVeg: isVeg !== false,
    preparationTime,
    tags,
    customizations,
  });

  res.status(201).json({
    success: true,
    message: 'Menu item created successfully',
    data: {
      menuItem,
    },
  });
});

/**
 * Get menu items for a restaurant
 * GET /api/menu?restaurantId=xxx&category=xxx&page=1&limit=10
 * Access: Public
 */
const getMenuByRestaurant = asyncHandler(async (req, res) => {
  const { restaurantId, category, page = 1, limit = 20, all } = req.query;
  const { skip, limit: pageLimit } = getPagination(parseInt(page), parseInt(limit));

  // Validation
  if (!restaurantId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide restaurantId',
    });
  }

  // If all=true (restaurant admin view), show all items including unavailable
  const filter = { restaurant: restaurantId };
  if (!all || all === 'false') {
    filter.isAvailable = true;
  }

  if (category) {
    filter.category = category;
  }

  const menuItems = await MenuItem.find(filter).skip(skip).limit(pageLimit).sort({ category: 1, name: 1 });

  const total = await MenuItem.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      menuItems,
      pagination: {
        total,
        page: parseInt(page),
        limit: pageLimit,
        pages: Math.ceil(total / pageLimit),
      },
    },
  });
});

/**
 * Get single menu item
 * GET /api/menu/:id
 */
const getMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await MenuItem.findById(req.params.id).populate('restaurant', 'name');

  if (!menuItem) {
    return res.status(404).json({
      success: false,
      message: 'Menu item not found',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      menuItem,
    },
  });
});

/**
 * Update menu item
 * PUT /api/menu/:id
 * Access: restaurant_admin (owner only)
 */
const updateMenuItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const menuItem = await MenuItem.findById(id).populate('restaurant');

  if (!menuItem) {
    return res.status(404).json({
      success: false,
      message: 'Menu item not found',
    });
  }

  // Check authorization - user must own the restaurant
  if (menuItem.restaurant.owner.toString() !== req.user.id && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this menu item',
    });
  }

  const { category, name, description, price, discountPrice, image, isVeg, preparationTime, tags, customizations } = req.body;

  // Update fields
  if (category) menuItem.category = category;
  if (name) menuItem.name = name;
  if (description) menuItem.description = description;
  if (price) menuItem.price = price;
  if (discountPrice !== undefined) menuItem.discountPrice = discountPrice;
  if (image) menuItem.image = image;
  if (isVeg !== undefined) menuItem.isVeg = isVeg;
  if (preparationTime) menuItem.preparationTime = preparationTime;
  if (tags) menuItem.tags = tags;
  if (customizations) menuItem.customizations = customizations;

  await menuItem.save();

  res.status(200).json({
    success: true,
    message: 'Menu item updated successfully',
    data: {
      menuItem,
    },
  });
});

/**
 * Delete menu item
 * DELETE /api/menu/:id
 * Access: restaurant_admin (owner only)
 */
const deleteMenuItem = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const menuItem = await MenuItem.findById(id).populate('restaurant');

  if (!menuItem) {
    return res.status(404).json({
      success: false,
      message: 'Menu item not found',
    });
  }

  // Check authorization
  if (menuItem.restaurant.owner.toString() !== req.user.id && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized',
    });
  }

  await MenuItem.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'Menu item deleted successfully',
  });
});

/**
 * Toggle menu item availability
 * PATCH /api/menu/:id/toggle-availability
 * Access: restaurant_admin (owner only)
 */
const toggleAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const menuItem = await MenuItem.findById(id).populate('restaurant');

  if (!menuItem) {
    return res.status(404).json({
      success: false,
      message: 'Menu item not found',
    });
  }

  // Check authorization
  if (menuItem.restaurant.owner.toString() !== req.user.id && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized',
    });
  }

  menuItem.isAvailable = !menuItem.isAvailable;
  await menuItem.save();

  res.status(200).json({
    success: true,
    message: `Menu item ${menuItem.isAvailable ? 'available' : 'unavailable'}`,
    data: {
      menuItem,
    },
  });
});

/**
 * Get menu categories for a restaurant
 * GET /api/menu/categories?restaurantId=xxx
 */
const getMenuCategories = asyncHandler(async (req, res) => {
  const { restaurantId } = req.query;

  if (!restaurantId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide restaurantId',
    });
  }

  const categories = await MenuItem.distinct('category', {
    restaurant: restaurantId,
    isAvailable: true,
  });

  res.status(200).json({
    success: true,
    data: {
      categories,
    },
  });
});

/**
 * Clone all menu items from one restaurant to another
 * POST /api/menu/clone
 * Body: { sourceRestaurantId, targetRestaurantId }
 * Access: admin, super_admin
 */
const cloneMenu = asyncHandler(async (req, res) => {
  const { sourceRestaurantId, targetRestaurantId } = req.body;

  if (!sourceRestaurantId || !targetRestaurantId) {
    return res.status(400).json({
      success: false,
      message: 'sourceRestaurantId and targetRestaurantId are required',
    });
  }

  if (sourceRestaurantId === targetRestaurantId) {
    return res.status(400).json({
      success: false,
      message: 'Source and target restaurants cannot be the same',
    });
  }

  // Verify both restaurants exist
  const [sourceRestaurant, targetRestaurant] = await Promise.all([
    Restaurant.findById(sourceRestaurantId),
    Restaurant.findById(targetRestaurantId),
  ]);

  if (!sourceRestaurant) {
    return res.status(404).json({ success: false, message: 'Source restaurant not found' });
  }

  if (!targetRestaurant) {
    return res.status(404).json({ success: false, message: 'Target restaurant not found' });
  }

  // Restaurant admins can only clone into their own restaurant
  if (req.user.role === 'restaurant_admin') {
    const userId = req.user.id || req.user._id;
    if (targetRestaurant.owner.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only clone menu into your own restaurant',
      });
    }
  }

  // Get all menu items from source restaurant
  const sourceMenuItems = await MenuItem.find({ restaurant: sourceRestaurantId });

  if (sourceMenuItems.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'Source restaurant has no menu items to clone',
      data: { clonedCount: 0 },
    });
  }

  // Clone each menu item for the target restaurant
  const clonedItems = sourceMenuItems.map((item) => {
    const cloned = item.toObject();
    // Remove identifiers so MongoDB creates new ones
    delete cloned._id;
    delete cloned.id;
    delete cloned.createdAt;
    delete cloned.updatedAt;
    delete cloned.__v;
    // Remove nested _id from customizations and options
    if (cloned.customizations) {
      cloned.customizations = cloned.customizations.map((c) => {
        const { _id, ...rest } = c;
        if (rest.options) {
          rest.options = rest.options.map((o) => {
            const { _id: optId, ...optRest } = o;
            return optRest;
          });
        }
        return rest;
      });
    }
    // Point to the target restaurant
    cloned.restaurant = targetRestaurantId;
    return cloned;
  });

  const created = await MenuItem.insertMany(clonedItems);

  res.status(201).json({
    success: true,
    message: `Successfully cloned ${created.length} menu items from "${sourceRestaurant.name}" to "${targetRestaurant.name}"`,
    data: {
      clonedCount: created.length,
      sourceRestaurant: sourceRestaurant.name,
      targetRestaurant: targetRestaurant.name,
    },
  });
});

/**
 * Bulk import menu items
 * POST /api/menu/import
 * Access: restaurant_admin (own restaurant), admin, super_admin
 */
const VALID_CATEGORIES = [
  'Appetizers', 'Main Course', 'Desserts', 'Beverages', 'Soups',
  'Salads', 'Bread', 'Rice', 'Noodles', 'Biryani', 'Pizza',
  'Burger', 'Sandwich', 'Other',
];

const VALID_TAGS = ['Popular', 'New', 'Bestseller', 'Spicy', 'Healthy', 'Low-Calorie'];

const bulkImportMenu = asyncHandler(async (req, res) => {
  const { restaurantId, items } = req.body;

  if (!restaurantId) {
    return res.status(400).json({ success: false, message: 'restaurantId is required' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'items array is required and must not be empty' });
  }
  if (items.length > 500) {
    return res.status(400).json({ success: false, message: 'Cannot import more than 500 items at once' });
  }

  // Verify restaurant exists
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found' });
  }

  // Ownership check for restaurant_admin
  if (req.user.role === 'restaurant_admin') {
    const userId = req.user.id || req.user._id;
    if (restaurant.owner.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only import menu to your own restaurant' });
    }
  }

  // Validate and sanitize each item
  const errors = [];
  const validItems = [];

  items.forEach((item, index) => {
    const row = index + 1;
    const itemErrors = [];

    if (!item.name || !item.name.trim()) {
      itemErrors.push(`Row ${row}: Name is required`);
    }
    if (!item.price || isNaN(parseFloat(item.price)) || parseFloat(item.price) < 0) {
      itemErrors.push(`Row ${row}: Valid price is required`);
    }

    // Normalize category
    let category = item.category?.trim() || 'Other';
    // Case-insensitive match
    const matchedCat = VALID_CATEGORIES.find(
      (c) => c.toLowerCase() === category.toLowerCase()
    );
    category = matchedCat || 'Other';

    // Normalize isVeg
    let isVeg = true;
    if (item.isVeg !== undefined && item.isVeg !== null && item.isVeg !== '') {
      const vegStr = String(item.isVeg).toLowerCase().trim();
      isVeg = !['false', 'no', '0', 'non-veg', 'nonveg', 'non veg', 'nv'].includes(vegStr);
    }

    // Parse tags
    let tags = [];
    if (item.tags) {
      const rawTags = String(item.tags).split(',').map((t) => t.trim()).filter(Boolean);
      tags = rawTags.filter((t) => VALID_TAGS.some((vt) => vt.toLowerCase() === t.toLowerCase()))
        .map((t) => VALID_TAGS.find((vt) => vt.toLowerCase() === t.toLowerCase()));
    }

    if (itemErrors.length > 0) {
      errors.push(...itemErrors);
    } else {
      validItems.push({
        restaurant: restaurantId,
        name: item.name.trim(),
        description: item.description?.trim() || '',
        price: parseFloat(item.price),
        discountPrice: item.discountPrice && parseFloat(item.discountPrice) > 0
          ? parseFloat(item.discountPrice)
          : undefined,
        category,
        isVeg,
        preparationTime: item.preparationTime ? parseInt(item.preparationTime) || 15 : 15,
        image: item.image?.trim() || undefined,
        tags,
        isAvailable: true,
      });
    }
  });

  if (errors.length > 0 && validItems.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'All items have validation errors',
      data: { errors },
    });
  }

  const created = await MenuItem.insertMany(validItems);

  res.status(201).json({
    success: true,
    message: `Successfully imported ${created.length} menu items${errors.length > 0 ? ` (${errors.length} rows skipped)` : ''}`,
    data: {
      importedCount: created.length,
      skippedCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    },
  });
});

module.exports = {
  createMenuItem,
  getMenuByRestaurant,
  getMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
  getMenuCategories,
  cloneMenu,
  bulkImportMenu,
};
