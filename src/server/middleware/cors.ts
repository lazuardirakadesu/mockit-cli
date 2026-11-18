/**
 * Permissive CORS middleware for local development.
 * Allows all origins, methods, and common headers.
 */

import type { MiddlewareHandler } from 'hono';

export function corsMiddleware(): MiddlewareHandler {
  return async (c, next) => {
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    c.header(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With',
    );
    c.header('Access-Control-Expose-Headers', 'X-Total-Count, Link');

    if (c.req.method === 'OPTIONS') {
      return c.body(null, 204);
    }

    await next();
  };
}
