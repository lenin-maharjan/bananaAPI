/**
 * @file config.js
 * @description Centralized server configuration constants and environment parameters.
 * @module config
 * 
 * References:
 * - Marc Conrad's Banana API Documentation: https://marcconrad.com/uob/banana/doc.php
 */

const path = require('path');

module.exports = {
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  SESSION_SECRET: process.env.SESSION_SECRET || 'banana_enterprise_super_secret_key_2026',
  
  // External Banana REST API Settings (Interoperability target)
  BANANA_API: {
    BASE_URL: 'https://marcconrad.com/uob/banana/api.php',
    FALLBACK_HTTP_URL: 'http://marcconrad.com/uob/banana/api.php',
    TIMEOUT_MS: 6000, // 6 seconds network timeout threshold
    DEFAULT_FORMAT: 'json',
    BASE64_ENABLED: 'no'
  },

  // Storage Paths
  DATABASE: {
    FILE_PATH: path.join(__dirname, '..', '..', 'data', 'store.json')
  },

  // Game Engine Constants
  GAME: {
    ROUND_DURATION_SECONDS: 30,
    BASE_POINTS_PER_SOLVE: 100,
    SPEED_BONUS_MAX: 50,
    STREAK_MULTIPLIER_STEP: 0.2
  }
};
