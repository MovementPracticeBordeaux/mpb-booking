import { defineConfig } from 'vitest/config';
import path from 'node:path';

const dirname = path.dirname(new URL(import.meta.url).pathname);

export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', '.next', 'e2e'],
  },
  resolve: {
    alias: {
      '@': dirname,
    },
  },
});
