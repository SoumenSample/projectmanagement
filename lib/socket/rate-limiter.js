/**
 * Simple in-memory rate limiter for socket events
 * In production, use Redis-based rate limiter for distributed systems
 */
class RateLimiter {
  constructor() {
    this.requests = new Map(); // userId -> { count, resetAt }
  }

  /**
   * Check if user has exceeded rate limit
   * @param {string} userId - User ID
   * @param {number} limit - Max requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {object} { allowed: boolean, remaining: number, resetAt: Date }
   */
  check(userId, limit = 10, windowMs = 60000) {
    const now = Date.now();
    let record = this.requests.get(userId);

    // Create new record or reset if window expired
    if (!record || now > record.resetAt) {
      record = {
        count: 1,
        resetAt: now + windowMs,
      };
      this.requests.set(userId, record);
      return {
        allowed: true,
        remaining: limit - 1,
        resetAt: new Date(record.resetAt),
      };
    }

    // Check if limit exceeded
    record.count++;
    if (record.count > limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(record.resetAt),
      };
    }

    return {
      allowed: true,
      remaining: limit - record.count,
      resetAt: new Date(record.resetAt),
    };
  }

  /**
   * Reset user's rate limit
   */
  reset(userId) {
    this.requests.delete(userId);
  }

  /**
   * Clear all expired entries (cleanup)
   */
  cleanup() {
    const now = Date.now();
    for (const [userId, record] of this.requests.entries()) {
      if (now > record.resetAt) {
        this.requests.delete(userId);
      }
    }
  }

  /**
   * Get stats for monitoring
   */
  getStats() {
    return {
      trackedUsers: this.requests.size,
      memoryUsage: JSON.stringify([...this.requests]).length,
    };
  }
}

/**
 * Create rate limit middleware for socket
 */
function createRateLimitMiddleware(options = {}) {
  const limiter = new RateLimiter();
  const {
    messageLimit = 10, // max messages per user
    messageWindow = 60000, // 1 minute
    ticketLimit = 20,
    ticketWindow = 60000,
    cleanupInterval = 300000, // 5 minutes
  } = options;

  // Cleanup expired entries periodically
  setInterval(() => limiter.cleanup(), cleanupInterval);

  return {
    checkMessage: (userId) => {
      return limiter.check(userId, messageLimit, messageWindow);
    },
    checkTicket: (userId) => {
      return limiter.check(`${userId}:ticket`, ticketLimit, ticketWindow);
    },
    reset: (userId) => {
      limiter.reset(userId);
      limiter.reset(`${userId}:ticket`);
    },
    getStats: () => limiter.getStats(),
  };
}

module.exports = {
  RateLimiter,
  createRateLimitMiddleware,
};
