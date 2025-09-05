import { toast as sonnerToast } from 'sonner';
import { ErrorHandler } from '@/lib/error-handler';

// Types pour les toasts
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick: () => void;
  };
}

// Configuration par défaut
const DEFAULT_DURATION = 4000;
const SUCCESS_DURATION = 3000;
const ERROR_DURATION = 6000;

// Messages prédéfinis pour les erreurs communes
const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Erreur de connexion. Vérifiez votre connexion internet.',
  UNAUTHORIZED: 'Accès non autorisé. Veuillez vous reconnecter.',
  FORBIDDEN: 'Accès refusé. Vous n\'avez pas les permissions nécessaires.',
  NOT_FOUND: 'Ressource non trouvée.',
  VALIDATION_ERROR: 'Veuillez corriger les erreurs dans le formulaire.',
  SERVER_ERROR: 'Erreur serveur. Veuillez réessayer plus tard.',
  UNKNOWN_ERROR: 'Une erreur inattendue s\'est produite.',
} as const;

// Messages prédéfinis pour les succès
const SUCCESS_MESSAGES = {
  SAVE_SUCCESS: 'Modifications enregistrées avec succès.',
  DELETE_SUCCESS: 'Supprimé avec succès.',
  CREATE_SUCCESS: 'Créé avec succès.',
  UPDATE_SUCCESS: 'Mis à jour avec succès.',
  SEND_SUCCESS: 'Envoyé avec succès.',
} as const;

// Fonction principale pour afficher un toast
function showToast(
  type: ToastType,
  title: string,
  options: ToastOptions = {}
) {
  const {
    description,
    duration = getDefaultDuration(type),
    action,
    cancel,
  } = options;

  // Utilise Sonner pour l'affichage
  const toastFn = getToastFunction(type);

  return toastFn(title, {
    description,
    duration,
    action: action ? {
      label: action.label,
      onClick: action.onClick,
    } : undefined,
    cancel: cancel ? {
      label: cancel.label,
      onClick: cancel.onClick,
    } : undefined,
  });
}

// Obtenir la fonction toast appropriée selon le type
function getToastFunction(type: ToastType) {
  switch (type) {
    case 'success':
      return sonnerToast.success;
    case 'error':
      return sonnerToast.error;
    case 'warning':
      return sonnerToast.warning;
    case 'info':
    default:
      return sonnerToast.info;
  }
}

// Obtenir la durée par défaut selon le type
function getDefaultDuration(type: ToastType): number {
  switch (type) {
    case 'success':
      return SUCCESS_DURATION;
    case 'error':
      return ERROR_DURATION;
    case 'warning':
      return DEFAULT_DURATION;
    case 'info':
    default:
      return DEFAULT_DURATION;
  }
}

// Façade principale pour les toasts
export const toast = {
  // Toasts de base
  success: (title: string, options?: ToastOptions) =>
    showToast('success', title, options),

  error: (title: string, options?: ToastOptions) =>
    showToast('error', title, options),

  warning: (title: string, options?: ToastOptions) =>
    showToast('warning', title, options),

  info: (title: string, options?: ToastOptions) =>
    showToast('info', title, options),

  // Toasts prédéfinis pour les erreurs communes
  errorMessages: {
    network: (options?: ToastOptions) =>
      showToast('error', ERROR_MESSAGES.NETWORK_ERROR, options),

    unauthorized: (options?: ToastOptions) =>
      showToast('error', ERROR_MESSAGES.UNAUTHORIZED, {
        action: {
          label: 'Se reconnecter',
          onClick: () => window.location.href = '/auth/login',
        },
        ...options,
      }),

    forbidden: (options?: ToastOptions) =>
      showToast('error', ERROR_MESSAGES.FORBIDDEN, options),

    notFound: (options?: ToastOptions) =>
      showToast('error', ERROR_MESSAGES.NOT_FOUND, options),

    validation: (options?: ToastOptions) =>
      showToast('error', ERROR_MESSAGES.VALIDATION_ERROR, options),

    server: (options?: ToastOptions) =>
      showToast('error', ERROR_MESSAGES.SERVER_ERROR, options),

    unknown: (options?: ToastOptions) =>
      showToast('error', ERROR_MESSAGES.UNKNOWN_ERROR, options),
  },

  // Toasts prédéfinis pour les succès
  successMessages: {
    save: (options?: ToastOptions) =>
      showToast('success', SUCCESS_MESSAGES.SAVE_SUCCESS, options),

    delete: (options?: ToastOptions) =>
      showToast('success', SUCCESS_MESSAGES.DELETE_SUCCESS, options),

    create: (options?: ToastOptions) =>
      showToast('success', SUCCESS_MESSAGES.CREATE_SUCCESS, options),

    update: (options?: ToastOptions) =>
      showToast('success', SUCCESS_MESSAGES.UPDATE_SUCCESS, options),

    send: (options?: ToastOptions) =>
      showToast('success', SUCCESS_MESSAGES.SEND_SUCCESS, options),
  },

  // Toasts spécialisés pour l'authentification
  auth: {
    loginSuccess: (userName?: string, options?: ToastOptions) =>
      showToast('success', `Bienvenue${userName ? ` ${userName}` : ''} !`, options),

    logoutSuccess: (options?: ToastOptions) =>
      showToast('info', 'Déconnexion réussie', options),

    passwordResetSent: (options?: ToastOptions) =>
      showToast('success', 'Email de réinitialisation envoyé', {
        description: 'Vérifiez votre boîte de réception',
        ...options,
      }),

    passwordResetSuccess: (options?: ToastOptions) =>
      showToast('success', 'Mot de passe réinitialisé', {
        description: 'Vous pouvez maintenant vous connecter',
        ...options,
      }),

    accountActivated: (options?: ToastOptions) =>
      showToast('success', 'Compte activé', {
        description: 'Bienvenue dans NourX !',
        ...options,
      }),
  },

  // Toasts spécialisés pour les actions métier
  business: {
    ticketCreated: (ticketId?: string, options?: ToastOptions) =>
      showToast('success', 'Ticket créé', {
        description: ticketId ? `Numéro du ticket: ${ticketId}` : undefined,
        action: ticketId ? {
          label: 'Voir le ticket',
          onClick: () => window.location.href = `/client/support/${ticketId}`,
        } : undefined,
        ...options,
      }),

    projectCreated: (projectId?: string, options?: ToastOptions) =>
      showToast('success', 'Projet créé', {
        description: projectId ? `Projet #${projectId}` : undefined,
        action: projectId ? {
          label: 'Voir le projet',
          onClick: () => window.location.href = `/client/projects/${projectId}`,
        } : undefined,
        ...options,
      }),

    invoicePaid: (invoiceId?: string, options?: ToastOptions) =>
      showToast('success', 'Facture payée', {
        description: invoiceId ? `Facture #${invoiceId}` : undefined,
        ...options,
      }),

    deliverableApproved: (deliverableId?: string, options?: ToastOptions) =>
      showToast('success', 'Livrable approuvé', {
        description: deliverableId ? `Livrable #${deliverableId}` : undefined,
        ...options,
      }),
  },

  // Gestion des erreurs HTTP/API
  handleApiError: (error: any, customMessage?: string, context?: string) => {
    // Utiliser le gestionnaire d'erreurs principal
    ErrorHandler.handleApiError(error, context);

    // Ne pas afficher de toast supplémentaire si ErrorHandler s'en charge déjà
    // Le toast sera affiché par ErrorHandler.handleApiError
  },

  // Toast de chargement (promise-based)
  promise: <T>(
    promise: Promise<T>,
    {
      loading = 'Chargement...',
      success = 'Opération réussie',
      error = 'Une erreur s\'est produite',
    }: {
      loading?: string;
      success?: string | ((data: T) => string);
      error?: string | ((error: any) => string);
    } = {}
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    });
  },

  // Dismiss tous les toasts
  dismiss: () => {
    sonnerToast.dismiss();
  },

  // Dismiss un toast spécifique
  dismissToast: (toastId: string | number) => {
    sonnerToast.dismiss(toastId);
  },
};

// Hook React pour utiliser les toasts (optionnel, pour plus de commodité)
export function useToast() {
  return toast;
}
