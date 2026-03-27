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

// Temporary fix endpoint - rehash passwords and set phone numbers (REMOVE AFTER USE)
app.post('/api/fix-users', async (req, res) => {
  try {
    if (req.headers['x-seed-key'] !== 'skipq-seed-2024') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');

    const phoneMap = {
      'superadmin@skipq.com': '9876543210',
      'admin@skipq.com': '9876543211',
      'raj@spicehaven.com': '9876543212',
      'maria@pizzafino.com': '9876543213',
      'wei@dragonpalace.com': '9876543220',
      'sanjay@juicebar.com': '9876543214',
      'deepa@dosapoint.com': '9876543215',
    };

    const users = await User.find({}).select('+password');
    const results = [];

    for (const user of users) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123', salt);
      const updates = { password: hashedPassword };
      if (phoneMap[user.email] && !user.phone) {
        updates.phone = phoneMap[user.email];
      }
      await User.updateOne({ _id: user._id }, { $set: updates });
      results.push({
        name: user.name,
        email: user.email,
        phone: phoneMap[user.email] || user.phone,
        role: user.role,
      });
    }

    res.json({ success: true, message: 'Users fixed', users: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
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

// Log server error events (e.g. EADDRINUSE, EACCES)
server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`);
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
