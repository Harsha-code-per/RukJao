/**
 * Build and unit-test config: the React plugin, the dev proxy to the API, and Vitest
 * with enforced coverage thresholds.
 *
 * @see TESTING.md
 */

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:8080' } },
  build: { target: 'es2022', sourcemap: false },
  test: {
    environment: 'jsdom',
    setupFiles: ['tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**', 'server/**', 'shared/**'],
      exclude: ['server/index.ts', 'src/main.tsx'],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
  },
});
