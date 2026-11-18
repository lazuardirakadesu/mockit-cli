/**
 * DELETE /api/:resource/:id — Remove a record by ID and persist.
 */

import type { Context } from 'hono';
import type { DataStore } from '../../db/store.js';
import type { Persistence } from '../../db/persistence.js';

export function handleDelete(
  store: DataStore,
  persistence: Persistence,
  resource: string,
) {
  return (c: Context) => {
    const id = c.req.param('id');
    if (!id) {
      return c.json({ error: 'Bad Request', message: 'Missing id parameter' }, 400);
    }

    const removed = store.remove(resource, id);
    if (!removed) {
      return c.json(
        {
          error: 'Not Found',
          message: `${resource} with id "${id}" not found`,
        },
        404,
      );
    }

    persistence.scheduleSave(() => store.snapshot());

    return c.json(removed);
  };
}
