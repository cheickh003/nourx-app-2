export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: string | number | boolean | undefined;
}

export interface ListQueryParams extends PaginationParams, SortParams {
  filters?: FilterParams;
}

export interface RequestContext {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId?: string;
  };
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
}