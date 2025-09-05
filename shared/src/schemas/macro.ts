import { z } from 'zod';

// Types de déclencheurs pour les macros
export const MacroTriggerTypeSchema = z.enum([
  'manual', // Déclenchement manuel par l'agent
  'keyword', // Déclenchement par mot-clé dans le ticket
  'status_change', // Déclenchement lors du changement de statut
  'category', // Déclenchement selon la catégorie du ticket
  'priority', // Déclenchement selon la priorité
  'sla_breach', // Déclenchement lors de dépassement SLA
]);

// Actions possibles pour les macros
export const MacroActionTypeSchema = z.enum([
  'add_reply', // Ajouter une réponse automatique
  'change_status', // Changer le statut du ticket
  'assign_agent', // Assigner un agent
  'change_priority', // Changer la priorité
  'add_tags', // Ajouter des tags
  'send_email', // Envoyer un email
  'create_task', // Créer une tâche de suivi
  'escalate', // Escalader le ticket
]);

// Conditions pour le déclenchement des macros
export const MacroConditionSchema = z.object({
  field: z.enum(['status', 'priority', 'category', 'assignee', 'content', 'age_hours']),
  operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than']),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

// Actions à exécuter par la macro
export const MacroActionSchema = z.object({
  type: MacroActionTypeSchema,
  parameters: z.record(z.any()), // Paramètres spécifiques à chaque action
});

// Schéma pour la création d'une macro
export const CreateMacroSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
  description: z.string().max(1000).optional(),
  triggerType: MacroTriggerTypeSchema,
  conditions: z.array(MacroConditionSchema).default([]),
  conditionsOperator: z.enum(['AND', 'OR']).default('AND'), // Comment combiner les conditions
  actions: z.array(MacroActionSchema).min(1, 'Au moins une action requise'),
  isActive: z.boolean().default(true),
  category: z.enum([
    'auto_response', // Réponses automatiques
    'escalation', // Escalade automatique
    'assignment', // Attribution automatique
    'notification', // Notifications
    'workflow', // Workflow métier
    'custom' // Personnalisée
  ]).default('custom'),
  keywords: z.array(z.string()).optional(), // Mots-clés pour le déclenchement
  priority: z.number().min(0).max(100).default(50), // Priorité d'exécution
});

// Schéma pour la mise à jour d'une macro
export const UpdateMacroSchema = CreateMacroSchema.partial();

// Schéma pour tester une macro
export const TestMacroSchema = z.object({
  macroId: z.string().uuid(),
  ticketId: z.string().uuid(), // Ticket de test
  dryRun: z.boolean().default(true), // Ne pas exécuter réellement
});

// Schéma pour l'exécution manuelle d'une macro
export const ExecuteMacroSchema = z.object({
  macroId: z.string().uuid(),
  ticketId: z.string().uuid(),
  override: z.record(z.any()).optional(), // Paramètres à override
});

// Schéma pour la réponse d'une macro
export const MacroSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  triggerType: MacroTriggerTypeSchema,
  conditions: z.array(MacroConditionSchema),
  conditionsOperator: z.enum(['AND', 'OR']),
  actions: z.array(MacroActionSchema),
  isActive: z.boolean(),
  category: z.string(),
  keywords: z.array(z.string()).nullable(),
  priority: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // Statistiques d'utilisation
  executionCount: z.number(),
  lastExecutedAt: z.string().datetime().nullable(),
  successRate: z.number(), // Pourcentage d'exécutions réussies
});

// Schéma pour la liste des macros
export const MacroListSchema = z.object({
  macros: z.array(MacroSchema.omit({ actions: true, conditions: true })), // Actions et conditions pas dans la liste
  pagination: z.object({
    page: z.number().min(1),
    limit: z.number().min(1).max(100),
    total: z.number().min(0),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

// Schémas pour les filtres
export const MacroFiltersSchema = z.object({
  search: z.string().optional(),
  triggerType: MacroTriggerTypeSchema.optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  hasExecutions: z.boolean().optional(), // Filtre par macros utilisées ou non
});

// Schéma pour l'historique d'exécution d'une macro
export const MacroExecutionSchema = z.object({
  id: z.string().uuid(),
  macroId: z.string().uuid(),
  ticketId: z.string().uuid(),
  executedBy: z.string().uuid().nullable(), // null si automatique
  executionType: z.enum(['automatic', 'manual']),
  status: z.enum(['success', 'failed', 'partial']),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  results: z.array(z.object({
    actionType: MacroActionTypeSchema,
    status: z.enum(['success', 'failed', 'skipped']),
    message: z.string().optional(),
    data: z.record(z.any()).optional(),
  })),
  errorMessage: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Schéma pour les statistiques de macros
export const MacroStatsSchema = z.object({
  total: z.number(),
  active: z.number(),
  byTriggerType: z.record(MacroTriggerTypeSchema, z.number()),
  byCategory: z.record(z.string(), z.number()),
  totalExecutions: z.number(),
  successfulExecutions: z.number(),
  failedExecutions: z.number(),
  averageExecutionTime: z.number(), // en millisecondes
  mostUsed: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    executionCount: z.number(),
    successRate: z.number(),
  })).max(10),
});

// Schéma pour la validation d'une macro
export const ValidateMacroSchema = z.object({
  conditions: z.array(MacroConditionSchema),
  actions: z.array(MacroActionSchema),
});

// Schéma pour la réponse de validation
export const MacroValidationResultSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.object({
    type: z.enum(['condition', 'action', 'logic']),
    message: z.string(),
    field: z.string().optional(),
  })),
  warnings: z.array(z.object({
    type: z.enum(['performance', 'best_practice', 'compatibility']),
    message: z.string(),
  })),
});

// Types TypeScript inférés
export type MacroTriggerType = z.infer<typeof MacroTriggerTypeSchema>;
export type MacroActionType = z.infer<typeof MacroActionTypeSchema>;
export type MacroCondition = z.infer<typeof MacroConditionSchema>;
export type MacroAction = z.infer<typeof MacroActionSchema>;

export type CreateMacroInput = z.infer<typeof CreateMacroSchema>;
export type UpdateMacroInput = z.infer<typeof UpdateMacroSchema>;
export type TestMacroInput = z.infer<typeof TestMacroSchema>;
export type ExecuteMacroInput = z.infer<typeof ExecuteMacroSchema>;

export type Macro = z.infer<typeof MacroSchema>;
export type MacroList = z.infer<typeof MacroListSchema>;
export type MacroFilters = z.infer<typeof MacroFiltersSchema>;
export type MacroExecution = z.infer<typeof MacroExecutionSchema>;
export type MacroStats = z.infer<typeof MacroStatsSchema>;
export type ValidateMacroInput = z.infer<typeof ValidateMacroSchema>;
export type MacroValidationResult = z.infer<typeof MacroValidationResultSchema>;