/**
 * Chaos mode: randomly returns 500 errors to test frontend error handling.
 */

import type { MiddlewareHandler } from 'hono';

export function chaosMiddleware(errorRate: number): MiddlewareHandler {
  if (errorRate <= 0) {
    return async (_c, next) => next();
  }

  return async (c, next) => {
    if (Math.random() * 100 < errorRate) {
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
