import { Router, Request, Response, NextFunction } from 'express';
import { userClientService } from '@/services/userClient.service';
import { organizationService } from '@/services/organization.service';
import { auditService } from '@/services/audit.service';
import { requireInternalRole, requireAuth, hasRole, belongsToOrganization } from '@/middleware/auth';
import {
  validateRequest,
  validateParams,
  validateQuery,
  validatePagination,
  validateUuid,
  sanitizeInput,
} from '@/middleware/validation';
import {
  CreateUserClientSchema,
  UpdateUserClientSchema,
  DeactivateUserSchema,
  UnlockUserSchema,
  UserClientFiltersSchema,
  IdParamSchema,
} from '@nourx/shared';
import { RequestContext } from '@/types/api';
import logger from '@/lib/logger';

const router: Router = Router({ mergeParams: true }); // mergeParams pour accéder à :orgId

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
 * Middleware pour valider que l'organisation existe
 */
async function validateOrganizationExists(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orgId = req.params.orgId as string;
    const exists = await organizationService.organizationExists(orgId);
    if (!exists) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ORGANIZATION_NOT_FOUND',
          message: 'Organization not found',
        },
      });
      return;
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/orgs/:orgId/users/stats
 * Récupère les statistiques des utilisateurs d'une organisation
 */
router.get(
  '/stats',
  requireInternalRole,
  validateUuid('orgId'),
  validateOrganizationExists,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.params.orgId as string;
      const stats = await userClientService.getUserClientStats(organizationId);

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
 * GET /api/orgs/:orgId/users
 * Récupère la liste des utilisateurs clients d'une organisation avec filtres et pagination
 */
router.get(
  '/',
  sanitizeInput,
  requireInternalRole,
  validateUuid('orgId'),
  validateOrganizationExists,
  validatePagination,
  validateQuery(UserClientFiltersSchema.partial()),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.params.orgId;
      const page = parseInt(req.query.page as string);
      const limit = parseInt(req.query.limit as string);
      
      // Forcer le filtre par organizationId pour la sécurité multi-tenant
      const filters = { ...req.query, organizationId } as any;

      const result = await userClientService.getUserClients(filters, page, limit);

      res.json({
        success: true,
        data: result.users,
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
 * POST /api/orgs/:orgId/users
 * Crée un nouvel utilisateur client dans l'organisation
 */
router.post(
  '/',
  sanitizeInput,
  requireAuth,
  hasRole('admin', 'manager'),
  validateUuid('orgId'),
  validateOrganizationExists,
  validateRequest((CreateUserClientSchema as any).omit({ organizationId: true })),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.params.orgId as string;
      const context = createRequestContext(req, res);

      // Ajouter l'organizationId au body
      const input = { ...(req.body as any), organizationId } as import('@nourx/shared').CreateUserClientInput;

      const user = await userClientService.createUserClient(input, context);

      logger.info('User client created via API', {
        userId: user.id,
        organizationId,
        createdBy: req.user?.id,
        requestId: res.locals.requestId,
      });

      res.status(201).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/orgs/:orgId/users/:id
 * Récupère un utilisateur client par ID
 */
router.get(
  '/:id',
  requireInternalRole,
  validateUuid('orgId', 'id'),
  validateOrganizationExists,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.params.orgId as string;
      const userId = req.params.id as string;

      const user = await userClientService.getUserClientById(userId, organizationId);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PUT /api/orgs/:orgId/users/:id
 * Met à jour un utilisateur client
 */
router.put(
  '/:id',
  sanitizeInput,
  requireAuth,
  hasRole('admin', 'manager'),
  validateUuid('orgId', 'id'),
  validateOrganizationExists,
  validateRequest(UpdateUserClientSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.params.orgId as string;
      const userId = req.params.id as string;
      const context = createRequestContext(req, res);

      const user = await userClientService.updateUserClient(userId, req.body, context, organizationId);

      logger.info('User client updated via API', {
        userId,
        organizationId,
        updatedBy: req.user?.id,
        requestId: res.locals.requestId,
      });

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * DELETE /api/orgs/:orgId/users/:id
 * Supprime un utilisateur client (soft delete)
 */
router.delete(
  '/:id',
  requireAuth,
  hasRole('admin', 'manager'),
  validateUuid('orgId', 'id'),
  validateOrganizationExists,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.params.orgId as string;
      const userId = req.params.id as string;
      const context = createRequestContext(req, res);

      await userClientService.deleteUserClient(userId, context, organizationId);

      logger.info('User client deleted via API', {
        userId,
        organizationId,
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
 * POST /api/orgs/:orgId/users/:id/deactivate
 * Désactive un utilisateur client
 */
router.post(
  '/:id/deactivate',
  sanitizeInput,
  requireAuth,
  hasRole('admin', 'manager'),
  validateUuid('orgId', 'id'),
  validateOrganizationExists,
  validateRequest(DeactivateUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.params.orgId as string;
      const userId = req.params.id as string;
      const context = createRequestContext(req, res);

      await userClientService.deactivateUserClient(userId, req.body, context, organizationId);

      logger.info('User client deactivated via API', {
        userId,
        organizationId,
        deactivatedBy: req.user?.id,
        reason: req.body.reason,
        requestId: res.locals.requestId,
      });

      res.json({
        success: true,
        message: 'User deactivated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/orgs/:orgId/users/:id/activate
 * Active un utilisateur client
 */
router.post(
  '/:id/activate',
  requireAuth,
  hasRole('admin', 'manager'),
  validateUuid('orgId', 'id'),
  validateOrganizationExists,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.params.orgId as string;
      const userId = req.params.id as string;
      const context = createRequestContext(req, res);

      await userClientService.activateUserClient(userId, context, organizationId);

      logger.info('User client activated via API', {
        userId,
        organizationId,
        activatedBy: req.user?.id,
        requestId: res.locals.requestId,
      });

      res.json({
        success: true,
        message: 'User activated successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/orgs/:orgId/users/:id/unlock
 * Débloque un utilisateur client
 */
router.post(
  '/:id/unlock',
  sanitizeInput,
  requireAuth,
  hasRole('admin', 'manager'),
  validateUuid('orgId', 'id'),
  validateOrganizationExists,
  validateRequest(UnlockUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.params.orgId;
      const userId = req.params.id as string;
      const context = createRequestContext(req, res);

      await userClientService.unlockUserClient(userId, req.body, context, organizationId);

      logger.info('User client unlocked via API', {
        userId,
        organizationId,
        unlockedBy: req.user?.id,
        reason: req.body.reason,
        requestId: res.locals.requestId,
      });

      res.json({
        success: true,
        message: 'User unlocked successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/orgs/:orgId/users/:id/resend-invitation
 * Renvoie l'invitation à un utilisateur client
 */
router.post(
  '/:id/resend-invitation',
  requireAuth,
  hasRole('admin', 'manager'),
  validateUuid('orgId', 'id'),
  validateOrganizationExists,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.params.orgId as string;
      const userId = req.params.id as string;
      const context = createRequestContext(req, res);

      await userClientService.resendInvitation(userId, context, organizationId);

      logger.info('User client invitation resent via API', {
        userId,
        organizationId,
        resentBy: req.user?.id,
        requestId: res.locals.requestId,
      });

      res.json({
        success: true,
        message: 'Invitation sent successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/orgs/:orgId/users/:id/reset-password
 * Réinitialise le mot de passe d'un utilisateur client
 */
router.post(
  '/:id/reset-password',
  requireAuth,
  hasRole('admin', 'manager'),
  validateUuid('orgId', 'id'),
  validateOrganizationExists,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const organizationId = req.params.orgId as string;
      const userId = req.params.id as string;
      const context = createRequestContext(req, res);

      await userClientService.resetPassword(userId, context, organizationId);

      logger.info('User client password reset via API', {
        userId,
        organizationId,
        resetBy: req.user?.id,
        requestId: res.locals.requestId,
      });

      res.json({
        success: true,
        message: 'Password reset email sent successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/orgs/:orgId/users/:id/audit
 * Récupère l'historique des modifications d'un utilisateur
 */
router.get(
  '/:id/audit',
  requireInternalRole,
  validateUuid('orgId', 'id'),
  validateOrganizationExists,
  validatePagination,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params.id;
      const page = parseInt(req.query.page as string);
      const limit = parseInt(req.query.limit as string);

      const id = userId as string;
      const result = await auditService.getAuditLogs(
        { resourceType: 'user_client', resourceId: id },
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
