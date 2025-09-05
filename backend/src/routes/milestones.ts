import { Router, Request, Response, NextFunction } from 'express';
import { milestoneService } from '@/services/milestone.service';
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
  CreateMilestoneSchema,
  UpdateMilestoneSchema,
  MilestoneFiltersSchema,
  IdParamSchema,
  MilestoneStatusSchema,
} from '@nourx/shared';
import { RequestContext } from '@/types/api';
import { z } from 'zod';
import logger from '@/lib/logger';

const router = Router({ mergeParams: true }); // mergeParams pour accéder aux params de la route parent

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
 * Schema pour les paramètres de route
 */
const ProjectIdParamSchema = z.object({
  id: z.string().uuid('ID de projet invalide'),
});

const MilestoneIdParamSchema = z.object({
  id: z.string().uuid('ID de projet invalide'),
  milestoneId: z.string().uuid('ID de jalon invalide'),
});

const StatusUpdateSchema = z.object({
  status: MilestoneStatusSchema,
});

const ReorderSchema = z.object({
  milestoneIds: z.array(z.string().uuid()).min(1, 'Au moins un jalon requis'),
});

/**
 * GET /api/projects/:id/milestones
 * Récupère la liste des jalons d'un projet
 */
router.get(
  '/',
  sanitizeInput,
  requireAuth,
  validateParams(ProjectIdParamSchema),
  validatePagination,
  validateQuery(MilestoneFiltersSchema.partial()),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: projectId } = req.params;
      const page = parseInt(req.query.page as string);
      const limit = parseInt(req.query.limit as string);
      const filters = { ...req.query, projectId } as any;
      const context = createRequestContext(req, res);

      const result = await milestoneService.listMilestones(
        projectId,
        filters,
        page,
        limit,
        context
      );

      res.status(200).json({
        success: true,
        data: result.milestones,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/projects/:id/milestones
 * Crée un nouveau jalon
 */
router.post(
  '/',
  sanitizeInput,
  requireAuth,
  hasRole(['admin', 'manager']),
  validateParams(ProjectIdParamSchema),
  validateRequest(CreateMilestoneSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: projectId } = req.params;
      const input = { ...req.body, projectId };
      const context = createRequestContext(req, res);

      const milestone = await milestoneService.createMilestone(input, context);

      logger.info('Jalon créé via API', {
        milestoneId: milestone.id,
        projectId,
        userId: context.user.id,
        requestId: context.requestId,
      });

      res.status(201).json({
        success: true,
        data: milestone,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/projects/:id/milestones/:milestoneId
 * Récupère un jalon par son ID
 */
router.get(
  '/:milestoneId',
  sanitizeInput,
  requireAuth,
  validateParams(MilestoneIdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: projectId, milestoneId } = req.params;
      const context = createRequestContext(req, res);

      const milestone = await milestoneService.getMilestoneById(milestoneId, projectId, context);

      res.status(200).json({
        success: true,
        data: milestone,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/projects/:id/milestones/:milestoneId
 * Met à jour un jalon
 */
router.put(
  '/:milestoneId',
  sanitizeInput,
  requireAuth,
  hasRole(['admin', 'manager']),
  validateParams(MilestoneIdParamSchema),
  validateRequest(UpdateMilestoneSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: projectId, milestoneId } = req.params;
      const context = createRequestContext(req, res);

      const milestone = await milestoneService.updateMilestone(
        milestoneId,
        projectId,
        req.body,
        context
      );

      logger.info('Jalon mis à jour via API', {
        milestoneId: milestone.id,
        projectId,
        userId: context.user.id,
        requestId: context.requestId,
      });

      res.status(200).json({
        success: true,
        data: milestone,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/projects/:id/milestones/:milestoneId/status
 * Change le statut d'un jalon
 */
router.patch(
  '/:milestoneId/status',
  sanitizeInput,
  requireAuth,
  hasRole(['admin', 'manager']),
  validateParams(MilestoneIdParamSchema),
  validateRequest(StatusUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: projectId, milestoneId } = req.params;
      const { status } = req.body;
      const context = createRequestContext(req, res);

      const milestone = await milestoneService.updateMilestoneStatus(
        milestoneId,
        projectId,
        status,
        context
      );

      logger.info('Statut de jalon changé via API', {
        milestoneId: milestone.id,
        projectId,
        newStatus: status,
        userId: context.user.id,
        requestId: context.requestId,
      });

      res.status(200).json({
        success: true,
        data: milestone,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/projects/:id/milestones/:milestoneId
 * Supprime un jalon
 */
router.delete(
  '/:milestoneId',
  sanitizeInput,
  requireAuth,
  hasRole(['admin', 'manager']),
  validateParams(MilestoneIdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: projectId, milestoneId } = req.params;
      const context = createRequestContext(req, res);

      await milestoneService.deleteMilestone(milestoneId, projectId, context);

      logger.info('Jalon supprimé via API', {
        milestoneId,
        projectId,
        userId: context.user.id,
        requestId: context.requestId,
      });

      res.status(200).json({
        success: true,
        message: 'Jalon supprimé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/projects/:id/milestones/reorder
 * Réordonne les jalons d'un projet
 */
router.post(
  '/reorder',
  sanitizeInput,
  requireAuth,
  hasRole(['admin', 'manager']),
  validateParams(ProjectIdParamSchema),
  validateRequest(ReorderSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: projectId } = req.params;
      const { milestoneIds } = req.body;
      const context = createRequestContext(req, res);

      await milestoneService.reorderMilestones(projectId, milestoneIds, context);

      logger.info('Jalons réordonnés via API', {
        projectId,
        milestoneIds,
        userId: context.user.id,
        requestId: context.requestId,
      });

      res.status(200).json({
        success: true,
        message: 'Jalons réordonnés avec succès',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;