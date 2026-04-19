import axios from 'axios';

// Use relative URL so requests go through Vite proxy in dev (avoids CORS issues)
const baseURL = import.meta.env.VITE_API_URL || '/api';

const instance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Handle responses and errors
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Auto-logout on 401
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

// Auth API
export const authAPI = {
  login: (data) => instance.post('/auth/login', data),
  register: (data) => instance.post('/auth/register', data),
  registerRestaurant: (data) => instance.post('/auth/register-restaurant', data),
  getMe: () => instance.get('/auth/me'),
  updateProfile: (data) => instance.put('/auth/profile', data),
  sendOTP: (phone) => instance.post('/auth/send-otp', { phone }),
  verifyOTP: (data) => instance.post('/auth/verify-otp', data),
};

// Restaurants API
export const restaurantsAPI = {
  getAll: (params) => instance.get('/restaurants', { params }),
  getById: (id) => instance.get(`/restaurants/id/${id}`),
  getBySlug: (slug) => instance.get(`/restaurants/slug/${slug}`),
  create: (data) => instance.post('/restaurants', data),
  update: (id, data) => instance.put(`/restaurants/${id}`, data),
  getMine: () => instance.get('/restaurants/my/restaurant'),
};

// Menu API
export const menuAPI = {
  getByRestaurant: (restaurantId, includeUnavailable = false) =>
    instance.get('/menu', {
      params: { restaurantId, ...(includeUnavailable ? { all: true } : {}) },
    }),
  create: (data) => instance.post('/menu', data),
  update: (itemId, data) => instance.put(`/menu/${itemId}`, data),
  delete: (itemId) => instance.delete(`/menu/${itemId}`),
  toggleAvailability: (itemId) =>
    instance.patch(`/menu/${itemId}/toggle-availability`),
  getCategories: (restaurantId) =>
    instance.get('/menu/categories', { params: { restaurantId } }),
  cloneMenu: (sourceRestaurantId, targetRestaurantId) =>
    instance.post('/menu/clone', { sourceRestaurantId, targetRestaurantId }),
  bulkImport: (restaurantId, items) =>
    instance.post('/menu/import', { restaurantId, items }),
};

// Orders API
export const ordersAPI = {
  create: (data) => instance.post('/orders', data),
  getAll: (params) => instance.get('/orders', { params }),
  getById: (orderId) => instance.get(`/orders/${orderId}`),
  updateStatus: (orderId, status, estimatedTime) =>
    instance.patch(`/orders/${orderId}/status`, { status, ...(estimatedTime ? { estimatedTime } : {}) }),
  cancel: (orderId) => instance.patch(`/orders/${orderId}/cancel`),
  assignDelivery: (orderId, deliveryId) =>
    instance.patch(`/orders/${orderId}/assign-delivery`, { deliveryId }),
};

// Payments API
export const paymentsAPI = {
  createOrder: (data) => instance.post('/payments/create-order', data),
  verify: (data) => instance.post('/payments/verify', data),
};

// QR Codes API
export const qrAPI = {
  generate: (data) => instance.post('/qr/generate', data),
  getForRestaurant: (restaurantId) =>
    instance.get(`/qr/restaurant/${restaurantId}`),
  getById: (id) => instance.get(`/qr/${id}`),
  download: (qrCodeId) =>
    instance.get(`/qr/${qrCodeId}/download`, {
      responseType: 'blob',
    }),
  trackScan: (id) => instance.post(`/qr/${id}/scan`),
  resolveDeepLink: (slug, tableNumber) =>
    tableNumber
      ? instance.get(`/qr/resolve/${slug}/${encodeURIComponent(tableNumber)}`)
      : instance.get(`/qr/resolve/${slug}`),
  toggle: (id) => instance.patch(`/qr/${id}/toggle`),
  delete: (id) => instance.delete(`/qr/${id}`),
};

// Admin API
export const adminAPI = {
  getDashboard: () => instance.get('/admin/dashboard'),
  getUsers: (params) => instance.get('/admin/users', { params }),
  updateRole: (userId, role) =>
    instance.patch(`/admin/users/${userId}/role`, { role }),
  getAnalytics: (params) => instance.get('/admin/analytics', { params }),
  getRestaurants: (params) => instance.get('/admin/restaurants', { params }),
  approveRestaurant: (restaurantId) =>
    instance.post(`/admin/restaurants/${restaurantId}/approve`),
  rejectRestaurant: (restaurantId) =>
    instance.post(`/admin/restaurants/${restaurantId}/reject`),
  createAdmin: (data) => instance.post('/admin/create-admin', data),
};

// Delivery API
export const deliveryAPI = {
  // Agent self-service
  signup: (data) => instance.post('/delivery/signup', data),
  getMe: () => instance.get('/delivery/me'),
  updateRateCard: (data) => instance.patch('/delivery/me/rate-card', data),
  setOnline: (data) => instance.patch('/delivery/me/online', data),
  updateAgentLocation: (data) => instance.patch('/delivery/me/location', data),
  getActiveTrip: () => instance.get('/delivery/me/active-trip'),
  // Offers
  getOffers: () => instance.get('/delivery/offers'),
  acceptOffer: (orderId) => instance.post(`/delivery/offers/${orderId}/accept`),
  rejectOffer: (orderId) => instance.post(`/delivery/offers/${orderId}/reject`),
  // Trip actions
  markPickedUp: (orderId) => instance.post(`/delivery/orders/${orderId}/pickup`),
  markDelivered: (orderId) => instance.post(`/delivery/orders/${orderId}/deliver`),
  // Admin
  listPendingAgents: () => instance.get('/delivery/agents/pending'),
  setAgentApproval: (id, data) => instance.patch(`/delivery/agents/${id}/approval`, data),
  // Legacy
  getAssigned: (params) => instance.get('/delivery/orders', { params }),
  updateStatus: (orderId, status) =>
    instance.patch(`/delivery/orders/${orderId}/status`, { status }),
  getHistory: (params) => instance.get('/delivery/history', { params }),
  toggleAvailability: (available) =>
    instance.patch('/delivery/availability', { available }),
  getEarnings: (params) => instance.get('/delivery/earnings', { params }),
};

// Food Courts API
export const foodCourtsAPI = {
  getAll: (params) => instance.get('/food-courts', { params }),
  getNearby: (lat, lng, radius) => instance.get('/food-courts/nearby', { params: { lat, lng, radius } }),
  getById: (id) => instance.get(`/food-courts/${id}`),
  getBySlug: (slug) => instance.get(`/food-courts/slug/${slug}`),
  getMenu: (id) => instance.get(`/food-courts/${id}/menu`),
  createOrder: (id, data) => instance.post(`/food-courts/${id}/order`, data),
  create: (data) => instance.post('/food-courts', data),
  update: (id, data) => instance.put(`/food-courts/${id}`, data),
  delete: (id) => instance.delete(`/food-courts/${id}`),
  addRestaurant: (id, restaurantId) => instance.patch(`/food-courts/${id}/restaurants`, { restaurantId }),
  removeRestaurant: (id, restaurantId) => instance.delete(`/food-courts/${id}/restaurants/${restaurantId}`),
  updateRestaurantStatus: (orderId, restaurantId, status, estimatedTime) =>
    instance.patch(`/food-courts/orders/${orderId}/restaurant-status`, {
      restaurantId, status, ...(estimatedTime ? { estimatedTime } : {}),
    }),
  getRestaurantOrders: (restaurantId, params) =>
    instance.get(`/food-courts/orders/restaurant/${restaurantId}`, { params }),
};

// Export organized API methods
const api = {
  auth: authAPI,
  restaurants: restaurantsAPI,
  menu: menuAPI,
  orders: ordersAPI,
  payments: paymentsAPI,
  qr: qrAPI,
  admin: adminAPI,
  delivery: deliveryAPI,
  foodCourts: foodCourtsAPI,
};

export default api;
