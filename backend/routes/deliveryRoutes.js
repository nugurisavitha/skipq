const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/auth');
const deliveryController = require('../controllers/deliveryController');

/**
 * Delivery Person Routes - Requires delivery_admin role
 */

// All routes require authentication
router.use(authMiddleware);

// Get assigned orders
router.get('/orders', authorize('delivery_admin'), deliveryController.getAssignedOrders);

// Update delivery status and location
router.patch('/orders/:id/status', authorize('delivery_admin'), deliveryController.updateDeliveryStatus);

// Get delivery history
router.get('/history', authorize('delivery_admin'), deliveryController.getDeliveryHistory);

// Toggle availability
router.patch('/availability', authorize('delivery_admin'), deliveryController.toggleAvailability);

// Update location
router.patch('/location', authorize('delivery_admin'), deliveryController.updateLocation);

// Get delivery stats
router.get('/stats', authorize('delivery_admin'), deliveryController.getDeliveryStats);

// Get nearby delivery persons (admin only)
router.get('/nearby', authorize('admin', 'super_admin'), deliveryController.getNearbyDeliveryPersons);

module.exports = router;
