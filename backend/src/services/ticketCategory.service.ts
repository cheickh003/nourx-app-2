import { db } from '@/lib/db';
import { AppError } from '@/lib/errors';
import logger from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from 'kysely';
import {
  CreateTicketCategoryInput,
  UpdateTicketCategoryInput,
  TicketCategoryFilters,
  TicketCategory,
  TicketCategoryList,
  TicketCategoryStats,
} from '@nourx/shared';
import type { RequestContext } from '@/types/context';
import { withTransaction } from '@/lib/transaction';
import { AuditAction } from '@/types/audit';
import { auditService } from './audit.service';

export class TicketCategoryService {
  async createCategory(input: CreateTicketCategoryInput, context: RequestContext): Promise<TicketCategory> {
    const validated = await CreateTicketCategoryInput.parseAsync(input);

    const result = await withTransaction(async (trx) => {
      const id = uuidv4();
      const now = new Date().toISOString();

      // Check if category name already exists
      const existingCategory = await trx
        .selectFrom('ticket_categories')
        .select('id')
        .where('organization_id', '=', context.organizationId!)
        .where('name', '=', validated.name)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (existingCategory) {
        throw new AppError('Category name already exists', 409);
      }

      // Get the highest order value for new category placement
      const highestOrderResult = await trx
        .selectFrom('ticket_categories')
        .select(trx.fn.max('order_index').as('maxOrder'))
        .where('organization_id', '=', context.organizationId!)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      const orderIndex = validated.orderIndex !== undefined 
        ? validated.orderIndex 
        : (Number(highestOrderResult?.maxOrder || -1) + 1);

      await trx.insertInto('ticket_categories').values({
        id,
        organization_id: context.organizationId!,
        name: validated.name,
        description: validated.description,
        color: validated.color,
        icon: validated.icon,
        is_active: validated.isActive,
        order_index: orderIndex,
        sla_hours: validated.slaHours,
        auto_assign_to: validated.autoAssignTo,
        created_by: context.userId,
        created_at: now,
        updated_at: now,
      }).execute();

      // Log audit
      await auditService.log({
        organizationId: context.organizationId!,
        userId: context.userId,
        action: AuditAction.TICKET_CATEGORY_CREATED,
        resourceType: 'ticket_category',
        resourceId: id,
        details: {
          name: validated.name,
          slaHours: validated.slaHours,
          autoAssignTo: validated.autoAssignTo,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      }, trx);

      return await this.getCategoryById(id, context.organizationId!, trx);
    });

    logger.info('Ticket category created', {
      categoryId: result.id,
      name: result.name,
      organizationId: context.organizationId,
      userId: context.userId
    });

    return result;
  }

  async getCategoryById(id: string, organizationId: string, trx?: Transaction<any>): Promise<TicketCategory> {
    const query = (trx || db)
      .selectFrom('ticket_categories')
      .leftJoin('users as assignee', 'ticket_categories.auto_assign_to', 'assignee.id')
      .leftJoin('users as creator', 'ticket_categories.created_by', 'creator.id')
      .select([
        'ticket_categories.id',
        'ticket_categories.organization_id as organizationId',
        'ticket_categories.name',
        'ticket_categories.description',
        'ticket_categories.color',
        'ticket_categories.icon',
        'ticket_categories.is_active as isActive',
        'ticket_categories.order_index as orderIndex',
        'ticket_categories.sla_hours as slaHours',
        'ticket_categories.auto_assign_to as autoAssignTo',
        'assignee.first_name as assigneeFirstName',
        'assignee.last_name as assigneeLastName',
        'ticket_categories.created_by as createdBy',
        'creator.first_name as creatorFirstName',
        'creator.last_name as creatorLastName',
        'ticket_categories.created_at as createdAt',
        'ticket_categories.updated_at as updatedAt',
      ])
      .where('ticket_categories.id', '=', id)
      .where('ticket_categories.organization_id', '=', organizationId)
      .where('ticket_categories.deleted_at', 'is', null);

    const row = await query.executeTakeFirst();
    if (!row) {
      throw new AppError('Ticket category not found', 404);
    }

    return {
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      description: row.description,
      color: row.color,
      icon: row.icon,
      isActive: row.isActive,
      orderIndex: row.orderIndex,
      slaHours: row.slaHours,
      autoAssignTo: row.autoAssignTo,
      autoAssigneeName: row.assigneeFirstName ? `${row.assigneeFirstName} ${row.assigneeLastName}`.trim() : null,
      createdBy: row.createdBy,
      creatorName: row.creatorFirstName ? `${row.creatorFirstName} ${row.creatorLastName}`.trim() : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async updateCategory(id: string, input: UpdateTicketCategoryInput, context: RequestContext): Promise<TicketCategory> {
    const validated = await UpdateTicketCategoryInput.parseAsync(input);

    const result = await withTransaction(async (trx) => {
      // Get current category
      const currentCategory = await this.getCategoryById(id, context.organizationId!, trx);

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Track changes for audit
      const changes: Record<string, { from: any; to: any }> = {};

      if (validated.name !== undefined && validated.name !== currentCategory.name) {
        // Check if new name already exists
        const existingCategory = await trx
          .selectFrom('ticket_categories')
          .select('id')
          .where('organization_id', '=', context.organizationId!)
          .where('name', '=', validated.name)
          .where('id', '!=', id)
          .where('deleted_at', 'is', null)
          .executeTakeFirst();

        if (existingCategory) {
          throw new AppError('Category name already exists', 409);
        }

        updateData.name = validated.name;
        changes.name = { from: currentCategory.name, to: validated.name };
      }

      if (validated.description !== undefined && validated.description !== currentCategory.description) {
        updateData.description = validated.description;
        changes.description = { from: currentCategory.description, to: validated.description };
      }

      if (validated.color !== undefined && validated.color !== currentCategory.color) {
        updateData.color = validated.color;
        changes.color = { from: currentCategory.color, to: validated.color };
      }

      if (validated.icon !== undefined && validated.icon !== currentCategory.icon) {
        updateData.icon = validated.icon;
        changes.icon = { from: currentCategory.icon, to: validated.icon };
      }

      if (validated.isActive !== undefined && validated.isActive !== currentCategory.isActive) {
        updateData.is_active = validated.isActive;
        changes.isActive = { from: currentCategory.isActive, to: validated.isActive };
      }

      if (validated.orderIndex !== undefined && validated.orderIndex !== currentCategory.orderIndex) {
        updateData.order_index = validated.orderIndex;
        changes.orderIndex = { from: currentCategory.orderIndex, to: validated.orderIndex };
      }

      if (validated.slaHours !== undefined && validated.slaHours !== currentCategory.slaHours) {
        updateData.sla_hours = validated.slaHours;
        changes.slaHours = { from: currentCategory.slaHours, to: validated.slaHours };
      }

      if (validated.autoAssignTo !== undefined && validated.autoAssignTo !== currentCategory.autoAssignTo) {
        updateData.auto_assign_to = validated.autoAssignTo;
        changes.autoAssignTo = { from: currentCategory.autoAssignTo, to: validated.autoAssignTo };
      }

      // Update category
      await trx
        .updateTable('ticket_categories')
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
          action: AuditAction.TICKET_CATEGORY_UPDATED,
          resourceType: 'ticket_category',
          resourceId: id,
          details: { changes },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        }, trx);
      }

      return await this.getCategoryById(id, context.organizationId!, trx);
    });

    logger.info('Ticket category updated', {
      categoryId: id,
      organizationId: context.organizationId,
      userId: context.userId
    });

    return result;
  }

  async getCategories(filters: TicketCategoryFilters, organizationId: string): Promise<TicketCategoryList> {
    const validated = await TicketCategoryFilters.parseAsync(filters);
    
    const { page = 1, limit = 50, ...filterParams } = validated;
    const offset = (page - 1) * limit;

    let query = db
      .selectFrom('ticket_categories')
      .leftJoin('users as assignee', 'ticket_categories.auto_assign_to', 'assignee.id')
      .select([
        'ticket_categories.id',
        'ticket_categories.organization_id as organizationId',
        'ticket_categories.name',
        'ticket_categories.description',
        'ticket_categories.color',
        'ticket_categories.icon',
        'ticket_categories.is_active as isActive',
        'ticket_categories.order_index as orderIndex',
        'ticket_categories.sla_hours as slaHours',
        'assignee.first_name as assigneeFirstName',
        'assignee.last_name as assigneeLastName',
        'ticket_categories.created_at as createdAt',
        'ticket_categories.updated_at as updatedAt',
      ])
      .where('ticket_categories.organization_id', '=', organizationId)
      .where('ticket_categories.deleted_at', 'is', null);

    // Apply filters
    if (filterParams.search) {
      query = query.where((eb) =>
        eb.or([
          eb('ticket_categories.name', 'ilike', `%${filterParams.search}%`),
          eb('ticket_categories.description', 'ilike', `%${filterParams.search}%`),
        ])
      );
    }

    if (filterParams.isActive !== undefined) {
      query = query.where('ticket_categories.is_active', '=', filterParams.isActive);
    }

    // Get total count
    const totalResult = await query.clearSelect().select(db.fn.count('ticket_categories.id').as('count')).executeTakeFirst();
    const total = Number(totalResult?.count || 0);

    // Get paginated results
    const rows = await query
      .orderBy('ticket_categories.order_index', 'asc')
      .orderBy('ticket_categories.name', 'asc')
      .offset(offset)
      .limit(limit)
      .execute();

    const categories = rows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      description: row.description,
      color: row.color,
      icon: row.icon,
      isActive: row.isActive,
      orderIndex: row.orderIndex,
      slaHours: row.slaHours,
      autoAssigneeName: row.assigneeFirstName ? `${row.assigneeFirstName} ${row.assigneeLastName}`.trim() : null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return {
      categories,
      pagination: {
        page,
        limit,
        total,
        hasNext: offset + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getCategoryStats(organizationId: string): Promise<TicketCategoryStats> {
    const [
      totalResult,
      activeResult,
      ticketCountsByCategory,
    ] = await Promise.all([
      // Total categories
      db
        .selectFrom('ticket_categories')
        .select(db.fn.count('id').as('count'))
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst(),

      // Active categories
      db
        .selectFrom('ticket_categories')
        .select(db.fn.count('id').as('count'))
        .where('organization_id', '=', organizationId)
        .where('is_active', '=', true)
        .where('deleted_at', 'is', null)
        .executeTakeFirst(),

      // Ticket counts by category
      db
        .selectFrom('ticket_categories')
        .leftJoin('tickets', (join) => 
          join
            .onRef('ticket_categories.id', '=', 'tickets.category_id')
            .on('tickets.deleted_at', 'is', null)
        )
        .select([
          'ticket_categories.id',
          'ticket_categories.name',
          db.fn.count('tickets.id').as('ticketCount')
        ])
        .where('ticket_categories.organization_id', '=', organizationId)
        .where('ticket_categories.deleted_at', 'is', null)
        .groupBy(['ticket_categories.id', 'ticket_categories.name'])
        .execute(),
    ]);

    const categoryUsage = ticketCountsByCategory.reduce((acc, row) => {
      acc[row.name] = Number(row.ticketCount);
      return acc;
    }, {} as Record<string, number>);

    const mostUsedCategories = ticketCountsByCategory
      .map(row => ({
        id: row.id,
        name: row.name,
        ticketCount: Number(row.ticketCount),
      }))
      .sort((a, b) => b.ticketCount - a.ticketCount)
      .slice(0, 5);

    return {
      total: Number(totalResult?.count || 0),
      active: Number(activeResult?.count || 0),
      categoryUsage,
      mostUsedCategories,
    };
  }

  async reorderCategories(categoryOrders: Array<{ id: string; orderIndex: number }>, context: RequestContext): Promise<void> {
    await withTransaction(async (trx) => {
      for (const { id, orderIndex } of categoryOrders) {
        await trx
          .updateTable('ticket_categories')
          .set({ 
            order_index: orderIndex,
            updated_at: new Date().toISOString()
          })
          .where('id', '=', id)
          .where('organization_id', '=', context.organizationId!)
          .where('deleted_at', 'is', null)
          .execute();
      }

      // Log audit
      await auditService.log({
        organizationId: context.organizationId!,
        userId: context.userId,
        action: AuditAction.TICKET_CATEGORIES_REORDERED,
        resourceType: 'ticket_category',
        resourceId: null,
        details: { categoryOrders },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      }, trx);
    });

    logger.info('Ticket categories reordered', {
      categoryCount: categoryOrders.length,
      organizationId: context.organizationId,
      userId: context.userId
    });
  }

  async toggleCategoryStatus(id: string, context: RequestContext): Promise<TicketCategory> {
    const result = await withTransaction(async (trx) => {
      // Get current category
      const currentCategory = await this.getCategoryById(id, context.organizationId!, trx);

      const newStatus = !currentCategory.isActive;

      // Update category
      await trx
        .updateTable('ticket_categories')
        .set({ 
          is_active: newStatus,
          updated_at: new Date().toISOString()
        })
        .where('id', '=', id)
        .where('organization_id', '=', context.organizationId!)
        .where('deleted_at', 'is', null)
        .execute();

      // Log audit
      await auditService.log({
        organizationId: context.organizationId!,
        userId: context.userId,
        action: newStatus ? AuditAction.TICKET_CATEGORY_ACTIVATED : AuditAction.TICKET_CATEGORY_DEACTIVATED,
        resourceType: 'ticket_category',
        resourceId: id,
        details: { 
          previousStatus: currentCategory.isActive,
          newStatus 
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      }, trx);

      return await this.getCategoryById(id, context.organizationId!, trx);
    });

    logger.info('Ticket category status toggled', {
      categoryId: id,
      newStatus: result.isActive,
      organizationId: context.organizationId,
      userId: context.userId
    });

    return result;
  }

  async deleteCategory(id: string, organizationId: string, context: RequestContext): Promise<void> {
    const result = await withTransaction(async (trx) => {
      // Check if category exists
      const category = await trx
        .selectFrom('ticket_categories')
        .select(['id', 'name'])
        .where('id', '=', id)
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (!category) {
        throw new AppError('Ticket category not found', 404);
      }

      // Check if category has tickets
      const ticketCount = await trx
        .selectFrom('tickets')
        .select(db.fn.count('id').as('count'))
        .where('category_id', '=', id)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (Number(ticketCount?.count || 0) > 0) {
        throw new AppError('Cannot delete category that has tickets assigned', 400);
      }

      // Soft delete
      const now = new Date().toISOString();
      await trx
        .updateTable('ticket_categories')
        .set({ deleted_at: now })
        .where('id', '=', id)
        .execute();

      // Log audit
      await auditService.log({
        organizationId,
        userId: context.userId,
        action: AuditAction.TICKET_CATEGORY_DELETED,
        resourceType: 'ticket_category',
        resourceId: id,
        details: { categoryName: category.name },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      }, trx);
    });

    logger.info('Ticket category deleted', {
      categoryId: id,
      organizationId,
      userId: context.userId
    });
  }

  async getActiveCategories(organizationId: string): Promise<TicketCategory[]> {
    const rows = await db
      .selectFrom('ticket_categories')
      .leftJoin('users as assignee', 'ticket_categories.auto_assign_to', 'assignee.id')
      .select([
        'ticket_categories.id',
        'ticket_categories.organization_id as organizationId',
        'ticket_categories.name',
        'ticket_categories.description',
        'ticket_categories.color',
        'ticket_categories.icon',
        'ticket_categories.is_active as isActive',
        'ticket_categories.order_index as orderIndex',
        'ticket_categories.sla_hours as slaHours',
        'ticket_categories.auto_assign_to as autoAssignTo',
        'assignee.first_name as assigneeFirstName',
        'assignee.last_name as assigneeLastName',
        'ticket_categories.created_by as createdBy',
        'ticket_categories.created_at as createdAt',
        'ticket_categories.updated_at as updatedAt',
      ])
      .where('ticket_categories.organization_id', '=', organizationId)
      .where('ticket_categories.is_active', '=', true)
      .where('ticket_categories.deleted_at', 'is', null)
      .orderBy('ticket_categories.order_index', 'asc')
      .orderBy('ticket_categories.name', 'asc')
      .execute();

    return rows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      description: row.description,
      color: row.color,
      icon: row.icon,
      isActive: row.isActive,
      orderIndex: row.orderIndex,
      slaHours: row.slaHours,
      autoAssignTo: row.autoAssignTo,
      autoAssigneeName: row.assigneeFirstName ? `${row.assigneeFirstName} ${row.assigneeLastName}`.trim() : null,
      createdBy: row.createdBy,
      creatorName: null, // Not needed for this endpoint
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  }
}

export const ticketCategoryService = new TicketCategoryService();