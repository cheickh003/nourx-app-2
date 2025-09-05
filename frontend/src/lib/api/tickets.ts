import { getJson, postJson, patchJson } from '@/lib/api-client';
import type {
  Ticket,
  TicketList,
  TicketFilters,
  TicketCategory,
  TicketCategoryList,
  CreateTicketInput,
  CreateTicketReplyInput,
  TicketReply,
  TicketStats
} from '@nourx/shared';

/**
 * Récupère la liste des tickets avec filtres et pagination
 */
export async function getTickets(filters?: TicketFilters, page: number = 1, limit: number = 20): Promise<TicketList> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(filters && Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    )),
  });

  return getJson(`/api/client/tickets?${params}`);
}

/**
 * Récupère un ticket par son ID
 */
export async function getTicket(id: string): Promise<Ticket> {
  return getJson(`/api/client/tickets/${id}`);
}

/**
 * Récupère les réponses d'un ticket
 */
export async function getTicketReplies(ticketId: string): Promise<TicketReply[]> {
  return getJson(`/api/client/tickets/${ticketId}/replies`);
}

/**
 * Crée un nouveau ticket
 */
export async function createTicket(
  data: Omit<CreateTicketInput, 'organizationId'>
): Promise<Ticket> {
  return postJson('/api/client/tickets', data);
}

/**
 * Ajoute une réponse à un ticket
 */
export async function createTicketReply(data: CreateTicketReplyInput): Promise<TicketReply> {
  return postJson(`/api/client/tickets/${data.ticketId}/replies`, data);
}

/**
 * Récupère les catégories de tickets disponibles
 */
export async function getTicketCategories(): Promise<TicketCategoryList> {
  return getJson('/api/client/tickets/categories');
}

/**
 * Récupère les statistiques des tickets
 */
export async function getTicketStats(): Promise<TicketStats> {
  return getJson('/api/client/tickets/stats');
}

/**
 * Récupère les tickets récents pour le dashboard
 */
export async function getRecentTickets(limit: number = 5): Promise<Ticket[]> {
  return getJson(`/api/client/tickets/recent?limit=${limit}`);
}

/**
 * Met à jour le statut d'un ticket (pour les réponses client)
 */
export async function updateTicketStatus(ticketId: string, status: string, comment?: string): Promise<Ticket> {
  return patchJson(`/api/client/tickets/${ticketId}/status`, {
    status,
    comment,
    notifyClient: true,
  });
}
