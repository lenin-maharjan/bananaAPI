/**
 * @file uiController.js
 * @description Event-Driven UI View Controller.
 * Decoupled from core game rules; strictly binds DOM interactions to EventBus publications
 * and renders view state updates in response to EventBus notifications.
 */

class UIController {
  constructor(bus, api, auth, engine, sound) {
    this.bus = bus;
    this.api = api;
    this.auth = auth;
    this.engine = engine;
    this.sound = sound;

    this.dom = {};
    this.cacheDomElements();
    this.bindDomEvents();
    this.subscribeToEventBus();
    this.initKeyboardListener();
  }

  cacheDomElements() {
    this.dom = {
      // Header / Auth
      userBadge: document.getElementById('user-badge'),
      userNameDisplay: document.getElementById('user-name-display'),
      loginBtn: document.getElementById('btn-login-open'),
      logoutBtn: document.getElementById('btn-logout'),
      authModal: document.getElementById('auth-modal'),
      authModalClose: document.getElementById('auth-modal-close'),
      authTabLogin: document.getElementById('tab-login'),
      authTabRegister: document.getElementById('tab-register'),
      formLogin: document.getElementById('form-login'),
      formRegister: document.getElementById('form-register'),
      muteBtn: document.getElementById('btn-mute-toggle'),
      netStatusPill: document.getElementById('network-status-pill'),

      // Game Arena
      gameStartOverlay: document.getElementById('game-start-overlay'),
      btnStartGame: document.getElementById('btn-start-game'),
      btnRestartGame: document.getElementById('btn-restart-game'),
      puzzleImage: document.getElementById('puzzle-image'),
      puzzleLoader: document.getElementById('puzzle-loader'),
      feedbackOverlay: document.getElementById('feedback-overlay'),
      feedbackText: document.getElementById('feedback-text'),
      timerValue: document.getElementById('timer-value'),
      timerBar: document.getElementById('timer-bar-fill'),
      scoreValue: document.getElementById('score-value'),
      streakValue: document.getElementById('streak-value'),
      streakContainer: document.getElementById('streak-container'),
      latencyBadge: document.getElementById('api-latency-badge'),
      sourceBadge: document.getElementById('api-source-badge'),

      // Keypad
      keypadButtons: document.querySelectorAll('.keypad-btn'),

      // Game Over Modal
      gameOverModal: document.getElementById('game-over-modal'),
      finalScore: document.getElementById('final-score'),
      finalSolved: document.getElementById('final-solved'),
      finalAccuracy: document.getElementById('final-accuracy'),
      finalStreak: document.getElementById('final-streak'),
      btnPlayAgain: document.getElementById('btn-play-again'),

      // Leaderboard
      leaderboardBody: document.getElementById('leaderboard-body'),
      btnRefreshLeaderboard: document.getElementById('btn-refresh-leaderboard'),

      // Telemetry & Event Inspector Panels
      btnToggleEventInspector: document.getElementById('btn-toggle-events'),
      eventInspectorDrawer: document.getElementById('event-inspector-drawer'),
      eventLogContainer: document.getElementById('event-log-container'),
      btnClearEvents: document.getElementById('btn-clear-events'),

      // Interoperability Drawer
      btnToggleApiInspector: document.getElementById('btn-toggle-api-inspector'),
      apiInspectorDrawer: document.getElementById('api-inspector-drawer'),
      apiReportContainer: document.getElementById('api-report-container'),
      btnRefreshApiStatus: document.getElementById('btn-refresh-api-status'),

      // Toast Notifications
      toastContainer: document.getElementById('toast-container')
    };
  }

  bindDomEvents() {
    // Start / Restart game buttons
    if (this.dom.btnStartGame) {
      this.dom.btnStartGame.addEventListener('click', () => {
        this.dom.gameStartOverlay.classList.add('hidden');
        this.bus.emit(window.EVENTS.GAME_START);
      });
    }

    if (this.dom.btnRestartGame) {
      this.dom.btnRestartGame.addEventListener('click', () => {
        this.bus.emit(window.EVENTS.GAME_START);
      });
    }

    if (this.dom.btnPlayAgain) {
      this.dom.btnPlayAgain.addEventListener('click', () => {
        this.dom.gameOverModal.classList.add('hidden');
        this.bus.emit(window.EVENTS.GAME_START);
      });
    }

    // Keypad number clicks
    if (this.dom.keypadButtons) {
      this.dom.keypadButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const digit = btn.getAttribute('data-val');
          if (digit === 'clear') {
            this.bus.emit(window.EVENTS.INPUT_CLEARED);
          } else {
            this.bus.emit(window.EVENTS.INPUT_DIGIT_ENTERED, digit);
          }
        });
      });
    }

    // Audio Mute toggle
    if (this.dom.muteBtn) {
      this.dom.muteBtn.addEventListener('click', () => {
        const isMuted = this.sound.toggleMute();
        this.dom.muteBtn.innerHTML = isMuted ? '🔇 Muted' : '🔊 Sound';
        this.dom.muteBtn.classList.toggle('muted', isMuted);
      });
    }

    // Auth modal controls
    if (this.dom.loginBtn) {
      this.dom.loginBtn.addEventListener('click', () => {
        this.dom.authModal.classList.remove('hidden');
      });
    }

    if (this.dom.logoutBtn) {
      this.dom.logoutBtn.addEventListener('click', () => {
        this.auth.logout();
      });
    }

    if (this.dom.authModalClose) {
      this.dom.authModalClose.addEventListener('click', () => {
        this.dom.authModal.classList.add('hidden');
      });
    }

    // Tab switching in Auth Modal
    if (this.dom.authTabLogin && this.dom.authTabRegister) {
      this.dom.authTabLogin.addEventListener('click', () => {
        this.dom.authTabLogin.classList.add('active');
        this.dom.authTabRegister.classList.remove('active');
        this.dom.formLogin.classList.remove('hidden');
        this.dom.formRegister.classList.add('hidden');
      });

      this.dom.authTabRegister.addEventListener('click', () => {
        this.dom.authTabRegister.classList.add('active');
        this.dom.authTabLogin.classList.remove('active');
        this.dom.formRegister.classList.remove('hidden');
        this.dom.formLogin.classList.add('hidden');
      });
    }

    // Form Submissions
    if (this.dom.formLogin) {
      this.dom.formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        try {
          await this.auth.login(username, password);
        } catch (err) {}
      });
    }

    if (this.dom.formRegister) {
      this.dom.formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const displayName = document.getElementById('reg-displayname').value;
        const password = document.getElementById('reg-password').value;
        try {
          await this.auth.register(username, password, displayName);
        } catch (err) {}
      });
    }

    // Leaderboard refresh
    if (this.dom.btnRefreshLeaderboard) {
      this.dom.btnRefreshLeaderboard.addEventListener('click', () => {
        this.loadLeaderboard();
      });
    }

    // Event Inspector Drawer Toggle
    if (this.dom.btnToggleEventInspector) {
      this.dom.btnToggleEventInspector.addEventListener('click', () => {
        this.dom.eventInspectorDrawer.classList.toggle('open');
      });
    }

    if (this.dom.btnClearEvents) {
      this.dom.btnClearEvents.addEventListener('click', () => {
        this.bus.clearLogs();
      });
    }

    // API Inspector Drawer Toggle
    if (this.dom.btnToggleApiInspector) {
      this.dom.btnToggleApiInspector.addEventListener('click', () => {
        this.dom.apiInspectorDrawer.classList.toggle('open');
        this.loadApiHealthReport();
      });
    }

    if (this.dom.btnRefreshApiStatus) {
      this.dom.btnRefreshApiStatus.addEventListener('click', () => {
        this.loadApiHealthReport();
      });
    }
  }

  /**
   * Keyboard shortcuts mapping physical keystrokes to EventBus events
   */
  initKeyboardListener() {
    window.addEventListener('keydown', (e) => {
      // Ignore if typing in text input fields
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        this.bus.emit(window.EVENTS.INPUT_DIGIT_ENTERED, e.key);
      } else if (e.key === 'Backspace' || e.key === 'Escape') {
        e.preventDefault();
        this.bus.emit(window.EVENTS.INPUT_CLEARED);
      } else if (e.key === ' ' && this.engine.state === 'IDLE') {
        e.preventDefault();
        this.dom.gameStartOverlay.classList.add('hidden');
        this.bus.emit(window.EVENTS.GAME_START);
      }
    });
  }

  /**
   * Subscribes to events emitted across the entire application
   */
  subscribeToEventBus() {
    // 1. Virtual Identity / Auth state updates
    this.bus.on(window.EVENTS.AUTH_STATE_CHANGED, ({ authenticated, user }) => {
      if (authenticated && user) {
        this.dom.userNameDisplay.textContent = user.displayName || user.username;
        this.dom.userBadge.style.background = user.avatarColor || '#FACC15';
        this.dom.loginBtn.classList.add('hidden');
        this.dom.logoutBtn.classList.remove('hidden');
      } else {
        this.dom.userNameDisplay.textContent = 'Guest Player';
        this.dom.userBadge.style.background = '#94A3B8';
        this.dom.loginBtn.classList.remove('hidden');
        this.dom.logoutBtn.classList.add('hidden');
      }
      this.loadLeaderboard();
    });

    // 2. Puzzle loading events
    this.bus.on(window.EVENTS.PUZZLE_REQUESTED, () => {
      this.dom.puzzleLoader.classList.remove('hidden');
      this.dom.puzzleImage.classList.add('opacity-40');
    });

    this.bus.on(window.EVENTS.PUZZLE_LOADED, (puzzle) => {
      this.dom.puzzleLoader.classList.add('hidden');
      this.dom.puzzleImage.src = puzzle.questionImage;
      this.dom.puzzleImage.classList.remove('opacity-40');

      if (this.dom.latencyBadge) {
        this.dom.latencyBadge.textContent = `${puzzle.latencyMs}ms`;
      }
      if (this.dom.sourceBadge) {
        this.dom.sourceBadge.textContent = puzzle.source.replace('_', ' ');
      }
    });

    // 3. Timer & game tick
    this.bus.on(window.EVENTS.GAME_TICK, ({ timeLeft }) => {
      this.dom.timerValue.textContent = `${timeLeft}s`;
      const percentage = (timeLeft / this.engine.roundDuration) * 100;
      this.dom.timerBar.style.width = `${Math.max(0, percentage)}%`;

      if (timeLeft <= 5) {
        this.dom.timerBar.classList.add('critical');
      } else {
        this.dom.timerBar.classList.remove('critical');
      }
    });

    // 4. Score & Streak updates
    this.bus.on(window.EVENTS.SCORE_UPDATED, ({ score, streak }) => {
      this.dom.scoreValue.textContent = score.toLocaleString();
      this.dom.streakValue.textContent = `${streak}x`;

      if (streak >= 3) {
        this.dom.streakContainer.classList.add('on-fire');
      } else {
        this.dom.streakContainer.classList.remove('on-fire');
      }
    });

    // 5. Answer evaluated feedback
    this.bus.on(window.EVENTS.ANSWER_EVALUATED, (result) => {
      this.showAnswerFeedback(result);
    });

    // 6. Game over
    this.bus.on(window.EVENTS.GAME_OVER, (summary) => {
      this.dom.finalScore.textContent = summary.score.toLocaleString();
      this.dom.finalSolved.textContent = summary.solvedCount;
      this.dom.finalAccuracy.textContent = `${summary.accuracyRate}%`;
      this.dom.finalStreak.textContent = `${summary.highestStreak}x`;
      this.dom.gameOverModal.classList.remove('hidden');
    });

    // 7. Network status pill
    this.bus.on(window.EVENTS.NETWORK_STATUS_UPDATED, (status) => {
      this.dom.netStatusPill.textContent = status.status;
      this.dom.netStatusPill.className = `status-pill ${status.status.toLowerCase()}`;
    });

    // 8. Event Log inspector telemetry
    this.bus.on('EVENT_LOG_UPDATED', () => {
      this.renderEventLog();
    });

    // 9. Toast alerts
    this.bus.on(window.EVENTS.TOAST_SHOW, (toast) => {
      this.showToast(toast.message, toast.type);
    });

    // 10. Close modal
    this.bus.on(window.EVENTS.MODAL_CLOSE, () => {
      this.dom.authModal.classList.add('hidden');
    });

    // 11. Refresh leaderboard
    this.bus.on(window.EVENTS.LEADERBOARD_REFRESHED, () => {
      this.loadLeaderboard();
    });
  }

  showAnswerFeedback(result) {
    const overlay = this.dom.feedbackOverlay;
    const text = this.dom.feedbackText;

    if (result.correct) {
      overlay.className = 'feedback-overlay correct show';
      text.innerHTML = `✓ +${result.pointsEarned} PTS`;
    } else {
      overlay.className = 'feedback-overlay incorrect show';
      text.innerHTML = `✗ Solution was: ${result.expected}`;
    }

    setTimeout(() => {
      overlay.className = 'feedback-overlay';
    }, 500);
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ'}</span>
      <span class="toast-msg">${message}</span>
    `;

    this.dom.toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  renderEventLog() {
    const logs = this.bus.getRecentLogs();
    if (!this.dom.eventLogContainer) return;

    this.dom.eventLogContainer.innerHTML = logs.map(item => `
      <div class="event-log-card">
        <div class="event-log-header">
          <span class="event-name">${item.name}</span>
          <span class="event-time">${item.timestamp}</span>
        </div>
        <div class="event-meta">
          <span>Listeners: ${item.subscriberCount}</span>
        </div>
        ${item.data ? `<pre class="event-payload">${JSON.stringify(item.data, null, 1)}</pre>` : ''}
      </div>
    `).join('');
  }

  async loadLeaderboard() {
    try {
      const res = await this.api.getLeaderboard();
      const list = res.data.leaderboard || [];

      if (list.length === 0) {
        this.dom.leaderboardBody.innerHTML = `
          <tr><td colspan="5" style="text-align:center; padding: 20px; color: #94a3b8;">No scores recorded yet. Be the first!</td></tr>
        `;
        return;
      }

      this.dom.leaderboardBody.innerHTML = list.map(entry => `
        <tr class="${entry.rank <= 3 ? 'rank-top' : ''}">
          <td><span class="rank-badge rank-${entry.rank}">#${entry.rank}</span></td>
          <td>
            <div class="player-cell">
              <span class="avatar-dot" style="background:${entry.avatarColor || '#FACC15'}"></span>
              <span class="player-name">${entry.displayName || entry.username}</span>
              ${entry.isGuest ? '<span class="guest-tag">Guest</span>' : ''}
            </div>
          </td>
          <td class="score-cell">${entry.score.toLocaleString()}</td>
          <td>${entry.solvedCount}</td>
          <td>${entry.highestStreak}x</td>
        </tr>
      `).join('');
    } catch (err) {
      console.warn('[UI] Failed to load leaderboard:', err);
    }
  }

  async loadApiHealthReport() {
    try {
      const res = await this.api.getApiHealth();
      const data = res.data;
      if (!this.dom.apiReportContainer) return;

      this.dom.apiReportContainer.innerHTML = `
        <div class="api-metric-grid">
          <div class="metric-card">
            <span class="metric-label">Status</span>
            <span class="metric-val status-${data.status.toLowerCase()}">${data.status}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Avg Latency</span>
            <span class="metric-val">${data.telemetry.averageLatencyMs}ms</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Requests</span>
            <span class="metric-val">${data.telemetry.totalRequests}</span>
          </div>
          <div class="metric-card">
            <span class="metric-label">Success Rate</span>
            <span class="metric-val">${data.telemetry.totalRequests > 0 ? Math.round((data.telemetry.successfulRequests / data.telemetry.totalRequests) * 100) : 100}%</span>
          </div>
        </div>
        <div class="api-details-block">
          <p><strong>Endpoint:</strong> <code>${data.targetEndpoint}</code></p>
          <p><strong>Protocol:</strong> ${data.protocol}</p>
          <p><strong>Resilience:</strong> ${data.resilienceStrategy}</p>
          <p><strong>Last Latency:</strong> ${data.telemetry.lastLatencyMs}ms</p>
          <p><strong>Last Contacted:</strong> ${data.telemetry.lastContacted ? new Date(data.telemetry.lastContacted).toLocaleTimeString() : 'N/A'}</p>
        </div>
      `;
    } catch (err) {
      if (this.dom.apiReportContainer) {
        this.dom.apiReportContainer.innerHTML = `<p class="error-text">Failed to fetch API status.</p>`;
      }
    }
  }
}

if (typeof window !== 'undefined') {
  window.UIController = UIController;
}
