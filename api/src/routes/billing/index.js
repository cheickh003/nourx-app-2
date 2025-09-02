import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../../middleware/validateRequest.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import * as billingController from '../../controllers/billingController.js';

const router = express.Router();

/**
 * @route GET /api/billing/invoices
 * @desc Get invoices (filtered by organization for clients)
 * @access Private
 */
router.get('/invoices',
  requireAuth,
  [
    query('organization_id')
      .optional()
      .isUUID()
      .withMessage('Organization ID must be a valid UUID'),
    query('status')
      .optional()
      .isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
      .withMessage('Status must be draft, sent, paid, overdue, or cancelled'),
    query('project_id')
      .optional()
      .isUUID()
      .withMessage('Project ID must be a valid UUID'),
    query('from_date')
      .optional()
      .isISO8601()
      .withMessage('From date must be a valid date'),
    query('to_date')
      .optional()
      .isISO8601()
      .withMessage('To date must be a valid date'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  validateRequest,
  billingController.getInvoices
);

/**
 * @route POST /api/billing/invoices
 * @desc Create new invoice
 * @access Private/Admin
 */
router.post('/invoices',
  requireAuth,
  requireRole(['admin']),
  [
    body('organization_id')
      .isUUID()
      .withMessage('Organization ID must be a valid UUID'),
    body('project_id')
      .optional()
      .isUUID()
      .withMessage('Project ID must be a valid UUID'),
    body('number')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Invoice number is required and must be less than 50 characters'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Title must be less than 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters'),
    body('issue_date')
      .isISO8601()
      .withMessage('Issue date must be a valid date'),
    body('due_date')
      .isISO8601()
      .withMessage('Due date must be a valid date'),
    body('total_amount')
      .isFloat({ min: 0 })
      .withMessage('Total amount must be a positive number'),
    body('currency')
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency must be a 3-letter code')
  ],
  validateRequest,
  billingController.createInvoice
);

/**
 * @route GET /api/billing/invoices/:id
 * @desc Get invoice by ID
 * @access Private
 */
router.get('/invoices/:id',
  requireAuth,
  [
    param('id').isUUID().withMessage('Invoice ID must be a valid UUID')
  ],
  validateRequest,
  billingController.getInvoiceById
);

/**
 * @route PATCH /api/billing/invoices/:id
 * @desc Update invoice
 * @access Private/Admin
 */
router.patch('/invoices/:id',
  requireAuth,
  requireRole(['admin']),
  [
    param('id').isUUID().withMessage('Invoice ID must be a valid UUID'),
    body('title')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Title must be less than 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters'),
    body('status')
      .optional()
      .isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
      .withMessage('Status must be draft, sent, paid, overdue, or cancelled'),
    body('issue_date')
      .optional()
      .isISO8601()
      .withMessage('Issue date must be a valid date'),
    body('due_date')
      .optional()
      .isISO8601()
      .withMessage('Due date must be a valid date'),
    body('total_amount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Total amount must be a positive number'),
    body('currency')
      .optional()
      .isLength({ min: 3, max: 3 })
      .withMessage('Currency must be a 3-letter code'),
    body('payment_url')
      .optional()
      .isURL()
      .withMessage('Payment URL must be a valid URL')
  ],
  validateRequest,
  billingController.updateInvoice
);

/**
 * @route PATCH /api/billing/invoices/:id/status
 * @desc Update invoice status
 * @access Private/Admin
 */
router.patch('/invoices/:id/status',
  requireAuth,
  requireRole(['admin']),
  [
    param('id').isUUID().withMessage('Invoice ID must be a valid UUID'),
    body('status')
      .isIn(['draft', 'sent', 'paid', 'overdue', 'cancelled'])
      .withMessage('Status must be draft, sent, paid, overdue, or cancelled'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must be less than 1000 characters')
  ],
  validateRequest,
  billingController.updateInvoiceStatus
);

/**
 * @route POST /api/billing/invoices/:id/send
 * @desc Send invoice via email
 * @access Private/Admin
 */
router.post('/invoices/:id/send',
  requireAuth,
  requireRole(['admin']),
  [
    param('id').isUUID().withMessage('Invoice ID must be a valid UUID'),
    body('email_addresses')
      .optional()
      .isArray()
      .withMessage('Email addresses must be an array'),
    body('email_addresses.*')
      .optional()
      .isEmail()
      .withMessage('Each email address must be valid'),
    body('message')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Message must be less than 1000 characters')
  ],
  validateRequest,
  billingController.sendInvoice
);

/**
 * @route GET /api/billing/invoices/:id/pdf
 * @desc Download invoice PDF
 * @access Private
 */
router.get('/invoices/:id/pdf',
  requireAuth,
  [
    param('id').isUUID().withMessage('Invoice ID must be a valid UUID')
  ],
  validateRequest,
  billingController.downloadInvoicePDF
);

/**
 * @route POST /api/billing/invoices/:id/mark-paid
 * @desc Mark invoice as paid
 * @access Private/Admin
 */
router.post('/invoices/:id/mark-paid',
  requireAuth,
  requireRole(['admin']),
  [
    param('id').isUUID().withMessage('Invoice ID must be a valid UUID'),
    body('payment_date')
      .optional()
      .isISO8601()
      .withMessage('Payment date must be a valid date'),
    body('payment_reference')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Payment reference must be less than 255 characters'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Notes must be less than 1000 characters')
  ],
  validateRequest,
  billingController.markInvoicePaid
);

/**
 * @route GET /api/billing/stats
 * @desc Get billing statistics (admin only)
 * @access Private/Admin
 */
router.get('/stats',
  requireAuth,
  requireRole(['admin']),
  [
    query('organization_id')
      .optional()
      .isUUID()
      .withMessage('Organization ID must be a valid UUID'),
    query('period')
      .optional()
      .isIn(['month', 'quarter', 'year'])
      .withMessage('Period must be month, quarter, or year'),
    query('year')
      .optional()
      .isInt({ min: 2020, max: 2030 })
      .withMessage('Year must be between 2020 and 2030')
  ],
  validateRequest,
  billingController.getBillingStats
);

/**
 * @route GET /api/billing/overdue
 * @desc Get overdue invoices (admin only)
 * @access Private/Admin
 */
router.get('/overdue',
  requireAuth,
  requireRole(['admin']),
  [
    query('days_overdue')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Days overdue must be a positive integer'),
    query('organization_id')
      .optional()
      .isUUID()
      .withMessage('Organization ID must be a valid UUID')
  ],
  validateRequest,
  billingController.getOverdueInvoices
);

export default router;