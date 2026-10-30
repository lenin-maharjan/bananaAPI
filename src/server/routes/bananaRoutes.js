/**
 * @file bananaRoutes.js
 * @description API route definitions for Banana puzzle operations and telemetry.
 */

const express = require('express');
const router = express.Router();
const bananaController = require('../controllers/bananaController');

// GET /api/banana/puzzle - Request fresh puzzle (client receives image only)
router.get('/puzzle', bananaController.getNewPuzzle);

// POST /api/banana/verify - Validate answer securely server-side
router.post('/verify', bananaController.verifyAnswer);

// GET /api/banana/status - Real-time interoperability status & telemetry
router.get('/status', bananaController.getApiStatus);

module.exports = router;
