'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClientLayout } from '@/components/layout/client-layout'
import { 
  MessageCircle,
  Plus,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar
} from 'lucide-react'
import { useSupportTickets } from '@/hooks/use-client-api'
import Link from 'next/link'

function TicketCard({ ticket }: { ticket: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'destructive'
      case 'in_progress': return 'warning'
      case 'waiting_client': return 'info'
      case 'resolved': return 'success'
      case 'closed': return 'secondary'
      default: return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Ouvert'
      case 'in_progress': return 'En cours'
      case 'waiting_client': return 'En attente de votre réponse'
      case 'resolved': return 'Résolu'
      case 'closed': return 'Fermé'
      default: return status
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'warning'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgent'
      case 'high': return 'Élevée'
      case 'medium': return 'Normale'
      case 'low': return 'Faible'
      default: return priority
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-1">{ticket.subject}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {ticket.description}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 ml-4">
            <Badge variant={getStatusColor(ticket.status)}>
              {getStatusLabel(ticket.status)}
            </Badge>
            <Badge variant={getPriorityColor(ticket.priority)} className="self-end">
              {getPriorityLabel(ticket.priority)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Details */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              Créé le {new Date(ticket.created_at).toLocaleDateString('fr-FR')}
            </div>
            {ticket.messages_count > 0 && (
              <div className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-1" />
                {ticket.messages_count} message{ticket.messages_count > 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Project */}
          {ticket.project && (
            <div className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
              Projet: {ticket.project.title}
            </div>
          )}

          {/* Assigned to */}
          {ticket.assigned_to && (
            <div className="text-sm text-muted-foreground">
              Assigné à: {ticket.assigned_to.first_name} {ticket.assigned_to.last_name}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-2">
            <div className="text-xs text-muted-foreground">
              Mis à jour le {new Date(ticket.updated_at).toLocaleDateString('fr-FR')}
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/support/${ticket.id}`}>
                Voir détails
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SupportPage() {
  const { data: tickets, loading, error } = useSupportTickets()

  if (loading) {
    return (
      <ClientLayout title="Support">
        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-24 bg-muted animate-pulse rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ClientLayout>
    )
  }

  if (error) {
    return (
      <ClientLayout title="Support">
        <div className="p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-destructive">Erreur lors du chargement des tickets: {error}</p>
            </CardContent>
          </Card>
        </div>
      </ClientLayout>
    )
  }

  const openTickets = tickets?.filter(t => ['open', 'in_progress', 'waiting_client'].includes(t.status)) || []
  const resolvedTickets = tickets?.filter(t => ['resolved', 'closed'].includes(t.status)) || []
  const urgentTickets = tickets?.filter(t => t.priority === 'urgent' && !['resolved', 'closed'].includes(t.status)) || []

  return (
    <ClientLayout title="Support">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Support & Réclamations</h1>
            <p className="text-muted-foreground">
              Obtenez de l'aide pour vos projets et signalez des problèmes
            </p>
          </div>
          <Button asChild>
            <Link href="/support/nouveau">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau ticket
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-600">{openTickets.length}</div>
                  <p className="text-sm text-muted-foreground">Tickets ouverts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold text-red-600">{urgentTickets.length}</div>
                  <p className="text-sm text-muted-foreground">Tickets urgents</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">{resolvedTickets.length}</div>
                  <p className="text-sm text-muted-foreground">Tickets résolus</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold text-primary">{tickets?.length || 0}</div>
                  <p className="text-sm text-muted-foreground">Total tickets</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Urgent Tickets Alert */}
        {urgentTickets.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">
                  Vous avez {urgentTickets.length} ticket{urgentTickets.length > 1 ? 's' : ''} urgent{urgentTickets.length > 1 ? 's' : ''} en attente de traitement.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tickets List */}
        {!tickets || tickets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="mx-auto h-12 w-12 mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Aucun ticket de support</h3>
              <p className="text-muted-foreground mb-4">
                Vous n'avez pas encore créé de ticket de support.
              </p>
              <Button asChild>
                <Link href="/support/nouveau">
                  <Plus className="h-4 w-4 mr-2" />
                  Créer votre premier ticket
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Open Tickets */}
            {openTickets.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Tickets ouverts ({openTickets.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {openTickets.map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
                </div>
              </div>
            )}

            {/* Resolved Tickets */}
            {resolvedTickets.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Tickets résolus ({resolvedTickets.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {resolvedTickets.slice(0, 4).map((ticket) => (
                    <TicketCard key={ticket.id} ticket={ticket} />
                  ))}
                </div>
                {resolvedTickets.length > 4 && (
                  <div className="mt-4 text-center">
                    <Button variant="outline">
                      Voir tous les tickets résolus ({resolvedTickets.length})
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </ClientLayout>
  )
}
