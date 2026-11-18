/**
 * Fully-resolved server configuration types (no optionals).
 */

import type { ServerConfig, Resource, CustomRoute } from './config.js';

export interface ResolvedConfig {
  configPath: string;
  server: ServerConfig;
  resources: Record<string, Resource>;
  routes: Record<string, CustomRoute>;
}

export interface ResourceInfo {
  name: string;
  recordCount: number;
  methods: string[];
}
