import { db, withTransaction } from '@/config/database';
import { auditService } from '@/services/audit.service';
import { NotFoundError, ConflictError, ValidationError, ForbiddenError } from '@/types/errors';
import { RequestContext } from '@/types/api';
import {
  CreateProjectInput,
  UpdateProjectInput,
  Project,
  ProjectFilters,
  ProjectStatus,
  CreateProjectSchema,
  UpdateProjectSchema,
  ProjectListSchema,
} from '@nourx/shared';
import logger from '@/lib/logger';

export interface ProjectListResult {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class ProjectService {
  /**
   * Crée un nouveau projet
   */
  async createProject(
    input: CreateProjectInput,
    context: RequestContext
  ): Promise<Project> {
    // Validation avec Zod
    const validated = CreateProjectSchema.parse(input);

    return withTransaction(async (trx) => {
      // Vérifier que l'organisation existe
      const organization = await trx
        .selectFrom('organization')
        .select('id')
        .where('id', '=', validated.organizationId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (!organization) {
        throw new NotFoundError('Organisation introuvable');
      }

      // Vérifier l'unicité du nom de projet dans l'organisation
      const existingProject = await trx
        .selectFrom('project')
        .select('id')
        .where('name', '=', validated.name)
        .where('organization_id', '=', validated.organizationId)
        .executeTakeFirst();

      if (existingProject) {
        throw new ConflictError('Un projet avec ce nom existe déjà dans cette organisation');
      }

      // Créer le projet
      const project = await trx
        .insertInto('project')
        .values({
          organization_id: validated.organizationId,
          name: validated.name,
          description: validated.description || null,
          start_date: validated.startDate || null,
          end_date: validated.endDate || null,
          visible_to_client: validated.visibleToClient,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Audit log
      await auditService.log(
        'project_created',
        context.user.id,
        context.user.role === 'admin' ? 'admin' : 'client',
        `Projet créé: ${project.name}`,
        {
          projectId: project.id,
          organizationId: project.organization_id,
        },
        trx
      );

      logger.info('Projet créé', {
        projectId: project.id,
        name: project.name,
        organizationId: project.organization_id,
        userId: context.user.id,
      });

      return this.formatProject(project);
    });
  }

  /**
   * Récupère un projet par son ID
   */
  async getProjectById(
    id: string,
    organizationId: string,
    context: RequestContext
  ): Promise<Project> {
    const project = await db
      .selectFrom('project')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .executeTakeFirst();

    if (!project) {
      throw new NotFoundError('Projet introuvable');
    }

    // Vérifier les permissions pour les clients
    if (context.user.role === 'client' && !project.visible_to_client) {
      throw new ForbiddenError('Accès non autorisé à ce projet');
    }

    return this.formatProject(project);
  }

  /**
   * Met à jour un projet
   */
  async updateProject(
    id: string,
    organizationId: string,
    input: UpdateProjectInput,
    context: RequestContext
  ): Promise<Project> {
    // Validation avec Zod
    const validated = UpdateProjectSchema.parse(input);

    return withTransaction(async (trx) => {
      // Vérifier que le projet existe
      const existingProject = await trx
        .selectFrom('project')
        .selectAll()
        .where('id', '=', id)
        .where('organization_id', '=', organizationId)
        .executeTakeFirst();

      if (!existingProject) {
        throw new NotFoundError('Projet introuvable');
      }

      // Vérifier l'unicité du nom si changé
      if (validated.name && validated.name !== existingProject.name) {
        const duplicateProject = await trx
          .selectFrom('project')
          .select('id')
          .where('name', '=', validated.name)
          .where('organization_id', '=', organizationId)
          .where('id', '!=', id)
          .executeTakeFirst();

        if (duplicateProject) {
          throw new ConflictError('Un projet avec ce nom existe déjà dans cette organisation');
        }
      }

      // Construire les données à mettre à jour
      const updateData: Partial<typeof existingProject> = {
        updated_at: new Date(),
      };

      if (validated.name !== undefined) updateData.name = validated.name;
      if (validated.description !== undefined) updateData.description = validated.description;
      if (validated.startDate !== undefined) updateData.start_date = validated.startDate;
      if (validated.endDate !== undefined) updateData.end_date = validated.endDate;
      if (validated.visibleToClient !== undefined) updateData.visible_to_client = validated.visibleToClient;

      // Mettre à jour le projet
      const updatedProject = await trx
        .updateTable('project')
        .set(updateData)
        .where('id', '=', id)
        .where('organization_id', '=', organizationId)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Audit log
      await auditService.log(
        'project_updated',
        context.user.id,
        context.user.role === 'admin' ? 'admin' : 'client',
        `Projet modifié: ${updatedProject.name}`,
        {
          projectId: updatedProject.id,
          changes: validated,
        },
        trx
      );

      logger.info('Projet mis à jour', {
        projectId: updatedProject.id,
        name: updatedProject.name,
        changes: validated,
        userId: context.user.id,
      });

      return this.formatProject(updatedProject);
    });
  }

  /**
   * Change le statut d'un projet
   */
  async updateProjectStatus(
    id: string,
    organizationId: string,
    status: ProjectStatus,
    context: RequestContext
  ): Promise<Project> {
    return withTransaction(async (trx) => {
      // Vérifier que le projet existe
      const existingProject = await trx
        .selectFrom('project')
        .selectAll()
        .where('id', '=', id)
        .where('organization_id', '=', organizationId)
        .executeTakeFirst();

      if (!existingProject) {
        throw new NotFoundError('Projet introuvable');
      }

      // Mettre à jour le statut
      const updatedProject = await trx
        .updateTable('project')
        .set({
          status,
          updated_at: new Date(),
        })
        .where('id', '=', id)
        .where('organization_id', '=', organizationId)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Audit log
      await auditService.log(
        'project_status_changed',
        context.user.id,
        context.user.role === 'admin' ? 'admin' : 'client',
        `Statut du projet changé: ${existingProject.status} → ${status}`,
        {
          projectId: updatedProject.id,
          oldStatus: existingProject.status,
          newStatus: status,
        },
        trx
      );

      logger.info('Statut du projet changé', {
        projectId: updatedProject.id,
        name: updatedProject.name,
        oldStatus: existingProject.status,
        newStatus: status,
        userId: context.user.id,
      });

      return this.formatProject(updatedProject);
    });
  }

  /**
   * Supprime un projet (soft delete)
   */
  async deleteProject(
    id: string,
    organizationId: string,
    context: RequestContext
  ): Promise<void> {
    return withTransaction(async (trx) => {
      // Vérifier que le projet existe
      const project = await trx
        .selectFrom('project')
        .selectAll()
        .where('id', '=', id)
        .where('organization_id', '=', organizationId)
        .executeTakeFirst();

      if (!project) {
        throw new NotFoundError('Projet introuvable');
      }

      // Soft delete - mettre le statut à cancelled
      await trx
        .updateTable('project')
        .set({
          status: 'cancelled',
          updated_at: new Date(),
        })
        .where('id', '=', id)
        .where('organization_id', '=', organizationId)
        .execute();

      // Audit log
      await auditService.log(
        'project_deleted',
        context.user.id,
        context.user.role === 'admin' ? 'admin' : 'client',
        `Projet supprimé: ${project.name}`,
        {
          projectId: project.id,
          organizationId: project.organization_id,
        },
        trx
      );

      logger.info('Projet supprimé', {
        projectId: project.id,
        name: project.name,
        userId: context.user.id,
      });
    });
  }

  /**
   * Liste les projets avec filtres et pagination
   */
  async listProjects(
    organizationId: string,
    filters: ProjectFilters,
    page: number = 1,
    limit: number = 20,
    context: RequestContext
  ): Promise<ProjectListResult> {
    let query = db
      .selectFrom('project')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .orderBy('created_at', 'desc');

    // Appliquer les filtres
    if (filters.search) {
      query = query.where((eb) =>
        eb.or([
          eb('name', 'ilike', `%${filters.search}%`),
          eb('description', 'ilike', `%${filters.search}%`),
        ])
      );
    }

    if (filters.status) {
      query = query.where('status', '=', filters.status);
    }

    if (filters.visibleToClient !== undefined) {
      query = query.where('visible_to_client', '=', filters.visibleToClient);
    }

    if (filters.startAfter) {
      query = query.where('start_date', '>=', filters.startAfter);
    }

    if (filters.endBefore) {
      query = query.where('end_date', '<=', filters.endBefore);
    }

    // Filtrer pour les clients : seulement les projets visibles
    if (context.user.role === 'client') {
      query = query.where('visible_to_client', '=', true);
    }

    // Compter le total
    const totalQuery = query
      .clearSelect()
      .select((eb) => eb.fn.count<number>('id').as('count'));
    
    const totalResult = await totalQuery.executeTakeFirst();
    const total = totalResult?.count || 0;

    // Appliquer la pagination
    const offset = (page - 1) * limit;
    const projects = await query
      .limit(limit)
      .offset(offset)
      .execute();

    const hasNext = offset + projects.length < total;
    const hasPrev = page > 1;

    return {
      projects: projects.map(p => this.formatProject(p)),
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
   * Récupère les statistiques d'un projet
   */
  async getProjectStats(id: string, organizationId: string): Promise<{
    milestonesCount: number;
    milestonesCompleted: number;
    tasksCount: number;
    tasksCompleted: number;
    deliverablesCount: number;
    deliverablesApproved: number;
  }> {
    const [milestones, tasks, deliverables] = await Promise.all([
      // Statistiques des jalons
      db
        .selectFrom('milestone')
        .select((eb) => [
          eb.fn.count<number>('id').as('total'),
          eb.fn.count<number>('id').filterWhere('status', '=', 'completed').as('completed'),
        ])
        .where('project_id', '=', id)
        .executeTakeFirst(),
      
      // Statistiques des tâches
      db
        .selectFrom('task')
        .select((eb) => [
          eb.fn.count<number>('id').as('total'),
          eb.fn.count<number>('id').filterWhere('status', '=', 'done').as('completed'),
        ])
        .where('project_id', '=', id)
        .executeTakeFirst(),
      
      // Statistiques des livrables
      db
        .selectFrom('deliverable')
        .select((eb) => [
          eb.fn.count<number>('id').as('total'),
          eb.fn.count<number>('id').filterWhere('status', '=', 'approved').as('approved'),
        ])
        .where('project_id', '=', id)
        .executeTakeFirst(),
    ]);

    return {
      milestonesCount: milestones?.total || 0,
      milestonesCompleted: milestones?.completed || 0,
      tasksCount: tasks?.total || 0,
      tasksCompleted: tasks?.completed || 0,
      deliverablesCount: deliverables?.total || 0,
      deliverablesApproved: deliverables?.approved || 0,
    };
  }

  /**
   * Formate un projet pour la réponse API
   */
  private formatProject(project: any): Project {
    return {
      id: project.id,
      organizationId: project.organization_id,
      name: project.name,
      description: project.description,
      status: project.status,
      startDate: project.start_date,
      endDate: project.end_date,
      visibleToClient: project.visible_to_client,
      createdAt: project.created_at.toISOString(),
      updatedAt: project.updated_at.toISOString(),
    };
  }
}

export const projectService = new ProjectService();