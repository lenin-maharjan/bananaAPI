/**
 * @file db.js
 * @description Lightweight, robust, file-backed persistent database engine for Virtual Identity & Scores.
 * Implements atomic writes, schema initialization, and transactional-style querying.
 * 
 * References:
 * - Enterprise Data Persistence patterns (Martin Fowler, Patterns of Enterprise Application Architecture)
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

class JsonDatabase {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = {
      users: [],
      scores: [],
      audit_logs: []
    };
    this.init();
  }

  /**
   * Initializes database file and creates default directory and schema if not present.
   */
  init() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(this.filePath)) {
      try {
        const fileContent = fs.readFileSync(this.filePath, 'utf-8');
        this.data = JSON.parse(fileContent);
        // Ensure all collections exist
        if (!Array.isArray(this.data.users)) this.data.users = [];
        if (!Array.isArray(this.data.scores)) this.data.scores = [];
        if (!Array.isArray(this.data.audit_logs)) this.data.audit_logs = [];
      } catch (err) {
        console.error('[DB] Error parsing existing database file. Re-initializing schema:', err.message);
        this.save();
      }
    } else {
      this.save();
    }
  }

  /**
   * Persists database state to disk using atomic write (temporary file + rename)
   * to prevent corrupted state during server restarts or power interruptions.
   */
  save() {
    const tempPath = `${this.filePath}.tmp`;
    const jsonString = JSON.stringify(this.data, null, 2);
    fs.writeFileSync(tempPath, jsonString, 'utf-8');
    fs.renameSync(tempPath, this.filePath);
  }

  /**
   * Get all records from a collection
   * @param {string} collection 
   * @returns {Array}
   */
  findAll(collection) {
    return this.data[collection] || [];
  }

  /**
   * Find a single record matching predicate
   * @param {string} collection 
   * @param {Function} predicate 
   * @returns {Object|null}
   */
  findOne(collection, predicate) {
    const list = this.findAll(collection);
    return list.find(predicate) || null;
  }

  /**
   * Filter records matching predicate
   * @param {string} collection 
   * @param {Function} predicate 
   * @returns {Array}
   */
  filter(collection, predicate) {
    const list = this.findAll(collection);
    return list.filter(predicate);
  }

  /**
   * Insert a new record into collection
   * @param {string} collection 
   * @param {Object} item 
   * @returns {Object}
   */
  insert(collection, item) {
    if (!this.data[collection]) {
      this.data[collection] = [];
    }
    const record = {
      id: `${collection.slice(0, 3)}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      ...item
    };
    this.data[collection].push(record);
    this.save();
    return record;
  }

  /**
   * Update an existing record by ID
   * @param {string} collection 
   * @param {string} id 
   * @param {Object} updates 
   * @returns {Object|null}
   */
  update(collection, id, updates) {
    const index = this.data[collection].findIndex(item => item.id === id);
    if (index === -1) return null;

    this.data[collection][index] = {
      ...this.data[collection][index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data[collection][index];
  }

  /**
   * Delete record by ID
   * @param {string} collection 
   * @param {string} id 
   * @returns {boolean}
   */
  delete(collection, id) {
    const initialLen = this.data[collection].length;
    this.data[collection] = this.data[collection].filter(item => item.id !== id);
    if (this.data[collection].length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }
}

// Singleton database instance
const dbInstance = new JsonDatabase(config.DATABASE.FILE_PATH);

module.exports = dbInstance;
