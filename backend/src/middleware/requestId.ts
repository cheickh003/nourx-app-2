import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  
  // Stocker l'ID dans res.locals pour le récupérer dans d'autres middlewares
  res.locals.requestId = requestId;
  
  // Ajouter l'ID aux headers de réponse
  res.setHeader('X-Request-ID', requestId);
  
  next();
}