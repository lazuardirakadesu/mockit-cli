/**
 * CLI command definitions using Commander.
 * Defines `mockit start` and `mockit reset` commands.
 */

import { Command } from 'commander';
import {
  findConfigFile,
  loadConfigFile,
  resolveConfig,
} from '../config/loader.js';
import { watchConfigFile } from '../config/watcher.js';
import { DataStore } from '../db/store.js';
import { Persistence } from '../db/persistence.js';
import { seedStore } from '../db/seed.js';
import { createServer } from '../server/index.js';
import { printBanner } from './banner.js';
import { log } from '../utils/logger.js';
import { DEFAULT_DB_FILE } from '../config/defaults.js';
import type { CLIOptions } from './options.js';

export function createCLI(): Command {
  const program = new Command();

  program
    .name('mockit')
    .description('⚡ Zero-config stateful mock API server')
    .version('0.1.0');

  // ── mockit start ───────────────────────────────────────────────────
  program
    .command('start')
    .description('Start the mock API server')
    .option('-c, --config <path>', 'Path to config file')
    .option('-p, --port <number>', 'Server port', parseInt)
    .option('-H, --host <host>', 'Server host')
    .option('-d, --delay <ms>', 'Simulated latency in ms', parseInt)
    .option(
      '-e, --error-rate <percent>',
      'Random error rate 0-100 (chaos mode)',
      parseInt,
    )
    .option('-w, --watch', 'Watch config file for changes', false)
    .option('--db-file <path>', 'Path to persistence file', DEFAULT_DB_FILE)
    .action(async (opts: CLIOptions) => {
      try {
        await startServer(opts);
      } catch (err) {
        log.error((err as Error).message);
        process.exit(1);
      }
    });

  // ── mockit reset ───────────────────────────────────────────────────
  program
    .command('reset')
    .description('Reset persisted data back to seed data')
    .option('--db-file <path>', 'Path to persistence file', DEFAULT_DB_FILE)
    .action((opts: { dbFile: string }) => {
      const persistence = new Persistence(opts.dbFile);
      if (persistence.exists()) {
        persistence.delete();
        log.success(
          'Deleted persisted data. Next start will re-seed from config.',
        );
      } else {
        log.info('No persisted data found.');
      }
    });

  return program;
}

async function startServer(opts: CLIOptions): Promise<void> {
  // 1. Load & resolve config
  const configPath = findConfigFile(opts.config);
  log.success(`Loaded config from ${configPath}`);

  const rawConfig = loadConfigFile(configPath);
  const config = resolveConfig(configPath, rawConfig, {
    port: opts.port,
    host: opts.host,
    delay: opts.delay,
    errorRate: opts.errorRate,
  });

  // 2. Initialize store & persistence
  const store = new DataStore();
  const persistence = new Persistence(opts.dbFile ?? DEFAULT_DB_FILE);
  seedStore(store, persistence, rawConfig);

  // 3. Start HTTP server
  const serverInstance = createServer(config, store, persistence);

  // 4. Print startup banner
  printBanner(
    config,
    serverInstance.resourceInfos,
    Object.keys(config.routes).length,
  );

  // 5. Watch mode
  if (opts.watch) {
    watchConfigFile(configPath, () => {
      try {
        loadConfigFile(configPath);
        log.success('Config reloaded successfully');
        log.info(
          'Note: Restart server to apply route changes (hot-reload coming in v0.2)',
        );
      } catch (err) {
        log.error(`Config reload failed: ${(err as Error).message}`);
      }
    });
    log.info(`Watching ${configPath} for changes`);
  }

  // 6. Graceful shutdown
  const shutdown = () => {
    console.log('');
    log.info('Shutting down...');
    serverInstance.close();
    log.success('Server stopped. Data persisted.');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
