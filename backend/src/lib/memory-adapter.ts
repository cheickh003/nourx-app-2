// Adaptateur Better Auth en mémoire pour développement
import { Adapter } from 'better-auth/adapters';

interface MemoryUser {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'manager' | 'agent' | 'accountant' | 'readonly' | 'owner' | 'manager' | 'reader';
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  disabledAt?: Date;
  disabledReason?: string;
  lastLoginAt?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  activationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpiresAt?: Date;
}

interface MemorySession {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

class MemoryAdapter implements Adapter {
  private users = new Map<string, MemoryUser>();
  private sessions = new Map<string, MemorySession>();

  constructor() {
    // Créer quelques utilisateurs de test
    this.createTestUsers();
  }

  private createTestUsers() {
    const adminUser: MemoryUser = {
      id: 'admin-1',
      email: 'admin@nourx.com',
      password: '$2a$10$hashedpasswordhere', // "password" hashé
      name: 'Administrateur',
      role: 'admin',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
    };

    const clientUser: MemoryUser = {
      id: 'client-1',
      email: 'client@nourx.com',
      password: '$2a$10$hashedpasswordhere', // "password" hashé
      name: 'Client Test',
      role: 'owner',
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
      activationToken: null,
    };

    this.users.set(adminUser.id, adminUser);
    this.users.set(clientUser.id, clientUser);
  }

  // Méthodes utilisateur
  async createUser(data: any) {
    const user: MemoryUser = {
      id: data.id || `user-${Date.now()}`,
      email: data.email,
      password: data.password,
      name: data.name || '',
      role: data.role || 'reader',
      emailVerified: data.emailVerified || false,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      failedLoginAttempts: 0,
    };

    this.users.set(user.id, user);
    return user;
  }

  async findUserById(id: string) {
    return this.users.get(id) || null;
  }

  async findUserByEmail(email: string) {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async updateUser(id: string, data: any) {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser = { ...user, ...data, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Méthodes de session
  async createSession(data: any) {
    const session: MemorySession = {
      id: data.id || `session-${Date.now()}`,
      userId: data.userId,
      expiresAt: data.expiresAt,
      createdAt: new Date(),
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
    };

    this.sessions.set(session.id, session);
    return session;
  }

  async findSessionById(id: string) {
    return this.sessions.get(id) || null;
  }

  async findSessionsByUserId(userId: string) {
    return Array.from(this.sessions.values()).filter(s => s.userId === userId);
  }

  async updateSession(id: string, data: any) {
    const session = this.sessions.get(id);
    if (!session) return null;

    const updatedSession = { ...session, ...data };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteSession(id: string) {
    this.sessions.delete(id);
    return true;
  }

  async deleteSessionsByUserId(userId: string) {
    const sessionsToDelete = Array.from(this.sessions.entries())
      .filter(([_, session]) => session.userId === userId);

    sessionsToDelete.forEach(([id]) => this.sessions.delete(id));
    return sessionsToDelete.length;
  }

  // Méthodes de vérification (non utilisées pour ce MVP)
  async createVerification(data: any) {
    return null;
  }

  async findVerificationByToken(token: string) {
    return null;
  }

  async deleteVerification(token: string) {
    return true;
  }

  // Méthodes d'account (non utilisées pour ce MVP)
  async createAccount(data: any) {
    return null;
  }

  async findAccountById(id: string) {
    return null;
  }

  async findAccountsByUserId(userId: string) {
    return [];
  }

  async updateAccount(id: string, data: any) {
    return null;
  }

  async deleteAccount(id: string) {
    return true;
  }
}

export const memoryAdapter = new MemoryAdapter();
