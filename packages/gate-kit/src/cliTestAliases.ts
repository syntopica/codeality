import { join } from 'node:path'

/**
 * Vitest aliases for a gate CLI's tests, which import source through the same
 * `@/x.js` specifiers the source uses (and helpers through `@tests/x.js`).
 * Vitest does not read tsconfig `paths`, so these map them and rewrite the
 * emitted `.js` back to the `.ts` file.
 */
export const cliTestAliases = (
  packageDir: string,
): { find: RegExp; replacement: string }[] => [
  { find: /^@tests\/(.*)\.js$/, replacement: join(packageDir, 'tests/$1.ts') },
  { find: /^@\/(.*)\.js$/, replacement: join(packageDir, 'src/$1.ts') },
]
