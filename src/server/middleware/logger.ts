/**
 * Color-coded request/response logger middleware.
 * Logs: METHOD /path → STATUS (Xms)
 */

import type { MiddlewareHandler } from 'hono';
import { colorMethod, colorStatus } from '../../utils/logger.js';
import pc from 'picocolors';

export function requestLogger(): MiddlewareHandler {
  return async (c, next) => {
    const start = performance.now();
    await next();
    const duration = (performance.now() - start).toFixed(1);
    const method = colorMethod(c.req.method.padEnd(7));
    const reqPath = c.req.path;
    const status = colorStatus(c.res.status);
    console.log(
      `  ${method} ${reqPath} ${pc.gray('→')} ${status} ${pc.gray(`(${duration}ms)`)}`,
    );
  };
}
