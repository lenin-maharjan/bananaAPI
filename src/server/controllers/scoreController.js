/**
 * @file scoreController.js
 * @description Manages game score recording, user performance progression, and leaderboard metrics.
 */

const db = require('../models/db');
const userModel = require('../models/userModel');

/**
 * Records a game score and ties it to the virtual identity
 */
exports.saveScore = (req, res, next) => {
  try {
    const { score, solvedCount, timeTakenSeconds, highestStreak, accuracyRate } = req.body;

    const isAuth = !!req.currentUser;
    const userId = isAuth ? req.currentUser.id : 'guest';
    const username = isAuth ? req.currentUser.username : 'Guest Player';
    const displayName = isAuth ? req.currentUser.displayName : 'Guest';
    const avatarColor = isAuth ? req.currentUser.avatarColor : '#94A3B8';

    const scoreRecord = {
      userId,
      username,
      displayName,
      avatarColor,
      isGuest: !isAuth,
      score: Math.max(0, parseInt(score, 10) || 0),
      solvedCount: Math.max(0, parseInt(solvedCount, 10) || 0),
      timeTakenSeconds: Math.max(0, parseInt(timeTakenSeconds, 10) || 0),
      highestStreak: Math.max(0, parseInt(highestStreak, 10) || 0),
      accuracyRate: Math.min(100, Math.max(0, parseFloat(accuracyRate) || 0)),
      achievedAt: new Date().toISOString()
    };

    const saved = db.insert('scores', scoreRecord);

    // If authenticated, update cumulative user profile stats
    if (isAuth) {
      userModel.updateStats(req.currentUser.id, {
        score: scoreRecord.score,
        solvedCount: scoreRecord.solvedCount,
        highestStreak: scoreRecord.highestStreak,
        fastestSolveSeconds: scoreRecord.timeTakenSeconds > 0 ? scoreRecord.timeTakenSeconds : null
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Score successfully recorded.',
      data: { score: saved }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves the global enterprise leaderboard (sorted by high score descending)
 */
exports.getLeaderboard = (req, res) => {
  const allScores = db.findAll('scores');

  // Sort by score descending, then by solvedCount descending
  const sorted = [...allScores].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.solvedCount - a.solvedCount;
  });

  // Limit to top 15 entries
  const topScores = sorted.slice(0, 15).map((entry, index) => ({
    rank: index + 1,
    id: entry.id,
    displayName: entry.displayName,
    username: entry.username,
    avatarColor: entry.avatarColor,
    isGuest: entry.isGuest,
    score: entry.score,
    solvedCount: entry.solvedCount,
    highestStreak: entry.highestStreak,
    achievedAt: entry.achievedAt
  }));

  return res.status(200).json({
    success: true,
    data: { leaderboard: topScores }
  });
};

/**
 * Retrieves game score history for currently logged in virtual identity
 */
exports.getUserHistory = (req, res) => {
  if (!req.currentUser) {
    return res.status(200).json({
      success: true,
      data: { history: [] }
    });
  }

  const userScores = db.filter('scores', s => s.userId === req.currentUser.id);
  const sorted = [...userScores].sort((a, b) => new Date(b.achievedAt) - new Date(a.achievedAt));

  return res.status(200).json({
    success: true,
    data: {
      history: sorted.slice(0, 20),
      totalGames: sorted.length
    }
  });
};
