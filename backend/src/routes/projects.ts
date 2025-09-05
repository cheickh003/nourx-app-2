import { Router, Request, Response, NextFunction } from 'express';
import { projectService } from '@/services/project.service';
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
  CreateProjectSchema,
  UpdateProjectSchema,
  ProjectFiltersSchema,
  IdParamSchema,
  ProjectStatusSchema,
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
const OrgIdParamSchema = z.object({
  orgId: z.string().uuid('ID d\'organisation invalide'),
});

const ProjectIdParamSchema = z.object({
  orgId: z.string().uuid('ID d\'organisation invalide'),
  id: z.string().uuid('ID de projet invalide'),
});

const StatusUpdateSchema = z.object({
  status: ProjectStatusSchema,
});

/**
 * GET /api/orgs/:orgId/projects
 * Récupère la liste des projets d'une organisation
 */
router.get(
  '/',
  sanitizeInput,
  requireAuth,
  validateParams(OrgIdParamSchema),
  validatePagination,
  validateQuery(ProjectFiltersSchema.partial()),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgId } = req.params;
      const page = parseInt(req.query.page as string);
      const limit = parseInt(req.query.limit as string);
      const filters = { ...req.query, organizationId: orgId } as any;
      const context = createRequestContext(req, res);

      const result = await projectService.listProjects(
        orgId,
        filters,
        page,
        limit,
        context
      );

      res.status(200).json({
        success: true,
        data: result.projects,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/orgs/:orgId/projects
 * Crée un nouveau projet
 */
router.post(
  '/',
  sanitizeInput,
  requireAuth,
  hasRole(['admin', 'manager']),
  validateParams(OrgIdParamSchema),
  validateRequest(CreateProjectSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgId } = req.params;
      const input = { ...req.body, organizationId: orgId };
      const context = createRequestContext(req, res);

      const project = await projectService.createProject(input, context);

      logger.info('Projet créé via API', {
        projectId: project.id,
        organizationId: orgId,
        userId: context.user.id,
        requestId: context.requestId,
      });

      res.status(201).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/orgs/:orgId/projects/:id
 * Récupère un projet par son ID
 */
router.get(
  '/:id',
  sanitizeInput,
  requireAuth,
  validateParams(ProjectIdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgId, id } = req.params;
      const context = createRequestContext(req, res);

      const project = await projectService.getProjectById(id, orgId, context);

      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/orgs/:orgId/projects/:id
 * Met à jour un projet
 */
router.put(
  '/:id',
  sanitizeInput,
  requireAuth,
  hasRole(['admin', 'manager']),
  validateParams(ProjectIdParamSchema),
  validateRequest(UpdateProjectSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgId, id } = req.params;
      const context = createRequestContext(req, res);

      const project = await projectService.updateProject(id, orgId, req.body, context);

      logger.info('Projet mis à jour via API', {
        projectId: project.id,
        organizationId: orgId,
        userId: context.user.id,
        requestId: context.requestId,
      });

      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/orgs/:orgId/projects/:id/status
 * Change le statut d'un projet
 */
router.patch(
  '/:id/status',
  sanitizeInput,
  requireAuth,
  hasRole(['admin', 'manager']),
  validateParams(ProjectIdParamSchema),
  validateRequest(StatusUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgId, id } = req.params;
      const { status } = req.body;
      const context = createRequestContext(req, res);

      const project = await projectService.updateProjectStatus(id, orgId, status, context);

      logger.info('Statut de projet changé via API', {
        projectId: project.id,
        organizationId: orgId,
        newStatus: status,
        userId: context.user.id,
        requestId: context.requestId,
      });

      res.status(200).json({
        success: true,
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/orgs/:orgId/projects/:id
 * Supprime un projet (soft delete)
 */
router.delete(
  '/:id',
  sanitizeInput,
  requireAuth,
  hasRole(['admin', 'manager']),
  validateParams(ProjectIdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgId, id } = req.params;
      const context = createRequestContext(req, res);

      await projectService.deleteProject(id, orgId, context);

      logger.info('Projet supprimé via API', {
        projectId: id,
        organizationId: orgId,
        userId: context.user.id,
        requestId: context.requestId,
      });

      res.status(200).json({
        success: true,
        message: 'Projet supprimé avec succès',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/orgs/:orgId/projects/:id/stats
 * Récupère les statistiques d'un projet
 */
router.get(
  '/:id/stats',
  sanitizeInput,
  requireAuth,
  validateParams(ProjectIdParamSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgId, id } = req.params;

      const stats = await projectService.getProjectStats(id, orgId);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;