/**
 * Seed the in-memory store from config seed data or persisted .mockdb.json.
 * On first run: deep-clone seed → store → persist.
 * On restart: load persisted data, adding any new resources from config.
 */

import type { MockConfig } from '../types/config.js';
import type { StoreRecord } from '../types/store.js';
import { DataStore } from './store.js';
import { Persistence } from './persistence.js';
import { initIdCounter } from '../utils/id.js';
import { deepClone } from '../utils/deep-clone.js';
import { log } from '../utils/logger.js';

export function seedStore(
  store: DataStore,
  persistence: Persistence,
  config: MockConfig,
): void {
  if (persistence.exists()) {
    // Restore persisted state
    const persisted = persistence.load();
    store.loadAll(persisted);
    log.success(`Loaded persisted data from ${persistence.getPath()}`);

    // Initialize ID counters from persisted data
    for (const [resource, records] of Object.entries(persisted)) {
      initIdCounter(resource, records as StoreRecord[]);
    }

    // Add any new resources from config that don't exist in persisted data
    if (config.resources) {
      let addedNew = false;
      for (const [resource, definition] of Object.entries(config.resources)) {
        if (!persisted[resource]) {
          const seed = deepClone(definition.seed ?? []) as StoreRecord[];
          const currentSnapshot = store.snapshot();
          currentSnapshot[resource] = seed;
          store.loadAll(currentSnapshot);
          initIdCounter(resource, seed);
          addedNew = true;
        }
      }
      if (addedNew) {
        persistence.saveSync(store.snapshot());
      }
    }
  } else {
    // First run: seed from config
    const data: Record<string, StoreRecord[]> = {};
    let totalRecords = 0;

    if (config.resources) {
      for (const [resource, definition] of Object.entries(config.resources)) {
        const seed = deepClone(definition.seed ?? []) as StoreRecord[];
        data[resource] = seed;
        totalRecords += seed.length;
        initIdCounter(resource, seed);
      }
    }

    store.loadAll(data);
    log.success(
      `Seeded ${Object.keys(data).length} resources (${totalRecords} total records)`,
    );

    // Persist initial seed
    persistence.saveSync(store.snapshot());
    log.success(`Persisting to ${persistence.getPath()}`);
  }
}
