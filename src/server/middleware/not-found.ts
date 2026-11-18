/**
 * 404 handler that lists available resource endpoints as a hint.
 */

import type { NotFoundHandler } from 'hono';
import type { DataStore } from '../../db/store.js';

export function notFoundHandler(store: DataStore): NotFoundHandler {
  return (c) => {
    const resources = store.getResources();
    const available = resources.map((r) => `/api/${r}`).join(', ');

    return c.json(
      {
        error: 'Not Found',
        message: `Route ${c.req.method} ${c.req.path} does not exist`,
        hint: available
          ? `Available resources: ${available}`
          : 'No resources configured',
      },
      404,
    );
  };
}
