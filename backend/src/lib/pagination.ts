import { SelectQueryBuilder } from 'kysely';
import logger from './logger';

export interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface CursorPaginationResult<T> {
  data: T[];
  pagination: {
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
    limit: number;
    totalEstimate?: number;
  };
}

export interface OffsetPaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface OffsetPaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Utilitaire de pagination avec curseurs (recommandé pour de grandes datasets)
 */
export class CursorPaginator {
  /**
   * Encode une valeur en cursor base64
   */
  static encodeCursor(value: string | number | Date): string {
    const stringValue = value instanceof Date ? value.toISOString() : String(value);
    return Buffer.from(stringValue).toString('base64url');
  }

  /**
   * Décode un cursor base64
   */
  static decodeCursor(cursor: string): string {
    try {
      return Buffer.from(cursor, 'base64url').toString('utf-8');
    } catch (error) {
      logger.warn('Failed to decode cursor', { cursor, error });
      throw new Error('Invalid cursor format');
    }
  }

  /**
   * Applique la pagination par curseur à une query Kysely
   */
  static async paginate<DB, TB extends keyof DB, O, T>(
    query: SelectQueryBuilder<DB, TB, O>,
    params: CursorPaginationParams,
    cursorField: string = 'created_at'
  ): Promise<CursorPaginationResult<T>> {
    const {
      cursor,
      limit = 20,
      orderBy = cursorField,
      orderDirection = 'desc'
    } = params;

    // Limiter le limit pour éviter les abus
    const safeLimit = Math.min(Math.max(limit, 1), 100);

    let paginatedQuery = query;

    // Ajouter la condition de cursor si fournie
    if (cursor) {
      const decodedCursor = this.decodeCursor(cursor);
      
      if (orderDirection === 'desc') {
        paginatedQuery = paginatedQuery.where(orderBy as any, '<', decodedCursor);
      } else {
        paginatedQuery = paginatedQuery.where(orderBy as any, '>', decodedCursor);
      }
    }

    // Récupérer un élément de plus pour savoir s'il y a une page suivante
    const results = await paginatedQuery
      .orderBy(orderBy as any, orderDirection)
      .limit(safeLimit + 1)
      .execute();

    const hasNext = results.length > safeLimit;
    const data = hasNext ? results.slice(0, safeLimit) : results;

    let nextCursor: string | undefined;
    let prevCursor: string | undefined;

    if (hasNext && data.length > 0) {
      const lastItem = data[data.length - 1] as any;
      nextCursor = this.encodeCursor(lastItem[orderBy]);
    }

    if (cursor && data.length > 0) {
      const firstItem = data[0] as any;
      prevCursor = this.encodeCursor(firstItem[orderBy]);
    }

    return {
      data: data as T[],
      pagination: {
        hasNext,
        hasPrev: !!cursor,
        ...(nextCursor ? { nextCursor } : {}),
        ...(prevCursor ? { prevCursor } : {}),
        limit: safeLimit,
      },
    };
  }
}

/**
 * Utilitaire de pagination par offset (pour compatibilité)
 */
export class OffsetPaginator {
  /**
   * Applique la pagination par offset à une query Kysely
   */
  static async paginate<DB, TB extends keyof DB, O, T>(
    query: SelectQueryBuilder<DB, TB, O>,
    countQuery: SelectQueryBuilder<DB, TB, { count: string }>,
    params: OffsetPaginationParams
  ): Promise<OffsetPaginationResult<T>> {
    const {
      page = 1,
      limit = 20,
      orderBy = 'created_at',
      orderDirection = 'desc'
    } = params;

    // Validation et limites de sécurité
    const safePage = Math.max(page, 1);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const offset = (safePage - 1) * safeLimit;

    // Exécuter les requêtes en parallèle
    const [data, totalResult] = await Promise.all([
      query
        .orderBy(orderBy as any, orderDirection)
        .limit(safeLimit)
        .offset(offset)
        .execute(),
      countQuery.executeTakeFirst()
    ]);

    const total = Number(totalResult?.count || 0);
    const totalPages = Math.ceil(total / safeLimit);

    return {
      data: data as T[],
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages,
        hasNext: safePage < totalPages,
        hasPrev: safePage > 1,
      },
    };
  }
}

/**
 * Helper pour créer des paramètres de pagination à partir de query params
 */
export function parsePaginationParams(query: any): {
  cursor?: CursorPaginationParams;
  offset?: OffsetPaginationParams;
} {
  const cursor = query.cursor
    ? {
        cursor: query.cursor as string,
        ...(query.limit ? { limit: parseInt(query.limit) } : {}),
        ...(query.orderBy ? { orderBy: query.orderBy as string } : {}),
        orderDirection: query.orderDirection === 'asc' ? 'asc' : 'desc',
      }
    : undefined;

  const offset = query.page
    ? {
        page: parseInt(query.page) || 1,
        ...(query.limit ? { limit: parseInt(query.limit) } : {}),
        ...(query.orderBy ? { orderBy: query.orderBy as string } : {}),
        orderDirection: query.orderDirection === 'asc' ? 'asc' : 'desc',
      }
    : undefined;

  return { cursor, offset };
}

/**
 * Constantes par défaut
 */
export const PAGINATION_DEFAULTS = {
  LIMIT: 20,
  MAX_LIMIT: 100,
  ORDER_BY: 'created_at',
  ORDER_DIRECTION: 'desc' as const,
} as const;

/**
 * Types utilitaires
 */
export type PaginationMode = 'cursor' | 'offset';

export interface PaginationConfig {
  defaultLimit?: number;
  maxLimit?: number;
  defaultOrderBy?: string;
  defaultOrderDirection?: 'asc' | 'desc';
  allowedOrderFields?: string[];
}

/**
 * Factory pour créer des paginators configurés
 */
export class PaginationFactory {
  static createCursorPaginator(config: PaginationConfig = {}) {
    return {
      paginate: <DB, TB extends keyof DB, O, T>(
        query: SelectQueryBuilder<DB, TB, O>,
        params: CursorPaginationParams,
        cursorField: string = config.defaultOrderBy || 'created_at'
      ) => {
        // Valider les champs de tri autorisés
        if (config.allowedOrderFields && params.orderBy) {
          if (!config.allowedOrderFields.includes(params.orderBy)) {
            throw new Error(`Invalid orderBy field: ${params.orderBy}`);
          }
        }

        // Appliquer les limites configurées
        const finalParams = {
          ...params,
          limit: Math.min(
            params.limit || config.defaultLimit || PAGINATION_DEFAULTS.LIMIT,
            config.maxLimit || PAGINATION_DEFAULTS.MAX_LIMIT
          ),
        };

        return CursorPaginator.paginate<DB, TB, O, T>(query, finalParams, cursorField);
      },
    };
  }

  static createOffsetPaginator(config: PaginationConfig = {}) {
    return {
      paginate: <DB, TB extends keyof DB, O, T>(
        query: SelectQueryBuilder<DB, TB, O>,
        countQuery: SelectQueryBuilder<DB, TB, { count: string }>,
        params: OffsetPaginationParams
      ) => {
        // Valider les champs de tri autorisés
        if (config.allowedOrderFields && params.orderBy) {
          if (!config.allowedOrderFields.includes(params.orderBy)) {
            throw new Error(`Invalid orderBy field: ${params.orderBy}`);
          }
        }

        // Appliquer les limites configurées
        const finalParams = {
          ...params,
          limit: Math.min(
            params.limit || config.defaultLimit || PAGINATION_DEFAULTS.LIMIT,
            config.maxLimit || PAGINATION_DEFAULTS.MAX_LIMIT
          ),
        };

        return OffsetPaginator.paginate<DB, TB, O, T>(query, countQuery, finalParams);
      },
    };
  }
}
