import { getJson, postJson, patchJson } from '@/lib/api-client';
import type {
  Project,
  ProjectList,
  ProjectFilters,
  Milestone,
  Task,
  Deliverable,
  CreateDeliverableInput,
  ApproveDeliverableInput
} from '@nourx/shared';

/**
 * Récupère la liste des projets avec filtres et pagination
 */
export async function getProjects(filters?: ProjectFilters, page: number = 1, limit: number = 20): Promise<ProjectList> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(filters && Object.fromEntries(
      Object.entries(filters).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    )),
  });

  return getJson(`/api/client/projects?${params}`);
}

/**
 * Récupère un projet par son ID
 */
export async function getProject(id: string): Promise<Project> {
  return getJson(`/api/client/projects/${id}`);
}

/**
 * Récupère les jalons d'un projet
 */
export async function getProjectMilestones(projectId: string): Promise<Milestone[]> {
  return getJson(`/api/client/projects/${projectId}/milestones`);
}

/**
 * Récupère les tâches d'un projet visibles au client
 */
export async function getProjectTasks(projectId: string): Promise<Task[]> {
  return getJson(`/api/client/projects/${projectId}/tasks`);
}

/**
 * Récupère les livrables d'un projet
 */
export async function getProjectDeliverables(projectId: string): Promise<Deliverable[]> {
  return getJson(`/api/client/projects/${projectId}/deliverables`);
}

/**
 * Approuve ou demande une révision d'un livrable
 */
export async function approveDeliverable(deliverableId: string, data: ApproveDeliverableInput): Promise<Deliverable> {
  return patchJson(`/api/client/deliverables/${deliverableId}/approve`, data);
}

/**
 * Télécharge un livrable
 */
export async function downloadDeliverable(deliverableId: string): Promise<Blob> {
  const response = await fetch(`/api/client/deliverables/${deliverableId}/download`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Erreur lors du téléchargement du fichier');
  }

  return response.blob();
}

/**
 * Récupère les projets récents pour le dashboard
 */
export async function getRecentProjects(limit: number = 5): Promise<Project[]> {
  return getJson(`/api/client/projects/recent?limit=${limit}`);
}
