import nodemailer from 'nodemailer';
import crypto from 'crypto';
import pkg from 'pg';
const { Pool } = pkg;
import { z } from 'zod';
import winston from 'winston';

// Validation schemas
const emailSchema = z.object({
  to: z.string().email('Valid email is required'),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string().min(1, 'Subject is required'),
  htmlContent: z.string().optional(),
  textContent: z.string().optional(),
  templateKey: z.string().optional(),
  templateData: z.object({}).optional(),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  scheduledAt: z.date().optional()
});

const templateDataSchema = z.object({
  userEmail: z.string().email().optional(),
  userName: z.string().optional(),
  organizationName: z.string().optional(),
  token: z.string().optional(),
  link: z.string().url().optional(),
  expiresAt: z.string().optional(),
  supportEmail: z.string().email().optional(),
  companyName: z.string().optional()
});

// Email types and templates
export const EMAIL_TYPES = {
  USER_INVITATION: 'user_invitation',
  PASSWORD_RESET: 'password_reset',
  ACCOUNT_ACTIVATION: 'account_activation',
  ADMIN_NOTIFICATION: 'admin_notification',
  WELCOME: 'welcome',
  SECURITY_ALERT: 'security_alert'
};

// Constants
const RATE_LIMIT_PER_HOUR = 100; // Max emails per hour per recipient
const MAX_RETRY_ATTEMPTS = 5;
const RETRY_DELAYS = [1000, 5000, 15000, 30000, 60000]; // Exponential backoff in ms

class EmailService {
  constructor(pool, logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [new winston.transports.Console()]
  })) {
    this.pool = pool;
    this.logger = logger;
    this.transporter = null;
    this.isConfigured = false;
    
    // Rate limiting cache (in production, use Redis)
    this.rateLimitCache = new Map();
    
    this.initializeTransporter();
  }

  /**
   * Initialize SMTP transporter based on environment
   */
  async initializeTransporter() {
    try {
      const config = this.getSMTPConfig();
      
      if (!config) {
        this.logger.warn('Email service not configured - emails will be queued but not sent');
        return;
      }

      this.transporter = nodemailer.createTransporter(config);
      
      // Verify connection
      await this.transporter.verify();
      this.isConfigured = true;
      this.logger.info('Email service initialized successfully');
      
    } catch (error) {
      this.logger.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Get SMTP configuration from environment variables
   */
  getSMTPConfig() {
    const env = process.env.NODE_ENV || 'development';
    
    // Development mode - use Ethereal for testing
    if (env === 'development' && !process.env.SMTP_HOST) {
      return {
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: process.env.ETHEREAL_USER || 'ethereal.user@ethereal.email',
          pass: process.env.ETHEREAL_PASS || 'ethereal.pass'
        }
      };
    }

    // Production/staging configuration
    if (process.env.SMTP_HOST) {
      return {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false'
        }
      };
    }

    return null;
  }

  /**
   * Queue email for delivery
   * @param {Object} emailData - Email data
   * @returns {string} Email ID
   */
  async queueEmail(emailData) {
    try {
      // Validate input
      const validatedData = emailSchema.parse(emailData);
      
      // Check rate limiting
      if (!(await this.checkRateLimit(validatedData.to))) {
        throw new Error('Rate limit exceeded for recipient');
      }

      // Generate email content if template is specified
      let htmlContent = validatedData.htmlContent;
      let textContent = validatedData.textContent;
      let subject = validatedData.subject;

      if (validatedData.templateKey) {
        const template = await this.getTemplate(validatedData.templateKey);
        if (template) {
          const renderedContent = await this.renderTemplate(
            template, 
            validatedData.templateData || {}
          );
          htmlContent = renderedContent.html;
          textContent = renderedContent.text;
          subject = renderedContent.subject;
        }
      }

      // Insert into email queue
      const query = `
        INSERT INTO email_outbox (
          to_email, cc_emails, bcc_emails, subject, 
          html_content, text_content, payload_json,
          scheduled_at, max_attempts
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `;

      const values = [
        validatedData.to,
        validatedData.cc ? validatedData.cc.join(',') : null,
        validatedData.bcc ? validatedData.bcc.join(',') : null,
        subject,
        htmlContent,
        textContent,
        JSON.stringify({
          templateKey: validatedData.templateKey,
          templateData: validatedData.templateData,
          priority: validatedData.priority
        }),
        validatedData.scheduledAt || new Date(),
        MAX_RETRY_ATTEMPTS
      ];

      const result = await this.pool.query(query, values);
      const emailId = result.rows[0].id;

      this.logger.info('Email queued successfully', { 
        emailId, 
        to: validatedData.to,
        subject,
        templateKey: validatedData.templateKey 
      });

      return emailId;

    } catch (error) {
      this.logger.error('Failed to queue email:', error);
      throw error;
    }
  }

  /**
   * Send invitation email to new user
   */
  async sendUserInvitation(userEmail, organizationName, invitationToken, userType = 'client') {
    const activationLink = this.generateSecureLink('activate', invitationToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    return await this.queueEmail({
      to: userEmail,
      templateKey: EMAIL_TYPES.USER_INVITATION,
      templateData: {
        userEmail,
        organizationName,
        activationLink,
        expiresAt: expiresAt.toLocaleDateString('fr-FR'),
        userType,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@nourx.fr'
      },
      subject: `Invitation à rejoindre ${organizationName} sur NOURX`,
      priority: 'high'
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(userEmail, resetToken, userType = 'client') {
    const resetLink = this.generateSecureLink('reset-password', resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    
    return await this.queueEmail({
      to: userEmail,
      templateKey: EMAIL_TYPES.PASSWORD_RESET,
      templateData: {
        userEmail,
        resetLink,
        expiresAt: expiresAt.toLocaleTimeString('fr-FR'),
        userType,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@nourx.fr'
      },
      subject: 'Réinitialisation de votre mot de passe NOURX',
      priority: 'high'
    });
  }

  /**
   * Send account activation confirmation
   */
  async sendAccountActivated(userEmail, userName, organizationName) {
    const loginLink = `${process.env.WEB_URL || 'http://localhost:5173'}/login`;
    
    return await this.queueEmail({
      to: userEmail,
      templateKey: EMAIL_TYPES.ACCOUNT_ACTIVATION,
      templateData: {
        userName,
        userEmail,
        organizationName,
        loginLink,
        supportEmail: process.env.SUPPORT_EMAIL || 'support@nourx.fr'
      },
      subject: `Bienvenue sur NOURX, ${userName}!`,
      priority: 'normal'
    });
  }

  /**
   * Send security alert notification
   */
  async sendSecurityAlert(userEmail, alertType, details) {
    return await this.queueEmail({
      to: userEmail,
      templateKey: EMAIL_TYPES.SECURITY_ALERT,
      templateData: {
        userEmail,
        alertType,
        details,
        timestamp: new Date().toLocaleString('fr-FR'),
        supportEmail: process.env.SUPPORT_EMAIL || 'support@nourx.fr'
      },
      subject: 'Alerte de sécurité NOURX',
      priority: 'high'
    });
  }

  /**
   * Send admin notification
   */
  async sendAdminNotification(subject, message, adminEmails = null) {
    const recipients = adminEmails || await this.getAdminEmails();
    
    const emailPromises = recipients.map(email => 
      this.queueEmail({
        to: email,
        templateKey: EMAIL_TYPES.ADMIN_NOTIFICATION,
        templateData: {
          subject,
          message,
          timestamp: new Date().toLocaleString('fr-FR')
        },
        subject: `[NOURX Admin] ${subject}`,
        priority: 'high'
      })
    );

    return await Promise.all(emailPromises);
  }

  /**
   * Process email queue (called by worker)
   */
  async processEmailQueue(batchSize = 10) {
    try {
      // Get pending emails
      const query = `
        SELECT id, to_email, cc_emails, bcc_emails, subject,
               html_content, text_content, payload_json, attempts
        FROM email_outbox 
        WHERE status = 'pending' 
        AND scheduled_at <= CURRENT_TIMESTAMP
        AND attempts < max_attempts
        ORDER BY scheduled_at ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      `;

      const result = await this.pool.query(query, [batchSize]);
      const emails = result.rows;

      if (emails.length === 0) {
        return { processed: 0, failed: 0 };
      }

      let processed = 0;
      let failed = 0;

      for (const email of emails) {
        try {
          await this.sendQueuedEmail(email);
          processed++;
        } catch (error) {
          await this.handleEmailFailure(email.id, error);
          failed++;
        }
      }

      this.logger.info(`Processed email batch: ${processed} sent, ${failed} failed`);
      return { processed, failed };

    } catch (error) {
      this.logger.error('Failed to process email queue:', error);
      throw error;
    }
  }

  /**
   * Send a queued email
   */
  async sendQueuedEmail(emailRecord) {
    if (!this.isConfigured) {
      throw new Error('Email service not configured');
    }

    const mailOptions = {
      from: `${process.env.FROM_NAME || 'NOURX'} <${process.env.FROM_EMAIL || 'noreply@nourx.fr'}>`,
      to: emailRecord.to_email,
      subject: emailRecord.subject,
      html: emailRecord.html_content,
      text: emailRecord.text_content
    };

    if (emailRecord.cc_emails) {
      mailOptions.cc = emailRecord.cc_emails.split(',');
    }

    if (emailRecord.bcc_emails) {
      mailOptions.bcc = emailRecord.bcc_emails.split(',');
    }

    // Send email
    const info = await this.transporter.sendMail(mailOptions);
    
    // Mark as sent
    await this.pool.query(
      'UPDATE email_outbox SET status = $1, sent_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['sent', emailRecord.id]
    );

    this.logger.info('Email sent successfully', {
      emailId: emailRecord.id,
      to: emailRecord.to_email,
      messageId: info.messageId
    });

    return info;
  }

  /**
   * Handle email sending failure
   */
  async handleEmailFailure(emailId, error) {
    const attempts = await this.pool.query(
      'SELECT attempts FROM email_outbox WHERE id = $1',
      [emailId]
    );

    const currentAttempts = attempts.rows[0]?.attempts || 0;
    const newAttempts = currentAttempts + 1;

    if (newAttempts >= MAX_RETRY_ATTEMPTS) {
      // Mark as failed
      await this.pool.query(
        'UPDATE email_outbox SET status = $1, attempts = $2, last_error = $3 WHERE id = $4',
        ['failed', newAttempts, error.message, emailId]
      );
    } else {
      // Schedule retry with exponential backoff
      const retryDelay = RETRY_DELAYS[Math.min(newAttempts - 1, RETRY_DELAYS.length - 1)];
      const scheduledAt = new Date(Date.now() + retryDelay);

      await this.pool.query(
        'UPDATE email_outbox SET attempts = $1, last_error = $2, scheduled_at = $3 WHERE id = $4',
        [newAttempts, error.message, scheduledAt, emailId]
      );
    }

    this.logger.warn('Email sending failed', {
      emailId,
      attempts: newAttempts,
      error: error.message
    });
  }

  /**
   * Check rate limiting for recipient
   */
  async checkRateLimit(email) {
    const now = Date.now();
    const hourAgo = now - (60 * 60 * 1000);
    
    // Clean old entries
    for (const [key, timestamp] of this.rateLimitCache.entries()) {
      if (timestamp < hourAgo) {
        this.rateLimitCache.delete(key);
      }
    }

    // Count emails for this recipient in the last hour
    let count = 0;
    for (const [key, timestamp] of this.rateLimitCache.entries()) {
      if (key.startsWith(email + ':') && timestamp >= hourAgo) {
        count++;
      }
    }

    if (count >= RATE_LIMIT_PER_HOUR) {
      return false;
    }

    // Record this email
    this.rateLimitCache.set(`${email}:${now}`, now);
    return true;
  }

  /**
   * Generate secure link with HMAC signature
   */
  generateSecureLink(action, token) {
    const baseUrl = process.env.WEB_URL || 'http://localhost:5173';
    const secret = process.env.JWT_SECRET;
    
    // Create HMAC signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${action}:${token}`);
    const signature = hmac.digest('hex');
    
    return `${baseUrl}/${action}?token=${token}&sig=${signature}`;
  }

  /**
   * Get email template from database
   */
  async getTemplate(key, locale = 'fr') {
    try {
      const query = `
        SELECT subject, html_content, text_content, variables
        FROM email_templates 
        WHERE key = $1 AND locale = $2
      `;
      
      const result = await this.pool.query(query, [key, locale]);
      return result.rows[0] || null;
      
    } catch (error) {
      this.logger.error('Failed to get email template:', error);
      return null;
    }
  }

  /**
   * Render email template with data
   */
  async renderTemplate(template, data) {
    const validatedData = templateDataSchema.parse(data);
    
    // Simple template rendering (replace {{variable}} with data)
    const renderContent = (content) => {
      return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return validatedData[key] || match;
      });
    };

    return {
      subject: renderContent(template.subject),
      html: renderContent(template.html_content),
      text: renderContent(template.text_content)
    };
  }

  /**
   * Get admin email addresses
   */
  async getAdminEmails() {
    try {
      const query = 'SELECT email FROM user_admin WHERE active = true';
      const result = await this.pool.query(query);
      return result.rows.map(row => row.email);
      
    } catch (error) {
      this.logger.error('Failed to get admin emails:', error);
      return [process.env.ADMIN_EMAIL || 'admin@nourx.fr'];
    }
  }

  /**
   * Get email statistics
   */
  async getEmailStats(days = 7) {
    try {
      const query = `
        SELECT 
          status,
          COUNT(*) as count,
          DATE(created_at) as date
        FROM email_outbox 
        WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        GROUP BY status, DATE(created_at)
        ORDER BY date DESC
      `;
      
      const result = await this.pool.query(query);
      return result.rows;
      
    } catch (error) {
      this.logger.error('Failed to get email stats:', error);
      return [];
    }
  }

  /**
   * Get failed emails for manual review
   */
  async getFailedEmails(limit = 50) {
    try {
      const query = `
        SELECT id, to_email, subject, last_error, attempts, created_at
        FROM email_outbox 
        WHERE status = 'failed'
        ORDER BY created_at DESC
        LIMIT $1
      `;
      
      const result = await this.pool.query(query, [limit]);
      return result.rows;
      
    } catch (error) {
      this.logger.error('Failed to get failed emails:', error);
      return [];
    }
  }

  /**
   * Retry failed email
   */
  async retryEmail(emailId) {
    try {
      await this.pool.query(
        `UPDATE email_outbox 
         SET status = 'pending', attempts = 0, scheduled_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND status = 'failed'`,
        [emailId]
      );
      
      this.logger.info('Email marked for retry', { emailId });
      return true;
      
    } catch (error) {
      this.logger.error('Failed to retry email:', error);
      return false;
    }
  }
}

export default EmailService;