const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/auth');
const deliveryController = require('../controllers/deliveryController');
const agent = require('../controllers/deliveryAgentController');

/**
 * Delivery Agent Routes
 * Agent signup is public; everything else requires authentication.
 */

// Public: self-signup
router.post('/signup', agent.signup);

// Admin-only agent management (placed before authMiddleware scope below? No — keep auth required)
// Everything below requires authentication
router.use(authMiddleware);

// ─── Admin endpoints (manage agents) ─────────────────────────────────────
router.get('/agents/pending', authorize('admin', 'super_admin'), agent.listPendingAgents);
router.patch('/agents/:id/approval', authorize('admin', 'super_admin'), agent.setAgentApproval);
router.get('/nearby', authorize('admin', 'super_admin'), deliveryController.getNearbyDeliveryPersons);

// ─── Agent self-service endpoints ────────────────────────────────────────
router.get('/me', authorize('delivery_admin'), agent.getMe);
router.patch('/me/rate-card', authorize('delivery_admin'), agent.updateRateCard);
router.patch('/me/online', authorize('delivery_admin'), agent.setOnline);
router.patch('/me/location', authorize('delivery_admin'), agent.updateLocation);
router.get('/me/active-trip', authorize('delivery_admin'), agent.getActiveTrip);

// Offer queue
router.get('/offers', authorize('delivery_admin'), agent.getMyOffers);
router.post('/offers/:orderId/accept', authorize('delivery_admin'), agent.acceptOffer);
router.post('/offers/:orderId/reject', authorize('delivery_admin'), agent.rejectOffer);

// Trip actions
router.post('/orders/:id/pickup', authorize('delivery_admin'), agent.markPickedUp);
router.post('/orders/:id/deliver', authorize('delivery_admin'), agent.markDelivered);

// Earnings
router.get('/earnings', authorize('delivery_admin'), agent.getEarnings);

// ─── Legacy endpoints (kept for backward compatibility) ──────────────────
router.get('/orders', authorize('delivery_admin'), deliveryController.getAssignedOrders);
router.patch('/orders/:id/status', authorize('delivery_admin'), deliveryController.updateDeliveryStatus);
router.get('/history', authorize('delivery_admin'), deliveryController.getDeliveryHistory);
router.patch('/availability', authorize('delivery_admin'), deliveryController.toggleAvailability);
router.patch('/location', authorize('delivery_admin'), deliveryController.updateLocation);
router.get('/stats', authorize('delivery_admin'), deliveryController.getDeliveryStats);


// Diagnostic endpoint for delivery agent - reports own state and recent offers
router.get('/_diag', authMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    const DeliveryOffer = require('../models/DeliveryOffer');
    const Order = require('../models/Order');
    const Restaurant = require('../models/Restaurant');
    const me = await User.findById(req.user.id).select('role approvalStatus isOnline isActive currentLocation rateCard email name');
    const offers = await DeliveryOffer.find({ agent: req.user.id }).sort({ createdAt: -1 }).limit(10).lean();
    const allOffersCount = await DeliveryOffer.countDocuments({});
    const recentDeliveryOrders = await Order.find({ orderType: 'delivery' }).sort({ createdAt: -1 }).limit(5).select('_id status orderType deliveryPerson restaurant createdAt').lean();
    const restaurantsWithGeo = await Restaurant.countDocuments({ 'location.coordinates.0': { $exists: true } });
    const restaurantsTotal = await Restaurant.countDocuments({});
    res.json({ me, offers, allOffersCount, recentDeliveryOrders, restaurantsWithGeo, restaurantsTotal, serverTime: new Date() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
