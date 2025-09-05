"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserClientFiltersSchema = exports.UserAdminFiltersSchema = exports.UserClientListSchema = exports.UserAdminListSchema = exports.InviteUserSchema = exports.UnlockUserSchema = exports.DeactivateUserSchema = exports.UpdateUserClientSchema = exports.UpdateUserAdminSchema = exports.CreateUserClientSchema = exports.CreateUserAdminSchema = exports.UserClientSchema = exports.UserAdminSchema = void 0;
const zod_1 = require("zod");
const auth_1 = require("./auth");
// Schéma de base pour un utilisateur
const BaseUserSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    email: zod_1.z.string().email(),
    name: zod_1.z.string(),
    isActive: zod_1.z.boolean(),
    lastLoginAt: zod_1.z.string().datetime().nullable(),
    failedLoginAttempts: zod_1.z.number().min(0),
    lockedUntil: zod_1.z.string().datetime().nullable(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
// Schéma pour un utilisateur admin
exports.UserAdminSchema = BaseUserSchema.extend({
    role: auth_1.AdminRoleSchema,
});
// Schéma pour un utilisateur client
exports.UserClientSchema = BaseUserSchema.extend({
    organizationId: zod_1.z.string().uuid(),
    role: auth_1.ClientRoleSchema,
    activationToken: zod_1.z.string().nullable(),
    activationExpiresAt: zod_1.z.string().datetime().nullable(),
    resetPasswordToken: zod_1.z.string().nullable(),
    resetPasswordExpiresAt: zod_1.z.string().datetime().nullable(),
    disabledReason: zod_1.z.string().nullable(),
    deletedAt: zod_1.z.string().datetime().nullable(),
});
// Schémas pour la création d'utilisateurs
exports.CreateUserAdminSchema = zod_1.z.object({
    email: zod_1.z.string().email('Format d\'email invalide').toLowerCase(),
    name: zod_1.z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
    role: auth_1.AdminRoleSchema,
    password: zod_1.z.string()
        .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'),
});
exports.CreateUserClientSchema = zod_1.z.object({
    organizationId: zod_1.z.string().uuid('ID d\'organisation invalide'),
    email: zod_1.z.string().email('Format d\'email invalide').toLowerCase(),
    name: zod_1.z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
    role: auth_1.ClientRoleSchema,
    sendInvitation: zod_1.z.boolean().default(true),
});
// Schémas pour la mise à jour d'utilisateurs
exports.UpdateUserAdminSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(255).optional(),
    role: auth_1.AdminRoleSchema.optional(),
    isActive: zod_1.z.boolean().optional(),
});
exports.UpdateUserClientSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(255).optional(),
    role: auth_1.ClientRoleSchema.optional(),
});
// Schémas pour les actions sur les comptes
exports.DeactivateUserSchema = zod_1.z.object({
    reason: zod_1.z.string().min(5, 'Le motif doit contenir au moins 5 caractères').max(1000),
});
exports.UnlockUserSchema = zod_1.z.object({
    reason: zod_1.z.string().min(5, 'Le motif doit contenir au moins 5 caractères').max(500).optional(),
});
// Schéma pour l'invitation d'un utilisateur
exports.InviteUserSchema = zod_1.z.object({
    userId: zod_1.z.string().uuid(),
    customMessage: zod_1.z.string().max(1000).optional(),
});
// Schémas pour les listes d'utilisateurs avec pagination
exports.UserAdminListSchema = zod_1.z.object({
    users: zod_1.z.array(exports.UserAdminSchema),
    pagination: zod_1.z.object({
        page: zod_1.z.number().min(1),
        limit: zod_1.z.number().min(1).max(100),
        total: zod_1.z.number().min(0),
        hasNext: zod_1.z.boolean(),
        hasPrev: zod_1.z.boolean(),
    }),
});
exports.UserClientListSchema = zod_1.z.object({
    users: zod_1.z.array(exports.UserClientSchema),
    pagination: zod_1.z.object({
        page: zod_1.z.number().min(1),
        limit: zod_1.z.number().min(1).max(100),
        total: zod_1.z.number().min(0),
        hasNext: zod_1.z.boolean(),
        hasPrev: zod_1.z.boolean(),
    }),
});
// Schémas pour les filtres
exports.UserAdminFiltersSchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    role: auth_1.AdminRoleSchema.optional(),
    isActive: zod_1.z.boolean().optional(),
    isLocked: zod_1.z.boolean().optional(),
    createdAfter: zod_1.z.string().datetime().optional(),
    createdBefore: zod_1.z.string().datetime().optional(),
});
exports.UserClientFiltersSchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    organizationId: zod_1.z.string().uuid().optional(),
    role: auth_1.ClientRoleSchema.optional(),
    isActive: zod_1.z.boolean().optional(),
    isLocked: zod_1.z.boolean().optional(),
    hasActivationPending: zod_1.z.boolean().optional(),
    createdAfter: zod_1.z.string().datetime().optional(),
    createdBefore: zod_1.z.string().datetime().optional(),
});
//# sourceMappingURL=user.js.map