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
