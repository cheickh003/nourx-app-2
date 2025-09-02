import EmailService from './emailService.js';
import EmailTemplateService from './emailTemplateService.js';
import pkg from 'pg';
const { Pool } = pkg;
import winston from 'winston';
import { EventEmitter } from 'events';

// Worker configuration
const WORKER_CONFIG = {
  BATCH_SIZE: 10,
  POLL_INTERVAL: 5000, // 5 seconds
  MAX_CONCURRENT_JOBS: 5,
  HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
  CLEANUP_INTERVAL: 3600000, // 1 hour
  MAX_FAILED_EMAIL_AGE: 7 * 24 * 60 * 60 * 1000, // 7 days
  WORKER_TIMEOUT: 300000 // 5 minutes
};

class EmailWorker extends EventEmitter {
  constructor(pool, logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logs/email-worker.log' })
    ]
  })) {
    super();
    
    this.pool = pool;
    this.logger = logger;
    this.emailService = new EmailService(pool, logger);
    this.templateService = new EmailTemplateService(pool, logger);
    
    // Worker state
    this.isRunning = false;
    this.isPaused = false;
    this.activeJobs = new Set();
    this.stats = {
      processed: 0,
      failed: 0,
      startTime: null,
      lastProcessedAt: null,
      errors: []
    };

    // Timers
    this.pollTimer = null;
    this.healthTimer = null;
    this.cleanupTimer = null;
    
    // Bind methods
    this.handleError = this.handleError.bind(this);
    this.handleShutdown = this.handleShutdown.bind(this);
    
    // Setup error handling
    process.on('SIGTERM', this.handleShutdown);
    process.on('SIGINT', this.handleShutdown);
    process.on('uncaughtException', this.handleError);
    process.on('unhandledRejection', this.handleError);
  }

  /**
   * Start the email worker
   */
  async start() {
    if (this.isRunning) {
      this.logger.warn('Email worker is already running');
      return;
    }

    try {
      this.logger.info('Starting email worker...');
      
      // Initialize email templates
      await this.templateService.initializeDefaultTemplates();
      
      // Initialize email service
      await this.emailService.initializeTransporter();
      
      this.isRunning = true;
      this.isPaused = false;
      this.stats.startTime = new Date();
      
      // Start processing loops
      this.startPolling();
      this.startHealthCheck();
      this.startCleanup();
      
      this.emit('started');
      this.logger.info('Email worker started successfully', {
        batchSize: WORKER_CONFIG.BATCH_SIZE,
        pollInterval: WORKER_CONFIG.POLL_INTERVAL,
        maxConcurrent: WORKER_CONFIG.MAX_CONCURRENT_JOBS
      });
      
    } catch (error) {
      this.logger.error('Failed to start email worker:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Stop the email worker
   */
  async stop() {
    if (!this.isRunning) {
      this.logger.warn('Email worker is not running');
      return;
    }

    this.logger.info('Stopping email worker...');
    this.isRunning = false;

    // Clear timers
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.healthTimer) clearInterval(this.healthTimer);
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);

    // Wait for active jobs to complete
    if (this.activeJobs.size > 0) {
      this.logger.info(`Waiting for ${this.activeJobs.size} active jobs to complete...`);
      
      const timeout = setTimeout(() => {
        this.logger.warn('Force stopping worker - some jobs may be incomplete');
        this.activeJobs.clear();
      }, WORKER_CONFIG.WORKER_TIMEOUT);

      while (this.activeJobs.size > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      clearTimeout(timeout);
    }

    this.emit('stopped');
    this.logger.info('Email worker stopped');
  }

  /**
   * Pause the worker
   */
  pause() {
    if (!this.isRunning) {
      this.logger.warn('Cannot pause - worker is not running');
      return;
    }

    this.isPaused = true;
    this.logger.info('Email worker paused');
    this.emit('paused');
  }

  /**
   * Resume the worker
   */
  resume() {
    if (!this.isRunning) {
      this.logger.warn('Cannot resume - worker is not running');
      return;
    }

    this.isPaused = false;
    this.logger.info('Email worker resumed');
    this.emit('resumed');
  }

  /**
   * Start polling for emails to process
   */
  startPolling() {
    this.pollTimer = setInterval(async () => {
      if (!this.isRunning || this.isPaused) return;
      
      if (this.activeJobs.size >= WORKER_CONFIG.MAX_CONCURRENT_JOBS) {
        this.logger.debug('Max concurrent jobs reached, skipping poll');
        return;
      }

      try {
        await this.processEmailBatch();
      } catch (error) {
        this.logger.error('Error in polling loop:', error);
        this.recordError(error);
      }
    }, WORKER_CONFIG.POLL_INTERVAL);
  }

  /**
   * Start health check monitoring
   */
  startHealthCheck() {
    this.healthTimer = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        await this.performHealthCheck();
      } catch (error) {
        this.logger.error('Health check failed:', error);
        this.recordError(error);
        this.emit('health-check-failed', error);
      }
    }, WORKER_CONFIG.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Start cleanup process
   */
  startCleanup() {
    this.cleanupTimer = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        await this.performCleanup();
      } catch (error) {
        this.logger.error('Cleanup failed:', error);
        this.recordError(error);
      }
    }, WORKER_CONFIG.CLEANUP_INTERVAL);
  }

  /**
   * Process a batch of emails
   */
  async processEmailBatch() {
    const jobId = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.activeJobs.add(jobId);

    try {
      const result = await this.emailService.processEmailQueue(WORKER_CONFIG.BATCH_SIZE);
      
      if (result.processed > 0 || result.failed > 0) {
        this.stats.processed += result.processed;
        this.stats.failed += result.failed;
        this.stats.lastProcessedAt = new Date();

        this.logger.info('Email batch processed', {
          jobId,
          processed: result.processed,
          failed: result.failed,
          totalProcessed: this.stats.processed,
          totalFailed: this.stats.failed
        });

        this.emit('batch-processed', {
          jobId,
          processed: result.processed,
          failed: result.failed
        });
      }

    } catch (error) {
      this.logger.error('Failed to process email batch:', error);
      this.recordError(error);
      this.emit('batch-error', { jobId, error });
    } finally {
      this.activeJobs.delete(jobId);
    }
  }

  /**
   * Perform health check
   */
  async performHealthCheck() {
    const health = {
      status: 'healthy',
      timestamp: new Date(),
      worker: {
        isRunning: this.isRunning,
        isPaused: this.isPaused,
        activeJobs: this.activeJobs.size,
        uptime: this.stats.startTime ? Date.now() - this.stats.startTime.getTime() : 0
      },
      stats: { ...this.stats },
      database: null,
      email: null
    };

    try {
      // Check database connectivity
      const dbStart = Date.now();
      await this.pool.query('SELECT 1');
      health.database = {
        status: 'connected',
        responseTime: Date.now() - dbStart
      };

    } catch (error) {
      health.database = {
        status: 'error',
        error: error.message
      };
      health.status = 'unhealthy';
    }

    try {
      // Check email service
      const emailConfigured = this.emailService.isConfigured;
      health.email = {
        status: emailConfigured ? 'configured' : 'not_configured',
        configured: emailConfigured
      };

      if (!emailConfigured) {
        health.status = 'degraded';
      }

    } catch (error) {
      health.email = {
        status: 'error',
        error: error.message
      };
      health.status = 'unhealthy';
    }

    // Check for stuck emails
    try {
      const stuckEmails = await this.checkStuckEmails();
      if (stuckEmails.length > 0) {
        health.status = 'degraded';
        health.warnings = health.warnings || [];
        health.warnings.push(`Found ${stuckEmails.length} stuck emails`);
      }
    } catch (error) {
      this.logger.error('Failed to check stuck emails:', error);
    }

    this.emit('health-check', health);
    
    if (health.status === 'unhealthy') {
      this.logger.error('Health check failed', health);
    } else if (health.status === 'degraded') {
      this.logger.warn('Health check degraded', health);
    } else {
      this.logger.debug('Health check passed', health);
    }

    return health;
  }

  /**
   * Perform cleanup operations
   */
  async performCleanup() {
    this.logger.info('Starting cleanup process...');

    try {
      // Clean up old failed emails
      const cleanupResult = await this.pool.query(`
        DELETE FROM email_outbox 
        WHERE status = 'failed' 
        AND created_at < $1
        RETURNING id
      `, [new Date(Date.now() - WORKER_CONFIG.MAX_FAILED_EMAIL_AGE)]);

      if (cleanupResult.rowCount > 0) {
        this.logger.info(`Cleaned up ${cleanupResult.rowCount} old failed emails`);
      }

      // Clean up error stats (keep only last 100 errors)
      if (this.stats.errors.length > 100) {
        this.stats.errors = this.stats.errors.slice(-100);
      }

      // Reset stuck emails
      const stuckEmails = await this.checkStuckEmails();
      if (stuckEmails.length > 0) {
        await this.resetStuckEmails(stuckEmails);
        this.logger.warn(`Reset ${stuckEmails.length} stuck emails`);
      }

      this.emit('cleanup-completed', {
        deletedFailedEmails: cleanupResult.rowCount,
        resetStuckEmails: stuckEmails.length
      });

    } catch (error) {
      this.logger.error('Cleanup process failed:', error);
      throw error;
    }
  }

  /**
   * Check for stuck emails
   */
  async checkStuckEmails() {
    const query = `
      SELECT id, to_email, subject, attempts
      FROM email_outbox 
      WHERE status = 'pending'
      AND scheduled_at < $1
      AND attempts > 0
      ORDER BY scheduled_at ASC
    `;

    // Consider emails stuck if they haven't been processed in 30 minutes
    const stuckThreshold = new Date(Date.now() - 30 * 60 * 1000);
    const result = await this.pool.query(query, [stuckThreshold]);
    
    return result.rows;
  }

  /**
   * Reset stuck emails
   */
  async resetStuckEmails(stuckEmails) {
    if (stuckEmails.length === 0) return;

    const emailIds = stuckEmails.map(email => email.id);
    
    await this.pool.query(`
      UPDATE email_outbox 
      SET scheduled_at = CURRENT_TIMESTAMP
      WHERE id = ANY($1)
    `, [emailIds]);
  }

  /**
   * Record error for statistics
   */
  recordError(error) {
    this.stats.errors.push({
      timestamp: new Date(),
      message: error.message,
      stack: error.stack
    });

    // Keep only last 50 errors in memory
    if (this.stats.errors.length > 50) {
      this.stats.errors = this.stats.errors.slice(-50);
    }
  }

  /**
   * Handle worker errors
   */
  handleError(error) {
    this.logger.error('Worker error:', error);
    this.recordError(error);
    this.emit('error', error);
  }

  /**
   * Handle graceful shutdown
   */
  async handleShutdown(signal) {
    this.logger.info(`Received ${signal}, shutting down gracefully...`);
    
    try {
      await this.stop();
      process.exit(0);
    } catch (error) {
      this.logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  }

  /**
   * Get worker statistics
   */
  getStats() {
    const uptime = this.stats.startTime ? Date.now() - this.stats.startTime.getTime() : 0;
    const avgProcessingRate = uptime > 0 ? (this.stats.processed / (uptime / 1000 / 60)).toFixed(2) : 0;

    return {
      ...this.stats,
      uptime,
      avgProcessingRate: `${avgProcessingRate} emails/minute`,
      activeJobs: this.activeJobs.size,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      recentErrors: this.stats.errors.slice(-5)
    };
  }

  /**
   * Get queue status
   */
  async getQueueStatus() {
    try {
      const result = await this.pool.query(`
        SELECT 
          status,
          COUNT(*) as count,
          MIN(scheduled_at) as oldest_scheduled,
          MAX(created_at) as newest_created
        FROM email_outbox 
        GROUP BY status
        ORDER BY status
      `);

      const status = {
        timestamp: new Date(),
        queue: {}
      };

      result.rows.forEach(row => {
        status.queue[row.status] = {
          count: parseInt(row.count),
          oldestScheduled: row.oldest_scheduled,
          newestCreated: row.newest_created
        };
      });

      // Calculate total pending emails
      status.totalPending = status.queue.pending?.count || 0;

      return status;

    } catch (error) {
      this.logger.error('Failed to get queue status:', error);
      throw error;
    }
  }

  /**
   * Force process specific email
   */
  async forceProcessEmail(emailId) {
    try {
      const query = `
        SELECT id, to_email, cc_emails, bcc_emails, subject,
               html_content, text_content, payload_json, attempts
        FROM email_outbox 
        WHERE id = $1 AND status = 'pending'
      `;

      const result = await this.pool.query(query, [emailId]);
      
      if (result.rows.length === 0) {
        throw new Error('Email not found or not in pending status');
      }

      const email = result.rows[0];
      await this.emailService.sendQueuedEmail(email);
      
      this.logger.info(`Force processed email: ${emailId}`);
      return true;

    } catch (error) {
      await this.emailService.handleEmailFailure(emailId, error);
      this.logger.error(`Failed to force process email ${emailId}:`, error);
      throw error;
    }
  }

  /**
   * Retry all failed emails
   */
  async retryFailedEmails() {
    try {
      const result = await this.pool.query(`
        UPDATE email_outbox 
        SET status = 'pending', attempts = 0, scheduled_at = CURRENT_TIMESTAMP, last_error = NULL
        WHERE status = 'failed'
        RETURNING id
      `);

      const retryCount = result.rowCount;
      this.logger.info(`Marked ${retryCount} failed emails for retry`);
      
      return retryCount;

    } catch (error) {
      this.logger.error('Failed to retry failed emails:', error);
      throw error;
    }
  }
}

export default EmailWorker;