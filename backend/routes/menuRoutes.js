const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/auth');
const menuController = require('../controllers/menuController');

/**
 * Menu Routes
 */

// Public routes
router.get('/', menuController.getMenuByRestaurant);
router.get('/categories', menuController.getMenuCategories);
router.get('/:id', menuController.getMenuItem);

// Protected routes
router.use(authMiddleware);

// Clone menu between restaurants (admin, super_admin, or restaurant_admin for own restaurant)
router.post('/clone', authorize('admin', 'super_admin', 'restaurant_admin'), menuController.cloneMenu);

// Bulk import menu items
router.post('/import', authorize('restaurant_admin', 'admin', 'super_admin'), menuController.bulkImportMenu);

// Menu management (restaurant_admin)
router.post('/', authorize('restaurant_admin', 'super_admin'), menuController.createMenuItem);
router.put('/:id', menuController.updateMenuItem);
router.delete('/:id', menuController.deleteMenuItem);
router.patch('/:id/toggle-availability', menuController.toggleAvailability);

module.exports = router;
