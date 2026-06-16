// ─── Generic API wrapper ──────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp?: string;
}

// ─── Paginated wrapper ────────────────────────────────────────────────────────

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: {
    items: T[];
  } & PaginationMeta;
}

// ─── Error shape ──────────────────────────────────────────────────────────────

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  data?: unknown;
}

// ─── Utility param types ──────────────────────────────────────────────────────

export type SortOrder = 'asc' | 'desc';

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

// ─── Upload response ──────────────────────────────────────────────────────────

export interface UploadResponse {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}
