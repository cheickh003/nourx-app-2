import { db } from '@/config/database';
import logger from '@/lib/logger';

export interface SessionInfo {
  id: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class SessionService {
  /**
   * Invalide toutes les sessions d'un utilisateur spécifique
   */
  async invalidateUserSessions(userId: string): Promise<number> {
    try {
      // Récupérer d'abord les sessions à invalider pour logging
      const sessions = await db
        .selectFrom('session')
        .select('id')
        .where('userId', '=', userId)
        .where('expiresAt', '>', new Date())
        .execute();

      if (sessions.length === 0) {
        return 0;
      }

      // Marquer comme expirées en mettant expiresAt dans le passé
      const result = await db
        .updateTable('session')
        .set({ expiresAt: new Date(Date.now() - 1000) }) // 1 seconde dans le passé
        .where('userId', '=', userId)
        .where('expiresAt', '>', new Date())
        .executeTakeFirst();

      const invalidatedCount = Number(result.numUpdatedRows || 0);

      logger.info('User sessions invalidated', {
        userId,
        sessionCount: invalidatedCount,
        sessionIds: sessions.map(s => s.id),
      });

      return invalidatedCount;
    } catch (error) {
      logger.error('Failed to invalidate user sessions', { userId, error });
      throw error;
    }
  }

  /**
   * Invalide une session spécifique
   */
  async invalidateSession(sessionId: string): Promise<boolean> {
    try {
      const result = await db
        .updateTable('session')
        .set({ expiresAt: new Date(Date.now() - 1000) }) // 1 seconde dans le passé
        .where('id', '=', sessionId)
        .where('expiresAt', '>', new Date())
        .executeTakeFirst();

      const wasInvalidated = Number(result.numUpdatedRows || 0) > 0;

      if (wasInvalidated) {
        logger.info('Session invalidated', { sessionId });
      } else {
        logger.warn('Session not found or already expired', { sessionId });
      }

      return wasInvalidated;
    } catch (error) {
      logger.error('Failed to invalidate session', { sessionId, error });
      throw error;
    }
  }

  /**
   * Invalide toutes les sessions d'une organisation (pour les clients)
   */
  async invalidateOrganizationSessions(organizationId: string): Promise<number> {
    try {
      // Récupérer les IDs des utilisateurs clients de cette organisation
      const clientUsers = await db
        .selectFrom('user_client')
        .select('id')
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .execute();

      if (clientUsers.length === 0) {
        return 0;
      }

      const userIds = clientUsers.map(u => u.id);

      // Invalider toutes leurs sessions
      const result = await db
        .updateTable('session')
        .set({ expiresAt: new Date(Date.now() - 1000) })
        .where('userId', 'in', userIds)
        .where('expiresAt', '>', new Date())
        .executeTakeFirst();

      const invalidatedCount = Number(result.numUpdatedRows || 0);

      logger.info('Organization sessions invalidated', {
        organizationId,
        userCount: userIds.length,
        sessionCount: invalidatedCount,
      });

      return invalidatedCount;
    } catch (error) {
      logger.error('Failed to invalidate organization sessions', { organizationId, error });
      throw error;
    }
  }

  /**
   * Récupère les sessions actives d'un utilisateur
   */
  async getUserActiveSessions(userId: string): Promise<SessionInfo[]> {
    try {
      const sessions = await db
        .selectFrom('session')
        .select([
          'id',
          'userId',
          'expiresAt',
          'createdAt',
          'updatedAt',
          'ipAddress',
          'userAgent',
        ])
        .where('userId', '=', userId)
        .where('expiresAt', '>', new Date())
        .orderBy('updatedAt', 'desc')
        .execute();

      return sessions as SessionInfo[];
    } catch (error) {
      logger.error('Failed to get user active sessions', { userId, error });
      throw error;
    }
  }

  /**
   * Récupère toutes les sessions actives (pour monitoring)
   */
  async getActiveSessions(limit: number = 100): Promise<{
    sessions: SessionInfo[];
    total: number;
  }> {
    try {
      // Compter le total
      const [totalResult] = await db
        .selectFrom('session')
        .select((eb) => eb.fn.count('id').as('total'))
        .where('expiresAt', '>', new Date())
        .execute();

      const total = Number(totalResult?.total || 0);

      // Récupérer les sessions
      const sessions = await db
        .selectFrom('session')
        .select([
          'id',
          'userId',
          'expiresAt',
          'createdAt',
          'updatedAt',
          'ipAddress',
          'userAgent',
        ])
        .where('expiresAt', '>', new Date())
        .orderBy('updatedAt', 'desc')
        .limit(limit)
        .execute();

      return {
        sessions: sessions as SessionInfo[],
        total,
      };
    } catch (error) {
      logger.error('Failed to get active sessions', { error });
      throw error;
    }
  }

  /**
   * Nettoie les sessions expirées
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const result = await db
        .deleteFrom('session')
        .where('expiresAt', '<=', new Date())
        .executeTakeFirst();

      const deletedCount = Number(result.numDeletedRows || 0);

      if (deletedCount > 0) {
        logger.info('Expired sessions cleaned up', { deletedCount });
      }

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup expired sessions', { error });
      throw error;
    }
  }

  /**
   * Nettoie les anciennes sessions (au-delà de X jours)
   */
  async cleanupOldSessions(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

      const result = await db
        .deleteFrom('session')
        .where('createdAt', '<', cutoffDate)
        .executeTakeFirst();

      const deletedCount = Number(result.numDeletedRows || 0);

      if (deletedCount > 0) {
        logger.info('Old sessions cleaned up', { deletedCount, daysOld });
      }

      return deletedCount;
    } catch (error) {
      logger.error('Failed to cleanup old sessions', { daysOld, error });
      throw error;
    }
  }

  /**
   * Statistiques des sessions
   */
  async getSessionStats(): Promise<{
    totalActive: number;
    totalExpired: number;
    byUserType: {
      admin: number;
      client: number;
    };
    recentLogins: number; // dernières 24h
    avgSessionDuration: number; // en minutes
  }> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Sessions actives et expirées
      const [sessionCounts] = await db
        .selectFrom('session')
        .select([
          (eb) => eb.fn.count('id').filterWhere('expiresAt', '>', now).as('active'),
          (eb) => eb.fn.count('id').filterWhere('expiresAt', '<=', now).as('expired'),
          (eb) => eb.fn.count('id').filterWhere('createdAt', '>', oneDayAgo).as('recent'),
        ])
        .execute();

      // Sessions par type d'utilisateur (admin vs client)
      const adminSessions = await db
        .selectFrom('session')
        .innerJoin('user_admin', 'user_admin.id', 'session.userId')
        .select((eb) => eb.fn.count('session.id').as('count'))
        .where('session.expiresAt', '>', now)
        .executeTakeFirst();

      const clientSessions = await db
        .selectFrom('session')
        .innerJoin('user_client', 'user_client.id', 'session.userId')
        .select((eb) => eb.fn.count('session.id').as('count'))
        .where('session.expiresAt', '>', now)
        .where('user_client.deleted_at', 'is', null)
        .executeTakeFirst();

      // Durée moyenne des sessions (approximation basée sur les sessions expirées)
      const [avgDuration] = await db
        .selectFrom('session')
        .select((eb) => 
          eb.fn.avg(
            eb.cast(
              eb('expiresAt', '-', eb.ref('createdAt')), 
              'bigint'
            )
          ).as('avg_duration_ms')
        )
        .where('expiresAt', '<=', now)
        .where('createdAt', '>', new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) // dernière semaine
        .execute();

      const avgSessionDurationMinutes = avgDuration?.avg_duration_ms 
        ? Number(avgDuration.avg_duration_ms) / (1000 * 60)
        : 0;

      return {
        totalActive: Number(sessionCounts?.active || 0),
        totalExpired: Number(sessionCounts?.expired || 0),
        byUserType: {
          admin: Number(adminSessions?.count || 0),
          client: Number(clientSessions?.count || 0),
        },
        recentLogins: Number(sessionCounts?.recent || 0),
        avgSessionDuration: Math.round(avgSessionDurationMinutes),
      };
    } catch (error) {
      logger.error('Failed to get session stats', { error });
      throw error;
    }
  }

  /**
   * Invalide toutes les sessions sauf une (pour "log out from other devices")
   */
  async invalidateOtherUserSessions(userId: string, keepSessionId: string): Promise<number> {
    try {
      const result = await db
        .updateTable('session')
        .set({ expiresAt: new Date(Date.now() - 1000) })
        .where('userId', '=', userId)
        .where('id', '!=', keepSessionId)
        .where('expiresAt', '>', new Date())
        .executeTakeFirst();

      const invalidatedCount = Number(result.numUpdatedRows || 0);

      logger.info('Other user sessions invalidated', {
        userId,
        keepSessionId,
        sessionCount: invalidatedCount,
      });

      return invalidatedCount;
    } catch (error) {
      logger.error('Failed to invalidate other user sessions', { userId, keepSessionId, error });
      throw error;
    }
  }

  /**
   * Vérifie si une session est active
   */
  async isSessionActive(sessionId: string): Promise<boolean> {
    try {
      const session = await db
        .selectFrom('session')
        .select('id')
        .where('id', '=', sessionId)
        .where('expiresAt', '>', new Date())
        .executeTakeFirst();

      return !!session;
    } catch (error) {
      logger.error('Failed to check session status', { sessionId, error });
      return false;
    }
  }
}

// Instance singleton
export const sessionService = new SessionService();
export default sessionService;