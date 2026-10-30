/**
 * @file authController.js
 * @description Controller for Virtual Identity registration, session-based authentication,
 * and user profile management.
 */

const authService = require('../services/authService');
const userModel = require('../models/userModel');
const db = require('../models/db');

/**
 * Register a new user and establish a persistent session
 */
exports.register = async (req, res, next) => {
  try {
    const { username, password, displayName } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

    const user = await authService.register({ username, password, displayName }, ipAddress);

    // Establish virtual identity session state in cookie
    req.session.userId = user.id;

    return res.status(201).json({
      success: true,
      message: 'Virtual identity created successfully.',
      data: { user }
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Authenticate existing credentials and bind session to virtual identity
 */
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

    const user = await authService.login({ username, password }, ipAddress);

    // Save user ID into encrypted server session
    req.session.userId = user.id;

    return res.status(200).json({
      success: true,
      message: 'Authentication successful. Virtual identity established.',
      data: { user }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Terminates user session and disassociates virtual identity
 */
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Could not log out at this time.'
      });
    }
    res.clearCookie('connect.sid'); // Clear Express session cookie
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  });
};

/**
 * Returns current authenticated virtual identity
 */
exports.getMe = (req, res) => {
  if (!req.currentUser) {
    return res.status(200).json({
      success: true,
      data: {
        authenticated: false,
        user: null
      }
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      authenticated: true,
      user: req.currentUser
    }
  });
};

/**
 * Update virtual identity custom styling / avatar / display name
 */
exports.updateProfile = (req, res, next) => {
  try {
    const { displayName, avatarColor } = req.body;
    const userId = req.currentUser.id;

    const updates = {};
    if (displayName && typeof displayName === 'string') updates.displayName = displayName.trim();
    if (avatarColor && typeof avatarColor === 'string') updates.avatarColor = avatarColor.trim();

    const updated = db.update('users', userId, updates);
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: userModel.sanitize(updated) }
    });
  } catch (error) {
    next(error);
  }
};
