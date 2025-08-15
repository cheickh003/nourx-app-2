'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClientLayout } from '@/components/layout/client-layout'
import { 
  CheckSquare,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  MessageSquare,
  Filter,
  MoreHorizontal
} from 'lucide-react'
import { useTasks, useTasksKanban } from '@/hooks/use-client-api'

function TaskCard({ task }: { task: any }) {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive'
      case 'high': return 'warning'
      case 'normal': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgent'
      case 'high': return 'Élevée'
      case 'normal': return 'Normale'
      case 'low': return 'Faible'
      default: return priority
    }
  }

  const isOverdue = task.due_date && new Date(task.due_date) < new Date()

  return (
    <Card className="mb-3 hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium line-clamp-2">{task.title}</h3>
              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {task.description}
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" className="ml-2">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Priority and Status */}
          <div className="flex items-center gap-2">
            <Badge variant={getPriorityColor(task.priority)}>
              {getPriorityLabel(task.priority)}
            </Badge>
            {isOverdue && (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                En retard
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="space-y-2">
            {task.due_date && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                <span>
                  Échéance: {new Date(task.due_date).toLocaleDateString('fr-FR')}
                </span>
              </div>
            )}
            
            {task.assigned_to && (
              <div className="flex items-center text-sm text-muted-foreground">
                <User className="h-4 w-4 mr-2" />
                <span>
                  {task.assigned_to.first_name} {task.assigned_to.last_name}
                </span>
              </div>
            )}

            {task.comments_count > 0 && (
              <div className="flex items-center text-sm text-muted-foreground">
                <MessageSquare className="h-4 w-4 mr-2" />
                <span>{task.comments_count} commentaire{task.comments_count > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>

          {/* Project */}
          {task.project && (
            <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
              Projet: {task.project.title}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function KanbanColumn({ title, tasks, count }: { title: string; tasks: any[]; count: number }) {
  return (
    <div className="flex-1 min-w-0">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{title}</CardTitle>
            <Badge variant="secondary">{count}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {tasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckSquare className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Aucune tâche</p>
              </div>
            ) : (
              tasks.map((task) => <TaskCard key={task.id} task={task} />)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TasksKanban() {
  const { data: kanbanData, loading, error } = useTasksKanban()

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex-1 min-w-0">
            <Card>
              <CardHeader className="pb-3">
                <div className="h-6 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-destructive">Erreur lors du chargement du kanban: {error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!kanbanData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckSquare className="mx-auto h-12 w-12 mb-4 opacity-50 text-muted-foreground" />
          <p className="text-muted-foreground">Aucune tâche à afficher</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Object.entries(kanbanData).map(([status, columnData]: [string, any]) => (
        <KanbanColumn 
          key={status}
          title={columnData.label} 
          tasks={columnData.tasks || []} 
          count={columnData.tasks?.length || 0}
        />
      ))}
    </div>
  )
}

function TasksList({ tasks }: { tasks: any[] }) {
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
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckSquare className="mx-auto h-12 w-12 mb-4 opacity-50 text-muted-foreground" />
            <p className="text-muted-foreground">Aucune tâche à afficher</p>
          </CardContent>
        </Card>
      ) : (
        tasks.map((task) => {
          const isOverdue = task.due_date && new Date(task.due_date) < new Date()
          
          return (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{task.title}</h3>
                    {task.description && (
                      <p className="text-muted-foreground">{task.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant={getStatusColor(task.status)}>
                      {getStatusLabel(task.status)}
                    </Badge>
                    {isOverdue && (
                      <Badge variant="destructive">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        En retard
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="flex items-center text-sm">
                    <Badge variant="outline" className="mr-2">
                      {task.priority === 'urgent' ? 'Urgent' :
                       task.priority === 'high' ? 'Élevée' :
                       task.priority === 'normal' ? 'Normale' : 'Faible'}
                    </Badge>
                  </div>

                  {task.due_date && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        {new Date(task.due_date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}

                  {task.assigned_to && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="h-4 w-4 mr-2" />
                      <span>
                        {task.assigned_to.first_name} {task.assigned_to.last_name}
                      </span>
                    </div>
                  )}

                  {task.comments_count > 0 && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      <span>{task.comments_count} commentaire{task.comments_count > 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>

                {task.project && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    <span className="font-medium">Projet:</span> {task.project.title}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}

export default function TasksPage() {
  const { data: tasks, loading, error } = useTasks()

  if (loading) {
    return (
      <ClientLayout title="Mes Tâches">
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-6 bg-muted animate-pulse rounded" />
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
      <ClientLayout title="Mes Tâches">
        <div className="p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-destructive">Erreur lors du chargement des tâches: {error}</p>
            </CardContent>
          </Card>
        </div>
      </ClientLayout>
    )
  }

  const pendingTasks = tasks?.filter(t => t.status !== 'done' && t.status !== 'cancelled') || []
  const completedTasks = tasks?.filter(t => t.status === 'done') || []
  const overdueTasks = tasks?.filter(t => 
    t.due_date && new Date(t.due_date) < new Date() && 
    (t.status === 'todo' || t.status === 'in_progress')
  ) || []

  return (
    <ClientLayout title="Mes Tâches">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Mes Tâches</h1>
          <p className="text-muted-foreground">
            Gérez et suivez l'avancement de toutes vos tâches
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">{pendingTasks.length}</div>
              <p className="text-sm text-muted-foreground">Tâches en cours</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{overdueTasks.length}</div>
              <p className="text-sm text-muted-foreground">Tâches en retard</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
              <p className="text-sm text-muted-foreground">Tâches terminées</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{tasks?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Total tâches</p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        {overdueTasks.length > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">
                  Vous avez {overdueTasks.length} tâche{overdueTasks.length > 1 ? 's' : ''} en retard qui nécessite{overdueTasks.length > 1 ? 'nt' : ''} votre attention.
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tasks Views */}
        <Tabs defaultValue="kanban" className="w-full">
          <TabsList>
            <TabsTrigger value="kanban">Vue Kanban</TabsTrigger>
            <TabsTrigger value="list">Vue Liste</TabsTrigger>
          </TabsList>

          <TabsContent value="kanban" className="mt-6">
            <TasksKanban />
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <TasksList tasks={tasks || []} />
          </TabsContent>
        </Tabs>
      </div>
    </ClientLayout>
  )
}
