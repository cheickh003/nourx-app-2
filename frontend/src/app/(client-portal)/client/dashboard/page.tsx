import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  MessageSquare,
  FolderOpen,
  Receipt,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { getDashboardData } from '@/lib/api/dashboard';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ClientDashboardPage({ searchParams }: DashboardPageProps) {
  // Charger les données du dashboard côté serveur
  const dashboardData = await getDashboardData();

  const { stats, recentProjects, recentTickets } = dashboardData;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'active':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'active':
        return 'text-blue-600';
      default:
        return 'text-yellow-600';
    }
  };

  const getTicketStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'waiting_client':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de vos projets, tickets et facturation"
      />

      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets actifs</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects.active}</div>
            <p className="text-xs text-muted-foreground">
              {stats.projects.pendingDeliverables} livrable{stats.projects.pendingDeliverables !== 1 ? 's' : ''} en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets ouverts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tickets.open}</div>
            <p className="text-xs text-muted-foreground">
              {stats.tickets.inProgress} en cours de traitement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures en attente</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.billing.pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">
              €{stats.billing.pendingAmount.toLocaleString('fr-FR')} à payer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents récents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.documents.recent}</div>
            <p className="text-xs text-muted-foreground">
              {stats.documents.total} documents au total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* État des projets et tickets récents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Projets récents</CardTitle>
            <CardDescription>
              État de vos projets en cours
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(project.status)}
                    <div className="flex-1">
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-gray-600">
                        {project.description || 'Aucune description'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${getStatusColor(project.status)}`}>
                      {project.status === 'completed' ? 'Terminé' :
                       project.status === 'active' ? 'Actif' : 'Brouillon'}
                    </span>
                    <Link href={`/client/projects/${project.id}`}>
                      <Button size="sm" variant="ghost" aria-label="Voir les détails du projet">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                Aucun projet récent
              </div>
            )}

            {recentProjects.length > 0 && (
              <div className="pt-4 border-t">
                <Link href="/client/projects">
                  <Button variant="outline" className="w-full">
                    Voir tous les projets
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>
              Accès rapide aux fonctionnalités principales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/client/support/new">
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Créer un ticket de support
              </Button>
            </Link>
            <Link href="/client/documents">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Télécharger mes documents
              </Button>
            </Link>
            <Link href="/client/billing">
              <Button className="w-full justify-start" variant="outline">
                <Receipt className="mr-2 h-4 w-4" />
                Voir mes factures
              </Button>
            </Link>
            <Link href="/client/projects">
              <Button className="w-full justify-start" variant="outline">
                <FolderOpen className="mr-2 h-4 w-4" />
                Consulter mes projets
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Tickets récents */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets récents</CardTitle>
          <CardDescription>
            Vos demandes de support les plus récentes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentTickets.length > 0 ? (
              recentTickets.map((ticket) => (
                <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      ticket.status === 'resolved' ? 'bg-green-500' :
                      ticket.status === 'in_progress' ? 'bg-blue-500' :
                      ticket.status === 'waiting_client' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="font-medium">{ticket.title}</p>
                      <p className="text-sm text-gray-600">
                        {formatDistanceToNow(new Date(ticket.createdAt), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getTicketStatusColor(ticket.status)}`}>
                      {ticket.status === 'resolved' ? 'Résolu' :
                       ticket.status === 'in_progress' ? 'En cours' :
                       ticket.status === 'waiting_client' ? 'En attente' :
                       ticket.status === 'open' ? 'Ouvert' : ticket.status}
                    </span>
                    <Link href={`/client/support/${ticket.id}`}>
                      <Button size="sm" variant="outline">
                        Voir détails
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                Aucun ticket récent
              </div>
            )}

            {recentTickets.length > 0 && (
              <div className="pt-4 border-t">
                <Link href="/client/support">
                  <Button variant="outline" className="w-full">
                    Voir tous les tickets
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
