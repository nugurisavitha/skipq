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