import { renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { BASELINE_FILENAME } from '@/baseline/BASELINE_FILENAME.js'
import type { BaselineFile } from '@/baseline/BaselineFile.js'

/** Writes the baseline atomically: a temporary file, then a rename over the target. */
export const writeBaseline = (root: string, baseline: BaselineFile): void => {
  const path = join(root, BASELINE_FILENAME)
  const document = {
    schemaVersion: 1,
    toolVersion: baseline.toolVersion,
    entries: [...baseline.entries].sort(),
  }
  writeFileSync(`${path}.tmp`, `${JSON.stringify(document, null, 2)}\n`)
  renameSync(`${path}.tmp`, path)
}
