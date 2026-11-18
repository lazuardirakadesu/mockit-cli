import { describe, it, expect } from 'vitest';
import { parseQuery } from '../../../src/utils/query-parser.js';

describe('parseQuery', () => {
  it('parses pagination parameters correctly', () => {
    const params = new URLSearchParams('_page=2&_limit=15');
    const result = parseQuery(params);

    expect(result.page).toBe(2);
    expect(result.limit).toBe(15);
  });

  it('parses sorting and ordering', () => {
    const params = new URLSearchParams('_sort=price&_order=desc');
    const result = parseQuery(params);

    expect(result.sort).toBe('price');
    expect(result.order).toBe('desc');
  });

  it('parses search parameter', () => {
    const params = new URLSearchParams('_search=keyboard');
    const result = parseQuery(params);

    expect(result.search).toBe('keyboard');
  });

  it('separates custom field filters from reserved parameters', () => {
    const params = new URLSearchParams('role=admin&active=true&_page=1&_limit=10');
    const result = parseQuery(params);

    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.filters).toEqual({
      role: 'admin',
      active: 'true',
    });
  });

  it('returns undefined for omitted query options', () => {
    const params = new URLSearchParams('');
    const result = parseQuery(params);

    expect(result.page).toBeUndefined();
    expect(result.limit).toBeUndefined();
    expect(result.sort).toBeUndefined();
    expect(result.order).toBeUndefined();
    expect(result.search).toBeUndefined();
    expect(result.filters).toBeUndefined();
  });
});
