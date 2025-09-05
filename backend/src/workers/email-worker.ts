import { config as loadEnv } from 'dotenv';
import { emailService } from '@/services/email.service';
import logger from '@/lib/logger';

// Charger les variables d'environnement
loadEnv();

export class EmailWorker {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private processInterval: number;
  private batchSize: number;
  private maxRetries: number;
  private cleanupInterval: number;

  constructor(options: {
    processInterval?: number; // Intervalle en ms entre les traitements
    batchSize?: number; // Nombre d'emails à traiter par lot
    maxRetries?: number; // Nombre maximum de tentatives
    cleanupInterval?: number; // Intervalle de nettoyage en ms
  } = {}) {
    this.processInterval = options.processInterval || 30 * 1000; // 30 secondes
    this.batchSize = options.batchSize || 10;
    this.maxRetries = options.maxRetries || 3;
    this.cleanupInterval = options.cleanupInterval || 24 * 60 * 60 * 1000; // 24 heures
  }

  /**
   * Démarre le worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Email worker is already running');
      return;
    }

    // Tester la connexion email avant de démarrer
    const connectionOk = await emailService.testConnection();
    if (!connectionOk) {
      logger.error('Cannot start email worker: SMTP connection failed');
      throw new Error('SMTP connection failed');
    }

    this.isRunning = true;
    logger.info('Starting email worker', {
      processInterval: this.processInterval,
      batchSize: this.batchSize,
      maxRetries: this.maxRetries,
    });

    // Traitement initial
    await this.processEmails();

    // Démarrer l'intervalle de traitement
    this.intervalId = setInterval(async () => {
      try {
        await this.processEmails();
      } catch (error) {
        logger.error('Error in email worker interval', { error });
      }
    }, this.processInterval);

    // Démarrer le nettoyage périodique
    setInterval(async () => {
      try {
        await this.cleanupOldEmails();
      } catch (error) {
        logger.error('Error in cleanup interval', { error });
      }
    }, this.cleanupInterval);

    // Gérer l'arrêt propre
    this.setupGracefulShutdown();
  }

  /**
   * Arrête le worker
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping email worker...');
    this.isRunning = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    logger.info('Email worker stopped');
  }

  /**
   * Traite les emails en attente
   */
  private async processEmails(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      // Traiter les nouveaux emails
      const pendingEmails = await emailService.getPendingEmails(this.batchSize);
      
      if (pendingEmails.length > 0) {
        logger.debug('Processing pending emails', { count: pendingEmails.length });

        for (const email of pendingEmails) {
          if (!this.isRunning) break;

          const success = await emailService.processQueuedEmail(email.id);
          
          if (success) {
            logger.debug('Email processed successfully', { emailId: email.id });
          } else {
            logger.debug('Email processing failed', { 
              emailId: email.id, 
              attempts: email.attempts + 1 
            });
          }
        }
      }

      // Traiter les emails échoués qui peuvent être retentés
      const retryableEmails = await emailService.getRetryableEmails(this.maxRetries, this.batchSize);
      
      if (retryableEmails.length > 0) {
        logger.debug('Retrying failed emails', { count: retryableEmails.length });

        for (const email of retryableEmails) {
          if (!this.isRunning) break;

          const success = await emailService.processQueuedEmail(email.id);
          
          if (success) {
            logger.info('Email retry successful', { 
              emailId: email.id, 
              attempts: email.attempts + 1 
            });
          } else {
            logger.warn('Email retry failed', { 
              emailId: email.id, 
              attempts: email.attempts + 1 
            });
          }
        }
      }

      // Log des statistiques si des emails ont été traités
      if (pendingEmails.length > 0 || retryableEmails.length > 0) {
        const stats = await emailService.getEmailStats(new Date(Date.now() - 24 * 60 * 60 * 1000));
        logger.info('Email processing stats', stats);
      }

    } catch (error) {
      logger.error('Error processing emails', { error });
    }
  }

  /**
   * Nettoie les anciens emails
   */
  private async cleanupOldEmails(): Promise<void> {
    try {
      const deletedCount = await emailService.cleanupOldEmails(30); // 30 jours

      if (deletedCount > 0) {
        logger.info('Email cleanup completed', { deletedCount });
      }
    } catch (error) {
      logger.error('Error during email cleanup', { error });
    }
  }

  /**
   * Configure l'arrêt propre
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down email worker gracefully...`);
      await this.stop();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.fatal('Uncaught exception in email worker', { error });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.fatal('Unhandled rejection in email worker', { reason, promise });
      process.exit(1);
    });
  }

  /**
   * Statistiques du worker
   */
  async getStats(): Promise<{
    isRunning: boolean;
    processInterval: number;
    batchSize: number;
    maxRetries: number;
    emailStats: Awaited<ReturnType<typeof emailService.getEmailStats>>;
  }> {
    const emailStats = await emailService.getEmailStats();

    return {
      isRunning: this.isRunning,
      processInterval: this.processInterval,
      batchSize: this.batchSize,
      maxRetries: this.maxRetries,
      emailStats,
    };
  }
}

/**
 * Fonction pour démarrer le worker en standalone
 */
async function startEmailWorker(): Promise<void> {
  const worker = new EmailWorker({
    processInterval: parseInt(process.env.EMAIL_WORKER_INTERVAL || '30000'),
    batchSize: parseInt(process.env.EMAIL_WORKER_BATCH_SIZE || '10'),
    maxRetries: parseInt(process.env.EMAIL_WORKER_MAX_RETRIES || '3'),
  });

  try {
    await worker.start();
    logger.info('Email worker started successfully');
  } catch (error) {
    logger.error('Failed to start email worker', { error });
    process.exit(1);
  }
}

// Démarrer le worker si ce fichier est exécuté directement
if (require.main === module) {
  startEmailWorker().catch((error) => {
    logger.error('Fatal error in email worker', { error });
    process.exit(1);
  });
}

export { startEmailWorker };
export default EmailWorker;