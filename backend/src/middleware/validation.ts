import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '@/types/errors';
import logger from '@/lib/logger';

/**
 * Middleware de validation Zod générique
 */
export function validateRequest<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Valider le body de la requête
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('Request validation failed', {
          url: req.url,
          method: req.method,
          errors: validationErrors,
          requestId: res.locals.requestId,
        });

        throw new ValidationError(
          'Validation failed',
          validationErrors
        );
      }
      throw error;
    }
  };
}

/**
 * Middleware pour valider les paramètres d'URL
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.params = schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('URL params validation failed', {
          url: req.url,
          method: req.method,
          params: req.params,
          errors: validationErrors,
          requestId: res.locals.requestId,
        });

        throw new ValidationError(
          'URL parameters validation failed',
          validationErrors
        );
      }
      throw error;
    }
  };
}

/**
 * Middleware pour valider les query parameters
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('Query params validation failed', {
          url: req.url,
          method: req.method,
          query: req.query,
          errors: validationErrors,
          requestId: res.locals.requestId,
        });

        throw new ValidationError(
          'Query parameters validation failed',
          validationErrors
        );
      }
      throw error;
    }
  };
}

/**
 * Middleware pour valider la pagination
 */
export function validatePagination(req: Request, res: Response, next: NextFunction): void {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;

  // Limites raisonnables
  if (page < 1) {
    throw new ValidationError('Page must be greater than 0');
  }

  if (limit < 1 || limit > 100) {
    throw new ValidationError('Limit must be between 1 and 100');
  }

  // Ajouter à req.query pour utilisation dans les contrôleurs
  req.query.page = page.toString();
  req.query.limit = limit.toString();

  next();
}

/**
 * Middleware pour valider les UUIDs dans les paramètres
 */
export function validateUuid(...paramNames: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    for (const paramName of paramNames) {
      const value = req.params[paramName];
      if (value && !uuidRegex.test(value)) {
        throw new ValidationError(`Invalid UUID format for parameter: ${paramName}`);
      }
    }
    
    next();
  };
}

/**
 * Middleware pour nettoyer et normaliser les entrées
 */
export function sanitizeInput(req: Request, res: Response, next: NextFunction): void {
  // Fonction récursive pour nettoyer les objets
  const sanitizeObject = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (obj !== null && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  // Nettoyer body, query et params
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
}