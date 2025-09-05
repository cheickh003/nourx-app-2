"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskFiltersSchema = exports.MilestoneFiltersSchema = exports.ProjectFiltersSchema = exports.ProjectListSchema = exports.DeliverableSchema = exports.ApproveDeliverableSchema = exports.CreateDeliverableSchema = exports.TaskSchema = exports.UpdateTaskSchema = exports.CreateTaskSchema = exports.MilestoneSchema = exports.UpdateMilestoneSchema = exports.CreateMilestoneSchema = exports.ProjectSchema = exports.UpdateProjectSchema = exports.CreateProjectSchema = exports.DeliverableStatusSchema = exports.TaskStatusSchema = exports.MilestoneStatusSchema = exports.ProjectStatusSchema = void 0;
const zod_1 = require("zod");
// Énumérations pour les statuts
exports.ProjectStatusSchema = zod_1.z.enum(['draft', 'active', 'completed', 'cancelled']);
exports.MilestoneStatusSchema = zod_1.z.enum(['pending', 'in_progress', 'completed']);
exports.TaskStatusSchema = zod_1.z.enum(['todo', 'in_progress', 'done']);
exports.DeliverableStatusSchema = zod_1.z.enum(['pending', 'delivered', 'approved', 'revision_requested']);
// Schéma pour la création d'un projet
exports.CreateProjectSchema = zod_1.z.object({
    organizationId: zod_1.z.string().uuid('ID d\'organisation invalide'),
    name: zod_1.z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
    description: zod_1.z.string().max(5000).optional(),
    startDate: zod_1.z.string().date().optional(),
    endDate: zod_1.z.string().date().optional(),
    visibleToClient: zod_1.z.boolean().default(true),
});
// Schéma pour la mise à jour d'un projet
exports.UpdateProjectSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255).optional(),
    description: zod_1.z.string().max(5000).optional(),
    startDate: zod_1.z.string().date().optional(),
    endDate: zod_1.z.string().date().optional(),
    visibleToClient: zod_1.z.boolean().optional(),
});
// Schéma pour la réponse d'un projet
exports.ProjectSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    organizationId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    status: exports.ProjectStatusSchema,
    startDate: zod_1.z.string().date().nullable(),
    endDate: zod_1.z.string().date().nullable(),
    visibleToClient: zod_1.z.boolean(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
// Schéma pour la création d'un jalon
exports.CreateMilestoneSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid('ID de projet invalide'),
    name: zod_1.z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
    description: zod_1.z.string().max(2000).optional(),
    dueDate: zod_1.z.string().date().optional(),
    orderIndex: zod_1.z.number().min(0).default(0),
});
// Schéma pour la mise à jour d'un jalon
exports.UpdateMilestoneSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255).optional(),
    description: zod_1.z.string().max(2000).optional(),
    dueDate: zod_1.z.string().date().optional(),
    orderIndex: zod_1.z.number().min(0).optional(),
});
// Schéma pour la réponse d'un jalon
exports.MilestoneSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    projectId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    dueDate: zod_1.z.string().date().nullable(),
    status: exports.MilestoneStatusSchema,
    orderIndex: zod_1.z.number(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
// Schéma pour la création d'une tâche
exports.CreateTaskSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid('ID de projet invalide'),
    milestoneId: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
    description: zod_1.z.string().max(2000).optional(),
    assigneeId: zod_1.z.string().uuid().optional(),
    dueDate: zod_1.z.string().date().optional(),
    visibleToClient: zod_1.z.boolean().default(false),
});
// Schéma pour la mise à jour d'une tâche
exports.UpdateTaskSchema = zod_1.z.object({
    milestoneId: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255).optional(),
    description: zod_1.z.string().max(2000).optional(),
    assigneeId: zod_1.z.string().uuid().optional(),
    dueDate: zod_1.z.string().date().optional(),
    visibleToClient: zod_1.z.boolean().optional(),
});
// Schéma pour la réponse d'une tâche
exports.TaskSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    milestoneId: zod_1.z.string().uuid().nullable(),
    projectId: zod_1.z.string().uuid(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    status: exports.TaskStatusSchema,
    assigneeId: zod_1.z.string().uuid().nullable(),
    dueDate: zod_1.z.string().date().nullable(),
    visibleToClient: zod_1.z.boolean(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
// Schéma pour l'upload d'un livrable
exports.CreateDeliverableSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid('ID de projet invalide'),
    milestoneId: zod_1.z.string().uuid().optional(),
    name: zod_1.z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(255),
    description: zod_1.z.string().max(1000).optional(),
});
// Schéma pour l'approbation/révision d'un livrable
exports.ApproveDeliverableSchema = zod_1.z.object({
    approved: zod_1.z.boolean(),
    comment: zod_1.z.string().max(2000).optional(),
});
// Schéma pour la réponse d'un livrable
exports.DeliverableSchema = zod_1.z.object({
    id: zod_1.z.string().uuid(),
    projectId: zod_1.z.string().uuid(),
    milestoneId: zod_1.z.string().uuid().nullable(),
    name: zod_1.z.string(),
    description: zod_1.z.string().nullable(),
    fileName: zod_1.z.string(),
    fileSize: zod_1.z.number(),
    mimeType: zod_1.z.string(),
    version: zod_1.z.number(),
    status: exports.DeliverableStatusSchema,
    approvalComment: zod_1.z.string().nullable(),
    uploadedBy: zod_1.z.string().uuid(),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime(),
});
// Schémas pour les listes avec pagination
exports.ProjectListSchema = zod_1.z.object({
    projects: zod_1.z.array(exports.ProjectSchema),
    pagination: zod_1.z.object({
        page: zod_1.z.number().min(1),
        limit: zod_1.z.number().min(1).max(100),
        total: zod_1.z.number().min(0),
        hasNext: zod_1.z.boolean(),
        hasPrev: zod_1.z.boolean(),
    }),
});
// Schémas pour les filtres
exports.ProjectFiltersSchema = zod_1.z.object({
    search: zod_1.z.string().optional(),
    organizationId: zod_1.z.string().uuid().optional(),
    status: exports.ProjectStatusSchema.optional(),
    visibleToClient: zod_1.z.boolean().optional(),
    startAfter: zod_1.z.string().date().optional(),
    endBefore: zod_1.z.string().date().optional(),
});
exports.MilestoneFiltersSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid().optional(),
    status: exports.MilestoneStatusSchema.optional(),
    dueBefore: zod_1.z.string().date().optional(),
});
exports.TaskFiltersSchema = zod_1.z.object({
    projectId: zod_1.z.string().uuid().optional(),
    milestoneId: zod_1.z.string().uuid().optional(),
    assigneeId: zod_1.z.string().uuid().optional(),
    status: exports.TaskStatusSchema.optional(),
    visibleToClient: zod_1.z.boolean().optional(),
    dueBefore: zod_1.z.string().date().optional(),
});
//# sourceMappingURL=project.js.map