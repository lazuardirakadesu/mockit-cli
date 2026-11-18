import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DataStore } from '../../src/db/store.js';
import { Persistence } from '../../src/db/persistence.js';
import { seedStore } from '../../src/db/seed.js';
import { createApp } from '../../src/server/index.js';
import { resolveConfig } from '../../src/config/loader.js';
import type { MockConfig } from '../../src/types/config.js';

describe('Custom Routes & DX Features', () => {
  const testDb = path.resolve(__dirname, '../fixtures/.custom_routes_test.json');

  const config: MockConfig = {
    resources: {
      items: {
        seed: [{ id: 1, name: 'Item 1' }],
      },
    },
    routes: {
      'GET /api/health': {
        status: 200,
        body: { status: 'healthy', uptime: '{{uptime}}' },
      },
      'POST /api/auth/token': {
        status: 200,
        headers: { 'X-Auth-Version': 'v1' },
        body: { token: 'jwt-{{timestamp}}' },
      },
      'GET /api/maintenance': {
        status: 503,
        body: { error: 'Under maintenance' },
      },
    },
  };

  let app: ReturnType<typeof createApp>['app'];

  beforeEach(() => {
    if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
    const store = new DataStore();
    const persistence = new Persistence(testDb, 10);
    seedStore(store, persistence, config);
    const resolved = resolveConfig('mock.config.json', config);
    app = createApp(resolved, store, persistence).app;
  });

  afterEach(() => {
    if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
  });

  it('handles custom GET route with template replacement', async () => {
    const res = await app.request('/api/health');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe('healthy');
    expect(typeof body.uptime).toBe('string');
  });

  it('handles custom POST route with custom headers', async () => {
    const res = await app.request('/api/auth/token', { method: 'POST' });
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Auth-Version')).toBe('v1');

    const body = await res.json();
    expect(body.token).toMatch(/^jwt-\d+$/);
  });

  it('handles custom error status code', async () => {
    const res = await app.request('/api/maintenance');
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.error).toBe('Under maintenance');
  });

  it('returns informative 404 with hints for unmapped routes', async () => {
    const res = await app.request('/api/does-not-exist');
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Not Found');
    expect(body.hint).toContain('/api/items');
  });
});
