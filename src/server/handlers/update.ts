/**
 * PUT /api/:resource/:id  — Full replace (validates required fields).
 * PATCH /api/:resource/:id — Partial merge (skips required validation).
 */

import type { Context } from 'hono';
import type { DataStore } from '../../db/store.js';
import type { Persistence } from '../../db/persistence.js';
import type { Resource } from '../../types/config.js';
import { validateBody } from './crud.js';

export function handleUpdate(
  store: DataStore,
  persistence: Persistence,
  resource: string,
  definition: Resource,
  merge: boolean,
) {
  return async (c: Context) => {
    const id = c.req.param('id');
    if (!id) {
      return c.json({ error: 'Bad Request', message: 'Missing id parameter' }, 400);
    }

    // Check existence
    const existing = store.findById(resource, id);
    if (!existing) {
      return c.json(
        {
          error: 'Not Found',
          message: `${resource} with id "${id}" not found`,
        },
        404,
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        { error: 'Bad Request', message: 'Invalid or missing JSON body' },
        400,
      );
    }

    // For PUT (full replace), validate required fields
    // For PATCH (merge), skip required checks since it's a partial update
    if (!merge) {
      const errors = validateBody(body, definition);
      if (errors.length > 0) {
        return c.json({ error: 'Validation Error', messages: errors }, 422);
      }
    }

    // Check unique constraints for changed fields
    if (definition.fields) {
      for (const [field, rule] of Object.entries(definition.fields)) {
        if (rule.unique && body[field] !== undefined && body[field] !== existing[field]) {
          const conflict = store
            .getAll(resource)
            .find((r) => r[field] === body[field] && String(r.id) !== String(id));
          if (conflict) {
            return c.json(
              {
                error: 'Conflict',
                message: `${resource} with ${field} "${body[field]}" already exists`,
              },
              409,
            );
          }
        }
      }
    }

    const updated = store.update(resource, id, body, merge);
    persistence.scheduleSave(() => store.snapshot());

    return c.json(updated);
  };
}
