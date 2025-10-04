import { log } from '../log';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface UserRateLimit {
  count: number;
  resetAt: number;
}

/**
 * Simple in-memory rate limiter for bot commands
 */
export class RateLimiter {
  private limits: Map<number, UserRateLimit> = new Map();
  private config: RateLimitConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig = { maxRequests: 5, windowMs: 60000 }) {
    this.config = config;

    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  /**
   * Check if user has exceeded rate limit
   * @returns true if allowed, false if rate limited
   */
  checkLimit(userId: number): boolean {
    const now = Date.now();
    const userLimit = this.limits.get(userId);

    // No previous requests or window has reset
    if (!userLimit || now >= userLimit.resetAt) {
      this.limits.set(userId, {
        count: 1,
        resetAt: now + this.config.windowMs,
      });
      return true;
    }

    // Within window, check count
    if (userLimit.count < this.config.maxRequests) {
      userLimit.count++;
      return true;
    }

    // Rate limited
    log.warn(
      `Rate limit exceeded for user ${userId}: ` +
      `${userLimit.count}/${this.config.maxRequests} requests in window`
    );
    return false;
  }

  /**
   * Get remaining requests for a user
   */
  getRemaining(userId: number): number {
    const now = Date.now();
    const userLimit = this.limits.get(userId);

    if (!userLimit || now >= userLimit.resetAt) {
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - userLimit.count);
  }

  /**
   * Get time until rate limit resets (in seconds)
   */
  getResetTime(userId: number): number {
    const now = Date.now();
    const userLimit = this.limits.get(userId);

    if (!userLimit || now >= userLimit.resetAt) {
      return 0;
    }

    return Math.ceil((userLimit.resetAt - now) / 1000);
  }

  /**
   * Reset rate limit for a user (admin function)
   */
  reset(userId: number): void {
    this.limits.delete(userId);
    log.info(`Reset rate limit for user ${userId}`);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [userId, limit] of this.limits.entries()) {
      if (now >= limit.resetAt) {
        this.limits.delete(userId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      log.debug(`Cleaned up ${cleaned} expired rate limit entries`);
    }
  }

  /**
   * Get statistics
   */
  getStats(): {
    activeUsers: number;
    config: RateLimitConfig;
  } {
    return {
      activeUsers: this.limits.size,
      config: this.config,
    };
  }

  /**
   * Shut down the rate limiter
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.limits.clear();
  }
}
