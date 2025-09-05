import { db } from '@/lib/db';
import { AppError } from '@/lib/errors';
import logger from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from 'kysely';
import {
  CreateInvoiceInput,
  UpdateInvoiceInput,
  ChangeInvoiceStatusInput,
  SendInvoiceInput,
  RemindInvoiceInput,
  InvoiceFilters,
  Invoice,
  InvoiceList,
  InvoiceStats,
  InvoiceStatus,
  InvoiceType,
} from '@nourx/shared';
import type { RequestContext } from '@/types/context';
import { withTransaction } from '@/lib/transaction';
import { AuditAction } from '@/types/audit';
import { auditService } from './audit.service';
import { emailOutboxService } from './emailOutbox.service';

export class InvoiceService {
  async createInvoice(input: CreateInvoiceInput, context: RequestContext): Promise<Invoice> {
    const validated = await CreateInvoiceInput.parseAsync(input);

    const result = await withTransaction(async (trx) => {
      const id = uuidv4();
      const now = new Date().toISOString();

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(validated.type, context.organizationId!, trx);

      // Calculate total amount
      const totalAmount = validated.lines.reduce((sum, line) => sum + line.totalPrice, 0);

      // Create invoice
      await trx.insertInto('invoices').values({
        id,
        organization_id: context.organizationId!,
        invoice_number: invoiceNumber,
        type: validated.type,
        status: 'draft',
        issue_date: validated.issueDate,
        due_date: validated.dueDate,
        total_amount: totalAmount,
        currency: validated.currency,
        notes: validated.notes,
        created_by: context.userId,
        created_at: now,
        updated_at: now,
      }).execute();

      // Create invoice lines
      for (let i = 0; i < validated.lines.length; i++) {
        const line = validated.lines[i];
        await trx.insertInto('invoice_lines').values({
          id: uuidv4(),
          invoice_id: id,
          description: line.description,
          quantity: line.quantity,
          unit_price: line.unitPrice,
          total_price: line.totalPrice,
          order_index: line.orderIndex || i,
        }).execute();
      }

      // Log audit
      await auditService.log({
        organizationId: context.organizationId!,
        userId: context.userId,
        action: AuditAction.INVOICE_CREATED,
        resourceType: 'invoice',
        resourceId: id,
        details: {
          invoiceNumber,
          type: validated.type,
          totalAmount,
          currency: validated.currency,
          lineCount: validated.lines.length,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      }, trx);

      return await this.getInvoiceById(id, context.organizationId!, trx);
    });

    logger.info('Invoice created', {
      invoiceId: result.id,
      invoiceNumber: result.invoiceNumber,
      type: result.type,
      organizationId: context.organizationId,
      userId: context.userId
    });

    return result;
  }

  async getInvoiceById(id: string, organizationId: string, trx?: Transaction<any>): Promise<Invoice> {
    const query = (trx || db)
      .selectFrom('invoices')
      .leftJoin('users as creator', 'invoices.created_by', 'creator.id')
      .select([
        'invoices.id',
        'invoices.organization_id as organizationId',
        'invoices.invoice_number as invoiceNumber',
        'invoices.type',
        'invoices.status',
        'invoices.issue_date as issueDate',
        'invoices.due_date as dueDate',
        'invoices.paid_date as paidDate',
        'invoices.total_amount as totalAmount',
        'invoices.currency',
        'invoices.notes',
        'invoices.created_by as createdBy',
        'creator.first_name as creatorFirstName',
        'creator.last_name as creatorLastName',
        'invoices.created_at as createdAt',
        'invoices.updated_at as updatedAt',
      ])
      .where('invoices.id', '=', id)
      .where('invoices.organization_id', '=', organizationId)
      .where('invoices.deleted_at', 'is', null);

    const row = await query.executeTakeFirst();
    if (!row) {
      throw new AppError('Invoice not found', 404);
    }

    // Get invoice lines
    const lines = await (trx || db)
      .selectFrom('invoice_lines')
      .select([
        'id',
        'invoice_id as invoiceId',
        'description',
        'quantity',
        'unit_price as unitPrice',
        'total_price as totalPrice',
        'order_index as orderIndex',
      ])
      .where('invoice_id', '=', id)
      .orderBy('order_index', 'asc')
      .execute();

    return {
      id: row.id,
      organizationId: row.organizationId,
      invoiceNumber: row.invoiceNumber,
      type: row.type as InvoiceType,
      status: row.status as InvoiceStatus,
      issueDate: row.issueDate,
      dueDate: row.dueDate,
      paidDate: row.paidDate,
      totalAmount: row.totalAmount,
      currency: row.currency,
      notes: row.notes,
      createdBy: row.createdBy,
      creatorName: row.creatorFirstName ? `${row.creatorFirstName} ${row.creatorLastName}`.trim() : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      lines: lines.map(line => ({
        id: line.id,
        invoiceId: line.invoiceId,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        totalPrice: line.totalPrice,
        orderIndex: line.orderIndex,
      })),
    };
  }

  async updateInvoice(id: string, input: UpdateInvoiceInput, context: RequestContext): Promise<Invoice> {
    const validated = await UpdateInvoiceInput.parseAsync(input);

    const result = await withTransaction(async (trx) => {
      // Get current invoice
      const currentInvoice = await this.getInvoiceById(id, context.organizationId!, trx);

      // Check if invoice can be edited (only draft invoices)
      if (currentInvoice.status !== 'draft') {
        throw new AppError('Only draft invoices can be edited', 400);
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Track changes for audit
      const changes: Record<string, { from: any; to: any }> = {};

      if (validated.type !== undefined && validated.type !== currentInvoice.type) {
        updateData.type = validated.type;
        changes.type = { from: currentInvoice.type, to: validated.type };
      }

      if (validated.issueDate !== undefined && validated.issueDate !== currentInvoice.issueDate) {
        updateData.issue_date = validated.issueDate;
        changes.issueDate = { from: currentInvoice.issueDate, to: validated.issueDate };
      }

      if (validated.dueDate !== undefined && validated.dueDate !== currentInvoice.dueDate) {
        updateData.due_date = validated.dueDate;
        changes.dueDate = { from: currentInvoice.dueDate, to: validated.dueDate };
      }

      if (validated.currency !== undefined && validated.currency !== currentInvoice.currency) {
        updateData.currency = validated.currency;
        changes.currency = { from: currentInvoice.currency, to: validated.currency };
      }

      if (validated.notes !== undefined && validated.notes !== currentInvoice.notes) {
        updateData.notes = validated.notes;
        changes.notes = { from: currentInvoice.notes, to: validated.notes };
      }

      // Handle lines update if provided
      let newTotalAmount = currentInvoice.totalAmount;
      if (validated.lines) {
        // Delete existing lines
        await trx
          .deleteFrom('invoice_lines')
          .where('invoice_id', '=', id)
          .execute();

        // Add new lines
        newTotalAmount = 0;
        for (let i = 0; i < validated.lines.length; i++) {
          const line = validated.lines[i];
          const lineId = line.id || uuidv4();
          
          await trx.insertInto('invoice_lines').values({
            id: lineId,
            invoice_id: id,
            description: line.description,
            quantity: line.quantity,
            unit_price: line.unitPrice,
            total_price: line.totalPrice,
            order_index: line.orderIndex || i,
          }).execute();

          newTotalAmount += line.totalPrice;
        }

        updateData.total_amount = newTotalAmount;
        changes.totalAmount = { from: currentInvoice.totalAmount, to: newTotalAmount };
        changes.lineCount = { from: currentInvoice.lines.length, to: validated.lines.length };
      }

      // Update invoice
      await trx
        .updateTable('invoices')
        .set(updateData)
        .where('id', '=', id)
        .where('organization_id', '=', context.organizationId!)
        .where('deleted_at', 'is', null)
        .execute();

      // Log audit
      if (Object.keys(changes).length > 0) {
        await auditService.log({
          organizationId: context.organizationId!,
          userId: context.userId,
          action: AuditAction.INVOICE_UPDATED,
          resourceType: 'invoice',
          resourceId: id,
          details: { changes },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        }, trx);
      }

      return await this.getInvoiceById(id, context.organizationId!, trx);
    });

    logger.info('Invoice updated', {
      invoiceId: id,
      organizationId: context.organizationId,
      userId: context.userId
    });

    return result;
  }

  async changeInvoiceStatus(
    id: string, 
    input: ChangeInvoiceStatusInput, 
    context: RequestContext
  ): Promise<Invoice> {
    const validated = await ChangeInvoiceStatusInput.parseAsync(input);

    const result = await withTransaction(async (trx) => {
      // Get current invoice
      const currentInvoice = await this.getInvoiceById(id, context.organizationId!, trx);

      // Validate status transition
      this.validateStatusTransition(currentInvoice.status, validated.status);

      const updateData: any = {
        status: validated.status,
        updated_at: new Date().toISOString(),
      };

      // Handle specific status changes
      if (validated.status === 'paid' && validated.paidDate) {
        updateData.paid_date = validated.paidDate;
      } else if (validated.status === 'paid' && !currentInvoice.paidDate) {
        updateData.paid_date = new Date().toISOString();
      }

      // Update invoice
      await trx
        .updateTable('invoices')
        .set(updateData)
        .where('id', '=', id)
        .where('organization_id', '=', context.organizationId!)
        .where('deleted_at', 'is', null)
        .execute();

      // Log status change history
      await trx.insertInto('invoice_status_history').values({
        id: uuidv4(),
        invoice_id: id,
        from_status: currentInvoice.status,
        to_status: validated.status,
        notes: validated.notes,
        changed_by: context.userId,
        changed_at: new Date().toISOString(),
      }).execute();

      // Log audit
      await auditService.log({
        organizationId: context.organizationId!,
        userId: context.userId,
        action: AuditAction.INVOICE_STATUS_CHANGED,
        resourceType: 'invoice',
        resourceId: id,
        details: {
          fromStatus: currentInvoice.status,
          toStatus: validated.status,
          paidDate: updateData.paid_date,
          notes: validated.notes,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      }, trx);

      // Handle automatic actions based on status
      if (validated.status === 'sent') {
        await this.scheduleOverdueCheck(id, currentInvoice.dueDate, trx);
      } else if (validated.status === 'paid') {
        await this.sendPaymentConfirmation(id, context, trx);
      }

      return await this.getInvoiceById(id, context.organizationId!, trx);
    });

    logger.info('Invoice status changed', {
      invoiceId: id,
      fromStatus: result.status,
      toStatus: validated.status,
      organizationId: context.organizationId,
      userId: context.userId
    });

    return result;
  }

  async sendInvoice(id: string, input: SendInvoiceInput, context: RequestContext): Promise<Invoice> {
    const validated = await SendInvoiceInput.parseAsync(input);

    const result = await withTransaction(async (trx) => {
      const invoice = await this.getInvoiceById(id, context.organizationId!, trx);

      // Check if invoice can be sent
      if (invoice.status === 'cancelled') {
        throw new AppError('Cannot send cancelled invoice', 400);
      }

      // Generate PDF if needed
      let pdfPath: string | null = null;
      if (validated.attachPDF) {
        // pdfPath = await this.generateInvoicePDF(invoice);
        logger.info('PDF generation should be implemented', { invoiceId: id });
      }

      // Prepare email
      const subject = validated.subject || `Invoice ${invoice.invoiceNumber}`;
      const message = validated.message || `Please find attached invoice ${invoice.invoiceNumber}.`;

      await emailOutboxService.enqueue({
        recipientEmail: validated.recipientEmail || 'client@example.com', // TODO: Get from organization
        recipientName: validated.recipientName || 'Client',
        subject,
        templateName: 'invoice_sent',
        templateData: {
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: invoice.totalAmount,
          currency: invoice.currency,
          dueDate: invoice.dueDate,
          customMessage: message,
        },
        organizationId: context.organizationId!,
        attachments: pdfPath ? [{ path: pdfPath, filename: `${invoice.invoiceNumber}.pdf` }] : undefined,
      }, trx);

      // Update invoice status to sent if it's draft
      if (invoice.status === 'draft') {
        await trx
          .updateTable('invoices')
          .set({ 
            status: 'sent', 
            updated_at: new Date().toISOString(),
          })
          .where('id', '=', id)
          .execute();

        // Log status change
        await trx.insertInto('invoice_status_history').values({
          id: uuidv4(),
          invoice_id: id,
          from_status: 'draft',
          to_status: 'sent',
          notes: 'Invoice sent to client',
          changed_by: context.userId,
          changed_at: new Date().toISOString(),
        }).execute();

        // Schedule overdue check
        if (invoice.dueDate) {
          await this.scheduleOverdueCheck(id, invoice.dueDate, trx);
        }
      }

      // Log audit
      await auditService.log({
        organizationId: context.organizationId!,
        userId: context.userId,
        action: AuditAction.INVOICE_SENT,
        resourceType: 'invoice',
        resourceId: id,
        details: {
          recipientEmail: validated.recipientEmail,
          subject,
          attachPDF: validated.attachPDF,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      }, trx);

      return await this.getInvoiceById(id, context.organizationId!, trx);
    });

    logger.info('Invoice sent', {
      invoiceId: id,
      recipientEmail: validated.recipientEmail,
      organizationId: context.organizationId,
      userId: context.userId
    });

    return result;
  }

  async sendInvoiceReminder(id: string, input: RemindInvoiceInput, context: RequestContext): Promise<void> {
    const validated = await RemindInvoiceInput.parseAsync(input);

    await withTransaction(async (trx) => {
      const invoice = await this.getInvoiceById(id, context.organizationId!, trx);

      // Check if invoice can be reminded
      if (invoice.status !== 'sent' && invoice.status !== 'overdue') {
        throw new AppError('Only sent or overdue invoices can be reminded', 400);
      }

      // Determine reminder template and subject
      const reminderTemplates = {
        gentle: {
          template: 'invoice_reminder_gentle',
          subjectPrefix: 'Friendly reminder',
        },
        firm: {
          template: 'invoice_reminder_firm',
          subjectPrefix: 'Payment reminder',
        },
        final: {
          template: 'invoice_reminder_final',
          subjectPrefix: 'Final notice',
        },
      };

      const reminderConfig = reminderTemplates[validated.reminderType];
      const subject = validated.subject || `${reminderConfig.subjectPrefix}: Invoice ${invoice.invoiceNumber}`;
      const message = validated.message || '';

      await emailOutboxService.enqueue({
        recipientEmail: 'client@example.com', // TODO: Get from organization/invoice
        recipientName: 'Client',
        subject,
        templateName: reminderConfig.template,
        templateData: {
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: invoice.totalAmount,
          currency: invoice.currency,
          dueDate: invoice.dueDate,
          reminderType: validated.reminderType,
          customMessage: message,
          additionalFees: validated.additionalFees,
        },
        organizationId: context.organizationId!,
      }, trx);

      // Log reminder
      await trx.insertInto('invoice_reminders').values({
        id: uuidv4(),
        invoice_id: id,
        reminder_type: validated.reminderType,
        sent_to: 'client@example.com', // TODO: Get from organization/invoice
        subject,
        message,
        additional_fees: validated.additionalFees,
        sent_by: context.userId,
        sent_at: new Date().toISOString(),
      }).execute();

      // Log audit
      await auditService.log({
        organizationId: context.organizationId!,
        userId: context.userId,
        action: AuditAction.INVOICE_REMINDER_SENT,
        resourceType: 'invoice',
        resourceId: id,
        details: {
          reminderType: validated.reminderType,
          subject,
          additionalFees: validated.additionalFees,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      }, trx);
    });

    logger.info('Invoice reminder sent', {
      invoiceId: id,
      reminderType: validated.reminderType,
      organizationId: context.organizationId,
      userId: context.userId
    });
  }

  async getInvoices(filters: InvoiceFilters, organizationId: string): Promise<InvoiceList> {
    const validated = await InvoiceFilters.parseAsync(filters);
    
    const { page = 1, limit = 20, ...filterParams } = validated;
    const offset = (page - 1) * limit;

    let query = db
      .selectFrom('invoices')
      .leftJoin('users as creator', 'invoices.created_by', 'creator.id')
      .select([
        'invoices.id',
        'invoices.organization_id as organizationId',
        'invoices.invoice_number as invoiceNumber',
        'invoices.type',
        'invoices.status',
        'invoices.issue_date as issueDate',
        'invoices.due_date as dueDate',
        'invoices.paid_date as paidDate',
        'invoices.total_amount as totalAmount',
        'invoices.currency',
        'creator.first_name as creatorFirstName',
        'creator.last_name as creatorLastName',
        'invoices.created_at as createdAt',
        'invoices.updated_at as updatedAt',
      ])
      .where('invoices.organization_id', '=', organizationId)
      .where('invoices.deleted_at', 'is', null);

    // Apply filters
    if (filterParams.search) {
      query = query.where((eb) =>
        eb.or([
          eb('invoices.invoice_number', 'ilike', `%${filterParams.search}%`),
          eb('invoices.notes', 'ilike', `%${filterParams.search}%`),
        ])
      );
    }

    if (filterParams.type) {
      query = query.where('invoices.type', '=', filterParams.type);
    }

    if (filterParams.status) {
      query = query.where('invoices.status', '=', filterParams.status);
    }

    if (filterParams.createdBy) {
      query = query.where('invoices.created_by', '=', filterParams.createdBy);
    }

    if (filterParams.issuedAfter) {
      query = query.where('invoices.issue_date', '>=', filterParams.issuedAfter);
    }

    if (filterParams.issuedBefore) {
      query = query.where('invoices.issue_date', '<=', filterParams.issuedBefore);
    }

    if (filterParams.dueAfter) {
      query = query.where('invoices.due_date', '>=', filterParams.dueAfter);
    }

    if (filterParams.dueBefore) {
      query = query.where('invoices.due_date', '<=', filterParams.dueBefore);
    }

    if (filterParams.amountMin !== undefined) {
      query = query.where('invoices.total_amount', '>=', filterParams.amountMin);
    }

    if (filterParams.amountMax !== undefined) {
      query = query.where('invoices.total_amount', '<=', filterParams.amountMax);
    }

    if (filterParams.currency) {
      query = query.where('invoices.currency', '=', filterParams.currency);
    }

    // Get total count
    const totalResult = await query.clearSelect().select(db.fn.count('invoices.id').as('count')).executeTakeFirst();
    const total = Number(totalResult?.count || 0);

    // Get paginated results
    const rows = await query
      .orderBy('invoices.created_at', 'desc')
      .offset(offset)
      .limit(limit)
      .execute();

    const invoices = rows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      invoiceNumber: row.invoiceNumber,
      type: row.type as InvoiceType,
      status: row.status as InvoiceStatus,
      issueDate: row.issueDate,
      dueDate: row.dueDate,
      paidDate: row.paidDate,
      totalAmount: row.totalAmount,
      currency: row.currency,
      creatorName: row.creatorFirstName ? `${row.creatorFirstName} ${row.creatorLastName}`.trim() : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        hasNext: offset + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getInvoiceStats(organizationId: string): Promise<InvoiceStats> {
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`;
    const nextMonth = `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}-01`;

    const [
      totalResult,
      statusCounts,
      typeCounts,
      totalAmounts,
      overdueResult,
      thisMonthRevenue,
      lastMonthRevenue,
      avgPaymentDelay,
    ] = await Promise.all([
      // Total invoices
      db
        .selectFrom('invoices')
        .select(db.fn.count('id').as('count'))
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst(),

      // Status counts
      db
        .selectFrom('invoices')
        .select(['status', db.fn.count('id').as('count')])
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .groupBy('status')
        .execute(),

      // Type counts
      db
        .selectFrom('invoices')
        .select(['type', db.fn.count('id').as('count')])
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .groupBy('type')
        .execute(),

      // Total amounts by status
      db
        .selectFrom('invoices')
        .select(['status', db.fn.sum('total_amount').as('total')])
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .groupBy('status')
        .execute(),

      // Overdue count
      db
        .selectFrom('invoices')
        .select(db.fn.count('id').as('count'))
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .where('due_date', '<', now.toISOString())
        .where('status', 'in', ['sent', 'overdue'])
        .executeTakeFirst(),

      // This month revenue
      db
        .selectFrom('invoices')
        .select(db.fn.sum('total_amount').as('total'))
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .where('status', '=', 'paid')
        .where('paid_date', '>=', thisMonth)
        .where('paid_date', '<', nextMonth)
        .executeTakeFirst(),

      // Last month revenue
      db
        .selectFrom('invoices')
        .select(db.fn.sum('total_amount').as('total'))
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .where('status', '=', 'paid')
        .where('paid_date', '>=', lastMonthStr)
        .where('paid_date', '<', thisMonth)
        .executeTakeFirst(),

      // Average payment delay
      db
        .selectFrom('invoices')
        .select(db.fn.avg(
          db.fn('extract', ['days', db.fn('age', ['paid_date', 'due_date'])])
        ).as('avg_days'))
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .where('status', '=', 'paid')
        .where('paid_date', 'is not', null)
        .where('due_date', 'is not', null)
        .executeTakeFirst(),
    ]);

    const byStatus = statusCounts.reduce((acc, row) => {
      acc[row.status as InvoiceStatus] = Number(row.count);
      return acc;
    }, {} as Record<InvoiceStatus, number>);

    const byType = typeCounts.reduce((acc, row) => {
      acc[row.type as InvoiceType] = Number(row.count);
      return acc;
    }, {} as Record<InvoiceType, number>);

    const totalAmountsByStatus = totalAmounts.reduce((acc, row) => {
      acc[row.status as keyof typeof acc] = Number(row.total || 0);
      return acc;
    }, {
      drafted: 0,
      sent: 0,
      paid: 0,
      overdue: 0,
    });

    return {
      total: Number(totalResult?.count || 0),
      byStatus,
      byType,
      totalAmount: totalAmountsByStatus,
      averagePaymentDelay: Number(avgPaymentDelay?.avg_days || 0),
      overdueCount: Number(overdueResult?.count || 0),
      thisMonthRevenue: Number(thisMonthRevenue?.total || 0),
      lastMonthRevenue: Number(lastMonthRevenue?.total || 0),
    };
  }

  async deleteInvoice(id: string, organizationId: string, context: RequestContext): Promise<void> {
    await withTransaction(async (trx) => {
      // Check if invoice exists and can be deleted
      const invoice = await trx
        .selectFrom('invoices')
        .select(['id', 'invoice_number', 'status'])
        .where('id', '=', id)
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (!invoice) {
        throw new AppError('Invoice not found', 404);
      }

      // Check if invoice can be deleted (only draft invoices)
      if (invoice.status !== 'draft') {
        throw new AppError('Only draft invoices can be deleted', 400);
      }

      // Soft delete
      const now = new Date().toISOString();
      await trx
        .updateTable('invoices')
        .set({ deleted_at: now })
        .where('id', '=', id)
        .execute();

      // Log audit
      await auditService.log({
        organizationId,
        userId: context.userId,
        action: AuditAction.INVOICE_DELETED,
        resourceType: 'invoice',
        resourceId: id,
        details: { invoiceNumber: invoice.invoice_number },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      }, trx);
    });

    logger.info('Invoice deleted', {
      invoiceId: id,
      organizationId,
      userId: context.userId
    });
  }

  private async generateInvoiceNumber(type: InvoiceType, organizationId: string, trx: Transaction<any>): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    
    // Get prefix based on type
    const prefixes = {
      invoice: 'INV',
      quote: 'QUO',
      credit_note: 'CN',
    };
    const prefix = prefixes[type];

    // Count invoices of this type this year
    const count = await trx
      .selectFrom('invoices')
      .select(db.fn.count('id').as('count'))
      .where('organization_id', '=', organizationId)
      .where('type', '=', type)
      .where('created_at', '>=', `${year}-01-01`)
      .where('created_at', '<', `${year + 1}-01-01`)
      .executeTakeFirst();

    const number = String(Number(count?.count || 0) + 1).padStart(6, '0');
    return `${prefix}-${year}-${number}`;
  }

  private validateStatusTransition(currentStatus: InvoiceStatus, newStatus: InvoiceStatus): void {
    const validTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
      draft: ['sent', 'cancelled'],
      sent: ['paid', 'overdue', 'cancelled'],
      paid: [], // Paid invoices cannot change status
      overdue: ['paid', 'cancelled'],
      cancelled: ['draft'], // Can reactivate cancelled drafts
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new AppError(`Invalid status transition from ${currentStatus} to ${newStatus}`, 400);
    }
  }

  private async scheduleOverdueCheck(invoiceId: string, dueDate: string, trx: Transaction<any>): Promise<void> {
    // In a production system, you would schedule this with a job queue
    logger.info('Overdue check should be scheduled', {
      invoiceId,
      dueDate,
    });
  }

  private async sendPaymentConfirmation(invoiceId: string, context: RequestContext, trx: Transaction<any>): Promise<void> {
    const invoice = await this.getInvoiceById(invoiceId, context.organizationId!, trx);
    
    await emailOutboxService.enqueue({
      recipientEmail: 'client@example.com', // TODO: Get from organization/invoice
      recipientName: 'Client',
      subject: `Payment confirmation for invoice ${invoice.invoiceNumber}`,
      templateName: 'invoice_payment_confirmation',
      templateData: {
        invoiceNumber: invoice.invoiceNumber,
        totalAmount: invoice.totalAmount,
        currency: invoice.currency,
        paidDate: invoice.paidDate,
      },
      organizationId: context.organizationId!,
    }, trx);
  }
}

export const invoiceService = new InvoiceService();