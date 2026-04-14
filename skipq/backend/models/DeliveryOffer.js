const mongoose = require('mongoose');

/**
 * Tracks delivery offers broadcast to agents when an order is ready.
 * One document per (order, agent) pair. Used for audit + first-accept-wins.
 */
const deliveryOfferSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Distance from agent to restaurant at time of broadcast, in km
    distanceKm: {
      type: Number,
      required: true,
      min: 0,
    },
    // Computed payout for this agent based on their rate card + trip distance
    quotedPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    // Trip distance (restaurant -> drop) in km
    tripDistanceKm: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired', 'lost'],
      default: 'pending',
      index: true,
    },
    // When the offer expires
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    respondedAt: Date,
  },
  { timestamps: true }
);

// Prevent duplicate offers for the same agent + order
deliveryOfferSchema.index({ order: 1, agent: 1 }, { unique: true });

module.exports = mongoose.model('DeliveryOffer', deliveryOfferSchema);
