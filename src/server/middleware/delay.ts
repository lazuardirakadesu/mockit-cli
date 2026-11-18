/**
 * Simulates network latency by delaying every request.
 */

import type { MiddlewareHandler } from 'hono';

export function delayMiddleware(ms: number): MiddlewareHandler {
  if (ms <= 0) {
    return async (_c, next) => next();
  }

  return async (_c, next) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    await next();
  };
}
