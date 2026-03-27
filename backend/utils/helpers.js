/**
 * Generate unique order number
 * Format: ORD-{timestamp}-{random}
 * Example: ORD-1234567890-ABC123
 */
const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First point latitude
 * @param {number} lon1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lon2 - Second point longitude
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return parseFloat(distance.toFixed(2));
};

/**
 * Format price to currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: INR)
 * @returns {string} Formatted price
 */
const formatCurrency = (amount, currency = 'INR') => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  });

  return formatter.format(amount);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone format (Indian phone number)
 * @param {string} phone - Phone to validate
 * @returns {boolean}
 */
const validatePhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Get current day name
 * @returns {string} Day name (Monday, Tuesday, etc.)
 */
const getCurrentDay = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

/**
 * Check if restaurant is open at a given time
 * @param {Array} openingHours - Opening hours array from restaurant
 * @param {Date} dateTime - Date and time to check
 * @returns {boolean}
 */
const isRestaurantOpen = (openingHours, dateTime = new Date()) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[dateTime.getDay()];
  const currentHours = openingHours.find((h) => h.day === dayName);

  if (!currentHours || currentHours.isClosed) {
    return false;
  }

  const time = dateTime.getHours().toString().padStart(2, '0') + ':' + dateTime.getMinutes().toString().padStart(2, '0');

  return time >= currentHours.open && time <= currentHours.close;
};

/**
 * Calculate estimated delivery time
 * @param {number} distance - Distance in kilometers
 * @param {number} preparationTime - Preparation time in minutes
 * @returns {number} Estimated delivery time in minutes
 */
const calculateDeliveryTime = (distance, preparationTime = 30) => {
  // Assume average speed of 15 km/hour for delivery
  const deliveryTime = (distance / 15) * 60; // convert to minutes
  return Math.ceil(preparationTime + deliveryTime);
};

/**
 * Create pagination object
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination object with skip and limit
 */
const getPagination = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, limit };
};

/**
 * Generate slug from string
 * @param {string} str - String to convert to slug
 * @returns {string} Slug
 */
const generateSlug = (str) => {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

module.exports = {
  generateOrderNumber,
  calculateDistance,
  formatCurrency,
  validateEmail,
  validatePhone,
  getCurrentDay,
  isRestaurantOpen,
  calculateDeliveryTime,
  getPagination,
  generateSlug,
};
