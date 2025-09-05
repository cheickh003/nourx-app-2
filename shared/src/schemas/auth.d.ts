import { z } from 'zod';
export declare const AdminRoleSchema: z.ZodEnum<["admin", "manager", "agent", "accountant", "readonly"]>;
export declare const ClientRoleSchema: z.ZodEnum<["owner", "manager", "reader"]>;
export declare const UserRoleSchema: z.ZodUnion<[z.ZodEnum<["admin", "manager", "agent", "accountant", "readonly"]>, z.ZodEnum<["owner", "manager", "reader"]>]>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    rememberMe: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    rememberMe: boolean;
}, {
    email: string;
    password: string;
    rememberMe?: boolean | undefined;
}>;
export declare const RegisterSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    name: z.ZodString;
    role: z.ZodOptional<z.ZodUnion<[z.ZodEnum<["admin", "manager", "agent", "accountant", "readonly"]>, z.ZodEnum<["owner", "manager", "reader"]>]>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    password: string;
    role?: "admin" | "manager" | "agent" | "accountant" | "readonly" | "owner" | "reader" | undefined;
}, {
    name: string;
    email: string;
    password: string;
    role?: "admin" | "manager" | "agent" | "accountant" | "readonly" | "owner" | "reader" | undefined;
}>;
export declare const ResetPasswordRequestSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const ResetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
}, {
    password: string;
    token: string;
}>;
export declare const ChangePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
}>;
export declare const ActivateAccountSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
}, {
    password: string;
    token: string;
}>;
export type AdminRole = z.infer<typeof AdminRoleSchema>;
export type ClientRole = z.infer<typeof ClientRoleSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type ResetPasswordRequestInput = z.infer<typeof ResetPasswordRequestSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;
export type ActivateAccountInput = z.infer<typeof ActivateAccountSchema>;
//# sourceMappingURL=auth.d.ts.map