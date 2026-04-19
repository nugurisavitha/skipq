const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateOrderNumber, calculateDistance, calculateDeliveryTime, getPagination } = require('../utils/helpers');
const razorpayService = require('../services/razorpayService');

/**
 * Create new order
 * POST /api/orders
 * Access: customer
 */
const createOrder = asyncHandler(async (req, res, next) => {
  const { restaurantId, items, orderType, tableNumber, scheduledFor, deliveryAddress, specialInstructions, paymentMethod, foodCourtId } = req.body;

  // Validation
  if (!restaurantId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Please provide restaurantId and items',
    });
  }

  if (!['delivery', 'takeaway', 'dine_in'].includes(orderType)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid order type',
    });
  }

  if (!['razorpay', 'cash'].includes(paymentMethod)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid payment method',
    });
  }

  // Get restaurant
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found',
    });
  }

  if (!restaurant.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Restaurant is currently closed',
    });
  }

  // For dine-in orders, validate table and scheduled time
  // Food court orders are dine_in but use counter pickup with token — no table needed
  if (orderType === 'dine_in' && !foodCourtId) {
    // Self-service restaurants don't require a table number
    // Customers order from their phone and pick up when ready
    if (!restaurant.selfService) {
      if (!tableNumber) {
        return res.status(400).json({
          success: false,
          message: 'Table number is required for dine-in orders',
        });
      }

      const table = restaurant.tables.find((t) => t.tableNumber === tableNumber);
      if (!table) {
        return res.status(404).json({
          success: false,
          message: 'Table not found',
        });
      }
    }
    // If table is provided even for self-service, validate it exists (optional)
    if (tableNumber && restaurant.tables.length > 0 && !restaurant.selfService) {
      const table = restaurant.tables.find((t) => t.tableNumber === tableNumber);
      if (!table) {
        return res.status(404).json({
          success: false,
          message: 'Table not found',
        });
      }
    }

    if (scheduledFor) {
      const now = new Date();
      const timeDiff = (scheduledFor - now) / (1000 * 60);
      if (timeDiff < 0 || timeDiff > 15) {
        return res.status(400).json({
          success: false,
          message: 'Scheduled time must be within 15 minutes',
        });
      }
    }
  } else if (orderType === 'delivery') {
    // For delivery orders, validate delivery address
    if (!deliveryAddress || !deliveryAddress.address) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required for delivery orders',
      });
    }
  }

  // Process order items
  let subtotal = 0;
  const processedItems = [];

  for (const item of items) {
    const menuItem = await MenuItem.findById(item.menuItemId);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: `Menu item ${item.menuItemId} not found`,
      });
    }

    if (!menuItem.isAvailable) {
      return res.status(400).json({
        success: false,
        message: `${menuItem.name} is currently unavailable`,
      });
    }

    // Calculate item price with customizations
    let itemPrice = menuItem.discountPrice || menuItem.price;
    let customizationPrice = 0;

    if (item.customizations && Array.isArray(item.customizations)) {
      for (const customization of item.customizations) {
        const option = menuItem.customizations
          .find((c) => c.name === customization.name)
          ?.options.find((o) => o.name === customization.option);

        if (option) {
          customizationPrice += option.price;
        }
      }
    }

    const itemTotal = (itemPrice + customizationPrice) * item.quantity;
    subtotal += itemTotal;

    processedItems.push({
      menuItem: menuItem._id,
      name: menuItem.name,
      price: itemPrice,
      quantity: item.quantity,
      customizations: item.customizations || [],
    });
  }

  // Calculate totals
  const tax = Math.round((subtotal * restaurant.taxRate) / 100);
  const deliveryFee = orderType === 'delivery' ? restaurant.deliveryFee : 0;
  // Convenience fee: Rs 10 + 18% GST = Rs 11.80
  const convenienceFee = 11.80;
  const total = subtotal + tax + deliveryFee + convenienceFee;

  // No minimum order restriction — customers can order any amount

  // Generate token number — daily counter per restaurant (resets each day)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const lastOrderToday = await Order.findOne({
    restaurant: restaurantId,
    createdAt: { $gte: todayStart },
    tokenNumber: { $ne: null },
  })
    .sort({ tokenNumber: -1 })
    .select('tokenNumber')
    .lean();
  const tokenNumber = (lastOrderToday?.tokenNumber || 0) + 1;

  // Create order
  const orderNumber = generateOrderNumber();
  const order = await Order.create({
    orderNumber,
    tokenNumber,
    customer: req.user.id,
    restaurant: restaurantId,
    items: processedItems,
    orderType,
    tableNumber: orderType === 'dine_in' ? tableNumber : undefined,
    scheduledFor: orderType === 'dine_in' ? scheduledFor : undefined,
    deliveryAddress: orderType === 'delivery' ? deliveryAddress : undefined,
    subtotal,
    tax,
    deliveryFee,
    convenienceFee,
    total,
    paymentMethod,
    specialInstructions,
    status: 'placed',
    statusHistory: [
      {
        status: 'placed',
        timestamp: new Date(),
      },
    ],
  });

  // Handle payment
  if (paymentMethod === 'razorpay') {
    try {
      const razorpayOrder = await razorpayService.createOrder(total, order._id.toString(), {
        notes: {
          restaurantId,
          orderNumber,
        },
      });

      order.razorpayOrderId = razorpayOrder.id;
      order.paymentStatus = 'pending';
      await order.save();

      return res.status(201).json({
        success: true,
        message: 'Order created. Proceed to payment.',
        data: {
          order: await order.populate('restaurant customer'),
          razorpayOrderId: razorpayOrder.id,
          razorpayKeyId: process.env.RAZORPAY_KEY_ID,
        },
      });
    } catch (error) {
      // Delete order if payment creation fails
      await Order.findByIdAndDelete(order._id);

      return res.status(500).json({
        success: false,
        message: `Failed to create payment: ${error.message}`,
      });
    }
  } else {
    // Cash payment
    order.paymentStatus = 'pending';
    await order.save();

    // Emit socket event for new order
    try {
      const io = req.app.get('io');
      if (io && typeof io.emitNewOrder === 'function') {
        io.emitNewOrder(restaurantId, {
          orderId: order._id,
          orderNumber: order.orderNumber,
          tokenNumber: order.tokenNumber,
          total: order.total,
          items: order.items,
        });
      }
    } catch (socketErr) {
      console.error('Socket notification failed:', socketErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: {
        order: await order.populate('restaurant customer'),
      },
    });
  }
});

/**
 * Get orders
 * GET /api/orders
 * Access: All (filters based on role)
 * Query: page, limit, status, restaurantId
 */
const getOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, restaurantId } = req.query;
  const { skip, limit: pageLimit } = getPagination(parseInt(page), parseInt(limit));

  let filter = {};

  // Role-based filtering
  if (req.user.role === 'customer') {
    filter.customer = req.user.id;
  } else if (req.user.role === 'restaurant_admin') {
    const myRestaurant = await Restaurant.findOne({ owner: req.user.id }, '_id');
    filter.restaurant = restaurantId || myRestaurant?._id;
  } else if (req.user.role === 'delivery_admin') {
    filter.deliveryPerson = req.user.id;
  }

  // Status filter
  if (status) {
    filter.status = status;
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
 * Get single order
 * GET /api/orders/:id
 */
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'name email phone')
    .populate('restaurant', 'name address phone')
    .populate('items.menuItem', 'name image')
    .populate('deliveryPerson', 'name phone');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  // Check authorization
  if (
    order.customer._id.toString() !== req.user.id &&
    (await Restaurant.findOne({ _id: order.restaurant._id, owner: req.user.id })) === null &&
    order.deliveryPerson?._id.toString() !== req.user.id &&
    req.user.role !== 'admin' &&
    req.user.role !== 'super_admin'
  ) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this order',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      order,
    },
  });
});

/**
 * Update order status
 * PATCH /api/orders/:id/status
 * Access: restaurant_admin (confirmed/preparing/ready), delivery_admin (out_for_delivery/delivered), customer (cancel only)
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note, estimatedTime } = req.body;

  const order = await Order.findById(id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  // Authorization and status validation
  if (req.user.role === 'restaurant_admin') {
    const restaurant = await Restaurant.findOne({ _id: order.restaurant, owner: req.user.id });

    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (!['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status for restaurant_admin',
      });
    }
  } else if (req.user.role === 'delivery_admin') {
    if (order.deliveryPerson?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (!['out_for_delivery', 'delivered'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status for delivery_admin',
      });
    }
  } else if (req.user.role === 'customer') {
    if (order.customer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Customers can only cancel orders',
      });
    }

    if (order.status !== 'placed') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel orders in placed status',
      });
    }
  } else {
    return res.status(403).json({
      success: false,
      message: 'Not authorized',
    });
  }

  order.status = status;
  // Set estimated time if provided (restaurant admin sets this when confirming/preparing)
  if (estimatedTime && !isNaN(parseInt(estimatedTime))) {
    order.estimatedTime = parseInt(estimatedTime);
  }
  // Clear estimated time when order is ready (no longer an estimate)
  if (status === 'ready' || status === 'delivered' || status === 'completed') {
    order.estimatedTime = null;
  }
  // Note: the pre-save hook on Order model auto-pushes to statusHistory when status changes
  // We only need to add the note manually if provided
  await order.save();

  // If a note was provided, update the last history entry with the note
  if (note) {
    const lastEntry = order.statusHistory[order.statusHistory.length - 1];
    if (lastEntry) {
      lastEntry.note = note;
      await order.save();
    }
  }

  // Emit socket event with useful data for customer toast/notifications
  try {
    const io = req.app.get('io');
    if (io && typeof io.emitOrderUpdate === 'function') {
      const populatedOrder = await order.populate('restaurant', 'name selfService');
      io.emitOrderUpdate(order._id, status, {
        note,
        orderNumber: order.orderNumber,
        tokenNumber: order.tokenNumber,
        estimatedTime: order.estimatedTime,
        restaurantName: populatedOrder.restaurant?.name,
        selfService: populatedOrder.restaurant?.selfService,
        orderType: order.orderType,
        tableNumber: order.tableNumber,
      });
    }
  } catch (socketErr) {
    console.error('Socket notification failed:', socketErr.message);
  }

  // Broadcast to nearby delivery agents when a delivery order becomes ready
  try {
    if (status === 'ready' && order.orderType === 'delivery' && !order.deliveryPerson) {
      const { broadcastOrderToAgents } = require('./deliveryAgentController');
      const io = req.app.get('io');
      const count = await broadcastOrderToAgents(order, io);
      console.log(`Delivery offer broadcast to ${count} nearby agents for order ${order.orderNumber}`);
    }
  } catch (broadcastErr) {
    console.error('Agent broadcast failed:', broadcastErr.message);
  }

  res.status(200).json({
    success: true,
    message: 'Order status updated',
    data: {
      order,
    },
  });
});

/**
 * Assign delivery person
 * PATCH /api/orders/:id/assign-delivery
 * Access: admin, super_admin
 */
const assignDeliveryPerson = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { deliveryPersonId } = req.body;

  if (!deliveryPersonId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide deliveryPersonId',
    });
  }

  const order = await Order.findById(id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  // Verify delivery person exists
  const deliveryPerson = await User.findById(deliveryPersonId);

  if (!deliveryPerson || deliveryPerson.role !== 'delivery_admin') {
    return res.status(404).json({
      success: false,
      message: 'Delivery person not found or invalid role',
    });
  }

  order.deliveryPerson = deliveryPersonId;
  await order.save();

  // Emit socket event to delivery person
  try {
    const io = req.app.get('io');
    if (io && typeof io.emitOrderAssignment === 'function') {
      io.emitOrderAssignment(deliveryPersonId, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        restaurant: order.restaurant,
        deliveryAddress: order.deliveryAddress,
        total: order.total,
      });
    }
  } catch (socketErr) {
    console.error('Socket notification failed:', socketErr.message);
  }

  res.status(200).json({
    success: true,
    message: 'Delivery person assigned',
    data: {
      order: await order.populate('deliveryPerson', 'name phone'),
    },
  });
});

/**
 * Cancel order
 * PATCH /api/orders/:id/cancel
 * Access: customer (only their own orders)
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found',
    });
  }

  if (order.customer.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized',
    });
  }

  if (order.status !== 'placed') {
    return res.status(400).json({
      success: false,
      message: 'Can only cancel orders in placed status',
    });
  }

  order.status = 'cancelled';
  order.statusHistory.push({
    status: 'cancelled',
    timestamp: new Date(),
    note: 'Cancelled by customer',
  });

  // Refund if payment was made
  if (order.paymentStatus === 'paid' && order.razorpayPaymentId) {
    try {
      await razorpayService.refundPayment(order.razorpayPaymentId, order.total, {
        orderId: order._id,
      });

      order.paymentStatus = 'refunded';
    } catch (error) {
      console.error('Refund error:', error);
    }
  }

  await order.save();

  // Emit socket event
  try {
    const io = req.app.get('io');
    if (io && typeof io.emitOrderUpdate === 'function') {
      io.emitOrderUpdate(order._id, 'cancelled');
    }
  } catch (socketErr) {
    console.error('Socket notification failed:', socketErr.message);
  }

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully',
    data: {
      order,
    },
  });
});

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  assignDeliveryPerson,
  cancelOrder,
};
