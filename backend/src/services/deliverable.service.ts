import { db, withTransaction } from '@/config/database';
import { auditService } from '@/services/audit.service';
import { fileStorageService } from '@/services/fileStorage.service';
import { NotFoundError, ConflictError, ValidationError, ForbiddenError } from '@/types/errors';
import { RequestContext } from '@/types/api';
import {
  CreateDeliverableInput,
  ApproveDeliverableInput,
  Deliverable,
  DeliverableStatus,
  CreateDeliverableSchema,
  ApproveDeliverableSchema,
} from '@nourx/shared';
import logger from '@/lib/logger';

export interface DeliverableListResult {
  deliverables: Deliverable[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface DeliverableFilters {
  search?: string;
  projectId?: string;
  milestoneId?: string;
  status?: DeliverableStatus;
  uploadedBy?: string;
}

export class DeliverableService {
  /**
   * Upload un nouveau livrable
   */
  async createDeliverable(
    input: CreateDeliverableInput,
    file: { buffer: Buffer; fileName: string; mimeType: string },
    context: RequestContext
  ): Promise<Deliverable> {
    // Validation avec Zod
    const validated = CreateDeliverableSchema.parse(input);

    return withTransaction(async (trx) => {
      // Vérifier que le projet existe et récupérer l'organisation
      const project = await trx
        .selectFrom('project')
        .select(['id', 'organization_id'])
        .where('id', '=', validated.projectId)
        .executeTakeFirst();

      if (!project) {
        throw new NotFoundError('Projet introuvable');
      }

      // Vérifier le jalon s'il est spécifié
      if (validated.milestoneId) {
        const milestone = await trx
          .selectFrom('milestone')
          .select('id')
          .where('id', '=', validated.milestoneId)
          .where('project_id', '=', validated.projectId)
          .executeTakeFirst();

        if (!milestone) {
          throw new NotFoundError('Jalon introuvable dans ce projet');
        }
      }

      // Déterminer la version suivante pour ce livrable
      const existingDeliverable = await trx
        .selectFrom('deliverable')
        .select(['version'])
        .where('name', '=', validated.name)
        .where('project_id', '=', validated.projectId)
        .orderBy('version', 'desc')
        .executeTakeFirst();

      const version = existingDeliverable ? existingDeliverable.version + 1 : 1;

      // Sauvegarder le fichier
      const fileResult = await fileStorageService.saveDeliverable({
        organizationId: project.organization_id,
        fileName: file.fileName,
        buffer: file.buffer,
        mimeType: file.mimeType,
        version,
      });

      // Créer le livrable en base
      const deliverable = await trx
        .insertInto('deliverable')
        .values({
          project_id: validated.projectId,
          milestone_id: validated.milestoneId || null,
          name: validated.name,
          description: validated.description || null,
          file_path: fileResult.filePath,
          file_name: fileResult.fileName,
          file_size: fileResult.fileSize,
          mime_type: fileResult.mimeType,
          version,
          uploaded_by: context.user.id,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Audit log
      await auditService.log(
        'deliverable_uploaded',
        context.user.id,
        context.user.role === 'admin' ? 'admin' : 'client',
        `Livrable uploadé: ${deliverable.name} v${deliverable.version}`,
        {
          deliverableId: deliverable.id,
          projectId: deliverable.project_id,
          organizationId: project.organization_id,
          fileName: deliverable.file_name,
          fileSize: deliverable.file_size,
        },
        trx
      );

      logger.info('Livrable créé', {
        deliverableId: deliverable.id,
        name: deliverable.name,
        version: deliverable.version,
        projectId: deliverable.project_id,
        fileSize: deliverable.file_size,
        userId: context.user.id,
      });

      return this.formatDeliverable(deliverable);
    });
  }

  /**
   * Récupère un livrable par son ID
   */
  async getDeliverableById(
    id: string,
    context: RequestContext
  ): Promise<Deliverable> {
    const deliverable = await db
      .selectFrom('deliverable')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!deliverable) {
      throw new NotFoundError('Livrable introuvable');
    }

    return this.formatDeliverable(deliverable);
  }

  /**
   * Télécharge le fichier d'un livrable
   */
  async downloadDeliverable(
    id: string,
    context: RequestContext
  ): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const deliverable = await db
      .selectFrom('deliverable')
      .select(['file_path', 'file_name', 'mime_type'])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!deliverable) {
      throw new NotFoundError('Livrable introuvable');
    }

    const buffer = await fileStorageService.getFile(deliverable.file_path);

    return {
      buffer,
      fileName: deliverable.file_name,
      mimeType: deliverable.mime_type,
    };
  }

  /**
   * Marque un livrable comme livré (change le statut à "delivered")
   */
  async markAsDelivered(
    id: string,
    context: RequestContext
  ): Promise<Deliverable> {
    return withTransaction(async (trx) => {
      // Vérifier que le livrable existe
      const deliverable = await trx
        .selectFrom('deliverable')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();

      if (!deliverable) {
        throw new NotFoundError('Livrable introuvable');
      }

      // Vérifier que le statut permet cette transition
      if (deliverable.status !== 'pending') {
        throw new ValidationError('Seuls les livrables en attente peuvent être marqués comme livrés');
      }

      // Mettre à jour le statut
      const updatedDeliverable = await trx
        .updateTable('deliverable')
        .set({
          status: 'delivered',
          updated_at: new Date(),
        })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Audit log
      await auditService.log(
        'deliverable_delivered',
        context.user.id,
        context.user.role === 'admin' ? 'admin' : 'client',
        `Livrable marqué comme livré: ${updatedDeliverable.name}`,
        {
          deliverableId: updatedDeliverable.id,
          projectId: updatedDeliverable.project_id,
        },
        trx
      );

      logger.info('Livrable marqué comme livré', {
        deliverableId: updatedDeliverable.id,
        name: updatedDeliverable.name,
        userId: context.user.id,
      });

      return this.formatDeliverable(updatedDeliverable);
    });
  }

  /**
   * Approuve ou demande une révision d'un livrable
   */
  async approveDeliverable(
    id: string,
    input: ApproveDeliverableInput,
    context: RequestContext
  ): Promise<Deliverable> {
    // Validation avec Zod
    const validated = ApproveDeliverableSchema.parse(input);

    // Seuls les admins peuvent approuver/demander des révisions
    if (context.user.role !== 'admin') {
      throw new ForbiddenError('Seuls les administrateurs peuvent approuver des livrables');
    }

    return withTransaction(async (trx) => {
      // Vérifier que le livrable existe
      const deliverable = await trx
        .selectFrom('deliverable')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();

      if (!deliverable) {
        throw new NotFoundError('Livrable introuvable');
      }

      // Vérifier que le statut permet cette action
      if (deliverable.status !== 'delivered') {
        throw new ValidationError('Seuls les livrables livrés peuvent être approuvés ou nécessiter une révision');
      }

      const newStatus: DeliverableStatus = validated.approved ? 'approved' : 'revision_requested';

      // Mettre à jour le statut et le commentaire
      const updatedDeliverable = await trx
        .updateTable('deliverable')
        .set({
          status: newStatus,
          approval_comment: validated.comment || null,
          updated_at: new Date(),
        })
        .where('id', '=', id)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Audit log
      const action = validated.approved ? 'deliverable_approved' : 'deliverable_revision_requested';
      const message = validated.approved 
        ? `Livrable approuvé: ${updatedDeliverable.name}`
        : `Révision demandée pour le livrable: ${updatedDeliverable.name}`;

      await auditService.log(
        action,
        context.user.id,
        'admin',
        message,
        {
          deliverableId: updatedDeliverable.id,
          projectId: updatedDeliverable.project_id,
          comment: validated.comment,
        },
        trx
      );

      logger.info(validated.approved ? 'Livrable approuvé' : 'Révision demandée', {
        deliverableId: updatedDeliverable.id,
        name: updatedDeliverable.name,
        comment: validated.comment,
        userId: context.user.id,
      });

      return this.formatDeliverable(updatedDeliverable);
    });
  }

  /**
   * Supprime un livrable (soft delete en supprimant le fichier)
   */
  async deleteDeliverable(
    id: string,
    context: RequestContext
  ): Promise<void> {
    return withTransaction(async (trx) => {
      // Vérifier que le livrable existe
      const deliverable = await trx
        .selectFrom('deliverable')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();

      if (!deliverable) {
        throw new NotFoundError('Livrable introuvable');
      }

      // Supprimer le fichier
      await fileStorageService.deleteFile(deliverable.file_path);

      // Supprimer l'enregistrement
      await trx
        .deleteFrom('deliverable')
        .where('id', '=', id)
        .execute();

      // Audit log
      await auditService.log(
        'deliverable_deleted',
        context.user.id,
        context.user.role === 'admin' ? 'admin' : 'client',
        `Livrable supprimé: ${deliverable.name}`,
        {
          deliverableId: deliverable.id,
          projectId: deliverable.project_id,
          fileName: deliverable.file_name,
        },
        trx
      );

      logger.info('Livrable supprimé', {
        deliverableId: deliverable.id,
        name: deliverable.name,
        userId: context.user.id,
      });
    });
  }

  /**
   * Liste les livrables avec filtres et pagination
   */
  async listDeliverables(
    filters: DeliverableFilters,
    page: number = 1,
    limit: number = 20,
    context: RequestContext
  ): Promise<DeliverableListResult> {
    let query = db
      .selectFrom('deliverable')
      .selectAll()
      .orderBy('created_at', 'desc');

    // Appliquer les filtres
    if (filters.search) {
      query = query.where((eb) =>
        eb.or([
          eb('name', 'ilike', `%${filters.search}%`),
          eb('description', 'ilike', `%${filters.search}%`),
          eb('file_name', 'ilike', `%${filters.search}%`),
        ])
      );
    }

    if (filters.projectId) {
      query = query.where('project_id', '=', filters.projectId);
    }

    if (filters.milestoneId) {
      query = query.where('milestone_id', '=', filters.milestoneId);
    }

    if (filters.status) {
      query = query.where('status', '=', filters.status);
    }

    if (filters.uploadedBy) {
      query = query.where('uploaded_by', '=', filters.uploadedBy);
    }

    // Compter le total
    const totalQuery = query
      .clearSelect()
      .select((eb) => eb.fn.count<number>('id').as('count'));
    
    const totalResult = await totalQuery.executeTakeFirst();
    const total = totalResult?.count || 0;

    // Appliquer la pagination
    const offset = (page - 1) * limit;
    const deliverables = await query
      .limit(limit)
      .offset(offset)
      .execute();

    const hasNext = offset + deliverables.length < total;
    const hasPrev = page > 1;

    return {
      deliverables: deliverables.map(d => this.formatDeliverable(d)),
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
   * Récupère l'historique des versions d'un livrable
   */
  async getDeliverableVersions(
    name: string,
    projectId: string,
    context: RequestContext
  ): Promise<Deliverable[]> {
    const versions = await db
      .selectFrom('deliverable')
      .selectAll()
      .where('name', '=', name)
      .where('project_id', '=', projectId)
      .orderBy('version', 'desc')
      .execute();

    return versions.map(d => this.formatDeliverable(d));
  }

  /**
   * Formate un livrable pour la réponse API
   */
  private formatDeliverable(deliverable: any): Deliverable {
    return {
      id: deliverable.id,
      projectId: deliverable.project_id,
      milestoneId: deliverable.milestone_id,
      name: deliverable.name,
      description: deliverable.description,
      fileName: deliverable.file_name,
      fileSize: deliverable.file_size,
      mimeType: deliverable.mime_type,
      version: deliverable.version,
      status: deliverable.status,
      approvalComment: deliverable.approval_comment,
      uploadedBy: deliverable.uploaded_by,
      createdAt: deliverable.created_at.toISOString(),
      updatedAt: deliverable.updated_at.toISOString(),
    };
  }
}

export const deliverableService = new DeliverableService();