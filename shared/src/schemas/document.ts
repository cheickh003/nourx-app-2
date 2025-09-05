import { z } from 'zod';

// Schéma pour la création d'un document
export const CreateDocumentSchema = z.object({
  organizationId: z.string().uuid('ID d\'organisation invalide'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
  description: z.string().max(2000).optional(),
  isSharedWithClient: z.boolean().default(false),
});

// Schéma pour la mise à jour d'un document
export const UpdateDocumentSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255).optional(),
  description: z.string().max(2000).optional(),
  isSharedWithClient: z.boolean().optional(),
});

// Schéma pour la réponse d'un document
export const DocumentSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  version: z.number(),
  isSharedWithClient: z.boolean(),
  uploadedBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});

// Schéma pour la nouvelle version d'un document
export const CreateDocumentVersionSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255).optional(),
  description: z.string().max(2000).optional(),
});

// Schéma pour la liste des documents avec pagination
export const DocumentListSchema = z.object({
  documents: z.array(DocumentSchema),
  pagination: z.object({
    page: z.number().min(1),
    limit: z.number().min(1).max(100),
    total: z.number().min(0),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

// Schémas pour les filtres de documents
export const DocumentFiltersSchema = z.object({
  search: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  isSharedWithClient: z.boolean().optional(),
  uploadedBy: z.string().uuid().optional(),
  createdAfter: z.string().date().optional(),
  createdBefore: z.string().date().optional(),
  includeDeleted: z.boolean().default(false),
});

// Schéma pour les paramètres de téléchargement
export const DownloadDocumentSchema = z.object({
  version: z.number().min(1).optional(), // Si non spécifié, prend la dernière version
});

// Types TypeScript inférés
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type CreateDocumentVersionInput = z.infer<typeof CreateDocumentVersionSchema>;
export type DocumentList = z.infer<typeof DocumentListSchema>;
export type DocumentFilters = z.infer<typeof DocumentFiltersSchema>;
export type DownloadDocumentInput = z.infer<typeof DownloadDocumentSchema>;