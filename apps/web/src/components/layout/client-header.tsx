'use client'

import { Bell, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ClientHeaderProps {
  title: string
  onMenuClick?: () => void
  showMobileMenu?: boolean
}

export function ClientHeader({ title, onMenuClick, showMobileMenu = false }: ClientHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4 lg:px-6">
      <div className="flex items-center gap-2">
        {showMobileMenu && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
        <h1 className="text-lg font-semibold md:text-xl">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <Badge 
                variant="destructive" 
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs"
              >
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="p-2">
              <h3 className="font-medium">Notifications</h3>
              <p className="text-sm text-muted-foreground">
                Vous avez 3 nouvelles notifications
              </p>
            </div>
            <DropdownMenuItem>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Nouveau commentaire sur la tâche #42</p>
                <p className="text-xs text-muted-foreground">Il y a 2 minutes</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Facture #INV-2024-001 due demain</p>
                <p className="text-xs text-muted-foreground">Il y a 1 heure</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">Nouveau document partagé</p>
                <p className="text-xs text-muted-foreground">Il y a 3 heures</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
