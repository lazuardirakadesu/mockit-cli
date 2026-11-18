import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DataStore } from '../../src/db/store.js';
import { Persistence } from '../../src/db/persistence.js';
import { seedStore } from '../../src/db/seed.js';
import { createApp } from '../../src/server/index.js';
import { resolveConfig } from '../../src/config/loader.js';
import type { MockConfig } from '../../src/types/config.js';

describe('Pagination, Filtering, and Sorting Integration', () => {
  const testDb = path.resolve(__dirname, '../fixtures/.query_test.json');

  const config: MockConfig = {
    resources: {
      products: {
        seed: [
          { id: 1, name: 'Apple Mouse', price: 79, category: 'electronics' },
          { id: 2, name: 'Banana Cable', price: 15, category: 'electronics' },
          { id: 3, name: 'Cherry Keyboard', price: 120, category: 'electronics' },
          { id: 4, name: 'Desk Lamp', price: 45, category: 'home' },
          { id: 5, name: 'Ergo Chair', price: 350, category: 'furniture' },
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
    const serverSetup = createApp(resolved, store, persistence);
    app = serverSetup.app;
  });

  afterEach(() => {
    if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
  });

  it('paginates results with _page and _limit and sets Link header', async () => {
    const res = await app.request('/api/products?_page=1&_limit=2');
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toHaveLength(2);
    expect(data[0].id).toBe(1);
    expect(data[1].id).toBe(2);

    expect(res.headers.get('X-Total-Count')).toBe('5');
    const linkHeader = res.headers.get('Link');
    expect(linkHeader).toBeDefined();
    expect(linkHeader).toContain('rel="next"');
  });

  it('filters results by field', async () => {
    const res = await app.request('/api/products?category=electronics');
    const data = await res.json();
    expect(data).toHaveLength(3);
    expect(data.every((p: any) => p.category === 'electronics')).toBe(true);
  });

  it('sorts results ascending and descending', async () => {
    const resAsc = await app.request('/api/products?_sort=price&_order=asc');
    const dataAsc = await resAsc.json();
    expect(dataAsc[0].price).toBe(15);
    expect(dataAsc[dataAsc.length - 1].price).toBe(350);

    const resDesc = await app.request('/api/products?_sort=price&_order=desc');
    const dataDesc = await resDesc.json();
    expect(dataDesc[0].price).toBe(350);
    expect(dataDesc[dataDesc.length - 1].price).toBe(15);
  });

  it('searches full-text with _search', async () => {
    const res = await app.request('/api/products?_search=lamp');
    const data = await res.json();
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe('Desk Lamp');
  });
});
