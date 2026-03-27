const jwt = require('jsonwebtoken');

/**
 * Verify JWT token and attach user to request
 */
const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
};

/**
 * Authorization middleware - checks if user has required roles
 * @param {...string} roles - Roles allowed to access the endpoint
 * @returns {Function} Middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `This action requires one of these roles: ${roles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Optional auth middleware - doesn't throw error if token is missing
 * Useful for endpoints that work both authenticated and unauthenticated
 */
const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
  } catch (error) {
    // Silently fail, user will be undefined
  }
  next();
};

module.exports = { authMiddleware, authorize, optionalAuth };
