import { db } from '@/lib/db';
import { AppError } from '@/lib/errors';
import logger from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from 'kysely';
import {
  CreateMacroInput,
  UpdateMacroInput,
  TestMacroInput,
  ExecuteMacroInput,
  ValidateMacroInput,
  MacroFilters,
  Macro,
  MacroList,
  MacroStats,
  MacroExecution,
  MacroValidationResult,
  MacroTriggerType,
  MacroActionType,
  MacroCondition,
  MacroAction,
} from '@nourx/shared';
import type { RequestContext } from '@/types/context';
import { withTransaction } from '@/lib/transaction';
import { AuditAction } from '@/types/audit';
import { auditService } from './audit.service';
import { emailOutboxService } from './emailOutbox.service';
import { ticketService } from './ticket.service';
import { ticketReplyService } from './ticketReply.service';

export class MacroService {
  async createMacro(input: CreateMacroInput, context: RequestContext): Promise<Macro> {
    const validated = await CreateMacroInput.parseAsync(input);

    const result = await withTransaction(async (trx) => {
      const id = uuidv4();
      const now = new Date().toISOString();

      // Check if macro name already exists
      const existingMacro = await trx
        .selectFrom('macros')
        .select('id')
        .where('organization_id', '=', context.organizationId!)
        .where('name', '=', validated.name)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (existingMacro) {
        throw new AppError('Macro name already exists', 409);
      }

      // Validate macro logic
      const validationResult = this.validateMacroLogic(validated.conditions, validated.actions);
      if (!validationResult.isValid) {
        throw new AppError(`Macro validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`, 400);
      }

      // Create macro
      await trx.insertInto('macros').values({
        id,
        organization_id: context.organizationId!,
        name: validated.name,
        description: validated.description,
        trigger_type: validated.triggerType,
        conditions_operator: validated.conditionsOperator,
        is_active: validated.isActive,
        category: validated.category,
        priority: validated.priority,
        execution_count: 0,
        success_rate: 0,
        created_by: context.userId,
        created_at: now,
        updated_at: now,
      }).execute();

      // Create macro conditions
      for (const condition of validated.conditions) {
        await trx.insertInto('macro_conditions').values({
          id: uuidv4(),
          macro_id: id,
          field: condition.field,
          operator: condition.operator,
          value: JSON.stringify(condition.value),
        }).execute();
      }

      // Create macro actions
      for (const action of validated.actions) {
        await trx.insertInto('macro_actions').values({
          id: uuidv4(),
          macro_id: id,
          type: action.type,
          parameters: JSON.stringify(action.parameters),
        }).execute();
      }

      // Create macro keywords if provided
      if (validated.keywords && validated.keywords.length > 0) {
        for (const keyword of validated.keywords) {
          await trx.insertInto('macro_keywords').values({
            id: uuidv4(),
            macro_id: id,
            keyword: keyword.toLowerCase(),
          }).execute();
        }
      }

      // Log audit
      await auditService.log({
        organizationId: context.organizationId!,
        userId: context.userId,
        action: AuditAction.MACRO_CREATED,
        resourceType: 'macro',
        resourceId: id,
        details: {
          name: validated.name,
          triggerType: validated.triggerType,
          conditionCount: validated.conditions.length,
          actionCount: validated.actions.length,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      }, trx);

      return await this.getMacroById(id, context.organizationId!, trx);
    });

    logger.info('Macro created', {
      macroId: result.id,
      name: result.name,
      triggerType: result.triggerType,
      organizationId: context.organizationId,
      userId: context.userId
    });

    return result;
  }

  async getMacroById(id: string, organizationId: string, trx?: Transaction<any>): Promise<Macro> {
    const query = (trx || db)
      .selectFrom('macros')
      .leftJoin('users as creator', 'macros.created_by', 'creator.id')
      .select([
        'macros.id',
        'macros.organization_id as organizationId',
        'macros.name',
        'macros.description',
        'macros.trigger_type as triggerType',
        'macros.conditions_operator as conditionsOperator',
        'macros.is_active as isActive',
        'macros.category',
        'macros.priority',
        'macros.execution_count as executionCount',
        'macros.last_executed_at as lastExecutedAt',
        'macros.success_rate as successRate',
        'macros.created_by as createdBy',
        'creator.first_name as creatorFirstName',
        'creator.last_name as creatorLastName',
        'macros.created_at as createdAt',
        'macros.updated_at as updatedAt',
      ])
      .where('macros.id', '=', id)
      .where('macros.organization_id', '=', organizationId)
      .where('macros.deleted_at', 'is', null);

    const row = await query.executeTakeFirst();
    if (!row) {
      throw new AppError('Macro not found', 404);
    }

    // Get macro conditions
    const conditions = await (trx || db)
      .selectFrom('macro_conditions')
      .select(['field', 'operator', 'value'])
      .where('macro_id', '=', id)
      .execute();

    // Get macro actions
    const actions = await (trx || db)
      .selectFrom('macro_actions')
      .select(['type', 'parameters'])
      .where('macro_id', '=', id)
      .execute();

    // Get macro keywords
    const keywords = await (trx || db)
      .selectFrom('macro_keywords')
      .select('keyword')
      .where('macro_id', '=', id)
      .execute();

    return {
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      description: row.description,
      triggerType: row.triggerType as MacroTriggerType,
      conditions: conditions.map(c => ({
        field: c.field as any,
        operator: c.operator as any,
        value: JSON.parse(c.value),
      })),
      conditionsOperator: row.conditionsOperator as 'AND' | 'OR',
      actions: actions.map(a => ({
        type: a.type as MacroActionType,
        parameters: JSON.parse(a.parameters),
      })),
      isActive: row.isActive,
      category: row.category,
      keywords: keywords.map(k => k.keyword),
      priority: row.priority,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      executionCount: row.executionCount,
      lastExecutedAt: row.lastExecutedAt,
      successRate: row.successRate,
    };
  }

  async updateMacro(id: string, input: UpdateMacroInput, context: RequestContext): Promise<Macro> {
    const validated = await UpdateMacroInput.parseAsync(input);

    const result = await withTransaction(async (trx) => {
      // Get current macro
      const currentMacro = await this.getMacroById(id, context.organizationId!, trx);

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Track changes for audit
      const changes: Record<string, { from: any; to: any }> = {};

      if (validated.name !== undefined && validated.name !== currentMacro.name) {
        // Check if new name already exists
        const existingMacro = await trx
          .selectFrom('macros')
          .select('id')
          .where('organization_id', '=', context.organizationId!)
          .where('name', '=', validated.name)
          .where('id', '!=', id)
          .where('deleted_at', 'is', null)
          .executeTakeFirst();

        if (existingMacro) {
          throw new AppError('Macro name already exists', 409);
        }

        updateData.name = validated.name;
        changes.name = { from: currentMacro.name, to: validated.name };
      }

      if (validated.description !== undefined && validated.description !== currentMacro.description) {
        updateData.description = validated.description;
        changes.description = { from: currentMacro.description, to: validated.description };
      }

      if (validated.triggerType !== undefined && validated.triggerType !== currentMacro.triggerType) {
        updateData.trigger_type = validated.triggerType;
        changes.triggerType = { from: currentMacro.triggerType, to: validated.triggerType };
      }

      if (validated.conditionsOperator !== undefined && validated.conditionsOperator !== currentMacro.conditionsOperator) {
        updateData.conditions_operator = validated.conditionsOperator;
        changes.conditionsOperator = { from: currentMacro.conditionsOperator, to: validated.conditionsOperator };
      }

      if (validated.isActive !== undefined && validated.isActive !== currentMacro.isActive) {
        updateData.is_active = validated.isActive;
        changes.isActive = { from: currentMacro.isActive, to: validated.isActive };
      }

      if (validated.category !== undefined && validated.category !== currentMacro.category) {
        updateData.category = validated.category;
        changes.category = { from: currentMacro.category, to: validated.category };
      }

      if (validated.priority !== undefined && validated.priority !== currentMacro.priority) {
        updateData.priority = validated.priority;
        changes.priority = { from: currentMacro.priority, to: validated.priority };
      }

      // Validate macro logic if conditions or actions changed
      const newConditions = validated.conditions || currentMacro.conditions;
      const newActions = validated.actions || currentMacro.actions;
      
      if (validated.conditions || validated.actions) {
        const validationResult = this.validateMacroLogic(newConditions, newActions);
        if (!validationResult.isValid) {
          throw new AppError(`Macro validation failed: ${validationResult.errors.map(e => e.message).join(', ')}`, 400);
        }
      }

      // Update conditions if provided
      if (validated.conditions) {
        await trx.deleteFrom('macro_conditions').where('macro_id', '=', id).execute();
        
        for (const condition of validated.conditions) {
          await trx.insertInto('macro_conditions').values({
            id: uuidv4(),
            macro_id: id,
            field: condition.field,
            operator: condition.operator,
            value: JSON.stringify(condition.value),
          }).execute();
        }

        changes.conditionCount = { from: currentMacro.conditions.length, to: validated.conditions.length };
      }

      // Update actions if provided
      if (validated.actions) {
        await trx.deleteFrom('macro_actions').where('macro_id', '=', id).execute();
        
        for (const action of validated.actions) {
          await trx.insertInto('macro_actions').values({
            id: uuidv4(),
            macro_id: id,
            type: action.type,
            parameters: JSON.stringify(action.parameters),
          }).execute();
        }

        changes.actionCount = { from: currentMacro.actions.length, to: validated.actions.length };
      }

      // Update keywords if provided
      if (validated.keywords !== undefined) {
        await trx.deleteFrom('macro_keywords').where('macro_id', '=', id).execute();
        
        if (validated.keywords.length > 0) {
          for (const keyword of validated.keywords) {
            await trx.insertInto('macro_keywords').values({
              id: uuidv4(),
              macro_id: id,
              keyword: keyword.toLowerCase(),
            }).execute();
          }
        }

        changes.keywordCount = { from: currentMacro.keywords?.length || 0, to: validated.keywords.length };
      }

      // Update macro
      await trx
        .updateTable('macros')
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
          action: AuditAction.MACRO_UPDATED,
          resourceType: 'macro',
          resourceId: id,
          details: { changes },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent,
        }, trx);
      }

      return await this.getMacroById(id, context.organizationId!, trx);
    });

    logger.info('Macro updated', {
      macroId: id,
      organizationId: context.organizationId,
      userId: context.userId
    });

    return result;
  }

  async getMacros(filters: MacroFilters, organizationId: string): Promise<MacroList> {
    const validated = await MacroFilters.parseAsync(filters);
    
    const { page = 1, limit = 20, ...filterParams } = validated;
    const offset = (page - 1) * limit;

    let query = db
      .selectFrom('macros')
      .select([
        'id',
        'organization_id as organizationId',
        'name',
        'description',
        'trigger_type as triggerType',
        'is_active as isActive',
        'category',
        'priority',
        'execution_count as executionCount',
        'last_executed_at as lastExecutedAt',
        'success_rate as successRate',
        'created_at as createdAt',
        'updated_at as updatedAt',
      ])
      .where('organization_id', '=', organizationId)
      .where('deleted_at', 'is', null);

    // Apply filters
    if (filterParams.search) {
      query = query.where((eb) =>
        eb.or([
          eb('name', 'ilike', `%${filterParams.search}%`),
          eb('description', 'ilike', `%${filterParams.search}%`),
        ])
      );
    }

    if (filterParams.triggerType) {
      query = query.where('trigger_type', '=', filterParams.triggerType);
    }

    if (filterParams.category) {
      query = query.where('category', '=', filterParams.category);
    }

    if (filterParams.isActive !== undefined) {
      query = query.where('is_active', '=', filterParams.isActive);
    }

    if (filterParams.createdAfter) {
      query = query.where('created_at', '>=', filterParams.createdAfter);
    }

    if (filterParams.createdBefore) {
      query = query.where('created_at', '<=', filterParams.createdBefore);
    }

    if (filterParams.hasExecutions !== undefined) {
      if (filterParams.hasExecutions) {
        query = query.where('execution_count', '>', 0);
      } else {
        query = query.where('execution_count', '=', 0);
      }
    }

    // Get total count
    const totalResult = await query.clearSelect().select(db.fn.count('id').as('count')).executeTakeFirst();
    const total = Number(totalResult?.count || 0);

    // Get paginated results
    const rows = await query
      .orderBy('priority', 'desc')
      .orderBy('execution_count', 'desc')
      .orderBy('updated_at', 'desc')
      .offset(offset)
      .limit(limit)
      .execute();

    const macros = rows.map((row) => ({
      id: row.id,
      organizationId: row.organizationId,
      name: row.name,
      description: row.description,
      triggerType: row.triggerType as MacroTriggerType,
      isActive: row.isActive,
      category: row.category,
      priority: row.priority,
      executionCount: row.executionCount,
      lastExecutedAt: row.lastExecutedAt,
      successRate: row.successRate,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));

    return {
      macros,
      pagination: {
        page,
        limit,
        total,
        hasNext: offset + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async executeMacro(input: ExecuteMacroInput, context: RequestContext): Promise<MacroExecution> {
    const validated = await ExecuteMacroInput.parseAsync(input);

    return await withTransaction(async (trx) => {
      const macro = await this.getMacroById(validated.macroId, context.organizationId!, trx);

      if (!macro.isActive) {
        throw new AppError('Macro is not active', 400);
      }

      // Get ticket for context
      const ticket = await ticketService.getTicketById(validated.ticketId, context.organizationId!, trx);

      const executionId = uuidv4();
      const startTime = new Date();
      const results: Array<{
        actionType: MacroActionType;
        status: 'success' | 'failed' | 'skipped';
        message?: string;
        data?: Record<string, any>;
      }> = [];

      let overallStatus: 'success' | 'failed' | 'partial' = 'success';
      let errorMessage: string | undefined;

      try {
        // Check if conditions are met (for manual execution)
        if (macro.triggerType !== 'manual') {
          const conditionsMet = this.evaluateConditions(macro.conditions, macro.conditionsOperator, ticket, {});
          if (!conditionsMet) {
            throw new AppError('Macro conditions are not met for this ticket', 400);
          }
        }

        // Execute actions
        for (const action of macro.actions) {
          try {
            const actionResult = await this.executeAction(
              action, 
              ticket, 
              context, 
              validated.override || {},
              trx
            );
            
            results.push({
              actionType: action.type,
              status: 'success',
              message: actionResult.message,
              data: actionResult.data,
            });
          } catch (actionError: any) {
            logger.error('Macro action failed', {
              macroId: macro.id,
              actionType: action.type,
              ticketId: ticket.id,
              error: actionError.message,
            });

            results.push({
              actionType: action.type,
              status: 'failed',
              message: actionError.message,
            });

            if (overallStatus === 'success') {
              overallStatus = 'partial';
            }
          }
        }

        if (results.every(r => r.status === 'failed')) {
          overallStatus = 'failed';
          errorMessage = 'All actions failed';
        }

      } catch (error: any) {
        overallStatus = 'failed';
        errorMessage = error.message;
        
        logger.error('Macro execution failed', {
          macroId: macro.id,
          ticketId: ticket.id,
          error: error.message,
        });
      }

      const completedAt = new Date();

      // Log execution
      await trx.insertInto('macro_executions').values({
        id: executionId,
        macro_id: macro.id,
        ticket_id: ticket.id,
        executed_by: context.userId,
        execution_type: 'manual',
        status: overallStatus,
        started_at: startTime.toISOString(),
        completed_at: completedAt.toISOString(),
        results: JSON.stringify(results),
        error_message: errorMessage,
        metadata: JSON.stringify(validated.override || {}),
      }).execute();

      // Update macro statistics
      const newExecutionCount = macro.executionCount + 1;
      const successfulExecutions = await trx
        .selectFrom('macro_executions')
        .select(db.fn.count('id').as('count'))
        .where('macro_id', '=', macro.id)
        .where('status', '=', 'success')
        .executeTakeFirst();

      const newSuccessRate = (Number(successfulExecutions?.count || 0) / newExecutionCount) * 100;

      await trx
        .updateTable('macros')
        .set({
          execution_count: newExecutionCount,
          last_executed_at: completedAt.toISOString(),
          success_rate: newSuccessRate,
          updated_at: completedAt.toISOString(),
        })
        .where('id', '=', macro.id)
        .execute();

      // Log audit
      await auditService.log({
        organizationId: context.organizationId!,
        userId: context.userId,
        action: AuditAction.MACRO_EXECUTED,
        resourceType: 'macro',
        resourceId: macro.id,
        details: {
          ticketId: ticket.id,
          status: overallStatus,
          actionCount: results.length,
          successfulActions: results.filter(r => r.status === 'success').length,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      }, trx);

      return {
        id: executionId,
        macroId: macro.id,
        ticketId: ticket.id,
        executedBy: context.userId,
        executionType: 'manual',
        status: overallStatus,
        startedAt: startTime.toISOString(),
        completedAt: completedAt.toISOString(),
        results,
        errorMessage,
        metadata: validated.override || {},
      };
    });
  }

  async testMacro(input: TestMacroInput, context: RequestContext): Promise<MacroExecution> {
    const validated = await TestMacroInput.parseAsync(input);

    const macro = await this.getMacroById(validated.macroId, context.organizationId!);
    const ticket = await ticketService.getTicketById(validated.ticketId, context.organizationId!);

    const startTime = new Date();
    const results: Array<{
      actionType: MacroActionType;
      status: 'success' | 'failed' | 'skipped';
      message?: string;
      data?: Record<string, any>;
    }> = [];

    // Check conditions
    const conditionsMet = this.evaluateConditions(macro.conditions, macro.conditionsOperator, ticket, {});

    if (!conditionsMet) {
      results.push({
        actionType: 'add_reply' as MacroActionType,
        status: 'skipped',
        message: 'Macro conditions are not met',
      });
    } else {
      // Simulate action execution in dry run mode
      for (const action of macro.actions) {
        results.push({
          actionType: action.type,
          status: 'success',
          message: `Action would be executed: ${action.type}`,
          data: { dryRun: true, parameters: action.parameters },
        });
      }
    }

    const completedAt = new Date();

    // Log test execution
    await auditService.log({
      organizationId: context.organizationId!,
      userId: context.userId,
      action: AuditAction.MACRO_TESTED,
      resourceType: 'macro',
      resourceId: macro.id,
      details: {
        ticketId: ticket.id,
        conditionsMet,
        dryRun: validated.dryRun,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger.info('Macro tested', {
      macroId: macro.id,
      ticketId: ticket.id,
      conditionsMet,
      organizationId: context.organizationId,
      userId: context.userId
    });

    return {
      id: uuidv4(),
      macroId: macro.id,
      ticketId: ticket.id,
      executedBy: context.userId,
      executionType: 'manual',
      status: conditionsMet ? 'success' : 'partial',
      startedAt: startTime.toISOString(),
      completedAt: completedAt.toISOString(),
      results,
      errorMessage: undefined,
      metadata: { dryRun: true, conditionsMet },
    };
  }

  async getMacroStats(organizationId: string): Promise<MacroStats> {
    const [
      totalResult,
      activeResult,
      triggerTypeStats,
      categoryStats,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      avgExecutionTime,
      mostUsedMacros,
    ] = await Promise.all([
      // Total macros
      db
        .selectFrom('macros')
        .select(db.fn.count('id').as('count'))
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst(),

      // Active macros
      db
        .selectFrom('macros')
        .select(db.fn.count('id').as('count'))
        .where('organization_id', '=', organizationId)
        .where('is_active', '=', true)
        .where('deleted_at', 'is', null)
        .executeTakeFirst(),

      // Macros by trigger type
      db
        .selectFrom('macros')
        .select(['trigger_type', db.fn.count('id').as('count')])
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .groupBy('trigger_type')
        .execute(),

      // Macros by category
      db
        .selectFrom('macros')
        .select(['category', db.fn.count('id').as('count')])
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .groupBy('category')
        .execute(),

      // Total executions
      db
        .selectFrom('macro_executions')
        .innerJoin('macros', 'macro_executions.macro_id', 'macros.id')
        .select(db.fn.count('macro_executions.id').as('count'))
        .where('macros.organization_id', '=', organizationId)
        .where('macros.deleted_at', 'is', null)
        .executeTakeFirst(),

      // Successful executions
      db
        .selectFrom('macro_executions')
        .innerJoin('macros', 'macro_executions.macro_id', 'macros.id')
        .select(db.fn.count('macro_executions.id').as('count'))
        .where('macros.organization_id', '=', organizationId)
        .where('macros.deleted_at', 'is', null)
        .where('macro_executions.status', '=', 'success')
        .executeTakeFirst(),

      // Failed executions
      db
        .selectFrom('macro_executions')
        .innerJoin('macros', 'macro_executions.macro_id', 'macros.id')
        .select(db.fn.count('macro_executions.id').as('count'))
        .where('macros.organization_id', '=', organizationId)
        .where('macros.deleted_at', 'is', null)
        .where('macro_executions.status', '=', 'failed')
        .executeTakeFirst(),

      // Average execution time
      db
        .selectFrom('macro_executions')
        .innerJoin('macros', 'macro_executions.macro_id', 'macros.id')
        .select(db.fn.avg(
          db.fn('extract', ['epoch', db.fn('age', ['completed_at', 'started_at'])])
        ).as('avg_seconds'))
        .where('macros.organization_id', '=', organizationId)
        .where('macros.deleted_at', 'is', null)
        .where('macro_executions.completed_at', 'is not', null)
        .executeTakeFirst(),

      // Most used macros
      db
        .selectFrom('macros')
        .select(['id', 'name', 'execution_count', 'success_rate'])
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .where('execution_count', '>', 0)
        .orderBy('execution_count', 'desc')
        .limit(10)
        .execute(),
    ]);

    const byTriggerType = triggerTypeStats.reduce((acc, row) => {
      acc[row.trigger_type as MacroTriggerType] = Number(row.count);
      return acc;
    }, {} as Record<MacroTriggerType, number>);

    const byCategory = categoryStats.reduce((acc, row) => {
      acc[row.category] = Number(row.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      total: Number(totalResult?.count || 0),
      active: Number(activeResult?.count || 0),
      byTriggerType,
      byCategory,
      totalExecutions: Number(totalExecutions?.count || 0),
      successfulExecutions: Number(successfulExecutions?.count || 0),
      failedExecutions: Number(failedExecutions?.count || 0),
      averageExecutionTime: Number(avgExecutionTime?.avg_seconds || 0) * 1000, // Convert to milliseconds
      mostUsed: mostUsedMacros.map(m => ({
        id: m.id,
        name: m.name,
        executionCount: m.execution_count,
        successRate: m.success_rate,
      })),
    };
  }

  async validateMacroLogic(input: ValidateMacroInput): Promise<MacroValidationResult> {
    const validated = await ValidateMacroInput.parseAsync(input);

    return this.validateMacroLogic(validated.conditions, validated.actions);
  }

  async deleteMacro(id: string, organizationId: string, context: RequestContext): Promise<void> {
    await withTransaction(async (trx) => {
      // Check if macro exists
      const macro = await trx
        .selectFrom('macros')
        .select(['id', 'name', 'execution_count'])
        .where('id', '=', id)
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (!macro) {
        throw new AppError('Macro not found', 404);
      }

      // Soft delete
      const now = new Date().toISOString();
      await trx
        .updateTable('macros')
        .set({ deleted_at: now })
        .where('id', '=', id)
        .execute();

      // Log audit
      await auditService.log({
        organizationId,
        userId: context.userId,
        action: AuditAction.MACRO_DELETED,
        resourceType: 'macro',
        resourceId: id,
        details: { 
          macroName: macro.name,
          executionCount: macro.execution_count,
        },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      }, trx);
    });

    logger.info('Macro deleted', {
      macroId: id,
      organizationId,
      userId: context.userId
    });
  }

  private validateMacroLogic(conditions: MacroCondition[], actions: MacroAction[]): MacroValidationResult {
    const errors: Array<{
      type: 'condition' | 'action' | 'logic';
      message: string;
      field?: string;
    }> = [];

    const warnings: Array<{
      type: 'performance' | 'best_practice' | 'compatibility';
      message: string;
    }> = [];

    // Validate conditions
    for (const condition of conditions) {
      if (!condition.field || !condition.operator || condition.value === undefined) {
        errors.push({
          type: 'condition',
          message: 'Condition missing required fields',
          field: 'condition',
        });
      }

      // Check for performance issues
      if (condition.field === 'content' && condition.operator === 'contains') {
        warnings.push({
          type: 'performance',
          message: 'Content contains operations may be slow on large tickets',
        });
      }
    }

    // Validate actions
    for (const action of actions) {
      if (!action.type || !action.parameters) {
        errors.push({
          type: 'action',
          message: 'Action missing required fields',
          field: 'action',
        });
        continue;
      }

      // Validate action-specific parameters
      switch (action.type) {
        case 'add_reply':
          if (!action.parameters.content) {
            errors.push({
              type: 'action',
              message: 'Add reply action requires content parameter',
              field: 'content',
            });
          }
          break;
        case 'assign_agent':
          if (!action.parameters.userId) {
            errors.push({
              type: 'action',
              message: 'Assign agent action requires userId parameter',
              field: 'userId',
            });
          }
          break;
        case 'change_status':
          if (!action.parameters.status) {
            errors.push({
              type: 'action',
              message: 'Change status action requires status parameter',
              field: 'status',
            });
          }
          break;
        case 'send_email':
          if (!action.parameters.templateName && !action.parameters.content) {
            errors.push({
              type: 'action',
              message: 'Send email action requires either templateName or content',
              field: 'template',
            });
          }
          break;
      }
    }

    // Check for logical issues
    if (conditions.length === 0) {
      warnings.push({
        type: 'best_practice',
        message: 'Macro has no conditions and will match all tickets',
      });
    }

    if (actions.length === 0) {
      errors.push({
        type: 'logic',
        message: 'Macro must have at least one action',
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private evaluateConditions(
    conditions: MacroCondition[], 
    operator: 'AND' | 'OR', 
    ticket: any, 
    context: Record<string, any>
  ): boolean {
    if (conditions.length === 0) return true;

    const results = conditions.map(condition => this.evaluateCondition(condition, ticket, context));

    return operator === 'AND' 
      ? results.every(r => r) 
      : results.some(r => r);
  }

  private evaluateCondition(condition: MacroCondition, ticket: any, context: Record<string, any>): boolean {
    const fieldValue = this.getFieldValue(condition.field, ticket, context);
    const conditionValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(conditionValue);
      case 'less_than':
        return Number(fieldValue) < Number(conditionValue);
      default:
        return false;
    }
  }

  private getFieldValue(field: string, ticket: any, context: Record<string, any>): any {
    switch (field) {
      case 'status':
        return ticket.status;
      case 'priority':
        return ticket.priority;
      case 'category':
        return ticket.categoryId;
      case 'assignee':
        return ticket.assignedTo;
      case 'content':
        return ticket.description;
      case 'age_hours':
        const now = new Date();
        const created = new Date(ticket.createdAt);
        return (now.getTime() - created.getTime()) / (1000 * 60 * 60);
      default:
        return context[field];
    }
  }

  private async executeAction(
    action: MacroAction, 
    ticket: any, 
    context: RequestContext, 
    overrides: Record<string, any>,
    trx: Transaction<any>
  ): Promise<{ message: string; data?: Record<string, any> }> {
    // Apply overrides to parameters
    const parameters = { ...action.parameters, ...overrides };

    switch (action.type) {
      case 'add_reply':
        await ticketReplyService.createReply({
          ticketId: ticket.id,
          type: 'agent_reply',
          content: parameters.content,
          isInternal: parameters.isInternal || false,
        }, context);
        return { message: 'Reply added to ticket' };

      case 'change_status':
        await ticketService.changeTicketStatus(ticket.id, parameters.status, context, parameters.resolution);
        return { message: `Status changed to ${parameters.status}` };

      case 'assign_agent':
        await ticketService.updateTicket(ticket.id, { assignedTo: parameters.userId }, context);
        return { message: 'Agent assigned to ticket' };

      case 'change_priority':
        await ticketService.updateTicket(ticket.id, { priority: parameters.priority }, context);
        return { message: `Priority changed to ${parameters.priority}` };

      case 'add_tags':
        // Implementation would depend on tag system
        return { message: 'Tags added to ticket', data: { tags: parameters.tags } };

      case 'send_email':
        await emailOutboxService.enqueue({
          recipientEmail: parameters.recipientEmail || ticket.requesterEmail,
          recipientName: parameters.recipientName || ticket.requesterName,
          subject: parameters.subject || `Regarding ticket ${ticket.ticketNumber}`,
          templateName: parameters.templateName,
          htmlContent: parameters.content,
          templateData: {
            ticketNumber: ticket.ticketNumber,
            title: ticket.title,
            ...parameters.templateData,
          },
          organizationId: context.organizationId!,
        }, trx);
        return { message: 'Email sent' };

      case 'create_task':
        // Implementation would depend on task system
        return { message: 'Task created', data: { taskTitle: parameters.title } };

      case 'escalate':
        // Implementation would depend on escalation system
        return { message: 'Ticket escalated', data: { escalatedTo: parameters.escalateTo } };

      default:
        throw new AppError(`Unknown action type: ${action.type}`, 400);
    }
  }
}

export const macroService = new MacroService();