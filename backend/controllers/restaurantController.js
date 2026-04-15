const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { calculateDistance, getPagination } = require('../utils/helpers');

/**
 * Create new restaurant
 * POST /api/restaurants
 * Access: admin, super_admin
 */
const createRestaurant = asyncHandler(async (req, res) => {
  const {
    ownerId,
    name,
    description,
    cuisine,
    address,
    phone,
    email,
    location,
    preparationTime,
    minimumOrder,
    deliveryFee,
    taxRate,
  } = req.body;

  // Validation
  if (!name || !address || !phone || !ownerId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields (name, address, phone, ownerId)',
    });
  }

  // Default location to Bangalore if not provided
  const loc = location && location.lat && location.lng
    ? location
    : { lat: 12.9716, lng: 77.5946 };

  // Verify owner exists and is restaurant_admin
  const owner = await User.findById(ownerId);
  if (!owner) {
    return res.status(404).json({
      success: false,
      message: 'Owner not found',
    });
  }

  // Create restaurant
  const restaurant = await Restaurant.create({
    owner: ownerId,
    name,
    description,
    cuisine: cuisine || [],
    address,
    phone,
    email,
    location: {
      type: 'Point',
      coordinates: [loc.lng, loc.lat], // GeoJSON uses [longitude, latitude]
    },
    preparationTime,
    minimumOrder,
    deliveryFee,
    taxRate,
  });

  // Populate owner
  await restaurant.populate('owner', 'name email phone');

  res.status(201).json({
    success: true,
    message: 'Restaurant created successfully',
    data: {
      restaurant,
    },
  });
});

/**
 * Get all restaurants with filters and pagination
 * GET /api/restaurants
 * Query params: page, limit, search, cuisine, sortBy (rating/distance)
 */
const getRestaurants = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, cuisine, sortBy = 'rating', lat, lng } = req.query;
  const { skip, limit: pageLimit } = getPagination(parseInt(page), parseInt(limit));

  // Build filter
  const filter = { isActive: true, isVerified: true };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  if (cuisine) {
    filter.cuisine = { $in: cuisine.split(',') };
  }

  // Get restaurants
  let query = Restaurant.find(filter)
    .populate('owner', 'name email')
    .skip(skip)
    .limit(pageLimit);

  // Apply sorting
  if (sortBy === 'distance' && lat && lng) {
    // Sort by distance from user location
    query = Restaurant.find(filter)
      .where('location')
      .near({
        center: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        maxDistance: 50000, // 50 km
      })
      .populate('owner', 'name email')
      .skip(skip)
      .limit(pageLimit);
  } else if (sortBy === 'rating') {
    query = query.sort({ rating: -1 });
  } else {
    query = query.sort({ createdAt: -1 });
  }

  const restaurants = await query;
  const total = await Restaurant.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      restaurants,
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
 * Get single restaurant by ID
 * GET /api/restaurants/:id
 */
const getRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id).populate('owner', 'name email phone');

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      restaurant,
    },
  });
});

/**
 * Get restaurant by slug
 * GET /api/restaurants/slug/:slug
 */
const getRestaurantBySlug = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ slug: req.params.slug }).populate('owner', 'name email phone');

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      restaurant,
    },
  });
});

/**
 * Update restaurant
 * PUT /api/restaurants/:id
 * Access: restaurant_admin (owner only)
 */
const updateRestaurant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const restaurant = await Restaurant.findById(id);

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found',
    });
  }

  // Check authorization - only owner can update
  if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this restaurant',
    });
  }

  const { name, description, cuisine, cuisines, phone, email, address, location, logo, logoUrl, coverImage, coverImageUrl, preparationTime, averagePreparationTime, minimumOrder, minimumOrderAmount, deliveryFee, taxRate, openingHours, selfService, bankDetails } = req.body;

  // Update fields
  if (name) restaurant.name = name;
  if (description) restaurant.description = description;
  if (cuisine) restaurant.cuisine = cuisine;
  if (phone) restaurant.phone = phone;
  if (email) restaurant.email = email;
  if (logo) restaurant.logo = logo;
  if (coverImage) restaurant.coverImage = coverImage;
  if (preparationTime) restaurant.preparationTime = preparationTime;
  if (minimumOrder) restaurant.minimumOrder = minimumOrder;
  if (deliveryFee) restaurant.deliveryFee = deliveryFee;
  if (taxRate) restaurant.taxRate = taxRate;
  if (openingHours) restaurant.openingHours = openingHours;
  if (typeof selfService === 'boolean') restaurant.selfService = selfService;
  if (address) restaurant.address = address;
  if (location && location.coordinates && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
    restaurant.location = { type: 'Point', coordinates: [Number(location.coordinates[0]), Number(location.coordinates[1])] };
  }
  if (bankDetails) restaurant.bankDetails = bankDetails;
  if (cuisines) restaurant.cuisine = cuisines;
  if (logoUrl) restaurant.logo = logoUrl;
  if (coverImageUrl) restaurant.coverImage = coverImageUrl;
  if (averagePreparationTime) restaurant.preparationTime = averagePreparationTime;
  if (minimumOrderAmount !== undefined) restaurant.minimumOrder = minimumOrderAmount;

  await restaurant.save();

  res.status(200).json({
    success: true,
    message: 'Restaurant updated successfully',
    data: {
      restaurant,
    },
  });
});

/**
 * Toggle restaurant active status
 * PATCH /api/restaurants/:id/toggle-active
 * Access: restaurant_admin (owner), admin, super_admin
 */
const toggleActive = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const restaurant = await Restaurant.findById(id);

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found',
    });
  }

  // Check authorization
  if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'super_admin' && req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized',
    });
  }

  restaurant.isActive = !restaurant.isActive;
  await restaurant.save();

  res.status(200).json({
    success: true,
    message: `Restaurant ${restaurant.isActive ? 'activated' : 'deactivated'}`,
    data: {
      restaurant,
    },
  });
});

/**
 * Verify restaurant
 * PATCH /api/restaurants/:id/verify
 * Access: admin, super_admin
 */
const verifyRestaurant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const restaurant = await Restaurant.findById(id);

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found',
    });
  }

  restaurant.isVerified = !restaurant.isVerified;
  await restaurant.save();

  res.status(200).json({
    success: true,
    message: `Restaurant ${restaurant.isVerified ? 'verified' : 'unverified'}`,
    data: {
      restaurant,
    },
  });
});

/**
 * Get restaurant for restaurant_admin
 * GET /api/restaurants/my/restaurant
 * Access: restaurant_admin
 */
const getMyRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user.id }).populate('owner', 'name email phone');

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      restaurant,
    },
  });
});

/**
 * Manage restaurant tables
 * POST /api/restaurants/:id/tables
 * Access: restaurant_admin (owner only)
 */
const manageTables = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { action, table } = req.body; // action: add, edit, remove

  const restaurant = await Restaurant.findById(id);

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found',
    });
  }

  // Check authorization
  if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized',
    });
  }

  if (action === 'add') {
    if (!table.tableNumber || !table.seats) {
      return res.status(400).json({
        success: false,
        message: 'Please provide tableNumber and seats',
      });
    }

    restaurant.tables.push({
      tableNumber: table.tableNumber,
      seats: table.seats,
      isActive: table.isActive !== false,
    });
  } else if (action === 'edit') {
    const tableIndex = restaurant.tables.findIndex((t) => t._id.toString() === table._id);

    if (tableIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Table not found',
      });
    }

    if (table.tableNumber) restaurant.tables[tableIndex].tableNumber = table.tableNumber;
    if (table.seats) restaurant.tables[tableIndex].seats = table.seats;
    if (table.isActive !== undefined) restaurant.tables[tableIndex].isActive = table.isActive;
  } else if (action === 'remove') {
    restaurant.tables = restaurant.tables.filter((t) => t._id.toString() !== table._id);
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid action. Must be add, edit, or remove',
    });
  }

  await restaurant.save();

  res.status(200).json({
    success: true,
    message: `Table ${action}ed successfully`,
    data: {
      restaurant,
    },
  });
});

module.exports = {
  createRestaurant,
  getRestaurants,
  getRestaurant,
  getRestaurantBySlug,
  updateRestaurant,
  toggleActive,
  verifyRestaurant,
  getMyRestaurant,
  manageTables,
};
