import express from 'express';
import EmailController from '../controllers/emailController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();
const emailController = new EmailController();

// Rate limiting for email endpoints
const emailRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  message: {
    success: false,
    message: 'Too many email requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

const testEmailRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit test emails to 5 per hour
  message: {
    success: false,
    message: 'Too many test email requests, please try again later'
  }
});

// Apply authentication to all email routes
router.use(authenticateToken);

/**
 * @route   GET /api/admin/emails/health
 * @desc    Get email service health status
 * @access  Admin only
 */
router.get('/health', 
  requireRole('admin'),
  emailController.getHealth.bind(emailController)
);

/**
 * @route   GET /api/admin/emails/queue/status
 * @desc    Get email queue status and statistics
 * @access  Admin only
 */
router.get('/queue/status',
  requireRole('admin'),
  emailController.getQueueStatus.bind(emailController)
);

/**
 * @route   POST /api/admin/emails/send
 * @desc    Send email using template
 * @access  Admin only
 */
router.post('/send',
  requireRole('admin'),
  emailRateLimit,
  emailController.sendEmail.bind(emailController)
);

/**
 * @route   POST /api/admin/emails/test
 * @desc    Send test email
 * @access  Admin only
 */
router.post('/test',
  requireRole('admin'),
  testEmailRateLimit,
  emailController.testEmail.bind(emailController)
);

/**
 * @route   POST /api/admin/emails/:emailId/retry
 * @desc    Retry failed email
 * @access  Admin only
 */
router.post('/:emailId/retry',
  requireRole('admin'),
  emailController.retryEmail.bind(emailController)
);

// Email Templates Routes

/**
 * @route   GET /api/admin/emails/templates
 * @desc    Get all email templates
 * @access  Admin only
 */
router.get('/templates',
  requireRole('admin'),
  emailController.getTemplates.bind(emailController)
);

/**
 * @route   GET /api/admin/emails/templates/:key
 * @desc    Get specific email template
 * @access  Admin only
 */
router.get('/templates/:key',
  requireRole('admin'),
  emailController.getTemplate.bind(emailController)
);

/**
 * @route   PUT /api/admin/emails/templates/:key
 * @desc    Create or update email template
 * @access  Admin only
 */
router.put('/templates/:key',
  requireRole('admin'),
  emailController.updateTemplate.bind(emailController)
);

/**
 * @route   DELETE /api/admin/emails/templates/:key
 * @desc    Delete email template
 * @access  Admin only
 */
router.delete('/templates/:key',
  requireRole('admin'),
  emailController.deleteTemplate.bind(emailController)
);

/**
 * @route   POST /api/admin/emails/templates/:key/preview
 * @desc    Preview email template with sample data
 * @access  Admin only
 */
router.post('/templates/:key/preview',
  requireRole('admin'),
  emailController.previewTemplate.bind(emailController)
);

// Specific Email Types Routes

/**
 * @route   POST /api/admin/emails/send-invitation
 * @desc    Send user invitation email
 * @access  Admin only
 */
router.post('/send-invitation',
  requireRole('admin'),
  emailRateLimit,
  emailController.sendUserInvitation.bind(emailController)
);

/**
 * @route   POST /api/admin/emails/send-reset
 * @desc    Send password reset email
 * @access  Admin only
 */
router.post('/send-reset',
  requireRole('admin'),
  emailRateLimit,
  emailController.sendPasswordReset.bind(emailController)
);

/**
 * @route   POST /api/admin/emails/send-welcome
 * @desc    Send welcome/activation email
 * @access  Admin only
 */
router.post('/send-welcome',
  requireRole('admin'),
  emailRateLimit,
  emailController.sendWelcome.bind(emailController)
);

// Email Worker Management Routes (Super Admin only)

/**
 * @route   POST /api/admin/emails/worker/start
 * @desc    Start email worker
 * @access  Super Admin only
 */
router.post('/worker/start',
  requireRole('super_admin'), // Assuming super_admin role exists
  emailController.startWorker.bind(emailController)
);

/**
 * @route   POST /api/admin/emails/worker/stop
 * @desc    Stop email worker
 * @access  Super Admin only
 */
router.post('/worker/stop',
  requireRole('super_admin'),
  emailController.stopWorker.bind(emailController)
);

// Error handling middleware for email routes
router.use((error, req, res, next) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details
    });
  }

  if (error.name === 'RateLimitError') {
    return res.status(429).json({
      success: false,
      message: 'Rate limit exceeded'
    });
  }

  // Log the error
  console.error('Email route error:', error);

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

export default router;