import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { AppError } from '@/lib/errors';

export interface FileMetadata {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  version: number;
}

export interface SaveFileOptions {
  organizationId: string;
  fileName: string;
  buffer: Buffer;
  mimeType: string;
  version?: number;
}

export interface FileStorageResult {
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

class FileStorageService {
  private readonly basePath: string;
  private readonly allowedMimeTypes: Set<string>;
  private readonly maxFileSize: number; // en bytes

  constructor() {
    this.basePath = process.env.FILE_STORAGE_PATH || path.join(process.cwd(), 'storage');
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50MB par défaut
    this.allowedMimeTypes = new Set([
      // Documents
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
      // Images
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      // Archives
      'application/zip',
      'application/x-rar-compressed',
      'application/x-7z-compressed',
      // Autres
      'application/json',
      'application/xml',
      'text/xml',
    ]);
  }

  /**
   * Initialise les dossiers de stockage si ils n'existent pas
   */
  async ensureStorageDirectories(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
      await fs.mkdir(path.join(this.basePath, 'deliverables'), { recursive: true });
      await fs.mkdir(path.join(this.basePath, 'documents'), { recursive: true });
      await fs.mkdir(path.join(this.basePath, 'temp'), { recursive: true });
    } catch (error) {
      logger.error('Erreur lors de la création des dossiers de stockage', { error });
      throw new AppError('Erreur de configuration du stockage', 500);
    }
  }

  /**
   * Valide un fichier avant stockage
   */
  validateFile(buffer: Buffer, fileName: string, mimeType: string): void {
    // Vérifier la taille
    if (buffer.length > this.maxFileSize) {
      throw new AppError(
        `Le fichier est trop volumineux. Taille maximale: ${Math.round(this.maxFileSize / 1024 / 1024)}MB`,
        400
      );
    }

    // Vérifier le type MIME
    if (!this.allowedMimeTypes.has(mimeType)) {
      throw new AppError(`Type de fichier non autorisé: ${mimeType}`, 400);
    }

    // Vérifier l'extension
    const extension = path.extname(fileName).toLowerCase();
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
    if (suspiciousExtensions.includes(extension)) {
      throw new AppError('Extension de fichier non autorisée', 400);
    }

    // Vérifier que le nom de fichier n'est pas vide
    if (!fileName.trim()) {
      throw new AppError('Le nom de fichier ne peut pas être vide', 400);
    }
  }

  /**
   * Génère un nom de fichier sécurisé et unique
   */
  generateSecureFileName(organizationId: string, fileName: string, version: number = 1): string {
    const timestamp = Date.now();
    const hash = crypto.createHash('sha256')
      .update(`${organizationId}-${fileName}-${timestamp}`)
      .digest('hex')
      .substring(0, 12);
    
    const extension = path.extname(fileName);
    const baseName = path.basename(fileName, extension);
    
    // Nettoyer le nom de base
    const cleanBaseName = baseName
      .replace(/[^a-zA-Z0-9\-_]/g, '_')
      .substring(0, 50);
    
    return `${cleanBaseName}_v${version}_${hash}${extension}`;
  }

  /**
   * Sauvegarde un fichier pour un livrable
   */
  async saveDeliverable(options: SaveFileOptions): Promise<FileStorageResult> {
    this.validateFile(options.buffer, options.fileName, options.mimeType);
    await this.ensureStorageDirectories();

    const secureFileName = this.generateSecureFileName(
      options.organizationId,
      options.fileName,
      options.version || 1
    );

    const orgFolder = path.join(this.basePath, 'deliverables', options.organizationId);
    await fs.mkdir(orgFolder, { recursive: true });

    const filePath = path.join(orgFolder, secureFileName);
    const relativePath = path.relative(this.basePath, filePath);

    try {
      await fs.writeFile(filePath, options.buffer);
      
      logger.info('Fichier livrable sauvegardé', {
        fileName: options.fileName,
        secureFileName,
        organizationId: options.organizationId,
        size: options.buffer.length
      });

      return {
        filePath: relativePath,
        fileName: options.fileName,
        fileSize: options.buffer.length,
        mimeType: options.mimeType
      };
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde du fichier livrable', { error, fileName: options.fileName });
      throw new AppError('Erreur lors de la sauvegarde du fichier', 500);
    }
  }

  /**
   * Sauvegarde un fichier document
   */
  async saveDocument(options: SaveFileOptions): Promise<FileStorageResult> {
    this.validateFile(options.buffer, options.fileName, options.mimeType);
    await this.ensureStorageDirectories();

    const secureFileName = this.generateSecureFileName(
      options.organizationId,
      options.fileName,
      options.version || 1
    );

    const orgFolder = path.join(this.basePath, 'documents', options.organizationId);
    await fs.mkdir(orgFolder, { recursive: true });

    const filePath = path.join(orgFolder, secureFileName);
    const relativePath = path.relative(this.basePath, filePath);

    try {
      await fs.writeFile(filePath, options.buffer);
      
      logger.info('Document sauvegardé', {
        fileName: options.fileName,
        secureFileName,
        organizationId: options.organizationId,
        size: options.buffer.length
      });

      return {
        filePath: relativePath,
        fileName: options.fileName,
        fileSize: options.buffer.length,
        mimeType: options.mimeType
      };
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde du document', { error, fileName: options.fileName });
      throw new AppError('Erreur lors de la sauvegarde du document', 500);
    }
  }

  /**
   * Récupère un fichier
   */
  async getFile(filePath: string): Promise<Buffer> {
    const absolutePath = path.resolve(this.basePath, filePath);
    
    // Vérifier que le fichier est dans le dossier de stockage (sécurité)
    if (!absolutePath.startsWith(path.resolve(this.basePath))) {
      throw new AppError('Chemin de fichier non autorisé', 403);
    }

    try {
      const stats = await fs.stat(absolutePath);
      if (!stats.isFile()) {
        throw new AppError('Fichier introuvable', 404);
      }

      return await fs.readFile(absolutePath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new AppError('Fichier introuvable', 404);
      }
      logger.error('Erreur lors de la lecture du fichier', { error, filePath });
      throw new AppError('Erreur lors de la lecture du fichier', 500);
    }
  }

  /**
   * Vérifie si un fichier existe
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const absolutePath = path.resolve(this.basePath, filePath);
      
      // Vérifier que le fichier est dans le dossier de stockage
      if (!absolutePath.startsWith(path.resolve(this.basePath))) {
        return false;
      }

      const stats = await fs.stat(absolutePath);
      return stats.isFile();
    } catch {
      return false;
    }
  }

  /**
   * Supprime un fichier (soft delete - renomme le fichier)
   */
  async deleteFile(filePath: string): Promise<void> {
    const absolutePath = path.resolve(this.basePath, filePath);
    
    // Vérifier que le fichier est dans le dossier de stockage
    if (!absolutePath.startsWith(path.resolve(this.basePath))) {
      throw new AppError('Chemin de fichier non autorisé', 403);
    }

    try {
      const deletedPath = `${absolutePath}.deleted-${Date.now()}`;
      await fs.rename(absolutePath, deletedPath);
      
      logger.info('Fichier supprimé (soft delete)', { originalPath: filePath });
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        logger.warn('Tentative de suppression d\'un fichier inexistant', { filePath });
        return; // Ne pas échouer si le fichier n'existe pas
      }
      logger.error('Erreur lors de la suppression du fichier', { error, filePath });
      throw new AppError('Erreur lors de la suppression du fichier', 500);
    }
  }

  /**
   * Nettoie les fichiers temporaires anciens
   */
  async cleanupTempFiles(maxAgeHours: number = 24): Promise<void> {
    const tempDir = path.join(this.basePath, 'temp');
    const maxAge = maxAgeHours * 60 * 60 * 1000; // en millisecondes

    try {
      const files = await fs.readdir(tempDir);
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        
        if (Date.now() - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          logger.info('Fichier temporaire nettoyé', { file });
        }
      }
    } catch (error) {
      logger.warn('Erreur lors du nettoyage des fichiers temporaires', { error });
    }
  }
}

export const fileStorageService = new FileStorageService();