import express from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../../middleware/validateRequest.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import * as accountController from '../../controllers/accountController.js';

const router = express.Router();

// Organizations routes
/**
 * @route GET /api/accounts/organizations
 * @desc Get all organizations (admin only)
 * @access Private/Admin
 */
router.get('/organizations',
  requireAuth,
  requireRole(['admin']),
  accountController.getOrganizations
);

/**
 * @route POST /api/accounts/organizations
 * @desc Create new organization
 * @access Private/Admin
 */
router.post('/organizations',
  requireAuth,
  requireRole(['admin']),
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('Organization name must be between 2 and 255 characters'),
    body('rc_or_rccm')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('RC/RCCM must be less than 50 characters'),
    body('address')
      .optional()
      .trim(),
    body('billing_email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Billing email must be valid')
  ],
  validateRequest,
  accountController.createOrganization
);

/**
 * @route GET /api/accounts/organizations/:id
 * @desc Get organization by ID
 * @access Private/Admin
 */
router.get('/organizations/:id',
  requireAuth,
  requireRole(['admin']),
  [
    param('id').isUUID().withMessage('Organization ID must be a valid UUID')
  ],
  validateRequest,
  accountController.getOrganizationById
);

/**
 * @route PATCH /api/accounts/organizations/:id
 * @desc Update organization
 * @access Private/Admin
 */
router.patch('/organizations/:id',
  requireAuth,
  requireRole(['admin']),
  [
    param('id').isUUID().withMessage('Organization ID must be a valid UUID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 255 })
      .withMessage('Organization name must be between 2 and 255 characters'),
    body('rc_or_rccm')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('RC/RCCM must be less than 50 characters'),
    body('address')
      .optional()
      .trim(),
    body('billing_email')
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage('Billing email must be valid')
  ],
  validateRequest,
  accountController.updateOrganization
);

// Client users routes
/**
 * @route GET /api/accounts/organizations/:orgId/users
 * @desc Get organization users
 * @access Private/Admin or Organization Owner/Manager
 */
router.get('/organizations/:orgId/users',
  requireAuth,
  [
    param('orgId').isUUID().withMessage('Organization ID must be a valid UUID')
  ],
  validateRequest,
  accountController.getOrganizationUsers
);

/**
 * @route POST /api/accounts/organizations/:orgId/users
 * @desc Create client user and send invitation
 * @access Private/Admin or Organization Owner
 */
router.post('/organizations/:orgId/users',
  requireAuth,
  [
    param('orgId').isUUID().withMessage('Organization ID must be a valid UUID'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('role')
      .isIn(['owner', 'manager', 'reader'])
      .withMessage('Role must be owner, manager, or reader')
  ],
  validateRequest,
  accountController.createClientUser
);

/**
 * @route PATCH /api/accounts/organizations/:orgId/users/:userId/activate
 * @desc Activate client user
 * @access Private/Admin
 */
router.patch('/organizations/:orgId/users/:userId/activate',
  requireAuth,
  requireRole(['admin']),
  [
    param('orgId').isUUID().withMessage('Organization ID must be a valid UUID'),
    param('userId').isUUID().withMessage('User ID must be a valid UUID')
  ],
  validateRequest,
  accountController.activateClientUser
);

/**
 * @route PATCH /api/accounts/organizations/:orgId/users/:userId/deactivate
 * @desc Deactivate client user
 * @access Private/Admin
 */
router.patch('/organizations/:orgId/users/:userId/deactivate',
  requireAuth,
  requireRole(['admin']),
  [
    param('orgId').isUUID().withMessage('Organization ID must be a valid UUID'),
    param('userId').isUUID().withMessage('User ID must be a valid UUID'),
    body('reason')
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Deactivation reason must be between 5 and 500 characters')
  ],
  validateRequest,
  accountController.deactivateClientUser
);

/**
 * @route DELETE /api/accounts/organizations/:orgId/users/:userId
 * @desc Soft delete client user
 * @access Private/Admin
 */
router.delete('/organizations/:orgId/users/:userId',
  requireAuth,
  requireRole(['admin']),
  [
    param('orgId').isUUID().withMessage('Organization ID must be a valid UUID'),
    param('userId').isUUID().withMessage('User ID must be a valid UUID'),
    body('reason')
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Deletion reason must be between 5 and 500 characters')
  ],
  validateRequest,
  accountController.deleteClientUser
);

/**
 * @route POST /api/accounts/organizations/:orgId/users/:userId/reset-password
 * @desc Send password reset email for client user
 * @access Private/Admin or Organization Owner
 */
router.post('/organizations/:orgId/users/:userId/reset-password',
  requireAuth,
  [
    param('orgId').isUUID().withMessage('Organization ID must be a valid UUID'),
    param('userId').isUUID().withMessage('User ID must be a valid UUID')
  ],
  validateRequest,
  accountController.resetClientUserPassword
);

/**
 * @route PATCH /api/accounts/organizations/:orgId/users/:userId/role
 * @desc Update client user role
 * @access Private/Admin or Organization Owner
 */
router.patch('/organizations/:orgId/users/:userId/role',
  requireAuth,
  [
    param('orgId').isUUID().withMessage('Organization ID must be a valid UUID'),
    param('userId').isUUID().withMessage('User ID must be a valid UUID'),
    body('role')
      .isIn(['owner', 'manager', 'reader'])
      .withMessage('Role must be owner, manager, or reader')
  ],
  validateRequest,
  accountController.updateClientUserRole
);

export default router;