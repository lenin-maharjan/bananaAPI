/**
 * @file runAllTests.js
 * @description Comprehensive Automated Test Suite.
 * Validates Version Control components, EventBus pub/sub,
 * Banana API Interoperability, and Virtual Identity cryptographic security.
 * 
 * Run with: npm test
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Ensure test directory uses isolated db file
const testDbPath = path.join(__dirname, '..', 'data', 'test_store.json');
process.env.SESSION_SECRET = 'test_secret_key_12345';

console.log('🧪 ====================================================');
console.log('🧪 STARTING ENTERPRISE ARCHITECTURE TEST SUITE');
console.log('🧪 ====================================================\n');

let testsPassed = 0;
let testsFailed = 0;

function runTest(testName, fn) {
  try {
    fn();
    console.log(`  ✓ [PASS] ${testName}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${testName}`);
    console.error(`    Error: ${err.message}`);
    testsFailed++;
  }
}

async function runAsyncTest(testName, fn) {
  try {
    await fn();
    console.log(`  ✓ [PASS] ${testName}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${testName}`);
    console.error(`    Error: ${err.message}`);
    testsFailed++;
  }
}

async function main() {
  // Clean up any test database prior to running
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  // ==========================================
  // SUITE 1: EVENT-DRIVEN PROGRAMMING (EventBus)
  // ==========================================
  console.log('📦 SUITE 1: Event-Driven Architecture & Pub/Sub Bus');
  const { EventBus, EVENTS } = require('../src/public/js/eventBus');

  runTest('EventBus: Registers subscriber and dispatches event payload', () => {
    const bus = new EventBus();
    let receivedData = null;

    bus.on('TEST_EVENT', (data) => {
      receivedData = data;
    });

    bus.emit('TEST_EVENT', { score: 100, user: 'lenin' });

    assert.deepStrictEqual(receivedData, { score: 100, user: 'lenin' });
  });

  runTest('EventBus: once() handler unsubscribes after first execution', () => {
    const bus = new EventBus();
    let callCount = 0;

    bus.once('SINGLE_SHOT', () => {
      callCount++;
    });

    bus.emit('SINGLE_SHOT');
    bus.emit('SINGLE_SHOT');

    assert.strictEqual(callCount, 1, 'once() handler should execute strictly once');
  });

  runTest('EventBus: off() unregisters listener cleanly to avoid memory leaks', () => {
    const bus = new EventBus();
    let callCount = 0;
    const handler = () => { callCount++; };

    bus.on('LEAK_TEST', handler);
    bus.emit('LEAK_TEST');
    bus.off('LEAK_TEST', handler);
    bus.emit('LEAK_TEST');

    assert.strictEqual(callCount, 1, 'Handler should not be invoked after off()');
  });

  runTest('EventBus: Logs audit telemetry for UI inspector', () => {
    const bus = new EventBus();
    bus.emit('AUDIT_TEST', { action: 'VERIFY' });

    const logs = bus.getRecentLogs();
    assert.ok(logs.length >= 1, 'Audit log should record dispatched event');
    assert.strictEqual(logs[0].name, 'AUDIT_TEST');
  });

  // ==========================================
  // SUITE 2: VIRTUAL IDENTITY & SECURITY (Auth)
  // ==========================================
  console.log('\n🔒 SUITE 2: Virtual Identity & Cryptographic Security');
  const authService = require('../src/server/services/authService');
  const userModel = require('../src/server/models/userModel');

  await runAsyncTest('AuthService: Registers user with salted bcrypt hash', async () => {
    const username = `usr_${Date.now().toString().slice(-6)}`;
    const password = 'StrongPassword2026!';

    const user = await authService.register({ username, password, displayName: 'Test Gamer' });

    assert.strictEqual(user.username, username);
    assert.strictEqual(user.displayName, 'Test Gamer');
    assert.strictEqual(typeof user.passwordHash, 'undefined', 'passwordHash MUST be sanitized out');

    // Retrieve internal entity to verify bcrypt hash format
    const dbUser = userModel.findByUsername(username);
    assert.ok(dbUser.passwordHash.startsWith('$2a$') || dbUser.passwordHash.startsWith('$2b$'), 'Must be standard bcrypt salt prefix');
    assert.notStrictEqual(dbUser.passwordHash, password, 'Password must never be saved in plaintext');
  });

  await runAsyncTest('AuthService: Validates correct password credentials', async () => {
    const username = `auth_${Date.now().toString().slice(-6)}`;
    const password = 'CorrectPassword123';

    await authService.register({ username, password });
    const authenticatedUser = await authService.login({ username, password });

    assert.strictEqual(authenticatedUser.username, username);
  });

  await runAsyncTest('AuthService: Rejects invalid password without revealing details', async () => {
    const username = `bad_${Date.now().toString().slice(-6)}`;
    await authService.register({ username, password: 'RealPassword123' });

    let errorThrown = false;
    try {
      await authService.login({ username, password: 'WrongPassword456' });
    } catch (err) {
      errorThrown = true;
      assert.strictEqual(err.message, 'Invalid username or password.');
    }
    assert.ok(errorThrown, 'Should throw on bad credentials');
  });

  await runAsyncTest('AuthService: Enforces password length constraint (>= 6)', async () => {
    let errorThrown = false;
    try {
      await authService.register({ username: 'shortpw_user', password: '123' });
    } catch (err) {
      errorThrown = true;
      assert.ok(err.message.includes('at least 6 characters'));
    }
    assert.ok(errorThrown);
  });

  // ==========================================
  // SUITE 3: INTEROPERABILITY (Banana REST API)
  // ==========================================
  console.log('\n🌐 SUITE 3: Banana API Interoperability Gateway');
  const bananaService = require('../src/server/services/bananaService');

  await runAsyncTest('BananaService: Fetches live puzzle or fallback with valid schema', async () => {
    const puzzle = await bananaService.fetchPuzzle();

    assert.ok(puzzle.question, 'Puzzle must contain a question image URL');
    assert.ok(typeof puzzle.solution === 'number', 'Solution must be an integer');
    assert.ok(puzzle.solution >= 0 && puzzle.solution <= 9, 'Banana solutions are single digits (0-9)');
    assert.ok(puzzle.latencyMs >= 0, 'Must record latency metric');
    assert.ok(['LIVE_MARC_CONRAD_API', 'HTTP_FALLBACK_API', 'LOCAL_RESILIENCE_CACHE'].includes(puzzle.source));
  });

  runTest('BananaService: Generates diagnostic health report for dashboard', () => {
    const report = bananaService.getHealthReport();
    assert.ok(['HEALTHY', 'DEGRADED', 'UNKNOWN', 'OFFLINE'].includes(report.status));
    assert.ok(report.targetEndpoint.includes('banana/api.php'));
    assert.strictEqual(report.protocol, 'REST / HTTPS & JSON');
    assert.ok(report.telemetry.totalRequests >= 1);
  });

  // ==========================================
  // SUITE 4: SCORE & PROGRESSION INTEGRATION
  // ==========================================
  console.log('\n🏆 SUITE 4: Score Aggregation & Progression');
  const db = require('../src/server/models/db');

  runTest('UserModel: Updates cumulative player stats upon game completion', () => {
    const user = userModel.create({ username: `statsuser_${Date.now()}`, passwordHash: 'dummy' });
    const initialStats = user.stats;

    userModel.updateStats(user.id, {
      score: 450,
      solvedCount: 5,
      highestStreak: 3,
      fastestSolveSeconds: 2.4
    });

    const updated = userModel.findById(user.id);
    assert.strictEqual(updated.stats.gamesPlayed, 1);
    assert.strictEqual(updated.stats.highScore, 450);
    assert.strictEqual(updated.stats.questionsSolved, 5);
    assert.strictEqual(updated.stats.highestStreak, 3);
    assert.strictEqual(updated.stats.fastestSolveSeconds, 2.4);
  });

  // Summary
  console.log('\n====================================================');
  console.log(`TEST RESULTS: ${testsPassed} PASSED | ${testsFailed} FAILED`);
  console.log('====================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
