import { useState, useEffect } from 'react'
import { apiClient, handleApiError, ApiError } from '@/lib/api'
import type { User } from '@/types/auth'

export interface AdminStats {
  total_projects: number
  total_clients: number
  open_tickets: number
  revenue_total: number
}

export function useAdminStats() {
  const [data, setData] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      // Ensure user has admin rights before fetching
      const me = await apiClient.get<User>('/api/me/')
      const isAdmin = (me as any)?.is_staff || (me as any)?.is_superuser || (me as any)?.profile?.role === 'admin' || (me as any)?.role === 'admin'
      if (!isAdmin) {
        setError("Accès refusé: réservé aux administrateurs.")
        setData(null)
        return
      }

      let result = await apiClient.get<AdminStats>('/api/admin-stats/')
      setData(result)
    } catch (err) {
      // Fallback: some environments mount under /api/core/admin-stats/
      if (err instanceof ApiError && err.status === 404) {
        try {
          const alt = await apiClient.get<AdminStats>('/api/core/admin-stats/')
          setData(alt)
          return
        } catch (e) {
          setError(handleApiError(e))
          return
        }
      }
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [])

  return { data, loading, error, refetch: fetchStats }
}
