const Order = require('../models/Order');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPagination, calculateDistance } = require('../utils/helpers');

/**
 * Get assigned orders for delivery person
 * GET /api/delivery/orders?page=1&limit=10&status=out_for_delivery
 * Access: delivery_admin
 */
const getAssignedOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const { skip, limit: pageLimit } = getPagination(parseInt(page), parseInt(limit));

  const filter = { deliveryPerson: req.user.id };

  if (status) {
    filter.status = status;
  } else {
    // By default, get pending and active deliveries
    filter.status = { $in: ['confirmed', 'ready', 'out_for_delivery'] };
  }

  const orders = await Order.find(filter)
    .populate('customer', 'name email phone')
    .populate('restaurant', 'name address')
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
 * Update delivery status and location
 * PATCH /api/delivery/orders/:id/status
 * Access: delivery_admin
 */
const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, lat, lng, note } = req.body;

  const order = await Order.findById(id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  if (order.deliveryPerson?.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized',
    });
  }

  if (!['out_for_delivery', 'delivered'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status for delivery person',
    });
  }

  order.status = status;

  // Update delivery person's location if provided
  if (lat !== undefined && lng !== undefined) {
    const deliveryPerson = await User.findById(req.user.id);

    if (deliveryPerson) {
      deliveryPerson.currentLocation = {
        type: 'Point',
        coordinates: [lng, lat],
      };

      await deliveryPerson.save();
    }
  }

  order.statusHistory.push({
    status,
    timestamp: new Date(),
    note,
  });

  await order.save();

  // Emit socket event
  if (req.app.get('io')) {
    req.app.get('io').emitOrderUpdate(order._id, status);
  }

  res.status(200).json({
    success: true,
    message: 'Delivery status updated',
    data: {
      order: await order.populate('customer restaurant'),
    },
  });
});

/**
 * Get delivery history for delivery person
 * GET /api/delivery/history?page=1&limit=20
 * Access: delivery_admin
 */
const getDeliveryHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, startDate, endDate } = req.query;
  const { skip, limit: pageLimit } = getPagination(parseInt(page), parseInt(limit));

  const filter = {
    deliveryPerson: req.user.id,
    status: { $in: ['delivered', 'cancelled'] },
  };

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const orders = await Order.find(filter)
    .populate('customer', 'name email phone')
    .populate('restaurant', 'name')
    .skip(skip)
    .limit(pageLimit)
    .sort({ createdAt: -1 });

  const total = await Order.countDocuments(filter);

  // Calculate statistics
  const stats = await Order.aggregate([
    { $match: filter },
    {
      $group: {
        _id: null,
        totalDeliveries: { $sum: 1 },
        totalEarnings: { $sum: '$deliveryFee' },
        avgDeliveryTime: {
          $avg: {
            $subtract: ['$deliveredAt', '$createdAt'],
          },
        },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      orders,
      stats: stats[0] || {},
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
 * Toggle delivery person availability
 * PATCH /api/delivery/availability
 * Access: delivery_admin
 */
const toggleAvailability = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  if (user.role !== 'delivery_admin') {
    return res.status(403).json({
      success: false,
      message: 'Only delivery admins can toggle availability',
    });
  }

  user.isAvailable = !user.isAvailable;
  await user.save();

  res.status(200).json({
    success: true,
    message: `You are now ${user.isAvailable ? 'available' : 'unavailable'} for deliveries`,
    data: {
      isAvailable: user.isAvailable,
    },
  });
});

/**
 * Update delivery person location
 * PATCH /api/delivery/location
 * Access: delivery_admin
 */
const updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;

  if (lat === undefined || lng === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Please provide latitude and longitude',
    });
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      currentLocation: {
        type: 'Point',
        coordinates: [lng, lat],
      },
    },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Location updated',
    data: {
      location: user.currentLocation,
    },
  });
});

/**
 * Get nearby available delivery persons
 * GET /api/delivery/nearby?lat=xx&lng=xx&radius=5000
 * Access: admin
 */
const getNearbyDeliveryPersons = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 5000 } = req.query; // radius in meters

  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      message: 'Please provide latitude and longitude',
    });
  }

  const deliveryPersons = await User.find({
    role: 'delivery_admin',
    isActive: true,
    isAvailable: true,
    currentLocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)],
        },
        $maxDistance: parseInt(radius),
      },
    },
  }).select('name email phone currentLocation');

  res.status(200).json({
    success: true,
    data: {
      deliveryPersons,
    },
  });
});

/**
 * Get delivery person statistics
 * GET /api/delivery/stats
 * Access: delivery_admin
 */
const getDeliveryStats = asyncHandler(async (req, res) => {
  const deliveryPersonId = req.user.id;

  // Total deliveries
  const totalDeliveries = await Order.countDocuments({
    deliveryPerson: deliveryPersonId,
    status: 'delivered',
  });

  // Total earnings
  const earnings = await Order.aggregate([
    {
      $match: {
        deliveryPerson: deliveryPersonId,
        status: 'delivered',
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$deliveryFee' },
      },
    },
  ]);

  // Active orders count
  const activeOrders = await Order.countDocuments({
    deliveryPerson: deliveryPersonId,
    status: { $in: ['confirmed', 'ready', 'out_for_delivery'] },
  });

  // Average rating (if implemented)
  const avgRating = 4.5; // Placeholder

  res.status(200).json({
    success: true,
    data: {
      totalDeliveries,
      totalEarnings: earnings[0]?.total || 0,
      activeOrders,
      avgRating,
    },
  });
});

module.exports = {
  getAssignedOrders,
  updateDeliveryStatus,
  getDeliveryHistory,
  toggleAvailability,
  updateLocation,
  getNearbyDeliveryPersons,
  getDeliveryStats,
};
