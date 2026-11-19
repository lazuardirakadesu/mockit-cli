/**
 * Startup banner and endpoint table printer.
 * Renders a pretty summary of all registered routes on boot.
 */

import pc from 'picocolors';
import type { ResolvedConfig } from '../types/server.js';
import type { ResourceInfo } from '../types/server.js';

export function printBanner(
  config: ResolvedConfig,
  resourceInfos: ResourceInfo[],
  customRouteCount: number,
): void {
  console.log('');
  console.log(
    pc.bold(pc.cyan('  ⚡ MockIt')) + pc.gray(' v2.0.0'),
  );
  console.log(pc.gray('  Stateful Mock API Server'));
  console.log('');

  // ── Endpoint table ─────────────────────────────────────────────────
  if (resourceInfos.length > 0 || customRouteCount > 0) {
    const colMethod = 8;
    const colEndpoint = 32;
    const colRecords = 12;
    const divider = `${'─'.repeat(colMethod)}┬${'─'.repeat(colEndpoint)}┬${'─'.repeat(colRecords)}`;
    const divMid = `${'─'.repeat(colMethod)}┼${'─'.repeat(colEndpoint)}┼${'─'.repeat(colRecords)}`;
    const divEnd = `${'─'.repeat(colMethod)}┴${'─'.repeat(colEndpoint)}┴${'─'.repeat(colRecords)}`;

    console.log(pc.gray(`  ┌${divider}┐`));
    console.log(
      pc.gray('  │') +
        pc.bold(' Method'.padEnd(colMethod)) +
        pc.gray('│') +
        pc.bold(' Endpoint'.padEnd(colEndpoint)) +
        pc.gray('│') +
        pc.bold(' Records'.padEnd(colRecords)) +
        pc.gray('│'),
    );
    console.log(pc.gray(`  ├${divMid}┤`));

    for (const info of resourceInfos) {
      const method = ` ${pc.green('CRUD')}`.padEnd(colMethod + 10); // +10 for ANSI codes
      const endpoint = ` /api/${info.name}`.padEnd(colEndpoint);
      const records = ` ${info.recordCount} seeded`.padEnd(colRecords);
      console.log(
        pc.gray('  │') + method + pc.gray('│') + endpoint + pc.gray('│') + records + pc.gray('│'),
      );
    }

    // Custom routes
    for (const [routeKey] of Object.entries(config.routes)) {
      const spaceIndex = routeKey.indexOf(' ');
      if (spaceIndex === -1) continue;
      const method = routeKey.slice(0, spaceIndex);
      const routePath = routeKey.slice(spaceIndex + 1);
      const coloredMethod = ` ${colorMethodStr(method)}`.padEnd(colMethod + 10);
      const endpoint = ` ${routePath}`.padEnd(colEndpoint);
      const records = ` ${pc.gray('custom')}`.padEnd(colRecords + 10);
      console.log(
        pc.gray('  │') + coloredMethod + pc.gray('│') + endpoint + pc.gray('│') + records + pc.gray('│'),
      );
    }

    console.log(pc.gray(`  └${divEnd}┘`));
    console.log('');
  }

  // ── Server info ────────────────────────────────────────────────────
  const url = `http://${config.server.host}:${config.server.port}`;
  console.log(`  ${pc.green('🚀')} Server running at ${pc.bold(pc.underline(url))}`);

  if (config.server.ui !== false) {
    const studioUrl = `http://${config.server.host}:${config.server.port}/_studio`;
    console.log(`  ${pc.magenta('✦')}  Web Studio: ${pc.cyan(pc.underline(studioUrl))}`);
  }

  if (config.server.delay > 0) {
    console.log(`  ${pc.yellow('⏱')}  Delay: ${config.server.delay}ms`);
  }
  if (config.server.errorRate > 0) {
    console.log(`  ${pc.red('💥')} Error rate: ${config.server.errorRate}%`);
  }

  console.log('');
}

function colorMethodStr(method: string): string {
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
