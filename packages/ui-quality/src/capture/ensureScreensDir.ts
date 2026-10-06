import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

import { STATE_DIR } from '@/config/STATE_DIR.js'

/** The directory screenshots are written to, created when missing. */
export const ensureScreensDir = (root: string): string => {
  const screensDir = join(root, STATE_DIR, 'screens')
  mkdirSync(screensDir, { recursive: true })
  return screensDir
}
