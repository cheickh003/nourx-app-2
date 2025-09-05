import { getJson, postJson, patchJson } from '@/lib/api-client';

// Types pour la facturation
export interface Invoice {
  id: string;
  number: string;
  type: 'invoice' | 'quote' | 'credit_note';
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  amount: number;
  currency: string;
  dueDate?: string;
  sentAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  projectId?: string;
  projectName?: string;
  description?: string;
}

export interface InvoiceList {
  invoices: Invoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface InvoiceFilters {
  type?: 'invoice' | 'quote' | 'credit_note';
  status?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface BillingStats {
  totalInvoices: number;
  totalAmount: number;
  pendingInvoices: number;
  pendingAmount: number;
  paidThisMonth: number;
  overdueInvoices: number;
}

/**
 * Récupère la liste des factures/devis avec filtres et pagination
 */
export async function getInvoices(filters?: InvoiceFilters, page: number = 1, limit: number = 20): Promise<InvoiceList> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(filters && Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    )),
  });

  return getJson(`/api/client/billing/invoices?${params}`);
}

/**
 * Récupère une facture par son ID
 */
export async function getInvoice(id: string): Promise<Invoice> {
  return getJson(`/api/client/billing/invoices/${id}`);
}

/**
 * Télécharge une facture en PDF
 */
export async function downloadInvoice(id: string): Promise<Blob> {
  const response = await fetch(`/api/client/billing/invoices/${id}/download`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Erreur lors du téléchargement de la facture');
  }

  return response.blob();
}

/**
 * Récupère les statistiques de facturation
 */
export async function getBillingStats(): Promise<BillingStats> {
  return getJson('/api/client/billing/stats');
}

/**
 * Marque une facture comme payée (pour les tests/démo)
 */
export async function markInvoiceAsPaid(id: string): Promise<Invoice> {
  return patchJson(`/api/client/billing/invoices/${id}/mark-paid`, {});
}

/**
 * Envoie une facture par email
 */
export async function sendInvoiceByEmail(id: string): Promise<{ success: boolean }> {
  return postJson(`/api/client/billing/invoices/${id}/send-email`, {});
}

/**
 * Récupère les factures récentes pour le dashboard
 */
export async function getRecentInvoices(limit: number = 5): Promise<Invoice[]> {
  return getJson(`/api/client/billing/invoices/recent?limit=${limit}`);
}
