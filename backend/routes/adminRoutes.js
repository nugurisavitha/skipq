const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

/**
 * Admin Routes - All require authentication and admin role
 */

router.use(authMiddleware);
router.use(authorize('admin', 'super_admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Users
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/role', authorize('super_admin'), adminController.updateUserRole);
router.patch('/users/:id/toggle-status', adminController.toggleUserStatus);

// Orders
router.get('/orders', adminController.getAllOrders);

// Analytics
router.get('/analytics', adminController.getAnalytics);
router.get('/analytics/revenue', adminController.getRevenueAnalytics);

// Restaurant management
router.get('/restaurants', adminController.getAllAdminRestaurants);
router.get('/restaurants/pending', adminController.getPendingRestaurants);
router.post('/restaurants/:id/approve', adminController.approveRestaurant);
router.post('/restaurants/:id/reject', adminController.rejectRestaurant);

// Create admin (super_admin only)
router.post('/create-admin', authorize('super_admin'), adminController.createAdmin);

module.exports = router;
