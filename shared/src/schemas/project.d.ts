import { z } from 'zod';
export declare const ProjectStatusSchema: z.ZodEnum<["draft", "active", "completed", "cancelled"]>;
export declare const MilestoneStatusSchema: z.ZodEnum<["pending", "in_progress", "completed"]>;
export declare const TaskStatusSchema: z.ZodEnum<["todo", "in_progress", "done"]>;
export declare const DeliverableStatusSchema: z.ZodEnum<["pending", "delivered", "approved", "revision_requested"]>;
export declare const CreateProjectSchema: z.ZodObject<{
    organizationId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    visibleToClient: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    organizationId: string;
    visibleToClient: boolean;
    description?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
}, {
    name: string;
    organizationId: string;
    description?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    visibleToClient?: boolean | undefined;
}>;
export declare const UpdateProjectSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    visibleToClient: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    visibleToClient?: boolean | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    visibleToClient?: boolean | undefined;
}>;
export declare const ProjectSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<["draft", "active", "completed", "cancelled"]>;
    startDate: z.ZodNullable<z.ZodString>;
    endDate: z.ZodNullable<z.ZodString>;
    visibleToClient: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    description: string | null;
    status: "draft" | "active" | "completed" | "cancelled";
    organizationId: string;
    createdAt: string;
    updatedAt: string;
    startDate: string | null;
    endDate: string | null;
    visibleToClient: boolean;
}, {
    name: string;
    id: string;
    description: string | null;
    status: "draft" | "active" | "completed" | "cancelled";
    organizationId: string;
    createdAt: string;
    updatedAt: string;
    startDate: string | null;
    endDate: string | null;
    visibleToClient: boolean;
}>;
export declare const CreateMilestoneSchema: z.ZodObject<{
    projectId: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodString>;
    orderIndex: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    projectId: string;
    orderIndex: number;
    description?: string | undefined;
    dueDate?: string | undefined;
}, {
    name: string;
    projectId: string;
    description?: string | undefined;
    dueDate?: string | undefined;
    orderIndex?: number | undefined;
}>;
export declare const UpdateMilestoneSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodString>;
    orderIndex: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    dueDate?: string | undefined;
    orderIndex?: number | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    dueDate?: string | undefined;
    orderIndex?: number | undefined;
}>;
export declare const MilestoneSchema: z.ZodObject<{
    id: z.ZodString;
    projectId: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    dueDate: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<["pending", "in_progress", "completed"]>;
    orderIndex: z.ZodNumber;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    description: string | null;
    status: "completed" | "pending" | "in_progress";
    createdAt: string;
    updatedAt: string;
    projectId: string;
    dueDate: string | null;
    orderIndex: number;
}, {
    name: string;
    id: string;
    description: string | null;
    status: "completed" | "pending" | "in_progress";
    createdAt: string;
    updatedAt: string;
    projectId: string;
    dueDate: string | null;
    orderIndex: number;
}>;
export declare const CreateTaskSchema: z.ZodObject<{
    projectId: z.ZodString;
    milestoneId: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    assigneeId: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodString>;
    visibleToClient: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    visibleToClient: boolean;
    projectId: string;
    description?: string | undefined;
    dueDate?: string | undefined;
    milestoneId?: string | undefined;
    assigneeId?: string | undefined;
}, {
    name: string;
    projectId: string;
    description?: string | undefined;
    visibleToClient?: boolean | undefined;
    dueDate?: string | undefined;
    milestoneId?: string | undefined;
    assigneeId?: string | undefined;
}>;
export declare const UpdateTaskSchema: z.ZodObject<{
    milestoneId: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    assigneeId: z.ZodOptional<z.ZodString>;
    dueDate: z.ZodOptional<z.ZodString>;
    visibleToClient: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    visibleToClient?: boolean | undefined;
    dueDate?: string | undefined;
    milestoneId?: string | undefined;
    assigneeId?: string | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    visibleToClient?: boolean | undefined;
    dueDate?: string | undefined;
    milestoneId?: string | undefined;
    assigneeId?: string | undefined;
}>;
export declare const TaskSchema: z.ZodObject<{
    id: z.ZodString;
    milestoneId: z.ZodNullable<z.ZodString>;
    projectId: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    status: z.ZodEnum<["todo", "in_progress", "done"]>;
    assigneeId: z.ZodNullable<z.ZodString>;
    dueDate: z.ZodNullable<z.ZodString>;
    visibleToClient: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    description: string | null;
    status: "in_progress" | "todo" | "done";
    createdAt: string;
    updatedAt: string;
    visibleToClient: boolean;
    projectId: string;
    dueDate: string | null;
    milestoneId: string | null;
    assigneeId: string | null;
}, {
    name: string;
    id: string;
    description: string | null;
    status: "in_progress" | "todo" | "done";
    createdAt: string;
    updatedAt: string;
    visibleToClient: boolean;
    projectId: string;
    dueDate: string | null;
    milestoneId: string | null;
    assigneeId: string | null;
}>;
export declare const CreateDeliverableSchema: z.ZodObject<{
    projectId: z.ZodString;
    milestoneId: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    projectId: string;
    description?: string | undefined;
    milestoneId?: string | undefined;
}, {
    name: string;
    projectId: string;
    description?: string | undefined;
    milestoneId?: string | undefined;
}>;
export declare const ApproveDeliverableSchema: z.ZodObject<{
    approved: z.ZodBoolean;
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    approved: boolean;
    comment?: string | undefined;
}, {
    approved: boolean;
    comment?: string | undefined;
}>;
export declare const DeliverableSchema: z.ZodObject<{
    id: z.ZodString;
    projectId: z.ZodString;
    milestoneId: z.ZodNullable<z.ZodString>;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    fileName: z.ZodString;
    fileSize: z.ZodNumber;
    mimeType: z.ZodString;
    version: z.ZodNumber;
    status: z.ZodEnum<["pending", "delivered", "approved", "revision_requested"]>;
    approvalComment: z.ZodNullable<z.ZodString>;
    uploadedBy: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    version: number;
    id: string;
    description: string | null;
    status: "pending" | "delivered" | "approved" | "revision_requested";
    createdAt: string;
    updatedAt: string;
    projectId: string;
    milestoneId: string | null;
    fileName: string;
    fileSize: number;
    mimeType: string;
    approvalComment: string | null;
    uploadedBy: string;
}, {
    name: string;
    version: number;
    id: string;
    description: string | null;
    status: "pending" | "delivered" | "approved" | "revision_requested";
    createdAt: string;
    updatedAt: string;
    projectId: string;
    milestoneId: string | null;
    fileName: string;
    fileSize: number;
    mimeType: string;
    approvalComment: string | null;
    uploadedBy: string;
}>;
export declare const ProjectListSchema: z.ZodObject<{
    projects: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        organizationId: z.ZodString;
        name: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        status: z.ZodEnum<["draft", "active", "completed", "cancelled"]>;
        startDate: z.ZodNullable<z.ZodString>;
        endDate: z.ZodNullable<z.ZodString>;
        visibleToClient: z.ZodBoolean;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        description: string | null;
        status: "draft" | "active" | "completed" | "cancelled";
        organizationId: string;
        createdAt: string;
        updatedAt: string;
        startDate: string | null;
        endDate: string | null;
        visibleToClient: boolean;
    }, {
        name: string;
        id: string;
        description: string | null;
        status: "draft" | "active" | "completed" | "cancelled";
        organizationId: string;
        createdAt: string;
        updatedAt: string;
        startDate: string | null;
        endDate: string | null;
        visibleToClient: boolean;
    }>, "many">;
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        hasNext: z.ZodBoolean;
        hasPrev: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        limit: number;
        page: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    }, {
        limit: number;
        page: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    pagination: {
        limit: number;
        page: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    projects: {
        name: string;
        id: string;
        description: string | null;
        status: "draft" | "active" | "completed" | "cancelled";
        organizationId: string;
        createdAt: string;
        updatedAt: string;
        startDate: string | null;
        endDate: string | null;
        visibleToClient: boolean;
    }[];
}, {
    pagination: {
        limit: number;
        page: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    projects: {
        name: string;
        id: string;
        description: string | null;
        status: "draft" | "active" | "completed" | "cancelled";
        organizationId: string;
        createdAt: string;
        updatedAt: string;
        startDate: string | null;
        endDate: string | null;
        visibleToClient: boolean;
    }[];
}>;
export declare const ProjectFiltersSchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["draft", "active", "completed", "cancelled"]>>;
    visibleToClient: z.ZodOptional<z.ZodBoolean>;
    startAfter: z.ZodOptional<z.ZodString>;
    endBefore: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "draft" | "active" | "completed" | "cancelled" | undefined;
    search?: string | undefined;
    organizationId?: string | undefined;
    visibleToClient?: boolean | undefined;
    startAfter?: string | undefined;
    endBefore?: string | undefined;
}, {
    status?: "draft" | "active" | "completed" | "cancelled" | undefined;
    search?: string | undefined;
    organizationId?: string | undefined;
    visibleToClient?: boolean | undefined;
    startAfter?: string | undefined;
    endBefore?: string | undefined;
}>;
export declare const MilestoneFiltersSchema: z.ZodObject<{
    projectId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["pending", "in_progress", "completed"]>>;
    dueBefore: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "completed" | "pending" | "in_progress" | undefined;
    projectId?: string | undefined;
    dueBefore?: string | undefined;
}, {
    status?: "completed" | "pending" | "in_progress" | undefined;
    projectId?: string | undefined;
    dueBefore?: string | undefined;
}>;
export declare const TaskFiltersSchema: z.ZodObject<{
    projectId: z.ZodOptional<z.ZodString>;
    milestoneId: z.ZodOptional<z.ZodString>;
    assigneeId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["todo", "in_progress", "done"]>>;
    visibleToClient: z.ZodOptional<z.ZodBoolean>;
    dueBefore: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "in_progress" | "todo" | "done" | undefined;
    visibleToClient?: boolean | undefined;
    projectId?: string | undefined;
    milestoneId?: string | undefined;
    assigneeId?: string | undefined;
    dueBefore?: string | undefined;
}, {
    status?: "in_progress" | "todo" | "done" | undefined;
    visibleToClient?: boolean | undefined;
    projectId?: string | undefined;
    milestoneId?: string | undefined;
    assigneeId?: string | undefined;
    dueBefore?: string | undefined;
}>;
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
//# sourceMappingURL=project.d.ts.map