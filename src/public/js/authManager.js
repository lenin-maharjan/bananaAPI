/**
 * @file authManager.js
 * @description Client-side Virtual Identity and Session Manager.
 * Handles state synchronization between server cookies and UI components.
 */

class AuthManager {
  constructor(bus, api) {
    this.bus = bus;
    this.api = api;
    this.currentUser = null;
    this.isAuthenticated = false;

    this.init();
  }

  async init() {
    try {
      const response = await this.api.getMe();
      if (response && response.data && response.data.authenticated) {
        this.currentUser = response.data.user;
        this.isAuthenticated = true;
      } else {
        this.currentUser = null;
        this.isAuthenticated = false;
      }
    } catch (err) {
      this.currentUser = null;
      this.isAuthenticated = false;
    }

    this.bus.emit(window.EVENTS.AUTH_STATE_CHANGED, {
      authenticated: this.isAuthenticated,
      user: this.currentUser
    });
  }

  async login(username, password) {
    try {
      const response = await this.api.login(username, password);
      this.currentUser = response.data.user;
      this.isAuthenticated = true;

      this.bus.emit(window.EVENTS.AUTH_STATE_CHANGED, {
        authenticated: true,
        user: this.currentUser
      });

      this.bus.emit(window.EVENTS.TOAST_SHOW, {
        message: `Welcome back, ${this.currentUser.displayName || this.currentUser.username}!`,
        type: 'success'
      });

      this.bus.emit(window.EVENTS.MODAL_CLOSE);
      return response;
    } catch (err) {
      this.bus.emit(window.EVENTS.TOAST_SHOW, {
        message: err.message,
        type: 'error'
      });
      throw err;
    }
  }

  async register(username, password, displayName) {
    try {
      const response = await this.api.register(username, password, displayName);
      this.currentUser = response.data.user;
      this.isAuthenticated = true;

      this.bus.emit(window.EVENTS.AUTH_STATE_CHANGED, {
        authenticated: true,
        user: this.currentUser
      });

      this.bus.emit(window.EVENTS.TOAST_SHOW, {
        message: `Account created! Virtual identity initialized.`,
        type: 'success'
      });

      this.bus.emit(window.EVENTS.MODAL_CLOSE);
      return response;
    } catch (err) {
      this.bus.emit(window.EVENTS.TOAST_SHOW, {
        message: err.message,
        type: 'error'
      });
      throw err;
    }
  }

  async logout() {
    try {
      await this.api.logout();
      this.currentUser = null;
      this.isAuthenticated = false;

      this.bus.emit(window.EVENTS.AUTH_STATE_CHANGED, {
        authenticated: false,
        user: null
      });

      this.bus.emit(window.EVENTS.TOAST_SHOW, {
        message: 'Successfully logged out.',
        type: 'info'
      });
    } catch (err) {
      console.error('[AuthManager] Logout error:', err);
    }
  }
}

if (typeof window !== 'undefined') {
  window.AuthManager = AuthManager;
}
