/**
 * @file gameEngine.js
 * @description Event-Driven Game Engine and Finite State Machine (FSM).
 * Manages game loop, countdown timer, combo streaks, score multipliers,
 * and state transitions strictly through EventBus publications and subscriptions.
 */

class GameEngine {
  constructor(bus, api) {
    this.bus = bus;
    this.api = api;

    // FSM States: 'IDLE' | 'FETCHING' | 'WAITING_INPUT' | 'EVALUATING' | 'GAME_OVER'
    this.state = 'IDLE';

    // Game Session Variables
    this.roundDuration = 45; // 45 seconds per game round
    this.timeLeft = this.roundDuration;
    this.timerInterval = null;

    this.score = 0;
    this.streak = 0;
    this.highestStreak = 0;
    this.solvedCount = 0;
    this.attemptCount = 0;

    this.currentPuzzle = null;
    this.puzzleStartTime = null;
    this.currentInput = '';

    this.initEventListeners();
  }

  /**
   * Bind event listeners to decouple game engine logic from UI input sources
   */
  initEventListeners() {
    this.bus.on(window.EVENTS.GAME_START, () => this.startNewGame());
    this.bus.on(window.EVENTS.INPUT_DIGIT_ENTERED, (digit) => this.handleDigitInput(digit));
    this.bus.on(window.EVENTS.INPUT_CLEARED, () => this.handleClearInput());
    this.bus.on(window.EVENTS.ANSWER_SUBMITTED, () => this.submitAnswer());
  }

  /**
   * Starts a brand new game round
   */
  async startNewGame() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.state = 'FETCHING';
    this.score = 0;
    this.streak = 0;
    this.highestStreak = 0;
    this.solvedCount = 0;
    this.attemptCount = 0;
    this.timeLeft = this.roundDuration;
    this.currentInput = '';

    // Broadcast initial state
    this.bus.emit(window.EVENTS.SCORE_UPDATED, {
      score: this.score,
      streak: this.streak,
      solvedCount: this.solvedCount
    });

    this.bus.emit(window.EVENTS.AUDIO_PLAY_EFFECT, 'click');

    // Start round countdown loop
    this.startTimer();

    // Fetch initial puzzle from Banana API Gateway
    await this.loadNextPuzzle();
  }

  /**
   * Game loop interval firing tick events
   */
  startTimer() {
    this.bus.emit(window.EVENTS.GAME_TICK, { timeLeft: this.timeLeft });

    this.timerInterval = setInterval(() => {
      this.timeLeft--;

      this.bus.emit(window.EVENTS.GAME_TICK, { timeLeft: this.timeLeft });

      if (this.timeLeft <= 5 && this.timeLeft > 0) {
        this.bus.emit(window.EVENTS.AUDIO_PLAY_EFFECT, 'tick');
      }

      if (this.timeLeft <= 0) {
        this.endGame();
      }
    }, 1000);
  }

  /**
   * Request next puzzle through interoperability API client
   */
  async loadNextPuzzle() {
    this.state = 'FETCHING';
    this.currentInput = '';
    this.bus.emit(window.EVENTS.INPUT_CLEARED);

    try {
      const puzzle = await this.api.getPuzzle();
      this.currentPuzzle = puzzle;
      this.puzzleStartTime = Date.now();
      this.state = 'WAITING_INPUT';
    } catch (err) {
      this.bus.emit(window.EVENTS.TOAST_SHOW, {
        message: 'Network issue contacting Banana API. Using cached puzzle.',
        type: 'warning'
      });
      this.state = 'WAITING_INPUT';
    }
  }

  /**
   * Handle single digit entered by user (0-9)
   */
  handleDigitInput(digit) {
    if (this.state !== 'WAITING_INPUT') return;

    // Banana puzzle answers are typically single-digit integers (0-9)
    this.currentInput = String(digit);
    this.bus.emit(window.EVENTS.AUDIO_PLAY_EFFECT, 'click');

    // Auto-submit single digit for fluid, lightning-fast arcade action!
    this.submitAnswer();
  }

  handleClearInput() {
    if (this.state !== 'WAITING_INPUT') return;
    this.currentInput = '';
  }

  /**
   * Submits player's answer to the server for authoritative verification
   */
  async submitAnswer() {
    if (this.state !== 'WAITING_INPUT' || !this.currentInput) return;

    this.state = 'EVALUATING';
    const answer = parseInt(this.currentInput, 10);
    const timeTakenSeconds = this.puzzleStartTime ? ((Date.now() - this.puzzleStartTime) / 1000).toFixed(1) : 1.0;
    this.attemptCount++;

    try {
      const verificationResponse = await this.api.verifyAnswer(answer, parseFloat(timeTakenSeconds));
      const result = verificationResponse.data;

      if (result.correct) {
        // Correct answer branch
        this.streak++;
        this.highestStreak = Math.max(this.highestStreak, this.streak);
        this.solvedCount++;

        // Multiplier bonus for streaks (e.g., 2x, 3x)
        const streakMultiplier = 1 + (this.streak > 1 ? (this.streak - 1) * 0.2 : 0);
        const earnedWithMultiplier = Math.round(result.pointsEarned * streakMultiplier);
        this.score += earnedWithMultiplier;

        // Reward time (adds +2 bonus seconds for fast correct solves!)
        this.timeLeft = Math.min(this.roundDuration + 10, this.timeLeft + 2);

        this.bus.emit(window.EVENTS.AUDIO_PLAY_EFFECT, this.streak >= 3 ? 'streak' : 'correct');
        this.bus.emit(window.EVENTS.ANSWER_EVALUATED, {
          correct: true,
          submitted: answer,
          pointsEarned: earnedWithMultiplier,
          streak: this.streak,
          timeBonus: 2
        });
      } else {
        // Incorrect answer branch
        this.streak = 0;
        this.bus.emit(window.EVENTS.AUDIO_PLAY_EFFECT, 'incorrect');
        this.bus.emit(window.EVENTS.ANSWER_EVALUATED, {
          correct: false,
          submitted: answer,
          expected: result.correctSolution,
          pointsEarned: 0,
          streak: 0
        });
      }

      this.bus.emit(window.EVENTS.SCORE_UPDATED, {
        score: this.score,
        streak: this.streak,
        solvedCount: this.solvedCount
      });

      // Brief delay so player can register the visual feedback before loading next puzzle
      setTimeout(() => {
        if (this.state !== 'GAME_OVER') {
          this.loadNextPuzzle();
        }
      }, 550);

    } catch (err) {
      console.error('[GameEngine] Verification error:', err);
      this.state = 'WAITING_INPUT';
    }
  }

  /**
   * Concludes the game round and records final results
   */
  async endGame() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    this.state = 'GAME_OVER';
    this.bus.emit(window.EVENTS.AUDIO_PLAY_EFFECT, 'gameover');

    const accuracyRate = this.attemptCount > 0 
      ? Math.round((this.solvedCount / this.attemptCount) * 100) 
      : 0;

    const gameSummary = {
      score: this.score,
      solvedCount: this.solvedCount,
      attemptCount: this.attemptCount,
      highestStreak: this.highestStreak,
      accuracyRate,
      timeTakenSeconds: this.roundDuration - Math.max(0, this.timeLeft)
    };

    this.bus.emit(window.EVENTS.GAME_OVER, gameSummary);

    // Save score to backend and refresh global leaderboard
    try {
      await this.api.saveScore(gameSummary);
      this.bus.emit(window.EVENTS.LEADERBOARD_REFRESHED);
    } catch (err) {
      console.warn('[GameEngine] Could not save score:', err.message);
    }
  }
}

if (typeof window !== 'undefined') {
  window.GameEngine = GameEngine;
}
