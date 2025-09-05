import { z } from 'zod';

// Types de variables disponibles dans les templates
export const TemplateVariableTypeSchema = z.enum([
  'string',
  'number', 
  'date',
  'boolean',
  'url',
  'email'
]);

// Schéma pour une variable de template
export const TemplateVariableSchema = z.object({
  name: z.string().min(1).max(50).regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/, 'Nom de variable invalide'),
  type: TemplateVariableTypeSchema,
  description: z.string().max(200),
  required: z.boolean().default(false),
  defaultValue: z.string().optional(),
  example: z.string().optional(),
});

// Schéma pour la création d'un template d'email
export const CreateEmailTemplateSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
  subject: z.string().min(5, 'Le sujet doit contenir au moins 5 caractères').max(255),
  htmlContent: z.string().min(10, 'Le contenu HTML doit contenir au moins 10 caractères').max(50000),
  textContent: z.string().max(50000).optional(),
  variables: z.array(TemplateVariableSchema).default([]),
  isActive: z.boolean().default(true),
  category: z.enum([
    'user_activation',
    'user_deactivation', 
    'password_reset',
    'ticket_created',
    'ticket_updated',
    'ticket_resolved',
    'invoice_sent',
    'invoice_reminder',
    'project_update',
    'deliverable_approved',
    'system_notification',
    'custom'
  ]).default('custom'),
  description: z.string().max(500).optional(),
});

// Schéma pour la mise à jour d'un template
export const UpdateEmailTemplateSchema = CreateEmailTemplateSchema.partial();

// Schéma pour tester un template
export const TestEmailTemplateSchema = z.object({
  templateId: z.string().uuid(),
  recipientEmail: z.string().email('Email invalide'),
  variables: z.record(z.string(), z.any()).default({}),
});

// Schéma pour la réponse d'un template
export const EmailTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  subject: z.string(),
  htmlContent: z.string(),
  textContent: z.string().nullable(),
  variables: z.array(TemplateVariableSchema),
  isActive: z.boolean(),
  category: z.string(),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  usageCount: z.number(), // Compteur d'utilisation
  lastUsedAt: z.string().datetime().nullable(),
});

// Schéma pour la liste des templates
export const EmailTemplateListSchema = z.object({
  templates: z.array(EmailTemplateSchema.omit({ htmlContent: true, textContent: true })), // Pas le contenu dans la liste
  pagination: z.object({
    page: z.number().min(1),
    limit: z.number().min(1).max(100),
    total: z.number().min(0),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

// Schémas pour les filtres
export const EmailTemplateFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  hasUsage: z.boolean().optional(), // Filtre par templates utilisés ou non
});

// Schéma pour le rendu d'un template avec des variables
export const RenderEmailTemplateSchema = z.object({
  templateId: z.string().uuid(),
  variables: z.record(z.string(), z.any()).default({}),
  format: z.enum(['html', 'text', 'both']).default('both'),
});

// Schéma pour la réponse de rendu
export const RenderedEmailTemplateSchema = z.object({
  subject: z.string(),
  htmlContent: z.string().optional(),
  textContent: z.string().optional(),
  missingVariables: z.array(z.string()), // Variables requises non fournies
});

// Schéma pour les statistiques d'utilisation des templates
export const EmailTemplateStatsSchema = z.object({
  total: z.number(),
  active: z.number(),
  byCategory: z.record(z.string(), z.number()),
  mostUsed: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    usageCount: z.number(),
  })).max(10),
  recentlyCreated: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    createdAt: z.string().datetime(),
  })).max(5),
});

// Schéma pour valider les variables d'un template
export const ValidateTemplateVariablesSchema = z.object({
  templateContent: z.string(),
  declaredVariables: z.array(TemplateVariableSchema),
});

// Schéma pour la réponse de validation
export const TemplateValidationResultSchema = z.object({
  isValid: z.boolean(),
  foundVariables: z.array(z.string()), // Variables trouvées dans le contenu
  missingDeclarations: z.array(z.string()), // Variables utilisées mais non déclarées
  unusedDeclarations: z.array(z.string()), // Variables déclarées mais non utilisées
  errors: z.array(z.object({
    type: z.enum(['syntax', 'variable', 'logic']),
    message: z.string(),
    line: z.number().optional(),
    column: z.number().optional(),
  })),
});

// Types TypeScript inférés
export type TemplateVariableType = z.infer<typeof TemplateVariableTypeSchema>;
export type TemplateVariable = z.infer<typeof TemplateVariableSchema>;

export type CreateEmailTemplateInput = z.infer<typeof CreateEmailTemplateSchema>;
export type UpdateEmailTemplateInput = z.infer<typeof UpdateEmailTemplateSchema>;
export type TestEmailTemplateInput = z.infer<typeof TestEmailTemplateSchema>;
export type RenderEmailTemplateInput = z.infer<typeof RenderEmailTemplateSchema>;

export type EmailTemplate = z.infer<typeof EmailTemplateSchema>;
export type EmailTemplateList = z.infer<typeof EmailTemplateListSchema>;
export type EmailTemplateFilters = z.infer<typeof EmailTemplateFiltersSchema>;
export type RenderedEmailTemplate = z.infer<typeof RenderedEmailTemplateSchema>;
export type EmailTemplateStats = z.infer<typeof EmailTemplateStatsSchema>;
export type ValidateTemplateVariablesInput = z.infer<typeof ValidateTemplateVariablesSchema>;
export type TemplateValidationResult = z.infer<typeof TemplateValidationResultSchema>;