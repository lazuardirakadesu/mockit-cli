/**
 * Colorful, developer-friendly console logging helpers.
 */

import pc from 'picocolors';

export const log = {
  info: (msg: string) => console.log(`${pc.cyan('ℹ')} ${msg}`),
  success: (msg: string) => console.log(`${pc.green('✔')} ${msg}`),
  warn: (msg: string) => console.log(`${pc.yellow('⚠')} ${msg}`),
  error: (msg: string) => console.error(`${pc.red('✖')} ${msg}`),
  debug: (msg: string) => {
    if (process.env.DEBUG) console.log(`${pc.gray('⋯')} ${msg}`);
  },
};

export function colorMethod(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return pc.green(method);
    case 'POST':
      return pc.yellow(method);
    case 'PUT':
      return pc.blue(method);
    case 'PATCH':
      return pc.magenta(method);
    case 'DELETE':
      return pc.red(method);
    default:
      return pc.white(method);
  }
}

export function colorStatus(status: number): string {
  if (status < 300) return pc.green(String(status));
  if (status < 400) return pc.cyan(String(status));
  if (status < 500) return pc.yellow(String(status));
  return pc.red(String(status));
}
