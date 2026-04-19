import { format } from 'date-fns';
import { Colors } from '../theme/colors';

/**
 * Format amount as currency with Rs symbol
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string (e.g., "Rs 1,234.50")
 */
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'Rs 0.00';

  return `Rs ${Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format date using date-fns
 * @param {Date|number} date - Date to format
 * @param {string} dateFormat - Format string (default: 'dd MMM yyyy')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, dateFormat = 'dd MMM yyyy') => {
  try {
    if (!date) return '';
    return format(new Date(date), dateFormat);
  } catch (error) {
    console.warn('Invalid date:', date);
    return '';
  }
};

/**
 * Format time
 * @param {Date|number} date - Date to format
 * @param {string} timeFormat - Format string (default: 'HH:mm')
 * @returns {string} Formatted time string
 */
export const formatTime = (date, timeFormat = 'HH:mm') => {
  try {
    if (!date) return '';
    return format(new Date(date), timeFormat);
  } catch (error) {
    console.warn('Invalid date:', date);
    return '';
  }
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get status color for order status
 * @param {string} status - Order status
 * @returns {string} Hex color code
 */
export const getStatusColor = (status) => {
  const statusColors = {
    pending: '#FBBF24',
    confirmed: Colors.info,
    preparing: '#EA580C',
    ready: Colors.success,
    delivered: Colors.textSecondary,
    cancelled: Colors.error,
  };

  return statusColors[status] || Colors.textMuted;
};

/**
 * Get initials from name for avatar
 * @param {string} name - Full name
 * @returns {string} Initials (e.g., "JD" for "John Doe")
 */
export const getInitials = (name) => {
  if (!name) return '';

  const parts = name.trim().split(' ');

  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return name.substring(0, 2).toUpperCase();
};
