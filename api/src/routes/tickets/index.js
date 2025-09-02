import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../../middleware/validateRequest.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import * as ticketController from '../../controllers/ticketController.js';

const router = express.Router();

/**
 * @route GET /api/tickets
 * @desc Get tickets (filtered by organization for clients)
 * @access Private
 */
router.get('/',
  requireAuth,
  [
    query('organization_id')
      .optional()
      .isUUID()
      .withMessage('Organization ID must be a valid UUID'),
    query('status')
      .optional()
      .isIn(['open', 'in_progress', 'waiting_client', 'resolved', 'closed'])
      .withMessage('Status must be open, in_progress, waiting_client, resolved, or closed'),
    query('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Priority must be low, medium, high, or urgent'),
    query('type')
      .optional()
      .isIn(['support', 'bug', 'feature', 'billing'])
      .withMessage('Type must be support, bug, feature, or billing'),
    query('assignee_id')
      .optional()
      .isUUID()
      .withMessage('Assignee ID must be a valid UUID'),
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
  ticketController.getTickets
);

/**
 * @route POST /api/tickets
 * @desc Create new ticket
 * @access Private
 */
router.post('/',
  requireAuth,
  [
    body('organization_id')
      .if((value, { req }) => req.user?.userType === 'admin')
      .isUUID()
      .withMessage('Organization ID must be a valid UUID'),
    body('title')
      .trim()
      .isLength({ min: 5, max: 255 })
      .withMessage('Ticket title must be between 5 and 255 characters'),
    body('description')
      .trim()
      .isLength({ min: 10, max: 5000 })
      .withMessage('Description must be between 10 and 5000 characters'),
    body('type')
      .isIn(['support', 'bug', 'feature', 'billing'])
      .withMessage('Type must be support, bug, feature, or billing'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Priority must be low, medium, high, or urgent'),
    body('project_id')
      .optional()
      .isUUID()
      .withMessage('Project ID must be a valid UUID')
  ],
  validateRequest,
  ticketController.createTicket
);

/**
 * @route GET /api/tickets/:id
 * @desc Get ticket by ID with messages
 * @access Private
 */
router.get('/:id',
  requireAuth,
  [
    param('id').isUUID().withMessage('Ticket ID must be a valid UUID')
  ],
  validateRequest,
  ticketController.getTicketById
);

/**
 * @route PATCH /api/tickets/:id
 * @desc Update ticket (admin only)
 * @access Private/Admin
 */
router.patch('/:id',
  requireAuth,
  requireRole(['admin']),
  [
    param('id').isUUID().withMessage('Ticket ID must be a valid UUID'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 255 })
      .withMessage('Ticket title must be between 5 and 255 characters'),
    body('type')
      .optional()
      .isIn(['support', 'bug', 'feature', 'billing'])
      .withMessage('Type must be support, bug, feature, or billing'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high', 'urgent'])
      .withMessage('Priority must be low, medium, high, or urgent'),
    body('status')
      .optional()
      .isIn(['open', 'in_progress', 'waiting_client', 'resolved', 'closed'])
      .withMessage('Status must be open, in_progress, waiting_client, resolved, or closed'),
    body('assignee_user_admin_id')
      .optional()
      .isUUID()
      .withMessage('Assignee ID must be a valid UUID'),
    body('project_id')
      .optional()
      .isUUID()
      .withMessage('Project ID must be a valid UUID')
  ],
  validateRequest,
  ticketController.updateTicket
);

/**
 * @route PATCH /api/tickets/:id/status
 * @desc Update ticket status
 * @access Private/Admin
 */
router.patch('/:id/status',
  requireAuth,
  requireRole(['admin']),
  [
    param('id').isUUID().withMessage('Ticket ID must be a valid UUID'),
    body('status')
      .isIn(['open', 'in_progress', 'waiting_client', 'resolved', 'closed'])
      .withMessage('Status must be open, in_progress, waiting_client, resolved, or closed'),
    body('internal_note')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Internal note must be less than 1000 characters')
  ],
  validateRequest,
  ticketController.updateTicketStatus
);

/**
 * @route PATCH /api/tickets/:id/assign
 * @desc Assign ticket to admin user
 * @access Private/Admin
 */
router.patch('/:id/assign',
  requireAuth,
  requireRole(['admin']),
  [
    param('id').isUUID().withMessage('Ticket ID must be a valid UUID'),
    body('assignee_user_admin_id')
      .isUUID()
      .withMessage('Assignee ID must be a valid UUID')
  ],
  validateRequest,
  ticketController.assignTicket
);

// Ticket messages routes
/**
 * @route GET /api/tickets/:ticketId/messages
 * @desc Get ticket messages
 * @access Private
 */
router.get('/:ticketId/messages',
  requireAuth,
  [
    param('ticketId').isUUID().withMessage('Ticket ID must be a valid UUID')
  ],
  validateRequest,
  ticketController.getTicketMessages
);

/**
 * @route POST /api/tickets/:ticketId/messages
 * @desc Add message to ticket
 * @access Private
 */
router.post('/:ticketId/messages',
  requireAuth,
  [
    param('ticketId').isUUID().withMessage('Ticket ID must be a valid UUID'),
    body('message')
      .trim()
      .isLength({ min: 1, max: 5000 })
      .withMessage('Message must be between 1 and 5000 characters'),
    body('is_internal')
      .optional()
      .isBoolean()
      .withMessage('Is internal must be a boolean')
  ],
  validateRequest,
  ticketController.addTicketMessage
);

/**
 * @route GET /api/tickets/stats
 * @desc Get ticket statistics (admin only)
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
      .isIn(['day', 'week', 'month', 'quarter', 'year'])
      .withMessage('Period must be day, week, month, quarter, or year')
  ],
  validateRequest,
  ticketController.getTicketStats
);

export default router;