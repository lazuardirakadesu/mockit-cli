/**
 * GET /api/:resource — List with pagination, sort, filter, search.
 * Returns array + X-Total-Count header + Link header for pagination.
 */

import type { Context } from 'hono';
import type { DataStore } from '../../db/store.js';
import type { Resource } from '../../types/config.js';
import { parseQuery } from '../../utils/query-parser.js';

export function handleList(store: DataStore, resource: string, definition: Resource) {
  return (c: Context) => {
    const url = new URL(c.req.url);
    const options = parseQuery(url.searchParams);
    const pageSize = definition.options?.pageSize;
    const result = store.query(resource, options, pageSize);

    // Set total count header
    c.header('X-Total-Count', String(result.total));

    // Build RFC 5988 Link header for pagination
    const baseUrl = `${url.origin}${url.pathname}`;
    const links: string[] = [];

    if (result.page < result.totalPages) {
      links.push(
        `<${baseUrl}?_page=${result.page + 1}&_limit=${result.limit}>; rel="next"`,
      );
      links.push(
        `<${baseUrl}?_page=${result.totalPages}&_limit=${result.limit}>; rel="last"`,
      );
    }
    if (result.page > 1) {
      links.push(
        `<${baseUrl}?_page=${result.page - 1}&_limit=${result.limit}>; rel="prev"`,
      );
      links.push(`<${baseUrl}?_page=1&_limit=${result.limit}>; rel="first"`);
    }

    if (links.length > 0) {
      c.header('Link', links.join(', '));
    }

    return c.json(result.data);
  };
}
