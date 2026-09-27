/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import pkg from './package.json';

export default defineConfig({
  base: '/',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  build: {
    rollupOptions: {
      input: {
        en: 'en/planner/index.html',
        pl: 'pl/planner/index.html',
        de: 'de/planner/index.html',
        it: 'it/planner/index.html',
      },
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['src/test/setup.ts'],
  },
});
