const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPagination } = require('../utils/helpers');

/**
 * Get dashboard statistics
 * GET /api/admin/dashboard
 * Access: admin, super_admin
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    // Total statistics
    const totalOrders = await Order.countDocuments();
    const totalRestaurants = await Restaurant.countDocuments({ isVerified: true });
    const totalUsers = await User.countDocuments({ role: 'customer' });
    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Revenue by month (last 12 months)
    const revenueByMonth = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);

    // Top restaurants by revenue
    const topRestaurants = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: '$restaurant',
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'restaurants',
          localField: '_id',
          foreignField: '_id',
          as: 'restaurantDetails',
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalOrders,
          totalRestaurants,
          totalUsers,
          totalRevenue: totalRevenue[0]?.total || 0,
        },
        ordersByStatus,
        revenueByMonth,
        topRestaurants,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Get all users
 * GET /api/admin/users?page=1&limit=10&role=customer
 * Access: admin, super_admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role, search } = req.query;
  const { skip, limit: pageLimit } = getPagination(parseInt(page), parseInt(limit));

  const filter = {};

  if (role) {
    filter.role = role;
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }

  const users = await User.find(filter)
    .select('-password')
    .skip(skip)
    .limit(pageLimit)
    .sort({ createdAt: -1 });

  const total = await User.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      users,
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
 * Update user role
 * PATCH /api/admin/users/:id/role
 * Access: super_admin only
 */
const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['super_admin', 'admin', 'restaurant_admin', 'delivery_admin', 'customer'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role',
    });
  }

  const user = await User.findByIdAndUpdate(id, { role }, { new: true, runValidators: true }).select('-password');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'User role updated',
    data: {
      user,
    },
  });
});

/**
 * Deactivate/Activate user
 * PATCH /api/admin/users/:id/toggle-status
 * Access: admin, super_admin
 */
const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
    data: {
      user: user.toJSON(),
    },
  });
});

/**
 * Get all orders (admin view)
 * GET /api/admin/orders?page=1&limit=10&status=placed
 * Access: admin, super_admin
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, restaurantId } = req.query;
  const { skip, limit: pageLimit } = getPagination(parseInt(page), parseInt(limit));

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (restaurantId) {
    filter.restaurant = restaurantId;
  }

  const orders = await Order.find(filter)
    .populate('customer', 'name email phone')
    .populate('restaurant', 'name')
    .populate('deliveryPerson', 'name phone')
    .skip(skip)
    .limit(pageLimit)
    .sort({ createdAt: -1 });

  const total = await Order.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      orders,
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
 * Get revenue analytics
 * GET /api/admin/analytics/revenue?startDate=2024-01-01&endDate=2024-12-31
 * Access: admin, super_admin
 */
const getRevenueAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate, restaurantId } = req.query;

  const filter = { paymentStatus: 'paid' };

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  if (restaurantId) {
    filter.restaurant = restaurantId;
  }

  // Overall revenue
  const totalRevenue = await Order.aggregate([
    { $match: filter },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);

  // Revenue breakdown by payment method
  const revenueByPaymentMethod = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$paymentMethod',
        revenue: { $sum: '$total' },
        count: { $sum: 1 },
      },
    },
  ]);

  // Revenue breakdown by order type
  const revenueByOrderType = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$orderType',
        revenue: { $sum: '$total' },
        count: { $sum: 1 },
      },
    },
  ]);

  // Average order value
  const avgOrderValue = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        avgValue: { $avg: '$total' },
        minValue: { $min: '$total' },
        maxValue: { $max: '$total' },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalRevenue: totalRevenue[0]?.total || 0,
      revenueByPaymentMethod,
      revenueByOrderType,
      avgOrderValue: avgOrderValue[0] || {},
    },
  });
});

/**
 * Get restaurant verification requests
 * GET /api/admin/restaurants/pending?page=1&limit=10
 * Access: admin, super_admin
 */
const getPendingRestaurants = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { skip, limit: pageLimit } = getPagination(parseInt(page), parseInt(limit));

  const restaurants = await Restaurant.find({ isVerified: false })
    .populate('owner', 'name email phone')
    .skip(skip)
    .limit(pageLimit)
    .sort({ createdAt: 1 });

  const total = await Restaurant.countDocuments({ isVerified: false });

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
 * Create admin user
 * POST /api/admin/create-admin
 * Access: super_admin only
 */
const createAdmin = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  // Validation
  if (!name || !email || !phone || !password || !role) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  if (!['admin', 'restaurant_admin', 'delivery_admin'].includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid role for admin creation',
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already exists',
    });
  }

  const admin = await User.create({
    name,
    email,
    phone,
    password,
    role,
    isActive: true,
    isVerified: true,
  });

  const token = admin.generateJWT();

  res.status(201).json({
    success: true,
    message: 'Admin created successfully',
    data: {
      admin: admin.toJSON(),
      token,
    },
  });
});

/**
 * Get all restaurants with computed status and stats
 * GET /api/admin/restaurants?search=&status=
 * Access: admin, super_admin
 */
const getAllAdminRestaurants = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const MenuItem = require('../models/MenuItem');

  // Build filter
  const filter = {};

  if (status === 'pending') {
    filter.isVerified = false;
    filter.isActive = true;
  } else if (status === 'active') {
    filter.isVerified = true;
    filter.isActive = true;
  } else if (status === 'inactive') {
    filter.isActive = false;
  }

  const restaurants = await Restaurant.find(filter)
    .populate('owner', 'name email phone')
    .sort({ createdAt: -1 })
    .lean();

  // Compute stats for each restaurant
  const restaurantIds = restaurants.map((r) => r._id);

  // Count menu items per restaurant
  const menuCounts = await MenuItem.aggregate([
    { $match: { restaurant: { $in: restaurantIds } } },
    { $group: { _id: '$restaurant', count: { $sum: 1 } } },
  ]);
  const menuCountMap = {};
  menuCounts.forEach((m) => { menuCountMap[m._id.toString()] = m.count; });

  // Count orders and revenue per restaurant
  const orderStats = await Order.aggregate([
    { $match: { restaurant: { $in: restaurantIds } } },
    {
      $group: {
        _id: '$restaurant',
        totalOrders: { $sum: 1 },
        revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0] } },
      },
    },
  ]);
  const orderStatsMap = {};
  orderStats.forEach((o) => { orderStatsMap[o._id.toString()] = o; });

  // Build response with computed status
  const result = restaurants.map((r) => {
    const rid = r._id.toString();
    let computedStatus = 'inactive';
    if (!r.isVerified && r.isActive) computedStatus = 'pending_verification';
    else if (r.isVerified && r.isActive) computedStatus = 'active';
    else if (!r.isActive) computedStatus = 'inactive';

    return {
      _id: r._id,
      name: r.name,
      slug: r.slug,
      ownerName: r.owner?.name || 'Unknown',
      ownerEmail: r.owner?.email || '',
      phone: r.phone || '',
      address: r.address || '',
      cuisineType: Array.isArray(r.cuisine) ? r.cuisine.join(', ') : r.cuisine || '',
      rating: r.rating || 0,
      status: computedStatus,
      isActive: r.isActive,
      isVerified: r.isVerified,
      menuItems: menuCountMap[rid] || 0,
      totalOrders: orderStatsMap[rid]?.totalOrders || 0,
      revenue: orderStatsMap[rid]?.revenue || 0,
    };
  });

  // Apply search filter on computed results
  const filtered = search
    ? result.filter(
        (r) =>
          r.name.toLowerCase().includes(search.toLowerCase()) ||
          r.ownerName.toLowerCase().includes(search.toLowerCase())
      )
    : result;

  res.status(200).json({
    success: true,
    data: {
      restaurants: filtered,
      total: filtered.length,
    },
  });
});

/**
 * Approve a restaurant (set isVerified = true)
 * POST /api/admin/restaurants/:id/approve
 * Access: admin, super_admin
 */
const approveRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found' });
  }

  restaurant.isVerified = true;
  restaurant.isActive = true;
  await restaurant.save();

  res.status(200).json({
    success: true,
    message: `Restaurant "${restaurant.name}" approved successfully`,
    data: { restaurant },
  });
});

/**
 * Reject a restaurant (set isActive = false)
 * POST /api/admin/restaurants/:id/reject
 * Access: admin, super_admin
 */
const rejectRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);

  if (!restaurant) {
    return res.status(404).json({ success: false, message: 'Restaurant not found' });
  }

  restaurant.isActive = false;
  restaurant.isVerified = false;
  await restaurant.save();

  res.status(200).json({
    success: true,
    message: `Restaurant "${restaurant.name}" rejected`,
    data: { restaurant },
  });
});

module.exports = {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  getAllOrders,
  getRevenueAnalytics,
  getPendingRestaurants,
  createAdmin,
  getAllAdminRestaurants,
  approveRestaurant,
  rejectRestaurant,
};
