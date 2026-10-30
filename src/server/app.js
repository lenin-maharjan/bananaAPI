/**
 * @file app.js
 * @description Central Express Application Server.
 * Configures middleware, security headers, sessions, static asset pipelines,
 * and mounts modular API routes for Interoperability, Virtual Identity, and Scoring.
 * 
 * References:
 * - CIS046-3 Software For Enterprise
 * - Marc Conrad's Banana API: https://marcconrad.com/uob/banana/doc.php
 */

const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const config = require('./config');
const { attachUser } = require('./middleware/authMiddleware');

// Route Handlers
const bananaRoutes = require('./routes/bananaRoutes');
const authRoutes = require('./routes/authRoutes');
const scoreRoutes = require('./routes/scoreRoutes');

const app = express();

// 1. Cross-Origin Resource Sharing (CORS) Configuration
app.use(cors({
  origin: true,
  credentials: true
}));

// 2. Request Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Session & Virtual Identity Cookie Configuration
// Utilizes cryptographically signed HTTP-only cookies to resist XSS session theft
app.use(session({
  name: 'banana_session_id',
  secret: config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // Prevents client-side script access
    secure: false, // Set to true in production over HTTPS
    maxAge: 1000 * 60 * 60 * 24, // 24-hour persistent session
    sameSite: 'lax'
  }
}));

// 4. Attach Virtual Identity context
app.use(attachUser);

// 5. Static Frontend Asset Serving
app.use(express.static(path.join(__dirname, '..', 'public')));

// 6. API Route Mounting
app.use('/api/banana', bananaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/scores', scoreRoutes);

// 7. System Diagnostics / Root Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'Banana Quest Enterprise Architecture',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    virtualIdentity: req.currentUser ? req.currentUser.username : 'GUEST'
  });
});

// 8. 404 Route Handler
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint '${req.originalUrl}' not found.`
    });
  }
  // Fallback to SPA index.html for non-API client routes
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// 9. Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error occurred.',
    timestamp: new Date().toISOString()
  });
});

// 10. Start Server (if launched directly)
if (require.main === module) {
  app.listen(config.PORT, () => {
    console.log(`====================================================`);
    console.log(`🍌 BANANA ENTERPRISE SERVER STARTED`);
    console.log(`🚀 Listening on: http://localhost:${config.PORT}`);
    console.log(`🔒 Virtual Identity Engine: ACTIVE (bcrypt + sessions)`);
    console.log(`🌐 Banana API Interoperability Gateway: READY`);
    console.log(`====================================================`);
  });
}

module.exports = app;
