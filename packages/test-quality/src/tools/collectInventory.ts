import { execFileSync } from 'node:child_process'
import { execPath } from 'node:process'

import { parseInventory } from '@/inventory/parseInventory.js'
import type { TestFile } from '@/model/TestFile.js'
import { packageAssetPath } from '@/tools/packageAssetPath.js'

/** Asks the project's own vitest which files it runs, where, under what. */
export const collectInventory = (root: string): TestFile[] =>
  parseInventory(
    execFileSync(execPath, [packageAssetPath('vitest-inventory.mjs')], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    }),
  )
