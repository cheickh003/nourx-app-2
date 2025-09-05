import { createApp, setupGracefulShutdown } from './app';
import { config } from '@/config';
import { testDatabaseConnection } from '@/config/database';
import { bootstrapBetterAuthTables } from '@/config/auth-bootstrap';
import logger from '@/lib/logger';

async function startServer(): Promise<void> {
  try {
    logger.info('Starting Nourx API Server...');
    
    // Vérifier la configuration
    logger.info('Environment:', {
      NODE_ENV: config.NODE_ENV,
      PORT: config.PORT,
      HOST: config.HOST,
    });

    // Tester la connexion à la base de données
    logger.info('Testing database connection...');
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }
    
    logger.info('Database connection successful');

    // S'assurer que les tables Better Auth existent (dev bootstrap)
    try {
      await bootstrapBetterAuthTables();
    } catch (e) {
      logger.warn('Better Auth tables bootstrap failed (may already be migrated)', { error: (e as Error).message });
    }

    // Démarrer le worker d'email (désactivé pour compilation)
    const emailWorker = null;

    // Créer l'application Express
    const app = createApp();

    // Démarrer le serveur
    const server = app.listen(config.PORT, config.HOST, () => {
      logger.info(`🚀 Server running on http://${config.HOST}:${config.PORT}`);
      logger.info('Press CTRL+C to stop the server');
      
      // Afficher des informations utiles en développement
      if (config.NODE_ENV === 'development') {
        logger.info('Development endpoints:');
        logger.info(`  • Health check: http://${config.HOST}:${config.PORT}/health`);
        logger.info(`  • Ready check:  http://${config.HOST}:${config.PORT}/ready`);
        // logger.info(`  • API docs:     http://${config.HOST}:${config.PORT}/api/docs`);
      }
    });

    // Configuration du graceful shutdown
    setupGracefulShutdown(server, emailWorker);

    // Gestion des erreurs du serveur
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      const bind = typeof config.PORT === 'string' 
        ? `Pipe ${config.PORT}` 
        : `Port ${config.PORT}`;

      switch (error.code) {
        case 'EACCES':
          logger.error(`${bind} requires elevated privileges`);
          process.exit(1);
          break;
        case 'EADDRINUSE':
          logger.error(`${bind} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Démarrer le serveur si ce fichier est exécuté directement
if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Fatal error during startup:', error);
    process.exit(1);
  });
}

export { startServer };
