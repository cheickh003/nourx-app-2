import { z } from 'zod';
export declare const UserAdminSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    isActive: z.ZodBoolean;
    lastLoginAt: z.ZodNullable<z.ZodString>;
    failedLoginAttempts: z.ZodNumber;
    lockedUntil: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
} & {
    role: z.ZodEnum<["admin", "manager", "agent", "accountant", "readonly"]>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    email: string;
    role: "admin" | "manager" | "agent" | "accountant" | "readonly";
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    lastLoginAt: string | null;
    failedLoginAttempts: number;
    lockedUntil: string | null;
}, {
    name: string;
    id: string;
    email: string;
    role: "admin" | "manager" | "agent" | "accountant" | "readonly";
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    lastLoginAt: string | null;
    failedLoginAttempts: number;
    lockedUntil: string | null;
}>;
export declare const UserClientSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    isActive: z.ZodBoolean;
    lastLoginAt: z.ZodNullable<z.ZodString>;
    failedLoginAttempts: z.ZodNumber;
    lockedUntil: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
} & {
    organizationId: z.ZodString;
    role: z.ZodEnum<["owner", "manager", "reader"]>;
    activationToken: z.ZodNullable<z.ZodString>;
    activationExpiresAt: z.ZodNullable<z.ZodString>;
    resetPasswordToken: z.ZodNullable<z.ZodString>;
    resetPasswordExpiresAt: z.ZodNullable<z.ZodString>;
    disabledReason: z.ZodNullable<z.ZodString>;
    deletedAt: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    email: string;
    role: "manager" | "owner" | "reader";
    organizationId: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    lastLoginAt: string | null;
    failedLoginAttempts: number;
    lockedUntil: string | null;
    deletedAt: string | null;
    activationToken: string | null;
    activationExpiresAt: string | null;
    resetPasswordToken: string | null;
    resetPasswordExpiresAt: string | null;
    disabledReason: string | null;
}, {
    name: string;
    id: string;
    email: string;
    role: "manager" | "owner" | "reader";
    organizationId: string;
    createdAt: string;
    updatedAt: string;
    isActive: boolean;
    lastLoginAt: string | null;
    failedLoginAttempts: number;
    lockedUntil: string | null;
    deletedAt: string | null;
    activationToken: string | null;
    activationExpiresAt: string | null;
    resetPasswordToken: string | null;
    resetPasswordExpiresAt: string | null;
    disabledReason: string | null;
}>;
export declare const CreateUserAdminSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodString;
    role: z.ZodEnum<["admin", "manager", "agent", "accountant", "readonly"]>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    role: "admin" | "manager" | "agent" | "accountant" | "readonly";
    password: string;
}, {
    name: string;
    email: string;
    role: "admin" | "manager" | "agent" | "accountant" | "readonly";
    password: string;
}>;
export declare const CreateUserClientSchema: z.ZodObject<{
    organizationId: z.ZodString;
    email: z.ZodString;
    name: z.ZodString;
    role: z.ZodEnum<["owner", "manager", "reader"]>;
    sendInvitation: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    role: "manager" | "owner" | "reader";
    organizationId: string;
    sendInvitation: boolean;
}, {
    name: string;
    email: string;
    role: "manager" | "owner" | "reader";
    organizationId: string;
    sendInvitation?: boolean | undefined;
}>;
export declare const UpdateUserAdminSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["admin", "manager", "agent", "accountant", "readonly"]>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    role?: "admin" | "manager" | "agent" | "accountant" | "readonly" | undefined;
    isActive?: boolean | undefined;
}, {
    name?: string | undefined;
    role?: "admin" | "manager" | "agent" | "accountant" | "readonly" | undefined;
    isActive?: boolean | undefined;
}>;
export declare const UpdateUserClientSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["owner", "manager", "reader"]>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    role?: "manager" | "owner" | "reader" | undefined;
}, {
    name?: string | undefined;
    role?: "manager" | "owner" | "reader" | undefined;
}>;
export declare const DeactivateUserSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const UnlockUserSchema: z.ZodObject<{
    reason: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reason?: string | undefined;
}, {
    reason?: string | undefined;
}>;
export declare const InviteUserSchema: z.ZodObject<{
    userId: z.ZodString;
    customMessage: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    userId: string;
    customMessage?: string | undefined;
}, {
    userId: string;
    customMessage?: string | undefined;
}>;
export declare const UserAdminListSchema: z.ZodObject<{
    users: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        name: z.ZodString;
        isActive: z.ZodBoolean;
        lastLoginAt: z.ZodNullable<z.ZodString>;
        failedLoginAttempts: z.ZodNumber;
        lockedUntil: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    } & {
        role: z.ZodEnum<["admin", "manager", "agent", "accountant", "readonly"]>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        email: string;
        role: "admin" | "manager" | "agent" | "accountant" | "readonly";
        createdAt: string;
        updatedAt: string;
        isActive: boolean;
        lastLoginAt: string | null;
        failedLoginAttempts: number;
        lockedUntil: string | null;
    }, {
        name: string;
        id: string;
        email: string;
        role: "admin" | "manager" | "agent" | "accountant" | "readonly";
        createdAt: string;
        updatedAt: string;
        isActive: boolean;
        lastLoginAt: string | null;
        failedLoginAttempts: number;
        lockedUntil: string | null;
    }>, "many">;
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        hasNext: z.ZodBoolean;
        hasPrev: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        page: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    }, {
        limit: number;
        page: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    users: {
        name: string;
        id: string;
        email: string;
        role: "admin" | "manager" | "agent" | "accountant" | "readonly";
        createdAt: string;
        updatedAt: string;
        isActive: boolean;
        lastLoginAt: string | null;
        failedLoginAttempts: number;
        lockedUntil: string | null;
    }[];
    pagination: {
        limit: number;
        page: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}, {
    users: {
        name: string;
        id: string;
        email: string;
        role: "admin" | "manager" | "agent" | "accountant" | "readonly";
        createdAt: string;
        updatedAt: string;
        isActive: boolean;
        lastLoginAt: string | null;
        failedLoginAttempts: number;
        lockedUntil: string | null;
    }[];
    pagination: {
        limit: number;
        page: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}>;
export declare const UserClientListSchema: z.ZodObject<{
    users: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        email: z.ZodString;
        name: z.ZodString;
        isActive: z.ZodBoolean;
        lastLoginAt: z.ZodNullable<z.ZodString>;
        failedLoginAttempts: z.ZodNumber;
        lockedUntil: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    } & {
        organizationId: z.ZodString;
        role: z.ZodEnum<["owner", "manager", "reader"]>;
        activationToken: z.ZodNullable<z.ZodString>;
        activationExpiresAt: z.ZodNullable<z.ZodString>;
        resetPasswordToken: z.ZodNullable<z.ZodString>;
        resetPasswordExpiresAt: z.ZodNullable<z.ZodString>;
        disabledReason: z.ZodNullable<z.ZodString>;
        deletedAt: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        email: string;
        role: "manager" | "owner" | "reader";
        organizationId: string;
        createdAt: string;
        updatedAt: string;
        isActive: boolean;
        lastLoginAt: string | null;
        failedLoginAttempts: number;
        lockedUntil: string | null;
        deletedAt: string | null;
        activationToken: string | null;
        activationExpiresAt: string | null;
        resetPasswordToken: string | null;
        resetPasswordExpiresAt: string | null;
        disabledReason: string | null;
    }, {
        name: string;
        id: string;
        email: string;
        role: "manager" | "owner" | "reader";
        organizationId: string;
        createdAt: string;
        updatedAt: string;
        isActive: boolean;
        lastLoginAt: string | null;
        failedLoginAttempts: number;
        lockedUntil: string | null;
        deletedAt: string | null;
        activationToken: string | null;
        activationExpiresAt: string | null;
        resetPasswordToken: string | null;
        resetPasswordExpiresAt: string | null;
        disabledReason: string | null;
    }>, "many">;
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        hasNext: z.ZodBoolean;
        hasPrev: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        page: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    }, {
        limit: number;
        page: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    users: {
        name: string;
        id: string;
        email: string;
        role: "manager" | "owner" | "reader";
        organizationId: string;
        createdAt: string;
        updatedAt: string;
        isActive: boolean;
        lastLoginAt: string | null;
        failedLoginAttempts: number;
        lockedUntil: string | null;
        deletedAt: string | null;
        activationToken: string | null;
        activationExpiresAt: string | null;
        resetPasswordToken: string | null;
        resetPasswordExpiresAt: string | null;
        disabledReason: string | null;
    }[];
    pagination: {
        limit: number;
        page: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}, {
    users: {
        name: string;
        id: string;
        email: string;
        role: "manager" | "owner" | "reader";
        organizationId: string;
        createdAt: string;
        updatedAt: string;
        isActive: boolean;
        lastLoginAt: string | null;
        failedLoginAttempts: number;
        lockedUntil: string | null;
        deletedAt: string | null;
        activationToken: string | null;
        activationExpiresAt: string | null;
        resetPasswordToken: string | null;
        resetPasswordExpiresAt: string | null;
        disabledReason: string | null;
    }[];
    pagination: {
        limit: number;
        page: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}>;
export declare const UserAdminFiltersSchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["admin", "manager", "agent", "accountant", "readonly"]>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    isLocked: z.ZodOptional<z.ZodBoolean>;
    createdAfter: z.ZodOptional<z.ZodString>;
    createdBefore: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    role?: "admin" | "manager" | "agent" | "accountant" | "readonly" | undefined;
    search?: string | undefined;
    createdAfter?: string | undefined;
    createdBefore?: string | undefined;
    isActive?: boolean | undefined;
    isLocked?: boolean | undefined;
}, {
    role?: "admin" | "manager" | "agent" | "accountant" | "readonly" | undefined;
    search?: string | undefined;
    createdAfter?: string | undefined;
    createdBefore?: string | undefined;
    isActive?: boolean | undefined;
    isLocked?: boolean | undefined;
}>;
export declare const UserClientFiltersSchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodOptional<z.ZodString>;
    role: z.ZodOptional<z.ZodEnum<["owner", "manager", "reader"]>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    isLocked: z.ZodOptional<z.ZodBoolean>;
    hasActivationPending: z.ZodOptional<z.ZodBoolean>;
    createdAfter: z.ZodOptional<z.ZodString>;
    createdBefore: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    role?: "manager" | "owner" | "reader" | undefined;
    search?: string | undefined;
    organizationId?: string | undefined;
    createdAfter?: string | undefined;
    createdBefore?: string | undefined;
    isActive?: boolean | undefined;
    isLocked?: boolean | undefined;
    hasActivationPending?: boolean | undefined;
}, {
    role?: "manager" | "owner" | "reader" | undefined;
    search?: string | undefined;
    organizationId?: string | undefined;
    createdAfter?: string | undefined;
    createdBefore?: string | undefined;
    isActive?: boolean | undefined;
    isLocked?: boolean | undefined;
    hasActivationPending?: boolean | undefined;
}>;
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
//# sourceMappingURL=user.d.ts.map