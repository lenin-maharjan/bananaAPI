/**
 * @file apiClient.js
 * @description Frontend HTTP Service Client for Banana API Gateway and Authentication.
 * Interoperates with backend REST endpoints and dispatches telemetry events to the EventBus.
 */

class ApiClient {
  constructor(bus) {
    this.bus = bus;
    this.baseUrl = '';
  }

  /**
   * Internal wrapper for fetch with credentials, JSON handling, and event dispatching
   */
  async _request(endpoint, options = {}) {
    const fullUrl = `${this.baseUrl}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      },
      credentials: 'same-origin' // Ensures session cookie is automatically included
    };

    try {
      const response = await fetch(fullUrl, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      this.bus.emit(window.EVENTS.NETWORK_STATUS_UPDATED, {
        status: 'ONLINE',
        lastEndpoint: endpoint,
        timestamp: new Date().toLocaleTimeString()
      });

      return data;
    } catch (error) {
      this.bus.emit(window.EVENTS.NETWORK_STATUS_UPDATED, {
        status: 'DEGRADED',
        error: error.message,
        lastEndpoint: endpoint,
        timestamp: new Date().toLocaleTimeString()
      });
      throw error;
    }
  }

  // --- Virtual Identity & Auth Methods ---
  async getMe() {
    return this._request('/api/auth/me', { method: 'GET' });
  }

  async login(username, password) {
    return this._request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  }

  async register(username, password, displayName) {
    return this._request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, displayName })
    });
  }

  async logout() {
    return this._request('/api/auth/logout', { method: 'POST' });
  }

  // --- Banana Interoperability Methods ---
  async getPuzzle() {
    this.bus.emit(window.EVENTS.PUZZLE_REQUESTED);
    try {
      const res = await this._request('/api/banana/puzzle', { method: 'GET' });
      this.bus.emit(window.EVENTS.PUZZLE_LOADED, res.data);
      return res.data;
    } catch (err) {
      this.bus.emit(window.EVENTS.PUZZLE_LOAD_ERROR, { message: err.message });
      throw err;
    }
  }

  async verifyAnswer(answer, timeTakenSeconds) {
    return this._request('/api/banana/verify', {
      method: 'POST',
      body: JSON.stringify({ answer, timeTakenSeconds })
    });
  }

  async getApiHealth() {
    return this._request('/api/banana/status', { method: 'GET' });
  }

  // --- Leaderboard & Scoring Methods ---
  async saveScore(scoreData) {
    return this._request('/api/scores', {
      method: 'POST',
      body: JSON.stringify(scoreData)
    });
  }

  async getLeaderboard() {
    return this._request('/api/scores/leaderboard', { method: 'GET' });
  }

  async getUserHistory() {
    return this._request('/api/scores/history', { method: 'GET' });
  }
}

if (typeof window !== 'undefined') {
  window.ApiClient = ApiClient;
}
