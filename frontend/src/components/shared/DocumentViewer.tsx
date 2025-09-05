'use client';

import { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  RotateCw,
  Maximize,
  Minimize,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Loader2
} from 'lucide-react';

// Configuration de PDF.js
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
}

export interface DocumentViewerProps {
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  onDownload?: () => void;
  onClose?: () => void;
  className?: string;
}

export function DocumentViewer({
  fileUrl,
  fileName,
  fileType,
  fileSize,
  onDownload,
  onClose,
  className = '',
}: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Gestionnaire de chargement du document PDF
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Erreur chargement PDF:', error);
    setError('Impossible de charger le document. Le fichier peut être corrompu ou inaccessible.');
    setLoading(false);
  }, []);

  // Navigation dans le PDF
  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(numPages || 1, prev + 1));
  };

  // Contrôles de zoom
  const zoomIn = () => {
    setScale(prev => Math.min(3.0, prev + 0.25));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.25));
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  // Rotation
  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  // Plein écran
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Gestionnaire de chargement d'image
  const handleImageLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleImageError = () => {
    setError('Impossible de charger l\'image. Le fichier peut être corrompu ou inaccessible.');
    setLoading(false);
  };

  // Formatage de la taille du fichier
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Déterminer si c'est un PDF ou une image
  const isPDF = fileType.toLowerCase().includes('pdf');
  const isImage = fileType.toLowerCase().includes('image') ||
                  ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].some(ext =>
                    fileName.toLowerCase().endsWith(`.${ext}`)
                  );

  if (error) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Erreur de chargement</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex justify-center space-x-2">
            {onDownload && (
              <Button onClick={onDownload} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            )}
            {onClose && (
              <Button onClick={onClose} variant="outline">
                Fermer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''} ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isPDF ? (
              <FileText className="h-5 w-5 text-red-500" />
            ) : (
              <ImageIcon className="h-5 w-5 text-blue-500" />
            )}
            <div>
              <CardTitle className="text-lg">{fileName}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline">{fileType}</Badge>
                {fileSize && (
                  <Badge variant="secondary">{formatFileSize(fileSize)}</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {onDownload && (
              <Button onClick={onDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
            )}
            <Button onClick={toggleFullscreen} variant="outline" size="sm">
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
            {onClose && (
              <Button onClick={onClose} variant="outline" size="sm">
                Fermer
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Contrôles de navigation (PDF uniquement) */}
        {isPDF && numPages && numPages > 1 && (
          <>
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={goToPrevPage}
                    disabled={pageNumber <= 1}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium">
                    Page {pageNumber} sur {numPages}
                  </span>
                  <Button
                    onClick={goToNextPage}
                    disabled={pageNumber >= numPages}
                    variant="outline"
                    size="sm"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button onClick={zoomOut} variant="outline" size="sm" disabled={scale <= 0.5}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[60px] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  <Button onClick={zoomIn} variant="outline" size="sm" disabled={scale >= 3.0}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button onClick={resetZoom} variant="outline" size="sm">
                    100%
                  </Button>
                  <Button onClick={rotate} variant="outline" size="sm">
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Zone d'affichage du document */}
        <div className={`relative bg-gray-100 ${isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-[600px]'} overflow-auto`}>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Chargement du document...</p>
              </div>
            </div>
          )}

          {isPDF ? (
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading=""
              className="flex justify-center"
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                rotate={rotation}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="shadow-lg"
              />
            </Document>
          ) : isImage ? (
            <div className="flex justify-center items-center h-full">
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-full object-contain shadow-lg"
                style={{
                  transform: `scale(${scale}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                }}
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Type de fichier non supporté</p>
                <p className="text-sm text-gray-500">
                  Ce type de fichier ne peut pas être affiché dans le navigateur.
                </p>
                {onDownload && (
                  <Button onClick={onDownload} className="mt-4">
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger le fichier
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Informations du document */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>{fileName}</span>
              <Separator orientation="vertical" className="h-4" />
              <span>{fileType}</span>
              {fileSize && (
                <>
                  <Separator orientation="vertical" className="h-4" />
                  <span>{formatFileSize(fileSize)}</span>
                </>
              )}
            </div>
            {isPDF && numPages && (
              <span>{numPages} page{numPages > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook personnalisé pour utiliser le viewer
export function useDocumentViewer() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<DocumentViewerProps | null>(null);

  const openViewer = useCallback((document: DocumentViewerProps) => {
    setCurrentDocument(document);
    setIsOpen(true);
  }, []);

  const closeViewer = useCallback(() => {
    setIsOpen(false);
    setCurrentDocument(null);
  }, []);

  return {
    isOpen,
    currentDocument,
    openViewer,
    closeViewer,
  };
}
