"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMimeTypeSchema = exports.FileUploadSchema = exports.createPasswordSchema = exports.ApiListResponseSchema = exports.ApiErrorResponseSchema = exports.ApiResponseSchema = exports.SortParamsSchema = exports.PaginationResponseSchema = exports.PaginationParamsSchema = exports.IdParamSchema = exports.DateTimeStringSchema = exports.DateStringSchema = exports.EmailSchema = exports.UUIDSchema = void 0;
exports.validateUUID = validateUUID;
exports.validateEmail = validateEmail;
exports.validateDate = validateDate;
exports.validateDateTime = validateDateTime;
const zod_1 = require("zod");
// Schémas communs réutilisables
exports.UUIDSchema = zod_1.z.string().uuid('ID invalide');
exports.EmailSchema = zod_1.z.string().email('Format d\'email invalide').toLowerCase();
exports.DateStringSchema = zod_1.z.string().date('Format de date invalide');
exports.DateTimeStringSchema = zod_1.z.string().datetime('Format de date/heure invalide');
// Schéma pour les paramètres d'URL avec ID
exports.IdParamSchema = zod_1.z.object({
    id: exports.UUIDSchema,
});
// Schéma pour la pagination
exports.PaginationParamsSchema = zod_1.z.object({
    page: zod_1.z.number().int().min(1, 'La page doit être supérieure à 0').default(1),
    limit: zod_1.z.number().int().min(1, 'La limite doit être supérieure à 0').max(100, 'La limite ne peut pas dépasser 100').default(20),
});
exports.PaginationResponseSchema = zod_1.z.object({
    page: zod_1.z.number().int().min(1),
    limit: zod_1.z.number().int().min(1).max(100),
    total: zod_1.z.number().int().min(0),
    hasNext: zod_1.z.boolean(),
    hasPrev: zod_1.z.boolean(),
});
// Schéma pour le tri
exports.SortParamsSchema = zod_1.z.object({
    sortBy: zod_1.z.string().optional(),
    sortOrder: zod_1.z.enum(['asc', 'desc']).default('desc'),
});
// Schéma générique pour les réponses API
const ApiResponseSchema = (dataSchema) => zod_1.z.object({
    success: zod_1.z.literal(true),
    data: dataSchema,
    meta: zod_1.z.object({
        requestId: zod_1.z.string().optional(),
        timestamp: zod_1.z.string().datetime().optional(),
    }).optional(),
});
exports.ApiResponseSchema = ApiResponseSchema;
exports.ApiErrorResponseSchema = zod_1.z.object({
    success: zod_1.z.literal(false),
    error: zod_1.z.object({
        code: zod_1.z.string(),
        message: zod_1.z.string(),
        details: zod_1.z.any().optional(),
    }),
    meta: zod_1.z.object({
        requestId: zod_1.z.string().optional(),
        timestamp: zod_1.z.string().datetime().optional(),
    }).optional(),
});
const ApiListResponseSchema = (itemSchema) => zod_1.z.object({
    success: zod_1.z.literal(true),
    data: zod_1.z.array(itemSchema),
    pagination: exports.PaginationResponseSchema.optional(),
    meta: zod_1.z.object({
        requestId: zod_1.z.string().optional(),
        timestamp: zod_1.z.string().datetime().optional(),
    }).optional(),
});
exports.ApiListResponseSchema = ApiListResponseSchema;
// Utilitaires de validation
function validateUUID(value) {
    try {
        exports.UUIDSchema.parse(value);
        return true;
    }
    catch {
        return false;
    }
}
function validateEmail(value) {
    try {
        exports.EmailSchema.parse(value);
        return true;
    }
    catch {
        return false;
    }
}
function validateDate(value) {
    try {
        exports.DateStringSchema.parse(value);
        return true;
    }
    catch {
        return false;
    }
}
function validateDateTime(value) {
    try {
        exports.DateTimeStringSchema.parse(value);
        return true;
    }
    catch {
        return false;
    }
}
// Fonction helper pour créer des schémas de validation de mots de passe sécurisés
const createPasswordSchema = (options) => {
    const { minLength = 8, requireUppercase = true, requireLowercase = true, requireNumbers = true, requireSpecialChars = true, } = options || {};
    let regex = '^';
    if (requireLowercase)
        regex += '(?=.*[a-z])';
    if (requireUppercase)
        regex += '(?=.*[A-Z])';
    if (requireNumbers)
        regex += '(?=.*\\d)';
    if (requireSpecialChars)
        regex += '(?=.*[@$!%*?&])';
    regex += `[A-Za-z\\d@$!%*?&]{${minLength},}$`;
    const requirements = [];
    if (requireLowercase)
        requirements.push('une minuscule');
    if (requireUppercase)
        requirements.push('une majuscule');
    if (requireNumbers)
        requirements.push('un chiffre');
    if (requireSpecialChars)
        requirements.push('un caractère spécial (@$!%*?&)');
    const message = `Le mot de passe doit contenir au moins ${minLength} caractères et inclure ${requirements.join(', ')}`;
    return zod_1.z.string().min(minLength).regex(new RegExp(regex), message);
};
exports.createPasswordSchema = createPasswordSchema;
// Schéma pour les fichiers uploadés
exports.FileUploadSchema = zod_1.z.object({
    filename: zod_1.z.string().min(1, 'Le nom de fichier est requis').max(255),
    size: zod_1.z.number().min(1, 'La taille du fichier doit être supérieure à 0').max(10 * 1024 * 1024, 'Le fichier ne peut pas dépasser 10MB'),
    mimeType: zod_1.z.string().min(1, 'Le type MIME est requis'),
    data: zod_1.z.string().optional(), // Base64 data pour les petits fichiers
    url: zod_1.z.string().url().optional(), // URL pour les gros fichiers
});
// Fonction pour valider les types MIME autorisés
const createMimeTypeSchema = (allowedTypes) => zod_1.z.string().refine((mimeType) => allowedTypes.includes(mimeType), {
    message: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`,
});
exports.createMimeTypeSchema = createMimeTypeSchema;
//# sourceMappingURL=validation.js.map