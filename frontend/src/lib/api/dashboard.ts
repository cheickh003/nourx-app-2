import { getJson, CACHE_TAGS } from '@/lib/api-client';
import type { Project, Ticket, TicketStats } from '@nourx/shared';

// Types pour les données du dashboard
export interface DashboardStats {
  projects: {
    active: number;
    pendingDeliverables: number;
    total: number;
  };
  tickets: {
    open: number;
    inProgress: number;
    waitingClient: number;
    total: number;
  };
  billing: {
    pendingInvoices: number;
    pendingAmount: number;
    paidThisMonth: number;
    total: number;
  };
  documents: {
    recent: number;
    total: number;
  };
}

export interface RecentProject extends Project {
  progress: number;
  pendingDeliverables: number;
}

export interface RecentTicket {
  id: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardData {
  stats: DashboardStats;
  recentProjects: RecentProject[];
  recentTickets: RecentTicket[];
}

/**
 * Récupère les statistiques du dashboard client
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  return getJson('/api/client/dashboard/stats', {
    tags: [CACHE_TAGS.DASHBOARD, CACHE_TAGS.PROJECTS, CACHE_TAGS.TICKETS, CACHE_TAGS.BILLING],
    revalidate: 60, // Revalider toutes les minutes
  });
}

/**
 * Récupère les projets récents du client
 */
export async function getRecentProjects(limit: number = 5): Promise<RecentProject[]> {
  return getJson(`/api/client/projects/recent?limit=${limit}`, {
    tags: [CACHE_TAGS.PROJECTS],
    revalidate: 300, // Revalider toutes les 5 minutes
  });
}

/**
 * Récupère les tickets récents du client
 */
export async function getRecentTickets(limit: number = 5): Promise<RecentTicket[]> {
  return getJson(`/api/client/tickets/recent?limit=${limit}`, {
    tags: [CACHE_TAGS.TICKETS],
    revalidate: 300, // Revalider toutes les 5 minutes
  });
}

// Types pour le dashboard admin
export interface AdminDashboardStats {
  organizations: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  users: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  tickets: {
    total: number;
    open: number;
    overdue: number;
    avgResolutionTime: number;
  };
  projects: {
    total: number;
    active: number;
    completed: number;
    delayed: number;
  };
  billing: {
    monthlyRevenue: number;
    pendingInvoices: number;
    overdueInvoices: number;
    totalRevenue: number;
  };
  alerts: {
    criticalTickets: number;
    overdueProjects: number;
    pendingInvoices: number;
  };
}

export interface AdminDashboardData {
  stats: AdminDashboardStats;
  recentActivity: {
    id: string;
    type: 'ticket' | 'project' | 'organization' | 'invoice';
    title: string;
    description: string;
    timestamp: string;
    status: string;
    priority?: string;
  }[];
  alerts: {
    id: string;
    type: 'warning' | 'error' | 'info';
    title: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
  }[];
}

/**
 * Récupère les statistiques du dashboard admin
 */
export async function getAdminDashboardStats(searchParams?: URLSearchParams): Promise<AdminDashboardStats> {
  const params = searchParams ? `?${searchParams.toString()}` : '';
  return getJson(`/api/admin/dashboard/stats${params}`, {
    tags: [CACHE_TAGS.DASHBOARD, CACHE_TAGS.ORGANIZATIONS, CACHE_TAGS.USERS, CACHE_TAGS.TICKETS, CACHE_TAGS.PROJECTS, CACHE_TAGS.BILLING],
    revalidate: 60, // Revalider toutes les minutes
  });
}

/**
 * Récupère les données complètes du dashboard admin
 */
export async function getAdminDashboardData(searchParams?: URLSearchParams): Promise<AdminDashboardData> {
  const params = searchParams ? `?${searchParams.toString()}` : '';
  return getJson(`/api/admin/dashboard${params}`, {
    tags: [CACHE_TAGS.DASHBOARD, CACHE_TAGS.ORGANIZATIONS, CACHE_TAGS.USERS, CACHE_TAGS.TICKETS, CACHE_TAGS.PROJECTS, CACHE_TAGS.BILLING],
    revalidate: 60, // Revalider toutes les minutes
  });
}

/**
 * Récupère toutes les données du dashboard en une seule requête
 */
export async function getDashboardData(): Promise<DashboardData> {
  try {
    const [stats, recentProjects, recentTickets] = await Promise.all([
      getDashboardStats(),
      getRecentProjects(),
      getRecentTickets(),
    ]);

    return {
      stats,
      recentProjects,
      recentTickets,
    };
  } catch (error) {
    console.error('Erreur lors du chargement des données du dashboard:', error);
    // Retourner des données par défaut en cas d'erreur
    return {
      stats: {
        projects: { active: 0, pendingDeliverables: 0, total: 0 },
        tickets: { open: 0, inProgress: 0, waitingClient: 0, total: 0 },
        billing: { pendingInvoices: 0, pendingAmount: 0, paidThisMonth: 0, total: 0 },
        documents: { recent: 0, total: 0 },
      },
      recentProjects: [],
      recentTickets: [],
    };
  }
}

// Fonctions utilitaires pour l'invalidation des dashboards
export async function invalidateDashboardCache(): Promise<void> {
  'use server'

  // Invalider tous les tags du dashboard
  // Note: Dans Next.js App Router, on utiliserait revalidateTag()
  // mais comme nous sommes dans une fonction utilitaire, nous retournons les tags à invalider
  return Promise.resolve();
}

export async function invalidateProjectCache(): Promise<void> {
  'use server'
  return Promise.resolve();
}

export async function invalidateTicketCache(): Promise<void> {
  'use server'
  return Promise.resolve();
}

export async function invalidateBillingCache(): Promise<void> {
  'use server'
  return Promise.resolve();
}
