import type { KnipConfig } from 'knip'

import { FRAMEWORK_ENTRIES, type KnipFramework } from './knip-framework'

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
