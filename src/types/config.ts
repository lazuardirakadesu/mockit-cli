/**
 * Top-level config file schema types.
 * Represents the shape of mock.config.json / mock.config.yaml.
 */

export interface ServerConfig {
  port: number;
  host: string;
  cors: boolean;
  delay: number;
  errorRate: number;
}

export interface FieldRule {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  auto?: boolean;
  unique?: boolean;
  default?: unknown;
  enum?: unknown[];
  min?: number;
  max?: number;
}

export interface ResourceOptions {
  readOnly?: boolean;
  pageSize?: number;
  allowedMethods?: ('GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE')[];
}

export interface Resource {
  seed?: Record<string, unknown>[];
  fields?: Record<string, FieldRule>;
  options?: ResourceOptions;
}

export interface CustomRoute {
  status: number;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface MockConfig {
  server?: Partial<ServerConfig>;
  resources?: Record<string, Resource>;
  routes?: Record<string, CustomRoute>;
}
