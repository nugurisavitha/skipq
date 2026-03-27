const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/auth');
const qrController = require('../controllers/qrController');

/**
 * QR Code Routes
 */

// Generate QR code (restaurant_admin only)
router.post('/generate', authMiddleware, qrController.generateQRCode);

// Get QR codes for restaurant
router.get('/restaurant/:restaurantId', authMiddleware, qrController.getQRCodes);

// Get single QR code
router.get('/:id', qrController.getQRCode);

// Download QR code
router.get('/:id/download', qrController.downloadQRCode);

// Resolve deep link (public) — used by scan landing page
// With table number (dine-in QR)
router.get('/resolve/:slug/:tableNumber', qrController.resolveDeepLink);
// Without table number (restaurant-only QR)
router.get('/resolve/:slug', qrController.resolveDeepLink);

// Track scan (public)
router.post('/:id/scan', qrController.trackScan);

// Toggle QR code active status
router.patch('/:id/toggle', authMiddleware, qrController.toggleQRCodeActive);

// Delete QR code
router.delete('/:id', authMiddleware, qrController.deleteQRCode);

module.exports = router;
