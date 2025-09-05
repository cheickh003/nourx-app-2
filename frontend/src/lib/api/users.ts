import { getJson, postJson, putJson, patchJson, deleteJson } from '@/lib/api-client';

// Types pour la gestion des utilisateurs
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'manager' | 'reader';
  status: 'active' | 'inactive' | 'pending';
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  invitationSentAt?: string;
  invitationExpiresAt?: string;
}

export interface UserList {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'manager' | 'reader';
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  role?: 'owner' | 'manager' | 'reader';
  status?: 'active' | 'inactive';
}

export interface InviteUserInput {
  email: string;
  firstName: string;
  lastName: string;
  role: 'owner' | 'manager' | 'reader';
}

/**
 * Récupère la liste des utilisateurs de l'organisation
 */
export async function getUsers(filters?: { status?: string; search?: string }, page: number = 1, limit: number = 20): Promise<UserList> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(filters && Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    )),
  });

  return getJson(`/api/client/users?${params}`);
}

/**
 * Récupère un utilisateur par son ID
 */
export async function getUser(id: string): Promise<User> {
  return getJson(`/api/client/users/${id}`);
}

/**
 * Crée un nouvel utilisateur
 */
export async function createUser(data: CreateUserInput): Promise<User> {
  return postJson('/api/client/users', data);
}

/**
 * Met à jour un utilisateur
 */
export async function updateUser(id: string, data: UpdateUserInput): Promise<User> {
  return putJson(`/api/client/users/${id}`, data);
}

/**
 * Supprime un utilisateur (soft delete)
 */
export async function deleteUser(id: string): Promise<{ success: boolean }> {
  return deleteJson(`/api/client/users/${id}`);
}

/**
 * Invite un utilisateur par email
 */
export async function inviteUser(data: InviteUserInput): Promise<User> {
  return postJson('/api/client/users/invite', data);
}

/**
 * Relance l'invitation d'un utilisateur
 */
export async function resendInvitation(id: string): Promise<{ success: boolean }> {
  return postJson(`/api/client/users/${id}/resend-invitation`, {});
}

/**
 * Déverrouille le compte d'un utilisateur
 */
export async function unlockUser(id: string): Promise<{ success: boolean }> {
  return postJson(`/api/client/users/${id}/unlock`, {});
}

/**
 * Force la rotation du mot de passe d'un utilisateur
 */
export async function forcePasswordReset(id: string): Promise<{ success: boolean }> {
  return postJson(`/api/client/users/${id}/force-password-reset`, {});
}
