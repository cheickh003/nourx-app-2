import { z } from 'zod';
export declare const UUIDSchema: z.ZodString;
export declare const EmailSchema: z.ZodString;
export declare const DateStringSchema: z.ZodString;
export declare const DateTimeStringSchema: z.ZodString;
export declare const IdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const PaginationParamsSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    page: number;
}, {
    limit?: number | undefined;
    page?: number | undefined;
}>;
export declare const PaginationResponseSchema: z.ZodObject<{
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
export declare const SortParamsSchema: z.ZodObject<{
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    sortOrder: "asc" | "desc";
    sortBy?: string | undefined;
}, {
    sortBy?: string | undefined;
    sortOrder?: "asc" | "desc" | undefined;
}>;
export declare const ApiResponseSchema: <T extends z.ZodTypeAny>(dataSchema: T) => z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: T;
    meta: z.ZodOptional<z.ZodObject<{
        requestId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        requestId?: string | undefined;
        timestamp?: string | undefined;
    }, {
        requestId?: string | undefined;
        timestamp?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodLiteral<true>;
    data: T;
    meta: z.ZodOptional<z.ZodObject<{
        requestId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        requestId?: string | undefined;
        timestamp?: string | undefined;
    }, {
        requestId?: string | undefined;
        timestamp?: string | undefined;
    }>>;
}>, any> extends infer T_1 ? { [k in keyof T_1]: T_1[k]; } : never, z.baseObjectInputType<{
    success: z.ZodLiteral<true>;
    data: T;
    meta: z.ZodOptional<z.ZodObject<{
        requestId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        requestId?: string | undefined;
        timestamp?: string | undefined;
    }, {
        requestId?: string | undefined;
        timestamp?: string | undefined;
    }>>;
}> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
export declare const ApiErrorResponseSchema: z.ZodObject<{
    success: z.ZodLiteral<false>;
    error: z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        details: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        message: string;
        code: string;
        details?: any;
    }, {
        message: string;
        code: string;
        details?: any;
    }>;
    meta: z.ZodOptional<z.ZodObject<{
        requestId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        requestId?: string | undefined;
        timestamp?: string | undefined;
    }, {
        requestId?: string | undefined;
        timestamp?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    error: {
        message: string;
        code: string;
        details?: any;
    };
    success: false;
    meta?: {
        requestId?: string | undefined;
        timestamp?: string | undefined;
    } | undefined;
}, {
    error: {
        message: string;
        code: string;
        details?: any;
    };
    success: false;
    meta?: {
        requestId?: string | undefined;
        timestamp?: string | undefined;
    } | undefined;
}>;
export declare const ApiListResponseSchema: <T extends z.ZodTypeAny>(itemSchema: T) => z.ZodObject<{
    success: z.ZodLiteral<true>;
    data: z.ZodArray<T, "many">;
    pagination: z.ZodOptional<z.ZodObject<{
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
    }>>;
    meta: z.ZodOptional<z.ZodObject<{
        requestId: z.ZodOptional<z.ZodString>;
        timestamp: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        requestId?: string | undefined;
        timestamp?: string | undefined;
    }, {
        requestId?: string | undefined;
        timestamp?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    data: T["_output"][];
    success: true;
    pagination?: {
        limit: number;
        page: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    } | undefined;
    meta?: {
        requestId?: string | undefined;
        timestamp?: string | undefined;
    } | undefined;
}, {
    data: T["_input"][];
    success: true;
    pagination?: {
        limit: number;
        page: number;
        total: number;
        hasNext: boolean;
        hasPrev: boolean;
    } | undefined;
    meta?: {
        requestId?: string | undefined;
        timestamp?: string | undefined;
    } | undefined;
}>;
export declare function validateUUID(value: string): boolean;
export declare function validateEmail(value: string): boolean;
export declare function validateDate(value: string): boolean;
export declare function validateDateTime(value: string): boolean;
export declare const createPasswordSchema: (options?: {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
}) => z.ZodString;
export declare const FileUploadSchema: z.ZodObject<{
    filename: z.ZodString;
    size: z.ZodNumber;
    mimeType: z.ZodString;
    data: z.ZodOptional<z.ZodString>;
    url: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    mimeType: string;
    filename: string;
    size: number;
    data?: string | undefined;
    url?: string | undefined;
}, {
    mimeType: string;
    filename: string;
    size: number;
    data?: string | undefined;
    url?: string | undefined;
}>;
export declare const createMimeTypeSchema: (allowedTypes: string[]) => z.ZodEffects<z.ZodString, string, string>;
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
export type PaginationResponse = z.infer<typeof PaginationResponseSchema>;
export type SortParams = z.infer<typeof SortParamsSchema>;
export type FileUpload = z.infer<typeof FileUploadSchema>;
export type ApiResponse<T> = {
    success: true;
    data: T;
    meta?: {
        requestId?: string;
        timestamp?: string;
    };
};
export type ApiErrorResponse = {
    success: false;
    error: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        requestId?: string;
        timestamp?: string;
    };
};
export type ApiListResponse<T> = {
    success: true;
    data: T[];
    pagination?: PaginationResponse;
    meta?: {
        requestId?: string;
        timestamp?: string;
    };
};
//# sourceMappingURL=validation.d.ts.map