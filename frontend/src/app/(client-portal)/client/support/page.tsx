'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/shared/DataTable';
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  PauseCircle,
  Circle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import useSWR from 'swr';
import { getTickets, getTicketStats } from '@/lib/api/tickets';
import type { Ticket, TicketStats, TicketFilters } from '@nourx/shared';

export default function ClientSupportPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<TicketFilters>({
    search: searchParams.get('search') || '',
    status: (searchParams.get('status') as any) || undefined,
    priority: (searchParams.get('priority') as any) || undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);

  // Charger les statistiques
  const { data: stats, error: statsError, mutate: mutateStats } = useSWR(
    'ticket-stats',
    getTicketStats,
    { refreshInterval: 30000 } // Rafraîchir toutes les 30 secondes
  );

  // Charger la liste des tickets avec filtres
  const { data: ticketsData, error: ticketsError, mutate: mutateTickets, isLoading } = useSWR(
    ['tickets', filters, currentPage],
    () => getTickets(filters, currentPage),
    {
      refreshInterval: 30000, // Rafraîchir toutes les 30 secondes
      revalidateOnFocus: true,
    }
  );

  // Mettre à jour l'URL avec les filtres
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.status) params.set('status', filters.status);
    if (filters.priority) params.set('priority', filters.priority);

    const newUrl = params.toString() ? `?${params.toString()}` : '';
    router.replace(`/client/support${newUrl}`, { scroll: false });
  }, [filters, router]);

  const handleFilterChange = (key: keyof TicketFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
    setCurrentPage(1); // Reset à la première page
  };

  const handleRefresh = () => {
    mutateTickets();
    mutateStats();
    toast.success('Données actualisées');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'waiting_client':
        return <PauseCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      resolved: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      waiting_client: 'bg-yellow-100 text-yellow-800',
      open: 'bg-gray-100 text-gray-800',
      closed: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      resolved: 'Résolu',
      in_progress: 'En cours',
      waiting_client: 'En attente',
      open: 'Ouvert',
      closed: 'Fermé',
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.open}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };

    const labels = {
      low: 'Faible',
      medium: 'Normale',
      high: 'Haute',
      urgent: 'Urgente',
    };

    return (
      <Badge className={variants[priority as keyof typeof variants] || variants.medium}>
        {labels[priority as keyof typeof labels] || priority}
      </Badge>
    );
  };

  const columns = [
    {
      key: 'title',
      header: 'Titre',
      render: (_value: any, ticket: Ticket) => {
        const id = ticket?.id ? String(ticket.id) : ''
        const title = String(ticket?.title || '')
        const desc = String(ticket?.description || '')
        const href = id ? `/client/support/${id}` : '#'
        return (
          <div>
            <Link
              href={href}
              className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
            >
              {title || '—'}
            </Link>
            <p className="text-sm text-gray-600 mt-1">
              {desc.length > 100 ? `${desc.substring(0, 100)}...` : desc}
            </p>
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Statut',
      render: (value: any) => getStatusBadge(String(value || 'open')),
    },
    {
      key: 'priority',
      header: 'Priorité',
      render: (value: any) => getPriorityBadge(String(value || 'medium')),
    },
    {
      key: 'createdAt',
      header: 'Créé',
      render: (value: any) => {
        const created = new Date(String(value || ''))
        const valid = !Number.isNaN(created.getTime())
        return (
          <span className="text-sm text-gray-600">
            {valid ? formatDistanceToNow(created, { addSuffix: true, locale: fr }) : '—'}
          </span>
        )
      },
    },
    {
      key: 'updatedAt',
      header: 'Dernière activité',
      render: (value: any, ticket: Ticket) => {
        const updated = new Date(String(value || ticket?.createdAt || ''))
        const valid = !Number.isNaN(updated.getTime())
        return (
          <span className="text-sm text-gray-600">
            {valid ? formatDistanceToNow(updated, { addSuffix: true, locale: fr }) : '—'}
          </span>
        )
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_value: any, ticket: Ticket) => {
        const id = ticket?.id ? String(ticket.id) : ''
        const href = id ? `/client/support/${id}` : '#'
        return (
          <Link href={href}>
            <Button size="sm" variant="outline" disabled={!id}>
              Voir détails
            </Button>
          </Link>
        )
      },
    },
  ];

  if (ticketsError) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Support"
          description="Une erreur est survenue lors du chargement des tickets"
        />
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Impossible de charger la liste des tickets.
              </p>
              <Button onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Support"
        description="Créez et suivez vos demandes de support"
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Link href="/client/support/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle demande
              </Button>
            </Link>
          </div>
        }
      />

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total des tickets</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tous statuts confondus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.byStatus?.in_progress || 0}</div>
            <p className="text-xs text-muted-foreground">
              En cours de traitement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <PauseCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.byStatus?.waiting_client || 0}</div>
            <p className="text-xs text-muted-foreground">
              En attente de réponse
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Résolus</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.byStatus?.resolved || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tickets terminés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtres</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Titre, description..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Statut</label>
              <Select
                value={filters.status ?? 'all'}
                onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="open">Ouvert</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="waiting_client">En attente</SelectItem>
                  <SelectItem value="resolved">Résolu</SelectItem>
                  <SelectItem value="closed">Fermé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Priorité</label>
              <Select
                value={filters.priority ?? 'all'}
                onValueChange={(value) => handleFilterChange('priority', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les priorités" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les priorités</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Normale</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({});
                  setCurrentPage(1);
                }}
                className="w-full"
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
          <CardDescription>
            {ticketsData?.pagination.total || 0} ticket{ticketsData?.pagination.total !== 1 ? 's' : ''} trouvé{ticketsData?.pagination.total !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <DataTable
              data={ticketsData?.tickets || []}
              columns={columns}
              pagination={ticketsData?.pagination}
              onPageChange={setCurrentPage}
              currentPage={currentPage}
              emptyMessage="Aucun ticket trouvé"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
