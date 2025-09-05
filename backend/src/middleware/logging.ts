import { Request, Response } from 'express';
import pinoHttp from 'pino-http';
import logger from '@/lib/logger';

export const loggingMiddleware = pinoHttp({
  logger,
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    } else if (res.statusCode >= 500 || err) {
      return 'error';
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return 'silent';
    }
    return 'info';
  },
  customSuccessMessage: function (req: Request, res: Response) {
    if (res.statusCode === 404) {
      return 'Resource not found';
    }
    return `${req.method} ${req.url}`;
  },
  customErrorMessage: function (req: Request, res: Response, err: Error) {
    return `${req.method} ${req.url} - ${err.message}`;
  },
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
    responseTime: 'responseTimeMs',
  },
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      query: req.query,
      params: req.params,
      headers: {
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
        'x-forwarded-for': req.headers['x-forwarded-for'],
      },
      remoteAddress: req.connection?.remoteAddress,
      remotePort: req.connection?.remotePort,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
      headers: {
        'content-type': res.getHeader('content-type'),
        'content-length': res.getHeader('content-length'),
      },
    }),
  },
  customProps: function (req: Request, res: Response) {
    return {
      requestId: res.locals.requestId,
      userContext: {
        userId: res.locals.user?.id,
        userEmail: res.locals.user?.email,
        userRole: res.locals.user?.role,
        organizationId: res.locals.user?.organizationId,
      },
    };
  },
});