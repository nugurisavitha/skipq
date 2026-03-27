const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

/**
 * Order Routes
 */

// All order routes require authentication
router.use(authMiddleware);

// Create order
router.post('/', authorize('customer'), orderController.createOrder);

// Get orders (filtered by role)
router.get('/', orderController.getOrders);

// Get single order
router.get('/:id', orderController.getOrder);

// Update order status
router.patch('/:id/status', orderController.updateOrderStatus);

// Assign delivery person (admin only)
router.patch('/:id/assign-delivery', authorize('admin', 'super_admin'), orderController.assignDeliveryPerson);

// Cancel order
router.patch('/:id/cancel', authorize('customer'), orderController.cancelOrder);

module.exports = router;
