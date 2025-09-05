import { z } from 'zod';
export declare const CreateOrganizationSchema: z.ZodObject<{
    name: z.ZodString;
    siret: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    address: z.ZodOptional<z.ZodString>;
    contactEmail: z.ZodOptional<z.ZodString>;
    contactPhone: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
}, "strip", z.ZodTypeAny, {
    name: string;
    siret?: string | undefined;
    address?: string | undefined;
    contactEmail?: string | undefined;
    contactPhone?: string | undefined;
}, {
    name: string;
    siret?: string | undefined;
    address?: string | undefined;
    contactEmail?: string | undefined;
    contactPhone?: string | undefined;
}>;
export declare const UpdateOrganizationSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    siret: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
    address: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    contactEmail: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    contactPhone: z.ZodOptional<z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    siret?: string | undefined;
    address?: string | undefined;
    contactEmail?: string | undefined;
    contactPhone?: string | undefined;
}, {
    name?: string | undefined;
    siret?: string | undefined;
    address?: string | undefined;
    contactEmail?: string | undefined;
    contactPhone?: string | undefined;
}>;
export declare const OrganizationSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    siret: z.ZodNullable<z.ZodString>;
    address: z.ZodNullable<z.ZodString>;
    contactEmail: z.ZodNullable<z.ZodString>;
    contactPhone: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    deletedAt: z.ZodNullable<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    siret: string | null;
    address: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}, {
    name: string;
    id: string;
    siret: string | null;
    address: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
}>;
export declare const OrganizationListSchema: z.ZodObject<{
    organizations: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        siret: z.ZodNullable<z.ZodString>;
        address: z.ZodNullable<z.ZodString>;
        contactEmail: z.ZodNullable<z.ZodString>;
        contactPhone: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        deletedAt: z.ZodNullable<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        siret: string | null;
        address: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
    }, {
        name: string;
        id: string;
        siret: string | null;
        address: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
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
    organizations: {
        name: string;
        id: string;
        siret: string | null;
        address: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
    }[];
    pagination: {
        limit: number;
        page: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}, {
    organizations: {
        name: string;
        id: string;
        siret: string | null;
        address: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
    }[];
    pagination: {
        limit: number;
        page: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}>;
export declare const OrganizationFiltersSchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    hasContact: z.ZodOptional<z.ZodBoolean>;
    createdAfter: z.ZodOptional<z.ZodString>;
    createdBefore: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    search?: string | undefined;
    hasContact?: boolean | undefined;
    createdAfter?: string | undefined;
    createdBefore?: string | undefined;
}, {
    search?: string | undefined;
    hasContact?: boolean | undefined;
    createdAfter?: string | undefined;
    createdBefore?: string | undefined;
}>;
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
export type Organization = z.infer<typeof OrganizationSchema>;
export type OrganizationList = z.infer<typeof OrganizationListSchema>;
export type OrganizationFilters = z.infer<typeof OrganizationFiltersSchema>;
//# sourceMappingURL=organization.d.ts.map