const User = require('../models/User');
const OTP = require('../models/OTP');
const { asyncHandler } = require('../middleware/errorHandler');
const { validateEmail, validatePhone } = require('../utils/helpers');

/**
 * Register new user
 * POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  // Validation
  if (!name || !email || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide all required fields',
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format',
    });
  }

  if (!validatePhone(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone format. Phone must be 10 digits starting with 6-9',
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'Email already registered',
    });
  }

  // Customers can only self-register
  // Admins and other roles must be created by super_admin
  const userRole = role === 'customer' ? 'customer' : 'customer';

  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: userRole,
  });

  // Generate token
  const token = user.generateJWT();

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: user.toJSON(),
      token,
    },
  });
});

/**
 * Login user
 * POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password',
    });
  }

  // Find user and select password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Check password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
    });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated',
    });
  }

  // Generate token
  const token = user.generateJWT();

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: user.toJSON(),
      token,
    },
  });
});

/**
 * Get current logged-in user
 * GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
});

/**
 * Update user profile
 * PUT /api/auth/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;
  const userId = req.user.id;

  // Validation
  if (phone && !validatePhone(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone format',
    });
  }

  // Build update object
  const updateData = {};
  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;
  if (avatar) updateData.avatar = avatar;

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user,
    },
  });
});

/**
 * Add/Update user address
 * POST /api/auth/address
 */
const addAddress = asyncHandler(async (req, res) => {
  const { label, address, lat, lng, isDefault } = req.body;
  const userId = req.user.id;

  // Validation
  if (!address || lat === undefined || lng === undefined) {
    return res.status(400).json({
      success: false,
      message: 'Please provide address and coordinates',
    });
  }

  if (!['home', 'work', 'other'].includes(label)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid label. Must be home, work, or other',
    });
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  // If marking as default, unmark others
  if (isDefault) {
    user.addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  // Add new address
  user.addresses.push({
    label,
    address,
    lat,
    lng,
    isDefault: isDefault || user.addresses.length === 0,
  });

  await user.save();

  res.status(201).json({
    success: true,
    message: 'Address added successfully',
    data: {
      user,
    },
  });
});

/**
 * Delete user address
 * DELETE /api/auth/address/:addressId
 */
const deleteAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const userId = req.user.id;

  const user = await User.findByIdAndUpdate(
    userId,
    { $pull: { addresses: { _id: addressId } } },
    { new: true }
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Address deleted successfully',
    data: {
      user,
    },
  });
});

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  // Token invalidation typically handled on client-side
  // This endpoint can be used for server-side cleanup if needed

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

/**
 * Register restaurant owner + create restaurant
 * POST /api/auth/register-restaurant
 * Public â anyone can apply to become a restaurant partner
 */
const registerRestaurant = asyncHandler(async (req, res) => {
  const {
    // Owner info
    ownerName,
    email,
    phone,
    password,
    // Restaurant info
    restaurantName,
    restaurantAddress,
    restaurantPhone,
    restaurantEmail,
    cuisine,
    description,
  } = req.body;

  // Validate owner fields
  if (!ownerName || !email || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide owner name, email, phone, and password',
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email format' });
  }

  if (!validatePhone(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone format. Phone must be 10 digits starting with 6-9',
    });
  }

  // Validate restaurant fields
  if (!restaurantName || !restaurantAddress || !restaurantPhone) {
    return res.status(400).json({
      success: false,
      message: 'Please provide restaurant name, address, and phone',
    });
  }

  if (!validatePhone(restaurantPhone)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid restaurant phone format. Must be 10 digits starting with 6-9',
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email already registered' });
  }

  // Step 1: Create the restaurant_admin user
  const user = await User.create({
    name: ownerName,
    email,
    phone,
    password,
    role: 'restaurant_admin',
  });

  // Step 2: Create the restaurant (pending verification)
  const Restaurant = require('../models/Restaurant');
  const restaurant = await Restaurant.create({
    owner: user._id,
    name: restaurantName,
    address: restaurantAddress,
    phone: restaurantPhone,
    email: restaurantEmail || email,
    cuisine: Array.isArray(cuisine) && cuisine.length > 0 ? cuisine : ['Other'],
    description: description || '',
    isVerified: false, // Needs admin approval
    isActive: true,
    location: {
      type: 'Point',
      coordinates: [0, 0], // Admin can update later
    },
  });

  // Generate token
  const token = user.generateJWT();

  res.status(201).json({
    success: true,
    message: 'Restaurant registration submitted! Your restaurant will be reviewed by our team.',
    data: {
      user: user.toJSON(),
      restaurant: {
        _id: restaurant._id,
        name: restaurant.name,
        status: 'pending_verification',
      },
      token,
    },
  });
});

/**
 * Send OTP to mobile number
 * POST /api/auth/send-otp
 * Public â for customer and delivery_admin login
 */
const sendOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone || !validatePhone(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid 10-digit mobile number starting with 6-9',
    });
  }

  // Rate limit: max 1 OTP per phone per 60 seconds
  const recentOTP = await OTP.findOne({
    phone,
    createdAt: { $gte: new Date(Date.now() - 60 * 1000) },
  });

  if (recentOTP) {
    return res.status(429).json({
      success: false,
      message: 'OTP already sent. Please wait 60 seconds before requesting a new one.',
    });
  }

  // Generate 6-digit OTP (use DEV_OTP env var if set, for testing without SMS gateway)
  const otpCode = process.env.DEV_OTP || Math.floor(100000 + Math.random() * 900000).toString();

  // Delete any existing OTPs for this phone
  await OTP.deleteMany({ phone, purpose: 'login' });

  // Store OTP with 5-minute expiry
  await OTP.create({
    phone,
    otp: otpCode,
    purpose: 'login',
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });

  // Check if user exists with this phone
  const existingUser = await User.findOne({ phone, role: { $in: ['customer', 'delivery_admin'] } });

  // In production with SMS gateway, send OTP via SMS (e.g. Twilio, MSG91, Fast2SMS)
  // For now, log the OTP to console and return in response when DEV_OTP is set
  console.log(`[OTP] ${phone}: ${otpCode}`);

  res.status(200).json({
    success: true,
    message: 'OTP sent successfully',
    data: {
      phone,
      isNewUser: !existingUser,
      // Include OTP in response ONLY for development â remove in production
      ...(( process.env.DEV_OTP || process.env.NODE_ENV !== 'production') && { otp: otpCode }),
    },
  });
});

/**
 * Verify OTP and login/register
 * POST /api/auth/verify-otp
 * Public â for customer and delivery_admin login
 */
const verifyOTP = asyncHandler(async (req, res) => {
  const { phone, otp, name } = req.body;

  if (!phone || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Please provide phone and OTP',
    });
  }

  if (!validatePhone(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid phone number format',
    });
  }

  // Find the OTP record
  const otpRecord = await OTP.findOne({
    phone,
    purpose: 'login',
    expiresAt: { $gt: new Date() },
  });

  if (!otpRecord) {
    return res.status(400).json({
      success: false,
      message: 'OTP expired or not found. Please request a new one.',
    });
  }

  // Check max attempts
  if (otpRecord.attempts >= 5) {
    await OTP.deleteOne({ _id: otpRecord._id });
    return res.status(400).json({
      success: false,
      message: 'Too many failed attempts. Please request a new OTP.',
    });
  }

  // Verify OTP
  if (otpRecord.otp !== otp) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    return res.status(400).json({
      success: false,
      message: `Invalid OTP. ${5 - otpRecord.attempts} attempts remaining.`,
    });
  }

  // OTP verified â delete it
  await OTP.deleteOne({ _id: otpRecord._id });

  // Find or create user
  let user = await User.findOne({ phone, role: { $in: ['customer', 'delivery_admin'] } });

  if (!user) {
    // New user â auto-register as customer
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required for new users',
        data: { isNewUser: true },
      });
    }

    user = await User.create({
      name: name.trim(),
      phone,
      email: `${phone}@skipq.user`, // Placeholder email for OTP-only users
      password: require('crypto').randomBytes(32).toString('hex'), // Random password â user logs in via OTP only
      role: 'customer',
      isVerified: true,
    });
  }

  // Check if active
  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      message: 'Your account has been deactivated',
    });
  }

  // Mark as verified
  if (!user.isVerified) {
    user.isVerified = true;
    await user.save();
  }

  // Generate token
  const token = user.generateJWT();

  res.status(200).json({
    success: true,
    message: user.createdAt === user.updatedAt ? 'Registration successful' : 'Login successful',
    data: {
      user: user.toJSON(),
      token,
    },
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  addAddress,
  deleteAddress,
  logout,
  registerRestaurant,
  sendOTP,
  verifyOTP,
};
