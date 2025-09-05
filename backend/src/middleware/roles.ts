import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/lib/errors';
import type { AuthRequest } from '@/types/auth';
import logger from '@/lib/logger';

// Types de rôles supportés
export type UserRole = 'admin' | 'manager' | 'agent' | 'accountant' | 'readonly';
export type ClientRole = 'owner' | 'manager' | 'reader';

/**
 * Middleware pour vérifier que l'utilisateur a au moins un des rôles requis
 * @param allowedRoles - Liste des rôles autorisés pour accéder à cette route
 */
export function requireRoles(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Vérifier que l'utilisateur est authentifié
      if (!req.auth || !req.auth.userId) {
        throw new AppError('Authentication required', 401);
      }

      // Récupérer les rôles de l'utilisateur depuis le context auth
      const userRoles = req.auth.roles || [];

      // Vérifier si l'utilisateur a au moins un des rôles requis
      const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

      if (!hasRequiredRole) {
        logger.warn('Access denied - insufficient permissions', {
          userId: req.auth.userId,
          userRoles,
          requiredRoles: allowedRoles,
          path: req.path,
          method: req.method,
          ip: req.ip,
        });

        throw new AppError(
          `Access denied. Required roles: ${allowedRoles.join(' or ')}. Your roles: ${userRoles.join(', ') || 'none'}`,
          403
        );
      }

      // Log successful authorization pour audit
      logger.debug('Access granted', {
        userId: req.auth.userId,
        userRoles,
        requiredRoles: allowedRoles,
        path: req.path,
        method: req.method,
      });

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware pour vérifier que l'utilisateur est au moins manager
 */
export const requireManager = requireRoles(['admin', 'manager']);

/**
 * Middleware pour vérifier que l'utilisateur est admin
 */
export const requireAdmin = requireRoles(['admin']);

/**
 * Middleware pour vérifier que l'utilisateur peut lire les données
 */
export const requireReader = requireRoles(['admin', 'manager', 'agent', 'accountant', 'readonly']);

/**
 * Middleware pour vérifier que l'utilisateur peut écrire/modifier des données
 */
export const requireWriter = requireRoles(['admin', 'manager', 'agent']);

/**
 * Middleware pour vérifier les permissions sur les aspects financiers
 */
export const requireFinancial = requireRoles(['admin', 'manager', 'accountant']);

/**
 * Fonction utilitaire pour vérifier si un utilisateur a un rôle spécifique
 * @param userRoles - Rôles de l'utilisateur
 * @param requiredRole - Rôle requis
 */
export function hasRole(userRoles: string[], requiredRole: UserRole): boolean {
  return userRoles.includes(requiredRole);
}

/**
 * Fonction utilitaire pour vérifier si un utilisateur a au moins un des rôles
 * @param userRoles - Rôles de l'utilisateur
 * @param allowedRoles - Rôles autorisés
 */
export function hasAnyRole(userRoles: string[], allowedRoles: UserRole[]): boolean {
  return allowedRoles.some(role => userRoles.includes(role));
}

/**
 * Middleware pour vérifier les permissions d'organisation
 * L'utilisateur doit appartenir à la même organisation que celle demandée
 */
export function requireOrgAccess() {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.auth || !req.auth.userId) {
        throw new AppError('Authentication required', 401);
      }

      // Récupérer l'ID d'organisation depuis les paramètres de route
      const requestedOrgId = req.params.orgId || req.body.organizationId;
      const userOrgId = req.auth.organizationId;

      // Vérifier que l'utilisateur appartient à l'organisation demandée
      if (requestedOrgId && userOrgId !== requestedOrgId) {
        // Les admins système peuvent accéder à toutes les organisations
        const isSystemAdmin = req.auth.roles?.includes('admin') && !userOrgId;
        
        if (!isSystemAdmin) {
          logger.warn('Access denied - organization mismatch', {
            userId: req.auth.userId,
            userOrgId,
            requestedOrgId,
            path: req.path,
            method: req.method,
            ip: req.ip,
          });

          throw new AppError('Access denied. You can only access your own organization data', 403);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware pour vérifier que l'utilisateur peut accéder aux données d'un autre utilisateur
 * Soit c'est le même utilisateur, soit il a les permissions d'admin/manager
 */
export function requireUserAccess() {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.auth || !req.auth.userId) {
        throw new AppError('Authentication required', 401);
      }

      const requestedUserId = req.params.userId || req.params.id;
      const currentUserId = req.auth.userId;
      const userRoles = req.auth.roles || [];

      // L'utilisateur peut toujours accéder à ses propres données
      if (requestedUserId === currentUserId) {
        return next();
      }

      // Sinon, il faut être admin ou manager
      const canAccessOtherUsers = hasAnyRole(userRoles, ['admin', 'manager']);
      
      if (!canAccessOtherUsers) {
        logger.warn('Access denied - cannot access other user data', {
          userId: currentUserId,
          requestedUserId,
          userRoles,
          path: req.path,
          method: req.method,
          ip: req.ip,
        });

        throw new AppError('Access denied. You can only access your own user data', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}