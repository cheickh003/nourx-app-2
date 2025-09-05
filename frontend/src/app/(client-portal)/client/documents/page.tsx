'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/shared/DataTable';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  FileText,
  Download,
  Search,
  File,
  Filter,
  RefreshCw,
  Eye,
  Clock,
  Building,
  Calendar,
  HardDrive,
  FileImage,
  FileSpreadsheet,
  FileVideo,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import useSWR from 'swr';
import { getDocuments, getDocumentStats, downloadDocument, type Document, type DocumentFilters } from '@/lib/api/documents';
import { DocumentViewer, useDocumentViewer } from '@/components/shared/DocumentViewer';

export default function ClientDocumentsPage() {
  const [filters, setFilters] = useState<DocumentFilters>({
    search: '',
    category: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);

  // Hook pour le viewer de documents
  const { isOpen: viewerOpen, currentDocument, openViewer, closeViewer } = useDocumentViewer();

  // Gestionnaire de rafraîchissement (définition unique)
  const handleRefresh = () => {
    mutateDocuments();
    mutateStats();
    toast.success('Données actualisées');
  };

  // Gestionnaire de visualisation de document
  const handleViewDocument = (document: Document) => {
    openViewer({
      fileUrl: `/api/documents/${document.id}/view`, // URL pour accéder au fichier
      fileName: document.fileName,
      fileType: document.fileType,
      fileSize: document.fileSize,
      onDownload: () => handleDownload(document.id, document.fileName),
      onClose: closeViewer,
    });
  };

  // Charger les statistiques
  const { data: stats, error: statsError, mutate: mutateStats } = useSWR(
    'document-stats',
    getDocumentStats,
    { refreshInterval: 30000 }
  );

  // Charger les documents avec filtres
  const { data: documentsData, error: documentsError, mutate: mutateDocuments, isLoading } = useSWR(
    ['documents', filters, currentPage],
    () => getDocuments(filters, currentPage),
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
    }
  );

  const handleDownload = async (documentId: string, documentName: string) => {
    try {
      const blob = await downloadDocument(documentId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Document téléchargé avec succès');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  const handleFilterChange = (key: keyof DocumentFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
    setCurrentPage(1); // Reset à la première page
  };

  // (supprimé doublon handleRefresh)

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <FileImage className="h-6 w-6 text-blue-500" />;
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
    } else if (mimeType.startsWith('video/')) {
      return <FileVideo className="h-6 w-6 text-purple-500" />;
    } else {
      return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'contract':
        return <FileText className="h-6 w-6 text-blue-500" />;
      case 'invoice':
        return <File className="h-6 w-6 text-green-500" />;
      case 'report':
        return <FileText className="h-6 w-6 text-purple-500" />;
      case 'deliverable':
        return <FileText className="h-6 w-6 text-orange-500" />;
      default:
        return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    const variants = {
      contract: 'bg-blue-100 text-blue-800',
      invoice: 'bg-green-100 text-green-800',
      report: 'bg-purple-100 text-purple-800',
      deliverable: 'bg-orange-100 text-orange-800',
      other: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      contract: 'Contrat',
      invoice: 'Facture',
      report: 'Rapport',
      deliverable: 'Livrable',
      other: 'Autre',
    };

    return (
      <Badge className={variants[category as keyof typeof variants] || variants.other}>
        {labels[category as keyof typeof labels] || category}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const documentsColumns = [
    {
      key: 'name',
      header: 'Document',
      render: (document: Document) => (
        <div className="flex items-center space-x-3">
          {getFileIcon(document.mimeType)}
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{document.name}</p>
            <p className="text-sm text-gray-600 truncate">
              {document.fileName}
            </p>
            {document.description && (
              <p className="text-sm text-gray-500 truncate">
                {document.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Catégorie',
      render: (document: Document) => getCategoryBadge(document.category),
    },
    {
      key: 'project',
      header: 'Projet',
      render: (document: Document) => (
        <div className="flex items-center space-x-2">
          {document.projectName ? (
            <>
              <Building className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{document.projectName}</span>
            </>
          ) : (
            <span className="text-sm text-gray-500">Général</span>
          )}
        </div>
      ),
    },
    {
      key: 'size',
      header: 'Taille',
      render: (document: Document) => (
        <div className="flex items-center space-x-1">
          <HardDrive className="h-4 w-4 text-gray-500" />
          <span className="text-sm">{formatFileSize(document.fileSize)}</span>
        </div>
      ),
    },
    {
      key: 'version',
      header: 'Version',
      render: (document: Document) => (
        <Badge variant="outline">
          v{document.version}
        </Badge>
      ),
    },
    {
      key: 'sharedAt',
      header: 'Partagé',
      render: (document: Document) => (
        <div className="flex items-center space-x-1">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {document.sharedAt
              ? format(new Date(document.sharedAt), 'dd/MM/yyyy', { locale: fr })
              : format(new Date(document.createdAt), 'dd/MM/yyyy', { locale: fr })
            }
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (document: Document) => (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewDocument(document)}
            aria-label={`Visualiser ${document.fileName}`}
          >
            <Eye className="h-4 w-4 mr-1" />
            Visualiser
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownload(document.id, document.fileName)}
            aria-label={`Télécharger ${document.fileName}`}
          >
            <Download className="h-4 w-4 mr-1" />
            Télécharger
          </Button>

          {document.version > 1 && (
            <Dialog open={versionDialogOpen && selectedDocument?.id === document.id} onOpenChange={(open) => {
              setVersionDialogOpen(open);
              if (!open) setSelectedDocument(null);
            }}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedDocument(document)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Versions
                </Button>
              </DialogTrigger>
              <DocumentVersionsDialog document={selectedDocument} />
            </Dialog>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Documents"
        description="Accédez à tous vos documents partagés"
        actions={
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        }
      />

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="text-center">
            <FileText className="h-8 w-8 mx-auto text-blue-600" />
            <CardTitle className="text-lg">Total</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-sm text-gray-600">Documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Clock className="h-8 w-8 mx-auto text-green-600" />
            <CardTitle className="text-lg">Récents</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold">{stats?.recentCount || 0}</div>
            <p className="text-sm text-gray-600">Cette semaine</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <HardDrive className="h-8 w-8 mx-auto text-purple-600" />
            <CardTitle className="text-lg">Espace</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold">
              {stats?.totalSize ? formatFileSize(stats.totalSize) : '0 MB'}
            </div>
            <p className="text-sm text-gray-600">Utilisé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <FileText className="h-8 w-8 mx-auto text-orange-600" />
            <CardTitle className="text-lg">Catégories</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-2xl font-bold">{stats?.byCategory ? Object.keys(stats.byCategory).length : 0}</div>
            <p className="text-sm text-gray-600">Types différents</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtres</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Recherche</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nom, description..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Catégorie</label>
              <Select
                value={filters.category ?? 'all'}
                onValueChange={(value) => handleFilterChange('category', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Toutes les catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  <SelectItem value="contract">Contrats</SelectItem>
                  <SelectItem value="invoice">Factures</SelectItem>
                  <SelectItem value="report">Rapports</SelectItem>
                  <SelectItem value="deliverable">Livrables</SelectItem>
                  <SelectItem value="other">Autres</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Type de fichier</label>
              <Select
                value={filters.mimeType ?? 'all'}
                onValueChange={(value) => handleFilterChange('mimeType', value === 'all' ? '' : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous les types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="application/pdf">PDF</SelectItem>
                  <SelectItem value="application/msword">Word</SelectItem>
                  <SelectItem value="application/vnd.openxmlformats-officedocument.wordprocessingml.document">Word (DOCX)</SelectItem>
                  <SelectItem value="application/vnd.ms-excel">Excel</SelectItem>
                  <SelectItem value="image/">Images</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({});
                  setCurrentPage(1);
                }}
                className="w-full"
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            {documentsData?.pagination.total || 0} document{(documentsData?.pagination.total || 0) !== 1 ? 's' : ''} trouvé{(documentsData?.pagination.total || 0) !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <DataTable
              data={documentsData?.documents || []}
              columns={documentsColumns}
              pagination={documentsData?.pagination}
              onPageChange={setCurrentPage}
              currentPage={currentPage}
              emptyMessage="Aucun document trouvé"
            />
          )}
        </CardContent>
      </Card>

      {/* DocumentViewer modal */}
      {viewerOpen && currentDocument && (
        <DocumentViewer
          {...currentDocument}
          className="mt-6"
        />
      )}
    </div>
  );
}

// Composant pour le dialogue des versions de document
function DocumentVersionsDialog({ document }: { document: Document | null }) {
  const [versions, setVersions] = useState<any[]>([]);

  useEffect(() => {
    if (document) {
      // Simulation des versions - en production, cela viendrait de l'API
      const mockVersions = [];
      for (let i = document.version; i >= 1; i--) {
        mockVersions.push({
          id: `${document.id}-v${i}`,
          version: i,
          fileName: `${document.fileName.replace(/\.[^/.]+$/, '')}_v${i}.${document.fileName.split('.').pop()}`,
          fileSize: document.fileSize - (i - 1) * 1024, // Simulation de taille légèrement différente
          mimeType: document.mimeType,
          createdAt: new Date(Date.now() - (document.version - i) * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
      setVersions(mockVersions);
    }
  }, [document]);

  if (!document) return null;

  return (
    <DialogContent className="sm:max-w-[600px]">
      <DialogHeader>
        <DialogTitle>Versions de {document.name}</DialogTitle>
        <DialogDescription>
          Historique des versions de ce document
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        {versions.map((version: any) => (
          <div key={version.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Badge variant="outline">v{version.version}</Badge>
              <div>
                <p className="font-medium">{version.fileName}</p>
                <p className="text-sm text-gray-600">
                  {(version.fileSize / 1024 / 1024).toFixed(2)} MB •{' '}
                  {format(new Date(version.createdAt), 'PPP à p', { locale: fr })}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                // Simulation du téléchargement d'une version spécifique
                toast.success(`Téléchargement de la version ${version.version} simulé`);
              }}
            >
              <Download className="h-4 w-4 mr-1" />
              Télécharger
            </Button>
          </div>
        ))}
      </div>
    </DialogContent>
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Documents"
        description="Accédez à tous vos documents partagés"
        actions={
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        }
      />

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalSize ? `${(stats.totalSize / 1024 / 1024).toFixed(1)} MB` : 'Taille inconnue'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cette semaine</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.weeklyUploads}</div>
              <p className="text-xs text-muted-foreground">
                Nouveaux documents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Partagés</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sharedDocuments}</div>
              <p className="text-xs text-muted-foreground">
                Avec votre équipe
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Téléchargements</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDownloads}</div>
              <p className="text-xs text-muted-foreground">
                Ce mois-ci
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher un document..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full"
              />
            </div>
            <Select
              value={filters.category}
              onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Toutes les catégories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Toutes les catégories</SelectItem>
                <SelectItem value="contract">Contrats</SelectItem>
                <SelectItem value="invoice">Factures</SelectItem>
                <SelectItem value="report">Rapports</SelectItem>
                <SelectItem value="presentation">Présentations</SelectItem>
                <SelectItem value="other">Autres</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table des documents */}
      <Card>
        <CardHeader>
          <CardTitle>Mes documents</CardTitle>
          <CardDescription>
            Liste de tous vos documents disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={documentsData?.documents || []}
            columns={documentsColumns}
            searchable={false}
          />
        </CardContent>
      </Card>

      {/* DocumentViewer modal */}
      {viewerOpen && currentDocument && (
        <DocumentViewer
          {...currentDocument}
          className="mt-6"
        />
      )}
    </div>
  );
}
