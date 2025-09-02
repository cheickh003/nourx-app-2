import rateLimit from 'express-rate-limit';
import { RateLimitError } from './errorHandler.js';
import { logSecurityEvent } from './logger.js';

// Default rate limit configuration
const defaultOptions = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next) => {
    // Log rate limit violation
    logSecurityEvent('RATE_LIMIT_EXCEEDED', {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
      requestId: req.requestId
    });

    const error = new RateLimitError('Too many requests from this IP, please try again later');
    next(error);
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    return req.user?.id || req.ip || req.connection.remoteAddress;
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
};

// Create rate limiter with custom options
export const rateLimiter = (options = {}) => {
  const config = { ...defaultOptions, ...options };
  return rateLimit(config);
};

// Strict rate limiter for authentication endpoints
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5, // 5 attempts per window
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res, next) => {
    logSecurityEvent('AUTH_RATE_LIMIT_EXCEEDED', {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
      requestId: req.requestId,
      attemptedEmail: req.body?.email
    });

    const error = new RateLimitError(
      'Too many authentication attempts, please try again in 15 minutes'
    );
    next(error);
  }
});

// Lenient rate limiter for general API endpoints
export const apiRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per window for authenticated users
  keyGenerator: (req) => {
    // Authenticated users get higher limits
    if (req.user?.id) {
      return `user:${req.user.id}`;
    }
    return `ip:${req.ip || req.connection.remoteAddress}`;
  }
});

// File upload rate limiter
export const uploadRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  handler: (req, res, next) => {
    logSecurityEvent('UPLOAD_RATE_LIMIT_EXCEEDED', {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      requestId: req.requestId
    });

    const error = new RateLimitError(
      'Upload limit exceeded, please try again later'
    );
    next(error);
  }
});