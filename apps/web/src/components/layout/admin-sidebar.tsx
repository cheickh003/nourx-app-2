'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LayoutDashboard, FolderOpen, Users, FileText, CreditCard, MessageCircle, Settings } from 'lucide-react'

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/projets', label: 'Projets', icon: FolderOpen },
  // Placeholders for future phases
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/factures', label: 'Factures', icon: FileText },
  { href: '/admin/paiements', label: 'Paiements', icon: CreditCard },
  { href: '/admin/support', label: 'Support', icon: MessageCircle },
  { href: '/admin/clients/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/configuration', label: 'Configuration', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col border-r bg-background w-60">
      <div className="flex h-14 items-center border-b px-4">
        <Image src="/CNourx.png" alt="NOURX" width={128} height={32} className="h-8 w-auto" />
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {nav.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button variant={active ? 'secondary' : 'ghost'} className={cn('w-full justify-start', active && 'bg-secondary font-medium')}>
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
