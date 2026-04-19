const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    // Basic info
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format'],
    },
    phone: {
      type: String,
      required: [true, 'Please provide a phone number'],
      match: [/^[6-9]\d{9}$/, 'Invalid phone number format'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },

    // Role-based access
    role: {
      type: String,
      enum: ['super_admin', 'admin', 'restaurant_admin', 'delivery_admin', 'customer'],
      default: 'customer',
    },

    // Profile
    avatar: {
      type: String,
      default: null,
    },

    // Addresses for customers and delivery admins
    addresses: [
      {
        label: {
          type: String,
          enum: ['home', 'work', 'other'],
          default: 'home',
        },
        address: String,
        lat: Number,
        lng: Number,
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Additional info for delivery admin
    isAvailable: {
      type: Boolean,
      default: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    currentLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    lastLocationUpdate: {
      type: Date,
      default: null,
    },

    // Delivery agent specific fields
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved', // non-agents are auto-approved
    },
    approvalNote: {
      type: String,
      default: '',
    },
    vehicleType: {
      type: String,
      enum: ['bike', 'scooter', 'car', 'bicycle', 'other'],
    },
    vehicleNumber: {
      type: String,
      trim: true,
    },
    rateCard: {
      baseFare: {
        type: Number,
        default: 30,
        min: 0,
      },
      perKmRate: {
        type: Number,
        default: 8,
        min: 0,
      },
    },
    earningsTotal: {
      type: Number,
      default: 0,
    },
    deliveriesCompleted: {
      type: Number,
      default: 0,
    },

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

// Index for geospatial queries
userSchema.index({ currentLocation: '2dsphere' });

/**
 * Hash password before saving
 */
userSchema.pre('save', async function (next) {
  // Only hash if password is new or modified
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Compare password with hashed password
 * @param {string} enteredPassword - Password to compare
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Generate JWT token
 * @returns {string} JWT token
 */
userSchema.methods.generateJWT = function () {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

/**
 * Remove sensitive data before returning user object
 */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
