/**
 * Dynamic route generator.
 * Mounts custom static routes first, then mounts dynamic CRUD handlers on /api/:resource
 * that resolve dynamically against the in-memory store.
 */

import { Hono } from 'hono';
import type { Context } from 'hono';
import type { ResolvedConfig, ResourceInfo } from '../types/server.js';
import type { DataStore } from '../db/store.js';
import type { Persistence } from '../db/persistence.js';
import { handleList } from './handlers/list.js';
import { handleDetail } from './handlers/detail.js';
import { handleCreate } from './handlers/create.js';
import { handleUpdate } from './handlers/update.js';
import { handleDelete } from './handlers/delete.js';

export function buildRouter(
  config: ResolvedConfig,
  store: DataStore,
  persistence: Persistence,
): { app: Hono; resourceInfos: ResourceInfo[] } {
  const app = new Hono();

  // ── 1. Custom static routes ─────────────────────────────────────────
  for (const [routeKey, routeDef] of Object.entries(config.routes)) {
    const spaceIndex = routeKey.indexOf(' ');
    if (spaceIndex === -1) continue;

    const method = routeKey.slice(0, spaceIndex).toUpperCase();
    const routePath = routeKey.slice(spaceIndex + 1);

    if (!routePath) continue;

    const handler = (c: Context) => {
      if (routeDef.headers) {
        for (const [key, value] of Object.entries(routeDef.headers)) {
          c.header(key, value);
        }
      }

      let body = routeDef.body;
      if (typeof body === 'object' && body !== null) {
        const json = JSON.stringify(body)
          .replace(/\{\{uptime\}\}/g, String(Math.floor(process.uptime())))
          .replace(/\{\{timestamp\}\}/g, String(Date.now()));
        body = JSON.parse(json);
      }

      const statusCode = routeDef.status as 200;
      return c.json(body ?? null, statusCode);
    };

    switch (method) {
      case 'GET':
        app.get(routePath, handler);
        break;
      case 'POST':
        app.post(routePath, handler);
        break;
      case 'PUT':
        app.put(routePath, handler);
        break;
      case 'PATCH':
        app.patch(routePath, handler);
        break;
      case 'DELETE':
        app.delete(routePath, handler);
        break;
    }
  }

  // ── 2. Dynamic CRUD routing on /api/:resource and /api/:resource/:id ──
  // GET /api/:resource — List
  app.get('/api/:resource', async (c, next) => {
    const resource = c.req.param('resource');
    if (!store.hasResource(resource)) {
      return next();
    }
    const definition = config.resources[resource] ?? {};
    const allowedMethods = definition.options?.allowedMethods ?? [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
    ];
    if (!allowedMethods.includes('GET')) {
      return c.json({ error: 'Method Not Allowed' }, 405);
    }
    return handleList(store, resource, definition)(c);
  });

  // GET /api/:resource/:id — Detail
  app.get('/api/:resource/:id', async (c, next) => {
    const resource = c.req.param('resource');
    if (!store.hasResource(resource)) {
      return next();
    }
    const definition = config.resources[resource] ?? {};
    const allowedMethods = definition.options?.allowedMethods ?? [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
    ];
    if (!allowedMethods.includes('GET')) {
      return c.json({ error: 'Method Not Allowed' }, 405);
    }
    return handleDetail(store, resource)(c);
  });

  // POST /api/:resource — Create
  app.post('/api/:resource', async (c, next) => {
    const resource = c.req.param('resource');
    if (!store.hasResource(resource)) {
      return next();
    }
    const definition = config.resources[resource] ?? {};
    const allowedMethods = definition.options?.allowedMethods ?? [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
    ];
    const isReadOnly = definition.options?.readOnly ?? false;
    if (isReadOnly || !allowedMethods.includes('POST')) {
      return c.json({ error: 'Method Not Allowed' }, 405);
    }
    return handleCreate(store, persistence, resource, definition)(c);
  });

  // PUT /api/:resource/:id — Full replace
  app.put('/api/:resource/:id', async (c, next) => {
    const resource = c.req.param('resource');
    if (!store.hasResource(resource)) {
      return next();
    }
    const definition = config.resources[resource] ?? {};
    const allowedMethods = definition.options?.allowedMethods ?? [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
    ];
    const isReadOnly = definition.options?.readOnly ?? false;
    if (isReadOnly || !allowedMethods.includes('PUT')) {
      return c.json({ error: 'Method Not Allowed' }, 405);
    }
    return handleUpdate(store, persistence, resource, definition, false)(c);
  });

  // PATCH /api/:resource/:id — Partial merge
  app.patch('/api/:resource/:id', async (c, next) => {
    const resource = c.req.param('resource');
    if (!store.hasResource(resource)) {
      return next();
    }
    const definition = config.resources[resource] ?? {};
    const allowedMethods = definition.options?.allowedMethods ?? [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
    ];
    const isReadOnly = definition.options?.readOnly ?? false;
    if (isReadOnly || !allowedMethods.includes('PATCH')) {
      return c.json({ error: 'Method Not Allowed' }, 405);
    }
    return handleUpdate(store, persistence, resource, definition, true)(c);
  });

  // DELETE /api/:resource/:id — Remove
  app.delete('/api/:resource/:id', async (c, next) => {
    const resource = c.req.param('resource');
    if (!store.hasResource(resource)) {
      return next();
    }
    const definition = config.resources[resource] ?? {};
    const allowedMethods = definition.options?.allowedMethods ?? [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
    ];
    const isReadOnly = definition.options?.readOnly ?? false;
    if (isReadOnly || !allowedMethods.includes('DELETE')) {
      return c.json({ error: 'Method Not Allowed' }, 405);
    }
    return handleDelete(store, persistence, resource)(c);
  });

  // ── Build startup resource info list ─────────────────────────────────
  const resourceInfos: ResourceInfo[] = store.getResources().map((name) => {
    const def = config.resources[name];
    const allowed = def?.options?.allowedMethods ?? [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
    ];
    const isReadOnly = def?.options?.readOnly ?? false;
    const methods = allowed.filter((m) => m === 'GET' || !isReadOnly);
    return {
      name,
      recordCount: store.getRecordCount(name),
      methods,
    };
  });

  return { app, resourceInfos };
}
