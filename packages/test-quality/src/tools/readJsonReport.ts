import { readFileSync } from 'node:fs'

import type { VitestJsonReport } from '@/model/VitestJsonReport.js'

/** vitest's JSON report, or null when the run never wrote one. */
export const readJsonReport = (path: string): VitestJsonReport | null => {
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as VitestJsonReport
  } catch {
    return null
  }
}
