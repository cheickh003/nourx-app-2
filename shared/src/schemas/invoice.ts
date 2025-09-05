import { z } from 'zod';

// Énumérations pour les types et statuts
export const InvoiceTypeSchema = z.enum(['quote', 'invoice', 'credit_note']);
export const InvoiceStatusSchema = z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']);

// Schéma pour la création d'une facture
export const CreateInvoiceSchema = z.object({
  organizationId: z.string().uuid('ID d\'organisation invalide'),
  type: InvoiceTypeSchema.default('invoice'),
  issueDate: z.string().date(),
  dueDate: z.string().date().optional(),
  currency: z.string().length(3, 'Code devise invalide').default('EUR'),
  notes: z.string().max(2000).optional(),
  lines: z.array(z.object({
    description: z.string().min(1, 'Description requise').max(512),
    quantity: z.number().positive('La quantité doit être positive'),
    unitPrice: z.number().min(0, 'Le prix unitaire doit être positif'),
    totalPrice: z.number().min(0, 'Le prix total doit être positif'),
    orderIndex: z.number().min(0).default(0),
  })).min(1, 'Au moins une ligne requise'),
}).refine(
  (data) => !data.dueDate || new Date(data.dueDate) >= new Date(data.issueDate),
  {
    message: 'La date d\'échéance doit être postérieure ou égale à la date d\'émission',
    path: ['dueDate'],
  }
);

// Schéma pour la mise à jour d'une facture
export const UpdateInvoiceSchema = z.object({
  type: InvoiceTypeSchema.optional(),
  issueDate: z.string().date().optional(),
  dueDate: z.string().date().optional(),
  paidDate: z.string().date().optional(),
  currency: z.string().length(3).optional(),
  notes: z.string().max(2000).optional(),
  lines: z.array(z.object({
    id: z.string().uuid().optional(), // Pour identifier les lignes existantes
    description: z.string().min(1).max(512),
    quantity: z.number().positive(),
    unitPrice: z.number().min(0),
    totalPrice: z.number().min(0),
    orderIndex: z.number().min(0),
  })).optional(),
}).refine(
  (data) => !data.dueDate || !data.issueDate || new Date(data.dueDate) >= new Date(data.issueDate),
  {
    message: 'La date d\'échéance doit être postérieure ou égale à la date d\'émission',
    path: ['dueDate'],
  }
);

// Schéma pour changer le statut d'une facture
export const ChangeInvoiceStatusSchema = z.object({
  status: InvoiceStatusSchema,
  paidDate: z.string().date().optional(),
  notes: z.string().max(1000).optional(),
});

// Schéma pour l'envoi d'une facture
export const SendInvoiceSchema = z.object({
  recipientEmail: z.string().email('Email invalide').optional(),
  recipientName: z.string().max(255).optional(),
  subject: z.string().max(255).optional(),
  message: z.string().max(2000).optional(),
  attachPDF: z.boolean().default(true),
});

// Schéma pour la relance d'une facture
export const RemindInvoiceSchema = z.object({
  reminderType: z.enum(['gentle', 'firm', 'final']).default('gentle'),
  subject: z.string().max(255).optional(),
  message: z.string().max(2000).optional(),
  additionalFees: z.number().min(0).optional(),
});

// Schéma pour la réponse d'une ligne de facture
export const InvoiceLineSchema = z.object({
  id: z.string().uuid(),
  invoiceId: z.string().uuid(),
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  totalPrice: z.number(),
  orderIndex: z.number(),
});

// Schéma pour la réponse d'une facture
export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  invoiceNumber: z.string(),
  type: InvoiceTypeSchema,
  status: InvoiceStatusSchema,
  issueDate: z.string().date(),
  dueDate: z.string().date().nullable(),
  paidDate: z.string().date().nullable(),
  totalAmount: z.number(),
  currency: z.string(),
  notes: z.string().nullable(),
  createdBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lines: z.array(InvoiceLineSchema),
});

// Schéma pour la liste des factures avec pagination
export const InvoiceListSchema = z.object({
  invoices: z.array(InvoiceSchema.omit({ lines: true })), // Pas les lignes dans la liste
  pagination: z.object({
    page: z.number().min(1),
    limit: z.number().min(1).max(100),
    total: z.number().min(0),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

// Schémas pour les filtres de factures
export const InvoiceFiltersSchema = z.object({
  search: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  type: InvoiceTypeSchema.optional(),
  status: InvoiceStatusSchema.optional(),
  createdBy: z.string().uuid().optional(),
  issuedAfter: z.string().date().optional(),
  issuedBefore: z.string().date().optional(),
  dueAfter: z.string().date().optional(),
  dueBefore: z.string().date().optional(),
  amountMin: z.number().min(0).optional(),
  amountMax: z.number().min(0).optional(),
  currency: z.string().length(3).optional(),
});

// Schémas pour les statistiques de facturation
export const InvoiceStatsSchema = z.object({
  total: z.number(),
  byStatus: z.record(InvoiceStatusSchema, z.number()),
  byType: z.record(InvoiceTypeSchema, z.number()),
  totalAmount: z.object({
    drafted: z.number(),
    sent: z.number(),
    paid: z.number(),
    overdue: z.number(),
  }),
  averagePaymentDelay: z.number(), // en jours
  overdueCount: z.number(),
  thisMonthRevenue: z.number(),
  lastMonthRevenue: z.number(),
});

// Schéma pour la génération de numéro de facture
export const InvoiceNumberConfigSchema = z.object({
  prefix: z.string().max(10).default(''),
  suffix: z.string().max(10).default(''),
  padLength: z.number().min(3).max(10).default(6),
  resetAnnually: z.boolean().default(true),
});

// Types TypeScript inférés
export type InvoiceType = z.infer<typeof InvoiceTypeSchema>;
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;

export type CreateInvoiceInput = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof UpdateInvoiceSchema>;
export type ChangeInvoiceStatusInput = z.infer<typeof ChangeInvoiceStatusSchema>;
export type SendInvoiceInput = z.infer<typeof SendInvoiceSchema>;
export type RemindInvoiceInput = z.infer<typeof RemindInvoiceSchema>;

export type InvoiceLine = z.infer<typeof InvoiceLineSchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;
export type InvoiceList = z.infer<typeof InvoiceListSchema>;
export type InvoiceFilters = z.infer<typeof InvoiceFiltersSchema>;
export type InvoiceStats = z.infer<typeof InvoiceStatsSchema>;
export type InvoiceNumberConfig = z.infer<typeof InvoiceNumberConfigSchema>;