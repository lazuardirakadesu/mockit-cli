/**
 * Public API for programmatic usage.
 * Re-exports core types and classes for library consumers.
 */

export { createCLI } from './cli/index.js';
export { DataStore } from './db/store.js';
export { Persistence } from './db/persistence.js';
export { createServer, createApp } from './server/index.js';

export type {
  MockConfig,
  Resource,
  FieldRule,
  CustomRoute,
  ServerConfig,
  ResourceOptions,
} from './types/config.js';

export type { ResolvedConfig, ResourceInfo } from './types/server.js';

export type {
  StoreRecord,
  StoreData,
  QueryOptions,
  PaginatedResult,
} from './types/store.js';
