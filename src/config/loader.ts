/**
 * Config file discovery, parsing (JSON/YAML), validation,
 * and resolution (merge CLI flags → config → defaults).
 */

import fs from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { MockConfig } from '../types/config.js';
import type { ResolvedConfig } from '../types/server.js';
import { DEFAULT_SERVER_CONFIG, DEFAULT_CONFIG_FILES } from './defaults.js';

export function findConfigFile(configPath?: string): string {
  if (configPath) {
    const resolved = path.resolve(configPath);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Config file not found: ${resolved}`);
    }
    return resolved;
  }

  for (const name of DEFAULT_CONFIG_FILES) {
    const filePath = path.resolve(process.cwd(), name);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }

  throw new Error(
    `No config file found. Create one of: ${DEFAULT_CONFIG_FILES.join(', ')}\n` +
      `Or specify a path with --config <path>`,
  );
}

export function loadConfigFile(filePath: string): MockConfig {
  const content = fs.readFileSync(filePath, 'utf-8');
  const ext = path.extname(filePath).toLowerCase();

  let raw: unknown;
  if (ext === '.yaml' || ext === '.yml') {
    raw = parseYaml(content);
  } else {
    raw = JSON.parse(content);
  }

  return validateConfig(raw);
}

function validateConfig(raw: unknown): MockConfig {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Config must be a JSON/YAML object');
  }

  const config = raw as Record<string, unknown>;

  if (!config.resources && !config.routes) {
    throw new Error('Config must define at least "resources" or "routes"');
  }

  if (config.server !== undefined && typeof config.server !== 'object') {
    throw new Error('"server" must be an object');
  }

  if (config.resources !== undefined && typeof config.resources !== 'object') {
    throw new Error('"resources" must be an object');
  }

  if (config.routes !== undefined && typeof config.routes !== 'object') {
    throw new Error('"routes" must be an object');
  }

  // Validate server.errorRate range
  const server = config.server as Record<string, unknown> | undefined;
  if (server?.errorRate !== undefined) {
    const rate = server.errorRate as number;
    if (typeof rate !== 'number' || rate < 0 || rate > 100) {
      throw new Error('"server.errorRate" must be a number between 0 and 100');
    }
  }

  return config as MockConfig;
}

export interface CLIOverrides {
  port?: number;
  host?: string;
  delay?: number;
  errorRate?: number;
  ui?: boolean;
}

export function resolveConfig(
  configPath: string,
  config: MockConfig,
  overrides: CLIOverrides = {},
): ResolvedConfig {
  const server = {
    ...DEFAULT_SERVER_CONFIG,
    ...config.server,
    ...(overrides.port !== undefined && { port: overrides.port }),
    ...(overrides.host !== undefined && { host: overrides.host }),
    ...(overrides.delay !== undefined && { delay: overrides.delay }),
    ...(overrides.errorRate !== undefined && { errorRate: overrides.errorRate }),
    ...(overrides.ui !== undefined && { ui: overrides.ui }),
  };

  return {
    configPath,
    server,
    resources: config.resources ?? {},
    routes: config.routes ?? {},
  };
}
