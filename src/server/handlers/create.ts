/**
 * POST /api/:resource — Create a new record.
 * Auto-assigns ID, validates fields, applies defaults, persists.
 */

import type { Context } from 'hono';
import type { DataStore } from '../../db/store.js';
import type { Persistence } from '../../db/persistence.js';
import type { Resource } from '../../types/config.js';
import type { StoreRecord } from '../../types/store.js';
import { nextId } from '../../utils/id.js';
import { validateBody } from './crud.js';

export function handleCreate(
  store: DataStore,
  persistence: Persistence,
  resource: string,
  definition: Resource,
) {
  return async (c: Context) => {
    let body: Record<string, unknown>;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        { error: 'Bad Request', message: 'Invalid or missing JSON body' },
        400,
      );
    }

    // Validate fields if rules are defined
    const errors = validateBody(body, definition);
    if (errors.length > 0) {
      return c.json({ error: 'Validation Error', messages: errors }, 422);
    }

    // Apply field defaults
    if (definition.fields) {
      for (const [field, rule] of Object.entries(definition.fields)) {
        if (rule.default !== undefined && body[field] === undefined) {
          body[field] = rule.default;
        }
      }
    }

    // Auto-assign ID if not provided
    const hasAutoId = definition.fields?.id?.auto !== false;
    if (hasAutoId && body.id === undefined) {
      body.id = nextId(resource);
    }

    // Check unique constraints
    if (definition.fields) {
      for (const [field, rule] of Object.entries(definition.fields)) {
        if (rule.unique && body[field] !== undefined) {
          const existing = store
            .getAll(resource)
            .find((r) => r[field] === body[field]);
          if (existing) {
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

    const record = store.insert(resource, body as StoreRecord);
    persistence.scheduleSave(() => store.snapshot());

    return c.json(record, 201);
  };
}
