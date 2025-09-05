'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav className={cn('flex items-center space-x-1 text-sm text-gray-600', className)}>
      <Link
        href="/client/dashboard"
        className="flex items-center hover:text-gray-900 transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {items.map((item, index) => (
        <div key={index} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1" />
          {item.href && index < items.length - 1 ? (
            <Link
              href={item.href}
              className="hover:text-gray-900 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={cn(
              index === items.length - 1 ? 'text-gray-900 font-medium' : 'text-gray-600'
            )}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

// Hook utilitaire pour générer les breadcrumbs automatiquement
export function useBreadcrumbs() {
  const generateBreadcrumbs = (customItems?: BreadcrumbItem[]): BreadcrumbItem[] => {
    if (customItems) return customItems;

    const segments = window.location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [];

    let currentPath = '';

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Traductions des segments courants
      const translations: Record<string, string> = {
        admin: 'Administration',
        dashboard: 'Tableau de bord',
        orgs: 'Organisations',
        tickets: 'Tickets',
        projects: 'Projets',
        billing: 'Facturation',
        documents: 'Documents',
        settings: 'Paramètres',
        support: 'Support',
        account: 'Compte'
      };

      const label = translations[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

      breadcrumbs.push({
        label,
        href: index < segments.length - 1 ? currentPath : undefined
      });
    });

    return breadcrumbs;
  };

  return { generateBreadcrumbs };
}
