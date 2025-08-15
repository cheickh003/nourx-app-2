'use client'

import { use } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ClientLayout } from '@/components/layout/client-layout'
import { 
  Calendar, 
  Users, 
  Euro,
  FileText,
  CheckSquare,
  Clock,
  ArrowLeft,
  MapPin
} from 'lucide-react'
import { useProject, useTasks, useDocuments } from '@/hooks/use-client-api'
import Link from 'next/link'

interface ProjectDetailProps {
  params: Promise<{ id: string }>
}

function ProjectHeader({ project }: { project: any }) {
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
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link href="/projets">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux projets
          </Button>
        </Link>
        <Badge variant={getStatusColor(project.status)}>
          {getStatusLabel(project.status)}
        </Badge>
      </div>

      <div>
        <h1 className="text-3xl font-bold">{project.title}</h1>
        <p className="text-muted-foreground mt-2">{project.description}</p>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">Progression du projet</span>
              <span className="text-2xl font-bold text-primary">{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-4" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ProjectInfo({ project }: { project: any }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations du Projet</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            {project.start_date && (
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date de début</p>
                  <p className="font-medium">
                    {new Date(project.start_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            )}

            {project.end_date && (
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-3 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Date de fin prévue</p>
                  <p className="font-medium">
                    {new Date(project.end_date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {project.team_members && project.team_members.length > 0 && (
              <div className="flex items-start">
                <Users className="h-5 w-5 mr-3 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Équipe NOURX</p>
                  <div className="space-y-1">
                    {project.team_members.map((member: any) => (
                      <p key={member.id} className="font-medium">
                        {member.first_name} {member.last_name}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {project.budget && (
              <div className="flex items-center">
                <Euro className="h-5 w-5 mr-3 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Budget</p>
                  <p className="font-medium">
                    {project.budget.toLocaleString('fr-FR')} {project.currency || 'EUR'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProjectTasks({ projectId }: { projectId: number }) {
  const { data: tasks, loading } = useTasks(projectId)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tâches du Projet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const pendingTasks = tasks?.filter(t => t.status !== 'done') || []
  const completedTasks = tasks?.filter(t => t.status === 'done') || []

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'secondary'
      case 'in_progress': return 'warning'
      case 'review': return 'info'
      case 'done': return 'success'
      case 'cancelled': return 'destructive'
      default: return 'secondary'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'todo': return 'À faire'
      case 'in_progress': return 'En cours'
      case 'review': return 'En révision'
      case 'done': return 'Terminé'
      case 'cancelled': return 'Annulé'
      default: return status
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Tâches du Projet</CardTitle>
          <CardDescription>
            {pendingTasks.length} en cours • {completedTasks.length} terminée{completedTasks.length > 1 ? 's' : ''}
          </CardDescription>
        </div>
        <Link href="/taches">
          <Button variant="outline" size="sm">
            Voir toutes les tâches
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {!tasks || tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Aucune tâche assignée pour ce projet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                  </div>
                  <Badge variant={getStatusColor(task.status)}>
                    {getStatusLabel(task.status)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {task.priority && (
                    <span className="capitalize">Priorité: {task.priority}</span>
                  )}
                  {task.due_date && (
                    <span>
                      Échéance: {new Date(task.due_date).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                  {task.assigned_to && (
                    <span>
                      Assigné à: {task.assigned_to.first_name} {task.assigned_to.last_name}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ProjectDocuments({ projectId }: { projectId: number }) {
  const { data: documents, loading } = useDocuments(projectId)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            Fichiers partagés pour ce projet
          </CardDescription>
        </div>
        <Link href="/documents">
          <Button variant="outline" size="sm">
            Voir tous les documents
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {!documents || documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Aucun document partagé pour ce projet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.slice(0, 5).map((document) => (
              <div key={document.id} className="flex items-center justify-between border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{document.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {document.size ? `${(document.size / 1024 / 1024).toFixed(1)} MB` : ''} • 
                      {new Date(document.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                {document.download_url && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={document.download_url} target="_blank" rel="noopener noreferrer">
                      Télécharger
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function ProjectDetailPage({ params }: ProjectDetailProps) {
  const { id } = use(params)
  const projectId = parseInt(id)
  
  const { data: project, loading, error } = useProject(projectId)

  if (loading) {
    return (
      <ClientLayout title="Chargement...">
        <div className="p-6 space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-32 bg-muted animate-pulse rounded" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-64 bg-muted animate-pulse rounded" />
            <div className="h-64 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </ClientLayout>
    )
  }

  if (error || !project) {
    return (
      <ClientLayout title="Erreur">
        <div className="p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-destructive">
                {error || 'Projet non trouvé'}
              </p>
              <Link href="/projets" className="mt-4 inline-block">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour aux projets
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </ClientLayout>
    )
  }

  return (
    <ClientLayout title={project.title}>
      <div className="p-6 space-y-6">
        <ProjectHeader project={project} />
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList>
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="tasks">Tâches</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <ProjectInfo project={project} />
            
            <div className="grid gap-6 lg:grid-cols-2">
              <ProjectTasks projectId={projectId} />
              <ProjectDocuments projectId={projectId} />
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            <ProjectTasks projectId={projectId} />
          </TabsContent>

          <TabsContent value="documents" className="mt-6">
            <ProjectDocuments projectId={projectId} />
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  )
}
