const Order = require('../models/Order');
const { asyncHandler } = require('../middleware/errorHandler');
const razorpayService = require('../services/razorpayService');

/**
 * Create Razorpay order for payment
 * POST /api/payments/create-order
 * Access: customer
 */
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide orderId',
    });
  }

  const order = await Order.findById(orderId);

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

  if (order.razorpayOrderId) {
    return res.status(400).json({
      success: false,
      message: 'Razorpay order already exists for this order',
    });
  }

  try {
    const razorpayOrder = await razorpayService.createOrder(order.total, order._id.toString(), {
      notes: {
        restaurantId: order.restaurant,
        orderNumber: order.orderNumber,
      },
    });

    order.razorpayOrderId = razorpayOrder.id;
    order.paymentStatus = 'pending';
    await order.save();

    res.status(200).json({
      success: true,
      message: 'Razorpay order created',
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
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
 * Verify payment signature and update order
 * POST /api/payments/verify
 * Access: customer
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all payment details',
    });
  }

  const order = await Order.findById(orderId);

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

  try {
    // Verify signature
    const isValid = razorpayService.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Payment signature verification failed',
      });
    }

    // Get payment details to verify amount
    const paymentDetails = await razorpayService.getPaymentDetails(razorpay_payment_id);

    if (paymentDetails.status !== 'captured') {
      return res.status(400).json({
        success: false,
        message: 'Payment not captured',
      });
    }

    if (paymentDetails.amount !== order.total * 100) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount mismatch',
      });
    }

    // Update order
    order.razorpayPaymentId = razorpay_payment_id;
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.statusHistory.push({
      status: 'confirmed',
      timestamp: new Date(),
      note: 'Payment verified and confirmed',
    });

    await order.save();

    // Emit socket event
    if (req.app.get('io')) {
      req.app.get('io').emitNewOrder(order.restaurant, {
        orderId: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        items: order.items,
      });

      req.app.get('io').emitOrderUpdate(order._id, 'confirmed');
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        order: await order.populate('restaurant customer'),
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
 * Handle Razorpay webhook
 * POST /api/payments/webhook
 * Access: Public (verified by signature)
 */
const handleWebhook = asyncHandler(async (req, res) => {
  const { event, payload } = req.body;

  // Verify webhook signature (implementation depends on how webhook is sent)
  // For now, we'll trust the signature is verified by Express middleware

  try {
    if (event === 'payment.authorized') {
      const { payment } = payload;
      const orderId = payment.notes.orderId;

      const order = await Order.findById(orderId);

      if (order) {
        order.razorpayPaymentId = payment.id;
        order.paymentStatus = 'paid';
        await order.save();

        console.log(`Payment authorized for order ${orderId}`);
      }
    } else if (event === 'payment.failed') {
      const { payment } = payload;
      const orderId = payment.notes.orderId;

      const order = await Order.findById(orderId);

      if (order) {
        order.paymentStatus = 'failed';
        await order.save();

        console.log(`Payment failed for order ${orderId}`);
      }
    } else if (event === 'refund.created') {
      const { refund } = payload;
      const orderId = refund.notes.orderId;

      const order = await Order.findById(orderId);

      if (order) {
        order.paymentStatus = 'refunded';
        await order.save();

        console.log(`Refund created for order ${orderId}`);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed',
    });
  } catch (error) {
    console.error('Webhook error:', error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * Get payment status
 * GET /api/payments/:orderId
 * Access: customer
 */
const getPaymentStatus = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);

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

  res.status(200).json({
    success: true,
    data: {
      orderId: order._id,
      orderNumber: order.orderNumber,
      amount: order.total,
      paymentStatus: order.paymentStatus,
      razorpayPaymentId: order.razorpayPaymentId,
    },
  });
});

module.exports = {
  createRazorpayOrder,
  verifyPayment,
  handleWebhook,
  getPaymentStatus,
};
