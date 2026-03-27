const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/auth');
const restaurantController = require('../controllers/restaurantController');

/**
 * Restaurant Routes
 */

// Public routes
router.get('/', restaurantController.getRestaurants);
router.get('/id/:id', restaurantController.getRestaurant);
router.get('/slug/:slug', restaurantController.getRestaurantBySlug);

// Protected routes
router.use(authMiddleware);

// Restaurant management (admin/super_admin)
router.post('/', authorize('admin', 'super_admin'), restaurantController.createRestaurant);

// Restaurant-specific routes
router.get('/my/restaurant', authorize('restaurant_admin'), restaurantController.getMyRestaurant);

router.put('/:id', restaurantController.updateRestaurant);
router.patch('/:id/toggle-active', restaurantController.toggleActive);
router.patch('/:id/verify', authorize('admin', 'super_admin'), restaurantController.verifyRestaurant);

// Table management
router.post('/:id/tables', restaurantController.manageTables);

module.exports = router;
