export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// Types pour les tags d'invalidation
export type CacheTag = string | string[]
export type RevalidateTag = string

// Options étendues pour les requêtes
export interface RequestOptions extends RequestInit {
  tags?: CacheTag[]
  revalidate?: number | false
  cache?: RequestCache
}

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'
}

// Fonction utilitaire pour normaliser les tags
function normalizeTags(tags?: CacheTag[]): string[] {
  if (!tags) return []
  if (Array.isArray(tags)) {
    return tags.map(tag => typeof tag === 'string' ? tag : tag[0])
  }
  return typeof tags === 'string' ? [tags] : tags
}

async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const base = getApiBaseUrl()
  // Pour les routes internes Next.js, garder un chemin relatif vers /api
  const url = path.startsWith('http')
    ? path
    : (path.startsWith('/api/') ? path : `${base}${path}`)

  // Extraire les options Next.js
  const { tags, revalidate, ...fetchInit } = init || {}

  // Déterminer la stratégie de cache
  let cacheStrategy: RequestCache = 'no-store' // Par défaut côté serveur
  if (typeof window !== 'undefined') {
    // Côté client, utiliser une stratégie plus appropriée
    cacheStrategy = revalidate === false ? 'no-store' :
                   revalidate ? 'force-cache' : 'default'
  }

  const res = await fetch(url, {
    ...fetchInit,
    headers: {
      'Content-Type': 'application/json',
      ...(fetchInit.headers || {}),
    },
    credentials: 'include',
    cache: fetchInit.cache || cacheStrategy,
    next: {
      tags: normalizeTags(tags),
      revalidate,
    },
  })

  if (!res.ok) {
    let details: any
    try { details = await res.json() } catch {}
    throw new Error(details?.error?.message || `HTTP ${res.status}`)
  }

  return (await res.json()) as T
}

export async function getJson<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>(path, { ...options, method: 'GET' })
}

export async function postJson<T, B = unknown>(path: string, body?: B, options?: RequestOptions): Promise<T> {
  return request<T>(path, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined
  })
}

export async function putJson<T, B = unknown>(path: string, body?: B, options?: RequestOptions): Promise<T> {
  return request<T>(path, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined
  })
}

export async function patchJson<T, B = unknown>(path: string, body?: B, options?: RequestOptions): Promise<T> {
  return request<T>(path, {
    ...options,
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined
  })
}

export async function deleteJson<T = { success: boolean }>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>(path, { ...options, method: 'DELETE' })
}

// Fonctions utilitaires pour l'invalidation
export function invalidateTags(tags: RevalidateTag | RevalidateTag[]): void {
  if (typeof window !== 'undefined') {
    // Côté client, utiliser une approche différente
    console.warn('invalidateTags should be called from server actions or route handlers')
    return
  }

  // Cette fonction devrait être appelée depuis des Server Actions
  // ou des Route Handlers pour invalider le cache
}

// Constantes pour les tags courants
export const CACHE_TAGS = {
  DASHBOARD: 'dashboard',
  PROJECTS: 'projects',
  TICKETS: 'tickets',
  BILLING: 'billing',
  DOCUMENTS: 'documents',
  ORGANIZATIONS: 'organizations',
  USERS: 'users',
} as const
