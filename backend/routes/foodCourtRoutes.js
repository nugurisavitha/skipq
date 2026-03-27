const router = require('express').Router();
const { authMiddleware, authorize } = require('../middleware/auth');
const {
  getAllFoodCourts,
  getFoodCourtBySlug,
  getFoodCourtById,
  getFoodCourtMenu,
  createFoodCourtOrder,
  createFoodCourt,
  updateFoodCourt,
  deleteFoodCourt,
  addRestaurant,
  removeRestaurant,
  updateRestaurantStatus,
  getRestaurantFoodCourtOrders,
  getNearbyFoodCourt
} = require('../controllers/foodCourtController');

// Public routes
router.get('/', getAllFoodCourts);
router.get('/nearby', getNearbyFoodCourt); // Must be before /:id
router.get('/slug/:slug', getFoodCourtBySlug);
router.get('/:id', getFoodCourtById);
router.get('/:id/menu', getFoodCourtMenu);

// Protected routes (customer)
router.post('/:id/order', authMiddleware, authorize('customer'), createFoodCourtOrder);

// Admin routes
router.post('/', authMiddleware, authorize('admin', 'super_admin'), createFoodCourt);
router.put('/:id', authMiddleware, authorize('admin', 'super_admin'), updateFoodCourt);
router.delete('/:id', authMiddleware, authorize('super_admin'), deleteFoodCourt);

// Food court order status (restaurant admin marks items ready)
router.patch('/orders/:orderId/restaurant-status', authMiddleware, authorize('restaurant_admin', 'admin', 'super_admin'), updateRestaurantStatus);
router.get('/orders/restaurant/:restaurantId', authMiddleware, authorize('restaurant_admin', 'admin', 'super_admin'), getRestaurantFoodCourtOrders);

// Restaurant management routes
router.patch('/:id/restaurants', authMiddleware, authorize('admin', 'super_admin'), addRestaurant);
router.delete('/:id/restaurants/:restaurantId', authMiddleware, authorize('admin', 'super_admin'), removeRestaurant);

module.exports = router;
