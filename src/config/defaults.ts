/**
 * Hardcoded default values for all configurable options.
 */

import type { ServerConfig } from '../types/config.js';

export const DEFAULT_SERVER_CONFIG: ServerConfig = {
  port: 3210,
  host: 'localhost',
  cors: true,
  delay: 0,
  errorRate: 0,
  ui: true,
};

export const DEFAULT_PAGE_SIZE = 20;

export const DEFAULT_CONFIG_FILES = [
  'mock.config.json',
  'mock.config.yaml',
  'mock.config.yml',
  'mockit.config.json',
  'mockit.config.yaml',
  'mockit.config.yml',
];

export const DEFAULT_DB_FILE = '.mockdb.json';
