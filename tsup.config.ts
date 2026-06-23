import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      'bot/index': 'src/bot/index.ts',
      'cdn/index': 'src/cdn/index.ts',
      'dev/index': 'src/dev/index.ts',
      'core/index': 'src/core/index.ts',
      'server/index': 'src/server/index.ts',
      'hooks/index': 'src/hooks/index.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    external: ['react', 'react-dom', 'node:crypto', 'crypto'],
    clean: true,
    treeshake: true,
    target: 'es2017',
  },
  {
    entry: { 'browser.iife': 'src/browser.ts' },
    format: ['iife'],
    globalName: 'TgKit',
    dts: false,
    clean: false,
    treeshake: true,
    target: 'es2017',
    minify: true,
  },
]);
