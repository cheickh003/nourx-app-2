import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '@/types/errors';
import { ApiResponse } from '@/types/api';
import logger from './logger';

export function createErrorResponse(error: AppError): ApiResponse {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
    },
  };
}

export function handleZodError(zodError: ZodError): ApiResponse {
  const details = zodError.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input data',
      details,
    },
  };
}

export function globalErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log l'erreur
  logger.error({
    err,
    req: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
    },
    requestId: res.locals.requestId,
  }, 'Unhandled error');

  // Gérer les différents types d'erreurs
  if (err instanceof ZodError) {
    const response = handleZodError(err);
    res.status(400).json(response);
    return;
  }

  if (err instanceof AppError) {
    const response = createErrorResponse(err);
    res.status(err.statusCode).json(response);
    return;
  }

  // Erreur de validation Postgres
  if ('code' in err && typeof err.code === 'string') {
    switch (err.code) {
      case '23505': // unique_violation
        res.status(409).json({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Resource already exists',
            details: err.message,
          },
        });
        return;

      case '23503': // foreign_key_violation
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid reference to related resource',
            details: err.message,
          },
        });
        return;

      case '23502': // not_null_violation
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Required field is missing',
            details: err.message,
          },
        });
        return;
    }
  }

  // Erreur générique
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      details: isDevelopment ? {
        message: err.message,
        stack: err.stack,
      } : undefined,
    },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

export function asyncHandler<T extends Request, U extends Response>(
  fn: (req: T, res: U, next: NextFunction) => Promise<void>
) {
  return (req: T, res: U, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
