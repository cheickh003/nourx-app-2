
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Briefcase, FileText, LifeBuoy, Settings, CreditCard } from 'lucide-react';
import Image from 'next/image';

const navItems = [
  { href: '/admin', icon: Home, label: 'Dashboard' },
  { href: '/admin/clients', icon: Users, label: 'Clients' },
  { href: '/admin/projets', icon: Briefcase, label: 'Projets' },
  { href: '/admin/factures', icon: FileText, label: 'Factures' },
  { href: '/admin/paiements', icon: CreditCard, label: 'Paiements' },
  { href: '/admin/support', icon: LifeBuoy, label: 'Support' },
  { href: '/admin/configuration', icon: Settings, label: 'Configuration' },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-gray-800 text-white p-4">
      <div className="mb-8 flex items-center">
        <Image src="apps/web/public/CNourx.png" alt="NOURX" width={140} height={36} className="h-9 w-auto" />
      </div>
      <nav>
        <ul>
          {navItems.map((item) => (
            <li key={item.label}>
              <Link href={item.href} className={`flex items-center p-2 rounded-md ${pathname === item.href ? 'bg-gray-700' : 'hover:bg-gray-700'}`}>
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
