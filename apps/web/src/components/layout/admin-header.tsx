'use client'

import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AdminHeader({ title }: { title: string }) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 lg:px-6">
      <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
      <div>
        <Button variant="ghost" size="icon">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}

