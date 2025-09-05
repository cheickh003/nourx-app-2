"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationFiltersSchema = exports.OrganizationListSchema = exports.OrganizationSchema = exports.UpdateOrganizationSchema = exports.CreateOrganizationSchema = void 0;
const zod_1 = require("zod");
// Schéma pour la création d'une organisation
exports.CreateOrganizationSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
    siret: zod_1.z.string()
        .regex(/^\d{14}$/, 'Le SIRET doit contenir exactement 14 chiffres')
        .optional()
        .or(zod_1.z.literal('')),
    address: zod_1.z.string().max(1000).optional(),
    contactEmail: zod_1.z.string().email('Format d\'email invalide').toLowerCase().optional(),
    contactPhone: zod_1.z.string()
        .regex(/^[\+]?[0-9\s\-\(\)]{10,20}$/, 'Format de téléphone invalide')
        .optional()
        .or(zod_1.z.literal('')),
});
// Schéma pour la mise à jour d'une organisation
exports.UpdateOrganizationSchema = exports.CreateOrganizationSchema.partial();
// Schéma pour la réponse d'une organisation
exports.OrganizationSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    siret: zod_1.z.string().nullable(),
    address: zod_1.z.string().nullable(),
    contactEmail: zod_1.z.string().email().nullable(),
    contactPhone: zod_1.z.string().nullable(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
    deletedAt: zod_1.z.string().datetime().nullable(),
});
// Schéma pour la liste paginée des organisations
exports.OrganizationListSchema = zod_1.z.object({
    organizations: zod_1.z.array(exports.OrganizationSchema),
    pagination: zod_1.z.object({
        page: zod_1.z.number().min(1),
        limit: zod_1.z.number().min(1).max(100),
        total: zod_1.z.number().min(0),
        hasNext: zod_1.z.boolean(),
        hasPrev: zod_1.z.boolean(),
    }),
});
// Schéma pour les filtres de recherche d'organisations
exports.OrganizationFiltersSchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    hasContact: zod_1.z.boolean().optional(),
    createdAfter: zod_1.z.string().datetime().optional(),
    createdBefore: zod_1.z.string().datetime().optional(),
});
//# sourceMappingURL=organization.js.map