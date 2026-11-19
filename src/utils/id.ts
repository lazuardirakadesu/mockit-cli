/**
 * Per-resource auto-incrementing ID generator.
 * Tracks the max ID seen per resource to avoid collisions.
 */

import type { StoreRecord } from '../types/store.js';

const counters = new Map<string, number>();

export function initIdCounter(resource: string, records: StoreRecord[]): void {
  let maxId = 0;
  for (const record of records) {
    const id = typeof record.id === 'number' ? record.id : 0;
    if (id > maxId) maxId = id;
  }
  counters.set(resource, maxId);
}

export function nextId(resource: string): number {
  const current = counters.get(resource) ?? 0;
  const next = current + 1;
  counters.set(resource, next);
  return next;
}

export function removeIdCounter(resource: string): void {
  counters.delete(resource);
}

export function resetIdCounters(): void {
  counters.clear();
}
