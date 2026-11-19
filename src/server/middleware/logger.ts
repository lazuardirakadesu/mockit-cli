/**
 * Color-coded request/response logger middleware with ring buffer for Studio.
 * Logs: METHOD /path → STATUS (Xms)
 */

import type { MiddlewareHandler } from 'hono';
import type { RequestLog } from '../../types/server.js';
import { colorMethod, colorStatus } from '../../utils/logger.js';
import pc from 'picocolors';

export class RequestLogBuffer {
  private logs: RequestLog[] = [];
  private maxLogs: number;
  private counter = 0;

  constructor(maxLogs = 100) {
    this.maxLogs = maxLogs;
  }

  add(log: RequestLog): void {
    this.logs.unshift(log); // latest first
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
  }

  getAll(): RequestLog[] {
    return [...this.logs];
  }

  clear(): void {
    this.logs = [];
  }

  nextId(): string {
    this.counter += 1;
    return `${Date.now()}-${this.counter}`;
  }
}

export function requestLogger(buffer?: RequestLogBuffer): MiddlewareHandler {
  return async (c, next) => {
    const start = performance.now();
    await next();
    const durationNum = parseFloat((performance.now() - start).toFixed(1));
    const duration = durationNum.toFixed(1);
    const method = colorMethod(c.req.method.padEnd(7));
    const reqPath = c.req.path;
    const status = colorStatus(c.res.status);

    console.log(
      `  ${method} ${reqPath} ${pc.gray('→')} ${status} ${pc.gray(`(${duration}ms)`)}`,
    );

    // Record into ring buffer for mock APIs (exclude internal studio assets & state polling to avoid noise)
    if (buffer && !reqPath.startsWith('/_studio') && reqPath !== '/_api/studio/state') {
      buffer.add({
        id: buffer.nextId(),
        timestamp: Date.now(),
        method: c.req.method,
        path: reqPath,
        status: c.res.status,
        duration: durationNum,
      });
    }
  };
}
