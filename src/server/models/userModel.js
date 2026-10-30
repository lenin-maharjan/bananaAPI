/**
 * @file userModel.js
 * @description Virtual Identity Data Access Object (DAO).
 * Manages user entities, credential storage references, and gameplay stats.
 * 
 * References:
 * - Enterprise Security Architecture & Identity Management Standards (NIST SP 800-63B)
 */

const db = require('./db');

class UserModel {
  /**
   * Finds a user by unique username (case-insensitive)
   * @param {string} username 
   * @returns {Object|null}
   */
  findByUsername(username) {
    if (!username) return null;
    const cleanUsername = username.trim().toLowerCase();
    return db.findOne('users', u => u.username.toLowerCase() === cleanUsername);
  }

  /**
   * Finds a user by unique ID
   * @param {string} id 
   * @returns {Object|null}
   */
  findById(id) {
    return db.findOne('users', u => u.id === id);
  }

  /**
   * Creates a new Virtual Identity
   * @param {Object} userData 
   * @returns {Object}
   */
  create(userData) {
    const user = {
      username: userData.username.trim(),
      passwordHash: userData.passwordHash,
      displayName: userData.displayName || userData.username.trim(),
      role: userData.role || 'player',
      avatarColor: userData.avatarColor || '#FACC15', // Default Banana Gold
      stats: {
        gamesPlayed: 0,
        highScore: 0,
        totalScore: 0,
        questionsSolved: 0,
        highestStreak: 0,
        fastestSolveSeconds: null
      },
      createdAt: new Date().toISOString()
    };

    return db.insert('users', user);
  }

  /**
   * Updates user statistics upon game completion
   * @param {string} userId 
   * @param {Object} gameResult 
   * @returns {Object|null}
   */
  updateStats(userId, gameResult) {
    const user = this.findById(userId);
    if (!user) return null;

    const stats = user.stats || {
      gamesPlayed: 0,
      highScore: 0,
      totalScore: 0,
      questionsSolved: 0,
      highestStreak: 0,
      fastestSolveSeconds: null
    };

    const newGamesPlayed = stats.gamesPlayed + 1;
    const newTotalScore = stats.totalScore + (gameResult.score || 0);
    const newHighScore = Math.max(stats.highScore, gameResult.score || 0);
    const newQuestionsSolved = stats.questionsSolved + (gameResult.solvedCount || 0);
    const newHighestStreak = Math.max(stats.highestStreak, gameResult.highestStreak || 0);
    
    let fastestSolve = stats.fastestSolveSeconds;
    if (gameResult.fastestSolveSeconds) {
      fastestSolve = fastestSolve === null 
        ? gameResult.fastestSolveSeconds 
        : Math.min(fastestSolve, gameResult.fastestSolveSeconds);
    }

    const updatedStats = {
      gamesPlayed: newGamesPlayed,
      highScore: newHighScore,
      totalScore: newTotalScore,
      questionsSolved: newQuestionsSolved,
      highestStreak: newHighestStreak,
      fastestSolveSeconds: fastestSolve
    };

    return db.update('users', userId, { stats: updatedStats });
  }

  /**
   * Returns a sanitized user profile without sensitive security hashes
   * @param {Object} user 
   * @returns {Object}
   */
  sanitize(user) {
    if (!user) return null;
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}

module.exports = new UserModel();
