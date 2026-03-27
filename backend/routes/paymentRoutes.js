const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const paymentController = require('../controllers/paymentController');

/**
 * Payment Routes
 */

// Create Razorpay order
router.post('/create-order', authMiddleware, paymentController.createRazorpayOrder);

// Verify payment
router.post('/verify', authMiddleware, paymentController.verifyPayment);

// Webhook (public route)
router.post('/webhook', paymentController.handleWebhook);

// Get payment status
router.get('/:orderId', authMiddleware, paymentController.getPaymentStatus);

module.exports = router;
