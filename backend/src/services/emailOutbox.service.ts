import { db } from '@/lib/db';
import { AppError } from '@/lib/errors';
import logger from '@/lib/logger';
import { emailService } from './email.service';
import { TemplateVariables } from './email.service';

export interface EmailEnqueueOptions {
  recipientEmail?: string;
  recipientId?: string;
  recipientName?: string;
  subject?: string;
  templateName?: string;
  templateData?: TemplateVariables;
  htmlContent?: string;
  textContent?: string;
  scheduledAt?: Date;
}

export class EmailOutboxService {
  /**
   * Ajoute un email à la file d'attente
   */
  async enqueue(options: EmailEnqueueOptions): Promise<string> {
    const {
      recipientEmail,
      recipientId,
      recipientName = 'User',
      subject,
      templateName,
      templateData = {},
      htmlContent,
      textContent,
      scheduledAt
    } = options;

    try {
      // Résoudre l'email du destinataire si on a l'ID
      let toEmail = recipientEmail;
      let toName = recipientName;

      if (recipientId && !recipientEmail) {
        const user = await this.resolveUserEmail(recipientId);
        if (!user) {
          throw new AppError('User not found for email notification', 404);
        }
        toEmail = user.email;
        toName = user.name || recipientName;
      }

      if (!toEmail) {
        throw new AppError('Recipient email is required', 400);
      }

      // Si on utilise un template
      if (templateName) {
        if (!subject) {
          // Le subject sera récupéré du template
          return await emailService.sendFromTemplate(
            templateName,
            toEmail,
            toName,
            templateData,
            scheduledAt
          );
        } else {
          // Template avec subject personnalisé
          const template = await emailService.getTemplate(templateName);
          if (!template) {
            throw new AppError(`Email template not found: ${templateName}`, 404);
          }

          // Remplacer les variables dans le template
          const html = this.replaceVariables(template.html_content, templateData);
          const text = template.text_content 
            ? this.replaceVariables(template.text_content, templateData)
            : textContent;

          return await emailService.queueEmail({
            to: toEmail,
            toName,
            subject,
            html,
            text,
            templateId: template.id,
            scheduledAt,
          });
        }
      }

      // Email direct sans template
      if (!subject) {
        throw new AppError('Subject is required when not using a template', 400);
      }

      if (!htmlContent) {
        throw new AppError('HTML content is required when not using a template', 400);
      }

      return await emailService.queueEmail({
        to: toEmail,
        toName,
        subject,
        html: htmlContent,
        text: textContent,
        scheduledAt,
      });

    } catch (error) {
      logger.error('Failed to enqueue email', {
        error,
        recipientEmail,
        recipientId,
        templateName,
        subject,
      });
      
      if (error instanceof AppError) {
        throw error;
      }
      
      throw new AppError('Failed to enqueue email', 500);
    }
  }

  /**
   * Résout l'email d'un utilisateur à partir de son ID
   */
  private async resolveUserEmail(userId: string): Promise<{ email: string; name?: string } | null> {
    try {
      // Essayer d'abord dans user_admin
      const adminUser = await db
        .selectFrom('user_admin')
        .select(['email', 'first_name', 'last_name'])
        .where('id', '=', userId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (adminUser) {
        return {
          email: adminUser.email,
          name: `${adminUser.first_name} ${adminUser.last_name}`.trim(),
        };
      }

      // Essayer dans user_client
      const clientUser = await db
        .selectFrom('user_client')
        .select(['email', 'first_name', 'last_name'])
        .where('id', '=', userId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (clientUser) {
        return {
          email: clientUser.email,
          name: `${clientUser.first_name} ${clientUser.last_name}`.trim(),
        };
      }

      return null;
    } catch (error) {
      logger.error('Failed to resolve user email', { userId, error });
      return null;
    }
  }

  /**
   * Remplace les variables dans un contenu
   */
  private replaceVariables(content: string, variables: TemplateVariables): string {
    let result = content;

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value || ''));
    });

    // Gestion des conditionnels simples {{#if variable}}...{{/if}}
    result = result.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, varName, content) => {
      return variables[varName] ? content : '';
    });

    return result;
  }

  /**
   * Traite les emails en attente
   */
  async processEmails(): Promise<{ processed: number; failed: number }> {
    try {
      const pendingEmails = await emailService.getPendingEmails();
      const retryableEmails = await emailService.getRetryableEmails();
      
      const allEmails = [...pendingEmails, ...retryableEmails];
      
      let processed = 0;
      let failed = 0;

      for (const email of allEmails) {
        try {
          const success = await emailService.processQueuedEmail(email.id);
          if (success) {
            processed++;
          } else {
            failed++;
          }
        } catch (error) {
          logger.error('Failed to process email', { emailId: email.id, error });
          failed++;
        }
      }

      logger.info('Email processing completed', {
        totalEmails: allEmails.length,
        processed,
        failed,
      });

      return { processed, failed };
    } catch (error) {
      logger.error('Email processing failed', { error });
      throw new AppError('Failed to process emails', 500);
    }
  }

  /**
   * Obtient les statistiques des emails
   */
  async getStats(fromDate?: Date) {
    return await emailService.getEmailStats(fromDate);
  }

  /**
   * Nettoie les anciens emails
   */
  async cleanup(daysOld: number = 30): Promise<number> {
    return await emailService.cleanupOldEmails(daysOld);
  }

  /**
   * Test la connexion SMTP
   */
  async testConnection(): Promise<boolean> {
    return await emailService.testConnection();
  }

  /**
   * Méthodes pratiques pour les types d'emails courants
   */

  async sendAccountActivation(email: string, name: string, activationUrl: string): Promise<string> {
    return this.enqueue({
      recipientEmail: email,
      recipientName: name,
      templateName: 'activate_account',
      templateData: {
        user_name: name,
        activation_link: activationUrl,
      },
    });
  }

  async sendAccountDeactivation(email: string, name: string, reason: string): Promise<string> {
    return this.enqueue({
      recipientEmail: email,
      recipientName: name,
      templateName: 'deactivate_account',
      templateData: {
        user_name: name,
        reason,
      },
    });
  }

  async sendPasswordReset(email: string, name: string, resetUrl: string): Promise<string> {
    return this.enqueue({
      recipientEmail: email,
      recipientName: name,
      templateName: 'reset_password',
      templateData: {
        user_name: name,
        reset_link: resetUrl,
      },
    });
  }

  async sendTicketNotification(
    email: string,
    name: string,
    ticketNumber: string,
    title: string,
    templateName: string,
    additionalData: TemplateVariables = {}
  ): Promise<string> {
    return this.enqueue({
      recipientEmail: email,
      recipientName: name,
      templateName,
      templateData: {
        user_name: name,
        ticket_number: ticketNumber,
        ticket_title: title,
        ...additionalData,
      },
    });
  }

  async sendInvoiceNotification(
    email: string,
    name: string,
    invoiceNumber: string,
    templateName: string,
    additionalData: TemplateVariables = {}
  ): Promise<string> {
    return this.enqueue({
      recipientEmail: email,
      recipientName: name,
      templateName,
      templateData: {
        user_name: name,
        invoice_number: invoiceNumber,
        ...additionalData,
      },
    });
  }
}

// Instance singleton
export const emailOutboxService = new EmailOutboxService();
export default emailOutboxService;