import { db } from '@/lib/db';
import { AppError } from '@/lib/errors';
import logger from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from 'kysely';
import {
  CreateTicketInput,
  UpdateTicketInput,
  TicketFilters,
  Ticket,
  TicketList,
  TicketStats,
  TicketStatusTransition,
  TicketPriority,
  TicketStatus
} from '@nourx/shared';
import type { RequestContext } from '@/types/context';
import { withTransaction } from '@/lib/transaction';
import { AuditAction } from '@/types/audit';
import { auditService } from './audit.service';
import { emailOutboxService } from './emailOutbox.service';

export class TicketService {
  private readonly SLA_HOURS = {
    urgent: 2,
    high: 8,
    medium: 24,
    low: 72
  };

  private readonly SLA_RESPONSE_HOURS = {
    urgent: 0.5, // 30 minutes
    high: 2,
    medium: 8,
    low: 24
  };

  async createTicket(input: CreateTicketInput, context: RequestContext): Promise<Ticket> {
    const validated = await CreateTicketInput.parseAsync(input);

    const result = await withTransaction(async (trx) => {
      const id = uuidv4();
      const now = new Date();
      
      // Calculate SLA deadline based on priority
      const slaHours = this.SLA_HOURS[validated.priority];
      const slaDeadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000);
      
      // Calculate first response deadline
      const responseHours = this.SLA_RESPONSE_HOURS[validated.priority];
      const firstResponseDeadline = new Date(now.getTime() + responseHours * 60 * 60 * 1000);

      // Generate ticket number (format: TICKET-YYYY-NNNNNN)
      const year = now.getFullYear();
      const count = await trx
        .selectFrom('tickets')
        .where('organization_id', '=', context.organizationId!)
        .where('created_at', '>=', `${year}-01-01`)
        .where('created_at', '<', `${year + 1}-01-01`)
        .execute();

      const ticketNumber = `TICKET-${year}-${String(count.length + 1).padStart(6, '0')}`;

      await trx.insertInto('tickets').values({
        id,
        organization_id: context.organizationId!,
        ticket_number: ticketNumber,
        title: validated.title,
        description: validated.description,
        priority: validated.priority,
        status: 'open',
        category_id: validated.categoryId,
        assigned_to: validated.assignedTo,
        requester_email: validated.requesterEmail,
        requester_name: validated.requesterName,
        source: validated.source,
        sla_deadline: slaDeadline.toISOString(),
        first_response_deadline: firstResponseDeadline.toISOString(),
        created_by: context.userId,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      }).execute();

      // Log audit
      await auditService.log({
        organizationId: context.organizationId!,
        userId: context.userId,
        action: AuditAction.TICKET_CREATED,
        resourceType: 'ticket',
        resourceId: id,
        details: {
          ticketNumber,
          priority: validated.priority,
          categoryId: validated.categoryId,
          assignedTo: validated.assignedTo,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      }, trx);

      // Send notification emails
      await this.sendTicketCreatedNotifications(id, validated, context, trx);

      // Schedule SLA monitoring
      await this.scheduleSLAChecks(id, slaDeadline, firstResponseDeadline, trx);

      return await this.getTicketById(id, context.organizationId!, trx);
    });

    logger.info('Ticket created', {
      ticketId: result.id,
      ticketNumber: result.ticketNumber,
      organizationId: context.organizationId,
      userId: context.userId
    });

    return result;
  }

  async getTicketById(id: string, organizationId: string, trx?: Transaction<any>): Promise<Ticket> {
    const query = (trx || db)
      .selectFrom('tickets')
      .leftJoin('ticket_categories', 'tickets.category_id', 'ticket_categories.id')
      .leftJoin('users as assignee', 'tickets.assigned_to', 'assignee.id')
      .leftJoin('users as creator', 'tickets.created_by', 'creator.id')
      .select([
        'tickets.id',
        'tickets.organization_id as organizationId',
        'tickets.ticket_number as ticketNumber',
        'tickets.title',
        'tickets.description',
        'tickets.priority',
        'tickets.status',
        'tickets.category_id as categoryId',
        'ticket_categories.name as categoryName',
        'tickets.assigned_to as assignedTo',
        'assignee.first_name as assigneeFirstName',
        'assignee.last_name as assigneeLastName',
        'tickets.requester_email as requesterEmail',
        'tickets.requester_name as requesterName',
        'tickets.source',
        'tickets.resolution',
        'tickets.sla_deadline as slaDeadline',
        'tickets.first_response_deadline as firstResponseDeadline',
        'tickets.first_response_at as firstResponseAt',
        'tickets.resolved_at as resolvedAt',
        'tickets.closed_at as closedAt',
        'tickets.created_by as createdBy',
        'creator.first_name as creatorFirstName',
        'creator.last_name as creatorLastName',
        'tickets.created_at as createdAt',
        'tickets.updated_at as updatedAt',
      ])
      .where('tickets.id', '=', id)
      .where('tickets.organization_id', '=', organizationId)
      .where('tickets.deleted_at', 'is', null);

    const row = await query.executeTakeFirst();
    if (!row) {
      throw new AppError('Ticket not found', 404);
    }

    // Calculate SLA status
    const slaStatus = this.calculateSLAStatus(row);

    return {
      id: row.id,
      organizationId: row.organizationId,
      ticketNumber: row.ticketNumber,
      title: row.title,
      description: row.description,
      priority: row.priority as TicketPriority,
      status: row.status as TicketStatus,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      assignedTo: row.assignedTo,
      assigneeName: row.assigneeFirstName ? `${row.assigneeFirstName} ${row.assigneeLastName}`.trim() : null,
      requesterEmail: row.requesterEmail,
      requesterName: row.requesterName,
      source: row.source,
      resolution: row.resolution,
      slaDeadline: row.slaDeadline,
      firstResponseDeadline: row.firstResponseDeadline,
      firstResponseAt: row.firstResponseAt,
      resolvedAt: row.resolvedAt,
      closedAt: row.closedAt,
      slaStatus: slaStatus.status,
      slaBreached: slaStatus.breached,
      minutesToSLABreach: slaStatus.minutesToBreach,
      createdBy: row.createdBy,
      creatorName: row.creatorFirstName ? `${row.creatorFirstName} ${row.creatorLastName}`.trim() : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async updateTicket(id: string, input: UpdateTicketInput, context: RequestContext): Promise<Ticket> {
    const validated = await UpdateTicketInput.parseAsync(input);

    const result = await withTransaction(async (trx) => {
      // Get current ticket
      const currentTicket = await this.getTicketById(id, context.organizationId!, trx);

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Track changes for audit
      const changes: Record<string, { from: any; to: any }> = {};

      if (validated.title !== undefined && validated.title !== currentTicket.title) {
        updateData.title = validated.title;
        changes.title = { from: currentTicket.title, to: validated.title };
      }

      if (validated.description !== undefined && validated.description !== currentTicket.description) {
        updateData.description = validated.description;
        changes.description = { from: currentTicket.description, to: validated.description };
      }

      if (validated.priority !== undefined && validated.priority !== currentTicket.priority) {
        updateData.priority = validated.priority;
        changes.priority = { from: currentTicket.priority, to: validated.priority };
        
        // Recalculate SLA deadlines if priority changed
        const slaHours = this.SLA_HOURS[validated.priority];
        const responseHours = this.SLA_RESPONSE_HOURS[validated.priority];
        const createdAt = new Date(currentTicket.createdAt);
        
        updateData.sla_deadline = new Date(createdAt.getTime() + slaHours * 60 * 60 * 1000).toISOString();
        
        if (!currentTicket.firstResponseAt) {
          updateData.first_response_deadline = new Date(createdAt.getTime() + responseHours * 60 * 60 * 1000).toISOString();
        }
      }

      if (validated.categoryId !== undefined && validated.categoryId !== currentTicket.categoryId) {
        updateData.category_id = validated.categoryId;
        changes.categoryId = { from: currentTicket.categoryId, to: validated.categoryId };
      }

      if (validated.assignedTo !== undefined && validated.assignedTo !== currentTicket.assignedTo) {
        updateData.assigned_to = validated.assignedTo;
        changes.assignedTo = { from: currentTicket.assignedTo, to: validated.assignedTo };
      }

      if (validated.resolution !== undefined && validated.resolution !== currentTicket.resolution) {
        updateData.resolution = validated.resolution;
        changes.resolution = { from: currentTicket.resolution, to: validated.resolution };
      }

      // Update ticket
      await trx
        .updateTable('tickets')
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
          action: AuditAction.TICKET_UPDATED,
          resourceType: 'ticket',
          resourceId: id,
          details: { changes },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        }, trx);

        // Send notification if assignment changed
        if (changes.assignedTo) {
          await this.sendTicketAssignedNotification(id, changes.assignedTo.to, context, trx);
        }
      }

      return await this.getTicketById(id, context.organizationId!, trx);
    });

    logger.info('Ticket updated', {
      ticketId: id,
      organizationId: context.organizationId,
      userId: context.userId
    });

    return result;
  }

  async changeTicketStatus(
    id: string, 
    newStatus: TicketStatus, 
    context: RequestContext,
    resolution?: string
  ): Promise<Ticket> {
    const result = await withTransaction(async (trx) => {
      // Get current ticket
      const currentTicket = await this.getTicketById(id, context.organizationId!, trx);
      
      // Validate status transition
      this.validateStatusTransition(currentTicket.status, newStatus);

      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      const now = new Date();

      // Set timestamps based on status
      if (newStatus === 'in_progress' && currentTicket.status === 'open') {
        // First response
        if (!currentTicket.firstResponseAt) {
          updateData.first_response_at = now.toISOString();
        }
      } else if (newStatus === 'resolved') {
        updateData.resolved_at = now.toISOString();
        if (resolution) {
          updateData.resolution = resolution;
        }
      } else if (newStatus === 'closed') {
        updateData.closed_at = now.toISOString();
        if (!currentTicket.resolvedAt) {
          updateData.resolved_at = now.toISOString();
        }
      } else if (newStatus === 'open' && currentTicket.status === 'closed') {
        // Reopening ticket
        updateData.resolved_at = null;
        updateData.closed_at = null;
      }

      // Update ticket
      await trx
        .updateTable('tickets')
        .set(updateData)
        .where('id', '=', id)
        .where('organization_id', '=', context.organizationId!)
        .where('deleted_at', 'is', null)
        .execute();

      // Log status transition
      await trx.insertInto('ticket_status_history').values({
        id: uuidv4(),
        ticket_id: id,
        from_status: currentTicket.status,
        to_status: newStatus,
        changed_by: context.userId,
        changed_at: now.toISOString(),
        reason: resolution || null,
      }).execute();

      // Log audit
      await auditService.log({
        organizationId: context.organizationId!,
        userId: context.userId,
        action: AuditAction.TICKET_STATUS_CHANGED,
        resourceType: 'ticket',
        resourceId: id,
        details: {
          fromStatus: currentTicket.status,
          toStatus: newStatus,
          resolution,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      }, trx);

      // Send status change notifications
      await this.sendStatusChangeNotification(id, currentTicket.status, newStatus, context, trx);

      return await this.getTicketById(id, context.organizationId!, trx);
    });

    logger.info('Ticket status changed', {
      ticketId: id,
      fromStatus: result.status,
      toStatus: newStatus,
      organizationId: context.organizationId,
      userId: context.userId
    });

    return result;
  }

  async getTickets(filters: TicketFilters, organizationId: string): Promise<TicketList> {
    const validated = await TicketFilters.parseAsync(filters);
    
    const { page = 1, limit = 10, ...filterParams } = validated;
    const offset = (page - 1) * limit;

    let query = db
      .selectFrom('tickets')
      .leftJoin('ticket_categories', 'tickets.category_id', 'ticket_categories.id')
      .leftJoin('users as assignee', 'tickets.assigned_to', 'assignee.id')
      .select([
        'tickets.id',
        'tickets.organization_id as organizationId',
        'tickets.ticket_number as ticketNumber',
        'tickets.title',
        'tickets.priority',
        'tickets.status',
        'ticket_categories.name as categoryName',
        'assignee.first_name as assigneeFirstName',
        'assignee.last_name as assigneeLastName',
        'tickets.requester_name as requesterName',
        'tickets.sla_deadline as slaDeadline',
        'tickets.created_at as createdAt',
        'tickets.updated_at as updatedAt',
      ])
      .where('tickets.organization_id', '=', organizationId)
      .where('tickets.deleted_at', 'is', null);

    // Apply filters
    if (filterParams.search) {
      query = query.where((eb) =>
        eb.or([
          eb('tickets.title', 'ilike', `%${filterParams.search}%`),
          eb('tickets.ticket_number', 'ilike', `%${filterParams.search}%`),
          eb('tickets.requester_name', 'ilike', `%${filterParams.search}%`),
        ])
      );
    }

    if (filterParams.status) {
      query = query.where('tickets.status', '=', filterParams.status);
    }

    if (filterParams.priority) {
      query = query.where('tickets.priority', '=', filterParams.priority);
    }

    if (filterParams.categoryId) {
      query = query.where('tickets.category_id', '=', filterParams.categoryId);
    }

    if (filterParams.assignedTo) {
      query = query.where('tickets.assigned_to', '=', filterParams.assignedTo);
    }

    if (filterParams.createdAfter) {
      query = query.where('tickets.created_at', '>=', filterParams.createdAfter);
    }

    if (filterParams.createdBefore) {
      query = query.where('tickets.created_at', '<=', filterParams.createdBefore);
    }

    if (filterParams.slaBreached !== undefined) {
      const now = new Date().toISOString();
      if (filterParams.slaBreached) {
        query = query.where('tickets.sla_deadline', '<', now);
      } else {
        query = query.where('tickets.sla_deadline', '>=', now);
      }
    }

    // Get total count
    const totalResult = await query.clearSelect().select(db.fn.count('tickets.id').as('count')).executeTakeFirst();
    const total = Number(totalResult?.count || 0);

    // Get paginated results
    const rows = await query
      .orderBy('tickets.created_at', 'desc')
      .offset(offset)
      .limit(limit)
      .execute();

    const tickets = rows.map((row) => {
      const slaStatus = this.calculateSLAStatus(row);
      
      return {
        id: row.id,
        organizationId: row.organizationId,
        ticketNumber: row.ticketNumber,
        title: row.title,
        priority: row.priority as TicketPriority,
        status: row.status as TicketStatus,
        categoryName: row.categoryName,
        assigneeName: row.assigneeFirstName ? `${row.assigneeFirstName} ${row.assigneeLastName}`.trim() : null,
        requesterName: row.requesterName,
        slaDeadline: row.slaDeadline,
        slaStatus: slaStatus.status,
        slaBreached: slaStatus.breached,
        minutesToSLABreach: slaStatus.minutesToBreach,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    });

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        hasNext: offset + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getTicketStats(organizationId: string): Promise<TicketStats> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalResult,
      statusCounts,
      priorityCounts,
      slaBreachedResult,
      avgResolutionResult,
      recentTickets
    ] = await Promise.all([
      // Total tickets
      db
        .selectFrom('tickets')
        .select(db.fn.count('id').as('count'))
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst(),

      // Status counts
      db
        .selectFrom('tickets')
        .select(['status', db.fn.count('id').as('count')])
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .groupBy('status')
        .execute(),

      // Priority counts
      db
        .selectFrom('tickets')
        .select(['priority', db.fn.count('id').as('count')])
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .groupBy('priority')
        .execute(),

      // SLA breached
      db
        .selectFrom('tickets')
        .select(db.fn.count('id').as('count'))
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .where('sla_deadline', '<', now.toISOString())
        .where('status', '!=', 'closed')
        .executeTakeFirst(),

      // Average resolution time
      db
        .selectFrom('tickets')
        .select(db.fn.avg(
          db.fn('extract', ['epoch', db.fn('age', ['resolved_at', 'created_at'])])
        ).as('avg_seconds'))
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .where('resolved_at', 'is not', null)
        .executeTakeFirst(),

      // Recent tickets (last 30 days)
      db
        .selectFrom('tickets')
        .select(db.fn.count('id').as('count'))
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .where('created_at', '>=', thirtyDaysAgo.toISOString())
        .executeTakeFirst(),
    ]);

    const byStatus = statusCounts.reduce((acc, row) => {
      acc[row.status as TicketStatus] = Number(row.count);
      return acc;
    }, {} as Record<TicketStatus, number>);

    const byPriority = priorityCounts.reduce((acc, row) => {
      acc[row.priority as TicketPriority] = Number(row.count);
      return acc;
    }, {} as Record<TicketPriority, number>);

    return {
      total: Number(totalResult?.count || 0),
      byStatus,
      byPriority,
      slaBreached: Number(slaBreachedResult?.count || 0),
      averageResolutionHours: avgResolutionResult?.avg_seconds 
        ? Number(avgResolutionResult.avg_seconds) / 3600 
        : 0,
      recentTickets: Number(recentTickets?.count || 0),
    };
  }

  async deleteTicket(id: string, organizationId: string, context: RequestContext): Promise<void> {
    const result = await withTransaction(async (trx) => {
      // Check if ticket exists
      const ticket = await trx
        .selectFrom('tickets')
        .select(['id', 'ticket_number'])
        .where('id', '=', id)
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (!ticket) {
        throw new AppError('Ticket not found', 404);
      }

      // Soft delete
      const now = new Date().toISOString();
      await trx
        .updateTable('tickets')
        .set({ deleted_at: now })
        .where('id', '=', id)
        .execute();

      // Log audit
      await auditService.log({
        organizationId,
        userId: context.userId,
        action: AuditAction.TICKET_DELETED,
        resourceType: 'ticket',
        resourceId: id,
        details: { ticketNumber: ticket.ticket_number },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      }, trx);
    });

    logger.info('Ticket deleted', {
      ticketId: id,
      organizationId,
      userId: context.userId
    });
  }

  private calculateSLAStatus(ticket: any): { 
    status: 'on_track' | 'at_risk' | 'breached', 
    breached: boolean, 
    minutesToBreach: number | null 
  } {
    const now = new Date();
    const slaDeadline = new Date(ticket.slaDeadline);
    const minutesToBreach = Math.ceil((slaDeadline.getTime() - now.getTime()) / (1000 * 60));

    if (minutesToBreach < 0) {
      return { status: 'breached', breached: true, minutesToBreach: null };
    }

    if (minutesToBreach <= 60) { // Less than 1 hour
      return { status: 'at_risk', breached: false, minutesToBreach };
    }

    return { status: 'on_track', breached: false, minutesToBreach };
  }

  private validateStatusTransition(currentStatus: TicketStatus, newStatus: TicketStatus): void {
    const validTransitions: Record<TicketStatus, TicketStatus[]> = {
      open: ['in_progress', 'resolved', 'closed'],
      in_progress: ['open', 'resolved', 'closed'],
      resolved: ['closed', 'open'], // Can reopen
      closed: ['open'], // Can reopen
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new AppError(`Invalid status transition from ${currentStatus} to ${newStatus}`, 400);
    }
  }

  private async sendTicketCreatedNotifications(
    ticketId: string, 
    ticketData: CreateTicketInput, 
    context: RequestContext, 
    trx: Transaction<any>
  ): Promise<void> {
    // Send email to requester
    await emailOutboxService.enqueue({
      recipientEmail: ticketData.requesterEmail,
      recipientName: ticketData.requesterName,
      subject: `Ticket Created: ${ticketData.title}`,
      templateName: 'ticket_created',
      templateData: {
        ticketNumber: ticketId, // Will be replaced with actual ticket number
        title: ticketData.title,
        priority: ticketData.priority,
        requesterName: ticketData.requesterName,
      },
      organizationId: context.organizationId!,
    }, trx);

    // Send email to assignee if assigned
    if (ticketData.assignedTo) {
      await emailOutboxService.enqueue({
        recipientId: ticketData.assignedTo,
        subject: `New Ticket Assigned: ${ticketData.title}`,
        templateName: 'ticket_assigned',
        templateData: {
          ticketNumber: ticketId,
          title: ticketData.title,
          priority: ticketData.priority,
          requesterName: ticketData.requesterName,
        },
        organizationId: context.organizationId!,
      }, trx);
    }
  }

  private async sendTicketAssignedNotification(
    ticketId: string, 
    assigneeId: string, 
    context: RequestContext, 
    trx: Transaction<any>
  ): Promise<void> {
    const ticket = await this.getTicketById(ticketId, context.organizationId!, trx);
    
    await emailOutboxService.enqueue({
      recipientId: assigneeId,
      subject: `Ticket Assigned: ${ticket.title}`,
      templateName: 'ticket_assigned',
      templateData: {
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        priority: ticket.priority,
        requesterName: ticket.requesterName,
      },
      organizationId: context.organizationId!,
    }, trx);
  }

  private async sendStatusChangeNotification(
    ticketId: string, 
    fromStatus: TicketStatus, 
    toStatus: TicketStatus, 
    context: RequestContext, 
    trx: Transaction<any>
  ): Promise<void> {
    const ticket = await this.getTicketById(ticketId, context.organizationId!, trx);
    
    await emailOutboxService.enqueue({
      recipientEmail: ticket.requesterEmail,
      recipientName: ticket.requesterName,
      subject: `Ticket Status Updated: ${ticket.title}`,
      templateName: 'ticket_status_changed',
      templateData: {
        ticketNumber: ticket.ticketNumber,
        title: ticket.title,
        fromStatus,
        toStatus,
        requesterName: ticket.requesterName,
      },
      organizationId: context.organizationId!,
    }, trx);
  }

  private async scheduleSLAChecks(
    ticketId: string, 
    slaDeadline: Date, 
    firstResponseDeadline: Date, 
    trx: Transaction<any>
  ): Promise<void> {
    // In a production system, you would schedule these with a job queue like Bull or Agenda
    // For now, we'll just log that they should be scheduled
    logger.info('SLA checks should be scheduled', {
      ticketId,
      slaDeadline: slaDeadline.toISOString(),
      firstResponseDeadline: firstResponseDeadline.toISOString(),
    });
  }
}

export const ticketService = new TicketService();