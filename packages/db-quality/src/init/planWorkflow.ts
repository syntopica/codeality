import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { assetPath } from '@/assetPath.js'
import type { ManagedFile } from '@/init/ManagedFile.js'

export const planWorkflow = (root: string, force: boolean): ManagedFile => {
  const relative = '.github/workflows/db-quality.yml'
  const content = readFileSync(assetPath('db-quality.yml'), 'utf8')
  const path = join(root, relative)
  if (!existsSync(path)) {
    const detail = 'runs codeality-db gate on push and pull request'
    return { path: relative, disposition: 'create', detail, content }
  }
  if (readFileSync(path, 'utf8') === content) {
    return { path: relative, disposition: 'unchanged', detail: 'identical' }
  }
  return force
    ? {
        path: relative,
        disposition: 'merge',
        detail: 'replaced (--force)',
        content,
      }
    : {
        path: relative,
        disposition: 'conflict',
        detail: 'differs from the shipped workflow',
      }
}
