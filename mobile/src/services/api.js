import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://beta.skipqapp.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('token');
    }
    return Promise.reject(error);
  },
);

// --- Auth ---
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  registerRestaurant: (data) => api.post('/auth/register-restaurant', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  sendOTP: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
};

// --- Restaurants ---
export const restaurantAPI = {
  getAll: (params) => api.get('/restaurants', { params }),
  getById: (id) => api.get(`/restaurants/id/${id}`),
  getBySlug: (slug) => api.get(`/restaurants/slug/${slug}`),
  create: (data) => api.post('/restaurants', data),
  update: (id, data) => api.put(`/restaurants/${id}`, data),
  getMine: () => api.get('/restaurants/my/restaurant'),
};

// --- Menu ---
export const menuAPI = {
  getByRestaurant: (restaurantId, params) =>
    api.get('/menu', { params: { restaurantId, ...params } }),
  create: (data) => api.post('/menu', data),
  update: (itemId, data) => api.put(`/menu/${itemId}`, data),
  delete: (itemId) => api.delete(`/menu/${itemId}`),
  toggleAvailability: (itemId) => api.patch(`/menu/${itemId}/toggle-availability`),
  getCategories: (restaurantId) =>
    api.get('/menu/categories', { params: { restaurantId } }),
  cloneMenu: (data) => api.post('/menu/clone', data),
  importItems: (data) => api.post('/menu/import', data),
};

// --- Orders ---
export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getById: (orderId) => api.get(`/orders/${orderId}`),
  updateStatus: (orderId, data) => api.patch(`/orders/${orderId}/status`, data),
  cancel: (orderId) => api.patch(`/orders/${orderId}/cancel`),
  assignDelivery: (orderId, data) =>
    api.patch(`/orders/${orderId}/assign-delivery`, data),
};

// --- Payments ---
export const paymentAPI = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verify: (data) => api.post('/payments/verify', data),
};

// --- QR Codes ---
export const qrAPI = {
  generate: (data) => api.post('/qr/generate', data),
  getByRestaurant: (restaurantId) => api.get(`/qr/restaurant/${restaurantId}`),
  getById: (id) => api.get(`/qr/${id}`),
  download: (qrCodeId) => api.get(`/qr/${qrCodeId}/download`, { responseType: 'blob' }),
  scan: (id) => api.post(`/qr/${id}/scan`),
  resolve: (slug, tableNumber) => api.get(`/qr/resolve/${slug}/${tableNumber}`),
  toggle: (id) => api.patch(`/qr/${id}/toggle`),
  delete: (id) => api.delete(`/qr/${id}`),
};

// --- Admin ---
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (userId, role) => api.patch(`/admin/users/${userId}/role`, { role }),
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  getRestaurants: (params) => api.get('/admin/restaurants', { params }),
  approveRestaurant: (id) => api.post(`/admin/restaurants/${id}/approve`),
  rejectRestaurant: (id) => api.post(`/admin/restaurants/${id}/reject`),
  createAdmin: (data) => api.post('/admin/create-admin', data),
};

// --- Delivery ---
export const deliveryAPI = {
  signup: (data) => api.post('/delivery/signup', data),
  getMe: () => api.get('/delivery/me'),
  updateRateCard: (data) => api.patch('/delivery/me/rate-card', data),
  setOnline: (data) => api.patch('/delivery/me/online', data),
  updateLocation: (data) => api.patch('/delivery/me/location', data),
  getActiveTrip: () => api.get('/delivery/me/active-trip'),
  getOffers: () => api.get('/delivery/offers'),
  acceptOffer: (orderId) => api.post(`/delivery/offers/${orderId}/accept`),
  rejectOffer: (orderId) => api.post(`/delivery/offers/${orderId}/reject`),
  markPickedUp: (orderId) => api.post(`/delivery/orders/${orderId}/pickup`),
  markDelivered: (orderId) => api.post(`/delivery/orders/${orderId}/deliver`),
  getPendingAgents: () => api.get('/delivery/agents/pending'),
  setAgentApproval: (id, data) => api.patch(`/delivery/agents/${id}/approval`, data),
  getEarnings: (params) => api.get('/delivery/earnings', { params }),
  getOrders: (params) => api.get('/delivery/orders', { params }),
  getHistory: (params) => api.get('/delivery/history', { params }),
  getStats: () => api.get('/delivery/stats'),
};

// --- Food Courts ---
export const foodCourtAPI = {
  getAll: (params) => api.get('/food-courts', { params }),
  getNearby: (lat, lng, radius) =>
    api.get('/food-courts/nearby', { params: { lat, lng, radius } }),
  getById: (id) => api.get(`/food-courts/${id}`),
  getBySlug: (slug) => api.get(`/food-courts/slug/${slug}`),
  getMenu: (id) => api.get(`/food-courts/${id}/menu`),
  createOrder: (id, data) => api.post(`/food-courts/${id}/order`, data),
  create: (data) => api.post('/food-courts', data),
  update: (id, data) => api.put(`/food-courts/${id}`, data),
  delete: (id) => api.delete(`/food-courts/${id}`),
  addRestaurant: (id, data) => api.patch(`/food-courts/${id}/restaurants`, data),
  removeRestaurant: (id, restaurantId) =>
    api.delete(`/food-courts/${id}/restaurants/${restaurantId}`),
  updateRestaurantStatus: (orderId, data) =>
    api.patch(`/food-courts/orders/${orderId}/restaurant-status`, data),
};

export default api;