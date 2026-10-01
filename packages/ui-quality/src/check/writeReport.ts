import { mkdirSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import type { CheckResult } from '@/check/CheckResult.js'
import { STATE_DIR } from '@/config/STATE_DIR.js'

/** `.codeality-ui/report.json`: what the review skill reads alongside the screenshots. */
export const writeReport = (root: string, result: CheckResult): string => {
  const dir = join(root, STATE_DIR)
  mkdirSync(dir, { recursive: true })
  const path = join(dir, 'report.json')
  writeFileSync(`${path}.tmp`, `${JSON.stringify(result, null, 2)}\n`)
  renameSync(`${path}.tmp`, path)
  return path
}
