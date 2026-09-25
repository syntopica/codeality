import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { BASELINE_FILENAME } from '@/baseline/BASELINE_FILENAME.js'
import type { BaselineFile } from '@/baseline/BaselineFile.js'
import { ConfigError } from '@/config/ConfigError.js'

export const readBaseline = (root: string): BaselineFile => {
  const path = join(root, BASELINE_FILENAME)
  if (!existsSync(path)) {
    throw new ConfigError(
      `${BASELINE_FILENAME} not found; run "codeality-db baseline create"`,
    )
  }
  const document = JSON.parse(
    readFileSync(path, 'utf8'),
  ) as Partial<BaselineFile>
  if (document.schemaVersion !== 1 || !Array.isArray(document.entries)) {
    throw new ConfigError(`${BASELINE_FILENAME} is not a version 1 baseline`)
  }
  return {
    schemaVersion: 1,
    toolVersion: document.toolVersion ?? '',
    entries: [...document.entries].sort(),
  }
}
