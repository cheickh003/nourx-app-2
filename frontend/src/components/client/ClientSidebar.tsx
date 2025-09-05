'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  MessageSquare,
  Receipt,
  FolderOpen,
  FileText,
  User,
  LogOut
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/client/dashboard', icon: LayoutDashboard },
  { name: 'Support', href: '/client/support', icon: MessageSquare },
  { name: 'Facturation', href: '/client/billing', icon: Receipt },
  { name: 'Projets', href: '/client/projects', icon: FolderOpen },
  { name: 'Documents', href: '/client/documents', icon: FileText },
  { name: 'Compte', href: '/client/account', icon: User },
];

export function ClientSidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r">
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 border-b">
          <h1 className="text-xl font-bold text-blue-600">NOURX</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <Button
                  variant={isActive ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start',
                    isActive
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">C</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Client User</p>
              <p className="text-xs text-gray-500">client@nourx.com</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full mt-3">
            <LogOut className="h-4 w-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </div>
    </div>
  );
}
