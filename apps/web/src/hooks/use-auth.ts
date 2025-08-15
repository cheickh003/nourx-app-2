import { useState, useEffect } from 'react'
import { authStore } from '@/lib/auth'
import type { User, LoginCredentials } from '@/types/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(authStore.getUser())
  const [loading, setLoading] = useState(authStore.isLoading())

  useEffect(() => {
    const unsubscribe = authStore.subscribe(() => {
      setUser(authStore.getUser())
      setLoading(authStore.isLoading())
    })

    return unsubscribe
  }, [])

  const login = async (credentials: LoginCredentials) => {
    return authStore.login(credentials)
  }

  const logout = async () => {
    await authStore.logout()
  }

  return {
    user,
    loading,
    isAuthenticated: user !== null,
    login,
    logout,
  }
}
