import { db } from '@/config/database';
import logger from '@/lib/logger';
import { NewAuditLog, AuditLog } from '@/types/database';
import { RequestContext } from '@/types/api';

export interface CreateAuditLogInput {
  actorType: 'admin' | 'client';
  actorId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilters {
  actorType?: 'admin' | 'client';
  actorId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  from?: Date;
  to?: Date;
}

export class AuditService {
  /**
   * Méthode de compatibilité avec les anciens appels: auditService.log(...)
   * Accepte soit une signature détaillée, soit un objet.
   */
  async log(
    arg1: any,
    actorId?: string,
    actorType?: 'admin' | 'client',
    message?: string,
    details?: Record<string, any>,
    _trx?: any
  ): Promise<void> {
    try {
      if (typeof arg1 === 'string') {
        const action = arg1;
        await this.createAuditLog({
          actorType: actorType || 'client',
          actorId: actorId || 'unknown',
          action,
          resourceType: 'system',
          details: { message, ...(details || {}) },
        });
        return;
      }

      if (typeof arg1 === 'object' && arg1) {
        const input = arg1 as CreateAuditLogInput;
        await this.createAuditLog(input);
        return;
      }
    } catch (error) {
      logger.error({ err: error, msg: 'Failed to log audit entry via log()' });
    }
  }
  /**
   * Crée un nouvel enregistrement d'audit
   */
  async createAuditLog(input: CreateAuditLogInput): Promise<AuditLog> {
    const auditData: NewAuditLog = {
      actor_type: input.actorType,
      actor_id: input.actorId,
      action: input.action,
      resource_type: input.resourceType,
      ...(input.resourceId ? { resource_id: input.resourceId } : {}),
      ...(input.details ? { details_json: JSON.stringify(input.details) } : {}),
      ...(input.ipAddress ? { ip_address: input.ipAddress } : {}),
      ...(input.userAgent ? { user_agent: input.userAgent } : {}),
    } as NewAuditLog;

    try {
      const [auditLog] = await db
        .insertInto('audit_log')
        .values(auditData)
        .returning([
          'id',
          'actor_type',
          'actor_id', 
          'action',
          'resource_type',
          'resource_id',
          'details_json',
          'ip_address',
          'user_agent',
          'created_at',
        ])
        .execute();

      logger.info('Audit log created', {
        auditId: auditLog!.id,
        action: input.action,
        actorType: input.actorType,
        actorId: input.actorId,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
      });

      return auditLog!;
    } catch (error) {
      logger.error('Failed to create audit log', {
        error,
        input,
      });
      throw error;
    }
  }

  /**
   * Crée un audit log depuis le contexte de requête
   */
  async createFromContext(
    context: RequestContext,
    action: string,
    resourceType: string,
    resourceId?: string,
    details?: Record<string, any>
  ): Promise<AuditLog | null> {
    if (!context.user) {
      logger.warn('Cannot create audit log without authenticated user', {
        action,
        resourceType,
        resourceId,
      });
      return null;
    }

    // Déterminer le type d'acteur basé sur le rôle
    const actorType = ['admin', 'manager', 'agent', 'accountant', 'readonly'].includes(context.user.role)
      ? 'admin' as const
      : 'client' as const;

    return this.createAuditLog({
      actorType,
      actorId: context.user.id,
      action,
      resourceType,
      ...(resourceId ? { resourceId } : {}),
      ...(details ? { details } : {}),
      ...(context.ipAddress ? { ipAddress: context.ipAddress } : {}),
      ...(context.userAgent ? { userAgent: context.userAgent } : {}),
    });
  }

  /**
   * Récupère les logs d'audit avec filtres et pagination
   */
  async getAuditLogs(
    filters: AuditLogFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ 
    logs: AuditLog[]; 
    total: number; 
    hasNext: boolean; 
    hasPrev: boolean; 
  }> {
    let query = db.selectFrom('audit_log').selectAll();

    // Appliquer les filtres
    if (filters.actorType) {
      query = query.where('actor_type', '=', filters.actorType);
    }

    if (filters.actorId) {
      query = query.where('actor_id', '=', filters.actorId);
    }

    if (filters.action) {
      query = query.where('action', 'ilike', `%${filters.action}%`);
    }

    if (filters.resourceType) {
      query = query.where('resource_type', '=', filters.resourceType);
    }

    if (filters.resourceId) {
      query = query.where('resource_id', '=', filters.resourceId);
    }

    if (filters.from) {
      query = query.where('created_at', '>=', filters.from);
    }

    if (filters.to) {
      query = query.where('created_at', '<=', filters.to);
    }

    // Compter le total
    const [totalResult] = await query
      .select((eb) => eb.fn.count('id').as('total'))
      .execute();

    const total = Number(totalResult?.total || 0);

    // Récupérer les logs avec pagination
    const offset = (page - 1) * limit;
    const logs = (await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute()) as any[];

    return {
      logs,
      total,
      hasNext: offset + limit < total,
      hasPrev: page > 1,
    };
  }

  /**
   * Récupère les logs d'audit enrichis avec les informations des acteurs
   */
  async getAuditLogsWithActors(
    filters: AuditLogFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{
    logs: Array<AuditLog & {
      actor_name?: string;
      actor_email?: string;
      organization_name?: string;
    }>;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    let query = db.selectFrom('audit_log_with_actors' as any).selectAll();

    // Appliquer les mêmes filtres
    if (filters.actorType) {
      query = query.where('actor_type', '=', filters.actorType);
    }

    if (filters.actorId) {
      query = query.where('actor_id', '=', filters.actorId);
    }

    if (filters.action) {
      query = query.where('action', 'ilike', `%${filters.action}%`);
    }

    if (filters.resourceType) {
      query = query.where('resource_type', '=', filters.resourceType);
    }

    if (filters.resourceId) {
      query = query.where('resource_id', '=', filters.resourceId);
    }

    if (filters.from) {
      query = query.where('created_at', '>=', filters.from);
    }

    if (filters.to) {
      query = query.where('created_at', '<=', filters.to);
    }

    // Compter le total
    const [totalResult] = await query
      .select((eb) => eb.fn.count('id').as('total'))
      .execute();

    const total = Number(totalResult?.total || 0);

    // Récupérer les logs avec pagination
    const offset = (page - 1) * limit;
    const logs = (await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute()) as any[];

    return {
      logs,
      total,
      hasNext: offset + limit < total,
      hasPrev: page > 1,
    };
  }

  /**
   * Récupère les statistiques d'audit
   */
  async getAuditStats(
    from?: Date,
    to?: Date
  ): Promise<{
    totalLogs: number;
    byActorType: Record<'admin' | 'client', number>;
    byAction: Record<string, number>;
    byResourceType: Record<string, number>;
    recentActions: Array<{
      action: string;
      resource_type: string;
      count: number;
      last_occurrence: Date;
    }>;
  }> {
    let baseQuery = db.selectFrom('audit_log');

    if (from) {
      baseQuery = baseQuery.where('created_at', '>=', from);
    }

    if (to) {
      baseQuery = baseQuery.where('created_at', '<=', to);
    }

    // Total des logs
    const [totalResult] = await baseQuery
      .select((eb) => eb.fn.count('id').as('total'))
      .execute();

    const totalLogs = Number(totalResult?.total || 0);

    // Par type d'acteur
    const actorTypeStats = await baseQuery
      .select(['actor_type', (eb) => eb.fn.count('id').as('count')])
      .groupBy('actor_type')
      .execute();

    const byActorType = actorTypeStats.reduce((acc, stat) => {
      acc[stat.actor_type] = Number(stat.count);
      return acc;
    }, {} as Record<'admin' | 'client', number>);

    // Par action
    const actionStats = await baseQuery
      .select(['action', (eb) => eb.fn.count('id').as('count')])
      .groupBy('action')
      .orderBy('count', 'desc')
      .limit(10)
      .execute();

    const byAction = actionStats.reduce((acc, stat) => {
      acc[stat.action] = Number(stat.count);
      return acc;
    }, {} as Record<string, number>);

    // Par type de ressource
    const resourceStats = await baseQuery
      .select(['resource_type', (eb) => eb.fn.count('id').as('count')])
      .groupBy('resource_type')
      .orderBy('count', 'desc')
      .limit(10)
      .execute();

    const byResourceType = resourceStats.reduce((acc, stat) => {
      acc[stat.resource_type] = Number(stat.count);
      return acc;
    }, {} as Record<string, number>);

    // Actions récentes
    const recentActions = await baseQuery
      .select([
        'action',
        'resource_type',
        (eb) => eb.fn.count('id').as('count'),
        (eb) => eb.fn.max('created_at').as('last_occurrence'),
      ])
      .groupBy(['action', 'resource_type'])
      .orderBy('last_occurrence', 'desc')
      .limit(5)
      .execute();

    return {
      totalLogs,
      byActorType,
      byAction,
      byResourceType,
      recentActions: recentActions.map(action => ({
        action: action.action,
        resource_type: action.resource_type,
        count: Number(action.count),
        last_occurrence: new Date(action.last_occurrence as unknown as Date),
      })),
    };
  }
}

// Instance singleton
export const auditService = new AuditService();
export default auditService;
