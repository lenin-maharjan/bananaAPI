/**
 * @file authMiddleware.js
 * @description Session validation and security guard middleware for Virtual Identity.
 * Implements HTTP session state verification and role/identity attachment.
 */

const userModel = require('../models/userModel');

/**
 * Middleware that loads and attaches the user's virtual identity to the request context
 * if an active session cookie exists.
 */
exports.attachUser = (req, res, next) => {
  if (req.session && req.session.userId) {
    const user = userModel.findById(req.session.userId);
    if (user) {
      req.currentUser = userModel.sanitize(user);
    } else {
      // Invalidate orphaned session
      delete req.session.userId;
      req.currentUser = null;
    }
  } else {
    req.currentUser = null;
  }
  next();
};

/**
 * Middleware guard that restricts endpoints to authenticated virtual identities only.
 */
exports.requireAuth = (req, res, next) => {
  if (!req.session || !req.session.userId || !req.currentUser) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in to establish your virtual identity.'
    });
  }
  next();
};
