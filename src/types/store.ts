/**
 * Data store types for in-memory records and query results.
 */

export type StoreRecord = Record<string, unknown> & { id: number | string };

export interface StoreData {
  [resource: string]: StoreRecord[];
}

export interface QueryOptions {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, string>;
}

export interface PaginatedResult {
  data: StoreRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
