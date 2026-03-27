const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import configurations
const connectDB = require('./config/db');
const initializeSocket = require('./config/socket');

// Import middleware
const { errorHandler, asyncHandler } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const restaurantRoutes = require('./routes/restaurantRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const qrRoutes = require('./routes/qrRoutes');
const adminRoutes = require('./routes/adminRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const foodCourtRoutes = require('./routes/foodCourtRoutes');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Initialize Socket.IO
const io = initializeSocket(server);
app.set('io', io);

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3001',
    'http://localhost:3000',
    'http://localhost:3001',
    'https://beta.skipqapp.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date(),
  });
});

// Apple Universal Links
app.get('/.well-known/apple-app-site-association', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({
    applinks: {
      apps: [],
      details: [
        {
          appID: process.env.IOS_APP_ID || 'TEAMID.com.skipq.app',
          paths: ['/scan/*'],
        },
      ],
    },
  });
});

// Android App Links
app.get('/.well-known/assetlinks.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json([
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: process.env.ANDROID_PACKAGE_NAME || 'com.skipq.app',
        sha256_cert_fingerprints: [
          process.env.ANDROID_SHA256_FINGERPRINT || 'TODO:ADD_YOUR_SHA256_FINGERPRINT_HERE',
        ],
      },
    },
  ]);
});

// Temporary seed endpoint (remove after seeding)
app.post('/api/seed', async (req, res) => {
  try {
    // Simple secret check to prevent unauthorized seeding
    if (req.headers['x-seed-key'] !== 'skipq-seed-2024') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    const bcrypt = require('bcryptjs');
    const User = require('./models/User');
    const Restaurant = require('./models/Restaurant');
    const MenuItem = require('./models/MenuItem');
    const FoodCourt = require('./models/FoodCourt');
    
    // Check if already seeded
    const existingRestaurants = await Restaurant.countDocuments();
    if (existingRestaurants > 0) {
      return res.json({ success: true, message: 'Database already seeded', count: existingRestaurants });
    }
    
    // Create admin users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);
    
    const superAdmin = await User.create({
      name: 'Super Admin', email: 'superadmin@skipq.com', phone: '9876543210',
      password: hashedPassword, role: 'super_admin', isVerified: true, isActive: true
    });
    
    const admin = await User.create({
      name: 'Admin User', email: 'admin@skipq.com', phone: '9876543211',
      password: hashedPassword, role: 'admin', isVerified: true, isActive: true
    });
    
    const raj = await User.create({
      name: 'Raj Kumar', email: 'raj@spicehaven.com', phone: '9876543212',
      password: hashedPassword, role: 'restaurant_admin', isVerified: true, isActive: true
    });
    
    const maria = await User.create({
      name: 'Maria Garcia', email: 'maria@pizzafino.com', phone: '9876543213',
      password: hashedPassword, role: 'restaurant_admin', isVerified: true, isActive: true
    });
    
    const wei = await User.create({
      name: 'Wei Chen', email: 'wei@dragonpalace.com', phone: '9876543214',
      password: hashedPassword, role: 'restaurant_admin', isVerified: true, isActive: true
    });
    
    const sanjay = await User.create({
      name: 'Sanjay Gupta', email: 'sanjay@juicebar.com', phone: '9876543220',
      password: hashedPassword, role: 'restaurant_admin', isVerified: true, isActive: true
    });
    
    const deepa = await User.create({
      name: 'Deepa Nair', email: 'deepa@dosapoint.com', phone: '9876543221',
      password: hashedPassword, role: 'restaurant_admin', isVerified: true, isActive: true
    });
    
    // Create restaurants
    const spiceHaven = await Restaurant.create({
      owner: raj._id, name: 'Spice Haven', description: 'Authentic Indian cuisine with a modern twist',
      cuisine: ['Indian', 'North Indian', 'South Indian'], address: '123 Curry Lane, Bangalore, India',
      phone: '9876543212', email: 'info@spicehaven.com',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      rating: 4.5, totalRatings: 342, isActive: true, isVerified: true,
      preparationTime: 25, minimumOrder: 150, deliveryFee: 40, taxRate: 5,
      openingHours: [
        {day:'Monday',open:'10:00',close:'22:00'},{day:'Tuesday',open:'10:00',close:'22:00'},
        {day:'Wednesday',open:'10:00',close:'22:00'},{day:'Thursday',open:'10:00',close:'22:00'},
        {day:'Friday',open:'10:00',close:'23:00'},{day:'Saturday',open:'09:00',close:'23:00'},
        {day:'Sunday',open:'09:00',close:'22:00'}
      ]
    });
    
    const dragonPalace = await Restaurant.create({
      owner: wei._id, name: 'Dragon Palace', description: 'Premium Chinese and Asian fusion dining',
      cuisine: ['Chinese', 'Fast Food'], address: '456 Dragon Street, Bangalore, India',
      phone: '9876543214', email: 'info@dragonpalace.com',
      location: { type: 'Point', coordinates: [77.6245, 12.9352] },
      rating: 4.3, totalRatings: 287, isActive: true, isVerified: true,
      preparationTime: 20, minimumOrder: 200, deliveryFee: 50, taxRate: 5,
      openingHours: [
        {day:'Monday',open:'11:00',close:'22:00'},{day:'Tuesday',open:'11:00',close:'22:00'},
        {day:'Wednesday',open:'11:00',close:'22:00'},{day:'Thursday',open:'11:00',close:'22:00'},
        {day:'Friday',open:'11:00',close:'23:00'},{day:'Saturday',open:'10:00',close:'23:00'},
        {day:'Sunday',open:'10:00',close:'22:00'}
      ]
    });
    
    const pizzaFino = await Restaurant.create({
      owner: maria._id, name: 'Pizza Fino', description: 'Authentic Italian pizzas and pastas',
      cuisine: ['Italian', 'Continental'], address: '789 Italian Avenue, Bangalore, India',
      phone: '9876543213', email: 'info@pizzafino.com',
      location: { type: 'Point', coordinates: [77.6100, 12.9550] },
      rating: 4.7, totalRatings: 425, isActive: true, isVerified: true,
      preparationTime: 15, minimumOrder: 250, deliveryFee: 60, taxRate: 5,
      openingHours: [
        {day:'Monday',open:'11:00',close:'23:00'},{day:'Tuesday',open:'11:00',close:'23:00'},
        {day:'Wednesday',open:'11:00',close:'23:00'},{day:'Thursday',open:'11:00',close:'23:00'},
        {day:'Friday',open:'11:00',close:'00:00'},{day:'Saturday',open:'10:00',close:'00:00'},
        {day:'Sunday',open:'10:00',close:'23:00'}
      ]
    });
    
    const juiceBar = await Restaurant.create({
      owner: sanjay._id, name: 'Fresh Juice Bar', description: 'Fresh juices, smoothies and healthy bowls',
      cuisine: ['Beverages', 'Other'], address: '101 Health Lane, Orion Mall Food Court, Bangalore',
      phone: '9876543220', email: 'info@freshjuicebar.com',
      location: { type: 'Point', coordinates: [77.5900, 12.9800] },
      rating: 4.4, totalRatings: 189, isActive: true, isVerified: true,
      preparationTime: 10, minimumOrder: 80, deliveryFee: 30, taxRate: 5
    });
    
    const dosaPoint = await Restaurant.create({
      owner: deepa._id, name: 'Dosa Point', description: 'Traditional South Indian dosas and more',
      cuisine: ['South Indian', 'Indian'], address: '102 Masala Street, Orion Mall Food Court, Bangalore',
      phone: '9876543221', email: 'info@dosapoint.com',
      location: { type: 'Point', coordinates: [77.5900, 12.9800] },
      rating: 4.6, totalRatings: 312, isActive: true, isVerified: true,
      preparationTime: 15, minimumOrder: 100, deliveryFee: 40, taxRate: 5
    });
    
    // Create menu items for each restaurant
    const menuItems = [
      // Spice Haven
      {restaurant:spiceHaven._id,name:'Butter Chicken',description:'Creamy tomato-based curry with tender chicken',price:320,category:'Main Course',cuisine:'North Indian',isVeg:false,isAvailable:true,preparationTime:20},
      {restaurant:spiceHaven._id,name:'Paneer Tikka Masala',description:'Grilled cottage cheese in spicy masala gravy',price:280,category:'Main Course',cuisine:'North Indian',isVeg:true,isAvailable:true,preparationTime:18},
      {restaurant:spiceHaven._id,name:'Masala Dosa',description:'Crispy crepe filled with spiced potato',price:150,category:'Main Course',cuisine:'South Indian',isVeg:true,isAvailable:true,preparationTime:12},
      {restaurant:spiceHaven._id,name:'Biryani',description:'Fragrant basmati rice with aromatic spices',price:350,category:'Main Course',cuisine:'Indian',isVeg:false,isAvailable:true,preparationTime:25},
      {restaurant:spiceHaven._id,name:'Gulab Jamun',description:'Sweet milk dumplings in rose syrup',price:120,category:'Desserts',cuisine:'Indian',isVeg:true,isAvailable:true,preparationTime:5},
      // Dragon Palace
      {restaurant:dragonPalace._id,name:'Kung Pao Chicken',description:'Spicy stir-fried chicken with peanuts',price:380,category:'Main Course',cuisine:'Chinese',isVeg:false,isAvailable:true,preparationTime:15},
      {restaurant:dragonPalace._id,name:'Veg Fried Rice',description:'Wok-tossed rice with fresh vegetables',price:220,category:'Main Course',cuisine:'Chinese',isVeg:true,isAvailable:true,preparationTime:12},
      {restaurant:dragonPalace._id,name:'Dim Sum Platter',description:'Assorted steamed dumplings',price:350,category: 'Appetizers',cuisine:'Chinese',isVeg:false,isAvailable:true,preparationTime:18},
      {restaurant:dragonPalace._id,name:'Hakka Noodles',description:'Stir-fried noodles with vegetables',price:250,category:'Main Course',cuisine:'Chinese',isVeg:true,isAvailable:true,preparationTime:10},
      // Pizza Fino
      {restaurant:pizzaFino._id,name:'Margherita Pizza',description:'Classic tomato, mozzarella and basil',price:350,category:'Main Course',cuisine:'Italian',isVeg:true,isAvailable:true,preparationTime:12},
      {restaurant:pizzaFino._id,name:'Pepperoni Pizza',description:'Loaded with spicy pepperoni slices',price:450,category:'Main Course',cuisine:'Italian',isVeg:false,isAvailable:true,preparationTime:14},
      {restaurant:pizzaFino._id,name:'Pasta Alfredo',description:'Creamy white sauce pasta',price:320,category:'Main Course',cuisine:'Italian',isVeg:true,isAvailable:true,preparationTime:15},
      {restaurant:pizzaFino._id,name:'Tiramisu',description:'Classic Italian coffee dessert',price:280,category:'Desserts',cuisine:'Italian',isVeg:true,isAvailable:true,preparationTime:5},
      // Fresh Juice Bar
      {restaurant:juiceBar._id,name:'Mango Smoothie',description:'Fresh mango blended with yogurt',price:180,category:'Beverages',cuisine:'Other',isVeg:true,isAvailable:true,preparationTime:5},
      {restaurant:juiceBar._id,name:'Green Detox Juice',description:'Spinach, cucumber, apple and ginger',price:200,category:'Beverages',cuisine:'Other',isVeg:true,isAvailable:true,preparationTime:5},
      {restaurant:juiceBar._id,name:'Acai Bowl',description:'Acai topped with granola and fresh fruits',price:350,category:'Main Course',cuisine:'Other',isVeg:true,isAvailable:true,preparationTime:8},
      // Dosa Point
      {restaurant:dosaPoint._id,name:'Plain Dosa',description:'Crispy golden crepe',price:80,category:'Main Course',cuisine:'South Indian',isVeg:true,isAvailable:true,preparationTime:8},
      {restaurant:dosaPoint._id,name:'Masala Dosa',description:'Crispy crepe with spiced potato filling',price:120,category:'Main Course',cuisine:'South Indian',isVeg:true,isAvailable:true,preparationTime:10},
      {restaurant:dosaPoint._id,name:'Idli Vada Combo',description:'Steamed rice cakes with crispy lentil fritters',price:100,category:'Main Course',cuisine:'South Indian',isVeg:true,isAvailable:true,preparationTime:10},
      {restaurant:dosaPoint._id,name:'Filter Coffee',description:'Traditional South Indian filter coffee',price:60,category:'Beverages',cuisine:'South Indian',isVeg:true,isAvailable:true,preparationTime:5},
    ];
    
    await MenuItem.insertMany(menuItems);
    
    // Create food courts
    const orionFoodCourt = await FoodCourt.create({
      name: 'Orion Mall Food Court',
      description: 'Premium food court at Orion Mall with diverse cuisines',
      address: 'Orion Mall, Brigade Gateway, Rajajinagar, Bangalore 560055',
      location: { type: 'Point', coordinates: [77.5900, 12.9800] },
      restaurants: [spiceHaven._id, dragonPalace._id, pizzaFino._id, juiceBar._id, dosaPoint._id],
      isActive: true,
      tables: [
        {tableNumber:'FC-T1',seats:4,isActive:true},{tableNumber:'FC-T2',seats:4,isActive:true},
        {tableNumber:'FC-T3',seats:6,isActive:true},{tableNumber:'FC-T4',seats:2,isActive:true},
        {tableNumber:'FC-T5',seats:8,isActive:true},{tableNumber:'FC-T6',seats:4,isActive:true}
      ]
    });
    
    const phoenixFoodCourt = await FoodCourt.create({
      name: 'Phoenix Market City Food Hub',
      description: 'Vibrant food hub at Phoenix Marketcity',
      address: 'Phoenix Marketcity, Whitefield, Bangalore 560048',
      location: { type: 'Point', coordinates: [77.6950, 12.9952] },
      restaurants: [spiceHaven._id, dragonPalace._id, pizzaFino._id],
      isActive: true,
      tables: [
        {tableNumber:'PH-T1',seats:4,isActive:true},{tableNumber:'PH-T2',seats:4,isActive:true},
        {tableNumber:'PH-T3',seats:6,isActive:true},{tableNumber:'PH-T4',seats:2,isActive:true}
      ]
    });
    
    res.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        users: 7,
        restaurants: 5,
        menuItems: menuItems.length,
        foodCourts: 2
      }
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/food-courts', foodCourtRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

// Log server error events
server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('Server running on port ' + PORT);
  console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
  console.log('Client URL: ' + (process.env.CLIENT_URL || 'http://localhost:3000'));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = server;
