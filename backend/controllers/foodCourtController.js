const FoodCourt = require('../models/FoodCourt');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPagination } = require('../utils/helpers');

/**
 * Get all food courts with filters and pagination
 * GET /api/foodcourts
 * Query params: search, page (default 1), limit (default 10)
 * Access: Public
 */
const getAllFoodCourts = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 10 } = req.query;
  const { skip, limit: pageLimit } = getPagination(parseInt(page), parseInt(limit));

  // Build filter
  const filter = { isActive: true };

  if (search) {
    filter.name = { $regex: search, $options: 'i' };
  }

  // Get food courts
  const foodCourts = await FoodCourt.find(filter)
    .populate('restaurants', 'name slug logo cuisine rating')
    .skip(skip)
    .limit(pageLimit)
    .sort({ createdAt: -1 });

  const total = await FoodCourt.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      foodCourts,
      pagination: {
        current: parseInt(page),
        total,
        count: foodCourts.length,
      },
    },
  });
});

/**
 * Get food court by ID
 * GET /api/foodcourts/:id
 * Access: Public
 */
const getFoodCourtById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const foodCourt = await FoodCourt.findById(id)
    .populate('restaurants', 'name slug logo coverImage cuisine rating totalRatings preparationTime isActive')
    .populate('manager', 'name email');

  if (!foodCourt) {
    return res.status(404).json({
      success: false,
      message: 'Food court not found',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      foodCourt,
    },
  });
});

/**
 * Get food court by slug
 * GET /api/foodcourts/slug/:slug
 * Access: Public
 */
const getFoodCourtBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const foodCourt = await FoodCourt.findOne({ slug })
    .populate('restaurants', 'name slug logo coverImage cuisine rating totalRatings preparationTime isActive')
    .populate('manager', 'name email');

  if (!foodCourt) {
    return res.status(404).json({
      success: false,
      message: 'Food court not found',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      foodCourt,
    },
  });
});

/**
 * Create new food court
 * POST /api/foodcourts
 * Access: Admin, Super Admin
 */
const createFoodCourt = asyncHandler(async (req, res) => {
  const { name, description, address, location, image, logo, restaurants, manager, tables, openingHours } = req.body;

  // Validation
  if (!name || !address || !location) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, address, and location',
    });
  }

  // Create food court
  const foodCourt = await FoodCourt.create({
    name,
    description,
    address,
    location: {
      type: 'Point',
      coordinates: [location.lng, location.lat],
    },
    image,
    logo,
    restaurants: restaurants || [],
    manager,
    tables: tables || [],
    openingHours: openingHours || [],
  });

  // Populate and return
  await foodCourt.populate('restaurants', 'name slug logo cuisine rating');
  await foodCourt.populate('manager', 'name email');

  res.status(201).json({
    success: true,
    message: 'Food court created successfully',
    data: {
      foodCourt,
    },
  });
});

/**
 * Update food court
 * PUT /api/foodcourts/:id
 * Access: Admin, Super Admin
 */
const updateFoodCourt = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, address, location, image, logo, manager, tables, openingHours } = req.body;

  const foodCourt = await FoodCourt.findById(id);

  if (!foodCourt) {
    return res.status(404).json({
      success: false,
      message: 'Food court not found',
    });
  }

  // Update fields
  if (name) foodCourt.name = name;
  if (description) foodCourt.description = description;
  if (address) foodCourt.address = address;
  if (location) {
    foodCourt.location = {
      type: 'Point',
      coordinates: [location.lng, location.lat],
    };
  }
  if (image) foodCourt.image = image;
  if (logo) foodCourt.logo = logo;
  if (manager) foodCourt.manager = manager;
  if (tables) foodCourt.tables = tables;
  if (openingHours) foodCourt.openingHours = openingHours;

  await foodCourt.save();

  // Populate and return
  await foodCourt.populate('restaurants', 'name slug logo cuisine rating');
  await foodCourt.populate('manager', 'name email');

  res.status(200).json({
    success: true,
    message: 'Food court updated successfully',
    data: {
      foodCourt,
    },
  });
});

/**
 * Delete food court (soft delete)
 * DELETE /api/foodcourts/:id
 * Access: Super Admin
 */
const deleteFoodCourt = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const foodCourt = await FoodCourt.findById(id);

  if (!foodCourt) {
    return res.status(404).json({
      success: false,
      message: 'Food court not found',
    });
  }

  // Soft delete
  foodCourt.isActive = false;
  await foodCourt.save();

  res.status(200).json({
    success: true,
    message: 'Food court deleted successfully',
    data: {
      foodCourt,
    },
  });
});

/**
 * Add restaurant to food court
 * PATCH /api/foodcourts/:id/restaurants
 * Body: { restaurantId }
 * Access: Admin, Super Admin
 */
const addRestaurant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { restaurantId } = req.body;

  if (!restaurantId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide restaurantId',
    });
  }

  const foodCourt = await FoodCourt.findById(id);

  if (!foodCourt) {
    return res.status(404).json({
      success: false,
      message: 'Food court not found',
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

  // Check if restaurant already in food court
  if (foodCourt.restaurants.includes(restaurantId)) {
    return res.status(400).json({
      success: false,
      message: 'Restaurant already in this food court',
    });
  }

  // Add restaurant
  foodCourt.restaurants.push(restaurantId);
  await foodCourt.save();

  // Populate and return
  await foodCourt.populate('restaurants', 'name slug logo cuisine rating');

  res.status(200).json({
    success: true,
    message: 'Restaurant added successfully',
    data: {
      foodCourt,
    },
  });
});

/**
 * Remove restaurant from food court
 * DELETE /api/foodcourts/:id/restaurants/:restaurantId
 * Access: Admin, Super Admin
 */
const removeRestaurant = asyncHandler(async (req, res) => {
  const { id, restaurantId } = req.params;

  const foodCourt = await FoodCourt.findById(id);

  if (!foodCourt) {
    return res.status(404).json({
      success: false,
      message: 'Food court not found',
    });
  }

  // Remove restaurant
  foodCourt.restaurants = foodCourt.restaurants.filter((rid) => rid.toString() !== restaurantId);
  await foodCourt.save();

  // Populate and return
  await foodCourt.populate('restaurants', 'name slug logo cuisine rating');

  res.status(200).json({
    success: true,
    message: 'Restaurant removed successfully',
    data: {
      foodCourt,
    },
  });
});

/**
 * Get food court menu
 * GET /api/foodcourts/:id/menu
 * Returns all menu items from all restaurants in the food court, grouped by restaurant
 * Access: Public
 */
const getFoodCourtMenu = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const foodCourt = await FoodCourt.findById(id).populate('restaurants');

  if (!foodCourt) {
    return res.status(404).json({
      success: false,
      message: 'Food court not found',
    });
  }

  // Get menu items for each restaurant
  const menuByRestaurant = [];

  for (const restaurant of foodCourt.restaurants) {
    const menuItems = await MenuItem.find({
      restaurant: restaurant._id,
      isAvailable: true,
    });

    if (menuItems.length > 0) {
      menuByRestaurant.push({
        restaurant: {
          _id: restaurant._id,
          name: restaurant.name,
          logo: restaurant.logo,
          cuisine: restaurant.cuisine,
        },
        items: menuItems,
      });
    }
  }

  res.status(200).json({
    success: true,
    data: {
      foodCourt: {
        _id: foodCourt._id,
        name: foodCourt.name,
        address: foodCourt.address,
      },
      menu: menuByRestaurant,
    },
  });
});

/**
 * Create order for food court
 * POST /api/foodcourts/:id/order
 * Body: { items: [{ menuItemId, quantity, customizations }], tableNumber, specialInstructions, paymentMethod }
 * Access: Customer
 */
const createFoodCourtOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { items, tableNumber, specialInstructions, paymentMethod } = req.body;

  // Validation
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide at least one item',
    });
  }

  if (!paymentMethod) {
    return res.status(400).json({
      success: false,
      message: 'Please specify payment method',
    });
  }

  // Get food court
  const foodCourt = await FoodCourt.findById(id).populate('restaurants');

  if (!foodCourt) {
    return res.status(404).json({
      success: false,
      message: 'Food court not found',
    });
  }

  const restaurantIds = foodCourt.restaurants.map((r) => r._id.toString());

  // Fetch all menu items and validate
  const orderItems = [];
  let subtotal = 0;
  let restaurants = new Set();

  for (const item of items) {
    const menuItem = await MenuItem.findById(item.menuItemId);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: `Menu item ${item.menuItemId} not found`,
      });
    }

    // Validate that menu item belongs to a restaurant in this food court
    if (!restaurantIds.includes(menuItem.restaurant.toString())) {
      return res.status(400).json({
        success: false,
        message: `Menu item ${menuItem.name} does not belong to any restaurant in this food court`,
      });
    }

    restaurants.add(menuItem.restaurant.toString());

    // Calculate item total with customizations
    let itemTotal = menuItem.price * item.quantity;

    if (item.customizations && Array.isArray(item.customizations)) {
      for (const customization of item.customizations) {
        if (customization.price) {
          itemTotal += customization.price * item.quantity;
        }
      }
    }

    subtotal += itemTotal;

    // Add to order items
    orderItems.push({
      menuItem: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: item.quantity,
      customizations: item.customizations || [],
      restaurantId: menuItem.restaurant,
      restaurantName: (await Restaurant.findById(menuItem.restaurant)).name,
    });
  }

  // Calculate tax (use 5% as default or average of restaurant tax rates)
  const taxRate = 5; // default 5%
  const tax = Math.round((subtotal * taxRate) / 100);
  const total = subtotal + tax;

  // Generate order number with 'FC-' prefix
  const orderNumber = `FC-${Date.now()}`;

  // Build per-restaurant status tracking
  const restaurantStatusMap = new Map();
  for (const item of orderItems) {
    const rId = item.restaurantId.toString();
    if (!restaurantStatusMap.has(rId)) {
      restaurantStatusMap.set(rId, {
        restaurantId: item.restaurantId,
        restaurantName: item.restaurantName,
        status: 'placed',
      });
    }
  }
  const restaurantStatuses = Array.from(restaurantStatusMap.values());

  // Create order
  const order = await Order.create({
    orderNumber,
    customer: req.user.id,
    foodCourt: id,
    items: orderItems,
    orderType: 'dine_in',
    subtotal,
    tax,
    total,
    paymentMethod,
    specialInstructions: specialInstructions || '',
    status: 'placed',
    paymentStatus: paymentMethod === 'cash' ? 'pending' : 'pending',
    restaurantStatuses,
  });

  // Populate and return
  await order.populate('customer', 'name email phone');

  // Notify each restaurant via Socket.IO
  try {
    const io = req.app.get('io');
    if (io && typeof io.emitNewOrder === 'function') {
      for (const rs of restaurantStatuses) {
        const restaurantItems = orderItems.filter(
          (i) => i.restaurantId.toString() === rs.restaurantId.toString()
        );
        io.emitNewOrder(rs.restaurantId.toString(), {
          orderId: order._id,
          orderNumber: order.orderNumber,
          foodCourtName: foodCourt.name,
          items: restaurantItems,
          customer: { name: req.user.name || order.customer?.name },
        });
      }
    }
  } catch (socketErr) {
    console.error('Socket notification failed:', socketErr.message);
  }

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: {
      order,
    },
  });
});

/**
 * Update per-restaurant status in a food court order
 * PATCH /api/food-courts/orders/:orderId/restaurant-status
 * Body: { restaurantId, status } â status: 'confirmed' | 'preparing' | 'ready' | 'picked_up'
 * Access: Restaurant Admin, Admin, Super Admin
 */
const updateRestaurantStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { restaurantId, status, estimatedTime } = req.body;

  if (!restaurantId || !status) {
    return res.status(400).json({
      success: false,
      message: 'restaurantId and status are required',
    });
  }

  const validStatuses = ['confirmed', 'preparing', 'ready', 'picked_up'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  if (!order.foodCourt) {
    return res.status(400).json({ success: false, message: 'This is not a food court order' });
  }

  // Find the restaurant status entry
  const rsEntry = order.restaurantStatuses.find(
    (rs) => rs.restaurantId.toString() === restaurantId
  );

  if (!rsEntry) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found in this order',
    });
  }

  // Update the status
  rsEntry.status = status;
  if (estimatedTime && (status === 'confirmed' || status === 'preparing')) {
    rsEntry.estimatedTime = parseInt(estimatedTime);
  }
  if (status === 'ready') {
    rsEntry.readyAt = new Date();
    rsEntry.estimatedTime = undefined; // Clear estimated time once ready
  }
  if (status === 'picked_up') {
    rsEntry.pickedUpAt = new Date();
  }

  // Auto-update overall order status based on restaurant statuses
  const allStatuses = order.restaurantStatuses.map((rs) => rs.status);
  if (allStatuses.every((s) => s === 'picked_up')) {
    order.status = 'completed';
  } else if (allStatuses.every((s) => s === 'ready' || s === 'picked_up')) {
    order.status = 'ready';
  } else if (allStatuses.some((s) => s === 'preparing' || s === 'ready' || s === 'picked_up')) {
    order.status = 'preparing';
  } else if (allStatuses.every((s) => s === 'confirmed' || s === 'preparing' || s === 'ready' || s === 'picked_up')) {
    order.status = 'confirmed';
  }

  await order.save();

  // Send real-time notification to customer
  try {
  const io = req.app.get('io');
  if (io) {
    // Notify the order room
    if (typeof io.emitOrderUpdate === 'function') {
    io.emitOrderUpdate(order._id.toString(), order.status, {
      restaurantId,
      restaurantName: rsEntry.restaurantName,
      restaurantStatus: status,
      estimatedTime: rsEntry.estimatedTime,
      restaurantStatuses: order.restaurantStatuses,
    });

    // If this restaurant's items are ready, send a specific "pickup ready" notification
    if (status === 'ready') {
      const customerSocketId = io.getSocketId(order.customer.toString());
      if (customerSocketId) {
        io.to(customerSocketId).emit('food_court_pickup_ready', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          restaurantName: rsEntry.restaurantName,
          restaurantId,
          message: `Your food from ${rsEntry.restaurantName} is ready for pickup at the counter!`,
        });
      }
      // Also broadcast to the order room
      io.to(`order_${order._id.toString()}`).emit('food_court_pickup_ready', {
        orderId: order._id,
        orderNumber: order.orderNumber,
        restaurantName: rsEntry.restaurantName,
        restaurantId,
        message: `Your food from ${rsEntry.restaurantName} is ready for pickup at the counter!`,
      });
    }
  }

  res.status(200).json({
    success: true,
    message: status === 'ready'
      ? `Items from ${rsEntry.restaurantName} are ready for pickup!`
      : `Status updated to ${status}`,
    data: { order },
  });
});

/**
 * Get food court orders for a specific restaurant
 * GET /api/food-courts/orders/restaurant/:restaurantId
 * Access: Restaurant Admin, Admin, Super Admin
 */
const getRestaurantFoodCourtOrders = asyncHandler(async (req, res) => {
  const { restaurantId } = req.params;
  const { status, page = 1, limit = 20 } = req.query;

  const query = {
    foodCourt: { $ne: null },
    'items.restaurantId': restaurantId,
  };

  if (status) {
    query['restaurantStatuses'] = {
      $elemMatch: { restaurantId, status },
    };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('customer', 'name email phone')
    .populate('foodCourt', 'name address');

  const total = await Order.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      orders,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / parseInt(limit)),
        count: total,
      },
    },
  });
});

/**
 * Get nearest food court to a given location
 * GET /api/food-courts/nearby?lat=xx&lng=xx&radius=500
 * radius is in meters (default 500m â i.e. user is physically inside/near the food court)
 * Access: Public
 */
const getNearbyFoodCourt = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 500 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      message: 'lat and lng query parameters are required',
    });
  }

  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  const maxDistance = parseInt(radius);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid lat/lng values',
    });
  }

  // Find active food courts near the user's coordinates
  const nearbyFoodCourts = await FoodCourt.find({
    isActive: true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude], // GeoJSON: [lng, lat]
        },
        $maxDistance: maxDistance, // meters
      },
    },
  })
    .populate('restaurants', 'name slug logo cuisine rating isActive')
    .limit(5);

  // Filter to only include active restaurants
  const results = nearbyFoodCourts.map((fc) => {
    const obj = fc.toObject();
    obj.restaurants = (obj.restaurants || []).filter((r) => r.isActive !== false);
    return obj;
  });

  res.status(200).json({
    success: true,
    data: {
      foodCourts: results,
      count: results.length,
      searchRadius: maxDistance,
    },
  });
});

module.exports = {
  getAllFoodCourts,
  getFoodCourtById,
  getFoodCourtBySlug,
  createFoodCourt,
  updateFoodCourt,
  deleteFoodCourt,
  addRestaurant,
  removeRestaurant,
  getFoodCourtMenu,
  createFoodCourtOrder,
  updateRestaurantStatus,
  getRestaurantFoodCourtOrders,
  getNearbyFoodCourt,
};
