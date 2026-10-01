import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import type { BaselineFile } from './BaselineFile.js'
import { ConfigError } from './ConfigError.js'

/** Reads `filename` under `root`; `tool` names the CLI that creates it. */
export const readBaseline = (
  root: string,
  filename: string,
  tool: string,
): BaselineFile => {
  const path = join(root, filename)
  if (!existsSync(path)) {
    throw new ConfigError(
      `${filename} not found; run "${tool} baseline create"`,
    )
  }
  const document = JSON.parse(
    readFileSync(path, 'utf8'),
  ) as Partial<BaselineFile>
  if (document.schemaVersion !== 1 || !Array.isArray(document.entries)) {
    throw new ConfigError(`${filename} is not a version 1 baseline`)
  }
  return {
    schemaVersion: 1,
    toolVersion: document.toolVersion ?? '',
    entries: [...document.entries].sort(),
  }
}
