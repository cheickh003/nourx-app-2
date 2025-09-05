import * as Sentry from '@sentry/nextjs';
import { toast } from '@/lib/toast';

// Types d'erreurs
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Messages d'erreurs par défaut
const ERROR_MESSAGES = {
  // Erreurs HTTP
  400: 'Données invalides. Vérifiez vos informations.',
  401: 'Accès non autorisé. Veuillez vous reconnecter.',
  403: 'Accès refusé. Vous n\'avez pas les permissions nécessaires.',
  404: 'Ressource non trouvée.',
  409: 'Conflit de données. Cette ressource existe déjà.',
  422: 'Erreurs de validation dans le formulaire.',
  429: 'Trop de requêtes. Veuillez patienter avant de réessayer.',
  500: 'Erreur serveur. Veuillez réessayer plus tard.',
  502: 'Service temporairement indisponible.',
  503: 'Service en maintenance. Veuillez réessayer plus tard.',

  // Erreurs réseau
  NETWORK_ERROR: 'Problème de connexion. Vérifiez votre connexion internet.',
  TIMEOUT: 'Délai d\'attente dépassé. Veuillez réessayer.',
  OFFLINE: 'Vous êtes hors ligne. Vérifiez votre connexion.',

  // Erreurs métier
  VALIDATION_FAILED: 'Certaines informations sont incorrectes.',
  UNAUTHORIZED: 'Vous n\'êtes pas autorisé à effectuer cette action.',
  FORBIDDEN: 'Cette action n\'est pas autorisée.',
  NOT_FOUND: 'L\'élément demandé n\'existe pas.',
  CONFLICT: 'Un conflit est survenu. Veuillez rafraîchir la page.',
  RATE_LIMITED: 'Trop de tentatives. Veuillez patienter.',
  SERVER_ERROR: 'Une erreur inattendue s\'est produite.',
} as const;

// Codes d'erreur spécifiques
const ERROR_CODES = {
  // Authentification
  INVALID_CREDENTIALS: 'Identifiants incorrects.',
  ACCOUNT_DISABLED: 'Votre compte a été désactivé.',
  ACCOUNT_LOCKED: 'Votre compte est temporairement verrouillé.',
  TOKEN_EXPIRED: 'Votre session a expiré. Veuillez vous reconnecter.',
  TOKEN_INVALID: 'Session invalide. Veuillez vous reconnecter.',

  // Validation
  REQUIRED_FIELD: 'Ce champ est obligatoire.',
  INVALID_EMAIL: 'Adresse email invalide.',
  INVALID_PASSWORD: 'Mot de passe trop faible.',
  PASSWORDS_DONT_MATCH: 'Les mots de passe ne correspondent pas.',
  INVALID_PHONE: 'Numéro de téléphone invalide.',
  INVALID_DATE: 'Date invalide.',
  INVALID_FORMAT: 'Format invalide.',

  // Ressources
  PROJECT_NOT_FOUND: 'Projet introuvable.',
  TICKET_NOT_FOUND: 'Ticket introuvable.',
  INVOICE_NOT_FOUND: 'Facture introuvable.',
  ORGANIZATION_NOT_FOUND: 'Organisation introuvable.',
  USER_NOT_FOUND: 'Utilisateur introuvable.',

  // Actions
  CREATE_FAILED: 'Échec de la création.',
  UPDATE_FAILED: 'Échec de la mise à jour.',
  DELETE_FAILED: 'Échec de la suppression.',
  UPLOAD_FAILED: 'Échec du téléchargement.',
  DOWNLOAD_FAILED: 'Échec du téléchargement.',

  // Limites
  FILE_TOO_LARGE: 'Fichier trop volumineux.',
  FILE_TYPE_NOT_ALLOWED: 'Type de fichier non autorisé.',
  QUOTA_EXCEEDED: 'Quota dépassé.',
  RATE_LIMIT_EXCEEDED: 'Trop de requêtes. Veuillez patienter.',
} as const;

// Classe principale pour gérer les erreurs
export class ErrorHandler {
  static handleApiError(error: any, context?: string): void {
    console.error('API Error:', error, { context });

    // Capture avec Sentry
    Sentry.captureException(error, {
      tags: {
        type: 'api_error',
        context: context || 'unknown',
      },
      extra: {
        error,
        url: typeof window !== 'undefined' ? window.location.href : undefined,
      },
    });

    // Déterminer le message d'erreur
    const message = this.getErrorMessage(error);

    // Afficher le toast d'erreur
    toast.error(message);
  }

  static handleValidationError(errors: ValidationError[]): void {
    console.error('Validation Errors:', errors);

    // Capture avec Sentry
    Sentry.captureMessage('Validation Error', {
      level: 'warning',
      tags: {
        type: 'validation_error',
      },
      extra: {
        errors,
      },
    });

    // Afficher les erreurs de validation
    const firstError = errors[0];
    if (firstError) {
      toast.error(firstError.message);
    }
  }

  static handleNetworkError(error: any): void {
    console.error('Network Error:', error);

    // Capture avec Sentry
    Sentry.captureException(error, {
      tags: {
        type: 'network_error',
      },
    });

    // Vérifier si l'utilisateur est hors ligne
    if (!navigator.onLine) {
      toast.error(ERROR_MESSAGES.OFFLINE);
      return;
    }

    // Erreur réseau générique
    toast.error(ERROR_MESSAGES.NETWORK_ERROR);
  }

  static handleAuthError(error: any): void {
    console.error('Auth Error:', error);

    // Capture avec Sentry
    Sentry.captureException(error, {
      tags: {
        type: 'auth_error',
      },
    });

    const message = this.getAuthErrorMessage(error);
    toast.error(message, {
      action: {
        label: 'Se reconnecter',
        onClick: () => window.location.href = '/auth/login',
      },
    });
  }

  static handleFileError(error: any, fileName?: string): void {
    console.error('File Error:', error, { fileName });

    // Capture avec Sentry
    Sentry.captureException(error, {
      tags: {
        type: 'file_error',
      },
      extra: {
        fileName,
      },
    });

    const message = this.getFileErrorMessage(error);
    toast.error(message);
  }

  // Méthodes privées pour déterminer les messages d'erreur

  private static getErrorMessage(error: any): string {
    // Erreur avec code HTTP
    if (error.status && ERROR_MESSAGES[error.status as keyof typeof ERROR_MESSAGES]) {
      return ERROR_MESSAGES[error.status as keyof typeof ERROR_MESSAGES];
    }

    // Erreur avec code spécifique
    if (error.code && ERROR_CODES[error.code as keyof typeof ERROR_CODES]) {
      return ERROR_CODES[error.code as keyof typeof ERROR_CODES];
    }

    // Erreur avec message personnalisé
    if (error.message) {
      return error.message;
    }

    // Erreur générique
    return ERROR_MESSAGES.SERVER_ERROR;
  }

  private static getAuthErrorMessage(error: any): string {
    // Codes d'erreur spécifiques à l'authentification
    if (error.code === 'INVALID_CREDENTIALS' || error.status === 401) {
      return ERROR_CODES.INVALID_CREDENTIALS;
    }

    if (error.code === 'ACCOUNT_DISABLED') {
      return ERROR_CODES.ACCOUNT_DISABLED;
    }

    if (error.code === 'ACCOUNT_LOCKED') {
      return ERROR_CODES.ACCOUNT_LOCKED;
    }

    if (error.code === 'TOKEN_EXPIRED') {
      return ERROR_CODES.TOKEN_EXPIRED;
    }

    // Message par défaut
    return ERROR_MESSAGES.UNAUTHORIZED;
  }

  private static getFileErrorMessage(error: any): string {
    // Codes d'erreur spécifiques aux fichiers
    if (error.code === 'FILE_TOO_LARGE') {
      return ERROR_CODES.FILE_TOO_LARGE;
    }

    if (error.code === 'FILE_TYPE_NOT_ALLOWED') {
      return ERROR_CODES.FILE_TYPE_NOT_ALLOWED;
    }

    if (error.code === 'UPLOAD_FAILED') {
      return ERROR_CODES.UPLOAD_FAILED;
    }

    // Erreur réseau
    if (error.name === 'NetworkError') {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }

    // Message par défaut
    return 'Erreur lors du traitement du fichier.';
  }

  // Méthode pour logger les erreurs sans les afficher à l'utilisateur
  static logError(error: any, context?: string, level: Sentry.SeverityLevel = 'error'): void {
    console.error('Logged Error:', error, { context });

    Sentry.captureException(error, {
      level,
      tags: {
        type: 'logged_error',
        context: context || 'unknown',
      },
    });
  }

  // Méthode pour les erreurs de performance
  static logPerformanceError(error: any, metric?: string): void {
    console.warn('Performance Error:', error, { metric });

    Sentry.captureException(error, {
      level: 'warning',
      tags: {
        type: 'performance_error',
        metric: metric || 'unknown',
      },
    });
  }

  // Méthode pour les erreurs JavaScript non gérées
  static handleUnhandledError(error: any): void {
    console.error('Unhandled Error:', error);

    Sentry.captureException(error, {
      level: 'fatal',
      tags: {
        type: 'unhandled_error',
      },
    });

    // Afficher un message générique à l'utilisateur
    toast.error('Une erreur inattendue s\'est produite. Veuillez rafraîchir la page.');
  }
}

// Hook React pour utiliser le gestionnaire d'erreurs
export function useErrorHandler() {
  return {
    handleApiError: ErrorHandler.handleApiError,
    handleValidationError: ErrorHandler.handleValidationError,
    handleNetworkError: ErrorHandler.handleNetworkError,
    handleAuthError: ErrorHandler.handleAuthError,
    handleFileError: ErrorHandler.handleFileError,
    logError: ErrorHandler.logError,
    logPerformanceError: ErrorHandler.logPerformanceError,
  };
}

// Configuration globale des erreurs non gérées
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    ErrorHandler.handleUnhandledError(event.reason);
  });

  window.addEventListener('error', (event) => {
    ErrorHandler.handleUnhandledError(event.error);
  });
}
