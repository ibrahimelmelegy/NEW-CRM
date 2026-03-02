// Shared API response types

export interface PaginatedResponse<T> {
  data: T[];
  docs?: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  body: T | null;
  message: string;
  code: number;
  error?: unknown;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: string | number | boolean | undefined;
}
