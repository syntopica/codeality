import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { STATE_DIR } from '@/config/STATE_DIR.js'

/** Appends the state directory to `.gitignore` unless a line already names it. */
export const ensureGitignored = (root: string): boolean => {
  const path = join(root, '.gitignore')
  const current = existsSync(path) ? readFileSync(path, 'utf8') : ''
  const lines = current
    .split('\n')
    .map((line) => line.trim().replace(/\/$/, ''))
  if (lines.includes(STATE_DIR) || lines.includes(`/${STATE_DIR}`)) return false
  const separator = current === '' || current.endsWith('\n') ? '' : '\n'
  writeFileSync(path, `${current}${separator}/${STATE_DIR}/\n`)
  return true
}
