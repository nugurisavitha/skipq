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



module.exports = router;
