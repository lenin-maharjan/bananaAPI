/**
 * @file bananaController.js
 * @description Controller handling Banana Puzzle requests, verification, and API telemetry.
 * Serves as an architectural intermediary (Anti-Cheat & Interoperability Gateway).
 */

const bananaService = require('../services/bananaService');
const config = require('../config');

/**
 * Retrieves a new Banana puzzle and establishes an active puzzle session on the server.
 * Ensures the actual solution is NOT leaked to the client browser.
 */
exports.getNewPuzzle = async (req, res, next) => {
  try {
    const puzzle = await bananaService.fetchPuzzle();

    // Generate unique puzzle session ID
    const puzzleSessionId = `pz_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Store solution securely on server session
    if (!req.session) {
      req.session = {};
    }

    req.session.activePuzzle = {
      id: puzzleSessionId,
      solution: puzzle.solution,
      issuedAt: Date.now()
    };

    // Return sanitized payload to client (solution excluded for security integrity)
    return res.status(200).json({
      success: true,
      data: {
        sessionId: puzzleSessionId,
        questionImage: puzzle.question,
        source: puzzle.source,
        latencyMs: puzzle.latencyMs
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validates the user's submitted answer server-side against the stored session puzzle.
 */
exports.verifyAnswer = (req, res, next) => {
  try {
    const { answer, timeTakenSeconds } = req.body;
    const activePuzzle = req.session && req.session.activePuzzle;

    if (!activePuzzle) {
      return res.status(400).json({
        success: false,
        message: 'No active puzzle found for this session. Please request a new puzzle first.'
      });
    }

    const numericAnswer = parseInt(answer, 10);
    const expected = activePuzzle.solution;
    const isCorrect = numericAnswer === expected;

    let pointsEarned = 0;
    if (isCorrect) {
      // Calculate score: Base points + speed bonus (faster answer = higher bonus)
      const basePoints = config.GAME.BASE_POINTS_PER_SOLVE;
      const timeBonus = Math.max(0, Math.floor(config.GAME.SPEED_BONUS_MAX - (timeTakenSeconds || 0) * 3));
      pointsEarned = basePoints + timeBonus;
    }

    // Invalidate the answered puzzle session to prevent replay attacks
    delete req.session.activePuzzle;

    return res.status(200).json({
      success: true,
      data: {
        correct: isCorrect,
        submittedAnswer: numericAnswer,
        correctSolution: expected,
        pointsEarned,
        timeTakenSeconds: timeTakenSeconds || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Provides live telemetry and health status of the Banana API interoperability gateway.
 */
exports.getApiStatus = (req, res) => {
  const report = bananaService.getHealthReport();
  return res.status(200).json({
    success: true,
    data: report
  });
};
