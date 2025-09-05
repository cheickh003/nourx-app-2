import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { CalendarDays } from 'lucide-react';
import {
  Users,
  MessageSquare,
  FolderOpen,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Building,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { getAdminDashboardData } from '@/lib/api/dashboard';
import { Suspense } from 'react';

interface AdminDashboardPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function AdminDashboardContent({ searchParams }: AdminDashboardPageProps) {
  const params = await searchParams;
  const period = typeof params.period === 'string' ? params.period : '30d';
  const organization = typeof params.organization === 'string' ? params.organization : 'all';

  const urlParams = new URLSearchParams();
  if (period !== '30d') urlParams.set('period', period);
  if (organization !== 'all') urlParams.set('organization', organization);

  const dashboardData = await getAdminDashboardData({ period, organization });

  return (
    <>
      {/* KPIs principaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Organisations</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.organizations.total}</div>
            <p className="text-xs text-muted-foreground">
              +{dashboardData.stats.organizations.newThisMonth} ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets ouverts</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.tickets.open}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.stats.tickets.overdue} dépassent le SLA
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets actifs</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.stats.projects.active}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.stats.projects.delayed} en retard
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus mensuels</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{dashboardData.stats.billing.monthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.stats.billing.pendingInvoices} factures en attente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertes et actions rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <span>Alertes importantes</span>
            </CardTitle>
            <CardDescription>
              Éléments nécessitant votre attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {dashboardData.alerts.map((alert) => (
              <div key={alert.id} className={`flex items-center justify-between p-3 rounded-lg ${
                alert.type === 'error' ? 'bg-red-50' :
                alert.type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'
              }`}>
                <div>
                  <p className="font-medium">{alert.title}</p>
                  <p className="text-sm text-gray-600">{alert.message}</p>
                </div>
                {alert.actionUrl && (
                  <Link href={alert.actionUrl}>
                    <Button size="sm" variant="outline">
                      {alert.actionLabel || 'Voir détails'}
                    </Button>
                  </Link>
                )}
              </div>
            ))}
            {dashboardData.alerts.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                Aucune alerte active
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions rapides</CardTitle>
            <CardDescription>
              Accès rapide aux tâches courantes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/orgs" className="block">
              <Button className="w-full justify-start" variant="outline">
                <Building className="mr-2 h-4 w-4" />
                Nouvelle organisation
              </Button>
            </Link>
            <Link href="/admin/billing" className="block">
              <Button className="w-full justify-start" variant="outline">
                <Receipt className="mr-2 h-4 w-4" />
                Créer une facture
              </Button>
            </Link>
            <Link href="/admin/projects" className="block">
              <Button className="w-full justify-start" variant="outline">
                <FolderOpen className="mr-2 h-4 w-4" />
                Nouveau projet
              </Button>
            </Link>
            <Link href="/admin/tickets" className="block">
              <Button className="w-full justify-start" variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Voir tous les tickets
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Activité récente */}
      <Card>
        <CardHeader>
          <CardTitle>Activité récente</CardTitle>
          <CardDescription>
            Dernières actions et mises à jour du système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                <div className="flex-shrink-0">
                  {activity.type === 'ticket' && <MessageSquare className="h-5 w-5 text-blue-500" />}
                  {activity.type === 'project' && <FolderOpen className="h-5 w-5 text-green-500" />}
                  {activity.type === 'organization' && <Building className="h-5 w-5 text-purple-500" />}
                  {activity.type === 'invoice' && <Receipt className="h-5 w-5 text-orange-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{activity.title}</p>
                  <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={activity.priority === 'high' ? 'destructive' :
                    activity.priority === 'medium' ? 'default' : 'secondary'}>
                    {activity.status}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export default async function AdminDashboardPage({ searchParams }: AdminDashboardPageProps) {
  const params = await searchParams;
  return (
    <div className="space-y-8">
      {/* Filtres */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="Tableau de bord administrateur"
          description="Vue d'ensemble de l'activité et des métriques clés"
        />

        <div className="flex items-center space-x-4">
          <Select defaultValue={typeof params.period === 'string' ? params.period : '30d'}>
            <SelectTrigger className="w-32">
              <CalendarDays className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue={typeof searchParams.organization === 'string' ? searchParams.organization : 'all'}>
            <SelectTrigger className="w-48">
              <Building className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Toutes les organisations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les organisations</SelectItem>
              {/* TODO: Charger dynamiquement les organisations */}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Suspense fallback={<div className="text-center py-8">Chargement...</div>}>
        <AdminDashboardContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
