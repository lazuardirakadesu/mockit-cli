/**
 * Debounced JSON file persistence.
 * Uses atomic write (tmp file + rename) to prevent corruption.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { StoreData } from '../types/store.js';
import { log } from '../utils/logger.js';

export class Persistence {
  private dbPath: string;
  private timer: NodeJS.Timeout | null = null;
  private debounceMs: number;

  constructor(dbPath: string, debounceMs = 300) {
    this.dbPath = path.resolve(dbPath);
    this.debounceMs = debounceMs;
  }

  exists(): boolean {
    return fs.existsSync(this.dbPath);
  }

  load(): StoreData {
    try {
      const content = fs.readFileSync(this.dbPath, 'utf-8');
      return JSON.parse(content) as StoreData;
    } catch (err) {
      log.warn(`Failed to load ${this.dbPath}: ${(err as Error).message}`);
      return {};
    }
  }

  scheduleSave(getData: () => StoreData): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.saveSync(getData());
    }, this.debounceMs);
  }

  saveSync(data: StoreData): void {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tmpPath = this.dbPath + '.tmp';
      fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpPath, this.dbPath);
    } catch (err) {
      log.error(`Failed to save ${this.dbPath}: ${(err as Error).message}`);
    }
  }

  flush(getData: () => StoreData): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.saveSync(getData());
  }

  delete(): void {
    if (fs.existsSync(this.dbPath)) {
      fs.unlinkSync(this.dbPath);
    }
  }

  getPath(): string {
    return this.dbPath;
  }
}
