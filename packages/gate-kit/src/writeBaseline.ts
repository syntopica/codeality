import { renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import type { BaselineFile } from './BaselineFile.js'

/** Writes the baseline atomically: a temporary file, then a rename over the target. */
export const writeBaseline = (
  root: string,
  filename: string,
  baseline: BaselineFile,
): void => {
  const path = join(root, filename)
  const document = {
    schemaVersion: 1,
    toolVersion: baseline.toolVersion,
    entries: [...baseline.entries].sort(),
  }
  writeFileSync(`${path}.tmp`, `${JSON.stringify(document, null, 2)}\n`)
  renameSync(`${path}.tmp`, path)
}
