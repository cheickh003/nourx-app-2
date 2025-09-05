import { z } from 'zod';

// Énumérations pour les statuts
export const ProjectStatusSchema = z.enum(['draft', 'active', 'completed', 'cancelled']);
export const MilestoneStatusSchema = z.enum(['pending', 'in_progress', 'completed']);
export const TaskStatusSchema = z.enum(['todo', 'in_progress', 'done']);
export const DeliverableStatusSchema = z.enum(['pending', 'delivered', 'approved', 'revision_requested']);

// Schéma pour la création d'un projet
export const CreateProjectSchema = z.object({
  organizationId: z.string().uuid('ID d\'organisation invalide'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
  description: z.string().max(5000).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  visibleToClient: z.boolean().default(true),
});

// Schéma pour la mise à jour d'un projet
export const UpdateProjectSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255).optional(),
  description: z.string().max(5000).optional(),
  startDate: z.string().date().optional(),
  endDate: z.string().date().optional(),
  visibleToClient: z.boolean().optional(),
});

// Schéma pour la réponse d'un projet
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  status: ProjectStatusSchema,
  startDate: z.string().date().nullable(),
  endDate: z.string().date().nullable(),
  visibleToClient: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Schéma pour la création d'un jalon
export const CreateMilestoneSchema = z.object({
  projectId: z.string().uuid('ID de projet invalide'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
  description: z.string().max(2000).optional(),
  dueDate: z.string().date().optional(),
  orderIndex: z.number().min(0).default(0),
});

// Schéma pour la mise à jour d'un jalon
export const UpdateMilestoneSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255).optional(),
  description: z.string().max(2000).optional(),
  dueDate: z.string().date().optional(),
  orderIndex: z.number().min(0).optional(),
});

// Schéma pour la réponse d'un jalon
export const MilestoneSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  dueDate: z.string().date().nullable(),
  status: MilestoneStatusSchema,
  orderIndex: z.number(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Schéma pour la création d'une tâche
export const CreateTaskSchema = z.object({
  projectId: z.string().uuid('ID de projet invalide'),
  milestoneId: z.string().uuid().optional(),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().uuid().optional(),
  dueDate: z.string().date().optional(),
  visibleToClient: z.boolean().default(false),
});

// Schéma pour la mise à jour d'une tâche
export const UpdateTaskSchema = z.object({
  milestoneId: z.string().uuid().optional(),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255).optional(),
  description: z.string().max(2000).optional(),
  assigneeId: z.string().uuid().optional(),
  dueDate: z.string().date().optional(),
  visibleToClient: z.boolean().optional(),
});

// Schéma pour la réponse d'une tâche
export const TaskSchema = z.object({
  id: z.string().uuid(),
  milestoneId: z.string().uuid().nullable(),
  projectId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  status: TaskStatusSchema,
  assigneeId: z.string().uuid().nullable(),
  dueDate: z.string().date().nullable(),
  visibleToClient: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Schéma pour l'upload d'un livrable
export const CreateDeliverableSchema = z.object({
  projectId: z.string().uuid('ID de projet invalide'),
  milestoneId: z.string().uuid().optional(),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
  description: z.string().max(1000).optional(),
});

// Schéma pour l'approbation/révision d'un livrable
export const ApproveDeliverableSchema = z.object({
  approved: z.boolean(),
  comment: z.string().max(2000).optional(),
});

// Schéma pour la réponse d'un livrable
export const DeliverableSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  milestoneId: z.string().uuid().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  fileName: z.string(),
  fileSize: z.number(),
  mimeType: z.string(),
  version: z.number(),
  status: DeliverableStatusSchema,
  approvalComment: z.string().nullable(),
  uploadedBy: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Schémas pour les listes avec pagination
export const ProjectListSchema = z.object({
  projects: z.array(ProjectSchema),
  pagination: z.object({
    page: z.number().min(1),
    limit: z.number().min(1).max(100),
    total: z.number().min(0),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
});

// Schémas pour les filtres
export const ProjectFiltersSchema = z.object({
  search: z.string().optional(),
  organizationId: z.string().uuid().optional(),
  status: ProjectStatusSchema.optional(),
  visibleToClient: z.boolean().optional(),
  startAfter: z.string().date().optional(),
  endBefore: z.string().date().optional(),
});

export const MilestoneFiltersSchema = z.object({
  projectId: z.string().uuid().optional(),
  status: MilestoneStatusSchema.optional(),
  dueBefore: z.string().date().optional(),
});

export const TaskFiltersSchema = z.object({
  projectId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  assigneeId: z.string().uuid().optional(),
  status: TaskStatusSchema.optional(),
  visibleToClient: z.boolean().optional(),
  dueBefore: z.string().date().optional(),
});

// Types TypeScript inférés
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>;
export type MilestoneStatus = z.infer<typeof MilestoneStatusSchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type DeliverableStatus = z.infer<typeof DeliverableStatusSchema>;

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
export type Project = z.infer<typeof ProjectSchema>;

export type CreateMilestoneInput = z.infer<typeof CreateMilestoneSchema>;
export type UpdateMilestoneInput = z.infer<typeof UpdateMilestoneSchema>;
export type Milestone = z.infer<typeof MilestoneSchema>;

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type Task = z.infer<typeof TaskSchema>;

export type CreateDeliverableInput = z.infer<typeof CreateDeliverableSchema>;
export type ApproveDeliverableInput = z.infer<typeof ApproveDeliverableSchema>;
export type Deliverable = z.infer<typeof DeliverableSchema>;

export type ProjectList = z.infer<typeof ProjectListSchema>;
export type ProjectFilters = z.infer<typeof ProjectFiltersSchema>;
export type MilestoneFilters = z.infer<typeof MilestoneFiltersSchema>;
export type TaskFilters = z.infer<typeof TaskFiltersSchema>;