const Razorpay = require('razorpay');
const crypto = require('crypto');

/**
 * Lazy-initialize Razorpay instance (only when actually needed)
 * Prevents crash at startup if credentials are not yet configured
 */
let _razorpayInstance = null;

const getRazorpay = () => {
  if (!_razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET ||
        process.env.RAZORPAY_KEY_ID === 'your_razorpay_key') {
      throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file.');
    }
    _razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _razorpayInstance;
};

/**
 * Create Razorpay order
 * @param {number} amount - Amount in currency units (will be converted to paise)
 * @param {string} orderId - Custom order ID from our database
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Razorpay order object
 */
const createOrder = async (amount, orderId, options = {}) => {
  try {
    const orderOptions = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: orderId,
      notes: {
        orderId: orderId,
        ...options.notes,
      },
      ...options,
    };

    const order = await getRazorpay().orders.create(orderOptions);
    return order;
  } catch (error) {
    throw new Error(`Failed to create Razorpay order: ${error.message}`);
  }
};

/**
 * Verify payment signature
 * @param {Object} paymentData - Payment data from client
 * @param {string} paymentData.razorpay_order_id - Razorpay order ID
 * @param {string} paymentData.razorpay_payment_id - Razorpay payment ID
 * @param {string} paymentData.razorpay_signature - Signature to verify
 * @returns {boolean} True if signature is valid
 */
const verifyPaymentSignature = (paymentData) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData;

    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    return expectedSignature === razorpay_signature;
  } catch (error) {
    throw new Error(`Failed to verify payment: ${error.message}`);
  }
};

/**
 * Get payment details
 * @param {string} paymentId - Razorpay payment ID
 * @returns {Promise<Object>} Payment details
 */
const getPaymentDetails = async (paymentId) => {
  try {
    const payment = await getRazorpay().payments.fetch(paymentId);
    return payment;
  } catch (error) {
    throw new Error(`Failed to fetch payment details: ${error.message}`);
  }
};

/**
 * Refund payment
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to refund (in currency units, optional - full refund if not provided)
 * @param {Object} notes - Additional notes for refund
 * @returns {Promise<Object>} Refund details
 */
const refundPayment = async (paymentId, amount = null, notes = {}) => {
  try {
    const refundOptions = {
      notes: notes,
    };

    if (amount) {
      refundOptions.amount = Math.round(amount * 100); // Convert to paise
    }

    const refund = await getRazorpay().payments.refund(paymentId, refundOptions);
    return refund;
  } catch (error) {
    throw new Error(`Failed to refund payment: ${error.message}`);
  }
};

/**
 * Get order details
 * @param {string} orderId - Razorpay order ID
 * @returns {Promise<Object>} Order details
 */
const getOrderDetails = async (orderId) => {
  try {
    const order = await getRazorpay().orders.fetch(orderId);
    return order;
  } catch (error) {
    throw new Error(`Failed to fetch order details: ${error.message}`);
  }
};

/**
 * Generate Razorpay payment link
 * @param {number} amount - Amount in currency units
 * @param {string} orderId - Custom order ID
 * @param {string} customerEmail - Customer email
 * @param {string} customerPhone - Customer phone
 * @returns {Promise<Object>} Payment link object
 */
const createPaymentLink = async (amount, orderId, customerEmail, customerPhone) => {
  try {
    const linkOptions = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      accept_partial: false,
      first_min_partial_amount: 100,
      description: `Payment for Order ${orderId}`,
      customer: {
        email: customerEmail,
        contact: customerPhone,
      },
      notify: {
        sms: true,
        email: true,
      },
      reminder_enable: true,
      notes: {
        orderId: orderId,
      },
      callback_url: `${process.env.CLIENT_URL}/payment-success`,
      callback_method: 'get',
    };

    const link = await getRazorpay().paymentLink.create(linkOptions);
    return link;
  } catch (error) {
    throw new Error(`Failed to create payment link: ${error.message}`);
  }
};

module.exports = {
  razorpay: getRazorpay,
  createOrder,
  verifyPaymentSignature,
  getPaymentDetails,
  refundPayment,
  getOrderDetails,
  createPaymentLink,
};
