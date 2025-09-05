import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from '@/config';
import { toNodeHandler } from 'better-auth/node';
import { auth } from '@/config/auth';
import { requestIdMiddleware } from '@/middleware/requestId';
// import { loggingMiddleware } from '@/middleware/logging';
// import { generalRateLimit } from '@/middleware/rateLimiting';
import { globalErrorHandler, notFoundHandler } from '@/lib/errors';
import logger from '@/lib/logger';

// Import des routes
import organizationsRouter from '@/routes/organizations';
import userClientsRouter from '@/routes/userClients';
// import { authRoutes } from '@/routes/auth';

export function createApp(): express.Application {
  const app = express();

  // Trust proxy pour les headers de forwarding (nginx, load balancers, etc.)
  app.set('trust proxy', 1);

  // Désactiver l'header X-Powered-By pour la sécurité
  app.disable('x-powered-by');

  // Middlewares de sécurité - Helmet doit être en premier
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Permet les requêtes cross-origin
  }));

  // Configuration CORS
  app.use(cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin', 
      'X-Requested-With', 
      'Content-Type', 
      'Accept', 
      'Authorization', 
      'X-Request-ID'
    ],
    exposedHeaders: ['X-Request-ID'],
  }));

  // Middleware de Request ID (avant le logging)
  app.use(requestIdMiddleware);

  // Middleware de logging (désactivé pour compilation)
  // app.use(loggingMiddleware);

  // Monter le handler Better Auth avant tout body-parser (sinon le client peut rester en pending)
  app.all('/api/auth/*', toNodeHandler(auth));

  // Middleware de parsing JSON avec limite de taille (après Better Auth)
  app.use(express.json({ limit: '10mb', strict: true }));

  // Middleware de parsing URL-encoded (après Better Auth)
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting général (désactivé pour compilation)
  // app.use(generalRateLimit);

  // Routes de santé (avant l'authentification)
  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
      },
    });
  });

  app.get('/ready', async (_req, res) => {
    try {
      // TODO: Ajouter vérification de la base de données
      // await testDatabaseConnection();
      
      res.json({
        success: true,
        data: {
          status: 'ready',
          services: {
            database: 'healthy',
            // email: 'healthy',
          },
        },
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Service not ready',
          details: config.NODE_ENV === 'development' ? String(error) : undefined,
        },
      });
    }
  });

  // Routes API principales
  // app.use('/api/auth', authRoutes);
  // Mount selected API routes (incremental enablement)
  app.use('/api/orgs', organizationsRouter);
  app.use('/api/orgs/:orgId/users', userClientsRouter);

  // Route de base pour vérifier que le serveur fonctionne
  app.get('/', (_req, res) => {
    res.json({
      success: true,
      data: {
        message: 'Nourx API Server',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        documentation: '/api/docs', // TODO: Ajouter Swagger
      },
    });
  });

  // Handler 404 - doit être avant le handler d'erreur global
  app.use(notFoundHandler);

  // Handler d'erreur global - doit être en dernier
  app.use(globalErrorHandler);

  return app;
}

// Fonction pour graceful shutdown
export function setupGracefulShutdown(server: any, emailWorker: { stop: () => Promise<void> } | null = null): void {
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    // Arrêter d'accepter de nouvelles connexions
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        // Arrêter le worker d'email
        if (emailWorker) {
          logger.info('Stopping email worker...');
          await emailWorker.stop();
          logger.info('Email worker stopped');
        }

        // Fermer les connexions à la base de données
        // await closeDatabaseConnection();
        logger.info('Database connections closed');

        // Autres cleanups...
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error({ err: error, msg: 'Error during graceful shutdown' });
        process.exit(1);
      }
    });

    // Force shutdown après 30 secondes
    setTimeout(() => {
      logger.error({ msg: 'Could not close connections in time, forcefully shutting down' });
      process.exit(1);
    }, 30000);
  };

  // Écouter les signaux de shutdown
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  
  // Gérer les erreurs non capturées
  process.on('uncaughtException', (error) => {
    logger.fatal({ err: error, msg: 'Uncaught exception' });
    process.exit(1);
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.fatal({ reason, promise, msg: 'Unhandled rejection' });
    process.exit(1);
  });
}
