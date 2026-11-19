/**
 * Internal Studio API and static UI serving for MockIt Web Studio Dashboard.
 * Mounted at /_api/studio/* and /_studio/*
 */

import fs from 'node:fs';
import path from 'node:path';
import { Hono } from 'hono';
import type { ResolvedConfig } from '../types/server.js';
import type { MockConfig } from '../types/config.js';
import type { DataStore } from '../db/store.js';
import type { Persistence } from '../db/persistence.js';
import type { RequestLogBuffer } from './middleware/logger.js';
import { seedStore } from '../db/seed.js';

export function resolveUiDir(): string | null {
  const baseDirs: string[] = [];
  if (typeof __dirname !== 'undefined') {
    baseDirs.push(
      path.resolve(__dirname, '../../dist/ui'),
      path.resolve(__dirname, '../ui'),
    );
  }
  baseDirs.push(
    path.resolve(process.cwd(), 'dist/ui'),
    path.resolve(process.cwd(), 'ui/dist'),
  );

  for (const dir of baseDirs) {
    if (fs.existsSync(dir) && fs.existsSync(path.join(dir, 'index.html'))) {
      return dir;
    }
  }
  return null;
}

export function createStudioRouter(
  config: ResolvedConfig,
  store: DataStore,
  persistence: Persistence,
  rawConfig?: MockConfig,
  logBuffer?: RequestLogBuffer,
): Hono {
  const app = new Hono();

  // ── GET /_api/studio/state ──────────────────────────────────────────
  app.get('/_api/studio/state', (c) => {
    const resourceNames = store.getResources();
    const resources: Record<string, unknown[]> = {};
    for (const name of resourceNames) {
      resources[name] = store.getAll(name);
    }

    return c.json({
      resourceNames,
      resources,
      settings: {
        port: config.server.port,
        host: config.server.host,
        delay: config.server.delay,
        errorRate: config.server.errorRate,
        ui: config.server.ui !== false,
      },
      logs: logBuffer ? logBuffer.getAll() : [],
    });
  });

  // ── PATCH /_api/studio/config ───────────────────────────────────────
  app.patch('/_api/studio/config', async (c) => {
    let body: Record<string, unknown>;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'Bad Request', message: 'Invalid JSON body' }, 400);
    }

    if (body.delay !== undefined) {
      const delay = Number(body.delay);
      if (isNaN(delay) || delay < 0) {
        return c.json(
          { error: 'Bad Request', message: 'delay must be a non-negative number' },
          400,
        );
      }
      config.server.delay = delay;
    }

    if (body.errorRate !== undefined) {
      const errorRate = Number(body.errorRate);
      if (isNaN(errorRate) || errorRate < 0 || errorRate > 100) {
        return c.json(
          { error: 'Bad Request', message: 'errorRate must be between 0 and 100' },
          400,
        );
      }
      config.server.errorRate = errorRate;
    }

    return c.json({
      success: true,
      settings: {
        port: config.server.port,
        host: config.server.host,
        delay: config.server.delay,
        errorRate: config.server.errorRate,
        ui: config.server.ui !== false,
      },
    });
  });

  // ── POST /_api/studio/reset ─────────────────────────────────────────
  app.post('/_api/studio/reset', (c) => {
    const seedSource = rawConfig ?? config;
    seedStore(store, persistence, seedSource, true);

    return c.json({
      success: true,
      message: 'Database reset to initial seed data',
    });
  });

  // ── Static Web Studio Dashboard Serving ────────────────────────────
  if (config.server.ui !== false) {
    app.get('/_studio', (c) => c.redirect('/_studio/'));

    app.get('/_studio/*', (c) => {
      const uiDir = resolveUiDir();
      if (!uiDir) {
        return c.html(
          `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>MockIt Studio</title>
    <style>
      body {
        background: #09090B;
        color: #F4F4F5;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        margin: 0;
      }
      .card {
        background: #111113;
        border: 1px solid #27272A;
        border-radius: 8px;
        padding: 32px;
        text-align: center;
        max-width: 480px;
      }
      h1 { font-size: 20px; margin-bottom: 8px; }
      p { color: #A1A1AA; font-size: 14px; line-height: 1.6; }
      code { background: #18181B; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #38BDF8; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>⚡ MockIt Studio</h1>
      <p>Studio frontend assets are not yet built. Please run <code>npm run build</code> to generate the dashboard bundle.</p>
    </div>
  </body>
</html>`,
          200,
        );
      }

      // Determine requested relative path inside uiDir
      const subPath = c.req.path.replace(/^\/_studio\/?/, '') || 'index.html';
      const safePath = path.normalize(subPath).replace(/^(\.\.[\/\\])+/, '');
      let targetFile = path.join(uiDir, safePath);

      if (!fs.existsSync(targetFile) || fs.statSync(targetFile).isDirectory()) {
        targetFile = path.join(uiDir, 'index.html');
      }

      const ext = path.extname(targetFile).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
      };

      c.header('Content-Type', mimeTypes[ext] || 'application/octet-stream');
      return c.body(fs.readFileSync(targetFile));
    });
  }

  return app;
}
