/**
 * In-memory data store backed by a Map<resource, StoreRecord[]>.
 * Supports CRUD, pagination, sorting, filtering, and full-text search.
 */

import type { StoreRecord, StoreData, QueryOptions, PaginatedResult } from '../types/store.js';
import { DEFAULT_PAGE_SIZE } from '../config/defaults.js';

export class DataStore {
  private data: Map<string, StoreRecord[]> = new Map();

  getResources(): string[] {
    return Array.from(this.data.keys());
  }

  loadAll(data: StoreData): void {
    this.data.clear();
    for (const [resource, records] of Object.entries(data)) {
      this.data.set(resource, [...records]);
    }
  }

  getAll(resource: string): StoreRecord[] {
    return this.data.get(resource) ?? [];
  }

  query(resource: string, options: QueryOptions, defaultPageSize?: number): PaginatedResult {
    let records = [...(this.data.get(resource) ?? [])];

    // 1. Apply exact-match filters
    if (options.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        records = records.filter((r) => String(r[key]) === value);
      }
    }

    // 2. Apply full-text search across all string fields
    if (options.search) {
      const term = options.search.toLowerCase();
      records = records.filter((r) =>
        Object.values(r).some((v) => typeof v === 'string' && v.toLowerCase().includes(term)),
      );
    }

    // 3. Apply sort
    if (options.sort) {
      const sortField = options.sort;
      const order = options.order === 'desc' ? -1 : 1;
      records.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (aVal === bVal) return 0;
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * order;
        }
        return String(aVal).localeCompare(String(bVal)) * order;
      });
    }

    // 4. Apply pagination
    const total = records.length;
    const limit = options.limit ?? defaultPageSize ?? DEFAULT_PAGE_SIZE;
    const page = options.page ?? 1;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const start = (page - 1) * limit;
    const paged = records.slice(start, start + limit);

    return { data: paged, total, page, limit, totalPages };
  }

  findById(resource: string, id: number | string): StoreRecord | undefined {
    const records = this.data.get(resource);
    if (!records) return undefined;
    return records.find((r) => String(r.id) === String(id));
  }

  insert(resource: string, record: StoreRecord): StoreRecord {
    if (!this.data.has(resource)) {
      this.data.set(resource, []);
    }
    this.data.get(resource)!.push(record);
    return record;
  }

  update(
    resource: string,
    id: number | string,
    data: Record<string, unknown>,
    merge = false,
  ): StoreRecord | null {
    const records = this.data.get(resource);
    if (!records) return null;

    const index = records.findIndex((r) => String(r.id) === String(id));
    if (index === -1) return null;

    if (merge) {
      // PATCH: shallow merge, preserve id
      records[index] = { ...records[index], ...data, id: records[index].id };
    } else {
      // PUT: full replace, preserve id
      records[index] = { ...data, id: records[index].id } as StoreRecord;
    }

    return records[index];
  }

  remove(resource: string, id: number | string): StoreRecord | null {
    const records = this.data.get(resource);
    if (!records) return null;

    const index = records.findIndex((r) => String(r.id) === String(id));
    if (index === -1) return null;

    const [removed] = records.splice(index, 1);
    return removed;
  }

  snapshot(): StoreData {
    const result: StoreData = {};
    for (const [resource, records] of this.data.entries()) {
      result[resource] = [...records];
    }
    return result;
  }

  getRecordCount(resource: string): number {
    return this.data.get(resource)?.length ?? 0;
  }
}
