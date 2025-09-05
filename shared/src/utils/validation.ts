import { z } from 'zod';

// Schémas communs réutilisables
export const UUIDSchema = z.string().uuid('ID invalide');
export const EmailSchema = z.string().email('Format d\'email invalide').toLowerCase();
export const DateStringSchema = z.string().date('Format de date invalide');
export const DateTimeStringSchema = z.string().datetime('Format de date/heure invalide');

// Schéma pour les paramètres d'URL avec ID
export const IdParamSchema = z.object({
  id: UUIDSchema,
});

// Schéma pour la pagination
export const PaginationParamsSchema = z.object({
  page: z.number().int().min(1, 'La page doit être supérieure à 0').default(1),
  limit: z.number().int().min(1, 'La limite doit être supérieure à 0').max(100, 'La limite ne peut pas dépasser 100').default(20),
});

export const PaginationResponseSchema = z.object({
  page: z.number().int().min(1),
  limit: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
});

// Schéma pour le tri
export const SortParamsSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Schéma générique pour les réponses API
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    data: dataSchema,
    meta: z.object({
      requestId: z.string().optional(),
      timestamp: z.string().datetime().optional(),
    }).optional(),
  });

export const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
  meta: z.object({
    requestId: z.string().optional(),
    timestamp: z.string().datetime().optional(),
  }).optional(),
});

export const ApiListResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    success: z.literal(true),
    data: z.array(itemSchema),
    pagination: PaginationResponseSchema.optional(),
    meta: z.object({
      requestId: z.string().optional(),
      timestamp: z.string().datetime().optional(),
    }).optional(),
  });

// Utilitaires de validation
export function validateUUID(value: string): boolean {
  try {
    UUIDSchema.parse(value);
    return true;
  } catch {
    return false;
  }
}

export function validateEmail(value: string): boolean {
  try {
    EmailSchema.parse(value);
    return true;
  } catch {
    return false;
  }
}

export function validateDate(value: string): boolean {
  try {
    DateStringSchema.parse(value);
    return true;
  } catch {
    return false;
  }
}

export function validateDateTime(value: string): boolean {
  try {
    DateTimeStringSchema.parse(value);
    return true;
  } catch {
    return false;
  }
}

// Fonction helper pour créer des schémas de validation de mots de passe sécurisés
export const createPasswordSchema = (options?: {
  minLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSpecialChars?: boolean;
}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
  } = options || {};

  let regex = '^';
  
  if (requireLowercase) regex += '(?=.*[a-z])';
  if (requireUppercase) regex += '(?=.*[A-Z])';
  if (requireNumbers) regex += '(?=.*\\d)';
  if (requireSpecialChars) regex += '(?=.*[@$!%*?&])';
  
  regex += `[A-Za-z\\d@$!%*?&]{${minLength},}$`;

  const requirements = [];
  if (requireLowercase) requirements.push('une minuscule');
  if (requireUppercase) requirements.push('une majuscule');
  if (requireNumbers) requirements.push('un chiffre');
  if (requireSpecialChars) requirements.push('un caractère spécial (@$!%*?&)');

  const message = `Le mot de passe doit contenir au moins ${minLength} caractères et inclure ${requirements.join(', ')}`;

  return z.string().min(minLength).regex(new RegExp(regex), message);
};

// Schéma pour les fichiers uploadés
export const FileUploadSchema = z.object({
  filename: z.string().min(1, 'Le nom de fichier est requis').max(255),
  size: z.number().min(1, 'La taille du fichier doit être supérieure à 0').max(10 * 1024 * 1024, 'Le fichier ne peut pas dépasser 10MB'),
  mimeType: z.string().min(1, 'Le type MIME est requis'),
  data: z.string().optional(), // Base64 data pour les petits fichiers
  url: z.string().url().optional(), // URL pour les gros fichiers
});

// Fonction pour valider les types MIME autorisés
export const createMimeTypeSchema = (allowedTypes: string[]) =>
  z.string().refine(
    (mimeType) => allowedTypes.includes(mimeType),
    {
      message: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`,
    }
  );

// Types TypeScript inférés
export type PaginationParams = z.infer<typeof PaginationParamsSchema>;
export type PaginationResponse = z.infer<typeof PaginationResponseSchema>;
export type SortParams = z.infer<typeof SortParamsSchema>;
export type FileUpload = z.infer<typeof FileUploadSchema>;

// Type helper pour les réponses API
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