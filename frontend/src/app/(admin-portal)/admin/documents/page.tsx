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
  FileText,
  Upload,
  Download,
  Eye,
  Share,
  Folder,
  File,
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Calendar,
  User,
  Building,
  Lock,
  Globe,
  Clock,
  Tag,
  Trash2
} from 'lucide-react';
import { DataTable } from '@/components/shared/DataTable';
import Link from 'next/link';

// Types pour les documents
interface Document {
  id: string;
  name: string;
  description?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  version: number;
  folderPath: string;
  organizationId: string;
  organizationName: string;
  projectId?: string;
  projectName?: string;
  uploadedBy: string;
  uploadedAt: string;
  lastModified: string;
  isShared: boolean;
  visibility: 'internal' | 'client';
  tags: string[];
  downloadCount: number;
  checksum: string;
}

interface DocumentFolder {
  id: string;
  name: string;
  path: string;
  organizationId: string;
  organizationName: string;
  documentCount: number;
  createdAt: string;
}

interface ShareLink {
  id: string;
  documentId: string;
  token: string;
  expiresAt?: string;
  downloadLimit?: number;
  downloadCount: number;
  createdAt: string;
  createdBy: string;
}

// Données mockées pour la démonstration
const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    name: 'Contrat de prestation - TechCorp',
    description: 'Contrat signé pour le développement de la plateforme e-commerce',
    fileName: 'contrat-techcorp-v2.pdf',
    fileSize: 2048576, // 2MB
    fileType: 'application/pdf',
    version: 2,
    folderPath: '/techcorp/contrats',
    organizationId: 'org-1',
    organizationName: 'TechCorp SA',
    projectId: 'proj-1',
    projectName: 'Plateforme E-commerce',
    uploadedBy: 'Alice Manager',
    uploadedAt: '2024-08-15T10:30:00Z',
    lastModified: '2024-08-15T10:30:00Z',
    isShared: true,
    visibility: 'client',
    tags: ['contrat', 'signé', 'e-commerce'],
    downloadCount: 3,
    checksum: 'abc123def456',
  },
  {
    id: 'doc-2',
    name: 'Cahier des charges - Application Mobile',
    description: 'Spécifications fonctionnelles et techniques de l\'application mobile',
    fileName: 'cdc-mobile-v1.docx',
    fileSize: 1048576, // 1MB
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    version: 1,
    folderPath: '/startupxyz/specifications',
    organizationId: 'org-2',
    organizationName: 'StartupXYZ',
    projectId: 'proj-2',
    projectName: 'Application Mobile',
    uploadedBy: 'Bob Developer',
    uploadedAt: '2024-07-20T14:15:00Z',
    lastModified: '2024-07-20T14:15:00Z',
    isShared: false,
    visibility: 'internal',
    tags: ['cahier-des-charges', 'mobile', 'specifications'],
    downloadCount: 0,
    checksum: 'def456ghi789',
  },
  {
    id: 'doc-3',
    name: 'PV de recette - Refonte Site Web',
    description: 'Procès-verbal de recette pour la refonte du site web Consulting Plus',
    fileName: 'pv-recette-consulting-v1.pdf',
    fileSize: 1536000, // 1.5MB
    fileType: 'application/pdf',
    version: 1,
    folderPath: '/consulting-plus/delivrables',
    organizationId: 'org-3',
    organizationName: 'Consulting Plus',
    projectId: 'proj-3',
    projectName: 'Refonte Site Web',
    uploadedBy: 'Charlie Designer',
    uploadedAt: '2024-09-01T09:45:00Z',
    lastModified: '2024-09-01T09:45:00Z',
    isShared: true,
    visibility: 'client',
    tags: ['pv-recette', 'validation', 'site-web'],
    downloadCount: 1,
    checksum: 'ghi789jkl012',
  },
];

const mockFolders: DocumentFolder[] = [
  {
    id: 'folder-1',
    name: 'TechCorp',
    path: '/techcorp',
    organizationId: 'org-1',
    organizationName: 'TechCorp SA',
    documentCount: 5,
    createdAt: '2024-07-01T00:00:00Z',
  },
  {
    id: 'folder-2',
    name: 'StartupXYZ',
    path: '/startupxyz',
    organizationId: 'org-2',
    organizationName: 'StartupXYZ',
    documentCount: 3,
    createdAt: '2024-08-01T00:00:00Z',
  },
  {
    id: 'folder-3',
    name: 'Consulting Plus',
    path: '/consulting-plus',
    organizationId: 'org-3',
    organizationName: 'Consulting Plus',
    documentCount: 2,
    createdAt: '2024-06-01T00:00:00Z',
  },
];

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('documents');
  const [searchTerm, setSearchTerm] = useState('');
  const [organizationFilter, setOrganizationFilter] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  useEffect(() => {
    // Simuler le chargement des données
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setDocuments(mockDocuments);
      setFolders(mockFolders);
      setLoading(false);
    };

    loadData();
  }, []);

  const getFileTypeIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (fileType.includes('word') || fileType.includes('document')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (fileType.includes('image')) return <FileText className="h-4 w-4 text-green-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const getVisibilityBadgeVariant = (visibility: string) => {
    return visibility === 'client' ? 'default' : 'secondary';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter(document => {
    const matchesSearch = document.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         document.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesOrganization = organizationFilter === 'all' || document.organizationId === organizationFilter;
    const matchesVisibility = visibilityFilter === 'all' || document.visibility === visibilityFilter;
    const matchesFolder = !selectedFolder || document.folderPath.startsWith(selectedFolder);

    return matchesSearch && matchesOrganization && matchesVisibility && matchesFolder;
  });

  const filteredFolders = folders.filter(folder => {
    const matchesSearch = folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         folder.organizationName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const documentsColumns = [
    {
      key: 'name',
      label: 'Document',
      render: (value: unknown, item: Record<string, unknown>) => (
        <div className="flex items-center space-x-3 max-w-xs">
          {getFileTypeIcon(String(item.fileType))}
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{String(value)}</div>
            <div className="text-sm text-gray-500 truncate">
              {String(item.fileName)} • v{String(item.version)}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'organizationName',
      label: 'Organisation',
      render: (value: unknown) => (
        <div className="flex items-center space-x-2">
          <Building className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{String(value)}</span>
        </div>
      ),
    },
    {
      key: 'visibility',
      label: 'Visibilité',
      render: (value: unknown, item: Record<string, unknown>) => (
        <div className="flex items-center space-x-2">
          {String(value) === 'client' ? (
            <Globe className="h-4 w-4 text-blue-500" />
          ) : (
            <Lock className="h-4 w-4 text-gray-500" />
          )}
          <Badge variant={getVisibilityBadgeVariant(String(value))}>
            {String(value) === 'client' ? 'Client' : 'Interne'}
          </Badge>
        </div>
      ),
    },
    {
      key: 'fileSize',
      label: 'Taille',
      render: (value: unknown) => (
        <span className="text-sm text-gray-500">
          {formatFileSize(Number(value))}
        </span>
      ),
    },
    {
      key: 'uploadedAt',
      label: 'Upload',
      render: (value: unknown) => (
        <div className="text-sm text-gray-500">
          <div>{new Date(String(value)).toLocaleDateString('fr-FR')}</div>
          <div className="text-xs">par {String((filteredDocuments.find(d => d.uploadedAt === value) as Document)?.uploadedBy || 'Utilisateur')}</div>
        </div>
      ),
    },
    {
      key: 'tags',
      label: 'Tags',
      render: (value: unknown) => {
        const tags = value as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {tags.slice(0, 2).map((tag: string) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 2}
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: unknown, item: Record<string, unknown>) => (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4" />
          </Button>
          {item.isShared && Boolean(item.isShared) && (
            <Button variant="ghost" size="sm">
              <Share className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const foldersColumns = [
    {
      key: 'name',
      label: 'Dossier',
      render: (value: unknown, item: Record<string, unknown>) => (
        <div className="flex items-center space-x-3">
          <Folder className="h-5 w-5 text-blue-500" />
          <div>
            <div className="font-medium">{String(value)}</div>
            <div className="text-sm text-gray-500">{String(item.path)}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'organizationName',
      label: 'Organisation',
      render: (value: unknown) => (
        <div className="flex items-center space-x-2">
          <Building className="h-4 w-4 text-gray-400" />
          <span className="text-sm">{String(value)}</span>
        </div>
      ),
    },
    {
      key: 'documentCount',
      label: 'Documents',
      render: (value: unknown) => (
        <span className="text-sm">{String(value)} documents</span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Créé le',
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedFolder(String(item.path))}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Upload className="h-4 w-4" />
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
          <p className="mt-2 text-gray-600">Chargement des documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion documentaire"
        description="Documents avec versioning et partage sélectif"
        actions={
          <div className="flex items-center space-x-2">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau dossier
            </Button>
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </Button>
          </div>
        }
      />

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{documents.length}</div>
            <p className="text-xs text-muted-foreground">
              Dans tous les dossiers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partagés clients</CardTitle>
            <Share className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.filter(d => d.visibility === 'client').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Accessibles aux clients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Téléchargements</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {documents.reduce((total, doc) => total + doc.downloadCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ce mois-ci
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Espace utilisé</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(documents.reduce((total, doc) => total + doc.fileSize, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              Sur {folders.length} dossiers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres et recherche</CardTitle>
          <CardDescription>
            Affinez la liste des documents selon vos critères
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, tags ou auteur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
              <SelectTrigger className="w-48">
                <Building className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Toutes les organisations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les organisations</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.organizationId} value={folder.organizationId}>
                    {folder.organizationName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Toute visibilité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toute visibilité</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="internal">Interne</SelectItem>
              </SelectContent>
            </Select>

            {selectedFolder && (
              <Button
                variant="outline"
                onClick={() => setSelectedFolder(null)}
              >
                Effacer le filtre dossier
              </Button>
            )}
          </div>

          {selectedFolder && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Dossier sélectionné :</strong> {selectedFolder}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="folders">Dossiers</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
              <CardDescription>
                Gestion complète des documents avec versioning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filteredDocuments as unknown as Record<string, unknown>[]}
                columns={documentsColumns}
                searchable={false}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="folders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dossiers ({filteredFolders.length})</CardTitle>
              <CardDescription>
                Organisation des documents par dossiers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable
                data={filteredFolders as unknown as Record<string, unknown>[]}
                columns={foldersColumns}
                searchable={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alertes */}
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          <strong>Versioning automatique :</strong> Toutes les modifications de documents créent automatiquement une nouvelle version.
          Les anciennes versions restent accessibles pour l'historique.
        </AlertDescription>
      </Alert>
    </div>
  );
}
