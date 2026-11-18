/**
 * GET /api/:resource/:id — Get a single record by ID.
 */

import type { Context } from 'hono';
import type { DataStore } from '../../db/store.js';

export function handleDetail(store: DataStore, resource: string) {
  return (c: Context) => {
    const id = c.req.param('id');
    if (!id) {
      return c.json({ error: 'Bad Request', message: 'Missing id parameter' }, 400);
    }
    const record = store.findById(resource, id);

    if (!record) {
      return c.json(
        {
          error: 'Not Found',
          message: `${resource} with id "${id}" not found`,
        },
        404,
      );
    }

    return c.json(record);
  };
}
