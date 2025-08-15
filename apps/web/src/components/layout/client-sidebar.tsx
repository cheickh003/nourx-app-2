'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  LayoutDashboard, 
  FolderOpen, 
  CheckSquare, 
  FileText, 
  Upload, 
  MessageCircle,
  User,
  LogOut
} from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

const navigation: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projets', label: 'Mes Projets', icon: FolderOpen },
  { href: '/taches', label: 'Mes Tâches', icon: CheckSquare },
  { href: '/factures', label: 'Mes Factures', icon: FileText },
  { href: '/documents', label: 'Documents', icon: Upload },
  { href: '/support', label: 'Support', icon: MessageCircle },
  { href: '/profil', label: 'Mon Profil', icon: User },
]

export function ClientSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
      window.location.href = '/login'
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  return (
    <div className="flex h-full flex-col border-r bg-background">
      {/* Logo/Brand */}
      <div className="flex h-14 items-center border-b px-4">
        <h1 className="text-xl font-semibold">NOURX</h1>
      </div>

      {/* User Info */}
      {user && (
        <div className="border-b px-4 py-3">
          <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  isActive && "bg-secondary font-medium"
                )}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
                {item.badge && item.badge > 0 && (
                  <Badge variant="destructive" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t p-2">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Se déconnecter
        </Button>
      </div>
    </div>
  )
}
