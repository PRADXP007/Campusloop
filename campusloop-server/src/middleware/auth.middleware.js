const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * Middleware: Verify JWT access token.
 * Attaches `req.user` (full user document minus sensitive fields).
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Support Bearer token in Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated. Please log in.',
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    // Fetch fresh user from DB (handles deleted/deactivated accounts)
    const user = await User.findById(decoded.id).populate({
      path: 'college',
      populate: [
        { path: 'state', select: 'name' },
        { path: 'district', select: 'name' },
      ],
    });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }
};

/**
 * Middleware: Require verified email before accessing a route.
 */
const requireVerified = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address first.',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }
  next();
};

/**
 * Middleware: Require fully verified student ID card + selfie.
 */
const requireFullVerification = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please complete your student identity verification (ID card + selfie) first to perform this action.',
      code: 'NOT_FULLY_VERIFIED',
    });
  }
  next();
};

module.exports = { protect, requireVerified, requireFullVerification };
