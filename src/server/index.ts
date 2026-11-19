/**
 * HTTP server bootstrap.
 * Creates a Hono app, wires middleware stack, mounts the dynamic router and Studio API,
 * and starts listening via @hono/node-server.
 */

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import type { ResolvedConfig, ResourceInfo } from '../types/server.js';
import type { MockConfig } from '../types/config.js';
import type { DataStore } from '../db/store.js';
import type { Persistence } from '../db/persistence.js';
import { corsMiddleware } from './middleware/cors.js';
import { delayMiddleware } from './middleware/delay.js';
import { chaosMiddleware } from './middleware/chaos.js';
import { RequestLogBuffer, requestLogger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/not-found.js';
import { buildRouter } from './router.js';
import { createStudioRouter } from './studio.js';

export interface ServerInstance {
  close: () => void;
  resourceInfos: ResourceInfo[];
  app: Hono;
  logBuffer: RequestLogBuffer;
}

export function createApp(
  config: ResolvedConfig,
  store: DataStore,
  persistence: Persistence,
  rawConfig?: MockConfig,
  customLogBuffer?: RequestLogBuffer,
): { app: Hono; resourceInfos: ResourceInfo[]; logBuffer: RequestLogBuffer } {
  const app = new Hono();
  const logBuffer = customLogBuffer ?? new RequestLogBuffer(100);

  // ── Global middleware stack (order matters) ─────────────────────────
  if (config.server.cors) {
    app.use('*', corsMiddleware());
  }
  app.use('*', requestLogger(logBuffer));
  app.use('*', delayMiddleware(() => config.server.delay));
  app.use('*', chaosMiddleware(() => config.server.errorRate));

  // ── Mount Web Studio & Studio API routes ───────────────────────────
  const studioRouter = createStudioRouter(
    config,
    store,
    persistence,
    rawConfig,
    logBuffer,
  );
  app.route('/', studioRouter);

  // ── Mount dynamic CRUD routes ───────────────────────────────────────
  const { app: router, resourceInfos } = buildRouter(config, store, persistence);
  app.route('/', router);

  // ── 404 fallback ───────────────────────────────────────────────────
  app.notFound(notFoundHandler(store));

  return { app, resourceInfos, logBuffer };
}

export function createServer(
  config: ResolvedConfig,
  store: DataStore,
  persistence: Persistence,
  rawConfig?: MockConfig,
): ServerInstance {
  const logBuffer = new RequestLogBuffer(100);
  const { app, resourceInfos } = createApp(
    config,
    store,
    persistence,
    rawConfig,
    logBuffer,
  );

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
    logBuffer,
  };
}
