/**
 * fs.watch-based config file watcher with debounce.
 */

import fs from 'node:fs';
import { log } from '../utils/logger.js';

export function watchConfigFile(
  filePath: string,
  onChange: () => void,
  debounceMs = 500,
): fs.FSWatcher {
  let timeout: NodeJS.Timeout | null = null;

  const watcher = fs.watch(filePath, (eventType) => {
    if (eventType === 'change') {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        log.info('Config file changed, reloading...');
        onChange();
      }, debounceMs);
    }
  });

  watcher.on('error', (err) => {
    log.warn(`File watcher error: ${err.message}`);
  });

  return watcher;
}
