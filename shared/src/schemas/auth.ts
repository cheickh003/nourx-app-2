import { z } from 'zod';

// Schémas pour les rôles
export const AdminRoleSchema = z.enum(['admin', 'manager', 'agent', 'accountant', 'readonly']);
export const ClientRoleSchema = z.enum(['owner', 'manager', 'reader']);
export const UserRoleSchema = z.union([AdminRoleSchema, ClientRoleSchema]);

// Schémas de validation pour l'authentification
export const LoginSchema = z.object({
  email: z.string().email('Format d\'email invalide').toLowerCase(),
  password: z.string().min(1, 'Le mot de passe est requis'),
  rememberMe: z.boolean().optional().default(false),
});

export const RegisterSchema = z.object({
  email: z.string().email('Format d\'email invalide').toLowerCase(),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
  role: UserRoleSchema.optional(),
});

export const ResetPasswordRequestSchema = z.object({
  email: z.string().email('Format d\'email invalide').toLowerCase(),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requis'),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
           'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'),
  confirmPassword: z.string().min(1, 'La confirmation du mot de passe est requise'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: z.string()
    .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'),
});

export const ActivateAccountSchema = z.object({
  token: z.string().min(1, 'Token d\'activation requis'),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
           'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'),
  confirmPassword: z.string().min(1, 'La confirmation du mot de passe est requise'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

// Types TypeScript inférés
export type AdminRole = z.infer<typeof AdminRoleSchema>;
export type ClientRole = z.infer<typeof ClientRoleSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ResetPasswordRequestInput = z.infer<typeof ResetPasswordRequestSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type ActivateAccountInput = z.infer<typeof ActivateAccountSchema>;