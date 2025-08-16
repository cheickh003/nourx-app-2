'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ClientLayout } from '@/components/layout/client-layout'
import { 
  FileText,
  Download,
  Eye,
  Calendar,
  User,
  FolderOpen,
  Upload,
  Search,
  Filter,
  ChevronDown,
  X
} from 'lucide-react'
import { useDocuments, useProjects, useApiMutation } from '@/hooks/use-client-api'

function DocumentCard({ document, onDownload }: { document: any; onDownload: (doc: any) => void }) {
  const getFileIcon = (extension: string) => {
    switch (extension?.toLowerCase()) {
      case 'pdf': return '📄'
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp':
      case 'webp': return '🖼️'
      case 'mp4':
      case 'avi':
      case 'mov': return '🎥'
      case 'mp3':
      case 'wav': return '🎵'
      case 'txt': return '📝'
      case 'xls':
      case 'xlsx': return '📊'
      case 'ppt':
      case 'pptx': return '📽️'
      case 'doc':
      case 'docx': return '📝'
      case 'zip':
      case 'rar': return '🗜️'
      default: return '📁'
    }
  }

  const formatFileSize = (size: number) => {
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'default'
      case 'internal': return 'secondary'
      case 'restricted': return 'destructive'
      default: return 'secondary'
    }
  }

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'Public'
      case 'internal': return 'Interne'
      case 'restricted': return 'Restreint'
      default: return visibility
    }
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* File Icon */}
          <div className="text-2xl">{getFileIcon(document.file_extension)}</div>
          
          <div className="flex-1 min-w-0">
            {/* Header */}
                          <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{document.title}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {document.file_name}
                </p>
              </div>
              <div className="flex gap-1">
                <Badge variant={getVisibilityColor(document.visibility)} className="text-xs">
                  {getVisibilityLabel(document.visibility)}
                </Badge>
                {document.version_status === 'approved' && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                    v{document.version}
                  </Badge>
                )}
              </div>
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
                <span>Taille: {formatFileSize(document.file_size)}</span>
                <span>{new Date(document.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center justify-between">
                {document.uploaded_by_name && (
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    <span>Par {document.uploaded_by_name}</span>
                  </div>
                )}
                {document.download_count > 0 && (
                  <span>{document.download_count} téléchargement{document.download_count > 1 ? 's' : ''}</span>
                )}
              </div>
              {document.project_title && (
                <div className="flex items-center">
                  <FolderOpen className="h-3 w-3 mr-1" />
                  <span>Projet: {document.project_title}</span>
                </div>
              )}
              {document.tag_list && document.tag_list.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {document.tag_list.slice(0, 3).map((tag: string, idx: number) => (
                    <span key={idx} className="bg-gray-100 text-gray-600 px-1 py-0.5 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                  {document.tag_list.length > 3 && (
                    <span className="text-gray-500">+{document.tag_list.length - 3}</span>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onDownload(document)}
                disabled={document.version_status !== 'approved'}
              >
                <Download className="h-3 w-3 mr-1" />
                Télécharger
              </Button>
              
              {document.is_image || document.is_pdf ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onDownload(document)}
                  disabled={document.version_status !== 'approved'}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Aperçu
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
  const { data: documents, loading, error, refetch } = useDocuments()
  const { data: projects } = useProjects()
  const downloadMutation = useApiMutation()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedVisibility, setSelectedVisibility] = useState<string>('')

  // Filter documents
  const filteredDocuments = documents?.filter(doc => {
    const matchesSearch = !searchTerm || 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesProject = !selectedProject || 
      doc.project?.toString() === selectedProject
    
    const matchesVisibility = !selectedVisibility || 
      doc.visibility === selectedVisibility
    
    return matchesSearch && matchesProject && matchesVisibility
  }) || []

  const handleDownload = async (document: any) => {
    try {
      const downloadData = await downloadMutation.mutate(`/api/documents/${document.id}/download/`, 'GET')
      
      // Open download URL in new tab
      if (downloadData?.download_url) {
        window.open(downloadData.download_url, '_blank')
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error)
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedProject('')
    setSelectedVisibility('')
  }

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

  // Remove the old documentsByProject logic as we're now using a flat list with filters

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
        <div className="grid gap-4 md:grid-cols-4">
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
                    {new Set(documents?.map(d => d.project).filter(Boolean)).size || 0}
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
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {documents?.reduce((sum, d) => sum + (d.download_count || 0), 0) || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">Téléchargements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Rechercher des documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <select 
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-white"
                >
                  <option value="">Tous les projets</option>
                  {projects?.map(project => (
                    <option key={project.id} value={project.id.toString()}>
                      {project.title}
                    </option>
                  ))}
                </select>
                
                <select 
                  value={selectedVisibility}
                  onChange={(e) => setSelectedVisibility(e.target.value)}
                  className="px-3 py-2 border rounded-md bg-white"
                >
                  <option value="">Toutes visibilités</option>
                  <option value="public">Public</option>
                  <option value="internal">Interne</option>
                  <option value="restricted">Restreint</option>
                </select>
                
                {(searchTerm || selectedProject || selectedVisibility) && (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Effacer
                  </Button>
                )}
              </div>
            </div>
            
            {filteredDocuments.length !== documents?.length && (
              <p className="text-sm text-muted-foreground mt-2">
                {filteredDocuments.length} document{filteredDocuments.length > 1 ? 's' : ''} trouvé{filteredDocuments.length > 1 ? 's' : ''}
                {documents?.length && ` sur ${documents.length} au total`}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Documents List */}
        {filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">
                {documents?.length === 0 ? 'Aucun document disponible' : 'Aucun document ne correspond aux filtres'}
              </h3>
              <p className="text-muted-foreground">
                {documents?.length === 0 
                  ? 'L\'équipe NOURX partagera vos documents de projet ici.'
                  : 'Essayez de modifier vos critères de recherche.'}
              </p>
              {documents?.length > 0 && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Effacer les filtres
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((document: any) => (
              <DocumentCard 
                key={document.id} 
                document={document} 
                onDownload={handleDownload}
              />
            ))}
          </div>
        )}
      </div>
    </ClientLayout>
  )
}
