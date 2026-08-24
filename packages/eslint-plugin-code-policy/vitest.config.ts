import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

// Tests import rules via the same NodeNext-style aliases the source uses
// (`@/rules/x.js`, `@tests/utils/y.js`). Vitest does not read tsconfig `paths`,
// so map them here, rewriting the emitted `.js` specifier back to the `.ts` source.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        // Declarative wiring with no branches of its own: the public barrel,
        // the version constant, and the shipped flat-config presets.
        'src/index.ts',
        'src/version.ts',
        'src/configs/**',
        // Deprecated and off in the recommended config: both are superseded by
        // narrower rules and are kept only so a consumer who enabled them
        // directly is not broken. Gating coverage on them would measure code
        // that is no longer the supported surface.
        'src/rules/atomic-file.ts',
        'src/rules/no-inline-types.ts',
      ],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
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
