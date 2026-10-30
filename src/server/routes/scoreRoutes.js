/**
 * @file scoreRoutes.js
 * @description Gameplay scoring and leaderboard routes.
 */

const express = require('express');
const router = express.Router();
const scoreController = require('../controllers/scoreController');

// Submit new game score (authenticated or guest)
router.post('/', scoreController.saveScore);

// Retrieve global leaderboard
router.get('/leaderboard', scoreController.getLeaderboard);

// Retrieve authenticated user's score history
router.get('/history', scoreController.getUserHistory);

module.exports = router;
