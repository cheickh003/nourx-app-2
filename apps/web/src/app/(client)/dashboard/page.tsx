'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ClientLayout } from '@/components/layout/client-layout'
import { 
  FolderOpen, 
  CheckSquare, 
  FileText, 
  Clock,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Euro
} from 'lucide-react'
import { useProjects, useInvoices } from '@/hooks/use-client-api'
import Link from 'next/link'

function DashboardStats() {
  const { data: projects, loading: projectsLoading } = useProjects()
  const { data: invoices, loading: invoicesLoading } = useInvoices()

  if (projectsLoading || invoicesLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const activeProjects = projects?.filter(p => p.status === 'active').length || 0
  const dueInvoices = invoices?.filter(i => i.status === 'sent' || i.is_overdue).length || 0
  const overdueInvoices = invoices?.filter(i => i.is_overdue).length || 0

  const stats = [
    {
      title: 'Projets Actifs',
      value: activeProjects,
      icon: FolderOpen,
      href: '/projets',
      color: 'text-blue-600'
    },
    {
      title: 'Factures à payer',
      value: dueInvoices,
      icon: FileText,
      href: '/factures',
      color: 'text-orange-600'
    },
    {
      title: 'Factures en retard',
      value: overdueInvoices,
      icon: AlertTriangle,
      href: '/factures',
      color: 'text-red-600'
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

function ProjectsOverview() {
  const { data: projects, loading } = useProjects()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mes Projets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const activeProjects = projects?.filter(p => p.status === 'active').slice(0, 3) || []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Mes Projets</CardTitle>
          <CardDescription>Aperçu de vos projets en cours</CardDescription>
        </div>
        <Link href="/projets">
          <Button variant="outline" size="sm">
            Voir tout
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {activeProjects.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Aucun projet actif pour le moment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeProjects.map((project) => (
              <div key={project.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-medium">{project.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  </div>
                  <Badge 
                    variant={project.status === 'active' ? 'default' : 'secondary'}
                  >
                    {project.status === 'active' ? 'Actif' : project.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progression</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
                {project.next_milestone && (
                  <div className="flex items-center mt-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    Prochaine échéance: {new Date(project.next_milestone.due_date).toLocaleDateString('fr-FR')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function PendingInvoices() {
  const { data: invoices, loading } = useInvoices()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Factures en Attente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-20 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  const pendingInvoices = invoices?.filter(i => i.status === 'sent' || i.is_overdue).slice(0, 2) || []

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Factures en Attente</CardTitle>
          <CardDescription>Factures nécessitant votre attention</CardDescription>
        </div>
        <Link href="/factures">
          <Button variant="outline" size="sm">
            Voir tout
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {pendingInvoices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Aucune facture en attente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingInvoices.map((invoice) => {
              const isOverdue = new Date(invoice.due_date) < new Date()
              
              return (
                <div key={invoice.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium">{invoice.invoice_number}</h3>
                      <p className="text-sm text-muted-foreground">
                        {invoice.title}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium flex items-center">
                        <Euro className="h-4 w-4 mr-1" />
                        {invoice.total_ttc.toLocaleString('fr-FR')}
                      </p>
                      <Badge variant={isOverdue ? 'destructive' : 'warning'}>
                        {isOverdue ? 'En retard' : 'À payer'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 mr-1" />
                      Échéance: {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
                    </div>
                    <Link href={`/factures/${invoice.id}`}>
                      <Button size="sm">
                        Payer maintenant
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RecentActivity() {
  const activities = [
    {
      id: 1,
      type: 'task' as const,
      title: 'Tâche "Révision du design" marquée comme terminée',
      description: 'Projet: Refonte site web',
      date: '2024-01-15T10:30:00Z',
      related_id: 1
    },
    {
      id: 2,
      type: 'document' as const,
      title: 'Nouveau document partagé',
      description: 'Cahier des charges v2.0.pdf',
      date: '2024-01-15T09:15:00Z',
      related_id: 2
    },
    {
      id: 3,
      type: 'project' as const,
      title: 'Projet mis à jour',
      description: 'Application mobile - Phase 2 démarrée',
      date: '2024-01-14T16:45:00Z',
      related_id: 3
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité Récente</CardTitle>
        <CardDescription>Dernières mises à jour sur vos projets</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 pb-4 border-b last:border-b-0">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{activity.title}</p>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(activity.date).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  return (
    <ClientLayout title="Dashboard">
      <div className="p-6 space-y-6">
        {/* Welcome Message */}
        <div>
          <h1 className="text-2xl font-bold">Bonjour et bienvenue sur votre espace NOURX</h1>
          <p className="text-muted-foreground">
            Suivez l'avancement de vos projets et gérez vos factures en toute simplicité.
          </p>
        </div>

        {/* Stats Overview */}
        <DashboardStats />

        {/* Alerts (optionnel) */}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <ProjectsOverview />
            <PendingInvoices />
          </div>
          <div className="space-y-6">
            <RecentActivity />
            <RecentPayments />
          </div>
        </div>
      </div>
    </ClientLayout>
  )
}

// Add near bottom: simple recent payments card (optional)
function RecentPayments() {
  // Dynamic import of hook to avoid breaking older builds
  try {
    // @ts-ignore
    const { usePayments } = require('@/hooks/use-client-api')
    const { data: payments } = usePayments()
    const items = (payments || []).slice(0, 5)
    if (!items.length) return null
    const { Card, CardHeader, CardTitle, CardContent } = require('@/components/ui/card')
    return (
      <Card>
        <CardHeader>
          <CardTitle>Paiements récents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((p: any) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span>{new Date(p.created_at).toLocaleDateString('fr-FR')} — {p.cinetpay_transaction_id?.slice(0,8)}</span>
                <span className="font-medium">{p.amount} {p.currency}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  } catch {
    return null
  }
}
