import { Request, Response, NextFunction } from 'express';
import { AuthenticationError, AuthorizationError } from '@/types/errors';
import { UserRole, AuthUser } from '@/types/auth';

// Extension de l'interface Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Middleware d'authentification de base (sera remplacé par Better Auth)
export function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  // TODO: Implémenter avec Better Auth
  // Pour l'instant, on simule un utilisateur authentifié en développement
  if (process.env.NODE_ENV === 'development') {
    req.user = {
      id: 'temp-admin-id',
      email: 'admin@nourx.com',
      name: 'Admin Dev',
      role: 'admin',
      isActive: true,
    };
    res.locals.user = req.user;
    return next();
  }

  throw new AuthenticationError();
}

// Middleware d'autorisation par rôle
export function hasRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError();
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthorizationError(
        `Access denied. Required roles: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
}

// Middleware pour vérifier que l'utilisateur appartient à l'organisation
export function belongsToOrganization(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    throw new AuthenticationError();
  }

  const orgId = req.params.orgId || req.params.organizationId;
  
  // Si c'est un admin interne, il peut accéder à toutes les organisations
  if (['admin', 'manager', 'agent', 'accountant', 'readonly'].includes(req.user.role)) {
    return next();
  }

  // Sinon, vérifier que l'utilisateur appartient à l'organisation
  if (!req.user.organizationId || req.user.organizationId !== orgId) {
    throw new AuthorizationError('Access denied to this organization');
  }

  next();
}

// Middleware pour vérifier que l'utilisateur est actif
export function isActive(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    throw new AuthenticationError();
  }

  if (!req.user.isActive) {
    throw new AuthorizationError('Account is deactivated');
  }

  next();
}

// Combinaison de middlewares fréquemment utilisée
export const requireAuth = [isAuthenticated, isActive];
export const requireAdminRole = [isAuthenticated, isActive, hasRole('admin')];
export const requireInternalRole = [
  isAuthenticated, 
  isActive, 
  hasRole('admin', 'manager', 'agent', 'accountant', 'readonly')
];
export const requireClientAccess = [isAuthenticated, isActive, belongsToOrganization];

// Middleware optionnel pour récupérer l'utilisateur sans forcer l'authentification
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    isAuthenticated(req, res, next);
  } catch {
    // Continuer sans utilisateur
    next();
  }
}
