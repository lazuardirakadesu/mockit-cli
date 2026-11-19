/**
 * Simulates network latency by delaying every request.
 * Supports static number or dynamic getter function.
 * Skips internal studio endpoints (/_*).
 */

import type { MiddlewareHandler } from 'hono';

export function delayMiddleware(delay: number | (() => number)): MiddlewareHandler {
  return async (c, next) => {
    // Skip internal studio requests
    if (c.req.path.startsWith('/_')) {
      return next();
    }

    const ms = typeof delay === 'function' ? delay() : delay;
    if (ms > 0) {
      await new Promise((resolve) => setTimeout(resolve, ms));
    }
    await next();
  };
}
