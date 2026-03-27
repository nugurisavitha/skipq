const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const authController = require('../controllers/authController');

/**
 * Authentication Routes
 */

// Public routes
router.post('/register', authController.register);
router.post('/register-restaurant', authController.registerRestaurant);
router.post('/login', authController.login);
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);

// Protected routes (require authentication)
router.use(authMiddleware);

router.get('/me', authController.getMe);
router.put('/profile', authController.updateProfile);
router.post('/address', authController.addAddress);
router.delete('/address/:addressId', authController.deleteAddress);
router.post('/logout', authController.logout);

module.exports = router;
