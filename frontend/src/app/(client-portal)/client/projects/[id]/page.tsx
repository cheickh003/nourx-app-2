'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
  FileText,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  User,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  Building
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getProject, getProjectMilestones, getProjectTasks, getProjectDeliverables, approveDeliverable } from '@/lib/api/projects';
import type { Project, Milestone, Task, Deliverable, ApproveDeliverableInput } from '@nourx/shared';

// Composant Progress manquant - création rapide
const ProgressComponent = ({ value, className }: { value: number; className?: string }) => (
  <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
    <div
      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${value}%` }}
    />
  </div>
);

interface ProjectDetailPageProps {
  params: { id: string };
}

export default function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const router = useRouter();
  const { id } = params;
  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'tasks' | 'deliverables'>('overview');
  const [selectedDeliverable, setSelectedDeliverable] = useState<Deliverable | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Charger les données du projet
  useEffect(() => {
    const loadProjectData = async () => {
      try {
        const [projectData, milestonesData, tasksData, deliverablesData] = await Promise.all([
          getProject(id),
          getProjectMilestones(id),
          getProjectTasks(id),
          getProjectDeliverables(id),
        ]);

        setProject(projectData);
        setMilestones(milestonesData);
        setTasks(tasksData);
        setDeliverables(deliverablesData);
      } catch (error) {
        console.error('Erreur lors du chargement du projet:', error);
        toast.error('Erreur lors du chargement du projet');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadProjectData();
    }
  }, [id]);

  const handleApproveDeliverable = async (deliverableId: string, approved: boolean, comment?: string) => {
    setIsSubmitting(true);
    try {
      await approveDeliverable(deliverableId, { approved, comment });
      toast.success(approved ? 'Livrable approuvé' : 'Demande de révision envoyée');

      // Recharger les livrables
      const updatedDeliverables = await getProjectDeliverables(id);
      setDeliverables(updatedDeliverables);

      setApproveDialogOpen(false);
      setSelectedDeliverable(null);
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error);
      toast.error('Erreur lors de l\'approbation du livrable');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'active':
        return <PlayCircle className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <PauseCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-green-100 text-green-800',
      active: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      draft: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };

    const labels = {
      completed: 'Terminé',
      active: 'Actif',
      pending: 'En attente',
      draft: 'Brouillon',
      cancelled: 'Annulé',
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.draft}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getDeliverableStatusBadge = (status: string) => {
    const variants = {
      pending: 'bg-yellow-100 text-yellow-800',
      delivered: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      revision_requested: 'bg-orange-100 text-orange-800',
    };

    const labels = {
      pending: 'En attente',
      delivered: 'Livré',
      approved: 'Approuvé',
      revision_requested: 'Révision demandée',
    };

    return (
      <Badge className={variants[status as keyof typeof variants] || variants.pending}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const calculateProgress = () => {
    if (milestones.length === 0) return 0;
    const completedMilestones = milestones.filter(m => m.status === 'completed').length;
    return Math.round((completedMilestones / milestones.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-8">
        <PageHeader
          title="Projet non trouvé"
          description="Le projet demandé n'existe pas ou vous n'y avez pas accès"
          actions={
            <Link href="/client/projects">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour aux projets
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={project.name}
        description={project.description || 'Aucune description'}
        actions={
          <div className="flex items-center space-x-2">
            <Link href="/client/projects">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
          </div>
        }
      />

      {/* Informations principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(project.status)}
                  <div>
                    <CardTitle className="text-xl">{project.name}</CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  {getStatusBadge(project.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Date de début</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {project.startDate
                      ? format(new Date(project.startDate), 'PPP', { locale: fr })
                      : 'Non définie'
                    }
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Date de fin</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {project.endDate
                      ? format(new Date(project.endDate), 'PPP', { locale: fr })
                      : 'Non définie'
                    }
                  </p>
                </div>
              </div>

              {/* Barre de progression */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progression</span>
                  <span className="text-sm text-gray-600">{calculateProgress()}%</span>
                </div>
                <ProgressComponent value={calculateProgress()} />
                <p className="text-xs text-gray-500">
                  {milestones.filter(m => m.status === 'completed').length} / {milestones.length} jalons terminés
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Jalons</span>
                <span className="font-medium">{milestones.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tâches</span>
                <span className="font-medium">{tasks.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Livrables</span>
                <span className="font-medium">{deliverables.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Onglets détaillés */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="milestones">Jalons</TabsTrigger>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="deliverables">Livrables</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Jalons récents */}
            <Card>
              <CardHeader>
                <CardTitle>Jalons récents</CardTitle>
                <CardDescription>
                  État des jalons du projet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {milestones.slice(0, 5).map((milestone) => (
                    <div key={milestone.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(milestone.status)}
                        <div>
                          <p className="font-medium">{milestone.name}</p>
                          <p className="text-sm text-gray-600">
                            {milestone.dueDate
                              ? format(new Date(milestone.dueDate), 'dd/MM/yyyy', { locale: fr })
                              : 'Sans échéance'
                            }
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(milestone.status)}
                    </div>
                  ))}
                  {milestones.length === 0 && (
                    <p className="text-center py-4 text-gray-500">Aucun jalon défini</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Livrables récents */}
            <Card>
              <CardHeader>
                <CardTitle>Livrables récents</CardTitle>
                <CardDescription>
                  État des livrables du projet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deliverables.slice(0, 5).map((deliverable) => (
                    <div key={deliverable.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">{deliverable.name}</p>
                          <p className="text-sm text-gray-600">
                            Version {deliverable.version}
                          </p>
                        </div>
                      </div>
                      {getDeliverableStatusBadge(deliverable.status)}
                    </div>
                  ))}
                  {deliverables.length === 0 && (
                    <p className="text-center py-4 text-gray-500">Aucun livrable</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="milestones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Jalons du projet</CardTitle>
              <CardDescription>
                Liste complète des jalons et leur avancement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {milestones.map((milestone) => (
                  <div key={milestone.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(milestone.status)}
                        <h3 className="font-medium">{milestone.name}</h3>
                      </div>
                      {getStatusBadge(milestone.status)}
                    </div>

                    {milestone.description && (
                      <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
                    )}

                    {milestone.dueDate && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Échéance: {format(new Date(milestone.dueDate), 'PPP', { locale: fr })}</span>
                      </div>
                    )}
                  </div>
                ))}
                {milestones.length === 0 && (
                  <p className="text-center py-8 text-gray-500">Aucun jalon défini pour ce projet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tâches du projet</CardTitle>
              <CardDescription>
                Tâches visibles au client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.filter(task => task.visibleToClient).map((task) => (
                  <div key={task.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(task.status)}
                        <h3 className="font-medium">{task.name}</h3>
                      </div>
                      {getStatusBadge(task.status)}
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                    )}

                    {task.dueDate && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>Échéance: {format(new Date(task.dueDate), 'PPP', { locale: fr })}</span>
                      </div>
                    )}
                  </div>
                ))}
                {tasks.filter(task => task.visibleToClient).length === 0 && (
                  <p className="text-center py-8 text-gray-500">Aucune tâche visible</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliverables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Livrables du projet</CardTitle>
              <CardDescription>
                Documents et livrables partagés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deliverables.map((deliverable) => (
                  <div key={deliverable.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-gray-500" />
                        <div>
                          <h3 className="font-medium">{deliverable.name}</h3>
                          <p className="text-sm text-gray-600">
                            Version {deliverable.version} • {(deliverable.fileSize / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      {getDeliverableStatusBadge(deliverable.status)}
                    </div>

                    {deliverable.description && (
                      <p className="text-sm text-gray-600 mb-3">{deliverable.description}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Livré le {format(new Date(deliverable.createdAt), 'PPP', { locale: fr })}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Télécharger
                        </Button>

                        {(deliverable.status === 'delivered' || deliverable.status === 'revision_requested') && (
                          <Dialog open={approveDialogOpen && selectedDeliverable?.id === deliverable.id} onOpenChange={(open) => {
                            setApproveDialogOpen(open);
                            if (!open) setSelectedDeliverable(null);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedDeliverable(deliverable)}
                              >
                                <ThumbsUp className="h-4 w-4 mr-1" />
                                Approuver
                              </Button>
                            </DialogTrigger>
                            <ApproveDeliverableDialog
                              deliverable={selectedDeliverable}
                              onSubmit={(approved, comment) => handleApproveDeliverable(deliverable.id, approved, comment)}
                              isSubmitting={isSubmitting}
                            />
                          </Dialog>
                        )}

                        {deliverable.approvalComment && (
                          <div className="text-sm text-gray-600">
                            <MessageSquare className="h-4 w-4 inline mr-1" />
                            Commentaire disponible
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {deliverables.length === 0 && (
                  <p className="text-center py-8 text-gray-500">Aucun livrable disponible</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Composant pour le dialogue d'approbation de livrable
function ApproveDeliverableDialog({ deliverable, onSubmit, isSubmitting }: {
  deliverable: Deliverable | null;
  onSubmit: (approved: boolean, comment?: string) => void;
  isSubmitting: boolean;
}) {
  const [approved, setApproved] = useState(true);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(approved, comment);
  };

  if (!deliverable) return null;

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Évaluer le livrable</DialogTitle>
        <DialogDescription>
          Approuvez ou demandez une révision pour "{deliverable.name}"
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-4 py-4">
          <div className="space-y-3">
            <Label>Évaluation</Label>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="approve"
                  name="evaluation"
                  checked={approved}
                  onChange={() => setApproved(true)}
                />
                <Label htmlFor="approve" className="flex items-center space-x-2">
                  <ThumbsUp className="h-4 w-4 text-green-500" />
                  <span>Approuver</span>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="revise"
                  name="evaluation"
                  checked={!approved}
                  onChange={() => setApproved(false)}
                />
                <Label htmlFor="revise" className="flex items-center space-x-2">
                  <ThumbsDown className="h-4 w-4 text-orange-500" />
                  <span>Demander révision</span>
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">
              Commentaire {!approved && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id="comment"
              placeholder="Ajoutez un commentaire..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required={!approved}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Envoi en cours...' : approved ? 'Approuver' : 'Demander révision'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
