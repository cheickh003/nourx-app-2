import { Router, Request, Response, NextFunction } from 'express';
import { organizationService } from '@/services/organization.service';
import { auditService } from '@/services/audit.service';
import { requireInternalRole, requireAuth, hasRole } from '@/middleware/auth';
import {
  validateRequest,
  validateParams,
  validateQuery,
  validatePagination,
  validateUuid,
  sanitizeInput,
} from '@/middleware/validation';
import {
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
  OrganizationFiltersSchema,
  IdParamSchema,
} from '@nourx/shared';
import { RequestContext } from '@/types/api';
import logger from '@/lib/logger';

const router: Router = Router();

/**
 * Helper pour créer le contexte de requête
 */
function createRequestContext(req: Request, res: Response): RequestContext {
  const base: Partial<RequestContext> = {
    requestId: res.locals.requestId,
  };
  if (req.ip) base.ipAddress = req.ip;
  const ua = req.get('User-Agent');
  if (ua) base.userAgent = ua;
  if (req.user) (base as any).user = req.user;
  return base as RequestContext;
}

/**
 * GET /api/orgs
 * Récupère la liste des organisations avec filtres et pagination
 */
router.get(
  '/',
  sanitizeInput,
  requireInternalRole,
  validatePagination,
  validateQuery(OrganizationFiltersSchema.partial()),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const filters = req.query as any; // Déjà validé par validateQuery

      const result = await organizationService.getOrganizations(filters, page, limit);

      res.json({
        success: true,
        data: result.organizations,
        pagination: {
          page,
          limit,
          total: result.total,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/orgs/stats
 * Récupère les statistiques des organisations
 */
router.get(
  '/stats',
  requireInternalRole,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await organizationService.getOrganizationStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/orgs/test
 * Crée une nouvelle organisation (endpoint de test sans auth)
 */
router.post(
  '/test',
  sanitizeInput,
  validateRequest(CreateOrganizationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Contexte de test temporaire
      const context = {
        user: { id: 'IIGe8H304VYq20FPHYkhb', email: 'admin@nourx.com' },
        requestId: res.locals.requestId || 'test-request',
        userAgent: req.get('User-Agent') || 'test',
        ip: req.ip || '127.0.0.1'
      };
      const organization = await organizationService.createOrganization(req.body, context);

      logger.info('Organization created via API', {
        organizationId: organization.id,
        createdBy: 'test-admin',
        requestId: context.requestId,
      });

      res.status(201).json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/orgs
 * Crée une nouvelle organisation
 */
router.post(
  '/',
  sanitizeInput,
  requireAuth,
  hasRole('admin', 'manager'),
  validateRequest(CreateOrganizationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = createRequestContext(req, res);
      const organization = await organizationService.createOrganization(req.body, context);

      logger.info('Organization created via API', {
        organizationId: organization.id,
        createdBy: req.user?.id,
        requestId: res.locals.requestId,
      });

      res.status(201).json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/orgs/:id
 * Récupère une organisation par ID
 */
router.get(
  '/:id',
  requireInternalRole,
  validateParams(IdParamSchema),
  validateUuid('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const organization = await organizationService.getOrganizationById(id);

      res.json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/orgs/test/:id
 * Met à jour une organisation (endpoint de test sans auth)
 */
router.put(
  '/test/:id',
  sanitizeInput,
  validateParams(IdParamSchema),
  validateUuid('id'),
  validateRequest(UpdateOrganizationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Contexte de test temporaire
      const context = {
        user: { id: 'IIGe8H304VYq20FPHYkhb', email: 'admin@nourx.com' },
        requestId: res.locals.requestId || 'test-request',
        userAgent: req.get('User-Agent') || 'test',
        ip: req.ip || '127.0.0.1'
      };
      const organization = await organizationService.updateOrganization(
        (req.params.id as string),
        req.body,
        context
      );

      logger.info('Organization updated via API', {
        organizationId: organization.id,
        updatedBy: 'test-admin',
        requestId: context.requestId,
      });

      res.json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/orgs/:id
 * Met à jour une organisation
 */
router.put(
  '/:id',
  sanitizeInput,
  requireAuth,
  hasRole('admin', 'manager'),
  validateParams(IdParamSchema),
  validateUuid('id'),
  validateRequest(UpdateOrganizationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = createRequestContext(req, res);
      const organization = await organizationService.updateOrganization(
        (req.params.id as string),
        req.body,
        context
      );

      logger.info('Organization updated via API', {
        organizationId: req.params.id,
        updatedBy: req.user?.id,
        requestId: res.locals.requestId,
      });

      res.json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/orgs/test/:id
 * Supprime une organisation (endpoint de test sans auth)
 */
router.delete(
  '/test/:id',
  validateParams(IdParamSchema),
  validateUuid('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Contexte de test temporaire
      const context = {
        user: { id: 'IIGe8H304VYq20FPHYkhb', email: 'admin@nourx.com' },
        requestId: res.locals.requestId || 'test-request',
        userAgent: req.get('User-Agent') || 'test',
        ip: req.ip || '127.0.0.1'
      };
      const id = req.params.id as string;
      await organizationService.deleteOrganization(id, context);

      logger.info('Organization deleted via API', {
        organizationId: req.params.id,
        deletedBy: 'test-admin',
        requestId: context.requestId,
      });

      res.json({
        success: true,
        data: { message: 'Organization deleted successfully' },
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/orgs/:id
 * Supprime une organisation (soft delete)
 */
router.delete(
  '/:id',
  requireAuth,
  hasRole('admin'),
  validateParams(IdParamSchema),
  validateUuid('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = createRequestContext(req, res);
      const id = req.params.id as string;
      await organizationService.deleteOrganization(id, context);

      logger.info('Organization deleted via API', {
        organizationId: req.params.id,
        deletedBy: req.user?.id,
        requestId: res.locals.requestId,
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/orgs/:id/restore
 * Restaure une organisation supprimée
 */
router.post(
  '/:id/restore',
  requireAuth,
  hasRole('admin'),
  validateParams(IdParamSchema),
  validateUuid('id'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = createRequestContext(req, res);
      const id = req.params.id as string;
      const organization = await organizationService.restoreOrganization(id, context);

      logger.info('Organization restored via API', {
        organizationId: req.params.id,
        restoredBy: req.user?.id,
        requestId: res.locals.requestId,
      });

      res.json({
        success: true,
        data: organization,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/orgs/:id/audit
 * Récupère l'historique des modifications d'une organisation
 */
router.get(
  '/:id/audit',
  requireInternalRole,
  validateParams(IdParamSchema),
  validateUuid('id'),
  validatePagination,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string);
      const limit = parseInt(req.query.limit as string);

      const id = req.params.id as string;
      const result = await auditService.getAuditLogs(
        {
          resourceType: 'organization',
          resourceId: id,
        },
        page,
        limit
      );

      res.json({
        success: true,
        data: result.logs,
        pagination: {
          page,
          limit,
          total: result.total,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
