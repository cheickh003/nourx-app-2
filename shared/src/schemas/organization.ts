import { z } from 'zod';

// Schéma pour la création d'une organisation
export const CreateOrganizationSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
  siret: z.string()
    .regex(/^\d{14}$/, 'Le SIRET doit contenir exactement 14 chiffres')
    .optional()
    .or(z.literal('')),
  address: z.string().max(1000).optional(),
  contactEmail: z.string().email('Format d\'email invalide').toLowerCase().optional(),
  contactPhone: z.string()
    .regex(/^[\+]?[0-9\s\-\(\)]{10,20}$/, 'Format de téléphone invalide')
    .optional()
    .or(z.literal('')),
});

// Schéma pour la mise à jour d'une organisation
export const UpdateOrganizationSchema = CreateOrganizationSchema.partial();

// Schéma pour la réponse d'une organisation
export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  siret: z.string().nullable(),
  address: z.string().nullable(),
  contactEmail: z.string().email().nullable(),
  contactPhone: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});

// Schéma pour la liste paginée des organisations
export const OrganizationListSchema = z.object({
  organizations: z.array(OrganizationSchema),
  pagination: z.object({
    page: z.number().min(1),
    limit: z.number().min(1).max(100),
    total: z.number().min(0),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

// Schéma pour les filtres de recherche d'organisations
export const OrganizationFiltersSchema = z.object({
  search: z.string().optional(),
  hasContact: z.boolean().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
});

// Types TypeScript inférés
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
export type Organization = z.infer<typeof OrganizationSchema>;
export type OrganizationList = z.infer<typeof OrganizationListSchema>;
export type OrganizationFilters = z.infer<typeof OrganizationFiltersSchema>;