import { z } from 'zod';

// Énumérations pour les statuts et priorités
export const TicketStatusSchema = z.enum(['open', 'in_progress', 'waiting_client', 'resolved', 'closed']);
export const TicketPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

// Schéma pour la création d'un ticket
export const CreateTicketSchema = z.object({
  organizationId: z.string().uuid('ID d\'organisation invalide'),
  categoryId: z.string().uuid().optional(),
  title: z.string().min(5, 'Le titre doit contenir au moins 5 caractères').max(255),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères').max(5000),
  priority: TicketPrioritySchema.default('medium'),
  formData: z.record(z.any()).optional(), // Données du formulaire dynamique
});

// Schéma pour la mise à jour d'un ticket
export const UpdateTicketSchema = z.object({
  title: z.string().min(5).max(255).optional(),
  description: z.string().min(10).max(5000).optional(),
  priority: TicketPrioritySchema.optional(),
  assignedTo: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
});

// Schéma pour changer le statut d'un ticket
export const ChangeTicketStatusSchema = z.object({
  status: TicketStatusSchema,
  comment: z.string().max(2000).optional(),
  notifyClient: z.boolean().default(true),
});

// Schéma pour la réponse d'un ticket
export const TicketSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  categoryId: z.string().uuid().nullable(),
  title: z.string(),
  description: z.string(),
  status: TicketStatusSchema,
  priority: TicketPrioritySchema,
  createdBy: z.string().uuid(),
  assignedTo: z.string().uuid().nullable(),
  dueDate: z.string().datetime().nullable(),
  resolvedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Schéma pour l'ajout d'une réponse à un ticket
export const CreateTicketReplySchema = z.object({
  ticketId: z.string().uuid('ID de ticket invalide'),
  content: z.string().min(5, 'Le contenu doit contenir au moins 5 caractères').max(5000),
  isInternal: z.boolean().default(false),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string(),
    size: z.number(),
    mimeType: z.string(),
  })).optional(),
});

// Schéma pour la réponse d'une réponse de ticket
export const TicketReplySchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  authorId: z.string().uuid(),
  content: z.string(),
  isInternal: z.boolean(),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string(),
    size: z.number(),
    mimeType: z.string(),
  })).nullable(),
  createdAt: z.string().datetime(),
});

// Schéma pour une catégorie de ticket
export const TicketCategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  color: z.string().nullable(),
  formSchema: z.object({
    fields: z.array(z.object({
      name: z.string(),
      type: z.enum(['text', 'textarea', 'select', 'number', 'date', 'file', 'checkbox']),
      label: z.string(),
      required: z.boolean().default(false),
      options: z.array(z.string()).optional(), // Pour les champs select
      placeholder: z.string().optional(),
      validation: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
        pattern: z.string().optional(),
      }).optional(),
    })),
  }),
  slaResponseHours: z.number(),
  slaResolutionHours: z.number(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
});

// Schéma pour la création d'une catégorie de ticket
export const CreateTicketCategorySchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
  description: z.string().max(1000).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hexadécimale invalide').optional(),
  formSchema: z.object({
    fields: z.array(z.object({
      name: z.string().min(1),
      type: z.enum(['text', 'textarea', 'select', 'number', 'date', 'file', 'checkbox']),
      label: z.string().min(1),
      required: z.boolean().default(false),
      options: z.array(z.string()).optional(),
      placeholder: z.string().optional(),
      validation: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
        pattern: z.string().optional(),
      }).optional(),
    })),
  }).default({ fields: [] }),
  slaResponseHours: z.number().min(1, 'SLA de réponse doit être au moins 1 heure').default(8),
  slaResolutionHours: z.number().min(1, 'SLA de résolution doit être au moins 1 heure').default(48),
  isActive: z.boolean().default(true),
});

// Schéma pour la mise à jour d'une catégorie de ticket
export const UpdateTicketCategorySchema = CreateTicketCategorySchema.partial();

// Schémas pour les listes avec pagination
export const TicketListSchema = z.object({
  tickets: z.array(TicketSchema),
  pagination: z.object({
    page: z.number().min(1),
    limit: z.number().min(1).max(100),
    total: z.number().min(0),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

export const TicketCategoryListSchema = z.object({
  categories: z.array(TicketCategorySchema),
});

// Schémas pour les filtres
export const TicketFiltersSchema = z.object({
  search: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  status: TicketStatusSchema.optional(),
  priority: TicketPrioritySchema.optional(),
  categoryId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  createdBy: z.string().uuid().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  dueBefore: z.string().datetime().optional(),
});

// Schéma pour les statistiques de tickets
export const TicketStatsSchema = z.object({
  total: z.number(),
  byStatus: z.record(TicketStatusSchema, z.number()),
  byPriority: z.record(TicketPrioritySchema, z.number()),
  averageResponseTime: z.number(), // en heures
  averageResolutionTime: z.number(), // en heures
  slaBreaches: z.number(),
});

// Types TypeScript inférés
export type TicketStatus = z.infer<typeof TicketStatusSchema>;
export type TicketPriority = z.infer<typeof TicketPrioritySchema>;

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
export type UpdateTicketInput = z.infer<typeof UpdateTicketSchema>;
export type ChangeTicketStatusInput = z.infer<typeof ChangeTicketStatusSchema>;
export type Ticket = z.infer<typeof TicketSchema>;

export type CreateTicketReplyInput = z.infer<typeof CreateTicketReplySchema>;
export type TicketReply = z.infer<typeof TicketReplySchema>;

export type TicketCategory = z.infer<typeof TicketCategorySchema>;
export type CreateTicketCategoryInput = z.infer<typeof CreateTicketCategorySchema>;
export type UpdateTicketCategoryInput = z.infer<typeof UpdateTicketCategorySchema>;

export type TicketList = z.infer<typeof TicketListSchema>;
export type TicketCategoryList = z.infer<typeof TicketCategoryListSchema>;
export type TicketFilters = z.infer<typeof TicketFiltersSchema>;
export type TicketStats = z.infer<typeof TicketStatsSchema>;