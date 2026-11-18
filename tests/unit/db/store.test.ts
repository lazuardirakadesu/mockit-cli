import { describe, it, expect, beforeEach } from 'vitest';
import { DataStore } from '../../../src/db/store.js';

describe('DataStore', () => {
  let store: DataStore;

  beforeEach(() => {
    store = new DataStore();
    store.loadAll({
      users: [
        { id: 1, name: 'Alice', role: 'admin', age: 30 },
        { id: 2, name: 'Bob', role: 'user', age: 25 },
        { id: 3, name: 'Charlie', role: 'user', age: 35 },
      ],
    });
  });

  it('retrieves all records for a resource', () => {
    const records = store.getAll('users');
    expect(records).toHaveLength(3);
  });

  it('finds a record by id', () => {
    const record = store.findById('users', 2);
    expect(record).toBeDefined();
    expect(record?.name).toBe('Bob');
  });

  it('inserts a new record', () => {
    const inserted = store.insert('users', { id: 4, name: 'Dave', role: 'guest' });
    expect(inserted.id).toBe(4);
    expect(store.getAll('users')).toHaveLength(4);
  });

  it('updates a record with full replacement (PUT)', () => {
    const updated = store.update('users', 1, { name: 'Alice New' }, false);
    expect(updated).toEqual({ id: 1, name: 'Alice New' });
    expect(updated?.role).toBeUndefined();
  });

  it('updates a record with partial merge (PATCH)', () => {
    const updated = store.update('users', 2, { role: 'admin' }, true);
    expect(updated?.name).toBe('Bob');
    expect(updated?.role).toBe('admin');
  });

  it('removes a record by id', () => {
    const removed = store.remove('users', 2);
    expect(removed?.id).toBe(2);
    expect(store.getAll('users')).toHaveLength(2);
    expect(store.findById('users', 2)).toBeUndefined();
  });

  it('supports pagination in query()', () => {
    const result = store.query('users', { page: 1, limit: 2 });
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(3);
    expect(result.totalPages).toBe(2);
    expect(result.data[0].id).toBe(1);
    expect(result.data[1].id).toBe(2);
  });

  it('supports sorting in query()', () => {
    const result = store.query('users', { sort: 'age', order: 'desc' });
    expect(result.data[0].name).toBe('Charlie');
    expect(result.data[1].name).toBe('Alice');
    expect(result.data[2].name).toBe('Bob');
  });

  it('supports exact filter in query()', () => {
    const result = store.query('users', { filters: { role: 'user' } });
    expect(result.data).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('supports full-text search in query()', () => {
    const result = store.query('users', { search: 'li' }); // matches Alice and Charlie
    expect(result.data).toHaveLength(2);
  });
});
