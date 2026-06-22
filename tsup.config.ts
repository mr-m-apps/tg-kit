import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'bot/index': 'src/bot/index.ts',
    'cdn/index': 'src/cdn/index.ts',
    'dev/index': 'src/dev/index.ts',
    'core/index': 'src/core/index.ts',
    browser: 'src/browser.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  external: ['react', 'react-dom'],
  clean: true,
  treeshake: true,
  target: 'es2017',
});
