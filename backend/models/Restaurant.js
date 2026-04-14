const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
  {
    // Owner and basic info
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Restaurant must have an owner'],
    },
    name: {
      type: String,
      required: [true, 'Please provide restaurant name'],
      trim: true,
      maxlength: [100, 'Restaurant name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },

    // Cuisine types
    cuisine: [
      {
        type: String,
        enum: [
          'Indian',
          'Chinese',
          'Continental',
          'Italian',
          'Mexican',
          'Thai',
          'Japanese',
          'North Indian',
          'South Indian',
          'Seafood',
          'Fast Food',
          'Bakery',
          'Desserts',
          'Beverages',
          'Other',
        ],
      },
    ],

    // Contact info
    address: {
      type: String,
      required: [true, 'Please provide restaurant address'],
    },
    phone: {
      type: String,
      required: [true, 'Please provide restaurant phone'],
      match: [/^\d{10,15}$/, 'Phone must be 10-15 digits'],
    },
    email: {
      type: String,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format'],
    },

    // Images
    logo: String,
    coverImage: String,
    images: [String],

    // Location (for geospatial queries)
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Please provide restaurant coordinates'],
      },
    },

    // Ratings
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Operating hours
    openingHours: [
      {
        day: {
          type: String,
          enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        },
        open: String, // HH:MM format
        close: String, // HH:MM format
        isClosed: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Business info
    preparationTime: {
      type: Number,
      default: 30, // in minutes
    },
    minimumOrder: {
      type: Number,
      default: 0, // no minimum order restriction
    },
    deliveryFee: {
      type: Number,
      default: 50,
    },
    taxRate: {
      type: Number,
      default: 5, // in percentage
    },

    // Bank details for payouts
    bankDetails: {
      accountName: String,
      accountNumber: String,
      ifscCode: String,
      bankName: String,
    },

    // Service modes
    selfService: {
      type: Boolean,
      default: false,
    },

    // Dine-in features
    tables: [
      {
        tableNumber: {
          type: String,
          required: true,
        },
        seats: {
          type: Number,
          required: true,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    salesRep: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    activatedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Index for geospatial queries
restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ slug: 1 });
restaurantSchema.index({ cuisine: 1 });
restaurantSchema.index({ owner: 1 });

/**
 * Generate slug from restaurant name before saving
 */
restaurantSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  next();
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
