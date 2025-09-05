import { z } from 'zod';
import { AdminRoleSchema, ClientRoleSchema } from './auth';

// Schéma de base pour un utilisateur
const BaseUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  isActive: z.boolean(),
  lastLoginAt: z.string().datetime().nullable(),
  failedLoginAttempts: z.number().min(0),
  lockedUntil: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Schéma pour un utilisateur admin
export const UserAdminSchema = BaseUserSchema.extend({
  role: AdminRoleSchema,
});

// Schéma pour un utilisateur client
export const UserClientSchema = BaseUserSchema.extend({
  organizationId: z.string().uuid(),
  role: ClientRoleSchema,
  activationToken: z.string().nullable(),
  activationExpiresAt: z.string().datetime().nullable(),
  resetPasswordToken: z.string().nullable(),
  resetPasswordExpiresAt: z.string().datetime().nullable(),
  disabledReason: z.string().nullable(),
  deletedAt: z.string().datetime().nullable(),
});

// Schémas pour la création d'utilisateurs
export const CreateUserAdminSchema = z.object({
  email: z.string().email('Format d\'email invalide').toLowerCase(),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
  role: AdminRoleSchema,
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'),
});

export const CreateUserClientSchema = z.object({
  organizationId: z.string().uuid('ID d\'organisation invalide'),
  email: z.string().email('Format d\'email invalide').toLowerCase(),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
  role: ClientRoleSchema,
  sendInvitation: z.boolean().default(true),
});

// Schémas pour la mise à jour d'utilisateurs
export const UpdateUserAdminSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  role: AdminRoleSchema.optional(),
  isActive: z.boolean().optional(),
});

export const UpdateUserClientSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  role: ClientRoleSchema.optional(),
});

// Schémas pour les actions sur les comptes
export const DeactivateUserSchema = z.object({
  reason: z.string().min(5, 'Le motif doit contenir au moins 5 caractères').max(1000),
});

export const UnlockUserSchema = z.object({
  reason: z.string().min(5, 'Le motif doit contenir au moins 5 caractères').max(500).optional(),
});

// Schéma pour l'invitation d'un utilisateur
export const InviteUserSchema = z.object({
  userId: z.string().uuid(),
  customMessage: z.string().max(1000).optional(),
});

// Schémas pour les listes d'utilisateurs avec pagination
export const UserAdminListSchema = z.object({
  users: z.array(UserAdminSchema),
  pagination: z.object({
    page: z.number().min(1),
    limit: z.number().min(1).max(100),
    total: z.number().min(0),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

export const UserClientListSchema = z.object({
  users: z.array(UserClientSchema),
  pagination: z.object({
    page: z.number().min(1),
    limit: z.number().min(1).max(100),
    total: z.number().min(0),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

// Schémas pour les filtres
export const UserAdminFiltersSchema = z.object({
  search: z.string().optional(),
  role: AdminRoleSchema.optional(),
  isActive: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
});

export const UserClientFiltersSchema = z.object({
  search: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  role: ClientRoleSchema.optional(),
  isActive: z.boolean().optional(),
  isLocked: z.boolean().optional(),
  hasActivationPending: z.boolean().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
});

// Types TypeScript inférés
export type UserAdmin = z.infer<typeof UserAdminSchema>;
export type UserClient = z.infer<typeof UserClientSchema>;
export type CreateUserAdminInput = z.infer<typeof CreateUserAdminSchema>;
export type CreateUserClientInput = z.infer<typeof CreateUserClientSchema>;
export type UpdateUserAdminInput = z.infer<typeof UpdateUserAdminSchema>;
export type UpdateUserClientInput = z.infer<typeof UpdateUserClientSchema>;
export type DeactivateUserInput = z.infer<typeof DeactivateUserSchema>;
export type UnlockUserInput = z.infer<typeof UnlockUserSchema>;
export type InviteUserInput = z.infer<typeof InviteUserSchema>;
export type UserAdminList = z.infer<typeof UserAdminListSchema>;
export type UserClientList = z.infer<typeof UserClientListSchema>;
export type UserAdminFilters = z.infer<typeof UserAdminFiltersSchema>;
export type UserClientFilters = z.infer<typeof UserClientFiltersSchema>;