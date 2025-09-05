import { z } from 'zod';
export declare const TicketStatusSchema: z.ZodEnum<["open", "in_progress", "waiting_client", "resolved", "closed"]>;
export declare const TicketPrioritySchema: z.ZodEnum<["low", "medium", "high", "urgent"]>;
export declare const CreateTicketSchema: z.ZodObject<{
    organizationId: z.ZodString;
    categoryId: z.ZodOptional<z.ZodString>;
    title: z.ZodString;
    description: z.ZodString;
    priority: z.ZodDefault<z.ZodEnum<["low", "medium", "high", "urgent"]>>;
    formData: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    title: string;
    priority: "low" | "medium" | "high" | "urgent";
    organizationId: string;
    categoryId?: string | undefined;
    formData?: Record<string, any> | undefined;
}, {
    description: string;
    title: string;
    organizationId: string;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    categoryId?: string | undefined;
    formData?: Record<string, any> | undefined;
}>;
export declare const UpdateTicketSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "urgent"]>>;
    assignedTo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    categoryId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    description?: string | undefined;
    title?: string | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    categoryId?: string | null | undefined;
    assignedTo?: string | null | undefined;
}, {
    description?: string | undefined;
    title?: string | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    categoryId?: string | null | undefined;
    assignedTo?: string | null | undefined;
}>;
export declare const ChangeTicketStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["open", "in_progress", "waiting_client", "resolved", "closed"]>;
    comment: z.ZodOptional<z.ZodString>;
    notifyClient: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    status: "in_progress" | "open" | "waiting_client" | "resolved" | "closed";
    notifyClient: boolean;
    comment?: string | undefined;
}, {
    status: "in_progress" | "open" | "waiting_client" | "resolved" | "closed";
    comment?: string | undefined;
    notifyClient?: boolean | undefined;
}>;
export declare const TicketSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    categoryId: z.ZodNullable<z.ZodString>;
    title: z.ZodString;
    description: z.ZodString;
    status: z.ZodEnum<["open", "in_progress", "waiting_client", "resolved", "closed"]>;
    priority: z.ZodEnum<["low", "medium", "high", "urgent"]>;
    createdBy: z.ZodString;
    assignedTo: z.ZodNullable<z.ZodString>;
    dueDate: z.ZodNullable<z.ZodString>;
    resolvedAt: z.ZodNullable<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    description: string;
    status: "in_progress" | "open" | "waiting_client" | "resolved" | "closed";
    title: string;
    priority: "low" | "medium" | "high" | "urgent";
    organizationId: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    dueDate: string | null;
    categoryId: string | null;
    assignedTo: string | null;
    resolvedAt: string | null;
}, {
    id: string;
    description: string;
    status: "in_progress" | "open" | "waiting_client" | "resolved" | "closed";
    title: string;
    priority: "low" | "medium" | "high" | "urgent";
    organizationId: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    dueDate: string | null;
    categoryId: string | null;
    assignedTo: string | null;
    resolvedAt: string | null;
}>;
export declare const CreateTicketReplySchema: z.ZodObject<{
    ticketId: z.ZodString;
    content: z.ZodString;
    isInternal: z.ZodDefault<z.ZodBoolean>;
    attachments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        filename: z.ZodString;
        url: z.ZodString;
        size: z.ZodNumber;
        mimeType: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url: string;
        mimeType: string;
        filename: string;
        size: number;
    }, {
        url: string;
        mimeType: string;
        filename: string;
        size: number;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    content: string;
    ticketId: string;
    isInternal: boolean;
    attachments?: {
        url: string;
        mimeType: string;
        filename: string;
        size: number;
    }[] | undefined;
}, {
    content: string;
    ticketId: string;
    attachments?: {
        url: string;
        mimeType: string;
        filename: string;
        size: number;
    }[] | undefined;
    isInternal?: boolean | undefined;
}>;
export declare const TicketReplySchema: z.ZodObject<{
    id: z.ZodString;
    ticketId: z.ZodString;
    authorId: z.ZodString;
    content: z.ZodString;
    isInternal: z.ZodBoolean;
    attachments: z.ZodNullable<z.ZodArray<z.ZodObject<{
        filename: z.ZodString;
        url: z.ZodString;
        size: z.ZodNumber;
        mimeType: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        url: string;
        mimeType: string;
        filename: string;
        size: number;
    }, {
        url: string;
        mimeType: string;
        filename: string;
        size: number;
    }>, "many">>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: string;
    content: string;
    attachments: {
        url: string;
        mimeType: string;
        filename: string;
        size: number;
    }[] | null;
    ticketId: string;
    isInternal: boolean;
    authorId: string;
}, {
    id: string;
    createdAt: string;
    content: string;
    attachments: {
        url: string;
        mimeType: string;
        filename: string;
        size: number;
    }[] | null;
    ticketId: string;
    isInternal: boolean;
    authorId: string;
}>;
export declare const TicketCategorySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodString>;
    color: z.ZodNullable<z.ZodString>;
    formSchema: z.ZodObject<{
        fields: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodEnum<["text", "textarea", "select", "number", "date", "file", "checkbox"]>;
            label: z.ZodString;
            required: z.ZodDefault<z.ZodBoolean>;
            options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            placeholder: z.ZodOptional<z.ZodString>;
            validation: z.ZodOptional<z.ZodObject<{
                min: z.ZodOptional<z.ZodNumber>;
                max: z.ZodOptional<z.ZodNumber>;
                pattern: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            }, {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
            required: boolean;
            label: string;
            options?: string[] | undefined;
            validation?: {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            } | undefined;
            placeholder?: string | undefined;
        }, {
            name: string;
            type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
            label: string;
            options?: string[] | undefined;
            validation?: {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            } | undefined;
            required?: boolean | undefined;
            placeholder?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        fields: {
            name: string;
            type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
            required: boolean;
            label: string;
            options?: string[] | undefined;
            validation?: {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            } | undefined;
            placeholder?: string | undefined;
        }[];
    }, {
        fields: {
            name: string;
            type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
            label: string;
            options?: string[] | undefined;
            validation?: {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            } | undefined;
            required?: boolean | undefined;
            placeholder?: string | undefined;
        }[];
    }>;
    slaResponseHours: z.ZodNumber;
    slaResolutionHours: z.ZodNumber;
    isActive: z.ZodBoolean;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    id: string;
    description: string | null;
    createdAt: string;
    isActive: boolean;
    color: string | null;
    formSchema: {
        fields: {
            name: string;
            type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
            required: boolean;
            label: string;
            options?: string[] | undefined;
            validation?: {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            } | undefined;
            placeholder?: string | undefined;
        }[];
    };
    slaResponseHours: number;
    slaResolutionHours: number;
}, {
    name: string;
    id: string;
    description: string | null;
    createdAt: string;
    isActive: boolean;
    color: string | null;
    formSchema: {
        fields: {
            name: string;
            type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
            label: string;
            options?: string[] | undefined;
            validation?: {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            } | undefined;
            required?: boolean | undefined;
            placeholder?: string | undefined;
        }[];
    };
    slaResponseHours: number;
    slaResolutionHours: number;
}>;
export declare const CreateTicketCategorySchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    formSchema: z.ZodDefault<z.ZodObject<{
        fields: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodEnum<["text", "textarea", "select", "number", "date", "file", "checkbox"]>;
            label: z.ZodString;
            required: z.ZodDefault<z.ZodBoolean>;
            options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            placeholder: z.ZodOptional<z.ZodString>;
            validation: z.ZodOptional<z.ZodObject<{
                min: z.ZodOptional<z.ZodNumber>;
                max: z.ZodOptional<z.ZodNumber>;
                pattern: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            }, {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
            required: boolean;
            label: string;
            options?: string[] | undefined;
            validation?: {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            } | undefined;
            placeholder?: string | undefined;
        }, {
            name: string;
            type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
            label: string;
            options?: string[] | undefined;
            validation?: {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            } | undefined;
            required?: boolean | undefined;
            placeholder?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        fields: {
            name: string;
            type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
            required: boolean;
            label: string;
            options?: string[] | undefined;
            validation?: {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            } | undefined;
            placeholder?: string | undefined;
        }[];
    }, {
        fields: {
            name: string;
            type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
            label: string;
            options?: string[] | undefined;
            validation?: {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            } | undefined;
            required?: boolean | undefined;
            placeholder?: string | undefined;
        }[];
    }>>;
    slaResponseHours: z.ZodDefault<z.ZodNumber>;
    slaResolutionHours: z.ZodDefault<z.ZodNumber>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    isActive: boolean;
    formSchema: {
        fields: {
            name: string;
            type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
            required: boolean;
            label: string;
            options?: string[] | undefined;
            validation?: {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            } | undefined;
            placeholder?: string | undefined;
        }[];
    };
    slaResponseHours: number;
    slaResolutionHours: number;
    description?: string | undefined;
    color?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    isActive?: boolean | undefined;
    color?: string | undefined;
    formSchema?: {
        fields: {
            name: string;
            type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
            label: string;
            options?: string[] | undefined;
            validation?: {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            } | undefined;
            required?: boolean | undefined;
            placeholder?: string | undefined;
        }[];
    } | undefined;
    slaResponseHours?: number | undefined;
    slaResolutionHours?: number | undefined;
}>;
export declare const UpdateTicketCategorySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    color: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    formSchema: z.ZodOptional<z.ZodDefault<z.ZodObject<{
        fields: z.ZodArray<z.ZodObject<{
            name: z.ZodString;
            type: z.ZodEnum<["text", "textarea", "select", "number", "date", "file", "checkbox"]>;
            label: z.ZodString;
            required: z.ZodDefault<z.ZodBoolean>;
            options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            placeholder: z.ZodOptional<z.ZodString>;
            validation: z.ZodOptional<z.ZodObject<{
                min: z.ZodOptional<z.ZodNumber>;
                max: z.ZodOptional<z.ZodNumber>;
                pattern: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            }, {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            name: string;
            type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
            required: boolean;
            label: string;
            options?: string[] | undefined;
            validation?: {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            } | undefined;
            placeholder?: string | undefined;
        }, {
            name: string;
            type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
            label: string;
            options?: string[] | undefined;
            validation?: {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            } | undefined;
            required?: boolean | undefined;
            placeholder?: string | undefined;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        fields: {
            name: string;
            type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
            required: boolean;
            label: string;
            options?: string[] | undefined;
            validation?: {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            } | undefined;
            placeholder?: string | undefined;
        }[];
    }, {
        fields: {
            name: string;
            type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
            label: string;
            options?: string[] | undefined;
            validation?: {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            } | undefined;
            required?: boolean | undefined;
            placeholder?: string | undefined;
        }[];
    }>>>;
    slaResponseHours: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    slaResolutionHours: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    description?: string | undefined;
    isActive?: boolean | undefined;
    color?: string | undefined;
    formSchema?: {
        fields: {
            name: string;
            type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
            required: boolean;
            label: string;
            options?: string[] | undefined;
            validation?: {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            } | undefined;
            placeholder?: string | undefined;
        }[];
    } | undefined;
    slaResponseHours?: number | undefined;
    slaResolutionHours?: number | undefined;
}, {
    name?: string | undefined;
    description?: string | undefined;
    isActive?: boolean | undefined;
    color?: string | undefined;
    formSchema?: {
        fields: {
            name: string;
            type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
            label: string;
            options?: string[] | undefined;
            validation?: {
                max?: number | undefined;
                min?: number | undefined;
                pattern?: string | undefined;
            } | undefined;
            required?: boolean | undefined;
            placeholder?: string | undefined;
        }[];
    } | undefined;
    slaResponseHours?: number | undefined;
    slaResolutionHours?: number | undefined;
}>;
export declare const TicketListSchema: z.ZodObject<{
    tickets: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        organizationId: z.ZodString;
        categoryId: z.ZodNullable<z.ZodString>;
        title: z.ZodString;
        description: z.ZodString;
        status: z.ZodEnum<["open", "in_progress", "waiting_client", "resolved", "closed"]>;
        priority: z.ZodEnum<["low", "medium", "high", "urgent"]>;
        createdBy: z.ZodString;
        assignedTo: z.ZodNullable<z.ZodString>;
        dueDate: z.ZodNullable<z.ZodString>;
        resolvedAt: z.ZodNullable<z.ZodString>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        description: string;
        status: "in_progress" | "open" | "waiting_client" | "resolved" | "closed";
        title: string;
        priority: "low" | "medium" | "high" | "urgent";
        organizationId: string;
        createdBy: string;
        createdAt: string;
        updatedAt: string;
        dueDate: string | null;
        categoryId: string | null;
        assignedTo: string | null;
        resolvedAt: string | null;
    }, {
        id: string;
        description: string;
        status: "in_progress" | "open" | "waiting_client" | "resolved" | "closed";
        title: string;
        priority: "low" | "medium" | "high" | "urgent";
        organizationId: string;
        createdBy: string;
        createdAt: string;
        updatedAt: string;
        dueDate: string | null;
        categoryId: string | null;
        assignedTo: string | null;
        resolvedAt: string | null;
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
    tickets: {
        id: string;
        description: string;
        status: "in_progress" | "open" | "waiting_client" | "resolved" | "closed";
        title: string;
        priority: "low" | "medium" | "high" | "urgent";
        organizationId: string;
        createdBy: string;
        createdAt: string;
        updatedAt: string;
        dueDate: string | null;
        categoryId: string | null;
        assignedTo: string | null;
        resolvedAt: string | null;
    }[];
}, {
    pagination: {
        limit: number;
        page: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
    tickets: {
        id: string;
        description: string;
        status: "in_progress" | "open" | "waiting_client" | "resolved" | "closed";
        title: string;
        priority: "low" | "medium" | "high" | "urgent";
        organizationId: string;
        createdBy: string;
        createdAt: string;
        updatedAt: string;
        dueDate: string | null;
        categoryId: string | null;
        assignedTo: string | null;
        resolvedAt: string | null;
    }[];
}>;
export declare const TicketCategoryListSchema: z.ZodObject<{
    categories: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        description: z.ZodNullable<z.ZodString>;
        color: z.ZodNullable<z.ZodString>;
        formSchema: z.ZodObject<{
            fields: z.ZodArray<z.ZodObject<{
                name: z.ZodString;
                type: z.ZodEnum<["text", "textarea", "select", "number", "date", "file", "checkbox"]>;
                label: z.ZodString;
                required: z.ZodDefault<z.ZodBoolean>;
                options: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                placeholder: z.ZodOptional<z.ZodString>;
                validation: z.ZodOptional<z.ZodObject<{
                    min: z.ZodOptional<z.ZodNumber>;
                    max: z.ZodOptional<z.ZodNumber>;
                    pattern: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    max?: number | undefined;
                    min?: number | undefined;
                    pattern?: string | undefined;
                }, {
                    max?: number | undefined;
                    min?: number | undefined;
                    pattern?: string | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                name: string;
                type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
                required: boolean;
                label: string;
                options?: string[] | undefined;
                validation?: {
                    max?: number | undefined;
                    min?: number | undefined;
                    pattern?: string | undefined;
                } | undefined;
                placeholder?: string | undefined;
            }, {
                name: string;
                type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
                label: string;
                options?: string[] | undefined;
                validation?: {
                    max?: number | undefined;
                    min?: number | undefined;
                    pattern?: string | undefined;
                } | undefined;
                required?: boolean | undefined;
                placeholder?: string | undefined;
            }>, "many">;
        }, "strip", z.ZodTypeAny, {
            fields: {
                name: string;
                type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
                required: boolean;
                label: string;
                options?: string[] | undefined;
                validation?: {
                    max?: number | undefined;
                    min?: number | undefined;
                    pattern?: string | undefined;
                } | undefined;
                placeholder?: string | undefined;
            }[];
        }, {
            fields: {
                name: string;
                type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
                label: string;
                options?: string[] | undefined;
                validation?: {
                    max?: number | undefined;
                    min?: number | undefined;
                    pattern?: string | undefined;
                } | undefined;
                required?: boolean | undefined;
                placeholder?: string | undefined;
            }[];
        }>;
        slaResponseHours: z.ZodNumber;
        slaResolutionHours: z.ZodNumber;
        isActive: z.ZodBoolean;
        createdAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        id: string;
        description: string | null;
        createdAt: string;
        isActive: boolean;
        color: string | null;
        formSchema: {
            fields: {
                name: string;
                type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
                required: boolean;
                label: string;
                options?: string[] | undefined;
                validation?: {
                    max?: number | undefined;
                    min?: number | undefined;
                    pattern?: string | undefined;
                } | undefined;
                placeholder?: string | undefined;
            }[];
        };
        slaResponseHours: number;
        slaResolutionHours: number;
    }, {
        name: string;
        id: string;
        description: string | null;
        createdAt: string;
        isActive: boolean;
        color: string | null;
        formSchema: {
            fields: {
                name: string;
                type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
                label: string;
                options?: string[] | undefined;
                validation?: {
                    max?: number | undefined;
                    min?: number | undefined;
                    pattern?: string | undefined;
                } | undefined;
                required?: boolean | undefined;
                placeholder?: string | undefined;
            }[];
        };
        slaResponseHours: number;
        slaResolutionHours: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    categories: {
        name: string;
        id: string;
        description: string | null;
        createdAt: string;
        isActive: boolean;
        color: string | null;
        formSchema: {
            fields: {
                name: string;
                type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
                required: boolean;
                label: string;
                options?: string[] | undefined;
                validation?: {
                    max?: number | undefined;
                    min?: number | undefined;
                    pattern?: string | undefined;
                } | undefined;
                placeholder?: string | undefined;
            }[];
        };
        slaResponseHours: number;
        slaResolutionHours: number;
    }[];
}, {
    categories: {
        name: string;
        id: string;
        description: string | null;
        createdAt: string;
        isActive: boolean;
        color: string | null;
        formSchema: {
            fields: {
                name: string;
                type: "number" | "text" | "select" | "date" | "textarea" | "file" | "checkbox";
                label: string;
                options?: string[] | undefined;
                validation?: {
                    max?: number | undefined;
                    min?: number | undefined;
                    pattern?: string | undefined;
                } | undefined;
                required?: boolean | undefined;
                placeholder?: string | undefined;
            }[];
        };
        slaResponseHours: number;
        slaResolutionHours: number;
    }[];
}>;
export declare const TicketFiltersSchema: z.ZodObject<{
    search: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["open", "in_progress", "waiting_client", "resolved", "closed"]>>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "urgent"]>>;
    categoryId: z.ZodOptional<z.ZodString>;
    assignedTo: z.ZodOptional<z.ZodString>;
    createdBy: z.ZodOptional<z.ZodString>;
    createdAfter: z.ZodOptional<z.ZodString>;
    createdBefore: z.ZodOptional<z.ZodString>;
    dueBefore: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "in_progress" | "open" | "waiting_client" | "resolved" | "closed" | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    search?: string | undefined;
    organizationId?: string | undefined;
    createdBy?: string | undefined;
    createdAfter?: string | undefined;
    createdBefore?: string | undefined;
    dueBefore?: string | undefined;
    categoryId?: string | undefined;
    assignedTo?: string | undefined;
}, {
    status?: "in_progress" | "open" | "waiting_client" | "resolved" | "closed" | undefined;
    priority?: "low" | "medium" | "high" | "urgent" | undefined;
    search?: string | undefined;
    organizationId?: string | undefined;
    createdBy?: string | undefined;
    createdAfter?: string | undefined;
    createdBefore?: string | undefined;
    dueBefore?: string | undefined;
    categoryId?: string | undefined;
    assignedTo?: string | undefined;
}>;
export declare const TicketStatsSchema: z.ZodObject<{
    total: z.ZodNumber;
    byStatus: z.ZodRecord<z.ZodEnum<["open", "in_progress", "waiting_client", "resolved", "closed"]>, z.ZodNumber>;
    byPriority: z.ZodRecord<z.ZodEnum<["low", "medium", "high", "urgent"]>, z.ZodNumber>;
    averageResponseTime: z.ZodNumber;
    averageResolutionTime: z.ZodNumber;
    slaBreaches: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    total: number;
    byStatus: Partial<Record<"in_progress" | "open" | "waiting_client" | "resolved" | "closed", number>>;
    byPriority: Partial<Record<"low" | "medium" | "high" | "urgent", number>>;
    averageResponseTime: number;
    averageResolutionTime: number;
    slaBreaches: number;
}, {
    total: number;
    byStatus: Partial<Record<"in_progress" | "open" | "waiting_client" | "resolved" | "closed", number>>;
    byPriority: Partial<Record<"low" | "medium" | "high" | "urgent", number>>;
    averageResponseTime: number;
    averageResolutionTime: number;
    slaBreaches: number;
}>;
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
//# sourceMappingURL=ticket.d.ts.map