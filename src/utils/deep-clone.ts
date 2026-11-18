/**
 * Deep clone utility using the native structuredClone API (Node 17+).
 */

export function deepClone<T>(value: T): T {
  return structuredClone(value);
}
