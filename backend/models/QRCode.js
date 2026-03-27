const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema(
  {
    // Restaurant and table reference
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'QR Code must belong to a restaurant'],
      index: true,
    },
    tableNumber: {
      type: String,
      default: null,
    },

    // QR type: 'dine_in' (table-specific) or 'restaurant' (general restaurant QR)
    qrType: {
      type: String,
      enum: ['dine_in', 'restaurant'],
      default: 'dine_in',
    },

    // QR Code data
    qrCodeUrl: {
      type: String,
      required: [true, 'QR code URL is required'],
    },
    qrCodeData: {
      type: String,
      required: [true, 'QR code data is required'],
      // This typically stores the deep link URL like:
      // https://skipq.com/scan?restaurant={restaurantId}&table={tableNumber}
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Analytics
    scanCount: {
      type: Number,
      default: 0,
    },
    lastScannedAt: Date,

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Unique constraint on restaurant + table number + qrType
// For restaurant-only QR, tableNumber is null so only one per restaurant
qrCodeSchema.index(
  { restaurant: 1, tableNumber: 1, qrType: 1 },
  { unique: true, partialFilterExpression: { tableNumber: { $ne: null } } }
);
// Ensure only one restaurant-only QR per restaurant
qrCodeSchema.index(
  { restaurant: 1, qrType: 1 },
  { unique: true, partialFilterExpression: { qrType: 'restaurant' } }
);

module.exports = mongoose.model('QRCode', qrCodeSchema);
