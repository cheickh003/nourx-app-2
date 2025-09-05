import { getJson } from '@/lib/api-client';

// Types pour la gestion des documents
export interface Document {
  id: string;
  name: string;
  description?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  version: number;
  category: 'contract' | 'invoice' | 'report' | 'deliverable' | 'other';
  projectId?: string;
  projectName?: string;
  isShared: boolean;
  sharedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  createdAt: string;
}

export interface DocumentList {
  documents: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface DocumentFilters {
  search?: string;
  category?: string;
  projectId?: string;
  mimeType?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Récupère la liste des documents avec filtres et pagination
 */
export async function getDocuments(filters?: DocumentFilters, page: number = 1, limit: number = 20): Promise<DocumentList> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(filters && Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    )),
  });

  return getJson(`/api/client/documents?${params}`);
}

/**
 * Récupère un document par son ID
 */
export async function getDocument(id: string): Promise<Document> {
  return getJson(`/api/client/documents/${id}`);
}

/**
 * Récupère les versions d'un document
 */
export async function getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  return getJson(`/api/client/documents/${documentId}/versions`);
}

/**
 * Télécharge un document
 */
export async function downloadDocument(documentId: string, version?: number): Promise<Blob> {
  const params = version ? `?version=${version}` : '';
  const response = await fetch(`/api/client/documents/${documentId}/download${params}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Erreur lors du téléchargement du document');
  }

  return response.blob();
}

/**
 * Récupère les statistiques des documents
 */
export async function getDocumentStats(): Promise<{
  total: number;
  byCategory: Record<string, number>;
  totalSize: number;
  recentCount: number;
}> {
  return getJson('/api/client/documents/stats');
}

/**
 * Récupère les documents récents pour le dashboard
 */
export async function getRecentDocuments(limit: number = 10): Promise<Document[]> {
  return getJson(`/api/client/documents/recent?limit=${limit}`);
}
