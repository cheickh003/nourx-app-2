"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketStatsSchema = exports.TicketFiltersSchema = exports.TicketCategoryListSchema = exports.TicketListSchema = exports.UpdateTicketCategorySchema = exports.CreateTicketCategorySchema = exports.TicketCategorySchema = exports.TicketReplySchema = exports.CreateTicketReplySchema = exports.TicketSchema = exports.ChangeTicketStatusSchema = exports.UpdateTicketSchema = exports.CreateTicketSchema = exports.TicketPrioritySchema = exports.TicketStatusSchema = void 0;
const zod_1 = require("zod");
// Énumérations pour les statuts et priorités
exports.TicketStatusSchema = zod_1.z.enum(['open', 'in_progress', 'waiting_client', 'resolved', 'closed']);
exports.TicketPrioritySchema = zod_1.z.enum(['low', 'medium', 'high', 'urgent']);
// Schéma pour la création d'un ticket
exports.CreateTicketSchema = zod_1.z.object({
    organizationId: zod_1.z.string().uuid('ID d\'organisation invalide'),
    categoryId: zod_1.z.string().uuid().optional(),
    title: zod_1.z.string().min(5, 'Le titre doit contenir au moins 5 caractères').max(255),
    description: zod_1.z.string().min(10, 'La description doit contenir au moins 10 caractères').max(5000),
    priority: exports.TicketPrioritySchema.default('medium'),
    formData: zod_1.z.record(zod_1.z.any()).optional(), // Données du formulaire dynamique
});
// Schéma pour la mise à jour d'un ticket
exports.UpdateTicketSchema = zod_1.z.object({
    title: zod_1.z.string().min(5).max(255).optional(),
    description: zod_1.z.string().min(10).max(5000).optional(),
    priority: exports.TicketPrioritySchema.optional(),
    assignedTo: zod_1.z.string().uuid().optional().nullable(),
    categoryId: zod_1.z.string().uuid().optional().nullable(),
});
// Schéma pour changer le statut d'un ticket
exports.ChangeTicketStatusSchema = zod_1.z.object({
    status: exports.TicketStatusSchema,
    comment: zod_1.z.string().max(2000).optional(),
    notifyClient: zod_1.z.boolean().default(true),
});
// Schéma pour la réponse d'un ticket
exports.TicketSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    organizationId: zod_1.z.string().uuid(),
    categoryId: zod_1.z.string().uuid().nullable(),
    title: zod_1.z.string(),
    description: zod_1.z.string(),
    status: exports.TicketStatusSchema,
    priority: exports.TicketPrioritySchema,
    createdBy: zod_1.z.string().uuid(),
    assignedTo: zod_1.z.string().uuid().nullable(),
    dueDate: zod_1.z.string().datetime().nullable(),
    resolvedAt: zod_1.z.string().datetime().nullable(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
// Schéma pour l'ajout d'une réponse à un ticket
exports.CreateTicketReplySchema = zod_1.z.object({
    ticketId: zod_1.z.string().uuid('ID de ticket invalide'),
    content: zod_1.z.string().min(5, 'Le contenu doit contenir au moins 5 caractères').max(5000),
    isInternal: zod_1.z.boolean().default(false),
    attachments: zod_1.z.array(zod_1.z.object({
        filename: zod_1.z.string(),
        url: zod_1.z.string(),
        size: zod_1.z.number(),
        mimeType: zod_1.z.string(),
    })).optional(),
});
// Schéma pour la réponse d'une réponse de ticket
exports.TicketReplySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    ticketId: zod_1.z.string().uuid(),
    authorId: zod_1.z.string().uuid(),
    content: zod_1.z.string(),
    isInternal: zod_1.z.boolean(),
    attachments: zod_1.z.array(zod_1.z.object({
        filename: zod_1.z.string(),
        url: zod_1.z.string(),
        size: zod_1.z.number(),
        mimeType: zod_1.z.string(),
    })).nullable(),
    createdAt: zod_1.z.string().datetime(),
});
// Schéma pour une catégorie de ticket
exports.TicketCategorySchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    color: zod_1.z.string().nullable(),
    formSchema: zod_1.z.object({
        fields: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            type: zod_1.z.enum(['text', 'textarea', 'select', 'number', 'date', 'file', 'checkbox']),
            label: zod_1.z.string(),
            required: zod_1.z.boolean().default(false),
            options: zod_1.z.array(zod_1.z.string()).optional(), // Pour les champs select
            placeholder: zod_1.z.string().optional(),
            validation: zod_1.z.object({
                min: zod_1.z.number().optional(),
                max: zod_1.z.number().optional(),
                pattern: zod_1.z.string().optional(),
            }).optional(),
        })),
    }),
    slaResponseHours: zod_1.z.number(),
    slaResolutionHours: zod_1.z.number(),
    isActive: zod_1.z.boolean(),
    createdAt: zod_1.z.string().datetime(),
});
// Schéma pour la création d'une catégorie de ticket
exports.CreateTicketCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
    description: zod_1.z.string().max(1000).optional(),
    color: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Couleur hexadécimale invalide').optional(),
    formSchema: zod_1.z.object({
        fields: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string().min(1),
            type: zod_1.z.enum(['text', 'textarea', 'select', 'number', 'date', 'file', 'checkbox']),
            label: zod_1.z.string().min(1),
            required: zod_1.z.boolean().default(false),
            options: zod_1.z.array(zod_1.z.string()).optional(),
            placeholder: zod_1.z.string().optional(),
            validation: zod_1.z.object({
                min: zod_1.z.number().optional(),
                max: zod_1.z.number().optional(),
                pattern: zod_1.z.string().optional(),
            }).optional(),
        })),
    }).default({ fields: [] }),
    slaResponseHours: zod_1.z.number().min(1, 'SLA de réponse doit être au moins 1 heure').default(8),
    slaResolutionHours: zod_1.z.number().min(1, 'SLA de résolution doit être au moins 1 heure').default(48),
    isActive: zod_1.z.boolean().default(true),
});
// Schéma pour la mise à jour d'une catégorie de ticket
exports.UpdateTicketCategorySchema = exports.CreateTicketCategorySchema.partial();
// Schémas pour les listes avec pagination
exports.TicketListSchema = zod_1.z.object({
    tickets: zod_1.z.array(exports.TicketSchema),
    pagination: zod_1.z.object({
        page: zod_1.z.number().min(1),
        limit: zod_1.z.number().min(1).max(100),
        total: zod_1.z.number().min(0),
        hasNext: zod_1.z.boolean(),
        hasPrev: zod_1.z.boolean(),
    }),
});
exports.TicketCategoryListSchema = zod_1.z.object({
    categories: zod_1.z.array(exports.TicketCategorySchema),
});
// Schémas pour les filtres
exports.TicketFiltersSchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    organizationId: zod_1.z.string().uuid().optional(),
    status: exports.TicketStatusSchema.optional(),
    priority: exports.TicketPrioritySchema.optional(),
    categoryId: zod_1.z.string().uuid().optional(),
    assignedTo: zod_1.z.string().uuid().optional(),
    createdBy: zod_1.z.string().uuid().optional(),
    createdAfter: zod_1.z.string().datetime().optional(),
    createdBefore: zod_1.z.string().datetime().optional(),
    dueBefore: zod_1.z.string().datetime().optional(),
});
// Schéma pour les statistiques de tickets
exports.TicketStatsSchema = zod_1.z.object({
    total: zod_1.z.number(),
    byStatus: zod_1.z.record(exports.TicketStatusSchema, zod_1.z.number()),
    byPriority: zod_1.z.record(exports.TicketPrioritySchema, zod_1.z.number()),
    averageResponseTime: zod_1.z.number(), // en heures
    averageResolutionTime: zod_1.z.number(), // en heures
    slaBreaches: zod_1.z.number(),
});
//# sourceMappingURL=ticket.js.map