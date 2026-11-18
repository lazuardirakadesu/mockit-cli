import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { DataStore } from '../../src/db/store.js';
import { Persistence } from '../../src/db/persistence.js';
import { seedStore } from '../../src/db/seed.js';
import { createApp } from '../../src/server/index.js';
import { resolveConfig } from '../../src/config/loader.js';
import type { MockConfig } from '../../src/types/config.js';

describe('Persistence Across Server Restarts', () => {
  const testDb = path.resolve(__dirname, '../fixtures/.persist_restart_test.json');

  const config: MockConfig = {
    resources: {
      notes: {
        seed: [
          { id: 1, text: 'Note 1' },
        ],
      },
    },
  };

  beforeEach(() => {
    if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
  });

  afterEach(() => {
    if (fs.existsSync(testDb)) fs.unlinkSync(testDb);
  });

  it('persists mutations to file and recovers state on next boot', async () => {
    // ── Session 1: Start, create record, flush ────────────────────────
    const store1 = new DataStore();
    const persistence1 = new Persistence(testDb, 10);
    seedStore(store1, persistence1, config);

    const resolved = resolveConfig('mock.config.json', config);
    const { app: app1 } = createApp(resolved, store1, persistence1);

    // Create a new note
    const postRes = await app1.request('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'Note 2' }),
    });
    expect(postRes.status).toBe(201);

    // Explicitly flush to disk
    persistence1.flush(() => store1.snapshot());
    expect(fs.existsSync(testDb)).toBe(true);

    // ── Session 2: "Restart" with fresh store & fresh app ─────────────
    const store2 = new DataStore();
    const persistence2 = new Persistence(testDb, 10);
    seedStore(store2, persistence2, config); // Will read from testDb!

    const { app: app2 } = createApp(resolved, store2, persistence2);

    const getRes = await app2.request('/api/notes');
    expect(getRes.status).toBe(200);
    const notes = await getRes.json();

    expect(notes).toHaveLength(2);
    expect(notes[0].text).toBe('Note 1');
    expect(notes[1].text).toBe('Note 2');
    expect(notes[1].id).toBe(2);
  });
});
