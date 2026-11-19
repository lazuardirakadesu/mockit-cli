import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DataStore } from '../../src/db/store.js';
import { Persistence } from '../../src/db/persistence.js';
import { seedStore } from '../../src/db/seed.js';
import { createApp } from '../../src/server/index.js';
import { resolveConfig } from '../../src/config/loader.js';
import type { MockConfig } from '../../src/types/config.js';

describe('Studio API Integration (/_api/studio/*)', () => {
  const testDb = path.resolve(__dirname, '../fixtures/.studio_test.json');

  const config: MockConfig = {
    server: {
      port: 5050,
      delay: 0,
      errorRate: 0,
      ui: true,
    },
    resources: {
      products: {
        seed: [
          { id: 1, name: 'Monitor', price: 299 },
          { id: 2, name: 'Mouse', price: 49 },
        ],
      },
    },
  };

  let store: DataStore;
  let persistence: Persistence;
  let app: ReturnType<typeof createApp>['app'];

  beforeEach(() => {
    if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
    store = new DataStore();
    persistence = new Persistence(testDb, 10);
    seedStore(store, persistence, config);

    const resolved = resolveConfig('mock.config.json', config);
    app = createApp(resolved, store, persistence, config).app;
  });

  afterEach(() => {
    if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
  });

  it('GET /_api/studio/state returns complete studio state', async () => {
    // Generate a request log
    await app.request('/api/products');

    const res = await app.request('/_api/studio/state');
    expect(res.status).toBe(200);

    const state = await res.json();
    expect(state.resourceNames).toContain('products');
    expect(state.resources.products).toHaveLength(2);
    expect(state.settings.port).toBe(5050);
    expect(state.settings.delay).toBe(0);
    expect(state.settings.ui).toBe(true);

    // Verify request logs include the /api/products call
    expect(state.logs.length).toBeGreaterThanOrEqual(1);
    expect(state.logs[0].path).toBe('/api/products');
    expect(state.logs[0].method).toBe('GET');
  });

  it('PATCH /_api/studio/config dynamically modifies delay and errorRate', async () => {
    const patchRes = await app.request('/_api/studio/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delay: 120, errorRate: 25 }),
    });

    expect(patchRes.status).toBe(200);
    const body = await patchRes.json();
    expect(body.success).toBe(true);
    expect(body.settings.delay).toBe(120);
    expect(body.settings.errorRate).toBe(25);

    // Verify state reflects the change
    const stateRes = await app.request('/_api/studio/state');
    const state = await stateRes.json();
    expect(state.settings.delay).toBe(120);
    expect(state.settings.errorRate).toBe(25);
  });

  it('PATCH /_api/studio/config validates bad inputs', async () => {
    const resNegative = await app.request('/_api/studio/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delay: -10 }),
    });
    expect(resNegative.status).toBe(400);

    const resOverErrorRate = await app.request('/_api/studio/config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ errorRate: 150 }),
    });
    expect(resOverErrorRate.status).toBe(400);
  });

  it('POST /_api/studio/reset reverts mutations back to initial seed data', async () => {
    // Mutate state: Add a 3rd product
    await app.request('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Keyboard', price: 99 }),
    });

    // Verify 3 items exist
    const listRes = await app.request('/api/products');
    const list = await listRes.json();
    expect(list).toHaveLength(3);

    // Call reset
    const resetRes = await app.request('/_api/studio/reset', { method: 'POST' });
    expect(resetRes.status).toBe(200);

    // Verify back to 2 items
    const afterResetRes = await app.request('/api/products');
    const afterReset = await afterResetRes.json();
    expect(afterReset).toHaveLength(2);
    expect(afterReset[0].name).toBe('Monitor');
    expect(afterReset[1].name).toBe('Mouse');
  });

  it('POST /api/:resource places auto-assigned id as the first key in the object', async () => {
    const res = await app.request('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Headphones', price: 150 }),
    });

    expect(res.status).toBe(201);
    const record = await res.json();
    const keys = Object.keys(record);
    expect(keys[0]).toBe('id');
  });

  it('GET /_studio serves dashboard fallback HTML or redirects', async () => {
    const redirectRes = await app.request('/_studio');
    expect(redirectRes.status).toBe(302);
    expect(redirectRes.headers.get('Location')).toBe('/_studio/');

    const studioRes = await app.request('/_studio/');
    expect(studioRes.status).toBe(200);
    const html = await studioRes.text();
    expect(html).toContain('MockIt Studio');
  });

  it('POST /_api/studio/resources dynamically creates a collection and immediately enables /api/:name', async () => {
    // 1. Create a new collection 'orders'
    const createRes = await app.request('/_api/studio/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'orders',
        seed: [{ customer: 'Alice', total: 120 }, { customer: 'Bob', total: 250 }],
      }),
    });

    expect(createRes.status).toBe(201);
    const createBody = await createRes.json();
    expect(createBody.success).toBe(true);
    expect(createBody.resource.name).toBe('orders');
    expect(createBody.resource.recordCount).toBe(2);

    // 2. Immediately query GET /api/orders
    const listRes = await app.request('/api/orders');
    expect(listRes.status).toBe(200);
    const list = await listRes.json();
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe(1);
    expect(list[0].customer).toBe('Alice');

    // 3. Immediately test POST /api/orders
    const postRes = await app.request('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer: 'Charlie', total: 400 }),
    });
    expect(postRes.status).toBe(201);
    const newOrder = await postRes.json();
    expect(newOrder.id).toBe(3);

    // 4. Verify in GET /_api/studio/state
    const stateRes = await app.request('/_api/studio/state');
    const state = await stateRes.json();
    expect(state.resourceNames).toContain('orders');
    expect(state.resources.orders).toHaveLength(3);
  });

  it('POST /_api/studio/resources validates name and conflicts', async () => {
    // Conflict with existing
    const conflictRes = await app.request('/_api/studio/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'products' }),
    });
    expect(conflictRes.status).toBe(409);

    // Invalid characters
    const invalidRes = await app.request('/_api/studio/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'invalid collection name!' }),
    });
    expect(invalidRes.status).toBe(400);
  });

  it('DELETE /_api/studio/resources/:name deletes a collection and deactivates /api/:name', async () => {
    // First create collection
    await app.request('/_api/studio/resources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'temp_items' }),
    });

    const checkRes = await app.request('/api/temp_items');
    expect(checkRes.status).toBe(200);

    // Delete it
    const deleteRes = await app.request('/_api/studio/resources/temp_items', {
      method: 'DELETE',
    });
    expect(deleteRes.status).toBe(200);

    // Querying /api/temp_items should now 404
    const afterDeleteRes = await app.request('/api/temp_items');
    expect(afterDeleteRes.status).toBe(404);
  });
});
