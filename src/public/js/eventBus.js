/**
 * @file eventBus.js
 * @description Centralized Publish-Subscribe (Pub/Sub) Event Bus.
 * Implements Event-Driven Architecture (EDA) to decouple system components,
 * enabling asynchronous event dispatching, subscription management, and live event telemetry.
 * 
 * References:
 * - Gang of Four (GoF) Observer Pattern
 * - Event-Driven Architecture (EDA) Principles (Martin Fowler)
 */

class EventBus {
  constructor() {
    // Map of eventName -> Set of callback functions
    this.events = new Map();
    // Audit buffer of recent events for live UI inspection and debugging
    this.eventLog = [];
    this.maxLogEntries = 50;
  }

  /**
   * Subscribe to an event topic
   * @param {string} eventName 
   * @param {Function} handler 
   * @returns {Function} Unsubscribe function
   */
  on(eventName, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError(`Event handler for '${eventName}' must be a function.`);
    }

    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }

    this.events.get(eventName).add(handler);

    // Return unbind lambda for clean component lifecycle cleanup
    return () => this.off(eventName, handler);
  }

  /**
   * Subscribe to an event topic exactly once
   * @param {string} eventName 
   * @param {Function} handler 
   */
  once(eventName, handler) {
    const onceWrapper = (data) => {
      this.off(eventName, onceWrapper);
      handler(data);
    };
    return this.on(eventName, onceWrapper);
  }

  /**
   * Unsubscribe a handler from an event topic
   * @param {string} eventName 
   * @param {Function} handler 
   */
  off(eventName, handler) {
    if (this.events.has(eventName)) {
      const handlers = this.events.get(eventName);
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.events.delete(eventName);
      }
    }
  }

  /**
   * Publish an event with associated payload data to all registered subscribers
   * @param {string} eventName 
   * @param {*} data 
   */
  emit(eventName, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const isoTime = new Date().toISOString();

    // 1. Telemetry logging for visual UI inspector
    const logItem = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      name: eventName,
      data,
      timestamp,
      isoTime,
      subscriberCount: this.events.has(eventName) ? this.events.get(eventName).size : 0
    };

    this.eventLog.unshift(logItem);
    if (this.eventLog.length > this.maxLogEntries) {
      this.eventLog.pop();
    }

    // Also dispatch an internal event notifying that the event log was updated
    if (eventName !== 'EVENT_LOG_UPDATED') {
      setTimeout(() => this.emit('EVENT_LOG_UPDATED', logItem), 0);
    }

    // 2. Dispatch to registered listeners
    if (this.events.has(eventName)) {
      const handlers = this.events.get(eventName);
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (err) {
          console.error(`[EventBus] Uncaught exception in listener for event '${eventName}':`, err);
        }
      });
    }
  }

  /**
   * Retrieve current event log buffer
   * @returns {Array}
   */
  getRecentLogs() {
    return [...this.eventLog];
  }

  /**
   * Clear event log history
   */
  clearLogs() {
    this.eventLog = [];
    this.emit('EVENT_LOG_UPDATED', null);
  }
}

// Global Singleton Instance
const eventBus = new EventBus();

// Core Application Event Name Constants
const EVENTS = {
  // App Lifecycle
  APP_INIT: 'APP_INIT',
  
  // Virtual Identity & Auth Events
  AUTH_STATE_CHANGED: 'AUTH_STATE_CHANGED',
  AUTH_LOGIN_SUCCESS: 'AUTH_LOGIN_SUCCESS',
  AUTH_LOGOUT: 'AUTH_LOGOUT',
  
  // Banana API & Network Events
  PUZZLE_REQUESTED: 'PUZZLE_REQUESTED',
  PUZZLE_LOADED: 'PUZZLE_LOADED',
  PUZZLE_LOAD_ERROR: 'PUZZLE_LOAD_ERROR',
  NETWORK_STATUS_UPDATED: 'NETWORK_STATUS_UPDATED',
  
  // Game Lifecycle & Inputs
  GAME_START: 'GAME_START',
  GAME_TICK: 'GAME_TICK',
  GAME_PAUSE: 'GAME_PAUSE',
  GAME_RESUME: 'GAME_RESUME',
  GAME_OVER: 'GAME_OVER',
  
  // User Input & Evaluation Events
  INPUT_DIGIT_ENTERED: 'INPUT_DIGIT_ENTERED',
  INPUT_CLEARED: 'INPUT_CLEARED',
  ANSWER_SUBMITTED: 'ANSWER_SUBMITTED',
  ANSWER_EVALUATED: 'ANSWER_EVALUATED',
  
  // Scoring & Progression Events
  SCORE_UPDATED: 'SCORE_UPDATED',
  STREAK_CHANGED: 'STREAK_CHANGED',
  LEADERBOARD_REFRESHED: 'LEADERBOARD_REFRESHED',
  
  // UI & Audio Feedback Events
  AUDIO_PLAY_EFFECT: 'AUDIO_PLAY_EFFECT',
  TOAST_SHOW: 'TOAST_SHOW',
  MODAL_OPEN: 'MODAL_OPEN',
  MODAL_CLOSE: 'MODAL_CLOSE'
};

// Export to window for browser usage
if (typeof window !== 'undefined') {
  window.eventBus = eventBus;
  window.EVENTS = EVENTS;
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EventBus, eventBus, EVENTS };
}
