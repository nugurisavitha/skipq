const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    // Restaurant reference
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'MenuItem must belong to a restaurant'],
      index: true,
    },

    // Basic info
    category: {
      type: String,
      required: [true, 'Please provide item category'],
      enum: [
        'Appetizers',
        'Main Course',
        'Desserts',
        'Beverages',
        'Soups',
        'Salads',
        'Bread',
        'Rice',
        'Noodles',
        'Biryani',
        'Pizza',
        'Burger',
        'Sandwich',
        'Other',
      ],
    },
    name: {
      type: String,
      required: [true, 'Please provide item name'],
      trim: true,
      maxlength: [100, 'Item name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },

    // Pricing
    price: {
      type: Number,
      required: [true, 'Please provide item price'],
      min: [0, 'Price cannot be negative'],
    },
    discountPrice: {
      type: Number,
      min: [0, 'Discount price cannot be negative'],
      validate: {
        validator: function (value) {
          if (value && value >= this.price) {
            return false; // Invalid: discount price should be less than original price
          }
          return true;
        },
        message: 'Discount price must be less than original price',
      },
    },

    // Image
    image: String,

    // Dietary info
    isVeg: {
      type: Boolean,
      required: true,
      default: true,
    },

    // Availability
    isAvailable: {
      type: Boolean,
      default: true,
    },

    // Preparation time in minutes
    preparationTime: {
      type: Number,
      default: 15,
    },

    // Tags for filtering
    tags: [
      {
        type: String,
        enum: ['Popular', 'New', 'Bestseller', 'Spicy', 'Healthy', 'Low-Calorie'],
      },
    ],

    // Customizations/Add-ons
    customizations: [
      {
        name: {
          type: String,
          required: true, // e.g., "Size", "Spice Level", "Extra Toppings"
        },
        required: {
          type: Boolean,
          default: false,
        },
        options: [
          {
            name: {
              type: String,
              required: true, // e.g., "Small", "Medium", "Large"
            },
            price: {
              type: Number,
              default: 0,
            },
          },
        ],
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
  },
  { timestamps: true }
);

// Compound index for faster queries
menuItemSchema.index({ restaurant: 1, category: 1 });
menuItemSchema.index({ restaurant: 1, isAvailable: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
