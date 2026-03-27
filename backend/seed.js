#!/usr/bin/env node

/**
 * Database Seeder Script for SkipQ App
 * Seeds the database with test data for development and testing
 *
 * Usage:
 *   npm run seed              - Seed database with all test data
 *   npm run seed -- --destroy - Clear all collections (destructive)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.blue}═══ ${msg} ═══${colors.reset}`),
};

// Models
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const MenuItem = require('./models/MenuItem');
const Order = require('./models/Order');
const QRCodeModel = require('./models/QRCode');
const FoodCourt = require('./models/FoodCourt');

// Seed data
const seedUsers = {
  superAdmin: {
    name: 'Super Admin',
    email: 'superadmin@skipq.com',
    phone: '9876543210',
    password: 'Admin@123',
    role: 'super_admin',
    isVerified: true,
    isActive: true,
  },
  admin: {
    name: 'Admin User',
    email: 'admin@skipq.com',
    phone: '9876543211',
    password: 'Admin@123',
    role: 'admin',
    isVerified: true,
    isActive: true,
  },
  restaurantAdmins: [
    {
      name: 'Raj Kumar',
      email: 'raj@spicehaven.com',
      phone: '9876543212',
      password: 'Admin@123',
      role: 'restaurant_admin',
      isVerified: true,
      isActive: true,
    },
    {
      name: 'Maria Garcia',
      email: 'maria@pizzafino.com',
      phone: '9876543213',
      password: 'Admin@123',
      role: 'restaurant_admin',
      isVerified: true,
      isActive: true,
    },
    {
      name: 'Wei Chen',
      email: 'wei@dragonpalace.com',
      phone: '9876543220',
      password: 'Admin@123',
      role: 'restaurant_admin',
      isVerified: true,
      isActive: true,
    },
  ],
  deliveryAdmins: [
    {
      name: 'Akshay Singh',
      email: 'akshay@delivery.com',
      phone: '9876543214',
      password: 'Admin@123',
      role: 'delivery_admin',
      isVerified: true,
      isActive: true,
      isAvailable: true,
    },
    {
      name: 'Priya Sharma',
      email: 'priya@delivery.com',
      phone: '9876543215',
      password: 'Admin@123',
      role: 'delivery_admin',
      isVerified: true,
      isActive: true,
      isAvailable: true,
    },
  ],
  customers: [
    {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '9876543216',
      password: 'User@123',
      role: 'customer',
      isVerified: true,
      isActive: true,
      addresses: [
        {
          label: 'home',
          address: '123 Main St, Bangalore, India',
          lat: 12.9716,
          lng: 77.5946,
          isDefault: true,
        },
      ],
    },
    {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '9876543217',
      password: 'User@123',
      role: 'customer',
      isVerified: true,
      isActive: true,
      addresses: [
        {
          label: 'work',
          address: '456 Tech Park, Bangalore, India',
          lat: 12.9352,
          lng: 77.6245,
          isDefault: true,
        },
      ],
    },
    {
      name: 'Amit Patel',
      email: 'amit@example.com',
      phone: '9876543218',
      password: 'User@123',
      role: 'customer',
      isVerified: true,
      isActive: true,
      addresses: [
        {
          label: 'home',
          address: '789 Park Avenue, Bangalore, India',
          lat: 12.9716,
          lng: 77.5946,
          isDefault: true,
        },
      ],
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '9876543219',
      password: 'User@123',
      role: 'customer',
      isVerified: true,
      isActive: true,
      addresses: [
        {
          label: 'home',
          address: '321 Elm Street, Bangalore, India',
          lat: 12.9716,
          lng: 77.5946,
          isDefault: true,
        },
      ],
    },
    {
      name: 'Michael Chen',
      email: 'michael@example.com',
      phone: '9876543220',
      password: 'User@123',
      role: 'customer',
      isVerified: true,
      isActive: true,
      addresses: [
        {
          label: 'home',
          address: '654 Oak Lane, Bangalore, India',
          lat: 12.9716,
          lng: 77.5946,
          isDefault: true,
        },
      ],
    },
  ],
};

const seedRestaurants = [
  {
    name: 'Spice Haven',
    description: 'Authentic Indian cuisine with traditional recipes passed down through generations',
    cuisine: ['Indian', 'North Indian', 'South Indian'],
    address: '123 Curry Lane, Bangalore, India',
    phone: '9123456789',
    email: 'contact@spicehaven.com',
    logo: 'https://via.placeholder.com/100/FF6B6B/FFFFFF?text=Spice+Haven',
    coverImage: 'https://via.placeholder.com/500/FF6B6B/FFFFFF?text=Spice+Haven+Cover',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716], // [longitude, latitude]
    },
    rating: 4.5,
    totalRatings: 342,
    isActive: true,
    isVerified: true,
    openingHours: [
      { day: 'Monday', open: '10:00', close: '23:00', isClosed: false },
      { day: 'Tuesday', open: '10:00', close: '23:00', isClosed: false },
      { day: 'Wednesday', open: '10:00', close: '23:00', isClosed: false },
      { day: 'Thursday', open: '10:00', close: '23:00', isClosed: false },
      { day: 'Friday', open: '10:00', close: '00:00', isClosed: false },
      { day: 'Saturday', open: '10:00', close: '00:00', isClosed: false },
      { day: 'Sunday', open: '11:00', close: '23:00', isClosed: false },
    ],
    preparationTime: 25,
    minimumOrder: 150,
    deliveryFee: 40,
    taxRate: 5,
    bankDetails: {
      accountName: 'Spice Haven Restaurant',
      accountNumber: '1234567890',
      ifscCode: 'HDFC0000123',
      bankName: 'HDFC Bank',
    },
    tables: [
      { tableNumber: 'A1', seats: 2, isActive: true },
      { tableNumber: 'A2', seats: 2, isActive: true },
      { tableNumber: 'B1', seats: 4, isActive: true },
      { tableNumber: 'B2', seats: 4, isActive: true },
    ],
  },
  {
    name: 'Dragon Palace',
    description: 'Authentic Chinese cuisine featuring traditional and contemporary dishes',
    cuisine: ['Chinese', 'Fast Food'],
    address: '456 Dragon Street, Bangalore, India',
    phone: '9123456790',
    email: 'contact@dragonpalace.com',
    logo: 'https://via.placeholder.com/100/FFA500/FFFFFF?text=Dragon+Palace',
    coverImage: 'https://via.placeholder.com/500/FFA500/FFFFFF?text=Dragon+Palace+Cover',
    location: {
      type: 'Point',
      coordinates: [77.6245, 12.9352],
    },
    rating: 4.3,
    totalRatings: 287,
    isActive: true,
    isVerified: true,
    openingHours: [
      { day: 'Monday', open: '11:00', close: '22:00', isClosed: false },
      { day: 'Tuesday', open: '11:00', close: '22:00', isClosed: false },
      { day: 'Wednesday', open: '11:00', close: '22:00', isClosed: false },
      { day: 'Thursday', open: '11:00', close: '22:00', isClosed: false },
      { day: 'Friday', open: '11:00', close: '23:00', isClosed: false },
      { day: 'Saturday', open: '11:00', close: '23:00', isClosed: false },
      { day: 'Sunday', open: '12:00', close: '22:00', isClosed: false },
    ],
    preparationTime: 20,
    minimumOrder: 200,
    deliveryFee: 50,
    taxRate: 5,
    bankDetails: {
      accountName: 'Dragon Palace Restaurant',
      accountNumber: '0987654321',
      ifscCode: 'ICIC0000456',
      bankName: 'ICICI Bank',
    },
    tables: [
      { tableNumber: 'C1', seats: 2, isActive: true },
      { tableNumber: 'C2', seats: 3, isActive: true },
      { tableNumber: 'D1', seats: 6, isActive: true },
    ],
  },
  {
    name: 'Pizza Fino',
    description: 'Authentic Italian pizzeria with wood-fired ovens and imported ingredients',
    cuisine: ['Italian', 'Continental'],
    address: '789 Italian Avenue, Bangalore, India',
    phone: '9123456791',
    email: 'contact@pizzafino.com',
    logo: 'https://via.placeholder.com/100/27AE60/FFFFFF?text=Pizza+Fino',
    coverImage: 'https://via.placeholder.com/500/27AE60/FFFFFF?text=Pizza+Fino+Cover',
    location: {
      type: 'Point',
      coordinates: [77.6100, 12.9550],
    },
    rating: 4.7,
    totalRatings: 425,
    isActive: true,
    isVerified: true,
    openingHours: [
      { day: 'Monday', open: '12:00', close: '23:00', isClosed: false },
      { day: 'Tuesday', open: '12:00', close: '23:00', isClosed: false },
      { day: 'Wednesday', open: '12:00', close: '23:00', isClosed: false },
      { day: 'Thursday', open: '12:00', close: '23:00', isClosed: false },
      { day: 'Friday', open: '12:00', close: '00:30', isClosed: false },
      { day: 'Saturday', open: '12:00', close: '00:30', isClosed: false },
      { day: 'Sunday', open: '12:00', close: '23:00', isClosed: false },
    ],
    preparationTime: 15,
    minimumOrder: 250,
    deliveryFee: 60,
    taxRate: 5,
    bankDetails: {
      accountName: 'Pizza Fino Restaurant',
      accountNumber: '1122334455',
      ifscCode: 'AXIS0000789',
      bankName: 'Axis Bank',
    },
    tables: [
      { tableNumber: 'E1', seats: 2, isActive: true },
      { tableNumber: 'E2', seats: 4, isActive: true },
      { tableNumber: 'F1', seats: 6, isActive: true },
      { tableNumber: 'F2', seats: 8, isActive: true },
    ],
  },
];

const seedMenuItems = {
  spiceHaven: [
    {
      category: 'Appetizers',
      name: 'Samosa (4 pieces)',
      description: 'Crispy fried pastry with spiced potato and pea filling',
      price: 120,
      isVeg: true,
      isAvailable: true,
      preparationTime: 10,
      tags: ['Popular'],
    },
    {
      category: 'Appetizers',
      name: 'Paneer Tikka',
      description: 'Marinated and grilled cottage cheese pieces with Indian spices',
      price: 280,
      isVeg: true,
      isAvailable: true,
      preparationTime: 15,
      tags: ['Popular', 'Bestseller'],
    },
    {
      category: 'Appetizers',
      name: 'Chicken 65',
      description: 'Crispy fried chicken with aromatic spices and curry leaves',
      price: 350,
      isVeg: false,
      isAvailable: true,
      preparationTime: 15,
      tags: ['Spicy', 'Popular'],
    },
    {
      category: 'Main Course',
      name: 'Butter Chicken',
      description: 'Tender chicken in creamy tomato-based sauce with butter and cream',
      price: 450,
      discountPrice: 400,
      isVeg: false,
      isAvailable: true,
      preparationTime: 20,
      tags: ['Bestseller', 'Popular'],
    },
    {
      category: 'Main Course',
      name: 'Paneer Butter Masala',
      description: 'Cottage cheese cubes in aromatic creamy tomato sauce',
      price: 380,
      isVeg: true,
      isAvailable: true,
      preparationTime: 18,
      tags: ['Popular', 'Bestseller'],
    },
    {
      category: 'Main Course',
      name: 'Biryani',
      name: 'Chicken Biryani',
      description: 'Fragrant basmati rice cooked with marinated chicken and aromatic spices',
      price: 320,
      isVeg: false,
      isAvailable: true,
      preparationTime: 25,
      tags: ['Bestseller'],
    },
    {
      category: 'Main Course',
      name: 'Lamb Rogan Josh',
      description: 'Tender lamb pieces in aromatic onion and tomato-based gravy',
      price: 520,
      isVeg: false,
      isAvailable: true,
      preparationTime: 30,
      tags: ['Popular'],
    },
    {
      category: 'Bread',
      name: 'Garlic Naan',
      description: 'Traditional Indian bread topped with fresh garlic and butter',
      price: 50,
      isVeg: true,
      isAvailable: true,
      preparationTime: 5,
      tags: [],
    },
    {
      category: 'Bread',
      name: 'Butter Roti',
      description: 'Soft Indian whole wheat bread with butter',
      price: 40,
      isVeg: true,
      isAvailable: true,
      preparationTime: 5,
      tags: [],
    },
    {
      category: 'Beverages',
      name: 'Mango Lassi',
      description: 'Refreshing yogurt-based drink with fresh mango pulp',
      price: 90,
      isVeg: true,
      isAvailable: true,
      preparationTime: 3,
      tags: [],
    },
    {
      category: 'Beverages',
      name: 'Masala Chai',
      description: 'Aromatic tea with traditional Indian spices',
      price: 50,
      isVeg: true,
      isAvailable: true,
      preparationTime: 3,
      tags: [],
    },
    {
      category: 'Desserts',
      name: 'Gulab Jamun',
      description: 'Soft milk solids dumplings soaked in sugar syrup',
      price: 120,
      isVeg: true,
      isAvailable: true,
      preparationTime: 5,
      tags: ['Popular'],
    },
  ],
  dragonPalace: [
    {
      category: 'Appetizers',
      name: 'Spring Rolls (4 pieces)',
      description: 'Crispy rolls filled with vegetables and pork',
      price: 130,
      isVeg: false,
      isAvailable: true,
      preparationTime: 10,
      tags: ['Popular'],
    },
    {
      category: 'Appetizers',
      name: 'Vegetable Spring Rolls',
      description: 'Crispy rolls filled with mixed fresh vegetables',
      price: 110,
      isVeg: true,
      isAvailable: true,
      preparationTime: 10,
      tags: [],
    },
    {
      category: 'Main Course',
      name: 'Chicken Fried Rice',
      description: 'Jasmine rice with tender chicken and mixed vegetables',
      price: 280,
      isVeg: false,
      isAvailable: true,
      preparationTime: 12,
      tags: ['Bestseller'],
    },
    {
      category: 'Main Course',
      name: 'Vegetable Fried Rice',
      description: 'Jasmine rice with mixed fresh vegetables',
      price: 220,
      isVeg: true,
      isAvailable: true,
      preparationTime: 12,
      tags: ['Popular'],
    },
    {
      category: 'Noodles',
      name: 'Chow Mein',
      description: 'Stir-fried wheat noodles with chicken and vegetables',
      price: 260,
      discountPrice: 230,
      isVeg: false,
      isAvailable: true,
      preparationTime: 12,
      tags: ['Bestseller', 'Popular'],
    },
    {
      category: 'Noodles',
      name: 'Vegetable Hakka Noodles',
      description: 'Stir-fried noodles with mixed vegetables and soy sauce',
      price: 200,
      isVeg: true,
      isAvailable: true,
      preparationTime: 12,
      tags: ['Popular'],
    },
    {
      category: 'Main Course',
      name: 'Manchurian Chicken',
      description: 'Chicken balls in sweet and spicy Manchurian sauce',
      price: 320,
      isVeg: false,
      isAvailable: true,
      preparationTime: 15,
      tags: ['Spicy', 'Popular'],
    },
    {
      category: 'Main Course',
      name: 'Vegetable Manchurian',
      description: 'Vegetable balls in sweet and spicy sauce',
      price: 260,
      isVeg: true,
      isAvailable: true,
      preparationTime: 14,
      tags: ['Popular'],
    },
    {
      category: 'Soups',
      name: 'Hot and Sour Soup',
      description: 'Tangy and spicy soup with mushrooms and tofu',
      price: 120,
      isVeg: true,
      isAvailable: true,
      preparationTime: 8,
      tags: [],
    },
    {
      category: 'Beverages',
      name: 'Jasmine Tea',
      description: 'Traditional Chinese green tea with jasmine flowers',
      price: 60,
      isVeg: true,
      isAvailable: true,
      preparationTime: 3,
      tags: [],
    },
  ],
  pizzaFino: [
    {
      category: 'Pizza',
      name: 'Margherita Pizza',
      description: 'Classic pizza with tomato, mozzarella, and fresh basil',
      price: 350,
      isVeg: true,
      isAvailable: true,
      preparationTime: 12,
      tags: ['Popular', 'Bestseller'],
    },
    {
      category: 'Pizza',
      name: 'Pepperoni Pizza',
      description: 'Pizza topped with pepperoni slices and cheese',
      price: 450,
      discountPrice: 400,
      isVeg: false,
      isAvailable: true,
      preparationTime: 12,
      tags: ['Bestseller'],
    },
    {
      category: 'Pizza',
      name: 'Chicken Tikka Pizza',
      description: 'Indian-style pizza with tandoori chicken and onions',
      price: 480,
      isVeg: false,
      isAvailable: true,
      preparationTime: 12,
      tags: ['Popular'],
    },
    {
      category: 'Pizza',
      name: 'Vegetarian Pizza',
      description: 'Pizza with bell peppers, mushrooms, olives, and onions',
      price: 380,
      isVeg: true,
      isAvailable: true,
      preparationTime: 12,
      tags: ['Popular'],
    },
    {
      category: 'Pizza',
      name: 'BBQ Chicken Pizza',
      description: 'Pizza with BBQ sauce, grilled chicken, and cheddar cheese',
      price: 500,
      isVeg: false,
      isAvailable: true,
      preparationTime: 12,
      tags: ['Bestseller', 'Popular'],
    },
    {
      category: 'Pizza',
      name: 'Four Cheese Pizza',
      description: 'Pizza with mozzarella, parmesan, feta, and gouda cheese',
      price: 420,
      isVeg: true,
      isAvailable: true,
      preparationTime: 12,
      tags: [],
    },
    {
      category: 'Appetizers',
      name: 'Garlic Bread',
      description: 'Crispy bread with garlic butter and herbs',
      price: 150,
      isVeg: true,
      isAvailable: true,
      preparationTime: 6,
      tags: ['Popular'],
    },
    {
      category: 'Appetizers',
      name: 'Bruschetta',
      description: 'Toasted bread topped with tomatoes, basil, and olive oil',
      price: 180,
      isVeg: true,
      isAvailable: true,
      preparationTime: 6,
      tags: [],
    },
    {
      category: 'Salads',
      name: 'Caesar Salad',
      description: 'Crisp romaine lettuce with parmesan and croutons',
      price: 220,
      isVeg: true,
      isAvailable: true,
      preparationTime: 5,
      tags: ['Healthy'],
    },
    {
      category: 'Desserts',
      name: 'Tiramisu',
      description: 'Classic Italian dessert with mascarpone and cocoa',
      price: 180,
      isVeg: true,
      isAvailable: true,
      preparationTime: 3,
      tags: ['Popular'],
    },
    {
      category: 'Desserts',
      name: 'Panna Cotta',
      description: 'Silky Italian cream dessert with berry compote',
      price: 160,
      isVeg: true,
      isAvailable: true,
      preparationTime: 3,
      tags: [],
    },
    {
      category: 'Beverages',
      name: 'Espresso',
      description: 'Strong Italian coffee',
      price: 80,
      isVeg: true,
      isAvailable: true,
      preparationTime: 2,
      tags: [],
    },
  ],
};

// Additional restaurants for food courts
const seedExtraRestaurantAdmins = [
  {
    name: 'Sanjay Gupta',
    email: 'sanjay@juicebar.com',
    phone: '9876543230',
    password: 'Admin@123',
    role: 'restaurant_admin',
    isVerified: true,
    isActive: true,
  },
  {
    name: 'Deepa Nair',
    email: 'deepa@dosapoint.com',
    phone: '9876543231',
    password: 'Admin@123',
    role: 'restaurant_admin',
    isVerified: true,
    isActive: true,
  },
];

const seedExtraRestaurants = [
  {
    name: 'Fresh Juice Bar',
    description: 'Fresh juices, smoothies, and healthy bowls made to order',
    cuisine: ['Beverages', 'Other'],
    address: '101 Health Lane, Orion Mall Food Court, Bangalore',
    phone: '9123456800',
    email: 'contact@freshjuicebar.com',
    logo: 'https://via.placeholder.com/100/2ECC71/FFFFFF?text=Juice+Bar',
    coverImage: 'https://via.placeholder.com/500/2ECC71/FFFFFF?text=Fresh+Juice+Bar',
    location: { type: 'Point', coordinates: [77.5900, 12.9800] },
    rating: 4.4,
    totalRatings: 189,
    isActive: true,
    isVerified: true,
    openingHours: [
      { day: 'Monday', open: '09:00', close: '22:00', isClosed: false },
      { day: 'Tuesday', open: '09:00', close: '22:00', isClosed: false },
      { day: 'Wednesday', open: '09:00', close: '22:00', isClosed: false },
      { day: 'Thursday', open: '09:00', close: '22:00', isClosed: false },
      { day: 'Friday', open: '09:00', close: '23:00', isClosed: false },
      { day: 'Saturday', open: '09:00', close: '23:00', isClosed: false },
      { day: 'Sunday', open: '10:00', close: '22:00', isClosed: false },
    ],
    preparationTime: 10,
    minimumOrder: 80,
    deliveryFee: 30,
    taxRate: 5,
    tables: [],
  },
  {
    name: 'Dosa Point',
    description: 'South Indian specialties — dosas, idlis, vadas and authentic filter coffee',
    cuisine: ['South Indian', 'Indian'],
    address: '102 Masala Street, Orion Mall Food Court, Bangalore',
    phone: '9123456801',
    email: 'contact@dosapoint.com',
    logo: 'https://via.placeholder.com/100/E67E22/FFFFFF?text=Dosa+Point',
    coverImage: 'https://via.placeholder.com/500/E67E22/FFFFFF?text=Dosa+Point',
    location: { type: 'Point', coordinates: [77.5900, 12.9800] },
    rating: 4.6,
    totalRatings: 312,
    isActive: true,
    isVerified: true,
    openingHours: [
      { day: 'Monday', open: '07:00', close: '22:00', isClosed: false },
      { day: 'Tuesday', open: '07:00', close: '22:00', isClosed: false },
      { day: 'Wednesday', open: '07:00', close: '22:00', isClosed: false },
      { day: 'Thursday', open: '07:00', close: '22:00', isClosed: false },
      { day: 'Friday', open: '07:00', close: '23:00', isClosed: false },
      { day: 'Saturday', open: '07:00', close: '23:00', isClosed: false },
      { day: 'Sunday', open: '08:00', close: '22:00', isClosed: false },
    ],
    preparationTime: 15,
    minimumOrder: 100,
    deliveryFee: 40,
    taxRate: 5,
    tables: [],
  },
];

const seedExtraMenuItems = {
  juiceBar: [
    { category: 'Beverages', name: 'Fresh Orange Juice', description: 'Freshly squeezed orange juice with no added sugar', price: 120, isVeg: true, isAvailable: true, preparationTime: 5, tags: ['Popular', 'Healthy'] },
    { category: 'Beverages', name: 'Mango Smoothie', description: 'Thick mango smoothie with yogurt and honey', price: 150, isVeg: true, isAvailable: true, preparationTime: 5, tags: ['Bestseller'] },
    { category: 'Beverages', name: 'Green Detox Juice', description: 'Spinach, cucumber, apple, and ginger juice', price: 140, isVeg: true, isAvailable: true, preparationTime: 5, tags: ['Healthy', 'New'] },
    { category: 'Beverages', name: 'Watermelon Mint Cooler', description: 'Refreshing watermelon juice with fresh mint', price: 110, isVeg: true, isAvailable: true, preparationTime: 5, tags: ['Popular'] },
    { category: 'Beverages', name: 'Protein Power Shake', description: 'Banana, peanut butter, oats, and milk shake', price: 180, isVeg: true, isAvailable: true, preparationTime: 5, tags: ['Healthy'] },
    { category: 'Other', name: 'Acai Bowl', description: 'Acai berry bowl topped with granola, banana, and berries', price: 250, isVeg: true, isAvailable: true, preparationTime: 8, tags: ['Healthy', 'New'] },
    { category: 'Other', name: 'Fresh Fruit Salad', description: 'Seasonal fresh cut fruits with honey drizzle', price: 160, isVeg: true, isAvailable: true, preparationTime: 5, tags: [] },
  ],
  dosaPoint: [
    { category: 'Main Course', name: 'Masala Dosa', description: 'Crispy rice crepe filled with spiced potato masala', price: 120, isVeg: true, isAvailable: true, preparationTime: 10, tags: ['Bestseller', 'Popular'] },
    { category: 'Main Course', name: 'Mysore Masala Dosa', description: 'Dosa with spicy red chutney and potato filling', price: 140, isVeg: true, isAvailable: true, preparationTime: 10, tags: ['Spicy', 'Popular'] },
    { category: 'Main Course', name: 'Rava Dosa', description: 'Crispy semolina crepe with onions and cashews', price: 130, isVeg: true, isAvailable: true, preparationTime: 12, tags: ['Popular'] },
    { category: 'Main Course', name: 'Cheese Dosa', description: 'Crispy dosa loaded with melted cheese', price: 160, isVeg: true, isAvailable: true, preparationTime: 12, tags: ['Bestseller'] },
    { category: 'Appetizers', name: 'Idli Sambar (4 pcs)', description: 'Soft steamed rice cakes with sambar and chutney', price: 80, isVeg: true, isAvailable: true, preparationTime: 8, tags: ['Popular'] },
    { category: 'Appetizers', name: 'Medu Vada (3 pcs)', description: 'Crispy lentil fritters with sambar and chutney', price: 90, isVeg: true, isAvailable: true, preparationTime: 10, tags: [] },
    { category: 'Main Course', name: 'Uttapam', description: 'Thick rice pancake topped with onions, tomatoes, and peppers', price: 110, isVeg: true, isAvailable: true, preparationTime: 12, tags: [] },
    { category: 'Beverages', name: 'Filter Coffee', description: 'Authentic South Indian filter coffee with frothy milk', price: 50, isVeg: true, isAvailable: true, preparationTime: 3, tags: ['Bestseller', 'Popular'] },
    { category: 'Desserts', name: 'Kesari Bath', description: 'Sweet semolina pudding with saffron, cashews, and raisins', price: 80, isVeg: true, isAvailable: true, preparationTime: 5, tags: ['Popular'] },
  ],
};

// Food Court seed data
const seedFoodCourts = [
  {
    name: 'Orion Mall Food Court',
    description: 'The biggest food court in Bangalore with 5 diverse restaurants under one roof. Order from multiple restaurants and pay once!',
    address: 'Orion Mall, Brigade Gateway, Rajajinagar, Bangalore 560055',
    location: { type: 'Point', coordinates: [77.5900, 12.9800] },
    image: 'https://via.placeholder.com/800/F2A93E/FFFFFF?text=Orion+Mall+Food+Court',
    logo: 'https://via.placeholder.com/100/F2A93E/FFFFFF?text=Orion',
    isActive: true,
    tables: [
      { tableNumber: 'FC-1', seats: 2, isActive: true },
      { tableNumber: 'FC-2', seats: 2, isActive: true },
      { tableNumber: 'FC-3', seats: 4, isActive: true },
      { tableNumber: 'FC-4', seats: 4, isActive: true },
      { tableNumber: 'FC-5', seats: 6, isActive: true },
      { tableNumber: 'FC-6', seats: 6, isActive: true },
      { tableNumber: 'FC-7', seats: 8, isActive: true },
      { tableNumber: 'FC-8', seats: 8, isActive: true },
    ],
    openingHours: [
      { day: 'Monday', open: '10:00', close: '22:00', isClosed: false },
      { day: 'Tuesday', open: '10:00', close: '22:00', isClosed: false },
      { day: 'Wednesday', open: '10:00', close: '22:00', isClosed: false },
      { day: 'Thursday', open: '10:00', close: '22:00', isClosed: false },
      { day: 'Friday', open: '10:00', close: '23:00', isClosed: false },
      { day: 'Saturday', open: '10:00', close: '23:00', isClosed: false },
      { day: 'Sunday', open: '11:00', close: '22:00', isClosed: false },
    ],
  },
  {
    name: 'Phoenix Market City Food Hub',
    description: 'Premium food court experience at Phoenix Mall. Italian, Indian, and Chinese — all in one place with single checkout.',
    address: 'Phoenix Marketcity, Whitefield, Bangalore 560048',
    location: { type: 'Point', coordinates: [77.6950, 12.9952] },
    image: 'https://via.placeholder.com/800/F07054/FFFFFF?text=Phoenix+Food+Hub',
    logo: 'https://via.placeholder.com/100/F07054/FFFFFF?text=Phoenix',
    isActive: true,
    tables: [
      { tableNumber: 'PH-1', seats: 2, isActive: true },
      { tableNumber: 'PH-2', seats: 2, isActive: true },
      { tableNumber: 'PH-3', seats: 4, isActive: true },
      { tableNumber: 'PH-4', seats: 4, isActive: true },
      { tableNumber: 'PH-5', seats: 6, isActive: true },
      { tableNumber: 'PH-6', seats: 8, isActive: true },
    ],
    openingHours: [
      { day: 'Monday', open: '10:00', close: '22:00', isClosed: false },
      { day: 'Tuesday', open: '10:00', close: '22:00', isClosed: false },
      { day: 'Wednesday', open: '10:00', close: '22:00', isClosed: false },
      { day: 'Thursday', open: '10:00', close: '22:00', isClosed: false },
      { day: 'Friday', open: '10:00', close: '23:00', isClosed: false },
      { day: 'Saturday', open: '10:00', close: '23:00', isClosed: false },
      { day: 'Sunday', open: '11:00', close: '22:00', isClosed: false },
    ],
  },
];

const seedOrders = [
  {
    orderNumber: 'ORD-2024-0001',
    orderType: 'delivery',
    paymentMethod: 'razorpay',
    paymentStatus: 'paid',
    status: 'completed',
    subtotal: 650,
    tax: 32.5,
    deliveryFee: 40,
    discount: 0,
    total: 722.5,
    specialInstructions: 'Please ring the bell twice',
    deliveryAddress: {
      address: '123 Main St, Bangalore, India',
      lat: 12.9716,
      lng: 77.5946,
    },
  },
  {
    orderNumber: 'ORD-2024-0002',
    orderType: 'delivery',
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    status: 'delivered',
    subtotal: 1200,
    tax: 60,
    deliveryFee: 50,
    discount: 100,
    total: 1210,
    specialInstructions: 'No onions please',
    deliveryAddress: {
      address: '456 Tech Park, Bangalore, India',
      lat: 12.9352,
      lng: 77.6245,
    },
  },
  {
    orderNumber: 'ORD-2024-0003',
    orderType: 'delivery',
    paymentMethod: 'razorpay',
    paymentStatus: 'paid',
    status: 'out_for_delivery',
    subtotal: 950,
    tax: 47.5,
    deliveryFee: 60,
    discount: 0,
    total: 1057.5,
    specialInstructions: 'Extra spicy',
    deliveryAddress: {
      address: '789 Park Avenue, Bangalore, India',
      lat: 12.9716,
      lng: 77.5946,
    },
  },
  {
    orderNumber: 'ORD-2024-0004',
    orderType: 'takeaway',
    paymentMethod: 'razorpay',
    paymentStatus: 'paid',
    status: 'ready',
    subtotal: 800,
    tax: 40,
    deliveryFee: 0,
    discount: 0,
    total: 840,
    specialInstructions: '',
    deliveryAddress: null,
  },
  {
    orderNumber: 'ORD-2024-0005',
    orderType: 'delivery',
    paymentMethod: 'razorpay',
    paymentStatus: 'pending',
    status: 'preparing',
    subtotal: 1100,
    tax: 55,
    deliveryFee: 50,
    discount: 0,
    total: 1205,
    specialInstructions: 'Mild spice',
    deliveryAddress: {
      address: '321 Elm Street, Bangalore, India',
      lat: 12.9716,
      lng: 77.5946,
    },
  },
];

/**
 * Hash password
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Clear all collections
 */
async function clearDatabase() {
  try {
    log.header('Clearing Database');

    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const collection of collections) {
      if (collection.name !== 'system.indexes') {
        await mongoose.connection.db.dropCollection(collection.name);
        log.success(`Cleared ${collection.name}`);
      }
    }

    log.success('Database cleared successfully');
  } catch (error) {
    log.error(`Failed to clear database: ${error.message}`);
    throw error;
  }
}

/**
 * Seed users
 */
async function seedUserData() {
  try {
    log.header('Seeding Users');

    const users = [];

    // Create super admin (password is auto-hashed by User model pre-save hook)
    const superAdmin = new User(seedUsers.superAdmin);
    await superAdmin.save();
    users.push(superAdmin);
    log.success(`Created super admin: ${superAdmin.email}`);

    // Create admin
    const admin = new User(seedUsers.admin);
    await admin.save();
    users.push(admin);
    log.success(`Created admin: ${admin.email}`);

    // Create restaurant admins
    for (const adminData of seedUsers.restaurantAdmins) {
      const restaurantAdmin = new User(adminData);
      await restaurantAdmin.save();
      users.push(restaurantAdmin);
      log.success(`Created restaurant admin: ${restaurantAdmin.email}`);
    }

    // Create delivery admins
    for (const adminData of seedUsers.deliveryAdmins) {
      const deliveryAdmin = new User(adminData);
      await deliveryAdmin.save();
      users.push(deliveryAdmin);
      log.success(`Created delivery admin: ${deliveryAdmin.email}`);
    }

    // Create customers
    for (const customerData of seedUsers.customers) {
      const customer = new User(customerData);
      await customer.save();
      users.push(customer);
      log.success(`Created customer: ${customer.email}`);
    }

    return users;
  } catch (error) {
    log.error(`Failed to seed users: ${error.message}`);
    throw error;
  }
}

/**
 * Seed restaurants
 */
async function seedRestaurantData(users) {
  try {
    log.header('Seeding Restaurants');

    const restaurantAdmins = users.filter((u) => u.role === 'restaurant_admin');
    const restaurants = [];

    for (let i = 0; i < seedRestaurants.length; i++) {
      const restaurantData = {
        ...seedRestaurants[i],
        owner: restaurantAdmins[i]._id,
      };

      const restaurant = new Restaurant(restaurantData);
      await restaurant.save();
      restaurants.push(restaurant);
      log.success(`Created restaurant: ${restaurant.name}`);
    }

    return restaurants;
  } catch (error) {
    log.error(`Failed to seed restaurants: ${error.message}`);
    throw error;
  }
}

/**
 * Seed menu items
 */
async function seedMenuItemData(restaurants) {
  try {
    log.header('Seeding Menu Items');

    const itemCollections = [seedMenuItems.spiceHaven, seedMenuItems.dragonPalace, seedMenuItems.pizzaFino];

    for (let i = 0; i < restaurants.length; i++) {
      const restaurant = restaurants[i];
      const items = itemCollections[i];

      for (const itemData of items) {
        const menuItem = new MenuItem({
          ...itemData,
          restaurant: restaurant._id,
        });
        await menuItem.save();
      }

      log.success(`Created ${items.length} menu items for ${restaurant.name}`);
    }
  } catch (error) {
    log.error(`Failed to seed menu items: ${error.message}`);
    throw error;
  }
}

/**
 * Seed QR codes
 */
async function seedQRCodeData(restaurants) {
  try {
    log.header('Seeding QR Codes');

    for (const restaurant of restaurants) {
      for (const table of restaurant.tables) {
        const qrData = `https://skipq.com/scan?restaurant=${restaurant._id}&table=${table.tableNumber}`;
        const qrCodeUrl = await QRCode.toDataURL(qrData);

        const qrCode = new QRCodeModel({
          restaurant: restaurant._id,
          tableNumber: table.tableNumber,
          qrCodeUrl: qrCodeUrl,
          qrCodeData: qrData,
          isActive: true,
          scanCount: 0,
        });

        await qrCode.save();
      }

      log.success(`Created ${restaurant.tables.length} QR codes for ${restaurant.name}`);
    }
  } catch (error) {
    log.error(`Failed to seed QR codes: ${error.message}`);
    throw error;
  }
}

/**
 * Seed orders
 */
async function seedOrderData(users, restaurants) {
  try {
    log.header('Seeding Orders');

    const customers = users.filter((u) => u.role === 'customer');
    const deliveryPersons = users.filter((u) => u.role === 'delivery_admin');

    for (let i = 0; i < seedOrders.length; i++) {
      const orderData = {
        ...seedOrders[i],
        customer: customers[i % customers.length]._id,
        restaurant: restaurants[i % restaurants.length]._id,
        deliveryPerson: seedOrders[i].orderType === 'delivery' ? deliveryPersons[i % deliveryPersons.length]._id : null,
        items: [
          {
            name: 'Sample Item',
            price: 300,
            quantity: 2,
            customizations: [],
          },
        ],
      };

      const order = new Order(orderData);
      await order.save();
      log.success(`Created order: ${order.orderNumber}`);
    }
  } catch (error) {
    log.error(`Failed to seed orders: ${error.message}`);
    throw error;
  }
}

/**
 * Seed extra restaurants (for food courts)
 */
async function seedExtraRestaurantData(users) {
  try {
    log.header('Seeding Extra Restaurants (for Food Courts)');

    const extraAdminUsers = [];
    for (const adminData of seedExtraRestaurantAdmins) {
      const admin = new User(adminData);
      await admin.save();
      extraAdminUsers.push(admin);
      log.success(`Created restaurant admin: ${admin.email}`);
    }

    const extraRestaurants = [];
    for (let i = 0; i < seedExtraRestaurants.length; i++) {
      const restaurantData = {
        ...seedExtraRestaurants[i],
        owner: extraAdminUsers[i]._id,
      };
      const restaurant = new Restaurant(restaurantData);
      await restaurant.save();
      extraRestaurants.push(restaurant);
      log.success(`Created restaurant: ${restaurant.name}`);
    }

    // Seed menu items for extra restaurants
    const itemCollections = [seedExtraMenuItems.juiceBar, seedExtraMenuItems.dosaPoint];
    for (let i = 0; i < extraRestaurants.length; i++) {
      const restaurant = extraRestaurants[i];
      const items = itemCollections[i];
      for (const itemData of items) {
        const menuItem = new MenuItem({ ...itemData, restaurant: restaurant._id });
        await menuItem.save();
      }
      log.success(`Created ${items.length} menu items for ${restaurant.name}`);
    }

    return extraRestaurants;
  } catch (error) {
    log.error(`Failed to seed extra restaurants: ${error.message}`);
    throw error;
  }
}

/**
 * Seed food courts
 */
async function seedFoodCourtData(restaurants, extraRestaurants, users) {
  try {
    log.header('Seeding Food Courts');

    const adminUser = users.find((u) => u.role === 'admin') || users.find((u) => u.role === 'super_admin');

    // Food Court 1: Orion Mall — all 5 restaurants
    const allRestaurantIds = [...restaurants.map((r) => r._id), ...extraRestaurants.map((r) => r._id)];
    const foodCourt1 = new FoodCourt({
      ...seedFoodCourts[0],
      restaurants: allRestaurantIds,
      manager: adminUser?._id,
    });
    await foodCourt1.save();
    log.success(`Created food court: ${foodCourt1.name} with ${allRestaurantIds.length} restaurants`);

    // Food Court 2: Phoenix — first 3 restaurants (Spice Haven, Dragon Palace, Pizza Fino)
    const phoenixRestaurantIds = restaurants.map((r) => r._id);
    const foodCourt2 = new FoodCourt({
      ...seedFoodCourts[1],
      restaurants: phoenixRestaurantIds,
      manager: adminUser?._id,
    });
    await foodCourt2.save();
    log.success(`Created food court: ${foodCourt2.name} with ${phoenixRestaurantIds.length} restaurants`);

    return [foodCourt1, foodCourt2];
  } catch (error) {
    log.error(`Failed to seed food courts: ${error.message}`);
    throw error;
  }
}

/**
 * Main seed function
 */
async function seed() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/skipq_app', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    log.info('Connected to MongoDB');

    // Check for --destroy flag
    const isDestroy = process.argv.includes('--destroy');

    if (isDestroy) {
      await clearDatabase();
      log.success('Database destroyed. Exiting.');
      process.exit(0);
    }

    // Clear existing data
    await clearDatabase();

    // Seed data
    const users = await seedUserData();
    const restaurants = await seedRestaurantData(users);
    await seedMenuItemData(restaurants);
    await seedQRCodeData(restaurants);
    await seedOrderData(users, restaurants);

    // Seed food court data (extra restaurants + food courts)
    const extraRestaurants = await seedExtraRestaurantData(users);
    const foodCourts = await seedFoodCourtData(restaurants, extraRestaurants, users);

    log.header('Seeding Complete');
    log.success('Database seeded successfully!');
    log.info('Super Admin Credentials:');
    log.info(`  Email: ${seedUsers.superAdmin.email}`);
    log.info(`  Password: ${seedUsers.superAdmin.password}`);
    log.info('');
    log.info('Admin Credentials:');
    log.info(`  Email: ${seedUsers.admin.email}`);
    log.info(`  Password: ${seedUsers.admin.password}`);
    log.info('');
    log.info('Customer Sample Credentials:');
    log.info(`  Email: ${seedUsers.customers[0].email}`);
    log.info(`  Password: ${seedUsers.customers[0].password}`);

    process.exit(0);
  } catch (error) {
    log.error(`Seeding failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run seed if this is the main module
if (require.main === module) {
  seed();
}

module.exports = seed;
