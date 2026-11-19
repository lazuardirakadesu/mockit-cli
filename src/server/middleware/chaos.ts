/**
 * Chaos mode: randomly returns 500 errors to test frontend error handling.
 * Supports static number or dynamic getter function.
 * Skips internal studio endpoints (/_*).
 */

import type { MiddlewareHandler } from 'hono';

export function chaosMiddleware(errorRate: number | (() => number)): MiddlewareHandler {
  return async (c, next) => {
    // Skip internal studio requests
    if (c.req.path.startsWith('/_')) {
      return next();
    }

    const rate = typeof errorRate === 'function' ? errorRate() : errorRate;
    if (rate > 0 && Math.random() * 100 < rate) {
      return c.json(
        {
          error: 'Internal Server Error',
          message: '💥 Chaos Mode: Random failure triggered by --error-rate',
          chaos: true,
        },
        500,
      );
    }
    await next();
  };
}
