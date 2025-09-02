import express from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../../middleware/validateRequest.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { uploadMiddleware } from '../../middleware/uploadMiddleware.js';
import * as fileController from '../../controllers/fileController.js';

const router = express.Router();

/**
 * @route GET /api/files/documents
 * @desc Get documents (filtered by organization for clients)
 * @access Private
 */
router.get('/documents',
  requireAuth,
  [
    query('organization_id')
      .optional()
      .isUUID()
      .withMessage('Organization ID must be a valid UUID'),
    query('project_id')
      .optional()
      .isUUID()
      .withMessage('Project ID must be a valid UUID'),
    query('visible_to_client')
      .optional()
      .isBoolean()
      .withMessage('Visible to client must be a boolean'),
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
  fileController.getDocuments
);

/**
 * @route POST /api/files/documents
 * @desc Upload document
 * @access Private/Admin
 */
router.post('/documents',
  requireAuth,
  requireRole(['admin']),
  uploadMiddleware.single('file'),
  [
    body('organization_id')
      .isUUID()
      .withMessage('Organization ID must be a valid UUID'),
    body('project_id')
      .optional()
      .isUUID()
      .withMessage('Project ID must be a valid UUID'),
    body('name')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Document name must be less than 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters'),
    body('visible_to_client')
      .optional()
      .isBoolean()
      .withMessage('Visible to client must be a boolean')
  ],
  validateRequest,
  fileController.uploadDocument
);

/**
 * @route GET /api/files/documents/:id
 * @desc Get document by ID
 * @access Private
 */
router.get('/documents/:id',
  requireAuth,
  [
    param('id').isUUID().withMessage('Document ID must be a valid UUID')
  ],
  validateRequest,
  fileController.getDocumentById
);

/**
 * @route PATCH /api/files/documents/:id
 * @desc Update document metadata
 * @access Private/Admin
 */
router.patch('/documents/:id',
  requireAuth,
  requireRole(['admin']),
  [
    param('id').isUUID().withMessage('Document ID must be a valid UUID'),
    body('name')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Document name must be less than 255 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters'),
    body('visible_to_client')
      .optional()
      .isBoolean()
      .withMessage('Visible to client must be a boolean')
  ],
  validateRequest,
  fileController.updateDocument
);

/**
 * @route DELETE /api/files/documents/:id
 * @desc Delete document
 * @access Private/Admin
 */
router.delete('/documents/:id',
  requireAuth,
  requireRole(['admin']),
  [
    param('id').isUUID().withMessage('Document ID must be a valid UUID')
  ],
  validateRequest,
  fileController.deleteDocument
);

/**
 * @route GET /api/files/documents/:id/download
 * @desc Download document file
 * @access Private
 */
router.get('/documents/:id/download',
  requireAuth,
  [
    param('id').isUUID().withMessage('Document ID must be a valid UUID')
  ],
  validateRequest,
  fileController.downloadDocument
);

/**
 * @route POST /api/files/documents/:id/versions
 * @desc Upload new version of document
 * @access Private/Admin
 */
router.post('/documents/:id/versions',
  requireAuth,
  requireRole(['admin']),
  uploadMiddleware.single('file'),
  [
    param('id').isUUID().withMessage('Document ID must be a valid UUID'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 2000 })
      .withMessage('Description must be less than 2000 characters')
  ],
  validateRequest,
  fileController.uploadDocumentVersion
);

// Temporary file upload for attachments (tickets, etc.)
/**
 * @route POST /api/files/upload
 * @desc Upload temporary file
 * @access Private
 */
router.post('/upload',
  requireAuth,
  uploadMiddleware.single('file'),
  [
    body('type')
      .optional()
      .isIn(['attachment', 'avatar', 'temp'])
      .withMessage('Type must be attachment, avatar, or temp')
  ],
  validateRequest,
  fileController.uploadTempFile
);

/**
 * @route GET /api/files/:fileId/download
 * @desc Download any file by ID
 * @access Private
 */
router.get('/:fileId/download',
  requireAuth,
  [
    param('fileId').isUUID().withMessage('File ID must be a valid UUID')
  ],
  validateRequest,
  fileController.downloadFile
);

/**
 * @route DELETE /api/files/:fileId
 * @desc Delete temporary file
 * @access Private
 */
router.delete('/:fileId',
  requireAuth,
  [
    param('fileId').isUUID().withMessage('File ID must be a valid UUID')
  ],
  validateRequest,
  fileController.deleteTempFile
);

/**
 * @route GET /api/files/stats
 * @desc Get file storage statistics (admin only)
 * @access Private/Admin
 */
router.get('/stats',
  requireAuth,
  requireRole(['admin']),
  [
    query('organization_id')
      .optional()
      .isUUID()
      .withMessage('Organization ID must be a valid UUID')
  ],
  validateRequest,
  fileController.getFileStats
);

export default router;