import { Router } from 'express';
import { AppError } from '@/lib/errors';
import { requireAuth } from '@/middleware/auth';
import { requireRoles } from '@/middleware/roles';
import { validateRequest } from '@/middleware/validation';
import { createRateLimit } from '@/middleware/rateLimiting';
import { auditService } from '@/services/audit.service';
import { emailOutboxService } from '@/services/emailOutbox.service';
import { emailTemplateService } from '@/services/emailTemplate.service';
import { macroService } from '@/services/macro.service';
import { TestEmailTemplateSchema, ValidateMacroSchema } from '@nourx/shared';
import type { AuthRequest } from '@/types/auth';
import logger from '@/lib/logger';
import { db } from '@/lib/db';
import { config } from '@/config';

const router = Router();

// Strict rate limiting for admin tools
const toolsRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each admin to 50 requests per windowMs
  keyGenerator: (req: AuthRequest) => req.auth?.userId || req.ip,
});

const emailTestRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Very limited for email testing
  keyGenerator: (req: AuthRequest) => req.auth?.userId || req.ip,
});

// Apply auth and admin-only access to all routes
router.use(requireAuth);
router.use(requireRoles(['admin']));
router.use(toolsRateLimit);

// =============================================================================
// SMTP AND EMAIL TESTING ROUTES
// =============================================================================

/**
 * @route   POST /api/tools/smtp/test
 * @desc    Test SMTP configuration
 * @access  Private (Admin only)
 */
router.post(
  '/smtp/test',
  emailTestRateLimit,
  async (req: AuthRequest, res) => {
    try {
      const { recipientEmail, subject, message } = req.body;

      if (!recipientEmail) {
        throw new AppError('Recipient email is required', 400);
      }

      // Send test email
      await emailOutboxService.enqueue({
        recipientEmail,
        recipientName: 'Test Recipient',
        subject: subject || '[TEST] SMTP Configuration Test',
        htmlContent: message || '<p>This is a test email to verify SMTP configuration.</p>',
        textContent: message || 'This is a test email to verify SMTP configuration.',
        organizationId: req.auth!.organizationId!,
      });

      logger.info('SMTP test email sent via API', {
        recipientEmail,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'Test email queued successfully',
        data: {
          recipientEmail,
          subject: subject || '[TEST] SMTP Configuration Test',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      logger.error('SMTP test failed', {
        error: error.message,
        recipientEmail: req.body.recipientEmail,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   GET /api/tools/smtp/status
 * @desc    Get SMTP configuration status
 * @access  Private (Admin only)
 */
router.get('/smtp/status', async (req: AuthRequest, res) => {
  try {
    // Check email outbox status
    const pendingEmails = await db
      .selectFrom('email_outbox')
      .select(db.fn.count('id').as('count'))
      .where('status', '=', 'pending')
      .executeTakeFirst();

    const failedEmails = await db
      .selectFrom('email_outbox')
      .select(db.fn.count('id').as('count'))
      .where('status', '=', 'failed')
      .where('created_at', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .executeTakeFirst();

    const recentSentEmails = await db
      .selectFrom('email_outbox')
      .select(db.fn.count('id').as('count'))
      .where('status', '=', 'sent')
      .where('sent_at', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .executeTakeFirst();

    res.json({
      success: true,
      data: {
        smtp: {
          configured: !!config.email.smtp.host,
          host: config.email.smtp.host || 'Not configured',
          port: config.email.smtp.port || 587,
          secure: config.email.smtp.secure || false,
          from: config.email.from || 'Not configured',
        },
        queue: {
          pending: Number(pendingEmails?.count || 0),
          failed24h: Number(failedEmails?.count || 0),
          sent24h: Number(recentSentEmails?.count || 0),
        },
        lastCheck: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Failed to get SMTP status', {
      error: error.message,
      organizationId: req.auth!.organizationId,
      userId: req.auth!.userId,
    });
    throw error;
  }
});

/**
 * @route   GET /api/tools/email/failed
 * @desc    Get recent failed emails
 * @access  Private (Admin only)
 */
router.get('/email/failed', async (req: AuthRequest, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const offset = Number(req.query.offset) || 0;

    const failedEmails = await db
      .selectFrom('email_outbox')
      .select([
        'id',
        'recipient_email as recipientEmail',
        'subject',
        'status',
        'error_message as errorMessage',
        'attempt_count as attemptCount',
        'created_at as createdAt',
        'last_attempted_at as lastAttemptedAt',
      ])
      .where('status', '=', 'failed')
      .orderBy('last_attempted_at', 'desc')
      .offset(offset)
      .limit(limit)
      .execute();

    res.json({
      success: true,
      data: {
        emails: failedEmails,
        pagination: {
          limit,
          offset,
          hasMore: failedEmails.length === limit,
        },
      },
    });
  } catch (error: any) {
    logger.error('Failed to get failed emails', {
      error: error.message,
      organizationId: req.auth!.organizationId,
      userId: req.auth!.userId,
    });
    throw error;
  }
});

/**
 * @route   POST /api/tools/email/retry/:emailId
 * @desc    Retry sending a failed email
 * @access  Private (Admin only)
 */
router.post('/email/retry/:emailId', async (req: AuthRequest, res) => {
  try {
    const emailId = req.params.emailId;

    // Reset email status to pending for retry
    await db
      .updateTable('email_outbox')
      .set({
        status: 'pending',
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .where('id', '=', emailId)
      .where('status', '=', 'failed')
      .execute();

    logger.info('Email marked for retry via API', {
      emailId,
      organizationId: req.auth!.organizationId,
      userId: req.auth!.userId,
      ip: req.ip,
    });

    res.json({
      success: true,
      message: 'Email marked for retry',
      data: { emailId },
    });
  } catch (error: any) {
    logger.error('Failed to retry email', {
      emailId: req.params.emailId,
      error: error.message,
      organizationId: req.auth!.organizationId,
      userId: req.auth!.userId,
    });
    throw error;
  }
});

// =============================================================================
// EMAIL TEMPLATE TESTING ROUTES
// =============================================================================

/**
 * @route   POST /api/tools/templates/test
 * @desc    Test email template rendering and send test email
 * @access  Private (Admin only)
 */
router.post(
  '/templates/test',
  emailTestRateLimit,
  validateRequest(TestEmailTemplateSchema),
  async (req: AuthRequest, res) => {
    try {
      await emailTemplateService.testTemplate(req.body, req.auth!);

      logger.info('Email template tested via API', {
        templateId: req.body.templateId,
        recipientEmail: req.body.recipientEmail,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'Test email sent successfully',
        data: {
          templateId: req.body.templateId,
          recipientEmail: req.body.recipientEmail,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      logger.error('Email template test failed', {
        templateId: req.body.templateId,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   POST /api/tools/templates/render
 * @desc    Render template without sending email
 * @access  Private (Admin only)
 */
router.post('/templates/render', async (req: AuthRequest, res) => {
  try {
    const { templateId, variables, format = 'both' } = req.body;

    if (!templateId) {
      throw new AppError('Template ID is required', 400);
    }

    const rendered = await emailTemplateService.renderTemplate(
      { templateId, variables: variables || {}, format },
      req.auth!.organizationId!
    );

    res.json({
      success: true,
      data: rendered,
    });
  } catch (error: any) {
    logger.error('Template render failed', {
      templateId: req.body.templateId,
      error: error.message,
      organizationId: req.auth!.organizationId,
      userId: req.auth!.userId,
    });
    throw error;
  }
});

// =============================================================================
// MACRO TESTING AND VALIDATION ROUTES
// =============================================================================

/**
 * @route   POST /api/tools/macros/validate
 * @desc    Validate macro logic
 * @access  Private (Admin only)
 */
router.post(
  '/macros/validate',
  validateRequest(ValidateMacroSchema),
  async (req: AuthRequest, res) => {
    try {
      const validation = await macroService.validateMacroLogic(req.body);

      res.json({
        success: true,
        data: validation,
      });
    } catch (error: any) {
      logger.error('Macro validation failed', {
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

// =============================================================================
// AUDIT LOG ROUTES
// =============================================================================

/**
 * @route   GET /api/tools/audit
 * @desc    Get audit logs with filtering
 * @access  Private (Admin only)
 */
router.get('/audit', async (req: AuthRequest, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      action,
      resourceType,
      resourceId,
      userId,
      startDate,
      endDate,
    } = req.query;

    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(Number(limit), 100); // Cap at 100
    const offset = (pageNum - 1) * limitNum;

    let query = db
      .selectFrom('audit_logs')
      .leftJoin('users', 'audit_logs.user_id', 'users.id')
      .select([
        'audit_logs.id',
        'audit_logs.organization_id as organizationId',
        'audit_logs.action',
        'audit_logs.resource_type as resourceType',
        'audit_logs.resource_id as resourceId',
        'audit_logs.user_id as userId',
        'users.first_name as userFirstName',
        'users.last_name as userLastName',
        'users.email as userEmail',
        'audit_logs.details',
        'audit_logs.ip_address as ipAddress',
        'audit_logs.user_agent as userAgent',
        'audit_logs.created_at as createdAt',
      ])
      .where('audit_logs.organization_id', '=', req.auth!.organizationId!);

    // Apply filters
    if (action) {
      query = query.where('audit_logs.action', '=', action as string);
    }
    if (resourceType) {
      query = query.where('audit_logs.resource_type', '=', resourceType as string);
    }
    if (resourceId) {
      query = query.where('audit_logs.resource_id', '=', resourceId as string);
    }
    if (userId) {
      query = query.where('audit_logs.user_id', '=', userId as string);
    }
    if (startDate) {
      query = query.where('audit_logs.created_at', '>=', startDate as string);
    }
    if (endDate) {
      query = query.where('audit_logs.created_at', '<=', endDate as string);
    }

    // Get total count
    const totalResult = await query
      .clearSelect()
      .select(db.fn.count('audit_logs.id').as('count'))
      .executeTakeFirst();
    const total = Number(totalResult?.count || 0);

    // Get paginated results
    const logs = await query
      .orderBy('audit_logs.created_at', 'desc')
      .offset(offset)
      .limit(limitNum)
      .execute();

    const auditLogs = logs.map(log => ({
      id: log.id,
      organizationId: log.organizationId,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      userId: log.userId,
      userName: log.userFirstName && log.userLastName 
        ? `${log.userFirstName} ${log.userLastName}`.trim()
        : null,
      userEmail: log.userEmail,
      details: log.details ? JSON.parse(log.details) : null,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    }));

    res.json({
      success: true,
      data: {
        logs: auditLogs,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          hasNext: offset + limitNum < total,
          hasPrev: pageNum > 1,
        },
      },
    });
  } catch (error: any) {
    logger.error('Failed to get audit logs', {
      error: error.message,
      organizationId: req.auth!.organizationId,
      userId: req.auth!.userId,
    });
    throw error;
  }
});

/**
 * @route   GET /api/tools/audit/stats
 * @desc    Get audit log statistics
 * @access  Private (Admin only)
 */
router.get('/audit/stats', async (req: AuthRequest, res) => {
  try {
    const { period = '7d' } = req.query;

    let startDate: Date;
    switch (period) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }

    const [
      totalLogs,
      actionStats,
      resourceTypeStats,
      topUsers,
    ] = await Promise.all([
      // Total logs in period
      db
        .selectFrom('audit_logs')
        .select(db.fn.count('id').as('count'))
        .where('organization_id', '=', req.auth!.organizationId!)
        .where('created_at', '>=', startDate.toISOString())
        .executeTakeFirst(),

      // Action statistics
      db
        .selectFrom('audit_logs')
        .select(['action', db.fn.count('id').as('count')])
        .where('organization_id', '=', req.auth!.organizationId!)
        .where('created_at', '>=', startDate.toISOString())
        .groupBy('action')
        .orderBy('count', 'desc')
        .limit(10)
        .execute(),

      // Resource type statistics
      db
        .selectFrom('audit_logs')
        .select(['resource_type', db.fn.count('id').as('count')])
        .where('organization_id', '=', req.auth!.organizationId!)
        .where('created_at', '>=', startDate.toISOString())
        .groupBy('resource_type')
        .orderBy('count', 'desc')
        .limit(10)
        .execute(),

      // Most active users
      db
        .selectFrom('audit_logs')
        .leftJoin('users', 'audit_logs.user_id', 'users.id')
        .select([
          'audit_logs.user_id as userId',
          'users.first_name as firstName',
          'users.last_name as lastName',
          'users.email',
          db.fn.count('audit_logs.id').as('count')
        ])
        .where('audit_logs.organization_id', '=', req.auth!.organizationId!)
        .where('audit_logs.created_at', '>=', startDate.toISOString())
        .groupBy(['audit_logs.user_id', 'users.first_name', 'users.last_name', 'users.email'])
        .orderBy('count', 'desc')
        .limit(10)
        .execute(),
    ]);

    const actionBreakdown = actionStats.reduce((acc, row) => {
      acc[row.action] = Number(row.count);
      return acc;
    }, {} as Record<string, number>);

    const resourceTypeBreakdown = resourceTypeStats.reduce((acc, row) => {
      acc[row.resource_type] = Number(row.count);
      return acc;
    }, {} as Record<string, number>);

    const mostActiveUsers = topUsers.map(user => ({
      userId: user.userId,
      name: user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}`.trim()
        : null,
      email: user.email,
      actionCount: Number(user.count),
    }));

    res.json({
      success: true,
      data: {
        period,
        startDate: startDate.toISOString(),
        totalLogs: Number(totalLogs?.count || 0),
        actionBreakdown,
        resourceTypeBreakdown,
        mostActiveUsers,
      },
    });
  } catch (error: any) {
    logger.error('Failed to get audit stats', {
      error: error.message,
      organizationId: req.auth!.organizationId,
      userId: req.auth!.userId,
    });
    throw error;
  }
});

// =============================================================================
// SYSTEM DIAGNOSTICS ROUTES
// =============================================================================

/**
 * @route   GET /api/tools/diagnostics/database
 * @desc    Check database health and performance
 * @access  Private (Admin only)
 */
router.get('/diagnostics/database', async (req: AuthRequest, res) => {
  try {
    const startTime = Date.now();

    // Test database connection and performance
    const connectionTest = await db
      .selectFrom('organizations')
      .select('id')
      .where('id', '=', req.auth!.organizationId!)
      .executeTakeFirst();

    const queryTime = Date.now() - startTime;

    // Get table sizes (PostgreSQL specific)
    const tableSizes = await db
      .selectFrom(db.raw('information_schema.tables').as('t'))
      .select([
        'table_name',
        db.raw('pg_size_pretty(pg_total_relation_size(quote_ident(table_name))) as size'),
        db.raw('pg_total_relation_size(quote_ident(table_name)) as size_bytes'),
      ])
      .where('table_schema', '=', 'public')
      .orderBy(db.raw('pg_total_relation_size(quote_ident(table_name))'), 'desc')
      .limit(10)
      .execute()
      .catch(() => []); // Fallback if not PostgreSQL

    res.json({
      success: true,
      data: {
        connection: {
          status: connectionTest ? 'healthy' : 'unhealthy',
          responseTimeMs: queryTime,
        },
        tables: tableSizes,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Database diagnostics failed', {
      error: error.message,
      organizationId: req.auth!.organizationId,
      userId: req.auth!.userId,
    });

    res.status(500).json({
      success: false,
      data: {
        connection: {
          status: 'unhealthy',
          error: error.message,
        },
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route   GET /api/tools/diagnostics/system
 * @desc    Get system health overview
 * @access  Private (Admin only)
 */
router.get('/diagnostics/system', async (req: AuthRequest, res) => {
  try {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    // Get recent error counts
    const recentErrors = await db
      .selectFrom('audit_logs')
      .select(db.fn.count('id').as('count'))
      .where('organization_id', '=', req.auth!.organizationId!)
      .where('created_at', '>=', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .where('details', 'like', '%error%')
      .executeTakeFirst();

    res.json({
      success: true,
      data: {
        uptime: {
          seconds: Math.round(uptime),
          formatted: formatUptime(uptime),
        },
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024),
          unit: 'MB',
        },
        environment: config.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version,
        recentErrors: Number(recentErrors?.count || 0),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('System diagnostics failed', {
      error: error.message,
      organizationId: req.auth!.organizationId,
      userId: req.auth!.userId,
    });
    throw error;
  }
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export default router;