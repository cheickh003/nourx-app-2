// Export des schémas d'authentification
export * from './schemas/auth';

// Export des schémas d'organisation
export * from './schemas/organization';

// Export des schémas d'utilisateurs
export * from './schemas/user';

// Export des schémas de projets
export * from './schemas/project';

// Export des schémas de tickets
export * from './schemas/ticket';

// Export des schémas de documents
export * from './schemas/document';

// Export des schémas de factures
export * from './schemas/invoice';

// Export des schémas de templates d'emails
export * from './schemas/emailTemplate';

// Export des schémas de macros
export * from './schemas/macro';

// Export des utilitaires de validation
export * from './utils/validation';

// Re-export de Zod pour faciliter l'utilisation
export { z } from 'zod';