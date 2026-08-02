import type { KnipConfig } from 'knip'

import { FRAMEWORK_ENTRIES, type KnipFramework } from './knip-framework'

// Every template installs these as peer dependencies of
// @busirocket/eslint-config: the config factories (base.ts and friends)
// `import` them by bare specifier, and pnpm's isolated node_modules needs
// each consumer to declare them directly for that import to resolve. No
// template file ever imports these packages itself (they only import from
// '@busirocket/eslint-config/*'), so knip can't see the real caller and
// reports them as unused. Mirrors the same list and rationale in the
// repo-root knip.config.ts for the `templates/*` workspace.
const ESLINT_PEER_DEPENDENCIES = [
  '@eslint/js',
  'eslint-config-prettier',
  'eslint-plugin-promise',
  'eslint-plugin-security',
  'eslint-plugin-unused-imports',
  'typescript-eslint',
]

/**
 * Knip configuration for a baseline template.
 *
 * Rules that block: unused files, unused exports and exported types, declared
 * dependencies nobody imports, and imports of undeclared dependencies. Those
 * are the four findings a reviewer cannot see in a diff.
 *
 * `binaries` and `unresolved` stay non-blocking: pnpm script indirection and
 * Turbo produce false positives on both.
 */
export const createKnipConfig = (options: {
  framework: KnipFramework
}): KnipConfig => {
  const { entry, project } = FRAMEWORK_ENTRIES[options.framework]

  return {
    entry,
    project,
    ignoreBinaries: ['turbo', 'lhci'],
    ignoreDependencies: ESLINT_PEER_DEPENDENCIES,
    rules: {
      files: 'error',
      dependencies: 'error',
      devDependencies: 'error',
      unlisted: 'error',
      exports: 'error',
      types: 'error',
      duplicates: 'error',
      binaries: 'warn',
      unresolved: 'warn',
    },
  }
}
