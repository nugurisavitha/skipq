const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    match: [/^[6-9]\d{9}$/, 'Invalid phone number format'],
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['login', 'register'],
    default: 'login',
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5, // Max verification attempts
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL index — auto-deletes expired docs
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Only one active OTP per phone + purpose at a time
otpSchema.index({ phone: 1, purpose: 1 });

module.exports = mongoose.model('OTP', otpSchema);
