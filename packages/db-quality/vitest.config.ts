import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

// Tests import source through the same `@/x.js` specifiers the source uses.
// Vitest does not read tsconfig `paths`, so the alias maps them here and
// rewrites the emitted `.js` back to the `.ts` file.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // The argv entry and the real spawn are exercised by the integration
      // tests rather than measured; PascalCase files hold types or constants
      // and have no branches to cover.
      exclude: ['src/cli.ts', 'src/tools/spawnRunner.ts', 'src/**/[A-Z]*.ts'],
      thresholds: { lines: 85, functions: 85, branches: 80, statements: 85 },
    },
  },
  resolve: {
    alias: [
      {
        find: /^@tests\/(.*)\.js$/,
        replacement: fileURLToPath(new URL('./tests/$1.ts', import.meta.url)),
      },
      {
        find: /^@\/(.*)\.js$/,
        replacement: fileURLToPath(new URL('./src/$1.ts', import.meta.url)),
      },
    ],
  },
})
