import { useState, useEffect } from 'react'
import { apiClient, handleApiError } from '@/lib/api'
import type { 
  Project, 
  Task, 
  Invoice, 
  Document, 
  SupportTicket, 
  DashboardStats,
  Client
} from '@/types/client'

// Generic hook for API data fetching
function useApiData<T>(endpoint: string, dependencies: unknown[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiClient.get<any>(endpoint)
      // Normalize DRF paginated responses: { count, next, previous, results }
      if (result && typeof result === 'object' && Array.isArray(result.results)) {
        setData(result.results as T)
      } else {
        setData(result as T)
      }
    } catch (err) {
      setError(handleApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, dependencies)

  return { data, loading, error, refetch: fetchData }
}

// Dashboard hooks
export function useDashboard() {
  const projects = useApiData<any>('/api/projects/dashboard_stats')
  const tasks = useApiData<any>('/api/tasks/dashboard_stats')
  
  // Combine project and task stats into dashboard stats
  const data = projects.data && tasks.data ? {
    active_projects: projects.data.active_projects || 0,
    pending_tasks: tasks.data.tasks_by_status?.todo + tasks.data.tasks_by_status?.in_progress || 0,
    overdue_tasks: tasks.data.overdue_tasks || 0,
    pending_invoices: 0, // TODO: implement when billing is done
    overdue_invoices: 0,
    recent_activity: [] // TODO: implement
  } : null
  
  return {
    data,
    loading: projects.loading || tasks.loading,
    error: projects.error || tasks.error,
    refetch: () => {
      projects.refetch()
      tasks.refetch()
    }
  }
}

// Projects hooks
export function useProjects() {
  return useApiData<Project[]>('/api/projects')
}

export function useProject(id: number) {
  return useApiData<Project>(`/api/projects/${id}`, [id])
}

// Clients hooks
export function useClients() {
  return useApiData<Client[]>('/api/clients')
}

// Tasks hooks
export function useTasks(projectId?: number) {
  const endpoint = projectId ? `/api/tasks?project=${projectId}` : '/api/tasks'
  return useApiData<Task[]>(endpoint, [projectId])
}

export function useTasksKanban(projectId?: number) {
  const endpoint = projectId ? `/api/tasks/kanban?project=${projectId}` : '/api/tasks/kanban'
  return useApiData<any>(endpoint, [projectId])
}

export function useMyTasks() {
  return useApiData<Task[]>('/api/tasks/my_tasks')
}

export function useTask(id: number) {
  return useApiData<Task>(`/api/tasks/${id}`, [id])
}

// Invoices hooks
export function useInvoices() {
  return useApiData<Invoice[]>('/api/invoices')
}

export function useInvoice(id: number) {
  return useApiData<Invoice>(`/api/invoices/${id}`, [id])
}

// Payments hooks
export function usePayments() {
  return useApiData<any[]>('/api/payments')
}

// Documents hooks
export function useDocuments(projectId?: number) {
  const endpoint = projectId ? `/api/documents?project=${projectId}` : '/api/documents'
  return useApiData<Document[]>(endpoint, [projectId])
}

// Support tickets hooks
export function useSupportTickets() {
  return useApiData<SupportTicket[]>('/api/tickets')
}

export function useSupportTicket(id: number) {
  return useApiData<SupportTicket>(`/api/tickets/${id}`, [id])
}

// Mutation hooks for write operations
export function useApiMutation<TData = unknown, TVariables = unknown>() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = async (
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
    data?: TVariables
  ): Promise<TData> => {
    setLoading(true)
    setError(null)

    try {
      let result: TData
      switch (method) {
        case 'GET':
          result = await apiClient.get<TData>(endpoint)
          break
        case 'POST':
          result = await apiClient.post<TData>(endpoint, data)
          break
        case 'PUT':
          result = await apiClient.put<TData>(endpoint, data)
          break
        case 'PATCH':
          result = await apiClient.patch<TData>(endpoint, data)
          break
        case 'DELETE':
          result = await apiClient.delete<TData>(endpoint)
          break
      }
      return result
    } catch (err) {
      const errorMessage = handleApiError(err)
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return { mutate, loading, error }
}

// Axios-like API wrapper for admin components
export function useClientApi() {
  return {
    get: async <T = any>(endpoint: string) => {
      try {
        const data = await apiClient.get<T>(endpoint)
        return { data }
      } catch (e) {
        throw new Error(handleApiError(e))
      }
    },
    post: async <T = any>(endpoint: string, payload?: any) => {
      try {
        const data = await apiClient.post<T>(endpoint, payload)
        return { data }
      } catch (e) {
        throw new Error(handleApiError(e))
      }
    },
    put: async <T = any>(endpoint: string, payload: any) => {
      try {
        const data = await apiClient.put<T>(endpoint, payload)
        return { data }
      } catch (e) {
        throw new Error(handleApiError(e))
      }
    },
    patch: async <T = any>(endpoint: string, payload: any) => {
      try {
        const data = await apiClient.patch<T>(endpoint, payload)
        return { data }
      } catch (e) {
        throw new Error(handleApiError(e))
      }
    },
    delete: async <T = any>(endpoint: string) => {
      try {
        const data = await apiClient.delete<T>(endpoint)
        return { data }
      } catch (e) {
        throw new Error(handleApiError(e))
      }
    },
  }
}
