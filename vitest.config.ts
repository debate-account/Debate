import { defineConfig } from 'vitest/config';
import path from 'path';

// Unit tests over the pure logic in lib/. Node environment, no DOM needed.
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  test: {
    include: ['lib/**/*.test.ts'],
    environment: 'node',
  },
});
