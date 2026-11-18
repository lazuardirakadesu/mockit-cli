import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DataStore } from '../../src/db/store.js';
import { Persistence } from '../../src/db/persistence.js';
import { seedStore } from '../../src/db/seed.js';
import { createApp } from '../../src/server/index.js';
import { resolveConfig } from '../../src/config/loader.js';
import type { MockConfig } from '../../src/types/config.js';

describe('CRUD Lifecycle Integration', () => {
  const testDb = path.resolve(__dirname, '../fixtures/.crud_test.json');

  const config: MockConfig = {
    resources: {
      users: {
        seed: [
          { id: 1, name: 'Alice', email: 'alice@test.com', role: 'admin' },
          { id: 2, name: 'Bob', email: 'bob@test.com', role: 'user' },
        ],
        fields: {
          id: { type: 'number', auto: true },
          name: { type: 'string', required: true },
          email: { type: 'string', required: true, unique: true },
          role: { type: 'string', enum: ['admin', 'user'], default: 'user' },
        },
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
    const serverSetup = createApp(resolved, store, persistence);
    app = serverSetup.app;
  });

  afterEach(() => {
    if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
  });

  it('GET /api/users returns initial seeded records', async () => {
    const res = await app.request('/api/users');
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].name).toBe('Alice');
    expect(res.headers.get('X-Total-Count')).toBe('2');
  });

  it('GET /api/users/:id returns single record or 404', async () => {
    const res1 = await app.request('/api/users/1');
    expect(res1.status).toBe(200);
    const body1 = await res1.json();
    expect(body1.name).toBe('Alice');

    const res2 = await app.request('/api/users/999');
    expect(res2.status).toBe(404);
  });

  it('POST /api/users creates a record with auto-id and default values', async () => {
    const res = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Charlie',
        email: 'charlie@test.com',
      }),
    });

    expect(res.status).toBe(201);
    const created = await res.json();
    expect(created.id).toBe(3);
    expect(created.role).toBe('user'); // default value
    expect(created.name).toBe('Charlie');

    // Confirm listed
    const listRes = await app.request('/api/users');
    const list = await listRes.json();
    expect(list).toHaveLength(3);
  });

  it('POST /api/users rejects missing required fields (422)', async () => {
    const res = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'No Email',
      }),
    });

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe('Validation Error');
  });

  it('POST /api/users enforces unique field constraint (409)', async () => {
    const res = await app.request('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Alice',
        email: 'alice@test.com',
      }),
    });

    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe('Conflict');
  });

  it('PUT /api/users/:id replaces record fully', async () => {
    const res = await app.request('/api/users/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice Replaced',
        email: 'alice_new@test.com',
        role: 'admin',
      }),
    });

    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.name).toBe('Alice Replaced');
    expect(updated.id).toBe(1); // preserves ID
  });

  it('PATCH /api/users/:id partially updates record', async () => {
    const res = await app.request('/api/users/2', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'admin',
      }),
    });

    expect(res.status).toBe(200);
    const updated = await res.json();
    expect(updated.name).toBe('Bob'); // untouched
    expect(updated.role).toBe('admin'); // updated
  });

  it('DELETE /api/users/:id deletes the record', async () => {
    const res = await app.request('/api/users/1', {
      method: 'DELETE',
    });

    expect(res.status).toBe(200);
    const deleted = await res.json();
    expect(deleted.id).toBe(1);

    // Verify gone
    const checkRes = await app.request('/api/users/1');
    expect(checkRes.status).toBe(404);
  });
});
