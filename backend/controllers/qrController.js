const QRCode = require('qrcode');
const QRModel = require('../models/QRCode');
const Restaurant = require('../models/Restaurant');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Generate QR code for restaurant table or restaurant-only
 * POST /api/qr/generate
 * Access: restaurant_admin (owner only)
 * Body: { restaurantId, tableNumber (optional), type: 'dine_in' | 'restaurant' }
 */
const generateQRCode = asyncHandler(async (req, res) => {
  const { restaurantId, tableNumber, type } = req.body;
  const qrType = type === 'restaurant' ? 'restaurant' : 'dine_in';

  if (!restaurantId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide restaurantId',
    });
  }

  // Table number is required for dine_in QR codes
  if (qrType === 'dine_in' && !tableNumber) {
    return res.status(400).json({
      success: false,
      message: 'Please provide tableNumber for dine-in QR codes',
    });
  }

  const restaurant = await Restaurant.findById(restaurantId);

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found',
    });
  }

  // Check authorization - user must own the restaurant
  if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to generate QR codes for this restaurant',
    });
  }

  try {
    // Check if QR code already exists
    const query = qrType === 'restaurant'
      ? { restaurant: restaurantId, qrType: 'restaurant' }
      : { restaurant: restaurantId, tableNumber, qrType: 'dine_in' };

    let qrCode = await QRModel.findOne(query);

    if (qrCode) {
      return res.status(200).json({
        success: true,
        message: 'QR code already exists',
        data: {
          qrCode,
        },
      });
    }

    // Create deep link URL — clean path format for Universal Links / App Links
    // Table QR: /scan/{slug}/{tableNumber}
    // Restaurant QR: /scan/{slug}
    const deepLinkUrl = qrType === 'restaurant'
      ? `${process.env.CLIENT_URL}/scan/${restaurant.slug}`
      : `${process.env.CLIENT_URL}/scan/${restaurant.slug}/${encodeURIComponent(tableNumber)}`;

    // Generate QR code as data URL (base64 image)
    const qrCodeDataURL = await QRCode.toDataURL(deepLinkUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
    });

    // Save QR code to database
    qrCode = await QRModel.create({
      restaurant: restaurantId,
      tableNumber: qrType === 'restaurant' ? null : tableNumber,
      qrType,
      qrCodeUrl: qrCodeDataURL,
      qrCodeData: deepLinkUrl,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: qrType === 'restaurant'
        ? 'Restaurant QR code generated successfully'
        : 'QR code generated successfully',
      data: {
        qrCode,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to generate QR code: ${error.message}`,
    });
  }
});

/**
 * Get QR codes for restaurant
 * GET /api/qr/restaurant/:restaurantId
 * Access: restaurant_admin (owner only)
 */
const getQRCodes = asyncHandler(async (req, res) => {
  const { restaurantId } = req.params;

  const restaurant = await Restaurant.findById(restaurantId);

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found',
    });
  }

  // Check authorization
  if (restaurant.owner.toString() !== req.user.id && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized',
    });
  }

  const qrCodes = await QRModel.find({ restaurant: restaurantId }).sort({ tableNumber: 1 });

  res.status(200).json({
    success: true,
    data: {
      qrCodes,
    },
  });
});

/**
 * Get single QR code
 * GET /api/qr/:id
 */
const getQRCode = asyncHandler(async (req, res) => {
  const qrCode = await QRModel.findById(req.params.id).populate('restaurant', 'name slug');

  if (!qrCode) {
    return res.status(404).json({
      success: false,
      message: 'QR code not found',
    });
  }

  res.status(200).json({
    success: true,
    data: {
      qrCode,
    },
  });
});

/**
 * Download QR code as image
 * GET /api/qr/:id/download
 */
const downloadQRCode = asyncHandler(async (req, res) => {
  const qrCode = await QRModel.findById(req.params.id).populate('restaurant', 'name slug');

  if (!qrCode) {
    return res.status(404).json({
      success: false,
      message: 'QR code not found',
    });
  }

  try {
    // Convert data URL to buffer
    const base64Data = qrCode.qrCodeUrl.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Set response headers
    res.setHeader('Content-Type', 'image/png');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="QR_${qrCode.restaurant.slug}_Table_${qrCode.tableNumber}.png"`
    );

    res.send(buffer);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to download QR code: ${error.message}`,
    });
  }
});

/**
 * Track QR code scan
 * POST /api/qr/:id/scan
 * Access: Public (tracked anonymously)
 */
const trackScan = asyncHandler(async (req, res) => {
  const qrCode = await QRModel.findById(req.params.id);

  if (!qrCode) {
    return res.status(404).json({
      success: false,
      message: 'QR code not found',
    });
  }

  if (!qrCode.isActive) {
    return res.status(400).json({
      success: false,
      message: 'QR code is not active',
    });
  }

  // Increment scan count
  qrCode.scanCount = (qrCode.scanCount || 0) + 1;
  qrCode.lastScannedAt = new Date();

  await qrCode.save();

  res.status(200).json({
    success: true,
    message: 'Scan tracked',
    data: {
      qrCode,
    },
  });
});

/**
 * Deep link resolve — called by the scan landing page
 * GET /api/qr/resolve/:slug/:tableNumber?
 * Access: Public
 * Returns restaurant info + deep link URLs + tracks the scan
 * tableNumber is optional — if missing, treats as restaurant-only QR
 */
const resolveDeepLink = asyncHandler(async (req, res) => {
  const { slug, tableNumber } = req.params;
  const hasTable = tableNumber && tableNumber !== 'undefined' && tableNumber !== 'null';

  // Find restaurant by slug
  const restaurant = await Restaurant.findOne({ slug }).select('name slug cuisines images isActive');

  if (!restaurant) {
    return res.status(404).json({
      success: false,
      message: 'Restaurant not found',
    });
  }

  if (!restaurant.isActive) {
    return res.status(400).json({
      success: false,
      message: 'This restaurant is currently unavailable',
    });
  }

  // Find and validate QR code
  let qrCode;
  if (hasTable) {
    qrCode = await QRModel.findOne({
      restaurant: restaurant._id,
      tableNumber: decodeURIComponent(tableNumber),
    });
  } else {
    qrCode = await QRModel.findOne({
      restaurant: restaurant._id,
      qrType: 'restaurant',
    });
  }

  if (qrCode && !qrCode.isActive) {
    return res.status(400).json({
      success: false,
      message: 'This QR code has been deactivated',
    });
  }

  // Track the scan if QR exists
  if (qrCode) {
    qrCode.scanCount = (qrCode.scanCount || 0) + 1;
    qrCode.lastScannedAt = new Date();
    await qrCode.save();
  }

  // Detect device from User-Agent
  const ua = req.headers['user-agent'] || '';
  let platform = 'desktop';
  if (/android/i.test(ua)) platform = 'android';
  else if (/iphone|ipad|ipod/i.test(ua)) platform = 'ios';

  // Build deep link URLs
  const tableParam = hasTable ? `?table=${encodeURIComponent(tableNumber)}` : '';
  const tablePath = hasTable ? `/${encodeURIComponent(tableNumber)}` : '';

  // Custom URL scheme for the native app
  const appSchemeUrl = `skipq://restaurant/${slug}${tableParam}`;

  // Universal Links / App Links (when domain is configured)
  const webUrl = `${process.env.CLIENT_URL}/scan/${slug}${tablePath}`;

  // App store URLs (update these with real store IDs when published)
  const appStoreUrl = process.env.IOS_APP_STORE_URL || 'https://apps.apple.com/app/skipq/id000000000';
  const playStoreUrl = process.env.ANDROID_PLAY_STORE_URL || 'https://play.google.com/store/apps/details?id=com.skipq.app';

  // Intent URL for Android (tries app, falls back to Play Store)
  const androidIntentUrl = `intent://restaurant/${slug}${tableParam}#Intent;scheme=skipq;package=com.skipq.app;S.browser_fallback_url=${encodeURIComponent(playStoreUrl)};end`;

  res.status(200).json({
    success: true,
    data: {
      restaurant: {
        name: restaurant.name,
        slug: restaurant.slug,
        cuisines: restaurant.cuisines,
        image: restaurant.images?.[0] || null,
      },
      tableNumber: hasTable ? decodeURIComponent(tableNumber) : null,
      qrType: hasTable ? 'dine_in' : 'restaurant',
      platform,
      deepLinks: {
        appScheme: appSchemeUrl,
        androidIntent: androidIntentUrl,
        appStore: appStoreUrl,
        playStore: playStoreUrl,
        web: webUrl,
      },
    },
  });
});

/**
 * Toggle QR code active status
 * PATCH /api/qr/:id/toggle
 * Access: restaurant_admin (owner only)
 */
const toggleQRCodeActive = asyncHandler(async (req, res) => {
  const qrCode = await QRModel.findById(req.params.id).populate('restaurant');

  if (!qrCode) {
    return res.status(404).json({
      success: false,
      message: 'QR code not found',
    });
  }

  // Check authorization
  if (qrCode.restaurant.owner.toString() !== req.user.id && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized',
    });
  }

  qrCode.isActive = !qrCode.isActive;
  await qrCode.save();

  res.status(200).json({
    success: true,
    message: `QR code ${qrCode.isActive ? 'activated' : 'deactivated'}`,
    data: {
      qrCode,
    },
  });
});

/**
 * Delete QR code
 * DELETE /api/qr/:id
 * Access: restaurant_admin (owner only)
 */
const deleteQRCode = asyncHandler(async (req, res) => {
  const qrCode = await QRModel.findById(req.params.id).populate('restaurant');

  if (!qrCode) {
    return res.status(404).json({
      success: false,
      message: 'QR code not found',
    });
  }

  // Check authorization
  if (qrCode.restaurant.owner.toString() !== req.user.id && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      message: 'Not authorized',
    });
  }

  await QRModel.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'QR code deleted successfully',
  });
});

module.exports = {
  generateQRCode,
  getQRCodes,
  getQRCode,
  downloadQRCode,
  trackScan,
  resolveDeepLink,
  toggleQRCodeActive,
  deleteQRCode,
};
