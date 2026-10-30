/**
 * @file bananaService.js
 * @description Interoperability Gateway Service for Marc Conrad's Banana API.
 * Demonstrates HTTP/REST communication, JSON parsing, fault tolerance, telemetry,
 * and security mediation (preventing client-side inspection of raw puzzle solutions).
 * 
 * References:
 * - Marc Conrad Banana API: https://marcconrad.com/uob/banana/doc.php
 * - RESTful Web Services & Distributed Systems Interoperability Patterns
 */

const https = require('https');
const http = require('http');
const config = require('../config');

// Fallback puzzle bank in case external university service is temporarily unreachable
const FALLBACK_PUZZLES = [
  {
    question: "https://marcconrad.com/uob/banana/banana.php?id=101",
    solution: 6,
    isFallback: true
  },
  {
    question: "https://marcconrad.com/uob/banana/banana.php?id=102",
    solution: 3,
    isFallback: true
  },
  {
    question: "https://marcconrad.com/uob/banana/banana.php?id=103",
    solution: 8,
    isFallback: true
  },
  {
    question: "https://marcconrad.com/uob/banana/banana.php?id=104",
    solution: 5,
    isFallback: true
  },
  {
    question: "https://marcconrad.com/uob/banana/banana.php?id=105",
    solution: 2,
    isFallback: true
  }
];

class BananaService {
  constructor() {
    this.telemetry = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      lastLatencyMs: 0,
      averageLatencyMs: 0,
      lastContacted: null,
      serviceHealth: 'UNKNOWN', // 'HEALTHY', 'DEGRADED', 'OFFLINE'
      lastError: null
    };
  }

  /**
   * Internal helper to execute HTTP/HTTPS GET request with timeout handling
   * @param {string} urlString 
   * @param {number} timeoutMs 
   * @returns {Promise<string>}
   */
  async _fetchRaw(urlString, timeoutMs = config.BANANA_API.TIMEOUT_MS) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(urlString);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const req = client.get(urlString, { timeout: timeoutMs }, (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP Status Code: ${res.statusCode} ${res.statusMessage}`));
        }

        let body = '';
        res.setEncoding('utf8');
        res.on('data', chunk => { body += chunk; });
        res.on('end', () => resolve(body));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Network timeout after ${timeoutMs}ms while contacting Banana API`));
      });

      req.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Fetches a live puzzle from Marc Conrad's Banana API
   * Implements automated fallback on network failure to preserve uninterrupted game availability.
   * @returns {Promise<{ question: string, solution: number, latencyMs: number, source: string }>}
   */
  async fetchPuzzle() {
    const startTime = Date.now();
    this.telemetry.totalRequests++;

    const primaryUrl = `${config.BANANA_API.BASE_URL}?out=${config.BANANA_API.DEFAULT_FORMAT}&base64=${config.BANANA_API.BASE64_ENABLED}`;

    try {
      // 1. Interoperability step: Perform outbound REST request
      const rawResponse = await this._fetchRaw(primaryUrl);
      const latencyMs = Date.now() - startTime;

      // 2. Interoperability step: Parse and validate JSON schema
      const parsedData = JSON.parse(rawResponse);

      if (!parsedData || typeof parsedData.question !== 'string' || typeof parsedData.solution === 'undefined') {
        throw new Error('Invalid JSON payload structure received from external Banana API');
      }

      // 3. Update telemetry metrics
      this._recordSuccess(latencyMs);

      return {
        question: parsedData.question,
        solution: parseInt(parsedData.solution, 10),
        latencyMs,
        source: 'LIVE_MARC_CONRAD_API'
      };
    } catch (primaryError) {
      console.warn(`[BananaService] Primary API call failed: ${primaryError.message}. Attempting HTTP fallback...`);

      // Try HTTP if HTTPS had certificate or handshake issues
      try {
        const httpFallbackUrl = `${config.BANANA_API.FALLBACK_HTTP_URL}?out=json`;
        const rawFallback = await this._fetchRaw(httpFallbackUrl, 4000);
        const latencyMs = Date.now() - startTime;
        const parsedData = JSON.parse(rawFallback);

        this._recordSuccess(latencyMs);
        return {
          question: parsedData.question,
          solution: parseInt(parsedData.solution, 10),
          latencyMs,
          source: 'HTTP_FALLBACK_API'
        };
      } catch (httpError) {
        // External service completely unreachable; invoke local resilient fallback
        const latencyMs = Date.now() - startTime;
        this._recordFailure(primaryError.message);

        console.error(`[BananaService] Both HTTPS and HTTP failed. Using resilient fallback puzzle.`);
        const fallback = FALLBACK_PUZZLES[Math.floor(Math.random() * FALLBACK_PUZZLES.length)];

        return {
          question: fallback.question,
          solution: fallback.solution,
          latencyMs,
          source: 'LOCAL_RESILIENCE_CACHE'
        };
      }
    }
  }

  /**
   * Records telemetry on successful request
   * @param {number} latencyMs 
   */
  _recordSuccess(latencyMs) {
    this.telemetry.successfulRequests++;
    this.telemetry.lastLatencyMs = latencyMs;
    this.telemetry.lastContacted = new Date().toISOString();
    this.telemetry.serviceHealth = 'HEALTHY';
    this.telemetry.lastError = null;

    // Moving average of latency
    if (this.telemetry.averageLatencyMs === 0) {
      this.telemetry.averageLatencyMs = latencyMs;
    } else {
      this.telemetry.averageLatencyMs = Math.round((this.telemetry.averageLatencyMs * 0.8) + (latencyMs * 0.2));
    }
  }

  /**
   * Records telemetry on failed request
   * @param {string} errorMessage 
   */
  _recordFailure(errorMessage) {
    this.telemetry.failedRequests++;
    this.telemetry.lastError = errorMessage;
    this.telemetry.serviceHealth = this.telemetry.successfulRequests > 0 ? 'DEGRADED' : 'OFFLINE';
  }

  /**
   * Interoperability health check and diagnostics report
   * @returns {Object}
   */
  getHealthReport() {
    return {
      status: this.telemetry.serviceHealth,
      targetEndpoint: config.BANANA_API.BASE_URL,
      protocol: 'REST / HTTPS & JSON',
      telemetry: { ...this.telemetry },
      resilienceStrategy: 'Two-tier fallback (HTTP retry + Local High-Availability Cache)'
    };
  }
}

module.exports = new BananaService();
