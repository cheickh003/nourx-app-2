'use client'

import { useState } from 'react'
import { ClientSidebar } from './client-sidebar'
import { ClientHeader } from './client-header'
import { cn } from '@/lib/utils'

interface ClientLayoutProps {
  children: React.ReactNode
  title: string
}

export function ClientLayout({ children, title }: ClientLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden w-64 md:block">
        <ClientSidebar />
      </div>

      {/* Mobile Sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform md:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <ClientSidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <ClientHeader 
          title={title} 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          showMobileMenu={true}
        />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
