/**
 * @file authRoutes.js
 * @description Authentication and Virtual Identity endpoints.
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth } = require('../middleware/authMiddleware');

// Public endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', authController.getMe);

// Protected endpoints (requires authenticated virtual identity)
router.put('/profile', requireAuth, authController.updateProfile);

module.exports = router;
