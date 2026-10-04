import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'

import { ConfigError } from '@syntopica/gate-kit/ConfigError'

/**
 * The vitest entry the project itself would run, resolved from its root the
 * way node resolves it, so a monorepo that hoists vitest above the package
 * is measured with the same vitest.
 */
export const resolveVitestBin = (root: string): string => {
  try {
    const manifest = createRequire(resolve(root, 'package.json')).resolve(
      'vitest/package.json',
    )
    return join(dirname(manifest), 'vitest.mjs')
  } catch {
    throw new ConfigError(`vitest is not installed for ${root}`)
  }
}
