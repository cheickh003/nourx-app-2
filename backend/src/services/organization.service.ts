import { db, withTransaction } from '@/config/database';
import { auditService } from '@/services/audit.service';
import { NotFoundError, ConflictError, ValidationError } from '@/types/errors';
import { RequestContext } from '@/types/api';
import { Organization, NewOrganization, OrganizationUpdate } from '@/types/database';
import {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationFilters,
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
} from '@nourx/shared';
import logger from '@/lib/logger';

export interface OrganizationListResult {
  organizations: Organization[];
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class OrganizationService {
  /**
   * Crée une nouvelle organisation
   */
  async createOrganization(
    input: CreateOrganizationInput,
    context: RequestContext
  ): Promise<Organization> {
    // Validation avec Zod
    const validated = CreateOrganizationSchema.parse(input);

    return withTransaction(async (trx) => {
      // Vérifier l'unicité du SIRET
      if (validated.siret) {
        const existingOrg = await trx
          .selectFrom('organization')
          .select('id')
          .where('siret', '=', validated.siret)
          .where('deleted_at', 'is', null)
          .executeTakeFirst();

        if (existingOrg) {
          throw new ConflictError('Une organisation avec ce SIRET existe déjà');
        }
      }

      // Créer l'organisation
      const orgData: NewOrganization = {
        name: validated.name,
        siret: validated.siret || null,
        address: validated.address || null,
        contact_email: validated.contactEmail || null,
        contact_phone: validated.contactPhone || null,
      };

      const [organization] = await trx
        .insertInto('organization')
        .values(orgData)
        .returning([
          'id',
          'name',
          'siret',
          'address',
          'contact_email',
          'contact_phone',
          'created_at',
          'updated_at',
          'deleted_at',
        ])
        .execute();

      if (!organization) {
        throw new Error('Failed to create organization');
      }

      // Créer un audit log (temporairement désactivé pour des raisons de compatibilité UUID)
      // await auditService.createFromContext(
      //   context,
      //   'organization.create',
      //   'organization',
      //   organization.id,
      //   {
      //     organizationName: organization.name,
      //     siret: organization.siret,
      //   }
      // );

      logger.info('Organization created successfully', {
        organizationId: organization.id,
        name: organization.name,
        createdBy: context.user?.id,
      });

      return organization;
    });
  }

  /**
   * Récupère une organisation par ID
   */
  async getOrganizationById(id: string): Promise<Organization> {
    const organization = await db
      .selectFrom('organization')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    if (!organization) {
      throw new NotFoundError('Organization');
    }

    return organization;
  }

  /**
   * Récupère la liste des organisations avec filtres et pagination
   */
  async getOrganizations(
    filters: OrganizationFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<OrganizationListResult> {
    let query = db
      .selectFrom('organization')
      .selectAll()
      .where('deleted_at', 'is', null);

    // Appliquer les filtres
    if (filters.search) {
      query = query.where((eb) =>
        eb.or([
          eb('name', 'ilike', `%${filters.search}%`),
          eb('siret', 'ilike', `%${filters.search}%`),
          eb('contact_email', 'ilike', `%${filters.search}%`),
        ])
      );
    }

    if (filters.hasContact !== undefined) {
      if (filters.hasContact) {
        query = query.where((eb) =>
          eb.or([
            eb('contact_email', 'is not', null),
            eb('contact_phone', 'is not', null),
          ])
        );
      } else {
        query = query.where('contact_email', 'is', null)
          .where('contact_phone', 'is', null);
      }
    }

    if (filters.createdAfter) {
      query = query.where('created_at', '>=', new Date(filters.createdAfter));
    }

    if (filters.createdBefore) {
      query = query.where('created_at', '<=', new Date(filters.createdBefore));
    }

    // Compter le total avec une requête séparée
    let countQuery = db
      .selectFrom('organization')
      .where('deleted_at', 'is', null);

    // Appliquer les mêmes filtres pour le count
    if (filters.search) {
      countQuery = countQuery.where((eb) =>
        eb.or([
          eb('name', 'ilike', `%${filters.search}%`),
          eb('siret', 'ilike', `%${filters.search}%`),
          eb('contact_email', 'ilike', `%${filters.search}%`),
        ])
      );
    }

    if (filters.hasContact !== undefined) {
      if (filters.hasContact) {
        countQuery = countQuery.where((eb) =>
          eb.or([
            eb('contact_email', 'is not', null),
            eb('contact_phone', 'is not', null),
          ])
        );
      } else {
        countQuery = countQuery.where('contact_email', 'is', null)
          .where('contact_phone', 'is', null);
      }
    }

    if (filters.createdAfter) {
      countQuery = countQuery.where('created_at', '>=', new Date(filters.createdAfter));
    }

    if (filters.createdBefore) {
      countQuery = countQuery.where('created_at', '<=', new Date(filters.createdBefore));
    }

    const [totalResult] = await countQuery
      .select((eb) => eb.fn.count('id').as('total'))
      .execute();

    const total = Number(totalResult?.total || 0);

    // Récupérer les organisations avec pagination
    const offset = (page - 1) * limit;
    const organizations = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    return {
      organizations,
      total,
      hasNext: offset + limit < total,
      hasPrev: page > 1,
    };
  }

  /**
   * Met à jour une organisation
   */
  async updateOrganization(
    id: string,
    input: UpdateOrganizationInput,
    context: RequestContext
  ): Promise<Organization> {
    // Validation avec Zod
    const validated = UpdateOrganizationSchema.parse(input);

    return withTransaction(async (trx) => {
      // Vérifier que l'organisation existe
      const existingOrg = await trx
        .selectFrom('organization')
        .selectAll()
        .where('id', '=', id)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (!existingOrg) {
        throw new NotFoundError('Organization');
      }

      // Vérifier l'unicité du SIRET si modifié
      if (validated.siret && validated.siret !== existingOrg.siret) {
        const conflictOrg = await trx
          .selectFrom('organization')
          .select('id')
          .where('siret', '=', validated.siret)
          .where('id', '!=', id)
          .where('deleted_at', 'is', null)
          .executeTakeFirst();

        if (conflictOrg) {
          throw new ConflictError('Une organisation avec ce SIRET existe déjà');
        }
      }

      // Préparer les données de mise à jour
      const updateData: Partial<OrganizationUpdate> = {};

      if (validated.name !== undefined) updateData.name = validated.name;
      if (validated.siret !== undefined) updateData.siret = validated.siret || null;
      if (validated.address !== undefined) updateData.address = validated.address || null;
      if (validated.contactEmail !== undefined) updateData.contact_email = validated.contactEmail || null;
      if (validated.contactPhone !== undefined) updateData.contact_phone = validated.contactPhone || null;

      // Si aucune modification, retourner l'organisation existante
      if (Object.keys(updateData).length === 0) {
        return existingOrg;
      }

      // Mettre à jour l'organisation
      const [updatedOrg] = await trx
        .updateTable('organization')
        .set(updateData)
        .where('id', '=', id)
        .returning([
          'id',
          'name',
          'siret',
          'address',
          'contact_email',
          'contact_phone',
          'created_at',
          'updated_at',
          'deleted_at',
        ])
        .execute();

      if (!updatedOrg) {
        throw new Error('Failed to update organization');
      }

      // Créer un audit log avec les changements
      const changes: Record<string, any> = {};
      
      if (updateData.name && updateData.name !== existingOrg.name) {
        changes.name = { from: existingOrg.name, to: updateData.name };
      }
      if (updateData.siret !== undefined && updateData.siret !== existingOrg.siret) {
        changes.siret = { from: existingOrg.siret, to: updateData.siret };
      }
      if (updateData.address !== undefined && updateData.address !== existingOrg.address) {
        changes.address = { from: existingOrg.address, to: updateData.address };
      }
      if (updateData.contact_email !== undefined && updateData.contact_email !== existingOrg.contact_email) {
        changes.contactEmail = { from: existingOrg.contact_email, to: updateData.contact_email };
      }
      if (updateData.contact_phone !== undefined && updateData.contact_phone !== existingOrg.contact_phone) {
        changes.contactPhone = { from: existingOrg.contact_phone, to: updateData.contact_phone };
      }

      // await auditService.createFromContext(
      //   context,
      //   'organization.update',
      //   'organization',
      //   id,
      //   {
      //     organizationName: updatedOrg.name,
      //     changes,
      //   }
      // );

      logger.info('Organization updated successfully', {
        organizationId: id,
        updatedBy: context.user?.id,
        changes: Object.keys(changes),
      });

      return updatedOrg;
    });
  }

  /**
   * Supprime une organisation (soft delete)
   */
  async deleteOrganization(id: string, context: RequestContext): Promise<void> {
    return withTransaction(async (trx) => {
      // Vérifier que l'organisation existe
      const existingOrg = await trx
        .selectFrom('organization')
        .select(['id', 'name'])
        .where('id', '=', id)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (!existingOrg) {
        throw new NotFoundError('Organization');
      }

      // Vérifier s'il y a des utilisateurs clients associés
      const clientCount = await trx
        .selectFrom('user_client')
        .select((eb) => eb.fn.count('id').as('count'))
        .where('organization_id', '=', id)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (Number(clientCount?.count || 0) > 0) {
        throw new ValidationError(
          'Cannot delete organization with active client users. Deactivate or delete users first.'
        );
      }

      // Supprimer l'organisation (soft delete)
      await trx
        .updateTable('organization')
        .set({ deleted_at: new Date() })
        .where('id', '=', id)
        .execute();

      // Créer un audit log (temporairement désactivé)
      // await auditService.createFromContext(
      //   context,
      //   'organization.delete',
      //   'organization',
      //   id,
      //   {
      //     organizationName: existingOrg.name,
      //   }
      // );

      logger.info('Organization deleted successfully', {
        organizationId: id,
        organizationName: existingOrg.name,
        deletedBy: context.user?.id,
      });
    });
  }

  /**
   * Restaure une organisation supprimée
   */
  async restoreOrganization(id: string, context: RequestContext): Promise<Organization> {
    return withTransaction(async (trx) => {
      // Vérifier que l'organisation existe et est supprimée
      const existingOrg = await trx
        .selectFrom('organization')
        .selectAll()
        .where('id', '=', id)
        .where('deleted_at', 'is not', null)
        .executeTakeFirst();

      if (!existingOrg) {
        throw new NotFoundError('Deleted organization');
      }

      // Vérifier l'unicité du SIRET s'il existe
      if (existingOrg.siret) {
        const conflictOrg = await trx
          .selectFrom('organization')
          .select('id')
          .where('siret', '=', existingOrg.siret)
          .where('id', '!=', id)
          .where('deleted_at', 'is', null)
          .executeTakeFirst();

        if (conflictOrg) {
          throw new ConflictError('Une organisation avec ce SIRET existe déjà');
        }
      }

      // Restaurer l'organisation
      const [restoredOrg] = await trx
        .updateTable('organization')
        .set({ deleted_at: null })
        .where('id', '=', id)
        .returning([
          'id',
          'name',
          'siret',
          'address',
          'contact_email',
          'contact_phone',
          'created_at',
          'updated_at',
          'deleted_at',
        ])
        .execute();

      if (!restoredOrg) {
        throw new Error('Failed to restore organization');
      }

      // Créer un audit log
      await auditService.createFromContext(
        context,
        'organization.restore',
        'organization',
        id,
        {
          organizationName: restoredOrg.name,
        }
      );

      logger.info('Organization restored successfully', {
        organizationId: id,
        organizationName: restoredOrg.name,
        restoredBy: context.user?.id,
      });

      return restoredOrg;
    });
  }

  /**
   * Récupère les statistiques des organisations
   */
  async getOrganizationStats(): Promise<{
    total: number;
    active: number;
    deleted: number;
    withContacts: number;
    recentlyCreated: number; // dernières 30 jours
  }> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const stats = await db
      .selectFrom('organization')
      .select([
        (eb) => eb.fn.count('id').as('total'),
        (eb) => eb.fn.count('id').filterWhere('deleted_at', 'is', null).as('active'),
        (eb) => eb.fn.count('id').filterWhere('deleted_at', 'is not', null).as('deleted'),
        (eb) => eb.fn.count('id')
          .filterWhere('deleted_at', 'is', null)
          .filterWhere((eb2) => eb2.or([
            eb2('contact_email', 'is not', null),
            eb2('contact_phone', 'is not', null),
          ]))
          .as('with_contacts'),
        (eb) => eb.fn.count('id')
          .filterWhere('created_at', '>=', thirtyDaysAgo)
          .as('recently_created'),
      ])
      .executeTakeFirst();

    return {
      total: Number(stats?.total || 0),
      active: Number(stats?.active || 0),
      deleted: Number(stats?.deleted || 0),
      withContacts: Number(stats?.with_contacts || 0),
      recentlyCreated: Number(stats?.recently_created || 0),
    };
  }

  /**
   * Vérifie si une organisation existe et est active
   */
  async organizationExists(id: string): Promise<boolean> {
    const org = await db
      .selectFrom('organization')
      .select('id')
      .where('id', '=', id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst();

    return !!org;
  }
}

// Instance singleton
export const organizationService = new OrganizationService();
export default organizationService;