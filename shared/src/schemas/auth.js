"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateAccountSchema = exports.ChangePasswordSchema = exports.ResetPasswordSchema = exports.ResetPasswordRequestSchema = exports.RegisterSchema = exports.LoginSchema = exports.UserRoleSchema = exports.ClientRoleSchema = exports.AdminRoleSchema = void 0;
const zod_1 = require("zod");
// Schémas pour les rôles
exports.AdminRoleSchema = zod_1.z.enum(['admin', 'manager', 'agent', 'accountant', 'readonly']);
exports.ClientRoleSchema = zod_1.z.enum(['owner', 'manager', 'reader']);
exports.UserRoleSchema = zod_1.z.union([exports.AdminRoleSchema, exports.ClientRoleSchema]);
// Schémas de validation pour l'authentification
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Format d\'email invalide').toLowerCase(),
    password: zod_1.z.string().min(1, 'Le mot de passe est requis'),
    rememberMe: zod_1.z.boolean().optional().default(false),
});
exports.RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email('Format d\'email invalide').toLowerCase(),
    password: zod_1.z.string()
        .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'),
    name: zod_1.z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
    role: exports.UserRoleSchema.optional(),
});
exports.ResetPasswordRequestSchema = zod_1.z.object({
    email: zod_1.z.string().email('Format d\'email invalide').toLowerCase(),
});
exports.ResetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token requis'),
    password: zod_1.z.string()
        .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'),
});
exports.ChangePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Le mot de passe actuel est requis'),
    newPassword: zod_1.z.string()
        .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'),
});
exports.ActivateAccountSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Token d\'activation requis'),
    password: zod_1.z.string()
        .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'),
});
//# sourceMappingURL=auth.js.map