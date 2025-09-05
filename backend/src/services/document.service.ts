import { db, withTransaction } from '@/config/database';
import { auditService } from '@/services/audit.service';
import { fileStorageService } from '@/services/fileStorage.service';
import { NotFoundError, ConflictError, ValidationError, ForbiddenError } from '@/types/errors';
import { RequestContext } from '@/types/api';
import {
  CreateDocumentInput,
  UpdateDocumentInput,
  Document,
  DocumentFilters,
  CreateDocumentVersionInput,
  CreateDocumentSchema,
  UpdateDocumentSchema,
  CreateDocumentVersionSchema,
} from '@nourx/shared';
import logger from '@/lib/logger';

export interface DocumentListResult {
  documents: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class DocumentService {
  /**
   * Upload un nouveau document
   */
  async createDocument(
    input: CreateDocumentInput,
    file: { buffer: Buffer; fileName: string; mimeType: string },
    context: RequestContext
  ): Promise<Document> {
    // Validation avec Zod
    const validated = CreateDocumentSchema.parse(input);

    return withTransaction(async (trx) => {
      // Vérifier que l'organisation existe
      const organization = await trx
        .selectFrom('organization')
        .select('id')
        .where('id', '=', validated.organizationId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (!organization) {
        throw new NotFoundError('Organisation introuvable');
      }

      // Vérifier l'unicité du nom de document dans l'organisation
      const existingDocument = await trx
        .selectFrom('document')
        .select('id')
        .where('name', '=', validated.name)
        .where('organization_id', '=', validated.organizationId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (existingDocument) {
        throw new ConflictError('Un document avec ce nom existe déjà dans cette organisation');
      }

      // Sauvegarder le fichier
      const fileResult = await fileStorageService.saveDocument({
        organizationId: validated.organizationId,
        fileName: file.fileName,
        buffer: file.buffer,
        mimeType: file.mimeType,
        version: 1,
      });

      // Créer le document en base
      const document = await trx
        .insertInto('document')
        .values({
          organization_id: validated.organizationId,
          name: validated.name,
          description: validated.description || null,
          file_path: fileResult.filePath,
          file_name: fileResult.fileName,
          file_size: fileResult.fileSize,
          mime_type: fileResult.mimeType,
          version: 1,
          is_shared_with_client: validated.isSharedWithClient,
          uploaded_by: context.user.id,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Audit log
      await auditService.log(
        'document_created',
        context.user.id,
        context.user.role === 'admin' ? 'admin' : 'client',
        `Document créé: ${document.name}`,
        {
          documentId: document.id,
          organizationId: document.organization_id,
          fileName: document.file_name,
          fileSize: document.file_size,
          isSharedWithClient: document.is_shared_with_client,
        },
        trx
      );

      logger.info('Document créé', {
        documentId: document.id,
        name: document.name,
        organizationId: document.organization_id,
        fileSize: document.file_size,
        isShared: document.is_shared_with_client,
        userId: context.user.id,
      });

      return this.formatDocument(document);
    });
  }

  /**
   * Crée une nouvelle version d'un document existant
   */
  async createDocumentVersion(
    id: string,
    input: CreateDocumentVersionInput,
    file: { buffer: Buffer; fileName: string; mimeType: string },
    context: RequestContext
  ): Promise<Document> {
    // Validation avec Zod
    const validated = CreateDocumentVersionSchema.parse(input);

    return withTransaction(async (trx) => {
      // Vérifier que le document original existe
      const originalDocument = await trx
        .selectFrom('document')
        .selectAll()
        .where('id', '=', id)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (!originalDocument) {
        throw new NotFoundError('Document introuvable');
      }

      // Déterminer la version suivante
      const latestVersion = await trx
        .selectFrom('document')
        .select('version')
        .where('name', '=', originalDocument.name)
        .where('organization_id', '=', originalDocument.organization_id)
        .where('deleted_at', 'is', null)
        .orderBy('version', 'desc')
        .executeTakeFirst();

      const nextVersion = (latestVersion?.version || 0) + 1;

      // Sauvegarder le nouveau fichier
      const fileResult = await fileStorageService.saveDocument({
        organizationId: originalDocument.organization_id,
        fileName: file.fileName,
        buffer: file.buffer,
        mimeType: file.mimeType,
        version: nextVersion,
      });

      // Créer la nouvelle version du document
      const newDocument = await trx
        .insertInto('document')
        .values({
          organization_id: originalDocument.organization_id,
          name: validated.name || originalDocument.name,
          description: validated.description !== undefined ? validated.description : originalDocument.description,
          file_path: fileResult.filePath,
          file_name: fileResult.fileName,
          file_size: fileResult.fileSize,
          mime_type: fileResult.mimeType,
          version: nextVersion,
          is_shared_with_client: originalDocument.is_shared_with_client,
          uploaded_by: context.user.id,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      // Audit log
      await auditService.log(
        'document_version_created',
        context.user.id,
        context.user.role === 'admin' ? 'admin' : 'client',
        `Nouvelle version du document créée: ${newDocument.name} v${newDocument.version}`,
        {
          documentId: newDocument.id,
          originalDocumentId: id,
          organizationId: newDocument.organization_id,
          version: newDocument.version,
          fileName: newDocument.file_name,
        },
        trx
      );

      logger.info('Nouvelle version de document créée', {
        documentId: newDocument.id,
        originalDocumentId: id,
        name: newDocument.name,
        version: newDocument.version,
        userId: context.user.id,
      });

      return this.formatDocument(newDocument);
    });
  }

  /**
   * Récupère un document par son ID
   */
  async getDocumentById(
    id: string,
    organizationId: string,
    context: RequestContext
  ): Promise<Document> {
    let query = db
      .selectFrom('document')
      .selectAll()
      .where('id', '=', id)
      .where('organization_id', '=', organizationId)
      .where('deleted_at', 'is', null);

    // Filtrer pour les clients : seulement les documents partagés
    if (context.user.role === 'client') {
      query = query.where('is_shared_with_client', '=', true);
    }

    const document = await query.executeTakeFirst();

    if (!document) {
      throw new NotFoundError('Document introuvable');
    }

    return this.formatDocument(document);
  }

  /**
   * Met à jour un document (métadonnées seulement)
   */
  async updateDocument(
    id: string,
    organizationId: string,
    input: UpdateDocumentInput,
    context: RequestContext
  ): Promise<Document> {
    // Validation avec Zod
    const validated = UpdateDocumentSchema.parse(input);

    return withTransaction(async (trx) => {
      // Vérifier que le document existe
      const existingDocument = await trx
        .selectFrom('document')
        .selectAll()
        .where('id', '=', id)
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (!existingDocument) {
        throw new NotFoundError('Document introuvable');
      }

      // Vérifier l'unicité du nom si changé
      if (validated.name && validated.name !== existingDocument.name) {
        const duplicateDocument = await trx
          .selectFrom('document')
          .select('id')
          .where('name', '=', validated.name)
          .where('organization_id', '=', organizationId)
          .where('id', '!=', id)
          .where('deleted_at', 'is', null)
          .executeTakeFirst();

        if (duplicateDocument) {
          throw new ConflictError('Un document avec ce nom existe déjà dans cette organisation');
        }
      }

      // Construire les données à mettre à jour
      const updateData: Partial<typeof existingDocument> = {
        updated_at: new Date(),
      };

      if (validated.name !== undefined) updateData.name = validated.name;
      if (validated.description !== undefined) updateData.description = validated.description;
      if (validated.isSharedWithClient !== undefined) updateData.is_shared_with_client = validated.isSharedWithClient;

      // Mettre à jour le document
      const updatedDocument = await trx
        .updateTable('document')
        .set(updateData)
        .where('id', '=', id)
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Audit log
      await auditService.log(
        'document_updated',
        context.user.id,
        context.user.role === 'admin' ? 'admin' : 'client',
        `Document modifié: ${updatedDocument.name}`,
        {
          documentId: updatedDocument.id,
          organizationId: updatedDocument.organization_id,
          changes: validated,
        },
        trx
      );

      logger.info('Document mis à jour', {
        documentId: updatedDocument.id,
        name: updatedDocument.name,
        changes: validated,
        userId: context.user.id,
      });

      return this.formatDocument(updatedDocument);
    });
  }

  /**
   * Télécharge le fichier d'un document
   */
  async downloadDocument(
    id: string,
    organizationId: string,
    version?: number,
    context: RequestContext
  ): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    let query = db
      .selectFrom('document')
      .select(['file_path', 'file_name', 'mime_type', 'version'])
      .where('organization_id', '=', organizationId)
      .where('deleted_at', 'is', null);

    if (version) {
      // Récupérer une version spécifique
      query = query
        .where('id', '=', id)
        .where('version', '=', version);
    } else {
      // Récupérer la dernière version
      query = query
        .where('id', '=', id)
        .orderBy('version', 'desc')
        .limit(1);
    }

    // Filtrer pour les clients : seulement les documents partagés
    if (context.user.role === 'client') {
      query = query.where('is_shared_with_client', '=', true);
    }

    const document = await query.executeTakeFirst();

    if (!document) {
      throw new NotFoundError('Document ou version introuvable');
    }

    const buffer = await fileStorageService.getFile(document.file_path);

    return {
      buffer,
      fileName: document.file_name,
      mimeType: document.mime_type,
    };
  }

  /**
   * Supprime un document (soft delete)
   */
  async deleteDocument(
    id: string,
    organizationId: string,
    context: RequestContext
  ): Promise<void> {
    return withTransaction(async (trx) => {
      // Vérifier que le document existe
      const document = await trx
        .selectFrom('document')
        .selectAll()
        .where('id', '=', id)
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (!document) {
        throw new NotFoundError('Document introuvable');
      }

      // Soft delete du document
      await trx
        .updateTable('document')
        .set({
          deleted_at: new Date(),
          updated_at: new Date(),
        })
        .where('id', '=', id)
        .where('organization_id', '=', organizationId)
        .execute();

      // Audit log
      await auditService.log(
        'document_deleted',
        context.user.id,
        context.user.role === 'admin' ? 'admin' : 'client',
        `Document supprimé: ${document.name}`,
        {
          documentId: document.id,
          organizationId: document.organization_id,
          fileName: document.file_name,
        },
        trx
      );

      logger.info('Document supprimé', {
        documentId: document.id,
        name: document.name,
        userId: context.user.id,
      });
    });
  }

  /**
   * Liste les documents avec filtres et pagination
   */
  async listDocuments(
    organizationId: string,
    filters: DocumentFilters,
    page: number = 1,
    limit: number = 20,
    context: RequestContext
  ): Promise<DocumentListResult> {
    let query = db
      .selectFrom('document')
      .selectAll()
      .where('organization_id', '=', organizationId)
      .orderBy('created_at', 'desc');

    // Inclure les documents supprimés si demandé
    if (!filters.includeDeleted) {
      query = query.where('deleted_at', 'is', null);
    }

    // Appliquer les filtres
    if (filters.search) {
      query = query.where((eb) =>
        eb.or([
          eb('name', 'ilike', `%${filters.search}%`),
          eb('description', 'ilike', `%${filters.search}%`),
          eb('file_name', 'ilike', `%${filters.search}%`),
        ])
      );
    }

    if (filters.isSharedWithClient !== undefined) {
      query = query.where('is_shared_with_client', '=', filters.isSharedWithClient);
    }

    if (filters.uploadedBy) {
      query = query.where('uploaded_by', '=', filters.uploadedBy);
    }

    if (filters.createdAfter) {
      query = query.where('created_at', '>=', filters.createdAfter);
    }

    if (filters.createdBefore) {
      query = query.where('created_at', '<=', filters.createdBefore);
    }

    // Filtrer pour les clients : seulement les documents partagés
    if (context.user.role === 'client') {
      query = query.where('is_shared_with_client', '=', true);
    }

    // Compter le total
    const totalQuery = query
      .clearSelect()
      .select((eb) => eb.fn.count<number>('id').as('count'));
    
    const totalResult = await totalQuery.executeTakeFirst();
    const total = totalResult?.count || 0;

    // Appliquer la pagination
    const offset = (page - 1) * limit;
    const documents = await query
      .limit(limit)
      .offset(offset)
      .execute();

    const hasNext = offset + documents.length < total;
    const hasPrev = page > 1;

    return {
      documents: documents.map(d => this.formatDocument(d)),
      pagination: {
        page,
        limit,
        total,
        hasNext,
        hasPrev,
      },
    };
  }

  /**
   * Récupère l'historique des versions d'un document
   */
  async getDocumentVersions(
    name: string,
    organizationId: string,
    context: RequestContext
  ): Promise<Document[]> {
    let query = db
      .selectFrom('document')
      .selectAll()
      .where('name', '=', name)
      .where('organization_id', '=', organizationId)
      .where('deleted_at', 'is', null)
      .orderBy('version', 'desc');

    // Filtrer pour les clients : seulement les documents partagés
    if (context.user.role === 'client') {
      query = query.where('is_shared_with_client', '=', true);
    }

    const versions = await query.execute();

    return versions.map(d => this.formatDocument(d));
  }

  /**
   * Change le statut de partage d'un document
   */
  async toggleDocumentSharing(
    id: string,
    organizationId: string,
    isShared: boolean,
    context: RequestContext
  ): Promise<Document> {
    return withTransaction(async (trx) => {
      // Vérifier que le document existe
      const document = await trx
        .selectFrom('document')
        .selectAll()
        .where('id', '=', id)
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .executeTakeFirst();

      if (!document) {
        throw new NotFoundError('Document introuvable');
      }

      // Mettre à jour le statut de partage
      const updatedDocument = await trx
        .updateTable('document')
        .set({
          is_shared_with_client: isShared,
          updated_at: new Date(),
        })
        .where('id', '=', id)
        .where('organization_id', '=', organizationId)
        .where('deleted_at', 'is', null)
        .returningAll()
        .executeTakeFirstOrThrow();

      // Audit log
      const action = isShared ? 'document_shared' : 'document_unshared';
      const message = isShared 
        ? `Document partagé avec le client: ${document.name}`
        : `Document retiré du partage client: ${document.name}`;

      await auditService.log(
        action,
        context.user.id,
        'admin',
        message,
        {
          documentId: document.id,
          organizationId: document.organization_id,
          isShared,
        },
        trx
      );

      logger.info(isShared ? 'Document partagé' : 'Document retiré du partage', {
        documentId: document.id,
        name: document.name,
        isShared,
        userId: context.user.id,
      });

      return this.formatDocument(updatedDocument);
    });
  }

  /**
   * Formate un document pour la réponse API
   */
  private formatDocument(document: any): Document {
    return {
      id: document.id,
      organizationId: document.organization_id,
      name: document.name,
      description: document.description,
      fileName: document.file_name,
      fileSize: document.file_size,
      mimeType: document.mime_type,
      version: document.version,
      isSharedWithClient: document.is_shared_with_client,
      uploadedBy: document.uploaded_by,
      createdAt: document.created_at.toISOString(),
      updatedAt: document.updated_at.toISOString(),
      deletedAt: document.deleted_at ? document.deleted_at.toISOString() : null,
    };
  }
}

export const documentService = new DocumentService();