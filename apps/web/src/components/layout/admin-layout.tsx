'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AdminSidebar } from './admin-sidebar'
import { AdminHeader } from './admin-header'
import { useAuth } from '@/hooks/use-auth'

export function AdminLayout({ title, children }: { title: string; children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      const isAdmin = !!user && (user.role === 'admin' || (user as any).is_staff)
      if (!isAdmin) {
        router.replace('/admin/login')
      }
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
      </div>
    )
  }

  const isAdmin = !!user && (user.role === 'admin' || (user as any).is_staff)
  if (!isAdmin) return null

  return (
    <div className="flex h-screen bg-background">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader title={title} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
