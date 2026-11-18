/**
 * CLI entry point. Invoked by `npx mockit` or `tsx bin/mockit.ts`.
 */

import { createCLI } from '../src/cli/index.js';

const program = createCLI();
program.parse();
