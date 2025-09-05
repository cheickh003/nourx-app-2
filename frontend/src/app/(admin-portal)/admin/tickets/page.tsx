'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Plus,
  Eye,
  Reply,
  Flag,
  User,
  Building,
  Calendar,
  MoreHorizontal
} from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import Link from 'next/link';

// Types pour les tickets
interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'waiting_client' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdAt: string;
  updatedAt: string;
  slaBreachAt?: string;
  slaStatus: 'within_sla' | 'warning' | 'breached';
  clientName: string;
  clientEmail: string;
  assignedTo?: string;
  organizationName: string;
  projectName?: string;
  lastResponseAt?: string;
  responseCount: number;
}

interface TicketStats {
  total: number;
  open: number;
  inProgress: number;
  waitingClient: number;
  resolved: number;
  closed: number;
  overdue: number;
  avgResolutionTime: number;
}

// Données mockées pour la démonstration
const mockTickets: Ticket[] = [
  {
    id: 'TICK-001',
    title: 'Problème de connexion au portail client',
    description: 'L\'utilisateur ne peut pas se connecter malgré des identifiants corrects',
    status: 'in_progress',
    priority: 'high',
    category: 'Authentification',
    createdAt: '2024-09-04T08:30:00Z',
    updatedAt: '2024-09-04T10:15:00Z',
    slaBreachAt: '2024-09-04T14:30:00Z',
    slaStatus: 'warning',
    clientName: 'Jean Dupont',
    clientEmail: 'jean.dupont@company.com',
    assignedTo: 'Alice Admin',
    organizationName: 'TechCorp SA',
    projectName: 'Plateforme E-commerce',
    lastResponseAt: '2024-09-04T09:45:00Z',
    responseCount: 3,
  },
  {
    id: 'TICK-002',
    title: 'Demande de modification de livrable',
    description: 'Le client souhaite apporter des modifications au livrable final',
    status: 'waiting_client',
    priority: 'medium',
    category: 'Livrable',
    createdAt: '2024-09-03T14:20:00Z',
    updatedAt: '2024-09-03T16:30:00Z',
    slaBreachAt: '2024-09-05T14:20:00Z',
    slaStatus: 'within_sla',
    clientName: 'Marie Martin',
    clientEmail: 'marie.martin@startup.fr',
    assignedTo: 'Bob Manager',
    organizationName: 'StartupXYZ',
    projectName: 'Application Mobile',
    lastResponseAt: '2024-09-03T15:10:00Z',
    responseCount: 5,
  },
  {
    id: 'TICK-003',
    title: 'Facture incorrecte - montant erroné',
    description: 'La facture reçue contient un montant supérieur au devis accepté',
    status: 'open',
    priority: 'urgent',
    category: 'Facturation',
    createdAt: '2024-09-02T11:45:00Z',
    updatedAt: '2024-09-02T11:45:00Z',
    slaBreachAt: '2024-09-02T17:45:00Z',
    slaStatus: 'breached',
    clientName: 'Pierre Durand',
    clientEmail: 'pierre.durand@consulting.com',
    organizationName: 'Consulting Plus',
    responseCount: 0,
  },
];

const mockStats: TicketStats = {
  total: 45,
  open: 12,
  inProgress: 8,
  waitingClient: 5,
  resolved: 15,
  closed: 5,
  overdue: 3,
  avgResolutionTime: 2.5, // jours
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    // Simuler le chargement des données
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setTickets(mockTickets);
      setStats(mockStats);
      setSelectedTicket(mockTickets[0]);
      setLoading(false);
    };

    loadData();
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'in_progress':
        return 'default';
      case 'waiting_client':
        return 'secondary';
      case 'resolved':
        return 'outline';
      case 'closed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Ouvert';
      case 'in_progress':
        return 'En cours';
      case 'waiting_client':
        return 'Attente client';
      case 'resolved':
        return 'Résolu';
      case 'closed':
        return 'Fermé';
      default:
        return status;
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Urgent';
      case 'high':
        return 'Élevé';
      case 'medium':
        return 'Moyen';
      case 'low':
        return 'Faible';
      default:
        return priority;
    }
  };

  const getSlaStatus = (slaStatus: string, slaBreachAt?: string) => {
    if (slaStatus === 'breached') {
      return <XCircle className="h-4 w-4 text-red-500" />;
    } else if (slaStatus === 'warning') {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    } else {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.organizationName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const columns = [
    {
      key: 'id',
      label: 'ID',
      render: (value: unknown) => (
        <span className="font-mono text-sm font-medium">{String(value)}</span>
      ),
    },
    {
      key: 'title',
      label: 'Titre',
      render: (value: unknown, item: Record<string, unknown>) => (
        <div className="max-w-xs">
          <div className="font-medium truncate">{String(value)}</div>
          <div className="text-sm text-gray-500 truncate">
            {String(item.organizationName)} • {String(item.clientName)}
          </div>
        </div>
      ),
    },
    {
      key: 'priority',
      label: 'Priorité',
      render: (value: unknown) => (
        <Badge variant={getPriorityBadgeVariant(String(value))}>
          {getPriorityLabel(String(value))}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (value: unknown, item: Record<string, unknown>) => (
        <div className="flex items-center space-x-2">
          <Badge variant={getStatusBadgeVariant(String(value))}>
            {getStatusLabel(String(value))}
          </Badge>
          {getSlaStatus(String(item.slaStatus), String(item.slaBreachAt))}
        </div>
      ),
    },
    {
      key: 'assignedTo',
      label: 'Assigné à',
      render: (value: unknown) => (
        <span className="text-sm">{String(value || 'Non assigné')}</span>
      ),
    },
    {
      key: 'updatedAt',
      label: 'Dernière MAJ',
      render: (value: unknown) => (
        <span className="text-sm text-gray-500">
          {new Date(String(value)).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: unknown, item: Record<string, unknown>) => (
        <div className="flex items-center space-x-2">
          <Link href={`/admin/tickets/${String(item.id)}`}>
            <Button variant="ghost" size="sm" aria-label="Voir les détails du ticket">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="sm" aria-label="Répondre au ticket">
            <Reply className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Plus d'options">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Tickets"
        description="Boîte de réception et gestion des demandes de support"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau ticket
          </Button>
        }
      />

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Tickets dans le système
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ouverts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.open}</div>
              <p className="text-xs text-muted-foreground">
                {stats.overdue} dépassent le SLA
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En cours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">
                Réponse en cours
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Résolus</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolved}</div>
              <p className="text-xs text-muted-foreground">
                Ce mois-ci
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alertes SLA */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>{stats?.overdue || 0} tickets dépassent le SLA</strong> - Réponse requise sous 24h selon les engagements contractuels.
        </AlertDescription>
      </Alert>

      {/* Filtres et recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrage et recherche</CardTitle>
          <CardDescription>
            Affinez la liste des tickets selon vos critères
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par titre, client ou organisation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="open">Ouvert</SelectItem>
                <SelectItem value="in_progress">En cours</SelectItem>
                <SelectItem value="waiting_client">Attente client</SelectItem>
                <SelectItem value="resolved">Résolu</SelectItem>
                <SelectItem value="closed">Fermé</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Toutes les priorités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les priorités</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">Élevé</SelectItem>
                <SelectItem value="medium">Moyen</SelectItem>
                <SelectItem value="low">Faible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
          <CardDescription>
            Liste des tickets de support avec statut et priorité
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredTickets as unknown as Record<string, unknown>[]}
            columns={columns}
            searchable={false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
