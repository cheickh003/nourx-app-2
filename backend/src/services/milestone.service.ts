import { db, withTransaction } from '@/config/database';
import { auditService } from '@/services/audit.service';
import { NotFoundError, ConflictError, ValidationError } from '@/types/errors';
import { RequestContext } from '@/types/api';
import {
  CreateMilestoneInput,
  UpdateMilestoneInput,
  Milestone,
  MilestoneFilters,
  MilestoneStatus,
  CreateMilestoneSchema,
  UpdateMilestoneSchema,
} from '@nourx/shared';
import logger from '@/lib/logger';

export interface MilestoneListResult {
  milestones: Milestone[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class MilestoneService {
  /**
   * Crée un nouveau jalon
   */
  async createMilestone(
    input: CreateMilestoneInput,
    context: RequestContext
  ): Promise<Milestone> {
    // Validation avec Zod
    const validated = CreateMilestoneSchema.parse(input);

    return withTransaction(async (trx) => {
      // Vérifier que le projet existe
      const project = await trx
        .selectFrom('project')
        .select(['id', 'organization_id', 'visible_to_client'])
        .where('id', '=', validated.projectId)
        .executeTakeFirst();

      if (!project) {
        throw new NotFoundError('Projet introuvable');
      }

      // Vérifier l'unicité du nom de jalon dans le projet
      const existingMilestone = await trx
        .selectFrom('milestone')
        .select('id')
        .where('name', '=', validated.name)
        .where('project_id', '=', validated.projectId)
        .executeTakeFirst();

      if (existingMilestone) {
        throw new ConflictError('Un jalon avec ce nom existe déjà dans ce projet');
      }

      // Si orderIndex n'est pas spécifié, prendre le suivant
      let orderIndex = validated.orderIndex;
      if (orderIndex === undefined || orderIndex === 0) {
        const lastMilestone = await trx
          .selectFrom('milestone')
          .select('order_index')
          .where('project_id', '=', validated.projectId)
          .orderBy('order_index', 'desc')
          .executeTakeFirst();
        
        orderIndex = (lastMilestone?.order_index || 0) + 1;
      }

      // Créer le jalon
      const milestone = await trx
        .insertInto('milestone')
        .values({
          project_id: validated.projectId,
          name: validated.name,
          description: validated.description || null,
          due_date: validated.dueDate || null,
          order_index: orderIndex,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Audit log
      await auditService.log(
        'milestone_created',
        context.user.id,
        context.user.role === 'admin' ? 'admin' : 'client',
        `Jalon créé: ${milestone.name}`,
        {
          milestoneId: milestone.id,
          projectId: milestone.project_id,
          organizationId: project.organization_id,
        },
        trx
      );

      logger.info('Jalon créé', {
        milestoneId: milestone.id,
        name: milestone.name,
        projectId: milestone.project_id,
        userId: context.user.id,
      });

      return this.formatMilestone(milestone);
    });
  }

  /**
   * Récupère un jalon par son ID
   */
  async getMilestoneById(
    id: string,
    projectId: string,
    context: RequestContext
  ): Promise<Milestone> {
    const milestone = await db
      .selectFrom('milestone')
      .selectAll()
      .where('id', '=', id)
      .where('project_id', '=', projectId)
      .executeTakeFirst();

    if (!milestone) {
      throw new NotFoundError('Jalon introuvable');
    }

    return this.formatMilestone(milestone);
  }

  /**
   * Met à jour un jalon
   */
  async updateMilestone(
    id: string,
    projectId: string,
    input: UpdateMilestoneInput,
    context: RequestContext
  ): Promise<Milestone> {
    // Validation avec Zod
    const validated = UpdateMilestoneSchema.parse(input);

    return withTransaction(async (trx) => {
      // Vérifier que le jalon existe
      const existingMilestone = await trx
        .selectFrom('milestone')
        .selectAll()
        .where('id', '=', id)
        .where('project_id', '=', projectId)
        .executeTakeFirst();

      if (!existingMilestone) {
        throw new NotFoundError('Jalon introuvable');
      }

      // Vérifier l'unicité du nom si changé
      if (validated.name && validated.name !== existingMilestone.name) {
        const duplicateMilestone = await trx
          .selectFrom('milestone')
          .select('id')
          .where('name', '=', validated.name)
          .where('project_id', '=', projectId)
          .where('id', '!=', id)
          .executeTakeFirst();

        if (duplicateMilestone) {
          throw new ConflictError('Un jalon avec ce nom existe déjà dans ce projet');
        }
      }

      // Construire les données à mettre à jour
      const updateData: Partial<typeof existingMilestone> = {
        updated_at: new Date(),
      };

      if (validated.name !== undefined) updateData.name = validated.name;
      if (validated.description !== undefined) updateData.description = validated.description;
      if (validated.dueDate !== undefined) updateData.due_date = validated.dueDate;
      if (validated.orderIndex !== undefined) updateData.order_index = validated.orderIndex;

      // Mettre à jour le jalon
      const updatedMilestone = await trx
        .updateTable('milestone')
        .set(updateData)
        .where('id', '=', id)
        .where('project_id', '=', projectId)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Audit log
      await auditService.log(
        'milestone_updated',
        context.user.id,
        context.user.role === 'admin' ? 'admin' : 'client',
        `Jalon modifié: ${updatedMilestone.name}`,
        {
          milestoneId: updatedMilestone.id,
          projectId: updatedMilestone.project_id,
          changes: validated,
        },
        trx
      );

      logger.info('Jalon mis à jour', {
        milestoneId: updatedMilestone.id,
        name: updatedMilestone.name,
        changes: validated,
        userId: context.user.id,
      });

      return this.formatMilestone(updatedMilestone);
    });
  }

  /**
   * Change le statut d'un jalon
   */
  async updateMilestoneStatus(
    id: string,
    projectId: string,
    status: MilestoneStatus,
    context: RequestContext
  ): Promise<Milestone> {
    return withTransaction(async (trx) => {
      // Vérifier que le jalon existe
      const existingMilestone = await trx
        .selectFrom('milestone')
        .selectAll()
        .where('id', '=', id)
        .where('project_id', '=', projectId)
        .executeTakeFirst();

      if (!existingMilestone) {
        throw new NotFoundError('Jalon introuvable');
      }

      // Mettre à jour le statut
      const updatedMilestone = await trx
        .updateTable('milestone')
        .set({
          status,
          updated_at: new Date(),
        })
        .where('id', '=', id)
        .where('project_id', '=', projectId)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Audit log
      await auditService.log(
        'milestone_status_changed',
        context.user.id,
        context.user.role === 'admin' ? 'admin' : 'client',
        `Statut du jalon changé: ${existingMilestone.status} → ${status}`,
        {
          milestoneId: updatedMilestone.id,
          projectId: updatedMilestone.project_id,
          oldStatus: existingMilestone.status,
          newStatus: status,
        },
        trx
      );

      logger.info('Statut du jalon changé', {
        milestoneId: updatedMilestone.id,
        name: updatedMilestone.name,
        oldStatus: existingMilestone.status,
        newStatus: status,
        userId: context.user.id,
      });

      return this.formatMilestone(updatedMilestone);
    });
  }

  /**
   * Supprime un jalon
   */
  async deleteMilestone(
    id: string,
    projectId: string,
    context: RequestContext
  ): Promise<void> {
    return withTransaction(async (trx) => {
      // Vérifier que le jalon existe
      const milestone = await trx
        .selectFrom('milestone')
        .selectAll()
        .where('id', '=', id)
        .where('project_id', '=', projectId)
        .executeTakeFirst();

      if (!milestone) {
        throw new NotFoundError('Jalon introuvable');
      }

      // Vérifier qu'il n'y a pas de tâches liées
      const tasksCount = await trx
        .selectFrom('task')
        .select((eb) => eb.fn.count<number>('id').as('count'))
        .where('milestone_id', '=', id)
        .executeTakeFirst();

      if ((tasksCount?.count || 0) > 0) {
        throw new ConflictError('Impossible de supprimer un jalon qui contient des tâches');
      }

      // Vérifier qu'il n'y a pas de livrables liés
      const deliverablesCount = await trx
        .selectFrom('deliverable')
        .select((eb) => eb.fn.count<number>('id').as('count'))
        .where('milestone_id', '=', id)
        .executeTakeFirst();

      if ((deliverablesCount?.count || 0) > 0) {
        throw new ConflictError('Impossible de supprimer un jalon qui contient des livrables');
      }

      // Supprimer le jalon
      await trx
        .deleteFrom('milestone')
        .where('id', '=', id)
        .where('project_id', '=', projectId)
        .execute();

      // Audit log
      await auditService.log(
        'milestone_deleted',
        context.user.id,
        context.user.role === 'admin' ? 'admin' : 'client',
        `Jalon supprimé: ${milestone.name}`,
        {
          milestoneId: milestone.id,
          projectId: milestone.project_id,
        },
        trx
      );

      logger.info('Jalon supprimé', {
        milestoneId: milestone.id,
        name: milestone.name,
        userId: context.user.id,
      });
    });
  }

  /**
   * Liste les jalons d'un projet avec filtres et pagination
   */
  async listMilestones(
    projectId: string,
    filters: MilestoneFilters,
    page: number = 1,
    limit: number = 50,
    context: RequestContext
  ): Promise<MilestoneListResult> {
    let query = db
      .selectFrom('milestone')
      .selectAll()
      .where('project_id', '=', projectId)
      .orderBy('order_index', 'asc')
      .orderBy('created_at', 'asc');

    // Appliquer les filtres
    if (filters.status) {
      query = query.where('status', '=', filters.status);
    }

    if (filters.dueBefore) {
      query = query.where('due_date', '<=', filters.dueBefore);
    }

    // Compter le total
    const totalQuery = query
      .clearSelect()
      .select((eb) => eb.fn.count<number>('id').as('count'));
    
    const totalResult = await totalQuery.executeTakeFirst();
    const total = totalResult?.count || 0;

    // Appliquer la pagination
    const offset = (page - 1) * limit;
    const milestones = await query
      .limit(limit)
      .offset(offset)
      .execute();

    const hasNext = offset + milestones.length < total;
    const hasPrev = page > 1;

    return {
      milestones: milestones.map(m => this.formatMilestone(m)),
      pagination: {
        page,
        limit,
        total,
        hasNext,
        hasPrev,
      },
    };
  }

  /**
   * Réordonne les jalons d'un projet
   */
  async reorderMilestones(
    projectId: string,
    milestoneIds: string[],
    context: RequestContext
  ): Promise<void> {
    return withTransaction(async (trx) => {
      // Vérifier que tous les jalons appartiennent au projet
      const milestones = await trx
        .selectFrom('milestone')
        .select(['id', 'name'])
        .where('project_id', '=', projectId)
        .where('id', 'in', milestoneIds)
        .execute();

      if (milestones.length !== milestoneIds.length) {
        throw new ValidationError('Certains jalons n\'appartiennent pas à ce projet');
      }

      // Mettre à jour l'ordre
      for (let i = 0; i < milestoneIds.length; i++) {
        await trx
          .updateTable('milestone')
          .set({
            order_index: i + 1,
            updated_at: new Date(),
          })
          .where('id', '=', milestoneIds[i])
          .where('project_id', '=', projectId)
          .execute();
      }

      // Audit log
      await auditService.log(
        'milestones_reordered',
        context.user.id,
        context.user.role === 'admin' ? 'admin' : 'client',
        'Jalons réordonnés',
        {
          projectId,
          newOrder: milestoneIds,
        },
        trx
      );

      logger.info('Jalons réordonnés', {
        projectId,
        milestoneIds,
        userId: context.user.id,
      });
    });
  }

  /**
   * Formate un jalon pour la réponse API
   */
  private formatMilestone(milestone: any): Milestone {
    return {
      id: milestone.id,
      projectId: milestone.project_id,
      name: milestone.name,
      description: milestone.description,
      dueDate: milestone.due_date,
      status: milestone.status,
      orderIndex: milestone.order_index,
      createdAt: milestone.created_at.toISOString(),
      updatedAt: milestone.updated_at.toISOString(),
    };
  }
}

export const milestoneService = new MilestoneService();