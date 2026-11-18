import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['bin/mockit.ts'],
    format: ['cjs'],
    outDir: 'dist/bin',
    clean: true,
    splitting: false,
    sourcemap: true,
    target: 'node18',
    noExternal: [/(.*)/],
    banner: {
      js: '#!/usr/bin/env node',
    },
  },
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    outDir: 'dist',
    dts: true,
    splitting: false,
    sourcemap: true,
    target: 'node18',
  },
]);
