const mongoose = require('mongoose');

const foodCourtSchema = new mongoose.Schema(
  {
    // Basic info
    name: {
      type: String,
      required: [true, 'Please provide food court name'],
      trim: true,
      maxlength: [100, 'Food court name cannot exceed 100 characters'],
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

    // Contact info
    address: {
      type: String,
      required: [true, 'Please provide food court address'],
    },

    // Images
    image: String, // cover image URL
    logo: String, // logo URL

    // Location (for geospatial queries)
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, 'Please provide food court coordinates'],
      },
    },

    // Restaurants in this food court
    restaurants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
      },
    ],

    // Manager (optional)
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Dine-in tables (shared across all restaurants in the food court)
    tables: [
      {
        tableNumber: {
          type: String,
          required: [true, 'Table number is required'],
        },
        seats: {
          type: Number,
          required: [true, 'Number of seats is required'],
        },
        isActive: {
          type: Boolean,
          default: true,
        },
      },
    ],

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
  },
  { timestamps: true }
);

// Indices
foodCourtSchema.index({ slug: 1 });
foodCourtSchema.index({ location: '2dsphere' });
foodCourtSchema.index({ restaurants: 1 });

/**
 * Generate slug from food court name before saving
 */
foodCourtSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
  next();
});

module.exports = mongoose.model('FoodCourt', foodCourtSchema);
