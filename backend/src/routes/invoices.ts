import { Router } from 'express';
import { AppError } from '@/lib/errors';
import { requireAuth } from '@/middleware/auth';
import { requireRoles } from '@/middleware/roles';
import { validateRequest } from '@/middleware/validation';
import { createRateLimit } from '@/middleware/rateLimiting';
import { invoiceService } from '@/services/invoice.service';
import {
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  ChangeInvoiceStatusSchema,
  SendInvoiceSchema,
  RemindInvoiceSchema,
  InvoiceFiltersSchema,
} from '@nourx/shared';
import type { AuthRequest } from '@/types/auth';
import logger from '@/lib/logger';

const router = Router();

// Rate limiting
const invoiceRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each organization to 100 requests per windowMs
  keyGenerator: (req: AuthRequest) => req.auth?.organizationId || req.ip,
});

const invoiceActionRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // limit invoice actions (send, remind, etc.)
  keyGenerator: (req: AuthRequest) => req.auth?.organizationId || req.ip,
});

// Apply auth and rate limiting to all routes
router.use(requireAuth);
router.use(invoiceRateLimit);

// =============================================================================
// INVOICE CRUD ROUTES
// =============================================================================

/**
 * @route   POST /api/invoices
 * @desc    Create a new invoice
 * @access  Private (Agent+)
 */
router.post(
  '/',
  requireRoles(['agent', 'admin']),
  validateRequest(CreateInvoiceSchema),
  async (req: AuthRequest, res) => {
    try {
      const invoice = await invoiceService.createInvoice(req.body, req.auth!);
      
      logger.info('Invoice created via API', {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        type: invoice.type,
        totalAmount: invoice.totalAmount,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.status(201).json({
        success: true,
        data: invoice,
      });
    } catch (error: any) {
      logger.error('Failed to create invoice', {
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });
      throw error;
    }
  }
);

/**
 * @route   GET /api/invoices
 * @desc    Get invoices with filtering and pagination
 * @access  Private (Agent+)
 */
router.get(
  '/',
  requireRoles(['agent', 'admin']),
  validateRequest(InvoiceFiltersSchema, 'query'),
  async (req: AuthRequest, res) => {
    try {
      const invoices = await invoiceService.getInvoices(
        req.query as any,
        req.auth!.organizationId!
      );

      res.json({
        success: true,
        data: invoices,
      });
    } catch (error: any) {
      logger.error('Failed to get invoices', {
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   GET /api/invoices/stats
 * @desc    Get invoice statistics
 * @access  Private (Agent+)
 */
router.get(
  '/stats',
  requireRoles(['agent', 'admin']),
  async (req: AuthRequest, res) => {
    try {
      const stats = await invoiceService.getInvoiceStats(req.auth!.organizationId!);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Failed to get invoice stats', {
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   GET /api/invoices/:id
 * @desc    Get a specific invoice by ID
 * @access  Private (Agent+)
 */
router.get(
  '/:id',
  requireRoles(['agent', 'admin']),
  async (req: AuthRequest, res) => {
    try {
      const invoice = await invoiceService.getInvoiceById(
        req.params.id,
        req.auth!.organizationId!
      );

      res.json({
        success: true,
        data: invoice,
      });
    } catch (error: any) {
      logger.error('Failed to get invoice', {
        invoiceId: req.params.id,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   PUT /api/invoices/:id
 * @desc    Update an invoice (draft only)
 * @access  Private (Agent+)
 */
router.put(
  '/:id',
  requireRoles(['agent', 'admin']),
  validateRequest(UpdateInvoiceSchema),
  async (req: AuthRequest, res) => {
    try {
      const invoice = await invoiceService.updateInvoice(
        req.params.id,
        req.body,
        req.auth!
      );

      logger.info('Invoice updated via API', {
        invoiceId: req.params.id,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        data: invoice,
      });
    } catch (error: any) {
      logger.error('Failed to update invoice', {
        invoiceId: req.params.id,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   DELETE /api/invoices/:id
 * @desc    Delete an invoice (draft only, soft delete)
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  requireRoles(['admin']),
  async (req: AuthRequest, res) => {
    try {
      await invoiceService.deleteInvoice(
        req.params.id,
        req.auth!.organizationId!,
        req.auth!
      );

      logger.info('Invoice deleted via API', {
        invoiceId: req.params.id,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'Invoice deleted successfully',
      });
    } catch (error: any) {
      logger.error('Failed to delete invoice', {
        invoiceId: req.params.id,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

// =============================================================================
// INVOICE WORKFLOW ROUTES
// =============================================================================

/**
 * @route   POST /api/invoices/:id/status
 * @desc    Change invoice status
 * @access  Private (Agent+)
 */
router.post(
  '/:id/status',
  invoiceActionRateLimit,
  requireRoles(['agent', 'admin']),
  validateRequest(ChangeInvoiceStatusSchema),
  async (req: AuthRequest, res) => {
    try {
      const invoice = await invoiceService.changeInvoiceStatus(
        req.params.id,
        req.body,
        req.auth!
      );

      logger.info('Invoice status changed via API', {
        invoiceId: req.params.id,
        newStatus: req.body.status,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        data: invoice,
      });
    } catch (error: any) {
      logger.error('Failed to change invoice status', {
        invoiceId: req.params.id,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   POST /api/invoices/:id/send
 * @desc    Send an invoice to client
 * @access  Private (Agent+)
 */
router.post(
  '/:id/send',
  invoiceActionRateLimit,
  requireRoles(['agent', 'admin']),
  validateRequest(SendInvoiceSchema),
  async (req: AuthRequest, res) => {
    try {
      const invoice = await invoiceService.sendInvoice(
        req.params.id,
        req.body,
        req.auth!
      );

      logger.info('Invoice sent via API', {
        invoiceId: req.params.id,
        recipientEmail: req.body.recipientEmail,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        data: invoice,
        message: 'Invoice sent successfully',
      });
    } catch (error: any) {
      logger.error('Failed to send invoice', {
        invoiceId: req.params.id,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   POST /api/invoices/:id/remind
 * @desc    Send a payment reminder for an invoice
 * @access  Private (Agent+)
 */
router.post(
  '/:id/remind',
  invoiceActionRateLimit,
  requireRoles(['agent', 'admin']),
  validateRequest(RemindInvoiceSchema),
  async (req: AuthRequest, res) => {
    try {
      await invoiceService.sendInvoiceReminder(
        req.params.id,
        req.body,
        req.auth!
      );

      logger.info('Invoice reminder sent via API', {
        invoiceId: req.params.id,
        reminderType: req.body.reminderType,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        message: 'Payment reminder sent successfully',
      });
    } catch (error: any) {
      logger.error('Failed to send invoice reminder', {
        invoiceId: req.params.id,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   POST /api/invoices/:id/mark-paid
 * @desc    Mark an invoice as paid
 * @access  Private (Agent+)
 */
router.post(
  '/:id/mark-paid',
  requireRoles(['agent', 'admin']),
  async (req: AuthRequest, res) => {
    try {
      const { paidDate, notes } = req.body;

      const invoice = await invoiceService.changeInvoiceStatus(
        req.params.id,
        {
          status: 'paid',
          paidDate,
          notes,
        },
        req.auth!
      );

      logger.info('Invoice marked as paid via API', {
        invoiceId: req.params.id,
        paidDate,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        data: invoice,
        message: 'Invoice marked as paid successfully',
      });
    } catch (error: any) {
      logger.error('Failed to mark invoice as paid', {
        invoiceId: req.params.id,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   POST /api/invoices/:id/mark-overdue
 * @desc    Mark an invoice as overdue
 * @access  Private (Agent+)
 */
router.post(
  '/:id/mark-overdue',
  requireRoles(['agent', 'admin']),
  async (req: AuthRequest, res) => {
    try {
      const { notes } = req.body;

      const invoice = await invoiceService.changeInvoiceStatus(
        req.params.id,
        {
          status: 'overdue',
          notes,
        },
        req.auth!
      );

      logger.info('Invoice marked as overdue via API', {
        invoiceId: req.params.id,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        data: invoice,
        message: 'Invoice marked as overdue',
      });
    } catch (error: any) {
      logger.error('Failed to mark invoice as overdue', {
        invoiceId: req.params.id,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   POST /api/invoices/:id/cancel
 * @desc    Cancel an invoice
 * @access  Private (Admin only)
 */
router.post(
  '/:id/cancel',
  requireRoles(['admin']),
  async (req: AuthRequest, res) => {
    try {
      const { notes } = req.body;

      const invoice = await invoiceService.changeInvoiceStatus(
        req.params.id,
        {
          status: 'cancelled',
          notes,
        },
        req.auth!
      );

      logger.info('Invoice cancelled via API', {
        invoiceId: req.params.id,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        data: invoice,
        message: 'Invoice cancelled successfully',
      });
    } catch (error: any) {
      logger.error('Failed to cancel invoice', {
        invoiceId: req.params.id,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

// =============================================================================
// INVOICE PDF AND DOCUMENT ROUTES
// =============================================================================

/**
 * @route   GET /api/invoices/:id/pdf
 * @desc    Generate and download invoice PDF
 * @access  Private (Agent+)
 */
router.get(
  '/:id/pdf',
  requireRoles(['agent', 'admin']),
  async (req: AuthRequest, res) => {
    try {
      // Get invoice details
      const invoice = await invoiceService.getInvoiceById(
        req.params.id,
        req.auth!.organizationId!
      );

      // TODO: Implement PDF generation
      // For now, return invoice data that would be used for PDF generation
      logger.info('Invoice PDF requested via API', {
        invoiceId: req.params.id,
        invoiceNumber: invoice.invoiceNumber,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      // Placeholder response - in production, this would return the PDF
      res.json({
        success: true,
        message: 'PDF generation not yet implemented',
        data: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          pdfUrl: `/api/invoices/${invoice.id}/pdf/download`,
        },
      });
    } catch (error: any) {
      logger.error('Failed to generate invoice PDF', {
        invoiceId: req.params.id,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   GET /api/invoices/:id/preview
 * @desc    Preview invoice in HTML format
 * @access  Private (Agent+)
 */
router.get(
  '/:id/preview',
  requireRoles(['agent', 'admin']),
  async (req: AuthRequest, res) => {
    try {
      const invoice = await invoiceService.getInvoiceById(
        req.params.id,
        req.auth!.organizationId!
      );

      logger.info('Invoice preview requested via API', {
        invoiceId: req.params.id,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });

      // Generate HTML preview
      const htmlPreview = await generateInvoiceHTMLPreview(invoice);

      res.set('Content-Type', 'text/html');
      res.send(htmlPreview);
    } catch (error: any) {
      logger.error('Failed to generate invoice preview', {
        invoiceId: req.params.id,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

// =============================================================================
// INVOICE HISTORY AND AUDIT ROUTES
// =============================================================================

/**
 * @route   GET /api/invoices/:id/history
 * @desc    Get invoice status change history
 * @access  Private (Agent+)
 */
router.get(
  '/:id/history',
  requireRoles(['agent', 'admin']),
  async (req: AuthRequest, res) => {
    try {
      // This would typically be implemented in the invoice service
      // For now, return a placeholder response
      logger.info('Invoice history requested via API', {
        invoiceId: req.params.id,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });

      res.json({
        success: true,
        message: 'Invoice history endpoint not yet implemented',
        data: [],
      });
    } catch (error: any) {
      logger.error('Failed to get invoice history', {
        invoiceId: req.params.id,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   GET /api/invoices/:id/reminders
 * @desc    Get invoice reminder history
 * @access  Private (Agent+)
 */
router.get(
  '/:id/reminders',
  requireRoles(['agent', 'admin']),
  async (req: AuthRequest, res) => {
    try {
      // This would typically be implemented in the invoice service
      // For now, return a placeholder response
      logger.info('Invoice reminders requested via API', {
        invoiceId: req.params.id,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });

      res.json({
        success: true,
        message: 'Invoice reminders endpoint not yet implemented',
        data: [],
      });
    } catch (error: any) {
      logger.error('Failed to get invoice reminders', {
        invoiceId: req.params.id,
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

// =============================================================================
// BULK OPERATIONS
// =============================================================================

/**
 * @route   POST /api/invoices/bulk-send
 * @desc    Send multiple invoices at once
 * @access  Private (Agent+)
 */
router.post(
  '/bulk-send',
  invoiceActionRateLimit,
  requireRoles(['agent', 'admin']),
  async (req: AuthRequest, res) => {
    try {
      const { invoiceIds, emailTemplate } = req.body;

      if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        throw new AppError('invoiceIds must be a non-empty array', 400);
      }

      if (invoiceIds.length > 50) {
        throw new AppError('Cannot send more than 50 invoices at once', 400);
      }

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const invoiceId of invoiceIds) {
        try {
          await invoiceService.sendInvoice(
            invoiceId,
            emailTemplate || {},
            req.auth!
          );
          results.push({ invoiceId, status: 'success' });
          successCount++;
        } catch (error: any) {
          results.push({ invoiceId, status: 'error', error: error.message });
          errorCount++;
          logger.error('Failed to send invoice in bulk operation', {
            invoiceId,
            error: error.message,
          });
        }
      }

      logger.info('Bulk invoice send completed via API', {
        totalInvoices: invoiceIds.length,
        successCount,
        errorCount,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        data: {
          totalInvoices: invoiceIds.length,
          successCount,
          errorCount,
          results,
        },
        message: `Bulk send completed: ${successCount} successful, ${errorCount} failed`,
      });
    } catch (error: any) {
      logger.error('Bulk invoice send failed', {
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

/**
 * @route   POST /api/invoices/bulk-remind
 * @desc    Send reminders for multiple invoices
 * @access  Private (Agent+)
 */
router.post(
  '/bulk-remind',
  invoiceActionRateLimit,
  requireRoles(['agent', 'admin']),
  async (req: AuthRequest, res) => {
    try {
      const { invoiceIds, reminderType = 'gentle', customMessage } = req.body;

      if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        throw new AppError('invoiceIds must be a non-empty array', 400);
      }

      if (invoiceIds.length > 50) {
        throw new AppError('Cannot remind more than 50 invoices at once', 400);
      }

      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const invoiceId of invoiceIds) {
        try {
          await invoiceService.sendInvoiceReminder(
            invoiceId,
            {
              reminderType,
              message: customMessage,
            },
            req.auth!
          );
          results.push({ invoiceId, status: 'success' });
          successCount++;
        } catch (error: any) {
          results.push({ invoiceId, status: 'error', error: error.message });
          errorCount++;
          logger.error('Failed to send reminder in bulk operation', {
            invoiceId,
            error: error.message,
          });
        }
      }

      logger.info('Bulk invoice remind completed via API', {
        totalInvoices: invoiceIds.length,
        successCount,
        errorCount,
        reminderType,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
        ip: req.ip,
      });

      res.json({
        success: true,
        data: {
          totalInvoices: invoiceIds.length,
          successCount,
          errorCount,
          results,
        },
        message: `Bulk remind completed: ${successCount} successful, ${errorCount} failed`,
      });
    } catch (error: any) {
      logger.error('Bulk invoice remind failed', {
        error: error.message,
        organizationId: req.auth!.organizationId,
        userId: req.auth!.userId,
      });
      throw error;
    }
  }
);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

async function generateInvoiceHTMLPreview(invoice: any): Promise<string> {
  // Basic HTML template for invoice preview
  // In production, this would use a proper template engine
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .invoice-details { margin: 20px 0; }
            .line-items { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .line-items th, .line-items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .line-items th { background-color: #f2f2f2; }
            .total { text-align: right; font-weight: bold; font-size: 1.2em; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Invoice ${invoice.invoiceNumber}</h1>
            <p><strong>Type:</strong> ${invoice.type}</p>
            <p><strong>Status:</strong> ${invoice.status}</p>
        </div>
        
        <div class="invoice-details">
            <p><strong>Issue Date:</strong> ${invoice.issueDate}</p>
            <p><strong>Due Date:</strong> ${invoice.dueDate || 'N/A'}</p>
            <p><strong>Currency:</strong> ${invoice.currency}</p>
        </div>

        <table class="line-items">
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${invoice.lines.map((line: any) => `
                    <tr>
                        <td>${line.description}</td>
                        <td>${line.quantity}</td>
                        <td>${line.unitPrice} ${invoice.currency}</td>
                        <td>${line.totalPrice} ${invoice.currency}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="total">
            <p>Total Amount: ${invoice.totalAmount} ${invoice.currency}</p>
        </div>

        ${invoice.notes ? `<div><strong>Notes:</strong><br/>${invoice.notes}</div>` : ''}
    </body>
    </html>
  `;
}

export default router;