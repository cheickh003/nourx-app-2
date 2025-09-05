import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { documentService } from '@/services/document.service';
import { requireAuth, hasRole } from '@/middleware/auth';
import {
  validateRequest,
  validateParams,
  validateQuery,
  validatePagination,
  validateUuid,
  sanitizeInput,
} from '@/middleware/validation';
import {
  CreateDocumentSchema,
  UpdateDocumentSchema,
  CreateDocumentVersionSchema,
  DocumentFiltersSchema,
} from '@nourx/shared';
import { RequestContext } from '@/types/api';
import { ValidationError } from '@/types/errors';
import { z } from 'zod';
import logger from '@/lib/logger';

const router = Router({ mergeParams: true }); // mergeParams pour accéder aux params de la route parent

/**
 * Configuration Multer pour l'upload de fichiers
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Types MIME autorisés pour les documents
    const allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/zip',
      'application/x-rar-compressed',
      'application/json',
      'application/xml',
      'text/xml',
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ValidationError(`Type de fichier non autorisé: ${file.mimetype}`));
    }
  },
});

/**
 * Helper pour créer le contexte de requête
 */
function createRequestContext(req: Request, res: Response): RequestContext {
  return {
    user: req.user,
    requestId: res.locals.requestId,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
  };
}

/**
 * Schemas pour les paramètres de route
 */
const OrgIdParamSchema = z.object({
  orgId: z.string().uuid('ID d\'organisation invalide'),
});

const DocumentIdParamSchema = z.object({
  orgId: z.string().uuid('ID d\'organisation invalide'),
  id: z.string().uuid('ID de document invalide'),
});

const ShareToggleSchema = z.object({
  isShared: z.boolean(),
});

const DownloadQuerySchema = z.object({
  version: z.number().min(1).optional(),
});

/**
 * GET /api/orgs/:orgId/docs
 * Liste les documents d'une organisation
 */
router.get(
  '/',
  sanitizeInput,
  requireAuth,
  validateParams(OrgIdParamSchema),
  validatePagination,
  validateQuery(DocumentFiltersSchema.partial()),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgId } = req.params;
      const page = parseInt(req.query.page as string);
      const limit = parseInt(req.query.limit as string);
      const filters = { ...req.query, organizationId: orgId } as any;
      const context = createRequestContext(req, res);

      const result = await documentService.listDocuments(
        orgId,
        filters,
        page,
        limit,
        context
      );

      res.status(200).json({
        success: true,
        data: result.documents,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/orgs/:orgId/docs
 * Upload un nouveau document
 */
router.post(
  '/',
  sanitizeInput,
  requireAuth,
  hasRole(['admin', 'manager']),
  validateParams(OrgIdParamSchema),
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgId } = req.params;
      
      if (!req.file) {
        throw new ValidationError('Fichier requis');
      }

      // Valider les données du formulaire
      const documentData = {
        organizationId: orgId,
        name: req.body.name,
        description: req.body.description,
        isSharedWithClient: req.body.isSharedWithClient === 'true',
      };

      const validated = CreateDocumentSchema.parse(documentData);
      const context = createRequestContext(req, res);

      const document = await documentService.createDocument(
        validated,
        {
          buffer: req.file.buffer,
          fileName: req.file.originalname,
          mimeType: req.file.mimetype,
        },
        context
      );

      logger.info('Document uploadé via API', {
        documentId: document.id,
        organizationId: orgId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        isShared: document.isSharedWithClient,
        userId: context.user.id,
        requestId: context.requestId,
      });

      res.status(201).json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/orgs/:orgId/docs/:id
 * Récupère un document par son ID
 */
router.get(
  '/:id',
  sanitizeInput,
  requireAuth,
  validateParams(DocumentIdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgId, id } = req.params;
      const context = createRequestContext(req, res);

      const document = await documentService.getDocumentById(id, orgId, context);

      res.status(200).json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/orgs/:orgId/docs/:id
 * Met à jour les métadonnées d'un document
 */
router.put(
  '/:id',
  sanitizeInput,
  requireAuth,
  hasRole(['admin', 'manager']),
  validateParams(DocumentIdParamSchema),
  validateRequest(UpdateDocumentSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgId, id } = req.params;
      const context = createRequestContext(req, res);

      const document = await documentService.updateDocument(id, orgId, req.body, context);

      logger.info('Document mis à jour via API', {
        documentId: document.id,
        organizationId: orgId,
        userId: context.user.id,
        requestId: context.requestId,
      });

      res.status(200).json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/orgs/:orgId/docs/:id/versions
 * Crée une nouvelle version d'un document
 */
router.post(
  '/:id/versions',
  sanitizeInput,
  requireAuth,
  hasRole(['admin', 'manager']),
  validateParams(DocumentIdParamSchema),
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgId, id } = req.params;
      
      if (!req.file) {
        throw new ValidationError('Fichier requis');
      }

      // Valider les données du formulaire
      const versionData = {
        name: req.body.name,
        description: req.body.description,
      };

      const validated = CreateDocumentVersionSchema.parse(versionData);
      const context = createRequestContext(req, res);

      const document = await documentService.createDocumentVersion(
        id,
        validated,
        {
          buffer: req.file.buffer,
          fileName: req.file.originalname,
          mimeType: req.file.mimetype,
        },
        context
      );

      logger.info('Nouvelle version de document créée via API', {
        documentId: document.id,
        originalDocumentId: id,
        organizationId: orgId,
        version: document.version,
        fileName: req.file.originalname,
        userId: context.user.id,
        requestId: context.requestId,
      });

      res.status(201).json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/orgs/:orgId/docs/:id/download
 * Télécharge le fichier d'un document
 */
router.get(
  '/:id/download',
  sanitizeInput,
  requireAuth,
  validateParams(DocumentIdParamSchema),
  validateQuery(DownloadQuerySchema.partial()),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgId, id } = req.params;
      const version = req.query.version ? parseInt(req.query.version as string) : undefined;
      const context = createRequestContext(req, res);

      const fileData = await documentService.downloadDocument(id, orgId, version, context);

      // Définir les en-têtes pour le téléchargement
      res.setHeader('Content-Type', fileData.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${fileData.fileName}"`);
      res.setHeader('Content-Length', fileData.buffer.length);

      res.send(fileData.buffer);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/orgs/:orgId/docs/:id/share
 * Change le statut de partage d'un document avec les clients
 */
router.patch(
  '/:id/share',
  sanitizeInput,
  requireAuth,
  hasRole(['admin', 'manager']),
  validateParams(DocumentIdParamSchema),
  validateRequest(ShareToggleSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgId, id } = req.params;
      const { isShared } = req.body;
      const context = createRequestContext(req, res);

      const document = await documentService.toggleDocumentSharing(id, orgId, isShared, context);

      logger.info(`Document ${isShared ? 'partagé' : 'retiré du partage'} via API`, {
        documentId: document.id,
        organizationId: orgId,
        isShared,
        userId: context.user.id,
        requestId: context.requestId,
      });

      res.status(200).json({
        success: true,
        data: document,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/orgs/:orgId/docs/:id
 * Supprime un document (soft delete)
 */
router.delete(
  '/:id',
  sanitizeInput,
  requireAuth,
  hasRole(['admin', 'manager']),
  validateParams(DocumentIdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgId, id } = req.params;
      const context = createRequestContext(req, res);

      await documentService.deleteDocument(id, orgId, context);

      logger.info('Document supprimé via API', {
        documentId: id,
        organizationId: orgId,
        userId: context.user.id,
        requestId: context.requestId,
      });

      res.status(200).json({
        success: true,
        message: 'Document supprimé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/orgs/:orgId/docs/:name/versions
 * Récupère l'historique des versions d'un document
 */
router.get(
  '/:name/versions',
  sanitizeInput,
  requireAuth,
  validateParams(z.object({
    orgId: z.string().uuid(),
    name: z.string().min(1),
  })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgId, name } = req.params;
      const context = createRequestContext(req, res);

      const versions = await documentService.getDocumentVersions(name, orgId, context);

      res.status(200).json({
        success: true,
        data: versions,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;