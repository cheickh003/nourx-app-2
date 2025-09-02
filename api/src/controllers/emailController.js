import EmailService from '../services/emailService.js';
import EmailTemplateService from '../services/emailTemplateService.js';
import EmailWorker from '../services/emailWorker.js';
import pool from '../config/database.js';
import { z } from 'zod';
import winston from 'winston';

// Validation schemas
const sendEmailSchema = z.object({
  to: z.string().email('Valid email is required'),
  templateKey: z.string().min(1, 'Template key is required'),
  templateData: z.object({}).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional()
});

const templateSchema = z.object({
  key: z.string().min(1, 'Template key is required'),
  subject: z.string().min(1, 'Subject is required'),
  htmlContent: z.string().min(1, 'HTML content is required'),
  textContent: z.string().min(1, 'Text content is required'),
  locale: z.string().default('fr')
});

class EmailController {
  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()]
    });
    
    this.emailService = new EmailService(pool, this.logger);
    this.templateService = new EmailTemplateService(pool, this.logger);
    this.emailWorker = null; // Will be initialized if needed
  }

  /**
   * Send email using template
   * POST /api/admin/emails/send
   */
  async sendEmail(req, res) {
    try {
      const validatedData = sendEmailSchema.parse(req.body);
      
      const emailId = await this.emailService.queueEmail({
        to: validatedData.to,
        templateKey: validatedData.templateKey,
        templateData: validatedData.templateData || {},
        priority: validatedData.priority || 'normal'
      });

      res.status(200).json({
        success: true,
        message: 'Email queued successfully',
        emailId
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }

      this.logger.error('Failed to send email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to queue email'
      });
    }
  }

  /**
   * Get email queue status
   * GET /api/admin/emails/queue/status
   */
  async getQueueStatus(req, res) {
    try {
      const stats = await this.emailService.getEmailStats(7);
      const failedEmails = await this.emailService.getFailedEmails(10);

      // Get current queue counts
      const queueResult = await pool.query(`
        SELECT 
          status,
          COUNT(*) as count,
          MIN(scheduled_at) as oldest_scheduled,
          MAX(created_at) as newest_created
        FROM email_outbox 
        GROUP BY status
        ORDER BY status
      `);

      const queueStatus = {};
      queueResult.rows.forEach(row => {
        queueStatus[row.status] = {
          count: parseInt(row.count),
          oldestScheduled: row.oldest_scheduled,
          newestCreated: row.newest_created
        };
      });

      res.status(200).json({
        success: true,
        data: {
          queue: queueStatus,
          stats,
          failedEmails,
          totalPending: queueStatus.pending?.count || 0,
          totalFailed: queueStatus.failed?.count || 0
        }
      });

    } catch (error) {
      this.logger.error('Failed to get queue status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get queue status'
      });
    }
  }

  /**
   * Retry failed email
   * POST /api/admin/emails/:emailId/retry
   */
  async retryEmail(req, res) {
    try {
      const { emailId } = req.params;
      const success = await this.emailService.retryEmail(emailId);

      if (success) {
        res.status(200).json({
          success: true,
          message: 'Email marked for retry'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Email not found or not in failed status'
        });
      }

    } catch (error) {
      this.logger.error('Failed to retry email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retry email'
      });
    }
  }

  /**
   * Get all email templates
   * GET /api/admin/emails/templates
   */
  async getTemplates(req, res) {
    try {
      const templates = await this.templateService.getAllTemplates();

      res.status(200).json({
        success: true,
        data: templates
      });

    } catch (error) {
      this.logger.error('Failed to get templates:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get templates'
      });
    }
  }

  /**
   * Get specific email template
   * GET /api/admin/emails/templates/:key
   */
  async getTemplate(req, res) {
    try {
      const { key } = req.params;
      const { locale = 'fr' } = req.query;
      
      const template = await this.templateService.getTemplate(key, locale);

      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      res.status(200).json({
        success: true,
        data: template
      });

    } catch (error) {
      this.logger.error('Failed to get template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get template'
      });
    }
  }

  /**
   * Create or update email template
   * PUT /api/admin/emails/templates/:key
   */
  async updateTemplate(req, res) {
    try {
      const { key } = req.params;
      const templateData = { ...req.body, key };
      
      const validatedData = templateSchema.parse(templateData);
      
      // Validate template content for security
      const htmlValidation = this.templateService.validateTemplateContent(validatedData.htmlContent);
      if (!htmlValidation.valid) {
        return res.status(400).json({
          success: false,
          message: htmlValidation.error
        });
      }

      const templateId = await this.templateService.createOrUpdateTemplate(validatedData);

      res.status(200).json({
        success: true,
        message: 'Template updated successfully',
        templateId
      });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.errors
        });
      }

      this.logger.error('Failed to update template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update template'
      });
    }
  }

  /**
   * Preview email template
   * POST /api/admin/emails/templates/:key/preview
   */
  async previewTemplate(req, res) {
    try {
      const { key } = req.params;
      const { locale = 'fr', sampleData = {} } = req.body;
      
      const preview = await this.templateService.previewTemplate(key, locale, sampleData);

      res.status(200).json({
        success: true,
        data: preview
      });

    } catch (error) {
      this.logger.error('Failed to preview template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to preview template'
      });
    }
  }

  /**
   * Delete email template
   * DELETE /api/admin/emails/templates/:key
   */
  async deleteTemplate(req, res) {
    try {
      const { key } = req.params;
      const { locale = 'fr' } = req.query;
      
      const deleted = await this.templateService.deleteTemplate(key, locale);

      if (deleted) {
        res.status(200).json({
          success: true,
          message: 'Template deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

    } catch (error) {
      this.logger.error('Failed to delete template:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete template'
      });
    }
  }

  /**
   * Send user invitation
   * POST /api/admin/emails/send-invitation
   */
  async sendUserInvitation(req, res) {
    try {
      const { email, organizationName, invitationToken, userType = 'client' } = req.body;

      if (!email || !organizationName || !invitationToken) {
        return res.status(400).json({
          success: false,
          message: 'Email, organization name, and invitation token are required'
        });
      }

      const emailId = await this.emailService.sendUserInvitation(
        email,
        organizationName,
        invitationToken,
        userType
      );

      res.status(200).json({
        success: true,
        message: 'Invitation email sent successfully',
        emailId
      });

    } catch (error) {
      this.logger.error('Failed to send invitation:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send invitation email'
      });
    }
  }

  /**
   * Send password reset
   * POST /api/admin/emails/send-reset
   */
  async sendPasswordReset(req, res) {
    try {
      const { email, resetToken, userType = 'client' } = req.body;

      if (!email || !resetToken) {
        return res.status(400).json({
          success: false,
          message: 'Email and reset token are required'
        });
      }

      const emailId = await this.emailService.sendPasswordReset(email, resetToken, userType);

      res.status(200).json({
        success: true,
        message: 'Password reset email sent successfully',
        emailId
      });

    } catch (error) {
      this.logger.error('Failed to send password reset:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email'
      });
    }
  }

  /**
   * Send welcome/activation email
   * POST /api/admin/emails/send-welcome
   */
  async sendWelcome(req, res) {
    try {
      const { email, userName, organizationName } = req.body;

      if (!email || !userName || !organizationName) {
        return res.status(400).json({
          success: false,
          message: 'Email, user name, and organization name are required'
        });
      }

      const emailId = await this.emailService.sendAccountActivated(email, userName, organizationName);

      res.status(200).json({
        success: true,
        message: 'Welcome email sent successfully',
        emailId
      });

    } catch (error) {
      this.logger.error('Failed to send welcome email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send welcome email'
      });
    }
  }

  /**
   * Test email configuration
   * POST /api/admin/emails/test
   */
  async testEmail(req, res) {
    try {
      const { email = 'test@example.com' } = req.body;

      // Send a test email
      const emailId = await this.emailService.queueEmail({
        to: email,
        subject: 'NOURX Email Service Test',
        htmlContent: `
          <h2>Email Service Test</h2>
          <p>This is a test email from the NOURX email service.</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString('fr-FR')}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV}</p>
        `,
        textContent: `
          NOURX Email Service Test
          
          This is a test email from the NOURX email service.
          Time: ${new Date().toLocaleString('fr-FR')}
          Environment: ${process.env.NODE_ENV}
        `,
        priority: 'normal'
      });

      res.status(200).json({
        success: true,
        message: 'Test email queued successfully',
        emailId,
        configured: this.emailService.isConfigured
      });

    } catch (error) {
      this.logger.error('Failed to send test email:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send test email'
      });
    }
  }

  /**
   * Get email service health
   * GET /api/admin/emails/health
   */
  async getHealth(req, res) {
    try {
      // Basic health check
      const health = {
        status: 'healthy',
        timestamp: new Date(),
        email: {
          configured: this.emailService.isConfigured,
          transporter: !!this.emailService.transporter
        },
        database: null
      };

      // Test database connection
      try {
        const dbStart = Date.now();
        await pool.query('SELECT 1');
        health.database = {
          status: 'connected',
          responseTime: Date.now() - dbStart
        };
      } catch (dbError) {
        health.database = {
          status: 'error',
          error: dbError.message
        };
        health.status = 'unhealthy';
      }

      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json({
        success: health.status === 'healthy',
        data: health
      });

    } catch (error) {
      this.logger.error('Health check failed:', error);
      res.status(503).json({
        success: false,
        message: 'Health check failed',
        error: error.message
      });
    }
  }

  /**
   * Initialize email worker (admin only)
   * POST /api/admin/emails/worker/start
   */
  async startWorker(req, res) {
    try {
      if (this.emailWorker && this.emailWorker.isRunning) {
        return res.status(400).json({
          success: false,
          message: 'Email worker is already running'
        });
      }

      this.emailWorker = new EmailWorker(pool, this.logger);
      await this.emailWorker.start();

      res.status(200).json({
        success: true,
        message: 'Email worker started successfully'
      });

    } catch (error) {
      this.logger.error('Failed to start email worker:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start email worker'
      });
    }
  }

  /**
   * Stop email worker (admin only)
   * POST /api/admin/emails/worker/stop
   */
  async stopWorker(req, res) {
    try {
      if (!this.emailWorker || !this.emailWorker.isRunning) {
        return res.status(400).json({
          success: false,
          message: 'Email worker is not running'
        });
      }

      await this.emailWorker.stop();

      res.status(200).json({
        success: true,
        message: 'Email worker stopped successfully'
      });

    } catch (error) {
      this.logger.error('Failed to stop email worker:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stop email worker'
      });
    }
  }
}

export default EmailController;