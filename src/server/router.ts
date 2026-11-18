/**
 * Dynamic route generator.
 * Iterates config.resources to register 6 CRUD routes per resource,
 * then registers static custom routes from config.routes.
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
  const resourceInfos: ResourceInfo[] = [];

  // ── CRUD routes for each resource ──────────────────────────────────
  for (const [resource, definition] of Object.entries(config.resources)) {
    const basePath = `/api/${resource}`;
    const allowedMethods = definition.options?.allowedMethods ?? [
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
    ];
    const isReadOnly = definition.options?.readOnly ?? false;
    const methods: string[] = [];

    // GET — List & Detail
    if (allowedMethods.includes('GET')) {
      app.get(basePath, handleList(store, resource, definition));
      app.get(`${basePath}/:id`, handleDetail(store, resource));
      methods.push('GET');
    }

    if (!isReadOnly) {
      // POST — Create
      if (allowedMethods.includes('POST')) {
        app.post(basePath, handleCreate(store, persistence, resource, definition));
        methods.push('POST');
      }

      // PUT — Full replace
      if (allowedMethods.includes('PUT')) {
        app.put(
          `${basePath}/:id`,
          handleUpdate(store, persistence, resource, definition, false),
        );
        methods.push('PUT');
      }

      // PATCH — Partial update
      if (allowedMethods.includes('PATCH')) {
        app.patch(
          `${basePath}/:id`,
          handleUpdate(store, persistence, resource, definition, true),
        );
        methods.push('PATCH');
      }

      // DELETE — Remove
      if (allowedMethods.includes('DELETE')) {
        app.delete(
          `${basePath}/:id`,
          handleDelete(store, persistence, resource),
        );
        methods.push('DELETE');
      }
    }

    resourceInfos.push({
      name: resource,
      recordCount: store.getRecordCount(resource),
      methods,
    });
  }

  // ── Custom static routes ───────────────────────────────────────────
  for (const [routeKey, routeDef] of Object.entries(config.routes)) {
    const spaceIndex = routeKey.indexOf(' ');
    if (spaceIndex === -1) continue;

    const method = routeKey.slice(0, spaceIndex).toUpperCase();
    const routePath = routeKey.slice(spaceIndex + 1);

    if (!routePath) continue;

    const handler = (c: Context) => {
      // Set custom headers
      if (routeDef.headers) {
        for (const [key, value] of Object.entries(routeDef.headers)) {
          c.header(key, value);
        }
      }

      // Simple template replacements in body
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

  return { app, resourceInfos };
}
