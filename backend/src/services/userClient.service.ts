import { db, withTransaction } from '@/config/database';
import { auditService } from '@/services/audit.service';
import { emailService } from '@/services/email.service';
import { organizationService } from '@/services/organization.service';
import { NotFoundError, ConflictError, ValidationError, AuthorizationError } from '@/types/errors';
import { RequestContext } from '@/types/api';
import { UserClient, NewUserClient, UserClientUpdate } from '@/types/database';
import {
  CreateUserClientInput,
  UpdateUserClientInput,
  DeactivateUserInput,
  UnlockUserInput,
  UserClientFilters,
  CreateUserClientSchema,
  UpdateUserClientSchema,
  DeactivateUserSchema,
  UnlockUserSchema,
} from '@nourx/shared';
import { config } from '@/config';
import logger from '@/lib/logger';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface UserClientListResult {
  users: UserClient[];
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export class UserClientService {
  /**
   * Crée un nouvel utilisateur client
   */
  async createUserClient(
    input: CreateUserClientInput,
    context: RequestContext
  ): Promise<UserClient> {
    // Validation avec Zod
    const validated = CreateUserClientSchema.parse(input);

    return withTransaction(async (trx) => {
      // Vérifier que l'organisation existe
      const orgExists = await organizationService.organizationExists(validated.organizationId);
      if (!orgExists) {
        throw new ValidationError('Organization not found');
      }

      // Vérifier l'unicité de l'email dans cette organisation
      const existingUser = await trx
        .selectFrom('user_client')
        .select('id')
        .where('email', '=', validated.email)
        .where('organization_id', '=', validated.organizationId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (existingUser) {
        throw new ConflictError('Un utilisateur avec cet email existe déjà dans cette organisation');
      }

      // Générer token d'activation et mot de passe temporaire
      const activationToken = uuidv4();
      const temporaryPassword = this.generateTemporaryPassword();
      const passwordHash = await bcrypt.hash(temporaryPassword, 12);

      // Créer l'utilisateur
      const userData: NewUserClient = {
        organization_id: validated.organizationId,
        email: validated.email,
        password_hash: passwordHash,
        name: validated.name,
        role: validated.role,
        is_active: false, // Inactif jusqu'à activation
        activation_token: activationToken,
        activation_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
      };

      const [user] = await trx
        .insertInto('user_client')
        .values(userData)
        .returning([
          'id',
          'organization_id',
          'email',
          'password_hash',
          'name',
          'role',
          'is_active',
          'activation_token',
          'activation_expires_at',
          'reset_password_token',
          'reset_password_expires_at',
          'disabled_reason',
          'last_login_at',
          'failed_login_attempts',
          'locked_until',
          'created_at',
          'updated_at',
          'deleted_at',
        ])
        .execute();

      if (!user) {
        throw new Error('Failed to create user client');
      }

      // Envoyer l'email d'activation si demandé
      if (validated.sendInvitation) {
        const activationUrl = `${config.auth.baseUrl}/activate?token=${activationToken}`;
        await emailService.sendAccountActivation(user.email, user.name, activationUrl);
      }

      // Créer un audit log
      await auditService.createFromContext(
        context,
        'user_client.create',
        'user_client',
        user.id,
        {
          userEmail: user.email,
          userName: user.name,
          userRole: user.role,
          organizationId: user.organization_id,
          sendInvitation: validated.sendInvitation,
        }
      );

      logger.info('User client created successfully', {
        userId: user.id,
        email: user.email,
        organizationId: user.organization_id,
        createdBy: context.user?.id,
        sendInvitation: validated.sendInvitation,
      });

      // Ne pas retourner le token d'activation dans la réponse
      return { ...user, activation_token: null };
    });
  }

  /**
   * Récupère un utilisateur client par ID
   */
  async getUserClientById(id: string, organizationId?: string): Promise<UserClient> {
    let query = db
      .selectFrom('user_client')
      .selectAll()
      .where('id', '=', id)
      .where('deleted_at', 'is', null);

    // Filtrer par organisation si spécifié (sécurité multi-tenant)
    if (organizationId) {
      query = query.where('organization_id', '=', organizationId);
    }

    const user = await query.executeTakeFirst();

    if (!user) {
      throw new NotFoundError('User client');
    }

    // Ne pas retourner les tokens sensibles
    return {
      ...user,
      activation_token: null,
      reset_password_token: null,
    };
  }

  /**
   * Récupère la liste des utilisateurs clients avec filtres et pagination
   */
  async getUserClients(
    filters: UserClientFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<UserClientListResult> {
    let query = db
      .selectFrom('user_client')
      .selectAll()
      .where('deleted_at', 'is', null);

    // Appliquer les filtres
    if (filters.search) {
      query = query.where((eb) =>
        eb.or([
          eb('name', 'ilike', `%${filters.search}%`),
          eb('email', 'ilike', `%${filters.search}%`),
        ])
      );
    }

    if (filters.organizationId) {
      query = query.where('organization_id', '=', filters.organizationId);
    }

    if (filters.role) {
      query = query.where('role', '=', filters.role);
    }

    if (filters.isActive !== undefined) {
      query = query.where('is_active', '=', filters.isActive);
    }

    if (filters.isLocked !== undefined) {
      if (filters.isLocked) {
        query = query.where('locked_until', 'is not', null)
          .where('locked_until', '>', new Date());
      } else {
        query = query.where((eb) =>
          eb.or([
            eb('locked_until', 'is', null),
            eb('locked_until', '<=', new Date()),
          ])
        );
      }
    }

    if (filters.hasActivationPending !== undefined) {
      if (filters.hasActivationPending) {
        query = query.where('activation_token', 'is not', null)
          .where('activation_expires_at', '>', new Date());
      } else {
        query = query.where((eb) =>
          eb.or([
            eb('activation_token', 'is', null),
            eb('activation_expires_at', '<=', new Date()),
          ])
        );
      }
    }

    if (filters.createdAfter) {
      query = query.where('created_at', '>=', new Date(filters.createdAfter));
    }

    if (filters.createdBefore) {
      query = query.where('created_at', '<=', new Date(filters.createdBefore));
    }

    // Compter le total
    const [totalResult] = await query
      .select((eb) => eb.fn.count('id').as('total'))
      .execute();

    const total = Number(totalResult?.total || 0);

    // Récupérer les utilisateurs avec pagination
    const offset = (page - 1) * limit;
    const users = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset)
      .execute();

    // Nettoyer les tokens sensibles
    const cleanUsers = users.map(user => ({
      ...user,
      activation_token: null,
      reset_password_token: null,
    }));

    return {
      users: cleanUsers,
      total,
      hasNext: offset + limit < total,
      hasPrev: page > 1,
    };
  }

  /**
   * Met à jour un utilisateur client
   */
  async updateUserClient(
    id: string,
    input: UpdateUserClientInput,
    context: RequestContext,
    organizationId?: string
  ): Promise<UserClient> {
    // Validation avec Zod
    const validated = UpdateUserClientSchema.parse(input);

    return withTransaction(async (trx) => {
      // Vérifier que l'utilisateur existe
      let query = trx
        .selectFrom('user_client')
        .selectAll()
        .where('id', '=', id)
        .where('deleted_at', 'is', null);

      if (organizationId) {
        query = query.where('organization_id', '=', organizationId);
      }

      const existingUser = await query.executeTakeFirst();

      if (!existingUser) {
        throw new NotFoundError('User client');
      }

      // Préparer les données de mise à jour
      const updateData: Partial<UserClientUpdate> = {};

      if (validated.name !== undefined) updateData.name = validated.name;
      if (validated.role !== undefined) updateData.role = validated.role;

      // Si aucune modification, retourner l'utilisateur existant
      if (Object.keys(updateData).length === 0) {
        return { ...existingUser, activation_token: null, reset_password_token: null };
      }

      // Mettre à jour l'utilisateur
      const [updatedUser] = await trx
        .updateTable('user_client')
        .set(updateData)
        .where('id', '=', id)
        .returning([
          'id',
          'organization_id',
          'email',
          'password_hash',
          'name',
          'role',
          'is_active',
          'activation_token',
          'activation_expires_at',
          'reset_password_token',
          'reset_password_expires_at',
          'disabled_reason',
          'last_login_at',
          'failed_login_attempts',
          'locked_until',
          'created_at',
          'updated_at',
          'deleted_at',
        ])
        .execute();

      if (!updatedUser) {
        throw new Error('Failed to update user client');
      }

      // Créer un audit log avec les changements
      const changes: Record<string, any> = {};
      
      if (updateData.name && updateData.name !== existingUser.name) {
        changes.name = { from: existingUser.name, to: updateData.name };
      }
      if (updateData.role && updateData.role !== existingUser.role) {
        changes.role = { from: existingUser.role, to: updateData.role };
      }

      await auditService.createFromContext(
        context,
        'user_client.update',
        'user_client',
        id,
        {
          userEmail: updatedUser.email,
          userName: updatedUser.name,
          organizationId: updatedUser.organization_id,
          changes,
        }
      );

      logger.info('User client updated successfully', {
        userId: id,
        updatedBy: context.user?.id,
        changes: Object.keys(changes),
      });

      return { ...updatedUser, activation_token: null, reset_password_token: null };
    });
  }

  /**
   * Désactive un utilisateur client
   */
  async deactivateUserClient(
    id: string,
    input: DeactivateUserInput,
    context: RequestContext,
    organizationId?: string
  ): Promise<void> {
    // Validation avec Zod
    const validated = DeactivateUserSchema.parse(input);

    return withTransaction(async (trx) => {
      // Vérifier que l'utilisateur existe et est actif
      let query = trx
        .selectFrom('user_client')
        .select(['id', 'email', 'name', 'is_active', 'organization_id'])
        .where('id', '=', id)
        .where('deleted_at', 'is', null);

      if (organizationId) {
        query = query.where('organization_id', '=', organizationId);
      }

      const user = await query.executeTakeFirst();

      if (!user) {
        throw new NotFoundError('User client');
      }

      if (!user.is_active) {
        throw new ValidationError('User is already inactive');
      }

      // Désactiver l'utilisateur
      await trx
        .updateTable('user_client')
        .set({
          is_active: false,
          disabled_reason: validated.reason,
        })
        .where('id', '=', id)
        .execute();

      // TODO: Invalider toutes les sessions actives de cet utilisateur

      // Envoyer email de notification
      await emailService.sendAccountDeactivation(user.email, user.name, validated.reason);

      // Créer un audit log
      await auditService.createFromContext(
        context,
        'user_client.deactivate',
        'user_client',
        id,
        {
          userEmail: user.email,
          userName: user.name,
          organizationId: user.organization_id,
          reason: validated.reason,
        }
      );

      logger.info('User client deactivated successfully', {
        userId: id,
        userEmail: user.email,
        reason: validated.reason,
        deactivatedBy: context.user?.id,
      });
    });
  }

  /**
   * Active/réactive un utilisateur client
   */
  async activateUserClient(
    id: string,
    context: RequestContext,
    organizationId?: string
  ): Promise<void> {
    return withTransaction(async (trx) => {
      // Vérifier que l'utilisateur existe
      let query = trx
        .selectFrom('user_client')
        .select(['id', 'email', 'name', 'is_active', 'organization_id'])
        .where('id', '=', id)
        .where('deleted_at', 'is', null);

      if (organizationId) {
        query = query.where('organization_id', '=', organizationId);
      }

      const user = await query.executeTakeFirst();

      if (!user) {
        throw new NotFoundError('User client');
      }

      if (user.is_active) {
        throw new ValidationError('User is already active');
      }

      // Activer l'utilisateur
      await trx
        .updateTable('user_client')
        .set({
          is_active: true,
          disabled_reason: null,
          failed_login_attempts: 0,
          locked_until: null,
        })
        .where('id', '=', id)
        .execute();

      // Créer un audit log
      await auditService.createFromContext(
        context,
        'user_client.activate',
        'user_client',
        id,
        {
          userEmail: user.email,
          userName: user.name,
          organizationId: user.organization_id,
        }
      );

      logger.info('User client activated successfully', {
        userId: id,
        userEmail: user.email,
        activatedBy: context.user?.id,
      });
    });
  }

  /**
   * Supprime un utilisateur client (soft delete)
   */
  async deleteUserClient(
    id: string,
    context: RequestContext,
    organizationId?: string
  ): Promise<void> {
    return withTransaction(async (trx) => {
      // Vérifier que l'utilisateur existe
      let query = trx
        .selectFrom('user_client')
        .select(['id', 'email', 'name', 'organization_id'])
        .where('id', '=', id)
        .where('deleted_at', 'is', null);

      if (organizationId) {
        query = query.where('organization_id', '=', organizationId);
      }

      const user = await query.executeTakeFirst();

      if (!user) {
        throw new NotFoundError('User client');
      }

      // Supprimer l'utilisateur (soft delete)
      await trx
        .updateTable('user_client')
        .set({ deleted_at: new Date() })
        .where('id', '=', id)
        .execute();

      // TODO: Invalider toutes les sessions actives de cet utilisateur

      // Créer un audit log
      await auditService.createFromContext(
        context,
        'user_client.delete',
        'user_client',
        id,
        {
          userEmail: user.email,
          userName: user.name,
          organizationId: user.organization_id,
        }
      );

      logger.info('User client deleted successfully', {
        userId: id,
        userEmail: user.email,
        deletedBy: context.user?.id,
      });
    });
  }

  /**
   * Déverrouille un compte utilisateur
   */
  async unlockUserClient(
    id: string,
    input: UnlockUserInput,
    context: RequestContext,
    organizationId?: string
  ): Promise<void> {
    // Validation avec Zod
    const validated = UnlockUserSchema.parse(input);

    return withTransaction(async (trx) => {
      // Vérifier que l'utilisateur existe et est verrouillé
      let query = trx
        .selectFrom('user_client')
        .select(['id', 'email', 'name', 'locked_until', 'organization_id'])
        .where('id', '=', id)
        .where('deleted_at', 'is', null);

      if (organizationId) {
        query = query.where('organization_id', '=', organizationId);
      }

      const user = await query.executeTakeFirst();

      if (!user) {
        throw new NotFoundError('User client');
      }

      const isLocked = user.locked_until && user.locked_until > new Date();
      if (!isLocked) {
        throw new ValidationError('User account is not locked');
      }

      // Déverrouiller l'utilisateur
      await trx
        .updateTable('user_client')
        .set({
          failed_login_attempts: 0,
          locked_until: null,
        })
        .where('id', '=', id)
        .execute();

      // Créer un audit log
      await auditService.createFromContext(
        context,
        'user_client.unlock',
        'user_client',
        id,
        {
          userEmail: user.email,
          userName: user.name,
          organizationId: user.organization_id,
          reason: validated.reason,
        }
      );

      logger.info('User client unlocked successfully', {
        userId: id,
        userEmail: user.email,
        reason: validated.reason,
        unlockedBy: context.user?.id,
      });
    });
  }

  /**
   * Renvoie l'invitation d'activation
   */
  async resendInvitation(
    id: string,
    context: RequestContext,
    organizationId?: string
  ): Promise<void> {
    return withTransaction(async (trx) => {
      // Vérifier que l'utilisateur existe
      let query = trx
        .selectFrom('user_client')
        .select(['id', 'email', 'name', 'is_active', 'organization_id'])
        .where('id', '=', id)
        .where('deleted_at', 'is', null);

      if (organizationId) {
        query = query.where('organization_id', '=', organizationId);
      }

      const user = await query.executeTakeFirst();

      if (!user) {
        throw new NotFoundError('User client');
      }

      if (user.is_active) {
        throw new ValidationError('User is already active');
      }

      // Générer un nouveau token d'activation
      const activationToken = uuidv4();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

      await trx
        .updateTable('user_client')
        .set({
          activation_token: activationToken,
          activation_expires_at: expiresAt,
        })
        .where('id', '=', id)
        .execute();

      // Envoyer l'email d'activation
      const activationUrl = `${config.auth.baseUrl}/activate?token=${activationToken}`;
      await emailService.sendAccountActivation(user.email, user.name, activationUrl);

      // Créer un audit log
      await auditService.createFromContext(
        context,
        'user_client.resend_invitation',
        'user_client',
        id,
        {
          userEmail: user.email,
          userName: user.name,
          organizationId: user.organization_id,
        }
      );

      logger.info('Invitation resent successfully', {
        userId: id,
        userEmail: user.email,
        resentBy: context.user?.id,
      });
    });
  }

  /**
   * Initie la réinitialisation de mot de passe
   */
  async resetPassword(
    id: string,
    context: RequestContext,
    organizationId?: string
  ): Promise<void> {
    return withTransaction(async (trx) => {
      // Vérifier que l'utilisateur existe
      let query = trx
        .selectFrom('user_client')
        .select(['id', 'email', 'name', 'organization_id'])
        .where('id', '=', id)
        .where('deleted_at', 'is', null);

      if (organizationId) {
        query = query.where('organization_id', '=', organizationId);
      }

      const user = await query.executeTakeFirst();

      if (!user) {
        throw new NotFoundError('User client');
      }

      // Générer un token de réinitialisation
      const resetToken = uuidv4();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 heure

      await trx
        .updateTable('user_client')
        .set({
          reset_password_token: resetToken,
          reset_password_expires_at: expiresAt,
        })
        .where('id', '=', id)
        .execute();

      // Envoyer l'email de réinitialisation
      const resetUrl = `${config.auth.baseUrl}/reset-password?token=${resetToken}`;
      await emailService.sendPasswordReset(user.email, user.name, resetUrl);

      // Créer un audit log
      await auditService.createFromContext(
        context,
        'user_client.reset_password',
        'user_client',
        id,
        {
          userEmail: user.email,
          userName: user.name,
          organizationId: user.organization_id,
        }
      );

      logger.info('Password reset initiated successfully', {
        userId: id,
        userEmail: user.email,
        initiatedBy: context.user?.id,
      });
    });
  }

  /**
   * Génère un mot de passe temporaire
   */
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Statistiques des utilisateurs clients
   */
  async getUserClientStats(organizationId?: string): Promise<{
    total: number;
    active: number;
    inactive: number;
    locked: number;
    pendingActivation: number;
    byRole: Record<string, number>;
  }> {
    let query = db.selectFrom('user_client').where('deleted_at', 'is', null);

    if (organizationId) {
      query = query.where('organization_id', '=', organizationId);
    }

    const now = new Date();

    const stats = await query
      .select([
        (eb) => eb.fn.count('id').as('total'),
        (eb) => eb.fn.count('id').filterWhere('is_active', '=', true).as('active'),
        (eb) => eb.fn.count('id').filterWhere('is_active', '=', false).as('inactive'),
        (eb) => eb.fn.count('id')
          .filterWhere('locked_until', 'is not', null)
          .filterWhere('locked_until', '>', now)
          .as('locked'),
        (eb) => eb.fn.count('id')
          .filterWhere('activation_token', 'is not', null)
          .filterWhere('activation_expires_at', '>', now)
          .as('pending_activation'),
      ])
      .executeTakeFirst();

    // Statistiques par rôle
    const roleStats = await query
      .select(['role', (eb) => eb.fn.count('id').as('count')])
      .groupBy('role')
      .execute();

    const byRole = roleStats.reduce((acc, stat) => {
      acc[stat.role] = Number(stat.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      total: Number(stats?.total || 0),
      active: Number(stats?.active || 0),
      inactive: Number(stats?.inactive || 0),
      locked: Number(stats?.locked || 0),
      pendingActivation: Number(stats?.pending_activation || 0),
      byRole,
    };
  }
}

// Instance singleton
export const userClientService = new UserClientService();
export default userClientService;
