export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId?: string;
  isActive: boolean;
}

export type UserRole = 
  // Rôles internes NOURX
  | 'admin' 
  | 'manager' 
  | 'agent' 
  | 'accountant' 
  | 'readonly'
  // Rôles clients
  | 'owner' 
  | 'manager_client' 
  | 'reader';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  sessionId: string;
}

export interface AuthSession {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  lastAccessedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}