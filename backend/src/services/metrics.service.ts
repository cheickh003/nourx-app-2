import { db } from '@/lib/db';
import logger from '@/lib/logger';

export interface SystemMetrics {
  emails: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
  tickets: {
    total: number;
    open: number;
    closed: number;
    overdue: number;
  };
  users: {
    totalAdmin: number;
    totalClient: number;
    activeAdmin: number;
    activeClient: number;
  };
  organizations: {
    total: number;
    active: number;
  };
  uptime: number;
  timestamp: Date;
}

export interface MetricFilter {
  fromDate?: Date;
  toDate?: Date;
  organizationId?: string;
}

export class MetricsService {
  /**
   * Collecte toutes les métriques système
   */
  async getSystemMetrics(filter: MetricFilter = {}): Promise<SystemMetrics> {
    try {
      const [emailMetrics, ticketMetrics, userMetrics, orgMetrics] = await Promise.all([
        this.getEmailMetrics(filter),
        this.getTicketMetrics(filter),
        this.getUserMetrics(filter),
        this.getOrganizationMetrics(),
      ]);

      return {
        emails: emailMetrics,
        tickets: ticketMetrics,
        users: userMetrics,
        organizations: orgMetrics,
        uptime: process.uptime(),
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Failed to collect system metrics', { error, filter });
      throw error;
    }
  }

  /**
   * Métriques des emails
   */
  async getEmailMetrics(filter: MetricFilter = {}): Promise<SystemMetrics['emails']> {
    try {
      let query = db.selectFrom('email_outbox');

      if (filter.fromDate) {
        query = query.where('created_at', '>=', filter.fromDate);
      }

      if (filter.toDate) {
        query = query.where('created_at', '<=', filter.toDate);
      }

      const stats = await query
        .select([
          (eb) => eb.fn.count('id').as('total'),
          (eb) => eb.fn.count('id').filterWhere('status', '=', 'sent').as('sent'),
          (eb) => eb.fn.count('id').filterWhere('status', '=', 'failed').as('failed'),
          (eb) => eb.fn.count('id').filterWhere('status', '=', 'pending').as('pending'),
        ])
        .executeTakeFirst();

      return {
        total: Number(stats?.total || 0),
        sent: Number(stats?.sent || 0),
        failed: Number(stats?.failed || 0),
        pending: Number(stats?.pending || 0),
      };
    } catch (error) {
      logger.error('Failed to get email metrics', { error, filter });
      return { total: 0, sent: 0, failed: 0, pending: 0 };
    }
  }

  /**
   * Métriques des tickets
   */
  async getTicketMetrics(filter: MetricFilter = {}): Promise<SystemMetrics['tickets']> {
    try {
      let query = db.selectFrom('ticket');

      if (filter.fromDate) {
        query = query.where('created_at', '>=', filter.fromDate);
      }

      if (filter.toDate) {
        query = query.where('created_at', '<=', filter.toDate);
      }

      if (filter.organizationId) {
        query = query.where('organization_id', '=', filter.organizationId);
      }

      const stats = await query
        .select([
          (eb) => eb.fn.count('id').as('total'),
          (eb) => eb.fn.count('id').filterWhere('status', 'in', ['new', 'assigned', 'in_progress']).as('open'),
          (eb) => eb.fn.count('id').filterWhere('status', 'in', ['resolved', 'closed']).as('closed'),
          (eb) => eb.fn.count('id').filterWhere(
            eb.and([
              eb('status', 'in', ['new', 'assigned', 'in_progress']),
              eb('sla_deadline', '<', new Date())
            ])
          ).as('overdue'),
        ])
        .executeTakeFirst();

      return {
        total: Number(stats?.total || 0),
        open: Number(stats?.open || 0),
        closed: Number(stats?.closed || 0),
        overdue: Number(stats?.overdue || 0),
      };
    } catch (error) {
      logger.error('Failed to get ticket metrics', { error, filter });
      return { total: 0, open: 0, closed: 0, overdue: 0 };
    }
  }

  /**
   * Métriques des utilisateurs
   */
  async getUserMetrics(filter: MetricFilter = {}): Promise<SystemMetrics['users']> {
    try {
      let adminQuery = db.selectFrom('user_admin');
      let clientQuery = db.selectFrom('user_client');

      if (filter.fromDate) {
        adminQuery = adminQuery.where('created_at', '>=', filter.fromDate);
        clientQuery = clientQuery.where('created_at', '>=', filter.fromDate);
      }

      if (filter.toDate) {
        adminQuery = adminQuery.where('created_at', '<=', filter.toDate);
        clientQuery = clientQuery.where('created_at', '<=', filter.toDate);
      }

      if (filter.organizationId) {
        adminQuery = adminQuery.where('organization_id', '=', filter.organizationId);
        clientQuery = clientQuery.where('organization_id', '=', filter.organizationId);
      }

      const [adminStats, clientStats] = await Promise.all([
        adminQuery
          .select([
            (eb) => eb.fn.count('id').as('total'),
            (eb) => eb.fn.count('id').filterWhere('is_active', '=', true).as('active'),
          ])
          .executeTakeFirst(),
        clientQuery
          .select([
            (eb) => eb.fn.count('id').as('total'),
            (eb) => eb.fn.count('id').filterWhere('is_active', '=', true).as('active'),
          ])
          .executeTakeFirst()
      ]);

      return {
        totalAdmin: Number(adminStats?.total || 0),
        totalClient: Number(clientStats?.total || 0),
        activeAdmin: Number(adminStats?.active || 0),
        activeClient: Number(clientStats?.active || 0),
      };
    } catch (error) {
      logger.error('Failed to get user metrics', { error, filter });
      return { totalAdmin: 0, totalClient: 0, activeAdmin: 0, activeClient: 0 };
    }
  }

  /**
   * Métriques des organisations
   */
  async getOrganizationMetrics(): Promise<SystemMetrics['organizations']> {
    try {
      const stats = await db
        .selectFrom('organization')
        .select([
          (eb) => eb.fn.count('id').as('total'),
          (eb) => eb.fn.count('id').filterWhere('is_active', '=', true).as('active'),
        ])
        .executeTakeFirst();

      return {
        total: Number(stats?.total || 0),
        active: Number(stats?.active || 0),
      };
    } catch (error) {
      logger.error('Failed to get organization metrics', { error });
      return { total: 0, active: 0 };
    }
  }

  /**
   * Métriques par organisation
   */
  async getOrganizationStats(organizationId: string, fromDate?: Date): Promise<{
    tickets: SystemMetrics['tickets'];
    users: Pick<SystemMetrics['users'], 'totalClient' | 'activeClient'>;
    projects: {
      total: number;
      active: number;
      completed: number;
    };
    invoices: {
      total: number;
      sent: number;
      paid: number;
      overdue: number;
    };
  }> {
    try {
      const filter = { organizationId, fromDate };

      const [ticketMetrics, userMetrics, projectMetrics, invoiceMetrics] = await Promise.all([
        this.getTicketMetrics(filter),
        this.getUserMetrics(filter),
        this.getProjectMetrics(organizationId, fromDate),
        this.getInvoiceMetrics(organizationId, fromDate),
      ]);

      return {
        tickets: ticketMetrics,
        users: {
          totalClient: userMetrics.totalClient,
          activeClient: userMetrics.activeClient,
        },
        projects: projectMetrics,
        invoices: invoiceMetrics,
      };
    } catch (error) {
      logger.error('Failed to get organization stats', { error, organizationId });
      throw error;
    }
  }

  /**
   * Métriques des projets pour une organisation
   */
  private async getProjectMetrics(organizationId: string, fromDate?: Date): Promise<{
    total: number;
    active: number;
    completed: number;
  }> {
    try {
      let query = db.selectFrom('project').where('organization_id', '=', organizationId);

      if (fromDate) {
        query = query.where('created_at', '>=', fromDate);
      }

      const stats = await query
        .select([
          (eb) => eb.fn.count('id').as('total'),
          (eb) => eb.fn.count('id').filterWhere('status', '=', 'active').as('active'),
          (eb) => eb.fn.count('id').filterWhere('status', '=', 'completed').as('completed'),
        ])
        .executeTakeFirst();

      return {
        total: Number(stats?.total || 0),
        active: Number(stats?.active || 0),
        completed: Number(stats?.completed || 0),
      };
    } catch (error) {
      logger.error('Failed to get project metrics', { error, organizationId });
      return { total: 0, active: 0, completed: 0 };
    }
  }

  /**
   * Métriques des factures pour une organisation
   */
  private async getInvoiceMetrics(organizationId: string, fromDate?: Date): Promise<{
    total: number;
    sent: number;
    paid: number;
    overdue: number;
  }> {
    try {
      let query = db.selectFrom('invoice').where('organization_id', '=', organizationId);

      if (fromDate) {
        query = query.where('created_at', '>=', fromDate);
      }

      const stats = await query
        .select([
          (eb) => eb.fn.count('id').as('total'),
          (eb) => eb.fn.count('id').filterWhere('status', '=', 'sent').as('sent'),
          (eb) => eb.fn.count('id').filterWhere('status', '=', 'paid').as('paid'),
          (eb) => eb.fn.count('id').filterWhere(
            eb.and([
              eb('status', '=', 'sent'),
              eb('due_date', '<', new Date())
            ])
          ).as('overdue'),
        ])
        .executeTakeFirst();

      return {
        total: Number(stats?.total || 0),
        sent: Number(stats?.sent || 0),
        paid: Number(stats?.paid || 0),
        overdue: Number(stats?.overdue || 0),
      };
    } catch (error) {
      logger.error('Failed to get invoice metrics', { error, organizationId });
      return { total: 0, sent: 0, paid: 0, overdue: 0 };
    }
  }

  /**
   * Collecte des métriques en temps réel pour le monitoring
   */
  async collectRealTimeMetrics(): Promise<{
    memory: NodeJS.MemoryUsage;
    uptime: number;
    pendingEmails: number;
    openTickets: number;
    activeUsers: number;
  }> {
    try {
      const [emailMetrics, ticketMetrics, userMetrics] = await Promise.all([
        this.getEmailMetrics(),
        this.getTicketMetrics(),
        this.getUserMetrics(),
      ]);

      return {
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        pendingEmails: emailMetrics.pending,
        openTickets: ticketMetrics.open,
        activeUsers: userMetrics.activeAdmin + userMetrics.activeClient,
      };
    } catch (error) {
      logger.error('Failed to collect real-time metrics', { error });
      throw error;
    }
  }
}

// Instance singleton
export const metricsService = new MetricsService();
export default metricsService;