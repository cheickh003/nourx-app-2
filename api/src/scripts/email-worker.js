#!/usr/bin/env node

/**
 * Email Worker Script
 * Standalone script to run the email worker process
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import EmailWorker from '../services/emailWorker.js';
import pkg from 'pg';
const { Pool } = pkg;
import winston from 'winston';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Configure logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/email-worker.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Handle process events
let worker = null;
let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`Received ${signal}, initiating graceful shutdown...`);

  try {
    if (worker) {
      await worker.stop();
    }
    
    await pool.end();
    logger.info('Graceful shutdown completed');
    process.exit(0);
    
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Setup signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

async function main() {
  try {
    logger.info('Starting NOURX Email Worker...');

    // Test database connection
    const client = await pool.connect();
    logger.info('Database connection established');
    client.release();

    // Create and start email worker
    worker = new EmailWorker(pool, logger);

    // Setup worker event listeners
    worker.on('started', () => {
      logger.info('Email worker started successfully');
    });

    worker.on('stopped', () => {
      logger.info('Email worker stopped');
    });

    worker.on('error', (error) => {
      logger.error('Email worker error:', error);
    });

    worker.on('batch-processed', (result) => {
      if (result.processed > 0 || result.failed > 0) {
        logger.info(`Batch processed: ${result.processed} sent, ${result.failed} failed`);
      }
    });

    worker.on('health-check-failed', (error) => {
      logger.error('Health check failed:', error);
    });

    // Start the worker
    await worker.start();

    // Keep the process alive
    logger.info('Email worker is running. Press Ctrl+C to stop.');

  } catch (error) {
    logger.error('Failed to start email worker:', error);
    process.exit(1);
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'status':
    await showWorkerStatus();
    break;
  case 'stats':
    await showWorkerStats();
    break;
  case 'health':
    await checkWorkerHealth();
    break;
  case 'retry-failed':
    await retryFailedEmails();
    break;
  default:
    await main();
}

async function showWorkerStatus() {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const result = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count,
        MIN(created_at) as oldest,
        MAX(created_at) as newest
      FROM email_outbox 
      GROUP BY status
      ORDER BY 
        CASE 
          WHEN status = 'pending' THEN 1
          WHEN status = 'sent' THEN 2
          WHEN status = 'failed' THEN 3
          ELSE 4
        END
    `);

    console.log('\n📧 NOURX Email Worker Status');
    console.log('================================');
    
    if (result.rows.length === 0) {
      console.log('No emails in queue');
    } else {
      result.rows.forEach(row => {
        const icon = {
          'pending': '⏳',
          'sent': '✅',
          'failed': '❌'
        }[row.status] || '❓';
        
        console.log(`${icon} ${row.status.toUpperCase()}: ${row.count} emails`);
        if (row.oldest) {
          console.log(`   Oldest: ${new Date(row.oldest).toLocaleString()}`);
          console.log(`   Newest: ${new Date(row.newest).toLocaleString()}`);
        }
      });
    }
    
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('Failed to get status:', error.message);
    process.exit(1);
  }
}

async function showWorkerStats() {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Get email stats for last 7 days
    const statsResult = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        status,
        COUNT(*) as count
      FROM email_outbox 
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(created_at), status
      ORDER BY date DESC, status
    `);

    // Get failed email details
    const failedResult = await pool.query(`
      SELECT to_email, subject, last_error, attempts
      FROM email_outbox 
      WHERE status = 'failed'
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log('\n📊 Email Worker Statistics (Last 7 Days)');
    console.log('==========================================');
    
    if (statsResult.rows.length === 0) {
      console.log('No email activity in the last 7 days');
    } else {
      const statsByDate = {};
      statsResult.rows.forEach(row => {
        const date = row.date.toISOString().split('T')[0];
        if (!statsByDate[date]) statsByDate[date] = {};
        statsByDate[date][row.status] = row.count;
      });

      Object.entries(statsByDate).forEach(([date, stats]) => {
        console.log(`\n📅 ${date}`);
        Object.entries(stats).forEach(([status, count]) => {
          const icon = { pending: '⏳', sent: '✅', failed: '❌' }[status] || '❓';
          console.log(`   ${icon} ${status}: ${count}`);
        });
      });
    }

    if (failedResult.rows.length > 0) {
      console.log('\n❌ Recent Failed Emails');
      console.log('========================');
      failedResult.rows.forEach((email, i) => {
        console.log(`${i + 1}. ${email.to_email} - ${email.subject}`);
        console.log(`   Attempts: ${email.attempts}, Error: ${email.last_error}`);
      });
    }
    
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('Failed to get stats:', error.message);
    process.exit(1);
  }
}

async function checkWorkerHealth() {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    console.log('\n🏥 Email Worker Health Check');
    console.log('=============================');

    // Check database
    const dbStart = Date.now();
    await pool.query('SELECT 1');
    const dbTime = Date.now() - dbStart;
    console.log(`✅ Database: Connected (${dbTime}ms)`);

    // Check email queue
    const queueResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'pending' AND scheduled_at < NOW() - INTERVAL '30 minutes') as stuck
      FROM email_outbox
    `);

    const queue = queueResult.rows[0];
    console.log(`📧 Queue: ${queue.pending} pending, ${queue.failed} failed`);
    
    if (parseInt(queue.stuck) > 0) {
      console.log(`⚠️  Warning: ${queue.stuck} emails may be stuck`);
    }

    // Check SMTP configuration
    if (process.env.SMTP_HOST) {
      console.log(`📮 SMTP: Configured (${process.env.SMTP_HOST}:${process.env.SMTP_PORT})`);
    } else {
      console.log('⚠️  SMTP: Not configured (using Ethereal for development)');
    }

    console.log('✅ Health check completed');
    
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  }
}

async function retryFailedEmails() {
  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    const result = await pool.query(`
      UPDATE email_outbox 
      SET status = 'pending', attempts = 0, scheduled_at = CURRENT_TIMESTAMP, last_error = NULL
      WHERE status = 'failed'
      RETURNING id, to_email, subject
    `);

    console.log(`\n🔄 Retrying Failed Emails`);
    console.log('=========================');
    
    if (result.rowCount === 0) {
      console.log('No failed emails to retry');
    } else {
      console.log(`Marked ${result.rowCount} emails for retry:`);
      result.rows.forEach((email, i) => {
        console.log(`${i + 1}. ${email.to_email} - ${email.subject}`);
      });
    }
    
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('Failed to retry emails:', error.message);
    process.exit(1);
  }
}