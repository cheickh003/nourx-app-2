'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClientLayout } from '@/components/layout/client-layout'
import { 
  FileText,
  Download,
  Eye,
  Calendar,
  User,
  FolderOpen,
  Upload
} from 'lucide-react'
import { useDocuments } from '@/hooks/use-client-api'

function DocumentCard({ document }: { document: any }) {
  const getFileIcon = (mimetype: string) => {
    if (mimetype.includes('pdf')) return '📄'
    if (mimetype.includes('image')) return '🖼️'
    if (mimetype.includes('video')) return '🎥'
    if (mimetype.includes('audio')) return '🎵'
    if (mimetype.includes('text')) return '📝'
    if (mimetype.includes('spreadsheet') || mimetype.includes('excel')) return '📊'
    if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return '📽️'
    return '📁'
  }

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'success'
      case 'client': return 'default'
      case 'internal': return 'secondary'
      default: return 'secondary'
    }
  }

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'Public'
      case 'client': return 'Client'
      case 'internal': return 'Interne'
      default: return visibility
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* File Icon */}
          <div className="text-2xl">{getFileIcon(document.mimetype)}</div>
          
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{document.title}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {document.filename}
                </p>
              </div>
              <Badge variant={getVisibilityColor(document.visibility)} className="ml-2">
                {getVisibilityLabel(document.visibility)}
              </Badge>
            </div>

            {/* Description */}
            {document.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {document.description}
              </p>
            )}

            {/* Metadata */}
            <div className="space-y-1 text-xs text-muted-foreground mb-3">
              <div className="flex items-center justify-between">
                <span>Taille: {formatFileSize(document.size)}</span>
                <span>{new Date(document.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              {document.uploaded_by && (
                <div className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  <span>Partagé par {document.uploaded_by.first_name} {document.uploaded_by.last_name}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {document.download_url && (
                <Button variant="outline" size="sm" asChild>
                  <a href={document.download_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-3 w-3 mr-1" />
                    Télécharger
                  </a>
                </Button>
              )}
              
              {document.mimetype.includes('pdf') || document.mimetype.includes('image') ? (
                <Button variant="outline" size="sm" asChild>
                  <a href={document.download_url} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-3 w-3 mr-1" />
                    Aperçu
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DocumentsPage() {
  const { data: documents, loading, error } = useDocuments()

  if (loading) {
    return (
      <ClientLayout title="Documents">
        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="h-20 bg-muted animate-pulse rounded" />
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
      <ClientLayout title="Documents">
        <div className="p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-destructive">Erreur lors du chargement des documents: {error}</p>
            </CardContent>
          </Card>
        </div>
      </ClientLayout>
    )
  }

  // Group documents by project
  const documentsByProject = documents?.reduce((acc: any, doc: any) => {
    const projectId = doc.project_id || 'other'
    if (!acc[projectId]) {
      acc[projectId] = []
    }
    acc[projectId].push(doc)
    return acc
  }, {}) || {}

  return (
    <ClientLayout title="Documents">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-muted-foreground">
            Accédez à tous vos documents de projet partagés par l'équipe NOURX
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold text-primary">{documents?.length || 0}</div>
                  <p className="text-sm text-muted-foreground">Total documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {Object.keys(documentsByProject).length}
                  </div>
                  <p className="text-sm text-muted-foreground">Projets avec documents</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {documents?.filter(d => 
                      new Date(d.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    ).length || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Cette semaine</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documents by Project */}
        {Object.keys(documentsByProject).length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">Aucun document disponible</h3>
              <p className="text-muted-foreground">
                L'équipe NOURX partagera vos documents de projet ici.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(documentsByProject).map(([projectId, projectDocuments]: [string, any]) => (
              <div key={projectId}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FolderOpen className="h-5 w-5" />
                      {projectId === 'other' ? 'Documents généraux' : `Projet #${projectId}`}
                    </CardTitle>
                    <CardDescription>
                      {(projectDocuments as any[]).length} document{(projectDocuments as any[]).length > 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {(projectDocuments as any[]).map((document: any) => (
                        <DocumentCard key={document.id} document={document} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  )
}
