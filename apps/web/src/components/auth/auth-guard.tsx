'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  role?: 'admin' | 'client' // Add role property
}

export function AuthGuard({ children, fallback, role }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return; // Wait until loading is false

    // If not logged in, redirect to login page
    if (!user) {
      if (role === 'admin') {
        router.push('/admin/login')
      } else {
        router.push('/login')
      }
      return;
    }

    const userRole = (user as any)?.role ?? user?.profile?.role ?? ((user as any)?.is_staff ? 'admin' : undefined)

    // If a role is required and the user's role does not match, redirect
    if (role && userRole !== role) {
        // Redirect non-admins trying to access admin pages to the client dashboard
        if (role === 'admin') {
            router.push('/dashboard'); 
        } else {
            // Admin sur page client: renvoyer vers le tableau de bord admin
            router.push('/admin');
        }
    }

  }, [user, loading, router, role])

  const userRole = (user as any)?.role ?? user?.profile?.role ?? ((user as any)?.is_staff ? 'admin' : undefined)
  if (loading || !user || (role && userRole !== role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
