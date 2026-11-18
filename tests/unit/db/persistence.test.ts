import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { Persistence } from '../../../src/db/persistence.js';

describe('Persistence', () => {
  const testDbPath = path.resolve(__dirname, '../../fixtures/.testdb.json');

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('detects when db file does not exist', () => {
    const p = new Persistence(testDbPath);
    expect(p.exists()).toBe(false);
  });

  it('saves and loads data synchronously', () => {
    const p = new Persistence(testDbPath);
    const data = {
      items: [{ id: 1, name: 'Sample' }],
    };

    p.saveSync(data);
    expect(p.exists()).toBe(true);

    const loaded = p.load();
    expect(loaded).toEqual(data);
  });

  it('deletes the db file', () => {
    const p = new Persistence(testDbPath);
    p.saveSync({ test: [] });
    expect(p.exists()).toBe(true);

    p.delete();
    expect(p.exists()).toBe(false);
  });
});
