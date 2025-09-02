import express from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../../middleware/validateRequest.js';
import { rateLimiter } from '../../middleware/rateLimiter.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import * as authController from '../../controllers/authController.js';

const router = express.Router();

// Rate limiting for auth endpoints
const authRateLimit = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later'
});

/**
 * @route POST /api/auth/login
 * @desc Authenticate user (admin or client)
 * @access Public
 */
router.post('/login',
  authRateLimit,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('userType')
      .isIn(['admin', 'client'])
      .withMessage('User type must be either admin or client')
  ],
  validateRequest,
  authController.login
);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authController.logout);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh',
  [
    body('refreshToken')
      .notEmpty()
      .withMessage('Refresh token is required')
  ],
  validateRequest,
  authController.refreshToken
);

/**
 * @route POST /api/auth/forgot-password
 * @desc Send password reset email
 * @access Public
 */
router.post('/forgot-password',
  authRateLimit,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('userType')
      .isIn(['admin', 'client'])
      .withMessage('User type must be either admin or client')
  ],
  validateRequest,
  authController.forgotPassword
);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post('/reset-password',
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number'),
    body('userType')
      .isIn(['admin', 'client'])
      .withMessage('User type must be either admin or client')
  ],
  validateRequest,
  authController.resetPassword
);

/**
 * @route POST /api/auth/activate
 * @desc Activate user account with token
 * @access Public
 */
router.post('/activate',
  [
    body('token')
      .notEmpty()
      .withMessage('Activation token is required'),
    body('password')
      .isLength({ min: 8 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must be at least 8 characters with uppercase, lowercase, and number')
  ],
  validateRequest,
  authController.activateAccount
);

/**
 * @route GET /api/auth/me
 * @desc Get current user info
 * @access Private
 */
router.get('/me', requireAuth, authController.getCurrentUser);

export default router;