/**
 * @file authService.js
 * @description Virtual Identity Authentication & Cryptographic Security Service.
 * Implements salted password hashing with bcrypt, input sanitization, 
 * timing-attack resistant comparison, and audit logging.
 * 
 * References:
 * - OWASP Password Storage Cheat Sheet
 * - NIST Special Publication 800-63B: Digital Identity Guidelines
 */

const bcrypt = require('bcryptjs');
const userModel = require('../models/userModel');
const db = require('../models/db');

const SALT_ROUNDS = 10;

class AuthService {
  /**
   * Registers a new user identity with cryptographic salted password hashing
   * @param {Object} credentials - { username, password, displayName }
   * @param {string} ipAddress 
   * @returns {Promise<Object>} Sanitized user object
   */
  async register({ username, password, displayName }, ipAddress = '127.0.0.1') {
    // 1. Input Validation
    if (!username || typeof username !== 'string') {
      throw new Error('Username is required.');
    }

    const cleanUsername = username.trim();
    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      throw new Error('Username must be between 3 and 20 characters.');
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
      throw new Error('Username can only contain alphanumeric characters, underscores, and dashes.');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new Error('Password must be at least 6 characters long for security compliance.');
    }

    // 2. Uniqueness check
    const existing = userModel.findByUsername(cleanUsername);
    if (existing) {
      throw new Error('Username is already registered. Please choose another username.');
    }

    // 3. Cryptographic Salting & Hashing
    // bcrypt automatically generates a cryptographically secure random salt embedded in the hash string
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Create User Record
    const newUser = userModel.create({
      username: cleanUsername,
      passwordHash,
      displayName: displayName && displayName.trim() ? displayName.trim() : cleanUsername
    });

    // 5. Audit Log
    this._logAudit('USER_REGISTERED', newUser.id, cleanUsername, ipAddress, true);

    return userModel.sanitize(newUser);
  }

  /**
   * Authenticates user credentials using constant-time comparison
   * @param {Object} credentials - { username, password }
   * @param {string} ipAddress 
   * @returns {Promise<Object>} Sanitized user object
   */
  async login({ username, password }, ipAddress = '127.0.0.1') {
    if (!username || !password) {
      throw new Error('Both username and password are required.');
    }

    const cleanUsername = username.trim();
    const user = userModel.findByUsername(cleanUsername);

    if (!user) {
      this._logAudit('LOGIN_FAILED_USER_NOT_FOUND', null, cleanUsername, ipAddress, false);
      // Generic message prevents username harvesting enumeration
      throw new Error('Invalid username or password.');
    }

    // Constant-time comparison resists side-channel timing attacks
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      this._logAudit('LOGIN_FAILED_BAD_PASSWORD', user.id, cleanUsername, ipAddress, false);
      throw new Error('Invalid username or password.');
    }

    this._logAudit('LOGIN_SUCCESS', user.id, cleanUsername, ipAddress, true);

    return userModel.sanitize(user);
  }

  /**
   * Internal audit log helper for forensic tracking of security events
   */
  _logAudit(eventType, userId, username, ipAddress, success) {
    try {
      db.insert('audit_logs', {
        eventType,
        userId,
        username,
        ipAddress,
        success,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('[AuthService] Audit logging failed:', err.message);
    }
  }
}

module.exports = new AuthService();
