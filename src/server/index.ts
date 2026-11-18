/**
 * HTTP server bootstrap.
 * Creates a Hono app, wires middleware stack, mounts the dynamic router,
 * and starts listening via @hono/node-server.
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import type { ResolvedConfig, ResourceInfo } from '../types/server.js';
import type { DataStore } from '../db/store.js';
import type { Persistence } from '../db/persistence.js';
import { corsMiddleware } from './middleware/cors.js';
import { delayMiddleware } from './middleware/delay.js';
import { chaosMiddleware } from './middleware/chaos.js';
import { requestLogger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/not-found.js';
import { buildRouter } from './router.js';

export interface ServerInstance {
  close: () => void;
  resourceInfos: ResourceInfo[];
  app: Hono;
}

export function createApp(
  config: ResolvedConfig,
  store: DataStore,
  persistence: Persistence,
): { app: Hono; resourceInfos: ResourceInfo[] } {
  const app = new Hono();

  // ── Global middleware stack (order matters) ─────────────────────────
  if (config.server.cors) {
    app.use('*', corsMiddleware());
  }
  app.use('*', requestLogger());
  app.use('*', delayMiddleware(config.server.delay));
  app.use('*', chaosMiddleware(config.server.errorRate));

  // ── Mount dynamic routes ───────────────────────────────────────────
  const { app: router, resourceInfos } = buildRouter(config, store, persistence);
  app.route('/', router);

  // ── 404 fallback ───────────────────────────────────────────────────
  app.notFound(notFoundHandler(store));

  return { app, resourceInfos };
}

export function createServer(
  config: ResolvedConfig,
  store: DataStore,
  persistence: Persistence,
): ServerInstance {
  const { app, resourceInfos } = createApp(config, store, persistence);

  // ── Start listening ────────────────────────────────────────────────
  const server = serve(
    {
      fetch: app.fetch,
      port: config.server.port,
      hostname: config.server.host,
    },
    () => {
      // Startup log handled by CLI banner — keep this callback empty
    },
  );

  return {
    close: () => {
      server.close();
      persistence.flush(() => store.snapshot());
    },
    resourceInfos,
    app,
  };
}
