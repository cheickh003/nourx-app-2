'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  FolderOpen,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Upload,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building,
  Calendar,
  FileText,
  MoreHorizontal,
  Target
} from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import Link from 'next/link';

// Types pour les projets et livrables
interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  organizationName: string;
  organizationId: string;
  progress: number;
  startDate: string;
  endDate?: string;
  budget?: number;
  managerName: string;
  deliverablesCount: number;
  completedDeliverablesCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Deliverable {
  id: string;
  name: string;
  description: string;
  projectId: string;
  projectName: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  version: number;
  fileUrl?: string;
  fileSize?: number;
  uploadedAt: string;
  uploadedBy: string;
  dueDate?: string;
  visibility: 'client' | 'internal';
  comments?: string;
}

// Données mockées pour la démonstration
const mockProjects: Project[] = [
  {
    id: 'PROJ-001',
    name: 'Plateforme E-commerce TechCorp',
    description: 'Développement d\'une plateforme e-commerce complète avec gestion des stocks et paiements',
    status: 'in_progress',
    priority: 'high',
    organizationName: 'TechCorp SA',
    organizationId: 'org-1',
    progress: 65,
    startDate: '2024-07-01T00:00:00Z',
    endDate: '2024-12-31T00:00:00Z',
    budget: 75000,
    managerName: 'Alice Manager',
    deliverablesCount: 12,
    completedDeliverablesCount: 8,
    createdAt: '2024-06-15T00:00:00Z',
    updatedAt: '2024-09-04T00:00:00Z',
  },
  {
    id: 'PROJ-002',
    name: 'Application Mobile StartupXYZ',
    description: 'Application mobile iOS/Android pour gestion de tâches et collaboration',
    status: 'planning',
    priority: 'medium',
    organizationName: 'StartupXYZ',
    organizationId: 'org-2',
    progress: 15,
    startDate: '2024-10-01T00:00:00Z',
    endDate: '2025-03-31T00:00:00Z',
    budget: 45000,
    managerName: 'Bob Developer',
    deliverablesCount: 8,
    completedDeliverablesCount: 0,
    createdAt: '2024-08-20T00:00:00Z',
    updatedAt: '2024-09-02T00:00:00Z',
  },
  {
    id: 'PROJ-003',
    name: 'Refonte Site Web Consulting Plus',
    description: 'Refonte complète du site web corporate avec CMS intégré',
    status: 'on_hold',
    priority: 'low',
    organizationName: 'Consulting Plus',
    organizationId: 'org-3',
    progress: 30,
    startDate: '2024-08-15T00:00:00Z',
    endDate: '2024-11-30T00:00:00Z',
    budget: 25000,
    managerName: 'Charlie Designer',
    deliverablesCount: 6,
    completedDeliverablesCount: 2,
    createdAt: '2024-07-10T00:00:00Z',
    updatedAt: '2024-09-01T00:00:00Z',
  },
];

const mockDeliverables: Deliverable[] = [
  {
    id: 'DEL-001',
    name: 'Maquettes UI/UX',
    description: 'Ensemble des maquettes pour l\'interface utilisateur',
    projectId: 'PROJ-001',
    projectName: 'Plateforme E-commerce TechCorp',
    status: 'approved',
    version: 2,
    fileUrl: '/files/maquettes-v2.zip',
    fileSize: 15728640, // 15MB
    uploadedAt: '2024-09-03T10:30:00Z',
    uploadedBy: 'Alice Manager',
    dueDate: '2024-09-05T00:00:00Z',
    visibility: 'client',
  },
  {
    id: 'DEL-002',
    name: 'Documentation technique API',
    description: 'Documentation complète de l\'API REST',
    projectId: 'PROJ-001',
    projectName: 'Plateforme E-commerce TechCorp',
    status: 'in_review',
    version: 1,
    fileUrl: '/files/api-docs.pdf',
    fileSize: 2097152, // 2MB
    uploadedAt: '2024-09-04T14:15:00Z',
    uploadedBy: 'Bob Developer',
    dueDate: '2024-09-10T00:00:00Z',
    visibility: 'internal',
  },
];

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [organizationFilter, setOrganizationFilter] = useState('all');

  useEffect(() => {
    // Simuler le chargement des données
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setProjects(mockProjects);
      setDeliverables(mockDeliverables);
      setLoading(false);
    };

    loadData();
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'planning':
        return 'secondary';
      case 'in_progress':
        return 'default';
      case 'on_hold':
        return 'outline';
      case 'completed':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning':
        return 'Planification';
      case 'in_progress':
        return 'En cours';
      case 'on_hold':
        return 'En pause';
      case 'completed':
        return 'Terminé';
      case 'cancelled':
        return 'Annulé';
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

  const getDeliverableStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'in_review':
        return 'default';
      case 'approved':
        return 'outline';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getDeliverableStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'in_review':
        return 'En révision';
      case 'approved':
        return 'Approuvé';
      case 'rejected':
        return 'Rejeté';
      default:
        return status;
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.organizationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.managerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
    const matchesOrganization = organizationFilter === 'all' || project.organizationId === organizationFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesOrganization;
  });

  const filteredDeliverables = deliverables.filter(deliverable => {
    const matchesSearch = deliverable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deliverable.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         deliverable.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const projectsColumns = [
    {
      key: 'name',
      label: 'Projet',
      render: (value: unknown, item: Record<string, unknown>) => (
        <div className="max-w-xs">
          <div className="font-medium truncate">{String(value)}</div>
          <div className="text-sm text-gray-500 truncate">
            {String(item.organizationName)} • {String(item.managerName)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (value: unknown) => (
        <Badge variant={getStatusBadgeVariant(String(value))}>
          {getStatusLabel(String(value))}
        </Badge>
      ),
    },
    {
      key: 'priority',
      label: 'Priorité',
      render: (value: unknown) => (
        <Badge variant={getPriorityBadgeVariant(String(value))}>
          {String(value).toUpperCase()}
        </Badge>
      ),
    },
    {
      key: 'progress',
      label: 'Progression',
      render: (value: unknown) => (
        <div className="w-24">
          <Progress value={Number(value)} className="h-2" />
          <span className="text-xs text-gray-500 mt-1">{String(value)}%</span>
        </div>
      ),
    },
    {
      key: 'endDate',
      label: 'Échéance',
      render: (value: unknown) => (
        <span className="text-sm text-gray-500">
          {value ? new Date(String(value)).toLocaleDateString('fr-FR') : 'Non définie'}
        </span>
      ),
    },
    {
      key: 'deliverablesCount',
      label: 'Livrables',
      render: (value: unknown, item: Record<string, unknown>) => (
        <span className="text-sm">
          {String(item.completedDeliverablesCount)}/{String(value)}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: unknown, item: Record<string, unknown>) => (
        <div className="flex items-center space-x-2">
          <Link href={`/admin/projects/${String(item.id)}`}>
            <Button variant="ghost" size="sm" aria-label="Voir les détails du projet">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="ghost" size="sm" aria-label="Modifier le projet">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" aria-label="Plus d'options">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const deliverablesColumns = [
    {
      key: 'name',
      label: 'Livrable',
      render: (value: unknown, item: Record<string, unknown>) => (
        <div className="max-w-xs">
          <div className="font-medium truncate">{String(value)}</div>
          <div className="text-sm text-gray-500 truncate">
            {String(item.projectName)} • v{String(item.version)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (value: unknown) => (
        <Badge variant={getDeliverableStatusBadgeVariant(String(value))}>
          {getDeliverableStatusLabel(String(value))}
        </Badge>
      ),
    },
    {
      key: 'visibility',
      label: 'Visibilité',
      render: (value: unknown) => (
        <Badge variant={String(value) === 'client' ? 'default' : 'outline'}>
          {String(value) === 'client' ? 'Client' : 'Interne'}
        </Badge>
      ),
    },
    {
      key: 'uploadedBy',
      label: 'Uploadé par',
      render: (value: unknown) => (
        <span className="text-sm">{String(value)}</span>
      ),
    },
    {
      key: 'uploadedAt',
      label: 'Date',
      render: (value: unknown) => (
        <span className="text-sm text-gray-500">
          {new Date(String(value)).toLocaleDateString('fr-FR')}
        </span>
      ),
    },
    {
      key: 'fileSize',
      label: 'Taille',
      render: (value: unknown) => (
        <span className="text-sm text-gray-500">
          {value ? `${(Number(value) / 1024 / 1024).toFixed(1)} MB` : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: unknown, item: Record<string, unknown>) => (
        <div className="flex items-center space-x-2">
          {item.fileUrl && String(item.fileUrl) && (
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
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
          <p className="mt-2 text-gray-600">Chargement des projets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion des Projets"
        description="Supervision des projets et gestion des livrables"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau projet
          </Button>
        }
      />

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total projets</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              Projets actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En cours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.status === 'in_progress').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Progression moyenne: {Math.round(projects.reduce((acc, p) => acc + p.progress, 0) / projects.length)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livrables en attente</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {deliverables.filter(d => d.status === 'pending' || d.status === 'in_review').length}
            </div>
            <p className="text-xs text-muted-foreground">
              À approuver ou réviser
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projets en retard</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projects.filter(p => p.endDate && new Date(p.endDate) < new Date() && p.status !== 'completed').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Attention requise
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets et filtres */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="projects">Projets</TabsTrigger>
            <TabsTrigger value="deliverables">Livrables</TabsTrigger>
          </TabsList>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>

            {activeTab === 'projects' && (
              <>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tous statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous statuts</SelectItem>
                    <SelectItem value="planning">Planification</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="on_hold">En pause</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="cancelled">Annulé</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Priorité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">Élevé</SelectItem>
                    <SelectItem value="medium">Moyen</SelectItem>
                    <SelectItem value="low">Faible</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        <TabsContent value="projects" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Projets ({filteredProjects.length})</CardTitle>
              <CardDescription>
                Liste complète des projets avec leur statut et progression
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filteredProjects as unknown as Record<string, unknown>[]}
                columns={projectsColumns}
                searchable={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deliverables" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Livrables ({filteredDeliverables.length})</CardTitle>
              <CardDescription>
                Gestion des livrables et approbations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filteredDeliverables as unknown as Record<string, unknown>[]}
                columns={deliverablesColumns}
                searchable={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
