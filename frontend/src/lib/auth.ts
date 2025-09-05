import { createAuthClient } from 'better-auth/client';
import type { AdminRole, ClientRole } from '@nourx/shared';

// Types étendus pour nos utilisateurs
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  userType: 'admin' | 'client';
  role: AdminRole | ClientRole;
  isActive: boolean;
  organizationId?: string;
  organizationName?: string;
}

// Client Better Auth réel
// IMPORTANT: baseURL must be an absolute origin, not a path.
// Detect current origin in browser; fallback to env in SSR.
const getFrontOrigin = () => {
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin;
  return (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
};
const FRONT_ORIGIN = getFrontOrigin();
export const authClient = createAuthClient({ baseURL: FRONT_ORIGIN });

// Fonctions d'authentification client
export const auth = {
  // Connexion
  signIn: async (email: string, password: string) => {
    try {
      const response = await authClient.signIn.email({
        email,
        password,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erreur de connexion');
      }

      return response.data;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }
  },

  // Déconnexion
  signOut: async () => {
    try {
      const response = await authClient.signOut();
      return response;
    } catch (error) {
      console.error('Erreur de déconnexion:', error);
      throw error;
    }
  },

  // Mot de passe oublié
  forgotPassword: async (email: string) => {
    try {
      const response = await authClient.forgetPassword({
        email,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erreur lors de la demande');
      }

      return response.data;
    } catch (error) {
      console.error('Erreur mot de passe oublié:', error);
      throw error;
    }
  },

  // Réinitialisation du mot de passe
  resetPassword: async (token: string, password: string) => {
    try {
      const response = await authClient.resetPassword({
        token,
        newPassword: password,
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erreur de réinitialisation');
      }

      return response.data;
    } catch (error) {
      console.error('Erreur réinitialisation mot de passe:', error);
      throw error;
    }
  },

  // Vérification de la session
  getSession: async () => {
    try {
      const response = await authClient.getSession();
      return response.data?.session || null;
    } catch (error) {
      console.error('Erreur récupération session:', error);
      return null;
    }
  },

  // Vérification de l'utilisateur actuel
  useSession: () => {
    return authClient.useSession;
  },

  // Validation de session côté serveur (pour middleware et layouts)
  validateSession: async (sessionToken?: string) => {
    try {
      // Si un token est fourni (middleware/layout SSR), forward explicitement en header Cookie
      if (sessionToken) {
        const url = `${FRONT_ORIGIN}/api/auth/get-session`;
        const resp = await fetch(url, {
          method: 'GET',
          headers: {
            // Host-only cookie, pas de Domain; suffit pour la même origine
            cookie: `better-auth.session_token=${sessionToken}`,
          },
        });
        if (!resp.ok) return null;
        const data = await resp.json();
        const session = (data as any)?.session || (data as any)?.data?.session || null;
        const rawUser = (data as any)?.user || (data as any)?.data?.user || null;
        if (!session) return null;

        const user: AuthUser = rawUser
          ? {
              id: rawUser.id,
              email: rawUser.email || '',
              name: rawUser.name || '',
              userType: 'client',
              role: 'owner' as ClientRole,
              isActive: true,
            }
          : {
              id: session.userId,
              email: '',
              name: '',
              userType: 'client',
              role: 'owner' as ClientRole,
              isActive: true,
            };

        return { session, user };
      }

      // Fallback: en environnement client, le client Better Auth lit les cookies navigateur
      if (typeof window !== 'undefined') {
        const response = await authClient.getSession();
        const session = (response as any)?.data?.session || null;
        const rawUser = (response as any)?.data?.user || null;
        if (!session) return null;

        const user: AuthUser = rawUser
          ? {
              id: rawUser.id,
              email: rawUser.email || '',
              name: rawUser.name || '',
              userType: 'client',
              role: 'owner' as ClientRole,
              isActive: true,
            }
          : {
              id: session.userId,
              email: '',
              name: '',
              userType: 'client',
              role: 'owner' as ClientRole,
              isActive: true,
            };

        return { session, user };
      }

      return null;
    } catch (error) {
      console.error('❌ Erreur validation session:', error);
      return null;
    }
  },

  // Activation de compte
  activateAccount: async (token: string, password: string) => {
    try {
      // TODO: Implémenter l'appel API réel quand le backend sera disponible
      // Pour l'instant, on simule le succès
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { success: true, message: 'Compte activé avec succès' };
    } catch (error) {
      console.error('Erreur activation compte:', error);
      throw error;
    }
  },
};

// Helpers pour les rôles
export const hasRole = (user: AuthUser | null, roles: (AdminRole | ClientRole)[]): boolean => {
  if (!user) return false;
  return roles.includes(user.role);
};

export const isAdmin = (user: AuthUser | null): boolean => {
  if (!user || user.userType !== 'admin') return false;
  return ['admin', 'manager', 'agent', 'accountant'].includes(user.role);
};

export const isClient = (user: AuthUser | null): boolean => {
  if (!user || user.userType !== 'client') return false;
  return ['owner', 'manager', 'reader'].includes(user.role);
};

export const canAccessAdminPortal = (user: AuthUser | null): boolean => {
  return isAdmin(user);
};

export const canAccessClientPortal = (user: AuthUser | null): boolean => {
  return isClient(user);
};
