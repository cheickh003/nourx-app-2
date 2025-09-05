import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { deliverableService } from '@/services/deliverable.service';
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
  CreateDeliverableSchema,
  ApproveDeliverableSchema,
} from '@nourx/shared';
import { RequestContext } from '@/types/api';
import { ValidationError } from '@/types/errors';
import { z } from 'zod';
import logger from '@/lib/logger';

const router = Router();

/**
 * Configuration Multer pour l'upload de fichiers
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Types MIME autorisés
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
      'application/zip',
      'application/json',
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
const DeliverableIdParamSchema = z.object({
  id: z.string().uuid('ID de livrable invalide'),
});

const DeliverableFiltersSchema = z.object({
  search: z.string().optional(),
  projectId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  status: z.enum(['pending', 'delivered', 'approved', 'revision_requested']).optional(),
  uploadedBy: z.string().uuid().optional(),
});

/**
 * GET /api/deliverables
 * Liste les livrables avec filtres et pagination
 */
router.get(
  '/',
  sanitizeInput,
  requireAuth,
  validatePagination,
  validateQuery(DeliverableFiltersSchema.partial()),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string);
      const limit = parseInt(req.query.limit as string);
      const filters = req.query as any;
      const context = createRequestContext(req, res);

      const result = await deliverableService.listDeliverables(
        filters,
        page,
        limit,
        context
      );

      res.status(200).json({
        success: true,
        data: result.deliverables,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/projects/:projectId/deliverables
 * Upload un nouveau livrable
 */
router.post(
  '/projects/:projectId',
  sanitizeInput,
  requireAuth,
  hasRole(['admin', 'manager']),
  upload.single('file'),
  validateParams(z.object({ projectId: z.string().uuid() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { projectId } = req.params;
      
      if (!req.file) {
        throw new ValidationError('Fichier requis');
      }

      // Valider les données du formulaire
      const deliverableData = {
        projectId,
        name: req.body.name,
        description: req.body.description,
        milestoneId: req.body.milestoneId,
      };

      const validated = CreateDeliverableSchema.parse(deliverableData);
      const context = createRequestContext(req, res);

      const deliverable = await deliverableService.createDeliverable(
        validated,
        {
          buffer: req.file.buffer,
          fileName: req.file.originalname,
          mimeType: req.file.mimetype,
        },
        context
      );

      logger.info('Livrable uploadé via API', {
        deliverableId: deliverable.id,
        projectId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        userId: context.user.id,
        requestId: context.requestId,
      });

      res.status(201).json({
        success: true,
        data: deliverable,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/deliverables/:id
 * Récupère un livrable par son ID
 */
router.get(
  '/:id',
  sanitizeInput,
  requireAuth,
  validateParams(DeliverableIdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const context = createRequestContext(req, res);

      const deliverable = await deliverableService.getDeliverableById(id, context);

      res.status(200).json({
        success: true,
        data: deliverable,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/deliverables/:id/download
 * Télécharge le fichier d'un livrable
 */
router.get(
  '/:id/download',
  sanitizeInput,
  requireAuth,
  validateParams(DeliverableIdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const context = createRequestContext(req, res);

      const fileData = await deliverableService.downloadDeliverable(id, context);

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
 * PATCH /api/deliverables/:id/deliver
 * Marque un livrable comme livré
 */
router.patch(
  '/:id/deliver',
  sanitizeInput,
  requireAuth,
  hasRole(['admin', 'manager']),
  validateParams(DeliverableIdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const context = createRequestContext(req, res);

      const deliverable = await deliverableService.markAsDelivered(id, context);

      logger.info('Livrable marqué comme livré via API', {
        deliverableId: deliverable.id,
        userId: context.user.id,
        requestId: context.requestId,
      });

      res.status(200).json({
        success: true,
        data: deliverable,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/deliverables/:id/approve
 * Approuve ou demande une révision d'un livrable
 */
router.patch(
  '/:id/approve',
  sanitizeInput,
  requireAuth,
  hasRole(['admin', 'manager']),
  validateParams(DeliverableIdParamSchema),
  validateRequest(ApproveDeliverableSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const context = createRequestContext(req, res);

      const deliverable = await deliverableService.approveDeliverable(id, req.body, context);

      const action = req.body.approved ? 'approuvé' : 'révision demandée';
      logger.info(`Livrable ${action} via API`, {
        deliverableId: deliverable.id,
        approved: req.body.approved,
        userId: context.user.id,
        requestId: context.requestId,
      });

      res.status(200).json({
        success: true,
        data: deliverable,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/deliverables/:id
 * Supprime un livrable
 */
router.delete(
  '/:id',
  sanitizeInput,
  requireAuth,
  hasRole(['admin', 'manager']),
  validateParams(DeliverableIdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const context = createRequestContext(req, res);

      await deliverableService.deleteDeliverable(id, context);

      logger.info('Livrable supprimé via API', {
        deliverableId: id,
        userId: context.user.id,
        requestId: context.requestId,
      });

      res.status(200).json({
        success: true,
        message: 'Livrable supprimé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/deliverables/:name/versions
 * Récupère l'historique des versions d'un livrable
 */
router.get(
  '/:name/versions',
  sanitizeInput,
  requireAuth,
  validateQuery(z.object({ projectId: z.string().uuid() })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.params;
      const { projectId } = req.query as any;
      const context = createRequestContext(req, res);

      const versions = await deliverableService.getDeliverableVersions(
        name,
        projectId,
        context
      );

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