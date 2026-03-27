const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    // Order identification
    orderNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },

    // Token number — short daily counter per restaurant for pickup/self-service
    tokenNumber: {
      type: Number,
      default: null,
    },

    // References
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Order must belong to a customer'],
      index: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      index: true,
    },

    // Food Court reference (for multi-restaurant orders)
    foodCourt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodCourt',
      index: true,
    },

    // Order items (each item tracks its restaurant for food court orders)
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'MenuItem',
        },
        name: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        customizations: [
          {
            name: String,
            option: String,
            price: Number,
          },
        ],
        // For food court orders — track which restaurant each item belongs to
        restaurantId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Restaurant',
        },
        restaurantName: String,
      },
    ],

    // Order type
    orderType: {
      type: String,
      enum: ['delivery', 'takeaway', 'dine_in'],
      required: [true, 'Please specify order type'],
    },

    // For dine-in orders
    tableNumber: {
      type: String,
    },
    scheduledFor: {
      type: Date,
      validate: {
        validator: function (value) {
          // For dine_in orders, validate it's within 15 mins to restaurant opening
          if (this.orderType === 'dine_in' && value) {
            const now = new Date();
            const timeDiff = (value - now) / (1000 * 60); // difference in minutes
            return timeDiff >= 0 && timeDiff <= 15;
          }
          return true;
        },
        message: 'Scheduled time must be within 15 minutes for dine-in orders',
      },
    },

    // Pricing
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },

    // Payment
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'cash'],
      required: [true, 'Please specify payment method'],
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,

    // Order status
    status: {
      type: String,
      enum: ['placed', 'confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'completed', 'cancelled'],
      default: 'placed',
      index: true,
    },

    // Status history for tracking
    statusHistory: [
      {
        status: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        note: String,
      },
    ],

    // Delivery info
    deliveryAddress: {
      address: String,
      lat: Number,
      lng: Number,
    },
    deliveryPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    estimatedDeliveryTime: Date,

    // Estimated preparation time in minutes (set by restaurant admin)
    estimatedTime: {
      type: Number,
      default: null,
      min: 1,
      max: 120,
    },

    // Special instructions
    specialInstructions: {
      type: String,
      maxlength: [300, 'Special instructions cannot exceed 300 characters'],
    },

    // Per-restaurant status tracking (for food court orders)
    restaurantStatuses: [
      {
        restaurantId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Restaurant',
        },
        restaurantName: String,
        status: {
          type: String,
          enum: ['placed', 'confirmed', 'preparing', 'ready', 'picked_up'],
          default: 'placed',
        },
        estimatedTime: {
          type: Number, // in minutes
          min: 1,
          max: 120,
        },
        readyAt: Date,
        pickedUpAt: Date,
      },
    ],

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound indices for common queries
orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, createdAt: -1 });
orderSchema.index({ deliveryPerson: 1, status: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ foodCourt: 1, createdAt: -1 });

/**
 * Add status to history when status changes
 */
orderSchema.pre('save', async function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
    });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
