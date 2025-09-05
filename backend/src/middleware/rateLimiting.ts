import rateLimit from 'express-rate-limit';
import { config } from '@/config';
import { RateLimitError } from '@/types/errors';

// Rate limiter général
export const generalRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Too many requests, please try again later. Limit: ${config.rateLimit.maxRequests} requests per ${config.rateLimit.windowMs / 60000} minutes.`,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new RateLimitError();
  },
});

// Rate limiter spécifique pour l'authentification (plus strict)
export const authRateLimit = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: `Too many authentication attempts, please try again later. Limit: ${config.rateLimit.authMax} attempts per ${config.rateLimit.windowMs / 60000} minutes.`,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new RateLimitError('Too many authentication attempts');
  },
});

// Rate limiter pour les uploads (très strict)
export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limite de 10 uploads par 15 minutes
  message: {
    success: false,
    error: {
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      message: 'Too many file uploads, please try again later. Limit: 10 uploads per 15 minutes.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new RateLimitError('Too many file uploads');
  },
});

// Rate limiter pour les opérations sensibles (tickets, factures)
export const sensitiveOperationsRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requêtes par minute
  message: {
    success: false,
    error: {
      code: 'SENSITIVE_RATE_LIMIT_EXCEEDED',
      message: 'Too many requests for sensitive operations, please slow down.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    throw new RateLimitError('Too many sensitive operations');
  },
});