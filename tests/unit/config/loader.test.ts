import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { findConfigFile, loadConfigFile, resolveConfig } from '../../../src/config/loader.js';

describe('Config Loader', () => {
  const fixturePath = path.resolve(
    __dirname,
    '../../../examples/basic/mock.config.json',
  );

  it('finds config file when explicit path is provided', () => {
    const found = findConfigFile(fixturePath);
    expect(found).toBe(fixturePath);
  });

  it('throws error when explicit path does not exist', () => {
    expect(() => findConfigFile('non-existent.json')).toThrow(/not found/);
  });

  it('loads and parses valid JSON config', () => {
    const config = loadConfigFile(fixturePath);
    expect(config.resources).toBeDefined();
    expect(config.resources?.users).toBeDefined();
    expect(config.routes).toBeDefined();
  });

  it('resolves config with default server settings and overrides', () => {
    const raw = loadConfigFile(fixturePath);
    const resolved = resolveConfig(fixturePath, raw, {
      port: 8080,
      delay: 150,
    });

    expect(resolved.server.port).toBe(8080);
    expect(resolved.server.delay).toBe(150);
    expect(resolved.server.host).toBe('localhost'); // default
    expect(resolved.server.cors).toBe(true); // default
  });
});
