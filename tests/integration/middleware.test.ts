import { describe, it, expect } from 'vitest';
import { DataStore } from '../../src/db/store.js';
import { Persistence } from '../../src/db/persistence.js';
import { createApp } from '../../src/server/index.js';
import { resolveConfig } from '../../src/config/loader.js';
import type { MockConfig } from '../../src/types/config.js';

describe('Middleware Features: Delay & Chaos', () => {
  it('adds simulated latency with server.delay', async () => {
    const config: MockConfig = {
      server: { delay: 60 },
      resources: { test: { seed: [{ id: 1 }] } },
    };
    const store = new DataStore();
    store.loadAll({ test: [{ id: 1 }] });
    const persistence = new Persistence('.nonexistent.json');
    const resolved = resolveConfig('mock.config.json', config);
    const { app } = createApp(resolved, store, persistence);

    const start = Date.now();
    const res = await app.request('/api/test');
    const elapsed = Date.now() - start;

    expect(res.status).toBe(200);
    expect(elapsed).toBeGreaterThanOrEqual(50);
  });

  it('triggers 500 when chaos error rate is 100%', async () => {
    const config: MockConfig = {
      server: { errorRate: 100 },
      resources: { test: { seed: [{ id: 1 }] } },
    };
    const store = new DataStore();
    store.loadAll({ test: [{ id: 1 }] });
    const persistence = new Persistence('.nonexistent.json');
    const resolved = resolveConfig('mock.config.json', config);
    const { app } = createApp(resolved, store, persistence);

    const res = await app.request('/api/test');
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.chaos).toBe(true);
    expect(body.error).toBe('Internal Server Error');
  });
});
