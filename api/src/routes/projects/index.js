import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../../middleware/validateRequest.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import * as projectController from '../../controllers/projectController.js';

const router = express.Router();

// Projects routes
/**
 * @route GET /api/projects
 * @desc Get projects (filtered by organization for clients)
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
      .isIn(['active', 'completed', 'cancelled', 'on_hold'])
      .withMessage('Status must be active, completed, cancelled, or on_hold'),
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
  projectController.getProjects
);

/**
 * @route POST /api/projects
 * @desc Create new project
 * @access Private/Admin
 */
router.post('/',
  requireAuth,
  requireRole(['admin']),
  [
    body('organization_id')
      .isUUID()
      .withMessage('Organization ID must be a valid UUID'),
    body('name')
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('Project name must be between 2 and 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters'),
    body('due_date')
      .optional()
      .isISO8601()
      .withMessage('Due date must be a valid date'),
    body('visible_to_client')
      .optional()
      .isBoolean()
      .withMessage('Visible to client must be a boolean')
  ],
  validateRequest,
  projectController.createProject
);

/**
 * @route GET /api/projects/:id
 * @desc Get project by ID
 * @access Private
 */
router.get('/:id',
  requireAuth,
  [
    param('id').isUUID().withMessage('Project ID must be a valid UUID')
  ],
  validateRequest,
  projectController.getProjectById
);

/**
 * @route PATCH /api/projects/:id
 * @desc Update project
 * @access Private/Admin
 */
router.patch('/:id',
  requireAuth,
  requireRole(['admin']),
  [
    param('id').isUUID().withMessage('Project ID must be a valid UUID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('Project name must be between 2 and 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters'),
    body('status')
      .optional()
      .isIn(['active', 'completed', 'cancelled', 'on_hold'])
      .withMessage('Status must be active, completed, cancelled, or on_hold'),
    body('due_date')
      .optional()
      .isISO8601()
      .withMessage('Due date must be a valid date'),
    body('visible_to_client')
      .optional()
      .isBoolean()
      .withMessage('Visible to client must be a boolean')
  ],
  validateRequest,
  projectController.updateProject
);

// Milestones routes
/**
 * @route GET /api/projects/:projectId/milestones
 * @desc Get project milestones
 * @access Private
 */
router.get('/:projectId/milestones',
  requireAuth,
  [
    param('projectId').isUUID().withMessage('Project ID must be a valid UUID')
  ],
  validateRequest,
  projectController.getProjectMilestones
);

/**
 * @route POST /api/projects/:projectId/milestones
 * @desc Create milestone
 * @access Private/Admin
 */
router.post('/:projectId/milestones',
  requireAuth,
  requireRole(['admin']),
  [
    param('projectId').isUUID().withMessage('Project ID must be a valid UUID'),
    body('title')
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('Milestone title must be between 2 and 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters'),
    body('due_date')
      .optional()
      .isISO8601()
      .withMessage('Due date must be a valid date'),
    body('visible_to_client')
      .optional()
      .isBoolean()
      .withMessage('Visible to client must be a boolean')
  ],
  validateRequest,
  projectController.createMilestone
);

/**
 * @route PATCH /api/projects/:projectId/milestones/:milestoneId
 * @desc Update milestone
 * @access Private/Admin
 */
router.patch('/:projectId/milestones/:milestoneId',
  requireAuth,
  requireRole(['admin']),
  [
    param('projectId').isUUID().withMessage('Project ID must be a valid UUID'),
    param('milestoneId').isUUID().withMessage('Milestone ID must be a valid UUID'),
    body('title')
      .optional()
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('Milestone title must be between 2 and 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters'),
    body('status')
      .optional()
      .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
      .withMessage('Status must be pending, in_progress, completed, or cancelled'),
    body('due_date')
      .optional()
      .isISO8601()
      .withMessage('Due date must be a valid date'),
    body('visible_to_client')
      .optional()
      .isBoolean()
      .withMessage('Visible to client must be a boolean')
  ],
  validateRequest,
  projectController.updateMilestone
);

// Deliverables routes
/**
 * @route GET /api/projects/:projectId/deliverables
 * @desc Get project deliverables
 * @access Private
 */
router.get('/:projectId/deliverables',
  requireAuth,
  [
    param('projectId').isUUID().withMessage('Project ID must be a valid UUID')
  ],
  validateRequest,
  projectController.getProjectDeliverables
);

/**
 * @route POST /api/projects/:projectId/deliverables
 * @desc Upload deliverable
 * @access Private/Admin
 */
router.post('/:projectId/deliverables',
  requireAuth,
  requireRole(['admin']),
  [
    param('projectId').isUUID().withMessage('Project ID must be a valid UUID'),
    body('milestone_id')
      .optional()
      .isUUID()
      .withMessage('Milestone ID must be a valid UUID'),
    body('filename')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Filename is required and must be less than 255 characters'),
    body('file_url')
      .trim()
      .notEmpty()
      .withMessage('File URL is required'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Notes must be less than 2000 characters'),
    body('visible_to_client')
      .optional()
      .isBoolean()
      .withMessage('Visible to client must be a boolean')
  ],
  validateRequest,
  projectController.createDeliverable
);

/**
 * @route PATCH /api/projects/:projectId/deliverables/:deliverableId/approve
 * @desc Approve/reject deliverable (client only)
 * @access Private/Client
 */
router.patch('/:projectId/deliverables/:deliverableId/approve',
  requireAuth,
  requireRole(['client']),
  [
    param('projectId').isUUID().withMessage('Project ID must be a valid UUID'),
    param('deliverableId').isUUID().withMessage('Deliverable ID must be a valid UUID'),
    body('approved')
      .isBoolean()
      .withMessage('Approved must be a boolean'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Approval notes must be less than 1000 characters')
  ],
  validateRequest,
  projectController.approveDeliverable
);

export default router;