'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClientLayout } from '@/components/layout/client-layout'
import { 
  Calendar, 
  Users, 
  Euro,
  ArrowRight,
  Clock
} from 'lucide-react'
import { useProjects } from '@/hooks/use-client-api'
import Link from 'next/link'

function ProjectCard({ project }: { project: any }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default'
      case 'completed': return 'success'
      case 'on_hold': return 'warning'
      case 'cancelled': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Actif'
      case 'completed': return 'Terminé'
      case 'on_hold': return 'En pause'
      case 'cancelled': return 'Annulé'
      case 'draft': return 'Brouillon'
      default: return status
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="line-clamp-1">{project.title}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {project.description}
            </CardDescription>
          </div>
          <Badge variant={getStatusColor(project.status)}>
            {getStatusLabel(project.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {project.start_date && (
              <div className="flex items-center text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Début: {new Date(project.start_date).toLocaleDateString('fr-FR')}</span>
              </div>
            )}
            
            {project.end_date && (
              <div className="flex items-center text-muted-foreground">
                <Clock className="h-4 w-4 mr-2" />
                <span>Fin: {new Date(project.end_date).toLocaleDateString('fr-FR')}</span>
              </div>
            )}
            
            {project.team_members && project.team_members.length > 0 && (
              <div className="flex items-center text-muted-foreground">
                <Users className="h-4 w-4 mr-2" />
                <span>{project.team_members.length} membre{project.team_members.length > 1 ? 's' : ''}</span>
              </div>
            )}
            
            {project.budget && (
              <div className="flex items-center text-muted-foreground">
                <Euro className="h-4 w-4 mr-2" />
                <span>{project.budget.toLocaleString('fr-FR')} {project.currency || 'EUR'}</span>
              </div>
            )}
          </div>

          {/* Next Milestone */}
          {project.next_milestone && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium">Prochaine échéance</div>
              <div className="text-sm text-muted-foreground">
                {project.next_milestone.title} - {new Date(project.next_milestone.due_date).toLocaleDateString('fr-FR')}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground">
              Mis à jour le {new Date(project.updated_at).toLocaleDateString('fr-FR')}
            </div>
            <Link href={`/projets/${project.id}`}>
              <Button variant="outline" size="sm">
                Voir détails
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ProjectsPage() {
  const { data: projects, loading, error } = useProjects()

  if (loading) {
    return (
      <ClientLayout title="Mes Projets">
        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-muted animate-pulse rounded" />
                  <div className="h-4 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-muted animate-pulse rounded" />
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
      <ClientLayout title="Mes Projets">
        <div className="p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-destructive">Erreur lors du chargement des projets: {error}</p>
            </CardContent>
          </Card>
        </div>
      </ClientLayout>
    )
  }

  const activeProjects = projects?.filter(p => p.status === 'active') || []
  const completedProjects = projects?.filter(p => p.status === 'completed') || []
  const otherProjects = projects?.filter(p => !['active', 'completed'].includes(p.status)) || []

  return (
    <ClientLayout title="Mes Projets">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Mes Projets</h1>
          <p className="text-muted-foreground">
            Gérez et suivez l'avancement de tous vos projets NOURX
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{activeProjects.length}</div>
              <p className="text-sm text-muted-foreground">Projets actifs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{completedProjects.length}</div>
              <p className="text-sm text-muted-foreground">Projets terminés</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{otherProjects.length}</div>
              <p className="text-sm text-muted-foreground">Autres projets</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{projects?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Total projets</p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Tabs */}
        <Tabs defaultValue="active" className="w-full">
          <TabsList>
            <TabsTrigger value="active">
              Actifs ({activeProjects.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Terminés ({completedProjects.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              Tous ({projects?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-6">
            {activeProjects.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-muted-foreground">
                    <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Aucun projet actif pour le moment</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {activeProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            {completedProjects.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-muted-foreground">
                    <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Aucun projet terminé</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {completedProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="mt-6">
            {!projects || projects.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-muted-foreground">
                    <Calendar className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Aucun projet disponible</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  )
}
