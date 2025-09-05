import { db } from '@/lib/db';
import { AppError } from '@/lib/errors';
import logger from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from 'kysely';
import {
  CreateTicketReplyInput,
  UpdateTicketReplyInput,
  TicketReplyFilters,
  TicketReply,
  TicketReplyList,
  TicketReplyType,
} from '@nourx/shared';
import type { RequestContext } from '@/types/context';
import { withTransaction } from '@/lib/transaction';
import { AuditAction } from '@/types/audit';
import { auditService } from './audit.service';
import { emailOutboxService } from './emailOutbox.service';
import { fileStorageService } from './fileStorage.service';
import { ticketService } from './ticket.service';

export class TicketReplyService {
  async createReply(input: CreateTicketReplyInput, context: RequestContext): Promise<TicketReply> {
    const validated = await CreateTicketReplyInput.parseAsync(input);

    const result = await withTransaction(async (trx) => {
      const id = uuidv4();
      const now = new Date().toISOString();

      // Verify ticket exists and user has access
      const ticket = await trx
        .selectFrom('tickets')
        .select(['id', 'title', 'requester_email', 'requester_name', 'assigned_to', 'first_response_at'])
        .where('id', '=', validated.ticketId)
        .where('organization_id', '=', context.organizationId!)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (!ticket) {
        throw new AppError('Ticket not found', 404);
      }

      await trx.insertInto('ticket_replies').values({
        id,
        ticket_id: validated.ticketId,
        type: validated.type,
        content: validated.content,
        is_internal: validated.isInternal,
        created_by: context.userId,
        created_at: now,
        updated_at: now,
      }).execute();

      // Handle file attachments if any
      if (validated.attachments && validated.attachments.length > 0) {
        const attachmentPromises = validated.attachments.map(async (attachment) => {
          const attachmentId = uuidv4();
          
          await trx.insertInto('ticket_reply_attachments').values({
            id: attachmentId,
            reply_id: id,
            filename: attachment.filename,
            original_name: attachment.originalName,
            mime_type: attachment.mimeType,
            file_size: attachment.fileSize,
            file_path: attachment.filePath,
            created_at: now,
          }).execute();

          return attachmentId;
        });

        await Promise.all(attachmentPromises);
      }

      // Update ticket's first response timestamp if this is the first agent reply
      if (!ticket.first_response_at && validated.type === 'agent_reply' && !validated.isInternal) {
        await trx
          .updateTable('tickets')
          .set({ 
            first_response_at: now,
            updated_at: now,
          })
          .where('id', '=', validated.ticketId)
          .execute();
      }

      // Auto-assign ticket if it's unassigned and this is an agent reply
      if (!ticket.assigned_to && validated.type === 'agent_reply') {
        await trx
          .updateTable('tickets')
          .set({ 
            assigned_to: context.userId,
            updated_at: now,
          })
          .where('id', '=', validated.ticketId)
          .execute();
      }

      // Log audit
      await auditService.log({
        organizationId: context.organizationId!,
        userId: context.userId,
        action: AuditAction.TICKET_REPLY_CREATED,
        resourceType: 'ticket_reply',
        resourceId: id,
        details: {
          ticketId: validated.ticketId,
          type: validated.type,
          isInternal: validated.isInternal,
          hasAttachments: validated.attachments && validated.attachments.length > 0,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      }, trx);

      // Send email notifications for external replies
      if (!validated.isInternal && validated.type === 'agent_reply') {
        await this.sendReplyNotification(id, ticket, context, trx);
      }

      return await this.getReplyById(id, context.organizationId!, trx);
    });

    logger.info('Ticket reply created', {
      replyId: result.id,
      ticketId: validated.ticketId,
      type: validated.type,
      organizationId: context.organizationId,
      userId: context.userId
    });

    return result;
  }

  async getReplyById(id: string, organizationId: string, trx?: Transaction<any>): Promise<TicketReply> {
    const query = (trx || db)
      .selectFrom('ticket_replies')
      .innerJoin('tickets', 'ticket_replies.ticket_id', 'tickets.id')
      .leftJoin('users as author', 'ticket_replies.created_by', 'author.id')
      .select([
        'ticket_replies.id',
        'ticket_replies.ticket_id as ticketId',
        'ticket_replies.type',
        'ticket_replies.content',
        'ticket_replies.is_internal as isInternal',
        'ticket_replies.created_by as createdBy',
        'author.first_name as authorFirstName',
        'author.last_name as authorLastName',
        'author.email as authorEmail',
        'ticket_replies.created_at as createdAt',
        'ticket_replies.updated_at as updatedAt',
      ])
      .where('ticket_replies.id', '=', id)
      .where('tickets.organization_id', '=', organizationId)
      .where('tickets.deleted_at', 'is', null);

    const row = await query.executeTakeFirst();
    if (!row) {
      throw new AppError('Ticket reply not found', 404);
    }

    // Get attachments
    const attachments = await (trx || db)
      .selectFrom('ticket_reply_attachments')
      .select([
        'id',
        'filename',
        'original_name as originalName',
        'mime_type as mimeType',
        'file_size as fileSize',
        'file_path as filePath',
        'created_at as createdAt',
      ])
      .where('reply_id', '=', id)
      .execute();

    return {
      id: row.id,
      ticketId: row.ticketId,
      type: row.type as TicketReplyType,
      content: row.content,
      isInternal: row.isInternal,
      createdBy: row.createdBy,
      authorName: row.authorFirstName ? `${row.authorFirstName} ${row.authorLastName}`.trim() : null,
      authorEmail: row.authorEmail,
      attachments: attachments.map(att => ({
        id: att.id,
        filename: att.filename,
        originalName: att.originalName,
        mimeType: att.mimeType,
        fileSize: att.fileSize,
        filePath: att.filePath,
        createdAt: att.createdAt,
      })),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async updateReply(id: string, input: UpdateTicketReplyInput, context: RequestContext): Promise<TicketReply> {
    const validated = await UpdateTicketReplyInput.parseAsync(input);

    const result = await withTransaction(async (trx) => {
      // Get current reply and verify access
      const currentReply = await trx
        .selectFrom('ticket_replies')
        .innerJoin('tickets', 'ticket_replies.ticket_id', 'tickets.id')
        .select([
          'ticket_replies.id',
          'ticket_replies.content',
          'ticket_replies.created_by',
          'ticket_replies.created_at',
          'tickets.organization_id',
        ])
        .where('ticket_replies.id', '=', id)
        .where('tickets.organization_id', '=', context.organizationId!)
        .where('tickets.deleted_at', 'is', null)
        .executeTakeFirst();

      if (!currentReply) {
        throw new AppError('Ticket reply not found', 404);
      }

      // Check if user can edit this reply (only creator or admins)
      if (currentReply.created_by !== context.userId && !context.roles.includes('admin')) {
        throw new AppError('You can only edit your own replies', 403);
      }

      // Check edit time limit (e.g., 15 minutes)
      const createdAt = new Date(currentReply.created_at);
      const now = new Date();
      const minutesSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60);
      
      if (minutesSinceCreated > 15 && !context.roles.includes('admin')) {
        throw new AppError('Reply can only be edited within 15 minutes of creation', 400);
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Track changes for audit
      const changes: Record<string, { from: any; to: any }> = {};

      if (validated.content !== undefined && validated.content !== currentReply.content) {
        updateData.content = validated.content;
        changes.content = { from: currentReply.content, to: validated.content };
      }

      // Update reply
      await trx
        .updateTable('ticket_replies')
        .set(updateData)
        .where('id', '=', id)
        .execute();

      // Log audit
      if (Object.keys(changes).length > 0) {
        await auditService.log({
          organizationId: context.organizationId!,
          userId: context.userId,
          action: AuditAction.TICKET_REPLY_UPDATED,
          resourceType: 'ticket_reply',
          resourceId: id,
          details: { changes },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        }, trx);
      }

      return await this.getReplyById(id, context.organizationId!, trx);
    });

    logger.info('Ticket reply updated', {
      replyId: id,
      organizationId: context.organizationId,
      userId: context.userId
    });

    return result;
  }

  async getRepliesByTicket(ticketId: string, filters: TicketReplyFilters, organizationId: string): Promise<TicketReplyList> {
    const validated = await TicketReplyFilters.parseAsync(filters);
    
    const { page = 1, limit = 50, ...filterParams } = validated;
    const offset = (page - 1) * limit;

    // Verify ticket exists and user has access
    const ticket = await db
      .selectFrom('tickets')
      .select('id')
      .where('id', '=', ticketId)
      .where('organization_id', '=', organizationId)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    if (!ticket) {
      throw new AppError('Ticket not found', 404);
    }

    let query = db
      .selectFrom('ticket_replies')
      .leftJoin('users as author', 'ticket_replies.created_by', 'author.id')
      .select([
        'ticket_replies.id',
        'ticket_replies.ticket_id as ticketId',
        'ticket_replies.type',
        'ticket_replies.content',
        'ticket_replies.is_internal as isInternal',
        'ticket_replies.created_by as createdBy',
        'author.first_name as authorFirstName',
        'author.last_name as authorLastName',
        'author.email as authorEmail',
        'ticket_replies.created_at as createdAt',
        'ticket_replies.updated_at as updatedAt',
      ])
      .where('ticket_replies.ticket_id', '=', ticketId);

    // Apply filters
    if (filterParams.type) {
      query = query.where('ticket_replies.type', '=', filterParams.type);
    }

    if (filterParams.isInternal !== undefined) {
      query = query.where('ticket_replies.is_internal', '=', filterParams.isInternal);
    }

    if (filterParams.createdBy) {
      query = query.where('ticket_replies.created_by', '=', filterParams.createdBy);
    }

    if (filterParams.createdAfter) {
      query = query.where('ticket_replies.created_at', '>=', filterParams.createdAfter);
    }

    if (filterParams.createdBefore) {
      query = query.where('ticket_replies.created_at', '<=', filterParams.createdBefore);
    }

    // Get total count
    const totalResult = await query.clearSelect().select(db.fn.count('ticket_replies.id').as('count')).executeTakeFirst();
    const total = Number(totalResult?.count || 0);

    // Get paginated results
    const rows = await query
      .orderBy('ticket_replies.created_at', 'asc')
      .offset(offset)
      .limit(limit)
      .execute();

    // Get attachments for all replies in batch
    const replyIds = rows.map(row => row.id);
    const attachments = replyIds.length > 0 ? await db
      .selectFrom('ticket_reply_attachments')
      .select([
        'id',
        'reply_id as replyId',
        'filename',
        'original_name as originalName',
        'mime_type as mimeType',
        'file_size as fileSize',
        'file_path as filePath',
        'created_at as createdAt',
      ])
      .where('reply_id', 'in', replyIds)
      .execute() : [];

    // Group attachments by reply ID
    const attachmentsByReply = attachments.reduce((acc, att) => {
      if (!acc[att.replyId]) {
        acc[att.replyId] = [];
      }
      acc[att.replyId].push({
        id: att.id,
        filename: att.filename,
        originalName: att.originalName,
        mimeType: att.mimeType,
        fileSize: att.fileSize,
        filePath: att.filePath,
        createdAt: att.createdAt,
      });
      return acc;
    }, {} as Record<string, any[]>);

    const replies = rows.map((row) => ({
      id: row.id,
      ticketId: row.ticketId,
      type: row.type as TicketReplyType,
      content: row.content,
      isInternal: row.isInternal,
      createdBy: row.createdBy,
      authorName: row.authorFirstName ? `${row.authorFirstName} ${row.authorLastName}`.trim() : null,
      authorEmail: row.authorEmail,
      attachments: attachmentsByReply[row.id] || [],
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return {
      replies,
      pagination: {
        page,
        limit,
        total,
        hasNext: offset + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async deleteReply(id: string, organizationId: string, context: RequestContext): Promise<void> {
    const result = await withTransaction(async (trx) => {
      // Get reply and verify access
      const reply = await trx
        .selectFrom('ticket_replies')
        .innerJoin('tickets', 'ticket_replies.ticket_id', 'tickets.id')
        .select([
          'ticket_replies.id',
          'ticket_replies.created_by',
          'ticket_replies.created_at',
          'tickets.organization_id',
        ])
        .where('ticket_replies.id', '=', id)
        .where('tickets.organization_id', '=', organizationId)
        .where('tickets.deleted_at', 'is', null)
        .executeTakeFirst();

      if (!reply) {
        throw new AppError('Ticket reply not found', 404);
      }

      // Check if user can delete this reply (only creator or admins)
      if (reply.created_by !== context.userId && !context.roles.includes('admin')) {
        throw new AppError('You can only delete your own replies', 403);
      }

      // Check delete time limit (e.g., 30 minutes)
      const createdAt = new Date(reply.created_at);
      const now = new Date();
      const minutesSinceCreated = (now.getTime() - createdAt.getTime()) / (1000 * 60);
      
      if (minutesSinceCreated > 30 && !context.roles.includes('admin')) {
        throw new AppError('Reply can only be deleted within 30 minutes of creation', 400);
      }

      // Delete reply attachments first
      const attachments = await trx
        .selectFrom('ticket_reply_attachments')
        .select(['id', 'file_path'])
        .where('reply_id', '=', id)
        .execute();

      // Delete attachment files from storage
      for (const attachment of attachments) {
        try {
          await fileStorageService.deleteFile(attachment.file_path);
        } catch (error) {
          logger.warn('Failed to delete attachment file', { 
            attachmentId: attachment.id, 
            filePath: attachment.file_path, 
            error 
          });
        }
      }

      // Delete attachment records
      await trx
        .deleteFrom('ticket_reply_attachments')
        .where('reply_id', '=', id)
        .execute();

      // Delete reply
      await trx
        .deleteFrom('ticket_replies')
        .where('id', '=', id)
        .execute();

      // Log audit
      await auditService.log({
        organizationId,
        userId: context.userId,
        action: AuditAction.TICKET_REPLY_DELETED,
        resourceType: 'ticket_reply',
        resourceId: id,
        details: { attachmentCount: attachments.length },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      }, trx);
    });

    logger.info('Ticket reply deleted', {
      replyId: id,
      organizationId,
      userId: context.userId
    });
  }

  async addAttachment(
    replyId: string, 
    file: { buffer: Buffer; filename: string; mimeType: string }, 
    context: RequestContext
  ): Promise<{ id: string; filename: string; originalName: string; fileSize: number }> {
    const result = await withTransaction(async (trx) => {
      // Verify reply exists and user has access
      const reply = await trx
        .selectFrom('ticket_replies')
        .innerJoin('tickets', 'ticket_replies.ticket_id', 'tickets.id')
        .select([
          'ticket_replies.id',
          'ticket_replies.created_by',
          'tickets.organization_id',
        ])
        .where('ticket_replies.id', '=', replyId)
        .where('tickets.organization_id', '=', context.organizationId!)
        .where('tickets.deleted_at', 'is', null)
        .executeTakeFirst();

      if (!reply) {
        throw new AppError('Ticket reply not found', 404);
      }

      // Check if user can add attachments (only creator or admins)
      if (reply.created_by !== context.userId && !context.roles.includes('admin')) {
        throw new AppError('You can only add attachments to your own replies', 403);
      }

      // Store file
      const storedFile = await fileStorageService.storeFile(
        file.buffer,
        file.filename,
        file.mimeType,
        `ticket-reply-attachments/${replyId}`
      );

      const attachmentId = uuidv4();
      const now = new Date().toISOString();

      // Save attachment record
      await trx.insertInto('ticket_reply_attachments').values({
        id: attachmentId,
        reply_id: replyId,
        filename: storedFile.filename,
        original_name: file.filename,
        mime_type: file.mimeType,
        file_size: file.buffer.length,
        file_path: storedFile.path,
        created_at: now,
      }).execute();

      // Log audit
      await auditService.log({
        organizationId: context.organizationId!,
        userId: context.userId,
        action: AuditAction.TICKET_REPLY_ATTACHMENT_ADDED,
        resourceType: 'ticket_reply',
        resourceId: replyId,
        details: {
          attachmentId,
          filename: file.filename,
          fileSize: file.buffer.length,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      }, trx);

      return {
        id: attachmentId,
        filename: storedFile.filename,
        originalName: file.filename,
        fileSize: file.buffer.length,
      };
    });

    logger.info('Ticket reply attachment added', {
      attachmentId: result.id,
      replyId,
      organizationId: context.organizationId,
      userId: context.userId
    });

    return result;
  }

  async removeAttachment(attachmentId: string, context: RequestContext): Promise<void> {
    await withTransaction(async (trx) => {
      // Get attachment and verify access
      const attachment = await trx
        .selectFrom('ticket_reply_attachments')
        .innerJoin('ticket_replies', 'ticket_reply_attachments.reply_id', 'ticket_replies.id')
        .innerJoin('tickets', 'ticket_replies.ticket_id', 'tickets.id')
        .select([
          'ticket_reply_attachments.id',
          'ticket_reply_attachments.file_path',
          'ticket_replies.created_by',
          'tickets.organization_id',
        ])
        .where('ticket_reply_attachments.id', '=', attachmentId)
        .where('tickets.organization_id', '=', context.organizationId!)
        .where('tickets.deleted_at', 'is', null)
        .executeTakeFirst();

      if (!attachment) {
        throw new AppError('Attachment not found', 404);
      }

      // Check if user can remove attachments (only creator or admins)
      if (attachment.created_by !== context.userId && !context.roles.includes('admin')) {
        throw new AppError('You can only remove attachments from your own replies', 403);
      }

      // Delete attachment file from storage
      try {
        await fileStorageService.deleteFile(attachment.file_path);
      } catch (error) {
        logger.warn('Failed to delete attachment file', { 
          attachmentId, 
          filePath: attachment.file_path, 
          error 
        });
      }

      // Delete attachment record
      await trx
        .deleteFrom('ticket_reply_attachments')
        .where('id', '=', attachmentId)
        .execute();

      // Log audit
      await auditService.log({
        organizationId: context.organizationId!,
        userId: context.userId,
        action: AuditAction.TICKET_REPLY_ATTACHMENT_REMOVED,
        resourceType: 'ticket_reply',
        resourceId: attachmentId,
        details: { attachmentId },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      }, trx);
    });

    logger.info('Ticket reply attachment removed', {
      attachmentId,
      organizationId: context.organizationId,
      userId: context.userId
    });
  }

  private async sendReplyNotification(
    replyId: string,
    ticket: { title: string; requester_email: string; requester_name: string },
    context: RequestContext,
    trx: Transaction<any>
  ): Promise<void> {
    await emailOutboxService.enqueue({
      recipientEmail: ticket.requester_email,
      recipientName: ticket.requester_name,
      subject: `Reply to your ticket: ${ticket.title}`,
      templateName: 'ticket_reply_notification',
      templateData: {
        ticketTitle: ticket.title,
        requesterName: ticket.requester_name,
        replyId,
      },
    });
  }
}

export const ticketReplyService = new TicketReplyService();
