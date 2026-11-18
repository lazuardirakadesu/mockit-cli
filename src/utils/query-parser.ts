/**
 * Parse URL search params into structured query options.
 * Params prefixed with _ are reserved for pagination/sorting/search.
 * All other params are treated as exact-match field filters.
 */

import type { QueryOptions } from '../types/store.js';

export function parseQuery(searchParams: URLSearchParams): QueryOptions {
  const page = parseInt(searchParams.get('_page') ?? '', 10);
  const limit = parseInt(searchParams.get('_limit') ?? '', 10);
  const sort = searchParams.get('_sort') ?? undefined;
  const rawOrder = searchParams.get('_order');
  const order: 'asc' | 'desc' | undefined =
    rawOrder === 'desc' ? 'desc' : rawOrder === 'asc' ? 'asc' : undefined;
  const search = searchParams.get('_search') ?? undefined;

  const filters: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (!key.startsWith('_')) {
      filters[key] = value;
    }
  }

  return {
    page: isNaN(page) ? undefined : page,
    limit: isNaN(limit) ? undefined : limit,
    sort,
    order,
    search,
    filters: Object.keys(filters).length > 0 ? filters : undefined,
  };
}
