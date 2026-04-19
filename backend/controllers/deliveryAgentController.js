const User = require('../models/User');
const Order = require('../models/Order');
const DeliveryOffer = require('../models/DeliveryOffer');
const { asyncHandler } = require('../middleware/errorHandler');
const { calculateDistance, validateEmail, validatePhone } = require('../utils/helpers');

// Radius (km) within which to broadcast offers
const BROADCAST_RADIUS_KM = parseFloat(process.env.DELIVERY_BROADCAST_RADIUS_KM || 5);
// Offer validity window in seconds
const OFFER_TTL_SECONDS = parseInt(process.env.DELIVERY_OFFER_TTL_SECONDS || 60);

/**
 * Compute expected payout from agent's rate card and trip distance
 */
const computePayout = (rateCard, tripDistanceKm) => {
  const base = rateCard?.baseFare ?? 30;
  const perKm = rateCard?.perKmRate ?? 8;
  return parseFloat((base + perKm * tripDistanceKm).toFixed(2));
};

/**
 * Self-signup for a delivery agent.
 * POST /api/delivery/signup  (public)
 * Creates a delivery_admin user with approvalStatus='pending'.
 */
const signup = asyncHandler(async (req, res) => {
  const { name, email, phone, password, vehicleType, vehicleNumber, baseFare, perKmRate } = req.body;

  if (!name || !email || !phone || !password || !vehicleType) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }
  if (!validatePhone(phone)) {
    return res.status(400).json({ success: false, message: 'Invalid phone format' });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: 'delivery_admin',
    approvalStatus: 'pending',
    vehicleType,
    vehicleNumber: vehicleNumber || '',
    rateCard: {
      baseFare: typeof baseFare === 'number' ? baseFare : 30,
      perKmRate: typeof perKmRate === 'number' ? perKmRate : 8,
    },
    isOnline: false,
    isAvailable: false,
  });

  res.status(201).json({
    success: true,
    message: 'Signup received. Your account is pending admin approval.',
    data: { user: user.toJSON() },
  });
});

/**
 * Admin: list pending agents
 * GET /api/delivery/agents/pending
 */
const listPendingAgents = asyncHandler(async (req, res) => {
  const agents = await User.find({ role: 'delivery_admin', approvalStatus: 'pending' })
    .select('-password')
    .sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: { agents } });
});

/**
 * Admin: approve/reject an agent
 * PATCH /api/delivery/agents/:id/approval  { status: 'approved'|'rejected', note?: string }
 */
const setAgentApproval = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }
  const agent = await User.findOne({ _id: req.params.id, role: 'delivery_admin' });
  if (!agent) {
    return res.status(404).json({ success: false, message: 'Agent not found' });
  }
  agent.approvalStatus = status;
  agent.approvalNote = note || '';
  if (status === 'approved') agent.isAvailable = true;
  await agent.save();
  res.status(200).json({ success: true, data: { agent: agent.toJSON() } });
});

/**
 * Get current agent's profile (self)
 * GET /api/delivery/me
 */
const getMe = asyncHandler(async (req, res) => {
  const agent = await User.findById(req.user.id).select('-password');
  if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
  res.status(200).json({ success: true, data: { agent } });
});

/**
 * Update rate card
 * PATCH /api/delivery/me/rate-card  { baseFare, perKmRate }
 */
const updateRateCard = asyncHandler(async (req, res) => {
  const { baseFare, perKmRate } = req.body;
  const update = {};
  if (typeof baseFare === 'number' && baseFare >= 0) update['rateCard.baseFare'] = baseFare;
  if (typeof perKmRate === 'number' && perKmRate >= 0) update['rateCard.perKmRate'] = perKmRate;
  if (Object.keys(update).length === 0) {
    return res.status(400).json({ success: false, message: 'Provide baseFare or perKmRate' });
  }
  const agent = await User.findByIdAndUpdate(req.user.id, { $set: update }, { new: true }).select('-password');
  res.status(200).json({ success: true, data: { agent } });
});

/**
 * Toggle online status (and update current location)
 * PATCH /api/delivery/me/online  { isOnline: bool, lat?: number, lng?: number }
 */
const setOnline = asyncHandler(async (req, res) => {
  const { isOnline, lat, lng } = req.body;
  const agent = await User.findById(req.user.id);
  if (!agent) return res.status(404).json({ success: false, message: 'Agent not found' });
  if (agent.approvalStatus !== 'approved') {
    return res.status(403).json({ success: false, message: 'Your account is not yet approved' });
  }
  agent.isOnline = !!isOnline;
  if (isOnline && typeof lat === 'number' && typeof lng === 'number') {
    agent.currentLocation = { type: 'Point', coordinates: [lng, lat] };
    agent.lastLocationUpdate = new Date();
  }
  await agent.save();
  res.status(200).json({ success: true, data: { isOnline: agent.isOnline } });
});

/**
 * Update location (live tracking ping)
 * PATCH /api/delivery/me/location  { lat, lng }
 */
const updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ success: false, message: 'lat and lng required' });
  }
  await User.findByIdAndUpdate(req.user.id, {
    $set: {
      currentLocation: { type: 'Point', coordinates: [lng, lat] },
      lastLocationUpdate: new Date(),
    },
  });

  // If agent has an active trip, broadcast location to the order room for live tracking
  const io = req.app.get('io');
  if (io) {
    const activeOrder = await Order.findOne({
      deliveryPerson: req.user.id,
      status: { $in: ['out_for_delivery'] },
    }).select('_id');
    if (activeOrder) {
      io.to(`order_${activeOrder._id}`).emit('agent_location_update', {
        orderId: activeOrder._id,
        lat,
        lng,
        timestamp: new Date(),
      });
    }
  }
  res.status(200).json({ success: true });
});

/**
 * Get pending offers for this agent
 * GET /api/delivery/offers
 */
const getMyOffers = asyncHandler(async (req, res) => {
  const now = new Date();
  const offers = await DeliveryOffer.find({
    agent: req.user.id,
    status: 'pending',
    expiresAt: { $gt: now },
  })
    .populate({
      path: 'order',
      select: 'orderNumber items deliveryAddress restaurant customer total createdAt status',
      populate: [
        { path: 'restaurant', select: 'name address location' },
        { path: 'customer', select: 'name phone' },
      ],
    })
    .sort({ createdAt: -1 });
  // Filter out offers for orders already claimed
  const visible = offers.filter((o) => o.order && !o.order.deliveryPerson);
  res.status(200).json({ success: true, data: { offers: visible } });
});

/**
 * Accept an offer (atomic first-accept-wins)
 * POST /api/delivery/offers/:orderId/accept
 */
const acceptOffer = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const agentId = req.user.id;

  // Verify this agent has a valid pending offer
  const offer = await DeliveryOffer.findOne({
    order: orderId,
    agent: agentId,
    status: 'pending',
    expiresAt: { $gt: new Date() },
  });
  if (!offer) {
    return res.status(410).json({ success: false, message: 'Offer no longer available' });
  }

  // Atomically claim the order — only succeeds if no one else has claimed it
  const claimed = await Order.findOneAndUpdate(
    { _id: orderId, deliveryPerson: null, status: { $in: ['ready', 'confirmed', 'preparing'] } },
    {
      $set: {
        deliveryPerson: agentId,
        deliveryAgentPayout: offer.quotedPrice,
        deliveryTripDistanceKm: offer.tripDistanceKm,
        status: 'out_for_delivery',
        offerAcceptedAt: new Date(),
      },
    },
    { new: true }
  ).populate('restaurant', 'name address location phone')
   .populate('customer', 'name phone');

  if (!claimed) {
    // Someone else got it
    offer.status = 'lost';
    offer.respondedAt = new Date();
    await offer.save();
    return res.status(409).json({ success: false, message: 'Order already accepted by another agent' });
  }

  offer.status = 'accepted';
  offer.respondedAt = new Date();
  await offer.save();

  // Mark all other pending offers for this order as 'lost'
  await DeliveryOffer.updateMany(
    { order: orderId, status: 'pending', _id: { $ne: offer._id } },
    { $set: { status: 'lost', respondedAt: new Date() } }
  );

  // Socket notifications: tell losing agents to remove from their queue, tell customer + restaurant
  const io = req.app.get('io');
  if (io) {
    io.emit('offer_closed', { orderId, winnerAgentId: agentId });
    io.to(`order_${orderId}`).emit('order_status_updated', {
      orderId,
      status: 'out_for_delivery',
      agentId,
      timestamp: new Date(),
    });
  }

  res.status(200).json({ success: true, data: { order: claimed, payout: offer.quotedPrice } });
});

/**
 * Reject an offer (agent passes on this one)
 * POST /api/delivery/offers/:orderId/reject
 */
const rejectOffer = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  await DeliveryOffer.updateOne(
    { order: orderId, agent: req.user.id, status: 'pending' },
    { $set: { status: 'rejected', respondedAt: new Date() } }
  );
  res.status(200).json({ success: true });
});

/**
 * Mark order picked up (from restaurant)
 * POST /api/delivery/orders/:id/pickup
 */
const markPickedUp = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, deliveryPerson: req.user.id });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  order.pickedUpAt = new Date();
  await order.save();
  const io = req.app.get('io');
  if (io) io.to(`order_${order._id}`).emit('order_status_updated', { orderId: order._id, status: 'picked_up', timestamp: new Date() });
  res.status(200).json({ success: true, data: { order } });
});

/**
 * Mark order delivered — credits agent's earnings
 * POST /api/delivery/orders/:id/deliver
 */
const markDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, deliveryPerson: req.user.id });
  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  if (order.status === 'delivered') {
    return res.status(200).json({ success: true, data: { order } });
  }
  order.status = 'delivered';
  order.deliveredAt = new Date();
  await order.save();

  // Credit agent's earnings
  await User.findByIdAndUpdate(req.user.id, {
    $inc: {
      earningsTotal: order.deliveryAgentPayout || 0,
      deliveriesCompleted: 1,
    },
  });

  const io = req.app.get('io');
  if (io) io.to(`order_${order._id}`).emit('order_status_updated', { orderId: order._id, status: 'delivered', timestamp: new Date() });

  res.status(200).json({ success: true, data: { order } });
});

/**
 * Earnings dashboard
 * GET /api/delivery/earnings
 */
const getEarnings = asyncHandler(async (req, res) => {
  const agentId = req.user.id;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - 7);
  startOfWeek.setHours(0, 0, 0, 0);

  const [today, week, agent] = await Promise.all([
    Order.aggregate([
      { $match: { deliveryPerson: require('mongoose').Types.ObjectId.createFromHexString(agentId.toString()), status: 'delivered', deliveredAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: '$deliveryAgentPayout' }, count: { $sum: 1 } } },
    ]),
    Order.aggregate([
      { $match: { deliveryPerson: require('mongoose').Types.ObjectId.createFromHexString(agentId.toString()), status: 'delivered', deliveredAt: { $gte: startOfWeek } } },
      { $group: { _id: null, total: { $sum: '$deliveryAgentPayout' }, count: { $sum: 1 } } },
    ]),
    User.findById(agentId).select('earningsTotal deliveriesCompleted rateCard'),
  ]);

  res.status(200).json({
    success: true,
    data: {
      today: today[0] || { total: 0, count: 0 },
      week: week[0] || { total: 0, count: 0 },
      lifetime: {
        total: agent?.earningsTotal || 0,
        count: agent?.deliveriesCompleted || 0,
      },
      rateCard: agent?.rateCard || { baseFare: 30, perKmRate: 8 },
    },
  });
});

/**
 * Get this agent's active trip (if any)
 * GET /api/delivery/me/active-trip
 */
const getActiveTrip = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    deliveryPerson: req.user.id,
    status: { $in: ['out_for_delivery'] },
  })
    .populate('restaurant', 'name address location phone')
    .populate('customer', 'name phone');
  res.status(200).json({ success: true, data: { order } });
});

/**
 * Internal helper: broadcast an order to nearby online agents.
 * Called by orderController when status becomes 'ready' (or at order creation if delivery).
 */
const broadcastOrderToAgents = async (order, io) => {
  try {
    const Restaurant = require('../models/Restaurant');
    const restaurant = await Restaurant.findById(order.restaurant).select('location address');
    if (!restaurant || !restaurant.location?.coordinates) {
      console.warn('broadcastOrderToAgents: restaurant has no location');
      return 0;
    }

    const [rLng, rLat] = restaurant.location.coordinates;

    // Find online, approved delivery agents within radius (2dsphere query)
    const nearbyAgents = await User.find({
      role: 'delivery_admin',
      approvalStatus: 'approved',
      isOnline: true,
      isActive: true,
      currentLocation: {
        $near: {
          $geometry: { type: 'Point', coordinates: [rLng, rLat] },
          $maxDistance: BROADCAST_RADIUS_KM * 1000,
        },
      },
    })
      .select('_id currentLocation rateCard')
      .limit(50);

    if (nearbyAgents.length === 0) {
      console.log(`No online agents near restaurant ${restaurant._id}`);
      return 0;
    }

    // Compute trip distance (restaurant -> drop) for price quotes
    let tripDistanceKm = 0;
    const drop = order.deliveryAddress;
    if (drop && typeof drop.lat === 'number' && typeof drop.lng === 'number') {
      tripDistanceKm = calculateDistance(rLat, rLng, drop.lat, drop.lng);
    }

    const expiresAt = new Date(Date.now() + OFFER_TTL_SECONDS * 1000);

    // Create offer records (one per agent)
    const offerDocs = nearbyAgents.map((a) => {
      const [aLng, aLat] = a.currentLocation.coordinates;
      const distanceKm = calculateDistance(aLat, aLng, rLat, rLng);
      const quotedPrice = computePayout(a.rateCard, tripDistanceKm);
      return {
        order: order._id,
        agent: a._id,
        distanceKm,
        tripDistanceKm,
        quotedPrice,
        status: 'pending',
        expiresAt,
      };
    });

    try {
      await DeliveryOffer.insertMany(offerDocs, { ordered: false });
    } catch (err) {
      // duplicate key errors are fine (already offered in a prior broadcast)
      if (err.code !== 11000) console.error('insertMany offers error:', err.message);
    }

    await Order.findByIdAndUpdate(order._id, { $set: { offerBroadcastAt: new Date() } });

    // Emit socket event to each agent's room
    if (io) {
      for (const a of nearbyAgents) {
        io.to(`delivery_${a._id}`).emit('new_delivery_offer', {
          orderId: order._id,
          orderNumber: order.orderNumber,
          restaurantName: restaurant.name,
          pickup: restaurant.address,
          drop: drop?.address,
          tripDistanceKm,
          quotedPrice: computePayout(a.rateCard, tripDistanceKm),
          expiresAt,
        });
      }
    }

    return nearbyAgents.length;
  } catch (err) {
    console.error('broadcastOrderToAgents error:', err);
    return 0;
  }
};

module.exports = {
  signup,
  listPendingAgents,
  setAgentApproval,
  getMe,
  updateRateCard,
  setOnline,
  updateLocation,
  getMyOffers,
  acceptOffer,
  rejectOffer,
  markPickedUp,
  markDelivered,
  getEarnings,
  getActiveTrip,
  broadcastOrderToAgents,
};
